import { Property } from "@/lib/propertyData";
import { CABA_SUB_BARRIOS, SUB_TO_PARENT } from "@/lib/cabaZones";

export interface NeighborhoodItem {
  value: string;
  label: string;
  count: number;
  children?: NeighborhoodItem[];
}

export interface ProvinceGroup {
  province: string;
  totalCount: number;
  neighborhoods: NeighborhoodItem[];
}

/**
 * Build neighborhood groups for the NeighborhoodDropdown from property data.
 * Nests sub-barrios under their parent (e.g. Palermo Hollywood under Palermo).
 */
export function buildNeighborhoodGroups(
  properties: Property[],
  neighborhoodCounts?: Map<string, number>
): ProvinceGroup[] {
  const hoodCounts = neighborhoodCounts ?? new Map<string, number>();
  const provCounts = new Map<string, number>();

  for (const p of properties) {
    if (!neighborhoodCounts) {
      hoodCounts.set(p.neighborhood, (hoodCounts.get(p.neighborhood) || 0) + 1);
    }
    const prov = p.city || "Sin ciudad";
    provCounts.set(prov, (provCounts.get(prov) || 0) + 1);
  }

  const provMap = new Map<string, NeighborhoodItem[]>();
  // Track which hoods are sub-barrios so we don't add them as top-level
  const subBarrioSet = new Set(Object.values(CABA_SUB_BARRIOS).flat());

  for (const [hood, count] of hoodCounts.entries()) {
    if (hood === "Sin barrio") continue;
    const sample = properties.find((pp) => pp.neighborhood === hood);
    const prov = sample?.city || "Sin ciudad";
    if (!provMap.has(prov)) provMap.set(prov, []);

    // Skip sub-barrios at top level — they'll be nested under parent
    if (subBarrioSet.has(hood)) continue;

    const item: NeighborhoodItem = {
      value: hood,
      label: `${hood} (${count})`,
      count,
    };

    // If this is a parent barrio, nest its children
    if (CABA_SUB_BARRIOS[hood]) {
      const children: NeighborhoodItem[] = [];
      for (const sub of CABA_SUB_BARRIOS[hood]) {
        const subCount = hoodCounts.get(sub);
        if (subCount) {
          children.push({
            value: sub,
            label: `${sub} (${subCount})`,
            count: subCount,
          });
        }
      }
      if (children.length > 0) {
        children.sort((a, b) => a.value.localeCompare(b.value));
        item.children = children;
        // Update label to show total (parent + children)
        const totalCount = count + children.reduce((s, c) => s + c.count, 0);
        item.label = `${hood} (${totalCount})`;
      }
    }

    provMap.get(prov)!.push(item);
  }

  return Array.from(provMap.entries())
    .map(([prov, hoods]) => ({
      province: prov,
      totalCount: provCounts.get(prov) || 0,
      neighborhoods: hoods.sort((a, b) => a.value.localeCompare(b.value)),
    }))
    .sort((a, b) => b.totalCount - a.totalCount);
}
