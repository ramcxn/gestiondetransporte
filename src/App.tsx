import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import UnitEntry from "./pages/UnitEntry";
import SecurityRounds from "./pages/SecurityRounds";
import SecurityZones from "./pages/SecurityZones";
import Visits from "./pages/Visits";
import EquipmentInventory from "./pages/EquipmentInventory";
import Operators from "./pages/Operators";
import Personal from "./pages/Personal";
import PersonalAttendance from "./pages/PersonalAttendance";
import Vacaciones from "./pages/Vacaciones";
import Antidoping from "./pages/Antidoping";
import Breathalyzer from "./pages/Breathalyzer";
import Maintenance from "./pages/Maintenance";
import Trips from "./pages/Trips";
import Settlements from "./pages/Settlements";
import RouteAnalysis from "./pages/RouteAnalysis";
import RiskAnalysis from "./pages/RiskAnalysis";
import SecuritySeals from "./pages/SecuritySeals";
import Cybersecurity from "./pages/Cybersecurity";
import UserManagement from "./pages/UserManagement";
import Clients from "./pages/Clients";
import OperatorInventory from "./pages/OperatorInventory";
import DocumentalReview from "./pages/DocumentalReview";
import Warehouse from "./pages/Warehouse";
import WarehouseCatalog from "./pages/WarehouseCatalog";
import WarehouseLocations from "./pages/WarehouseLocations";
import WarehouseRequests from "./pages/WarehouseRequests";
import WarehouseReception from "./pages/WarehouseReception";
import WarehouseInventory from "./pages/WarehouseInventory";
import WarehouseReports from "./pages/WarehouseReports";
import CorrectiveActions from "./pages/CorrectiveActions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/visitas"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Visits />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rondines"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SecurityRounds />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/zonas-seguridad"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <SecurityZones />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/unidades"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UnitEntry />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventario"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <EquipmentInventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/operadores"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <Operators />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/personal"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <Personal />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/asistencia"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PersonalAttendance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vacaciones"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <Vacaciones />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/antidoping"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <Antidoping />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/alcoholimetro"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Breathalyzer />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mantenimiento"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <Maintenance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/viajes"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <Trips />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/liquidaciones"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <Settlements />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analisis-ruta"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <RouteAnalysis />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analisis-riesgos"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <RiskAnalysis />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sellos"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <SecuritySeals />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ciberseguridad"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <Cybersecurity />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <UserManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <Clients />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventario-operador"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OperatorInventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/revision-documental"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DocumentalReview />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/almacen"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Warehouse />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/almacen/catalogo"
              element={
                <ProtectedRoute>
                  <Layout>
                    <WarehouseCatalog />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/almacen/ubicaciones"
              element={
                <ProtectedRoute>
                  <Layout>
                    <WarehouseLocations />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/almacen/solicitudes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <WarehouseRequests />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/almacen/recepcion"
              element={
                <ProtectedRoute>
                  <Layout>
                    <WarehouseReception />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/almacen/inventario"
              element={
                <ProtectedRoute>
                  <Layout>
                    <WarehouseInventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/almacen/reportes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <WarehouseReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/acciones-correctivas"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CorrectiveActions />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
