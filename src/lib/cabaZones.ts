/**
 * Shared CABA sub-barrio hierarchy used across the app:
 * - OnboardingZoneSelector (zone picker)
 * - NeighborhoodDropdown (filter chip)
 * - buildNeighborhoodGroups (data grouping)
 */

export const CABA_SUB_BARRIOS: Record<string, string[]> = {
  Palermo: ["Palermo Hollywood", "Palermo Chico", "Palermo Soho", "Palermo Viejo"],
  Belgrano: ["Belgrano Residencial", "Barrio Chino"],
  Balvanera: ["Once", "Abasto"],
  "San Nicolás": ["Centro", "Microcentro", "Tribunales"],
  Recoleta: ["Barrio Norte"],
};

/** Reverse map: sub-barrio name → parent barrio */
export const SUB_TO_PARENT: Record<string, string> = {};
for (const [parent, subs] of Object.entries(CABA_SUB_BARRIOS)) {
  for (const sub of subs) SUB_TO_PARENT[sub] = parent;
}

/** Get all family names (parent + children) for a given neighborhood name */
export function getNeighborhoodFamily(name: string): string[] {
  // If it's a parent with children
  if (CABA_SUB_BARRIOS[name]) {
    return [name, ...CABA_SUB_BARRIOS[name]];
  }
  return [name];
}
