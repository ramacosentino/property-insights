import Layout from "@/components/Layout";
import PropertyCard from "@/components/PropertyCard";
import { useProperties } from "@/hooks/useProperties";
import { usePreselection } from "@/hooks/usePreselection";
import { Star, Trash2 } from "lucide-react";

const MisProyectos = () => {
  const { data, isLoading } = useProperties();
  const properties = data?.properties ?? [];
  const { selectedIds, clear, count } = usePreselection();

  const preselected = properties.filter((p) => selectedIds.has(p.id));

  return (
    <Layout>
      <div className="container px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-1">Mis Proyectos</h2>
            <p className="text-muted-foreground">
              {count > 0
                ? `${count} propiedad${count !== 1 ? "es" : ""} preseleccionada${count !== 1 ? "s" : ""}`
                : "Agregá propiedades usando la estrella ⭐ en cualquier vista"}
            </p>
          </div>
          {count > 0 && (
            <button
              onClick={clear}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpiar todo
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : preselected.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Star className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Sin propiedades preseleccionadas</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Navegá el mapa o la lista de propiedades y hacé click en la estrella ⭐ para agregar propiedades a tu preselección.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {preselected.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MisProyectos;
