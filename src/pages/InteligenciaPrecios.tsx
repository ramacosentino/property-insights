import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { TrendingUp } from "lucide-react";

const InteligenciaPrecios = () => {
  const { user, loading: authLoading } = useAuth();

  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container px-6 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight mb-1">Inteligencia de Precios</h2>
          <p className="text-muted-foreground">
            Tendencias, predicciones y análisis de evolución del mercado inmobiliario.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">Próximamente</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Visualizá tendencias de precios por barrio, predicciones de valorización y análisis comparativo de zonas para tomar mejores decisiones de inversión.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default InteligenciaPrecios;
