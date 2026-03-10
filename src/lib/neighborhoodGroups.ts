import { Property } from "@/lib/propertyData";

export interface ProvinceGroup {
  province: string;
  totalCount: number;
  neighborhoods: { value: string; label: string; count: number }[];
}

/**
 * Build neighborhood groups for the NeighborhoodDropdown from property data.
 * Filters out neighborhoods that exactly match their parent city/locality
 * to avoid duplicate entries (e.g., "San Isidro" group containing "San Isidro" sub-item).
 */
export function buildNeighborhoodGroups(
  properties: Property[],
  neighborhoodCounts?: Map<string, number>
): ProvinceGroup[] {
  const hoodCounts = neighborhoodCounts ?? new Map<string, number>();
  const provCounts = new Map<string, number>();

  // Count per neighborhood and per province
  for (const p of properties) {
    if (!neighborhoodCounts) {
      hoodCounts.set(p.neighborhood, (hoodCounts.get(p.neighborhood) || 0) + 1);
    }
    const prov = p.city || "Sin ciudad";
    provCounts.set(prov, (provCounts.get(prov) || 0) + 1);
  }

  const provMap = new Map<string, { value: string; label: string; count: number }[]>();
  for (const [hood, count] of hoodCounts.entries()) {
    if (hood === "Sin barrio") continue;
    const sample = properties.find((pp) => pp.neighborhood === hood);
    const prov = sample?.city || "Sin ciudad";
    // Skip neighborhoods that are identical to their parent group (avoids San Isidro → San Isidro)
    if (hood === prov) continue;
    if (!provMap.has(prov)) provMap.set(prov, []);
    provMap.get(prov)!.push({ value: hood, label: `${hood} (${count})`, count });
  }

  return Array.from(provMap.entries())
    .map(([prov, hoods]) => ({
      province: prov,
      totalCount: provCounts.get(prov) || 0,
      neighborhoods: hoods.sort((a, b) => a.value.localeCompare(b.value)),
    }))
    .sort((a, b) => b.totalCount - a.totalCount);
}
