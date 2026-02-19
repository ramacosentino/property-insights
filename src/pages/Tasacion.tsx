import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Calculator } from "lucide-react";

const Tasacion = () => {
  const { user, loading: authLoading } = useAuth();

  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container px-6 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight mb-1">Tasación</h2>
          <p className="text-muted-foreground">
            Estimá el valor de mercado de una propiedad con datos comparables de la zona.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calculator className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">Próximamente</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Ingresá una dirección y características para obtener una tasación estimada basada en propiedades comparables del mercado actual.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Tasacion;
