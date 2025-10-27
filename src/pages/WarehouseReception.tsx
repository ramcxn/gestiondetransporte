import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Truck, PackageCheck, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

export default function WarehouseReception() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRefaccion, setSelectedRefaccion] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: refacciones } = useQuery({
    queryKey: ["refacciones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refacciones")
        .select("*")
        .eq("activa", true)
        .order("numero_parte");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: ubicaciones } = useQuery({
    queryKey: ["ubicaciones_almacen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ubicaciones_almacen")
        .select("*")
        .eq("activa", true)
        .order("codigo");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: recepciones, isLoading } = useQuery({
    queryKey: ["recepciones_recientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventario_refacciones")
        .select(`
          *,
          refacciones (numero_parte, descripcion),
          ubicaciones_almacen (codigo, descripcion)
        `)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  const refaccionSeleccionada = refacciones?.find(r => r.id === selectedRefaccion);

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Insertar en inventario
      const { data: inventario, error: inventarioError } = await supabase
        .from("inventario_refacciones")
        .insert([
          {
            refaccion_id: formData.refaccion_id,
            numero_serie: formData.numero_serie || null,
            lote: formData.lote,
            fecha_recepcion: formData.fecha_recepcion,
            fecha_caducidad: formData.fecha_caducidad || null,
            ubicacion_id: formData.ubicacion_id,
            costo_unitario: formData.costo_unitario,
            proveedor: formData.proveedor,
            documento_recepcion: formData.documento_recepcion,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (inventarioError) throw inventarioError;

      // Registrar movimiento
      const { error: movimientoError } = await supabase
        .from("movimientos_refacciones")
        .insert([
          {
            tipo_movimiento: "entrada",
            refaccion_id: formData.refaccion_id,
            inventario_id: inventario.id,
            cantidad: 1,
            ubicacion_destino: formData.ubicacion_id,
            costo_unitario: formData.costo_unitario,
            costo_total: formData.costo_unitario,
            documento_referencia: formData.documento_recepcion,
            created_by: user.id,
          },
        ]);

      if (movimientoError) throw movimientoError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recepciones_recientes"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-stats"] });
      toast({ title: "Recepción registrada exitosamente" });
      setIsDialogOpen(false);
      setSelectedRefaccion("");
    },
    onError: (error: any) => {
      toast({
        title: "Error al registrar recepción",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      refaccion_id: formData.get("refaccion_id"),
      numero_serie: formData.get("numero_serie"),
      lote: formData.get("lote"),
      fecha_recepcion: formData.get("fecha_recepcion"),
      fecha_caducidad: formData.get("fecha_caducidad"),
      ubicacion_id: formData.get("ubicacion_id"),
      costo_unitario: parseFloat(formData.get("costo_unitario") as string),
      proveedor: formData.get("proveedor"),
      documento_recepcion: formData.get("documento_recepcion"),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/almacen">
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Almacén
        </Button>
      </Link>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recepción de Refacciones</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Recepción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Entrada de Refacción</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refaccion_id">Refacción *</Label>
                <Select 
                  name="refaccion_id" 
                  value={selectedRefaccion}
                  onValueChange={setSelectedRefaccion}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar refacción" />
                  </SelectTrigger>
                  <SelectContent>
                    {refacciones?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.numero_parte} - {r.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {refaccionSeleccionada?.requiere_serie && (
                <div className="space-y-2">
                  <Label htmlFor="numero_serie">Número de Serie *</Label>
                  <Input id="numero_serie" name="numero_serie" required />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lote">Lote</Label>
                  <Input id="lote" name="lote" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_recepcion">Fecha Recepción *</Label>
                  <Input id="fecha_recepcion" name="fecha_recepcion" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} required />
                </div>
              </div>

              {refaccionSeleccionada?.tiene_caducidad && (
                <div className="space-y-2">
                  <Label htmlFor="fecha_caducidad">Fecha de Caducidad *</Label>
                  <Input id="fecha_caducidad" name="fecha_caducidad" type="date" required />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="ubicacion_id">Ubicación *</Label>
                <Select name="ubicacion_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    {ubicaciones?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.codigo} - {u.descripcion || u.tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costo_unitario">Costo Unitario *</Label>
                  <Input id="costo_unitario" name="costo_unitario" type="number" step="0.01" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proveedor">Proveedor *</Label>
                  <Input id="proveedor" name="proveedor" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documento_recepcion">Documento de Recepción</Label>
                <Input id="documento_recepcion" name="documento_recepcion" placeholder="Ej: OC-12345, Factura-ABC" />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recepciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recepciones?.map((recepcion: any) => (
              <div key={recepcion.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  <PackageCheck className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{recepcion.refacciones?.numero_parte}</h4>
                      <p className="text-sm text-muted-foreground">{recepcion.refacciones?.descripcion}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">
                        {format(new Date(recepcion.created_at), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {recepcion.numero_serie && (
                      <div>
                        <span className="text-muted-foreground">Serie:</span>
                        <p className="font-medium">{recepcion.numero_serie}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Ubicación:</span>
                      <p className="font-medium">{recepcion.ubicaciones_almacen?.codigo}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Proveedor:</span>
                      <p className="font-medium">{recepcion.proveedor}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Costo:</span>
                      <p className="font-medium">${recepcion.costo_unitario}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {recepciones?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No hay recepciones registradas</p>
              <p className="text-sm text-muted-foreground">Comienza registrando tu primera recepción</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}