import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MapView from "./pages/MapView";
import PropertyList from "./pages/PropertyList";
import MisProyectos from "./pages/MisProyectos";
import Busqueda from "./pages/Busqueda";
import Settings from "./pages/Settings";
import Alertas from "./pages/Alertas";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MapView />} />
          <Route path="/propiedades" element={<PropertyList />} />
          <Route path="/mis-proyectos" element={<MisProyectos />} />
          <Route path="/busqueda" element={<Busqueda />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/configuracion" element={<Settings />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
