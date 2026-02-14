import { Link, useLocation } from "react-router-dom";
import { Map, List, BarChart3, Sun, Moon, Settings } from "lucide-react";
import CsvUploadButton from "./CsvUploadButton";
import { useTheme } from "@/hooks/useTheme";

interface LayoutProps {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

const Layout = ({ children, headerContent }: LayoutProps) => {
  const location = useLocation();
  const { isDark, toggle } = useTheme();

  const mainNav = [
    { path: "/", label: "Mapa", icon: Map },
    { path: "/propiedades", label: "Propiedades", icon: List },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border glass-card sticky top-0 z-50">
        {/* Row 1: Logo + Nav */}
        <div className="container flex items-center justify-between h-11 md:h-14 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <h1 className="text-sm md:text-lg font-bold tracking-tight">
              <span className="text-gradient-opportunity">PropAnalytics</span>
            </h1>
          </div>
          {/* Desktop: headerContent inline */}
          {headerContent && (
            <div className="hidden md:flex flex-1 items-center justify-center px-4">
              {headerContent}
            </div>
          )}
          <nav className="flex items-center gap-1 md:gap-2">
            {/* Main nav */}
            {mainNav.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  {item.label}
                </Link>
              );
            })}

            {/* Separator */}
            <div className="w-px h-5 bg-border mx-1" />

            {/* Setup tools */}
            <Link
              to="/configuracion"
              className={`p-1.5 md:p-2 rounded-full transition-all ${
                location.pathname === "/configuracion"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              title="Configuración"
            >
              <Settings className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Link>
            <button
              onClick={toggle}
              className="p-1.5 md:p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              title={isDark ? "Modo claro" : "Modo oscuro"}
            >
              {isDark ? <Sun className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <Moon className="h-3.5 w-3.5 md:h-4 md:w-4" />}
            </button>
            <div className="hidden md:block">
              <CsvUploadButton />
            </div>
          </nav>
        </div>
        {/* Row 2 (mobile only): headerContent */}
        {headerContent && (
          <div className="md:hidden border-t border-border/50 px-3 py-1.5 flex items-center justify-center">
            {headerContent}
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default Layout;
