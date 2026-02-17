import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useProperties } from "@/hooks/useProperties";
import { usePreselection } from "@/hooks/usePreselection";
import PropertyCard from "@/components/PropertyCard";
import { Property } from "@/lib/propertyData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSurfaceType, getMinSurfaceEnabled, getRenovationCosts } from "@/pages/Settings";
import { Search, Loader2, CheckCircle, AlertCircle, RotateCcw, ChevronRight, Filter, Sparkles, History, Trash2, Star, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type SearchStatus = "idle" | "configuring" | "running" | "completed" | "failed";

interface SearchFilters {
  property_types: string[];
  neighborhoods: string[];
  cities: string[];
  price_min: number | null;
  price_max: number | null;
  surface_min: number | null;
  rooms_min: number | null;
  rooms_max: number | null;
  parking_min: number | null;
  budget_max: number | null;
}

interface SearchRun {
  id: string;
  status: string;
  filters: SearchFilters;
  total_matched: number;
  candidates_count: number;
  analyzed_count: number;
  result_property_ids: string[];
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

const EMPTY_FILTERS: SearchFilters = {
  property_types: [],
  neighborhoods: [],
  cities: [],
  price_min: null,
  price_max: null,
  surface_min: null,
  rooms_min: null,
  rooms_max: null,
  parking_min: null,
  budget_max: null,
};

const FilterStep = ({
  filters,
  setFilters,
  onStart,
  availableTypes,
  availableNeighborhoods,
  availableCities,
}: {
  filters: SearchFilters;
  setFilters: (f: SearchFilters) => void;
  onStart: () => void;
  availableTypes: string[];
  availableNeighborhoods: string[];
  availableCities: string[];
}) => {
  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          Búsqueda inteligente
        </div>
        <h2 className="text-2xl font-bold">Configurá tus filtros</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Seleccioná los criterios y la plataforma encontrará las mejores oportunidades, las analizará con IA y te mostrará los 10 mejores proyectos.
        </p>
      </div>

      <div className="space-y-5">
        {/* Property Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Tipo de propiedad</label>
          <div className="flex flex-wrap gap-2">
            {availableTypes.map((t) => (
              <button
                key={t}
                onClick={() => setFilters({ ...filters, property_types: toggleArray(filters.property_types, t) })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  filters.property_types.includes(t)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Zone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Zona (barrio)</label>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto rounded-lg border border-border p-2">
            {availableNeighborhoods.slice(0, 50).map((n) => (
              <button
                key={n}
                onClick={() => setFilters({ ...filters, neighborhoods: toggleArray(filters.neighborhoods, n) })}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                  filters.neighborhoods.includes(n)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {filters.neighborhoods.length > 0 && (
            <p className="text-[10px] text-primary">{filters.neighborhoods.length} barrio(s) seleccionado(s)</p>
          )}
        </div>

        {/* Price Range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Precio mínimo (USD)</label>
            <input
              type="number"
              placeholder="Ej: 50000"
              value={filters.price_min ?? ""}
              onChange={(e) => setFilters({ ...filters, price_min: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Precio máximo (USD)</label>
            <input
              type="number"
              placeholder="Ej: 200000"
              value={filters.price_max ?? ""}
              onChange={(e) => setFilters({ ...filters, price_max: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Surface */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Superficie mínima (m²)</label>
          <input
            type="number"
            placeholder="Ej: 40"
            value={filters.surface_min ?? ""}
            onChange={(e) => setFilters({ ...filters, surface_min: e.target.value ? Number(e.target.value) : null })}
            className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Rooms range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Ambientes mín.</label>
            <input
              type="number"
              min={1}
              placeholder="Ej: 2"
              value={filters.rooms_min ?? ""}
              onChange={(e) => setFilters({ ...filters, rooms_min: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Ambientes máx.</label>
            <input
              type="number"
              min={1}
              placeholder="Ej: 4"
              value={filters.rooms_max ?? ""}
              onChange={(e) => setFilters({ ...filters, rooms_max: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Parking */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Cocheras mínimas</label>
          <input
            type="number"
            min={0}
            placeholder="Ej: 1"
            value={filters.parking_min ?? ""}
            onChange={(e) => setFilters({ ...filters, parking_min: e.target.value ? Number(e.target.value) : null })}
            className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Budget total */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Presupuesto total máx. (precio + refacción est.)</label>
          <input
            type="number"
            placeholder="Ej: 250000"
            value={filters.budget_max ?? ""}
            onChange={(e) => setFilters({ ...filters, budget_max: e.target.value ? Number(e.target.value) : null })}
            className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="text-[10px] text-muted-foreground">
            Incluye una estimación del costo de refacción basada en tus costos configurados.
          </p>
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <Button
          onClick={onStart}
          size="lg"
          className="gap-2 rounded-full px-8"
        >
          <Search className="h-4 w-4" />
          Buscar oportunidades
        </Button>
      </div>
    </div>
  );
};

const ProgressStep = ({ run }: { run: SearchRun | null }) => {
  if (!run) return null;

  const steps = [
    { key: "filtering", label: "Filtrando propiedades", done: ["analyzing", "completed"].includes(run.status) },
    { key: "analyzing", label: `Analizando con IA (${run.analyzed_count}/${run.candidates_count})`, done: run.status === "completed" },
    { key: "completed", label: "Seleccionando mejores proyectos", done: run.status === "completed" },
  ];

  return (
    <div className="max-w-md mx-auto space-y-6 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
        <Loader2 className="h-4 w-4 animate-spin" />
        Búsqueda en progreso
      </div>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.key} className="flex items-center gap-3 text-left">
            {step.done ? (
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            ) : run.status === step.key ? (
              <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-border flex-shrink-0" />
            )}
            <span className={`text-sm ${step.done ? "text-foreground" : run.status === step.key ? "text-primary font-medium" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
      {run.total_matched > 0 && (
        <p className="text-xs text-muted-foreground">
          {run.total_matched} propiedades encontradas · {run.candidates_count} candidatas seleccionadas
        </p>
      )}
      <p className="text-xs text-muted-foreground/70">
        Esto puede demorar varios minutos. Podés dejar esta pestaña abierta.
      </p>
    </div>
  );
};

const ResultsStep = ({
  resultProperties,
  onNewSearch,
  onSave,
  onDiscard,
  savedIds,
  discardedIds,
}: {
  resultProperties: Property[];
  onNewSearch: () => void;
  onSave: (id: string) => void;
  onDiscard: (id: string) => void;
  savedIds: Set<string>;
  discardedIds: Set<string>;
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">
          <CheckCircle className="h-4 w-4" />
          Búsqueda completada
        </div>
        <h2 className="text-2xl font-bold">Top {resultProperties.length} proyectos</h2>
        <p className="text-sm text-muted-foreground">
          Ordenados por mayor ganancia neta estimada. Guardá los que te interesen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resultProperties.map((p, idx) => (
          <div key={p.id} className="relative">
            <div className="absolute -top-2 -left-2 z-10 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              {idx + 1}
            </div>
            <PropertyCard property={p} />
            <div className="flex gap-2 mt-2">
              {savedIds.has(p.id) ? (
                <span className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                  <CheckCircle className="h-3 w-3" /> Guardado
                </span>
              ) : discardedIds.has(p.id) ? (
                <span className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                  <XCircle className="h-3 w-3" /> Descartado
                </span>
              ) : (
                <>
                  <button
                    onClick={() => onSave(p.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
                  >
                    <Star className="h-3 w-3" /> Guardar
                  </button>
                  <button
                    onClick={() => onDiscard(p.id)}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all"
                  >
                    <XCircle className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Button onClick={onNewSearch} variant="outline" className="gap-2 rounded-full">
          <RotateCcw className="h-4 w-4" />
          Nueva búsqueda
        </Button>
      </div>
    </div>
  );
};

const Busqueda = () => {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading: propsLoading } = useProperties();
  const properties = data?.properties ?? [];
  const { toggle, isSelected } = usePreselection();
  const { toast } = useToast();

  const [status, setStatus] = useState<SearchStatus>("idle");
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [currentRun, setCurrentRun] = useState<SearchRun | null>(null);
  const [resultProperties, setResultProperties] = useState<Property[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [discardedIds, setDiscardedIds] = useState<Set<string>>(new Set());
  const [pastSearches, setPastSearches] = useState<SearchRun[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Derive available filter values from properties
  const availableTypes = [...new Set(properties.map((p) => p.propertyType).filter(Boolean) as string[])].sort();
  const availableNeighborhoods = [...new Set(properties.map((p) => p.neighborhood).filter((n) => n !== "Sin barrio"))].sort();
  const availableCities = [...new Set(properties.map((p) => p.city).filter((c) => c !== "Sin ciudad"))].sort();

  // Load past searches
  useEffect(() => {
    if (!user) return;
    supabase
      .from("search_runs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setPastSearches(data as unknown as SearchRun[]);
      });
  }, [user, status]);

  // Poll for progress when running
  useEffect(() => {
    if (status !== "running" || !currentRun) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("search_runs")
        .select("*")
        .eq("id", currentRun.id)
        .single();
      if (data) {
        const run = data as unknown as SearchRun;
        setCurrentRun(run);
        if (run.status === "completed") {
          setStatus("completed");
          loadResults(run.result_property_ids);
        } else if (run.status === "failed") {
          setStatus("failed");
          toast({ title: "❌ Búsqueda fallida", description: run.error_message || "Error desconocido", variant: "destructive" });
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [status, currentRun]);

  const loadResults = useCallback((ids: string[]) => {
    const propsMap = new Map(properties.map((p) => [p.id, p]));
    const results = ids.map((id) => propsMap.get(id)).filter(Boolean) as Property[];
    setResultProperties(results);
  }, [properties]);

  const handleStart = async () => {
    if (!user) return;

    // Create search run in DB
    const { data: run, error } = await supabase
      .from("search_runs")
      .insert({ user_id: user.id, filters: filters as any, status: "pending" })
      .select()
      .single();

    if (error || !run) {
      toast({ title: "Error", description: "No se pudo iniciar la búsqueda", variant: "destructive" });
      return;
    }

    const searchRun = run as unknown as SearchRun;
    setCurrentRun(searchRun);
    setStatus("running");
    setSavedIds(new Set());
    setDiscardedIds(new Set());

    // Build renovation costs
    const costs = getRenovationCosts();
    const renovationCosts: Record<string, number> = {};
    costs.forEach((c) => { renovationCosts[`${c.minScore}`] = c.costPerM2; });

    // Invoke edge function (fire and forget — we poll for status)
    supabase.functions.invoke("run-search", {
      body: {
        search_id: searchRun.id,
        filters,
        user_id: user.id,
        surface_type: getSurfaceType(),
        min_surface_enabled: getMinSurfaceEnabled(),
        renovation_costs: renovationCosts,
      },
    });
  };

  const handleSave = (propertyId: string) => {
    if (!isSelected(propertyId)) toggle(propertyId);
    setSavedIds((prev) => new Set([...prev, propertyId]));
    toast({ title: "⭐ Guardado en Mis Proyectos" });
  };

  const handleDiscard = (propertyId: string) => {
    setDiscardedIds((prev) => new Set([...prev, propertyId]));
  };

  const handleNewSearch = () => {
    setStatus("configuring");
    setCurrentRun(null);
    setResultProperties([]);
    setFilters(EMPTY_FILTERS);
    setSavedIds(new Set());
    setDiscardedIds(new Set());
  };

  const handleLoadSearch = (run: SearchRun) => {
    setCurrentRun(run);
    if (run.status === "completed") {
      setStatus("completed");
      loadResults(run.result_property_ids);
    } else if (run.status === "failed") {
      setStatus("failed");
    } else {
      setStatus("running");
    }
    setShowHistory(false);
  };

  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container px-6 py-8">
        {/* Idle / Landing */}
        {status === "idle" && (
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="space-y-3">
              <Sparkles className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-3xl font-bold">Búsqueda inteligente</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Definí filtros y la plataforma encontrará, analizará con IA, y te mostrará los mejores proyectos de inversión.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button onClick={() => setStatus("configuring")} size="lg" className="gap-2 rounded-full px-8">
                <Search className="h-4 w-4" />
                Comenzar búsqueda
              </Button>
              {pastSearches.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all"
                >
                  <History className="h-4 w-4" />
                  Historial ({pastSearches.length})
                </button>
              )}
            </div>

            {showHistory && pastSearches.length > 0 && (
              <div className="mt-6 space-y-2 text-left">
                <h3 className="text-sm font-medium text-foreground">Búsquedas anteriores</h3>
                {pastSearches.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleLoadSearch(s)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-all text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.status === "completed" ? "bg-green-500/10 text-green-500" : s.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                        }`}>
                          {s.status === "completed" ? "Completada" : s.status === "failed" ? "Fallida" : "En curso"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString("es-AR")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {s.total_matched} filtradas · {s.result_property_ids?.length || 0} resultados
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Configuring filters */}
        {status === "configuring" && (
          <FilterStep
            filters={filters}
            setFilters={setFilters}
            onStart={handleStart}
            availableTypes={availableTypes}
            availableNeighborhoods={availableNeighborhoods}
            availableCities={availableCities}
          />
        )}

        {/* Running */}
        {status === "running" && <ProgressStep run={currentRun} />}

        {/* Failed */}
        {status === "failed" && (
          <div className="max-w-md mx-auto text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Búsqueda fallida</h2>
            <p className="text-sm text-muted-foreground">{currentRun?.error_message || "Ocurrió un error inesperado."}</p>
            <Button onClick={handleNewSearch} variant="outline" className="gap-2 rounded-full">
              <RotateCcw className="h-4 w-4" />
              Intentar de nuevo
            </Button>
          </div>
        )}

        {/* Results */}
        {status === "completed" && (
          <ResultsStep
            resultProperties={resultProperties}
            onNewSearch={handleNewSearch}
            onSave={handleSave}
            onDiscard={handleDiscard}
            savedIds={savedIds}
            discardedIds={discardedIds}
          />
        )}
      </div>
    </Layout>
  );
};

export default Busqueda;
