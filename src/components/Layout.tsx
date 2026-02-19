import { Link, useLocation, useNavigate } from "react-router-dom";
import { Map, List, Star, Search, Settings, Sun, Moon, LogOut, User, BarChart3, Bell, Menu, X, Upload, Calculator, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import CsvUploadButton from "./CsvUploadButton";
import { useTheme } from "@/hooks/useTheme";
import { usePreselection } from "@/hooks/usePreselection";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

const navItems = [
  { path: "/", label: "Mapa", icon: Map },
  { path: "/propiedades", label: "Propiedades", icon: List },
  { path: "/mis-proyectos", label: "Mis Proyectos", icon: Star, badgeKey: "preselection" as const },
  { path: "/busqueda", label: "Búsqueda", icon: Search },
  { path: "/tasacion", label: "Tasación", icon: Calculator },
  { path: "/inteligencia-precios", label: "Inteligencia de Precios", icon: TrendingUp },
  { path: "/alertas", label: "Alertas", icon: Bell },
];

const bottomItems = [
  { path: "/configuracion", label: "Configuración", icon: Settings },
];

const Layout = ({ children, headerContent }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const { count: preselectionCount } = usePreselection();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0];

  const getBadge = (badgeKey?: string) => {
    if (badgeKey === "preselection" && preselectionCount > 0) return preselectionCount;
    return null;
  };

  const closeSidebar = () => setSidebarOpen(false);

  const renderNavItem = (item: typeof navItems[0], isCollapsed = false) => {
    const isActive = location.pathname === item.path;
    const badge = getBadge((item as any).badgeKey);

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={closeSidebar}
        className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive
            ? "bg-primary/15 text-primary"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        } ${isCollapsed ? "justify-center" : ""}`}
        title={isCollapsed ? item.label : undefined}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && <span className="truncate">{item.label}</span>}
        {!isCollapsed && badge != null && (
          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/20 text-primary leading-none">
            {badge}
          </span>
        )}
        {isCollapsed && badge != null && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />
        )}
      </Link>
    );
  };

  const sidebarContent = (isCollapsed: boolean) => (
    <div className={`flex flex-col h-screen bg-sidebar-background border-r border-sidebar-border transition-[width] duration-300 ease-in-out ${isCollapsed ? "w-14" : "w-56"}`}>
      {/* Logo + collapse toggle */}
      <div className={`flex items-center h-14 px-3 border-b border-sidebar-border ${isCollapsed ? "justify-center px-2" : "justify-between"}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary flex-shrink-0" />
            <h1 className="text-base font-bold tracking-tight">
              <span className="text-gradient-opportunity">PropAnalytics</span>
            </h1>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
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

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all w-full ${isCollapsed ? "justify-center" : ""}`}
          title={isDark ? "Modo claro" : "Modo oscuro"}
        >
          {isDark ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
          {!isCollapsed && <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>}
        </button>

        {/* Collapse toggle removed — now in header */}

        {/* User */}
        {user ? (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isCollapsed ? "justify-center" : ""}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <User className="h-3.5 w-3.5 text-primary" />
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
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-gradient-opportunity">PropAnalytics</span>
              </div>
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
          <div className="border-b border-border glass-card px-4 py-2 flex items-center justify-center">
            {headerContent}
          </div>
        )}

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
