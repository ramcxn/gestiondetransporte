import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Truck,
  Users,
  Shield,
  Package,
  UserCheck,
  FlaskConical,
  Wine,
  Wrench,
  MapPin,
  DollarSign,
  Route,
  AlertTriangle,
  Tag,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { name: "Dashboard", path: "/", icon: Package },
  { name: "Visitas/Proveedores", path: "/visitas", icon: Users },
  { name: "Rondines de Seguridad", path: "/rondines", icon: Shield },
  { name: "Ingreso de Unidades", path: "/unidades", icon: Truck },
  { name: "Inventario de Equipo", path: "/inventario", icon: Package },
  { name: "Gestión del Operador", path: "/operadores", icon: UserCheck },
  { name: "Antidoping", path: "/antidoping", icon: FlaskConical },
  { name: "Alcoholímetro", path: "/alcoholimetro", icon: Wine },
  { name: "Mantenimiento", path: "/mantenimiento", icon: Wrench },
  { name: "Viajes", path: "/viajes", icon: MapPin },
  { name: "Liquidaciones", path: "/liquidaciones", icon: DollarSign },
  { name: "Análisis de Ruta", path: "/analisis-ruta", icon: Route },
  { name: "Análisis de Riesgos", path: "/analisis-riesgos", icon: AlertTriangle },
  { name: "Sellos de Seguridad", path: "/sellos", icon: Tag },
  { name: "Ciberseguridad", path: "/ciberseguridad", icon: ShieldCheck },
];

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Gestión de Transporte</h1>
                <p className="text-xs text-muted-foreground">CTPAT Compliance</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border p-4 lg:p-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground">
                {navigationItems.find((item) => item.path === location.pathname)?.name || "Dashboard"}
              </h2>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
