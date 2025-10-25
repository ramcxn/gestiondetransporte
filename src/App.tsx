import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import UnitEntry from "./pages/UnitEntry";
import SecurityRounds from "./pages/SecurityRounds";
import Visits from "./pages/Visits";
import Inventory from "./pages/Inventory";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/visitas" element={<Visits />} />
            <Route path="/rondines" element={<SecurityRounds />} />
            <Route path="/unidades" element={<UnitEntry />} />
            <Route path="/inventario" element={<Inventory />} />
            <Route path="/operadores" element={<ComingSoon moduleName="Gestión del Operador" />} />
            <Route path="/antidoping" element={<ComingSoon moduleName="Antidoping" />} />
            <Route path="/alcoholimetro" element={<ComingSoon moduleName="Pruebas de Alcoholímetro" />} />
            <Route path="/mantenimiento" element={<ComingSoon moduleName="Mantenimiento a Unidades" />} />
            <Route path="/viajes" element={<ComingSoon moduleName="Registro de Viajes" />} />
            <Route path="/liquidaciones" element={<ComingSoon moduleName="Liquidaciones" />} />
            <Route path="/analisis-ruta" element={<ComingSoon moduleName="Análisis de Factibilidad de Ruta" />} />
            <Route path="/analisis-riesgos" element={<ComingSoon moduleName="Análisis de Riesgos" />} />
            <Route path="/sellos" element={<ComingSoon moduleName="Inventario de Sellos de Seguridad" />} />
            <Route path="/ciberseguridad" element={<ComingSoon moduleName="Ciberseguridad" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
