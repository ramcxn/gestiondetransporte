import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, FileText, CheckCircle, XCircle, Calendar, Truck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

interface Trip {
  id: string;
  operador: string;
  unidad: string;
  origen: string;
  destino: string;
  fecha_salida: string;
  distancia_km: number;
  flete: number;
  cliente: string;
  estado: string;
}

interface Settlement {
  id: string;
  viaje_id: string;
  folio: string;
  monto_total: number;
  monto_operador: number;
  monto_diesel: number;
  monto_casetas: number;
  otros_gastos: number;
  deduccion: number;
  monto_neto: number;
  estado: string;
  fecha_liquidacion: string | null;
  observaciones: string | null;
  created_at: string;
  viaje?: Trip;
}

// Validation schema for monetary inputs
const settlementSchema = z.object({
  monto_diesel: z.number().min(0, "El monto debe ser mayor o igual a 0").max(999999999.99, "El monto excede el límite máximo"),
  monto_casetas: z.number().min(0, "El monto debe ser mayor o igual a 0").max(999999999.99, "El monto excede el límite máximo"),
  otros_gastos: z.number().min(0, "El monto debe ser mayor o igual a 0").max(999999999.99, "El monto excede el límite máximo"),
  deduccion: z.number().min(0, "La deducción debe ser mayor o igual a 0").max(999999999.99, "El monto excede el límite máximo"),
});

export default function Settlements() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    viaje_id: "",
    monto_diesel: "",
    monto_casetas: "",
    otros_gastos: "0",
    deduccion: "0",
    observaciones: "",
  });

  useEffect(() => {
    fetchTrips();
    fetchSettlements();

    const channel = supabase
      .channel('settlements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'liquidaciones'
        },
        () => {
          fetchSettlements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTrips = async () => {
    try {
      const { data: settledTrips } = await supabase
        .from("liquidaciones")
        .select("viaje_id");

      const settledTripIds = settledTrips?.map(s => s.viaje_id) || [];

      let query = supabase
        .from("viajes")
        .select("*")
        .eq('estado', 'completado')
        .order("fecha_salida", { ascending: false });

      if (settledTripIds.length > 0) {
        query = query.not('id', 'in', `(${settledTripIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error("Error fetching trips:", error);
    }
  };

  const fetchSettlements = async () => {
    try {
      const { data, error } = await supabase
        .from("liquidaciones")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const settlementsWithTrips = await Promise.all(
        (data || []).map(async (settlement) => {
          const { data: tripData } = await supabase
            .from("viajes")
            .select("*")
            .eq('id', settlement.viaje_id)
            .maybeSingle();

          return {
            ...settlement,
            viaje: tripData || undefined
          };
        })
      );

      setSettlements(settlementsWithTrips);
    } catch (error) {
      console.error("Error fetching settlements:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las liquidaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trip = trips.find(t => t.id === formData.viaje_id);
    if (!trip) return;

    setSubmitting(true);
    try {
      const montoOperador = trip.flete * 0.10;
      const montoDiesel = parseFloat(formData.monto_diesel) || 0;
      const montoCasetas = parseFloat(formData.monto_casetas) || 0;
      const otrosGastos = parseFloat(formData.otros_gastos) || 0;
      const deduccion = parseFloat(formData.deduccion) || 0;
      
      // Validate inputs
      const validationResult = settlementSchema.safeParse({
        monto_diesel: montoDiesel,
        monto_casetas: montoCasetas,
        otros_gastos: otrosGastos,
        deduccion: deduccion,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Error de validación",
          description: firstError.message,
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const montoTotal = trip.flete;
      const montoNeto = montoOperador - deduccion;

      const count = settlements.length + 1;
      const folio = `LIQ-${new Date().getFullYear()}-${String(count).padStart(6, '0')}`;

      // Get client_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", user.id)
        .single();

      if (!profile?.client_id) throw new Error("No client_id found");

      const { error } = await supabase
        .from("liquidaciones")
        .insert({
          viaje_id: formData.viaje_id,
          folio: folio,
          monto_total: montoTotal,
          monto_operador: montoOperador,
          monto_diesel: montoDiesel,
          monto_casetas: montoCasetas,
          otros_gastos: otrosGastos,
          deduccion: deduccion,
          monto_neto: montoNeto,
          observaciones: formData.observaciones || null,
          client_id: profile.client_id,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Liquidación ${folio} creada exitosamente`,
      });

      setFormData({
        viaje_id: "",
        monto_diesel: "",
        monto_casetas: "",
        otros_gastos: "0",
        deduccion: "0",
        observaciones: "",
      });
      setIsDialogOpen(false);
      fetchTrips();
    } catch (error) {
      console.error("Error creating settlement:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la liquidación",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaySettlement = async (settlementId: string) => {
    try {
      const { error } = await supabase
        .from("liquidaciones")
        .update({
          estado: 'pagada',
          fecha_liquidacion: new Date().toISOString().split('T')[0]
        })
        .eq('id', settlementId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Liquidación marcada como pagada",
      });
    } catch (error) {
      console.error("Error updating settlement:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la liquidación",
        variant: "destructive",
      });
    }
  };

  const selectedTrip = trips.find(t => t.id === formData.viaje_id);
  const montoOperadorCalculado = selectedTrip ? selectedTrip.flete * 0.10 : 0;
  const deduccion = parseFloat(formData.deduccion) || 0;
  const montoNetoCalculado = montoOperadorCalculado - deduccion;

  const pendingSettlements = settlements.filter(s => s.estado === 'pendiente');
  const paidSettlements = settlements.filter(s => s.estado === 'pagada');
  const totalPending = pendingSettlements.reduce((sum, s) => sum + s.monto_neto, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <DollarSign className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Liquidaciones</h1>
            <p className="text-muted-foreground">Pagos a operadores por viajes completados</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {trips.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay viajes completados disponibles para liquidar
            </p>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" disabled={trips.length === 0}>
                <FileText className="h-4 w-4 mr-2" />
                Nueva Liquidación
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Liquidación</DialogTitle>
              <DialogDescription>
                {trips.length === 0 
                  ? "No hay viajes completados pendientes de liquidar"
                  : "Crear liquidación para viaje completado"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="viaje">Viaje Completado</Label>
                <Select
                  value={formData.viaje_id}
                  onValueChange={(value) => setFormData({ ...formData, viaje_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar viaje" />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map((trip) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.unidad} - {trip.operador} | {trip.origen} → {trip.destino} | ${trip.flete.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTrip && (
                <div className="p-4 bg-accent/10 rounded-lg border space-y-3">
                  <h4 className="font-semibold text-foreground">Resumen del Viaje</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Operador:</span>
                      <span className="font-medium">{selectedTrip.operador}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ruta:</span>
                      <span className="font-medium">{selectedTrip.origen} → {selectedTrip.destino}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distancia:</span>
                      <span className="font-medium">{selectedTrip.distancia_km} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Flete Total:</span>
                      <span className="font-semibold text-lg">${selectedTrip.flete.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Pago Operador (10%):</span>
                      <span className="font-semibold text-primary">${montoOperadorCalculado.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="diesel">Monto Diesel</Label>
                  <Input
                    id="diesel"
                    type="number"
                    step="0.01"
                    min="0"
                    max="999999999.99"
                    placeholder="0.00"
                    value={formData.monto_diesel}
                    onChange={(e) => setFormData({ ...formData, monto_diesel: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="casetas">Monto Casetas</Label>
                  <Input
                    id="casetas"
                    type="number"
                    step="0.01"
                    min="0"
                    max="999999999.99"
                    placeholder="0.00"
                    value={formData.monto_casetas}
                    onChange={(e) => setFormData({ ...formData, monto_casetas: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otros">Otros Gastos</Label>
                  <Input
                    id="otros"
                    type="number"
                    step="0.01"
                    min="0"
                    max="999999999.99"
                    placeholder="0.00"
                    value={formData.otros_gastos}
                    onChange={(e) => setFormData({ ...formData, otros_gastos: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deduccion">Deducciones</Label>
                  <Input
                    id="deduccion"
                    type="number"
                    step="0.01"
                    min="0"
                    max="999999999.99"
                    placeholder="0.00"
                    value={formData.deduccion}
                    onChange={(e) => setFormData({ ...formData, deduccion: e.target.value })}
                  />
                </div>
              </div>

              {selectedTrip && (
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Monto Neto a Pagar:</span>
                    <span className="text-2xl font-bold text-primary">${montoNetoCalculado.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Notas adicionales"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90"
                  disabled={submitting}
                >
                  {submitting ? "Creando..." : "Crear Liquidación"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Liquidaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{settlements.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registradas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{pendingSettlements.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Por pagar</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{paidSettlements.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Completadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">${(totalPending / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground mt-1">A liquidar</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Liquidaciones Registradas</CardTitle>
          <CardDescription>Historial de pagos por viajes completados ({trips.length} viajes pendientes)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : settlements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay liquidaciones registradas
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((settlement) => (
                <div
                  key={settlement.id}
                  className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{settlement.folio}</h4>
                        {settlement.estado === "pagada" && (
                          <Badge className="bg-accent text-accent-foreground">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pagada
                          </Badge>
                        )}
                        {settlement.estado === "pendiente" && (
                          <Badge variant="secondary">
                            Pendiente
                          </Badge>
                        )}
                        {settlement.estado === "cancelada" && (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancelada
                          </Badge>
                        )}
                      </div>
                      {settlement.viaje && (
                        <div className="grid gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            <span>{settlement.viaje.unidad} - {settlement.viaje.operador}</span>
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Ruta:</span> {settlement.viaje.origen} → {settlement.viaje.destino}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Creado: {new Date(settlement.created_at).toLocaleDateString("es-MX")}</span>
                            {settlement.fecha_liquidacion && (
                              <span>• Pagado: {new Date(settlement.fecha_liquidacion).toLocaleDateString("es-MX")}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Monto Neto</p>
                        <p className="text-2xl font-bold text-primary">${settlement.monto_neto.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        {settlement.estado === 'pendiente' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePaySettlement(settlement.id)}
                          >
                            Marcar Pagada
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedSettlement(settlement);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de Liquidación</DialogTitle>
            <DialogDescription>Información completa del pago</DialogDescription>
          </DialogHeader>
          {selectedSettlement && (
            <div className="space-y-4">
              <div className="p-4 bg-accent/10 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Folio:</span>
                  <span className="text-lg">{selectedSettlement.folio}</span>
                </div>
                <Badge variant={selectedSettlement.estado === "pagada" ? "default" : "secondary"}>
                  {selectedSettlement.estado}
                </Badge>
              </div>

              {selectedSettlement.viaje && (
                <div>
                  <h4 className="font-semibold mb-2">Información del Viaje</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Operador:</span>
                      <span className="font-medium">{selectedSettlement.viaje.operador}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unidad:</span>
                      <span className="font-medium">{selectedSettlement.viaje.unidad}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ruta:</span>
                      <span className="font-medium">{selectedSettlement.viaje.origen} → {selectedSettlement.viaje.destino}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cliente:</span>
                      <span className="font-medium">{selectedSettlement.viaje.cliente}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Desglose de Montos</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>Flete Total:</span>
                    <span className="font-semibold">${selectedSettlement.monto_total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2">
                    <span>Pago Operador (10%):</span>
                    <span className="font-semibold text-primary">${selectedSettlement.monto_operador.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>Diesel:</span>
                    <span>${selectedSettlement.monto_diesel.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2">
                    <span>Casetas:</span>
                    <span>${selectedSettlement.monto_casetas.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>Otros Gastos:</span>
                    <span>${selectedSettlement.otros_gastos.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2">
                    <span className="text-destructive">Deducciones:</span>
                    <span className="text-destructive">-${selectedSettlement.deduccion.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-primary/10 rounded border border-primary/20 mt-2">
                    <span className="font-semibold">Monto Neto:</span>
                    <span className="text-xl font-bold text-primary">${selectedSettlement.monto_neto.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedSettlement.observaciones && (
                <div>
                  <h4 className="font-semibold mb-2">Observaciones</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
                    {selectedSettlement.observaciones}
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <div>Creado: {new Date(selectedSettlement.created_at).toLocaleString("es-MX")}</div>
                {selectedSettlement.fecha_liquidacion && (
                  <div>Pagado: {new Date(selectedSettlement.fecha_liquidacion).toLocaleString("es-MX")}</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
