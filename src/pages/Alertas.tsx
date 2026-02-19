import { useState } from "react";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Plus, Trash2, Loader2 } from "lucide-react";

const Alertas = () => {
  const { user, loading: authLoading } = useAuth();

  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-1">Alertas</h2>
            <p className="text-muted-foreground">
              Configurá alertas para recibir notificaciones cuando aparezcan nuevas oportunidades.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">Próximamente</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Acá vas a poder configurar alertas con filtros de barrio, precio, tipo de propiedad y score de oportunidad. Se evaluarán automáticamente al cargar nuevas propiedades.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Alertas;
