import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { SurfacePreferenceProvider } from "@/contexts/SurfacePreferenceContext";
import Landing from "./pages/Landing";
import MapView from "./pages/MapView";
import PropertyList from "./pages/PropertyList";
import MisProyectos from "./pages/MisProyectos";
import Busqueda from "./pages/Busqueda";
import Settings from "./pages/Settings";
import Alertas from "./pages/Alertas";


import Tasacion from "./pages/Tasacion";
import InteligenciaPrecios from "./pages/InteligenciaPrecios";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Planes from "./pages/Planes";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import LogoPreview from "./pages/LogoPreview";
import IconExport from "./pages/IconExport";

const queryClient = new QueryClient();

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/mapa" replace /> : <Landing />;
}

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { completed, loading: onbLoading } = useOnboarding();

  if (authLoading || onbLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (completed === false) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function RequirePremium({ children }: { children: React.ReactNode }) {
  const { isPremium, isLoading } = useSubscription();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  if (isLoading || adminLoading) return null;
  if (isAdmin) return <>{children}</>;
  if (!isPremium) return <Navigate to="/planes" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SurfacePreferenceProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/mapa" element={<RequireOnboarding><MapView /></RequireOnboarding>} />
            <Route path="/propiedades" element={<RequireOnboarding><PropertyList /></RequireOnboarding>} />
            <Route path="/mis-proyectos" element={<RequireOnboarding><MisProyectos /></RequireOnboarding>} />
            <Route path="/busqueda" element={<RequireOnboarding><Busqueda /></RequireOnboarding>} />
            <Route path="/alertas" element={<RequireOnboarding><Alertas /></RequireOnboarding>} />
            <Route path="/ranking" element={<Navigate to="/propiedades" replace />} />
            
            <Route path="/tasacion" element={<RequireOnboarding><RequirePremium><Tasacion /></RequirePremium></RequireOnboarding>} />
            <Route path="/inteligencia-precios" element={<RequireOnboarding><RequirePremium><InteligenciaPrecios /></RequirePremium></RequireOnboarding>} />
            <Route path="/configuracion" element={<RequireOnboarding><Settings /></RequireOnboarding>} />
            <Route path="/planes" element={<RequireOnboarding><Planes /></RequireOnboarding>} />
            <Route path="/logo-preview" element={<LogoPreview />} />
            <Route path="/icon-export" element={<IconExport />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SurfacePreferenceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
