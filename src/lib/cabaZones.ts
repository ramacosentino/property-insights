/**
 * Shared zone normalization data used across the entire app.
 * Single source of truth for CABA barrios, sub-barrios, aliases,
 * GBA localities, and macro zones.
 */

// ─── CABA Canonical Barrios (48 official) ───────────────────────
export const CABA_CANONICAL_BARRIOS = new Set([
  "Agronomía", "Almagro", "Balvanera", "Barracas", "Belgrano", "Boedo",
  "Caballito", "Chacarita", "Coghlan", "Colegiales", "Constitución",
  "Flores", "Floresta", "La Boca", "La Paternal", "Liniers",
  "Mataderos", "Monte Castro", "Monserrat", "Nueva Pompeya", "Núñez",
  "Palermo", "Parque Avellaneda", "Parque Chacabuco", "Parque Chas",
  "Parque Patricios", "Puerto Madero", "Recoleta", "Retiro", "Saavedra",
  "San Cristóbal", "San Nicolás", "San Telmo", "Vélez Sársfield",
  "Versalles", "Villa Crespo", "Villa del Parque", "Villa Devoto",
  "Villa General Mitre", "Villa Lugano", "Villa Luro", "Villa Ortúzar",
  "Villa Pueyrredón", "Villa Real", "Villa Riachuelo", "Villa Santa Rita",
  "Villa Soldati", "Villa Urquiza",
]);

// ─── Sub-barrios hierarchy ──────────────────────────────────────
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

/** All recognized CABA names (official + sub-barrios) */
export const CABA_ALL_RECOGNIZED = new Set([
  ...CABA_CANONICAL_BARRIOS,
  ...Object.values(CABA_SUB_BARRIOS).flat(),
]);

// ─── CABA Aliases (Google non-standard → canonical) ─────────────
export const CABA_BARRIO_ALIASES: Record<string, string> = {
  "Barrio Catalinas Sur": "La Boca",
  "Barrio Olímpico": "Villa Soldati",
  "Barrio Piedrabuena": "Villa Lugano",
  "Barrio General Savio": "Villa Lugano",
  "Barrio Cildáñez - Villa 6": "Villa Lugano",
  "Barrio Lafuente": "Flores",
  "Barrio Espora": "Mataderos",
  "Barrio Hogar Obrero": "Caballito",
  "Barrio 20": "Villa Lugano",
  "Barrio Castex": "Retiro",
  "Complejo de Edificios Donizetti y Rivadavia": "Caballito",
  "Palermo Soho": "Palermo Soho",
  "Palermo Viejo": "Palermo Viejo",
  "Recoleta chica": "Recoleta",
  "Barrio Parque": "Recoleta",
  "Congreso": "Monserrat",
};

// ─── GBA Locality Aliases ───────────────────────────────────────
export const GBA_LOCALITY_ALIASES: Record<string, string> = {
  "Beccar": "Béccar",
  "Benavidez": "Benavídez",
  "Rincon de Milberg": "Rincón de Milberg",
  "Dique Lujan": "Dique Luján",
  "Dique Luján (Territorialmente Escobar Islas)": "Dique Luján",
  "Villa Maipu": "Villa Maipú",
  "Santo Tomas": "Santo Tomás",
  "San Sebastian": "San Sebastián",
  "Santa Maria": "Santa María",
  "Boulogne Sur Mer": "Boulogne",
  "ingeniero maschiwitz": "Ingeniero Maschwitz",
  "Ingeniero Pablo Nogués": "Pablo Nogués",
  "Luis Lagomarsino o Maquinista F. Savio (Oeste)": "Maquinista Savio",
  "Ciudad Jardín Lomas del Palomar": "El Palomar",
  "Ciudad Jardín El Libertador": "El Palomar",
  "Fatima": "Fátima",
  "Garin": "Garín",
  "Lomas de San Isidro": "San Isidro",
  "General San Martín": "San Martín",
  "Carapachay": "Vicente López",
  "Garcia del Río": "Vicente López",
  "Barrio Parque Las Acacias": "Pilar",
  "Barrio Parque Presidente Figueroa Alcorta": "Pilar",
  "Gran Buenos Aires": "Buenos Aires",
  "Pilar Centro": "Pilar",
};

// ─── Macro Zones ────────────────────────────────────────────────
export const MACRO_ZONES: Record<string, { label: string; localities?: string[] }> = {
  caba: { label: "CABA" },
  gba_norte: {
    label: "GBA Norte",
    localities: [
      "Vicente López", "Olivos", "Munro", "Florida", "Florida Oeste", "La Lucila",
      "San Isidro", "Martínez", "Béccar", "Acassuso", "Punta Chica",
      "San Fernando", "Victoria", "Virreyes",
      "Tigre", "General Pacheco", "Don Torcuato", "El Talar", "Rincón de Milberg", "Nordelta", "Benavídez", "Bancalari", "Ricardo Rojas", "Dique Luján",
      "San Miguel", "Muñiz", "Bella Vista", "José C. Paz", "Grand Bourg", "Tortuguitas", "Los Polvorines", "Pablo Nogués", "Villa de Mayo",
      "Pilar", "Presidente Derqui", "Del Viso", "Villa Rosa", "Fátima", "Manuel Alberti", "La Lonja", "Pilar Sur", "Manzanares",
      "Escobar", "Belén de Escobar", "Garín", "Ingeniero Maschwitz", "Loma Verde", "Matheu", "Maquinista Savio",
      "Campana", "Los Cardales", "Alto Los Cardales", "Capilla del Señor", "Parada Robles", "Exaltación de la Cruz",
      "Zárate", "Zelaya",
      "Villa Adelina", "Villa Ballester", "Villa Maipú", "San Martín",
      "Boulogne", "Villanueva", "El Cazador", "Santo Tomás", "Ingeniero Adolfo Sourdeaux",
      "San Sebastián", "Santa María",
      "José León Suárez",
    ],
  },
  gba_oeste: {
    label: "GBA Oeste",
    localities: [
      "Morón", "Haedo", "Castelar", "Ituzaingó", "Merlo", "Moreno", "Paso del Rey",
      "Ramos Mejía", "San Justo", "La Tablada", "Villa Luzuriaga", "Hurlingham", "William Morris",
      "Caseros", "El Palomar",
    ],
  },
  gba_sur: {
    label: "GBA Sur",
    localities: [
      "Avellaneda", "Lanús", "Lomas de Zamora", "Banfield", "Temperley", "Adrogué",
      "Quilmes", "Bernal", "Don Bosco", "Berazategui", "Florencio Varela",
      "Ezeiza", "Canning", "Monte Grande",
    ],
  },
};

// ─── Derived sets ───────────────────────────────────────────────
export const VALID_GBA_LOCALITIES = new Set<string>();
for (const macro of Object.values(MACRO_ZONES)) {
  if (macro.localities) macro.localities.forEach((l) => VALID_GBA_LOCALITIES.add(l));
}

// ─── CABA province strings (as returned by Google geocoding) ────
const CABA_PROVINCES = new Set([
  "Ciudad Autónoma de Buenos Aires",
  "Autonomous City of Buenos Aires",
]);

const GBA_PROVINCES = new Set([
  "Provincia de Buenos Aires",
  "Buenos Aires",
]);

// ─── Normalization functions ────────────────────────────────────

/** Check if a norm_province value is CABA */
export function isCABA(normProvince: string | null): boolean {
  return !!normProvince && CABA_PROVINCES.has(normProvince);
}

/** Check if a norm_province value is GBA */
export function isGBA(normProvince: string | null): boolean {
  return !!normProvince && GBA_PROVINCES.has(normProvince);
}

/**
 * Normalize a neighborhood name using CABA aliases and whitelist.
 * Returns the canonical name or null if not recognized.
 */
export function normalizeCABANeighborhood(raw: string | null): string | null {
  if (!raw) return null;
  if (CABA_BARRIO_ALIASES[raw]) return CABA_BARRIO_ALIASES[raw];
  if (CABA_ALL_RECOGNIZED.has(raw)) return raw;
  return null; // unrecognized
}

/**
 * Normalize a GBA locality name using aliases and whitelist.
 * Returns the canonical name or null if not recognized.
 */
export function normalizeGBALocality(raw: string | null): string | null {
  if (!raw) return null;
  if (GBA_LOCALITY_ALIASES[raw]) return GBA_LOCALITY_ALIASES[raw];
  if (VALID_GBA_LOCALITIES.has(raw)) return raw;
  return null; // unrecognized
}

/**
 * Get a normalized neighborhood and city for a property row.
 * Ensures consistent mapping across the entire app.
 */
export function normalizePropertyZone(row: {
  norm_neighborhood: string | null;
  norm_locality: string | null;
  norm_province: string | null;
  neighborhood: string | null;
  city: string | null;
}): { neighborhood: string; city: string } {
  const rawHood = row.norm_neighborhood || row.neighborhood;
  const rawLocality = row.norm_locality;
  const province = row.norm_province;

  if (isCABA(province)) {
    const hood = normalizeCABANeighborhood(rawHood) || rawHood || "Sin barrio";
    return { neighborhood: hood, city: "CABA" };
  }

  if (isGBA(province)) {
    const locality = normalizeGBALocality(rawLocality) || normalizeGBALocality(rawHood) || rawLocality || rawHood || "Sin ciudad";
    // For GBA, the "neighborhood" is the locality name, and "city" is the macro zone label
    const macroLabel = getMacroZoneLabel(locality);
    return { neighborhood: locality, city: macroLabel || province || "GBA" };
  }

  // Fallback for other provinces
  const hood = rawHood || "Sin barrio";
  const city = rawLocality || row.city || province || "Sin ciudad";
  return { neighborhood: hood, city };
}

/** Get the macro zone label (GBA Norte, etc.) for a given locality */
export function getMacroZoneLabel(locality: string): string | null {
  for (const [, macro] of Object.entries(MACRO_ZONES)) {
    if (macro.localities?.includes(locality)) return macro.label;
  }
  return null;
}

/** Get all family names (parent + children) for a given neighborhood name */
export function getNeighborhoodFamily(name: string): string[] {
  if (CABA_SUB_BARRIOS[name]) {
    return [name, ...CABA_SUB_BARRIOS[name]];
  }
  return [name];
}
