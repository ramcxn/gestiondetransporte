import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, QrCode, Download, Trash2, Pencil, ArrowUp, ArrowDown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";


interface SecurityZone {
  id: string;
  nombre: string;
  codigo_qr: string;
  ubicacion: string;
  activa: boolean;
  orden: number;
  created_at: string;
  created_by: string;
}


export default function SecurityZones() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<SecurityZone | null>(null);
  const [zones, setZones] = useState<SecurityZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    ubicacion: "",
  });


  useEffect(() => {
    fetchZones();

    const channel = supabase
      .channel('zones-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'zonas_seguridad'
        },
        () => {
          fetchZones();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase
        .from("zonas_seguridad")
        .select("*")
        .order("orden", { ascending: true })
        .order("nombre", { ascending: true });


      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error("Error fetching zones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las zonas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = () => {
    // Generate unique QR code with prefix and timestamp
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `ZONA-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      if (editingZone) {
        const { error } = await supabase
          .from("zonas_seguridad")
          .update({ nombre: formData.nombre, ubicacion: formData.ubicacion })
          .eq('id', editingZone.id);
        if (error) throw error;
        toast({ title: "Éxito", description: `Zona "${formData.nombre}" actualizada` });
      } else {
        const codigoQR = generateQRCode();
        const { data: profile } = await supabase
          .from("profiles").select("client_id").eq("id", user.id).single();
        if (!profile?.client_id) throw new Error("No client_id found");

        const maxOrden = zones.reduce((m, z) => Math.max(m, z.orden ?? 0), 0);
        const { error } = await supabase
          .from("zonas_seguridad")
          .insert({
            nombre: formData.nombre,
            ubicacion: formData.ubicacion,
            codigo_qr: codigoQR,
            activa: true,
            orden: maxOrden + 1,
            client_id: profile.client_id,
            created_by: user.id,
          });
        if (error) throw error;
        toast({ title: "Éxito", description: `Zona "${formData.nombre}" creada` });
      }

      setFormData({ nombre: "", ubicacion: "" });
      setEditingZone(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving zone:", error);
      toast({ title: "Error", description: "No se pudo guardar la zona", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (zone: SecurityZone) => {
    setEditingZone(zone);
    setFormData({ nombre: zone.nombre, ubicacion: zone.ubicacion });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingZone(null);
    setFormData({ nombre: "", ubicacion: "" });
    setIsDialogOpen(true);
  };

  const moveZone = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= zones.length) return;
    const a = zones[index];
    const b = zones[target];
    // Optimistic swap
    const newZones = [...zones];
    newZones[index] = { ...b, orden: a.orden };
    newZones[target] = { ...a, orden: b.orden };
    setZones(newZones);
    try {
      await Promise.all([
        supabase.from("zonas_seguridad").update({ orden: b.orden }).eq('id', a.id),
        supabase.from("zonas_seguridad").update({ orden: a.orden }).eq('id', b.id),
      ]);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo reordenar", variant: "destructive" });
      fetchZones();
    }
  };


  const toggleZoneStatus = async (zoneId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("zonas_seguridad")
        .update({ activa: !currentStatus })
        .eq('id', zoneId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Zona ${!currentStatus ? "activada" : "desactivada"}`,
      });
    } catch (error) {
      console.error("Error updating zone:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la zona",
        variant: "destructive",
      });
    }
  };

  const deleteZone = async (zoneId: string) => {
    if (!confirm("¿Está seguro de eliminar esta zona? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("zonas_seguridad")
        .delete()
        .eq('id', zoneId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Zona eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error deleting zone:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la zona",
        variant: "destructive",
      });
    }
  };

  const activeZones = zones.filter(z => z.activa);
  const inactiveZones = zones.filter(z => !z.activa);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Zonas de Seguridad</h1>
            <p className="text-muted-foreground">Gestión de zonas con códigos QR automáticos</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingZone(null); setFormData({ nombre: "", ubicacion: "" }); } }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Zona
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingZone ? "Editar Zona de Seguridad" : "Crear Zona de Seguridad"}</DialogTitle>
              <DialogDescription>
                {editingZone ? "Modifique los datos de la zona. El código QR no cambia." : "Se generará automáticamente un código QR único para esta zona"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la Zona</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Almacén Principal"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ubicacion">Ubicación</Label>
                <Input
                  id="ubicacion"
                  placeholder="Ej: Planta Baja, Área Norte"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  required
                />
              </div>

              {!editingZone && (
                <div className="p-4 bg-accent/10 rounded-lg border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <QrCode className="h-4 w-4" />
                    <span>El código QR se generará automáticamente al crear la zona</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={submitting}>
                  {submitting ? "Guardando..." : editingZone ? "Guardar Cambios" : "Crear Zona"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Zonas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{zones.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registradas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zonas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{activeZones.length}</div>
            <p className="text-xs text-muted-foreground mt-1">En operación</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zonas Inactivas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{inactiveZones.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Deshabilitadas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Zonas Registradas</CardTitle>
          <CardDescription>Listado completo de zonas de seguridad con códigos QR</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : zones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay zonas registradas. Cree una nueva zona para comenzar.
            </div>
          ) : (
            <div className="space-y-4">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-foreground text-lg">{zone.nombre}</h4>
                        <Badge variant={zone.activa ? "default" : "secondary"}>
                          {zone.activa ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{zone.ubicacion}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4" />
                          <span className="font-mono">{zone.codigo_qr}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="bg-white p-2 rounded-lg border">
                        <QRCodeGenerator value={zone.codigo_qr} size={120} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const canvas = document.querySelector(`canvas[data-qr="${zone.codigo_qr}"]`) as HTMLCanvasElement;
                            if (canvas) {
                              const url = canvas.toDataURL("image/png");
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `QR-${zone.nombre.replace(/\s+/g, "-")}.png`;
                              a.click();
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Descargar QR
                        </Button>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={zone.activa}
                            onCheckedChange={() => toggleZoneStatus(zone.id, zone.activa)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {zone.activa ? "Activa" : "Inactiva"}
                          </span>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteZone(zone.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
}
