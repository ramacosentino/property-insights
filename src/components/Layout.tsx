import { Link, useLocation } from "react-router-dom";
import { Map, List, BarChart3, Sun, Moon } from "lucide-react";
import CsvUploadButton from "./CsvUploadButton";
import { useTheme } from "@/hooks/useTheme";

interface LayoutProps {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

const Layout = ({ children, headerContent }: LayoutProps) => {
  const location = useLocation();
  const { isDark, toggle } = useTheme();

  const navItems = [
    { path: "/", label: "Mapa", icon: Map },
    { path: "/propiedades", label: "Propiedades", icon: List },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border glass-card sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-gradient-opportunity">PropAnalytics</span>
            </h1>
          </div>
          {headerContent && (
            <div className="flex-1 flex items-center justify-center px-4">
              {headerContent}
            </div>
          )}
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={toggle}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              title={isDark ? "Modo claro" : "Modo oscuro"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <CsvUploadButton />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default Layout;
