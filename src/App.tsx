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
import Visits from "./pages/Visits";
import Inventory from "./pages/Inventory";
import Operators from "./pages/Operators";
import Personal from "./pages/Personal";
import PersonalAttendance from "./pages/PersonalAttendance";
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
                <ProtectedRoute>
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
                    <Inventory />
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
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <PersonalAttendance />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
