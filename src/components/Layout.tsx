import { Link, useLocation, useNavigate } from "react-router-dom";
import { Map, List, Star, Search, Settings, LogOut, User, Bell, Menu, X, Upload, Calculator, TrendingUp, ChevronLeft, ChevronRight, CreditCard, Lock, HelpCircle } from "lucide-react";
import UrbbanLogo, { UrbannaIcon } from "./UrbbanLogo";
import CsvUploadButton from "./CsvUploadButton";
import { useTheme } from "@/hooks/useTheme";
import { usePreselection } from "@/hooks/usePreselection";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSurfacePreference } from "@/contexts/SurfacePreferenceContext";
import { useTour } from "@/hooks/useTour";
import { useNotifications } from "@/hooks/useNotifications";
import GuidedTour from "@/components/GuidedTour";
import DiscoveryChecklist from "@/components/DiscoveryChecklist";

interface LayoutProps {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

const PREMIUM_PATHS = ["/tasacion", "/inteligencia-precios"];

const navItems = [
  { path: "/mapa", label: "Mapa", icon: Map },
  { path: "/propiedades", label: "Propiedades", icon: List },
  { path: "/mis-proyectos", label: "Mis Proyectos", icon: Star, badgeKey: "preselection" as const },
  { path: "/busqueda", label: "Búsqueda", icon: Search },
  { path: "/tasacion", label: "Tasación", icon: Calculator, premium: true },
  { path: "/inteligencia-precios", label: "Inteligencia de Precios", icon: TrendingUp, premium: true },
  { path: "/alertas", label: "Alertas", icon: Bell },
];

const bottomItems = [
  { path: "/planes", label: "Planes", icon: CreditCard },
  { path: "/configuracion", label: "Configuración", icon: Settings },
];

const Layout = ({ children, headerContent }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const { count: preselectionCount } = usePreselection();
  const { user, signOut } = useAuth();
  const { isPremium } = useSubscription();
  const { isAdmin } = useIsAdmin();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { surfaceType, toggle: toggleSurface } = useSurfacePreference();
  const tour = useTour();
  const { unreadCount } = useNotifications();

  // Track route-based checklist completions
  useEffect(() => {
    if (!tour || tour.loading) return;
    const path = location.pathname;
    if (path === "/mapa") tour.completeChecklistItem("explored_map");
    if (path === "/inteligencia-precios") tour.completeChecklistItem("viewed_intelligence");
  }, [location.pathname, tour]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0];

  const getBadge = (item: typeof navItems[0]) => {
    if ((item as any).badgeKey === "preselection" && preselectionCount > 0) return preselectionCount;
    if (item.path === "/alertas" && unreadCount > 0) return unreadCount;
    return null;
  };

  const closeSidebar = () => setSidebarOpen(false);

  const renderNavItem = (item: typeof navItems[0], isCollapsed = false) => {
    const isActive = location.pathname === item.path;
    const badge = getBadge(item);
    const isLocked = (item as any).premium && !isPremium && !isAdmin;

    const content = (
      <Link
        key={item.path}
        to={isLocked ? "/planes" : item.path}
        onClick={closeSidebar}
        className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive && !isLocked
            ? "bg-primary/15 text-primary"
            : isLocked
            ? "text-sidebar-foreground/40"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        } ${isCollapsed ? "justify-center" : ""}`}
        title={isCollapsed ? item.label : undefined}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && <span className="truncate">{item.label}</span>}
        {!isCollapsed && isLocked && (
          <Lock className="ml-auto h-3 w-3 text-muted-foreground/50" />
        )}
        {!isCollapsed && !isLocked && badge != null && (
          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/20 text-primary leading-none">
            {badge}
          </span>
        )}
        {isCollapsed && badge != null && !isLocked && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />
        )}
      </Link>
    );

    if (isLocked && !isCollapsed) {
      return (
        <Tooltip key={item.path}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">Requiere plan Premium</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  const sidebarContent = (isCollapsed: boolean) => (
    <div className={`flex flex-col h-screen bg-sidebar-background border-r border-sidebar-border transition-[width] duration-300 ease-in-out ${isCollapsed ? "w-14" : "w-56"}`}>
      {/* Logo + collapse toggle */}
      <div className={`flex items-center h-14 border-b border-sidebar-border ${isCollapsed ? "justify-between px-2" : "justify-between px-3"}`}>
        {!isCollapsed ? (
          <UrbbanLogo size="sm" className="text-sidebar-foreground" />
        ) : (
          <UrbannaIcon size={28} className="flex-shrink-0" />
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all flex-shrink-0"
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => renderNavItem(item, isCollapsed))}
      </nav>

      {/* Bottom section */}
      <div className="p-2 space-y-0.5 border-t border-sidebar-border">
        {!isCollapsed && (
          <div className="px-1 mb-1">
            <CsvUploadButton />
          </div>
        )}
        {bottomItems.map((item) => renderNavItem(item, isCollapsed))}

        {/* Surface type toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleSurface}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all w-full ${isCollapsed ? "justify-center" : ""}`}
              title={surfaceType === "total" ? "Cambiar a m² cubierto" : "Cambiar a m² total"}
            >
              <Ruler className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && (
                <span className="flex items-center gap-2">
                  <span>m²</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${
                    surfaceType === "total" 
                      ? "bg-primary/20 text-primary" 
                      : "bg-accent text-accent-foreground"
                  }`}>
                    {surfaceType === "total" ? "TOT" : "CUB"}
                  </span>
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">
              Métrica: {surfaceType === "total" ? "USD/m² total" : "USD/m² cubierto"}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all w-full ${isCollapsed ? "justify-center" : ""}`}
          title={isDark ? "Modo claro" : "Modo oscuro"}
        >
          {isDark ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
          {!isCollapsed && <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>}
        </button>

        {/* Tour help button */}
        <button
          onClick={() => tour.restartTour()}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all w-full ${isCollapsed ? "justify-center" : ""}`}
          title="Ver tour de ayuda"
        >
          <HelpCircle className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>Ayuda</span>}
        </button>


        {/* User */}
        {user ? (
          <div className={`flex items-center gap-2 rounded-lg ${isCollapsed ? "justify-center px-1 py-2" : "px-3 py-2"}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover flex-shrink-0 aspect-square" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 aspect-square">
                <User className="h-4 w-4 text-primary" />
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</p>
                <button onClick={handleSignOut} className="text-[10px] text-destructive hover:underline">
                  Cerrar sesión
                </button>
              </div>
            )}
            {isCollapsed && (
              <button onClick={handleSignOut} className="absolute" title="Cerrar sesión">
                <span className="sr-only">Cerrar sesión</span>
              </button>
            )}
          </div>
        ) : (
          <Link
            to="/auth"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-all ${isCollapsed ? "justify-center" : ""}`}
          >
            <User className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span>Iniciar sesión</span>}
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full">
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="hidden md:flex flex-shrink-0 sticky top-0 h-screen z-40">
          {sidebarContent(collapsed)}
        </aside>
      )}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9998]" onClick={closeSidebar} />
          <aside className="fixed left-0 top-0 bottom-0 z-[9999] shadow-xl animate-in slide-in-from-left duration-200">
            <button
              onClick={closeSidebar}
              className="absolute top-3.5 right-2 p-1.5 rounded-full hover:bg-sidebar-accent z-10"
            >
              <X className="h-4 w-4 text-sidebar-foreground" />
            </button>
            {sidebarContent(false)}
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        {isMobile && (
          <header className="border-b border-border glass-card sticky top-0 z-40">
            <div className="flex items-center justify-between h-11 px-3">
              <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-secondary transition-all">
                <Menu className="h-5 w-5 text-foreground" />
              </button>
              <UrbbanLogo size="sm" className="text-foreground" />
              <div className="w-8" />
            </div>
            {headerContent && (
              <div className="border-t border-border/50 px-3 py-1.5 flex items-center justify-center">
                {headerContent}
              </div>
            )}
          </header>
        )}

        {/* Desktop header content */}
        {!isMobile && headerContent && (
          <div className="border-b border-border glass-card px-4 py-2 flex items-center justify-center relative z-[1400]">
            {headerContent}
          </div>
        )}

        <main className="flex-1">{children}</main>
      </div>

      {/* Guided Tour */}
      {tour.showTour && !tour.loading && (
        <GuidedTour onComplete={tour.completeTour} onSkip={tour.completeTour} />
      )}

      {/* Discovery Checklist */}
      {tour.tourCompleted && !tour.allCompleted && !tour.showTour && (
        <DiscoveryChecklist
          checklist={tour.checklist}
          items={tour.checklistItems}
          completedCount={tour.completedCount}
          allCompleted={tour.allCompleted}
          onRestartTour={tour.restartTour}
        />
      )}
    </div>
  );
};

export default Layout;
