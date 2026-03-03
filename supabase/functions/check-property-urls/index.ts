import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Check if a property URL is still live.
 * Returns true if the property page appears to still be published.
 * 
 * Strategy:
 * - HEAD request first (fast), fallback to GET if HEAD fails
 * - 404 / 410 → definitely removed
 * - 200 with redirect to a search/listing page → removed (portal redirects dead links)
 * - 200 on the original domain → still live
 */
async function isUrlLive(url: string): Promise<{ live: boolean; status: number; reason?: string }> {
  try {
    // Use HEAD first for speed
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    // Some sites block HEAD, fallback to GET
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });
    }

    const finalUrl = response.url || url;

    // Clear removals
    if (response.status === 404 || response.status === 410) {
      return { live: false, status: response.status, reason: `HTTP ${response.status}` };
    }

    // Check for portal redirects to search/home pages (common when listing is removed)
    // MeLi redirects to a search page; Zonaprop might redirect to homepage
    if (response.status === 200) {
      const originalDomain = new URL(url).hostname;
      const finalDomain = new URL(finalUrl).hostname;

      // If redirected to a completely different domain, likely removed
      if (finalDomain !== originalDomain && !finalDomain.includes(originalDomain.split('.').slice(-2).join('.'))) {
        return { live: false, status: response.status, reason: "Redirected to different domain" };
      }

      // MeLi: redirects dead listings to search results or 404 page
      if (finalUrl.includes("/listado/") || finalUrl.includes("/buscar/") || finalUrl.includes("/_NoIndex_")) {
        return { live: false, status: response.status, reason: "Redirected to search/listing page" };
      }

      // Zonaprop: redirects to home or search
      if (finalUrl.match(/zonaprop\.com\.ar\/?$/) || finalUrl.includes("/propiedades/")) {
        if (!finalUrl.includes(url.split("/").pop()!.substring(0, 10))) {
          return { live: false, status: response.status, reason: "Redirected to portal homepage" };
        }
      }
    }

    // If we got a 200 and no suspicious redirect, consider it live
    if (response.ok) {
      return { live: true, status: response.status };
    }

    // 3xx without following, 5xx → uncertain, treat as live to avoid false removals
    return { live: true, status: response.status, reason: `Uncertain: HTTP ${response.status}` };
  } catch (error) {
    // Timeout or network error → don't remove, might be temporary
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.warn(`Check failed for ${url}: ${msg}`);
    return { live: true, status: 0, reason: `Error: ${msg}` };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 50; // How many to check per invocation
    const maxAge = body.max_age_days || 7;   // Only check URLs not checked in N days

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - maxAge);

    // Fetch properties that haven't been checked recently
    const { data: properties, error } = await supabase
      .from("properties")
      .select("id, url, external_id, source")
      .eq("status", "active")
      .not("url", "is", null)
      .or(`last_checked_at.is.null,last_checked_at.lt.${cutoff.toISOString()}`)
      .order("last_checked_at", { ascending: true, nullsFirst: true })
      .limit(batchSize);

    if (error) {
      console.error("Error fetching properties:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!properties || properties.length === 0) {
      console.log("No properties to check");
      return new Response(
        JSON.stringify({ success: true, checked: 0, removed: 0, message: "No properties pending check" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Checking ${properties.length} property URLs...`);

    let checked = 0;
    let removed = 0;
    let stillLive = 0;

    // Process sequentially to avoid rate limiting from portals
    for (const prop of properties) {
      if (!prop.url) continue;

      const result = await isUrlLive(prop.url);
      checked++;

      const updateData: Record<string, unknown> = {
        last_checked_at: new Date().toISOString(),
      };

      if (!result.live) {
        updateData.status = "removed";
        updateData.removed_at = new Date().toISOString();
        removed++;
        console.log(`REMOVED: ${prop.external_id} (${prop.source}) — ${result.reason}`);
      } else {
        stillLive++;
      }

      await supabase
        .from("properties")
        .update(updateData)
        .eq("id", prop.id);

      // Small delay between requests to avoid being blocked
      if (checked < properties.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`URL check complete: ${checked} checked, ${removed} removed, ${stillLive} still live`);

    return new Response(
      JSON.stringify({ success: true, checked, removed, still_live: stillLive }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("URL check error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
