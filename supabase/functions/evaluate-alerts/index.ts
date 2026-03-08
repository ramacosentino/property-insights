import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AlertRow {
  id: string;
  user_id: string;
  name: string;
  filters: {
    zones?: string[];
    property_types?: string[];
    price_min?: number;
    price_max?: number;
    price_currency?: string;
  };
  email_enabled: boolean;
  in_app_enabled: boolean;
  email_frequency: string;
  last_evaluated_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();
    let totalNotifications = 0;

    // ─── 1. Evaluate alert filters against new properties ───
    const { data: alerts, error: alertsErr } = await supabase
      .from("alerts")
      .select("*")
      .eq("active", true);

    if (alertsErr) throw alertsErr;

    for (const alert of (alerts || []) as AlertRow[]) {
      const since = alert.last_evaluated_at || new Date(0).toISOString();
      const f = alert.filters || {};

      // Build query for new properties since last evaluation
      let query = supabase
        .from("properties")
        .select("id, title, address, neighborhood, norm_neighborhood, price, currency, property_type, price_per_m2_total")
        .eq("status", "active")
        .gt("created_at", since)
        .not("url", "is", null)
        .gt("price", 0)
        .order("created_at", { ascending: false })
        .limit(50);

      // Apply zone filter
      if (f.zones && f.zones.length > 0) {
        query = query.in("norm_neighborhood", f.zones);
      }

      // Apply property type filter
      if (f.property_types && f.property_types.length > 0) {
        query = query.in("property_type", f.property_types);
      }

      // Apply price filter
      if (f.price_min) {
        query = query.gte("price", f.price_min);
      }
      if (f.price_max) {
        query = query.lte("price", f.price_max);
      }

      const { data: matches, error: matchErr } = await query;
      if (matchErr) {
        console.error(`Alert ${alert.id} query error:`, matchErr.message);
        continue;
      }

      if (matches && matches.length > 0) {
        // Create notifications for in-app
        if (alert.in_app_enabled) {
          const notifications = matches.map((p: any) => ({
            user_id: alert.user_id,
            alert_id: alert.id,
            property_id: p.id,
            type: "new_match",
            title: `Nueva propiedad en ${p.norm_neighborhood || p.neighborhood || "zona"}`,
            message: `${p.title || p.address || "Propiedad"} — USD ${p.price?.toLocaleString() || "?"} ${p.price_per_m2_total ? `(${Math.round(p.price_per_m2_total)} USD/m²)` : ""}`.trim(),
            metadata: { alert_name: alert.name },
          }));

          const { error: insertErr } = await supabase
            .from("notifications")
            .insert(notifications);

          if (insertErr) {
            console.error(`Failed to insert notifications for alert ${alert.id}:`, insertErr.message);
          } else {
            totalNotifications += notifications.length;
          }
        }
      }

      // Update last_evaluated_at
      await supabase
        .from("alerts")
        .update({ last_evaluated_at: now })
        .eq("id", alert.id);
    }

    // ─── 2. Monitor saved projects for removed properties ───
    const { data: savedWithRemoved, error: savedErr } = await supabase
      .from("saved_projects")
      .select("id, user_id, property_id, last_known_price, notified_removed, properties!inner(id, title, address, neighborhood, norm_neighborhood, status, price, removed_at)")
      .eq("notified_removed", false)
      .is("discarded_at", null);

    if (savedErr) {
      console.error("Saved projects query error:", savedErr.message);
    } else if (savedWithRemoved) {
      const removedNotifications: any[] = [];
      const priceChangeNotifications: any[] = [];
      const updateOps: { id: string; last_known_price: number | null; notified_removed: boolean }[] = [];

      for (const sp of savedWithRemoved as any[]) {
        const prop = sp.properties;
        if (!prop) continue;

        // Check if removed
        if (prop.status === "removed" && !sp.notified_removed) {
          removedNotifications.push({
            user_id: sp.user_id,
            alert_id: null,
            property_id: sp.property_id,
            type: "removed",
            title: `Publicación finalizada`,
            message: `${prop.title || prop.address || "Propiedad"} en ${prop.norm_neighborhood || prop.neighborhood || "zona"} fue dada de baja.`,
            metadata: { removed_at: prop.removed_at },
          });
          updateOps.push({ id: sp.id, last_known_price: sp.last_known_price, notified_removed: true });
        }

        // Check price change
        if (prop.status === "active" && sp.last_known_price != null && prop.price != null) {
          const diff = prop.price - sp.last_known_price;
          if (diff !== 0) {
            const direction = diff < 0 ? "bajó" : "subió";
            const pct = Math.abs(Math.round((diff / sp.last_known_price) * 100));
            priceChangeNotifications.push({
              user_id: sp.user_id,
              alert_id: null,
              property_id: sp.property_id,
              type: "price_change",
              title: `El precio ${direction} ${pct}%`,
              message: `${prop.title || prop.address || "Propiedad"}: USD ${sp.last_known_price.toLocaleString()} → USD ${prop.price.toLocaleString()}`,
              metadata: { old_price: sp.last_known_price, new_price: prop.price },
            });
          }
        }

        // Always update last_known_price if it changed or was null
        if (prop.price != null && prop.price !== sp.last_known_price && prop.status === "active") {
          updateOps.push({ id: sp.id, last_known_price: prop.price, notified_removed: sp.notified_removed || false });
        }
      }

      // Insert notifications
      const allSavedNotifs = [...removedNotifications, ...priceChangeNotifications];
      if (allSavedNotifs.length > 0) {
        const { error: nErr } = await supabase.from("notifications").insert(allSavedNotifs);
        if (nErr) console.error("Failed to insert saved project notifications:", nErr.message);
        else totalNotifications += allSavedNotifs.length;
      }

      // Update saved_projects tracking
      for (const op of updateOps) {
        await supabase
          .from("saved_projects")
          .update({ last_known_price: op.last_known_price, notified_removed: op.notified_removed })
          .eq("id", op.id);
      }
    }

    console.log(`Evaluate-alerts complete: ${alerts?.length || 0} alerts checked, ${totalNotifications} notifications created`);

    return new Response(
      JSON.stringify({ ok: true, alerts_checked: alerts?.length || 0, notifications: totalNotifications }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("evaluate-alerts error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
