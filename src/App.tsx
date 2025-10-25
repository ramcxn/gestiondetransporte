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
import Operators from "./pages/Operators";
import Antidoping from "./pages/Antidoping";
import Breathalyzer from "./pages/Breathalyzer";
import Maintenance from "./pages/Maintenance";
import Trips from "./pages/Trips";
import Settlements from "./pages/Settlements";
import RouteAnalysis from "./pages/RouteAnalysis";
import RiskAnalysis from "./pages/RiskAnalysis";
import SecuritySeals from "./pages/SecuritySeals";
import Cybersecurity from "./pages/Cybersecurity";
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
            <Route path="/operadores" element={<Operators />} />
            <Route path="/antidoping" element={<Antidoping />} />
            <Route path="/alcoholimetro" element={<Breathalyzer />} />
            <Route path="/mantenimiento" element={<Maintenance />} />
            <Route path="/viajes" element={<Trips />} />
            <Route path="/liquidaciones" element={<Settlements />} />
            <Route path="/analisis-ruta" element={<RouteAnalysis />} />
            <Route path="/analisis-riesgos" element={<RiskAnalysis />} />
            <Route path="/sellos" element={<SecuritySeals />} />
            <Route path="/ciberseguridad" element={<Cybersecurity />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
