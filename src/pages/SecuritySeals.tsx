import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tag, Plus, CheckCircle, History, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Seal {
  id: string;
  numero_sello: string;
  estado: string;
  tipo: string;
  viaje_id: string | null;
  unidad: string | null;
  fecha_asignacion: string | null;
  created_at: string;
}

export default function SecuritySeals() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedSeal, setSelectedSeal] = useState<Seal | null>(null);
  const [seals, setSeals] = useState<Seal[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const [assignData, setAssignData] = useState({
    viaje_id: "",
    unidad: "",
  });

  useEffect(() => {
    fetchSeals();
    fetchTrips();
  }, []);

  const fetchSeals = async () => {
    try {
      const { data, error } = await supabase
        .from("sellos_seguridad")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSeals(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrips = async () => {
    const { data } = await supabase
      .from("viajes")
      .select("*")
      .in('estado', ['programado', 'en_transito'])
      .order("fecha_salida", { ascending: true });
    setTrips(data || []);
  };

  const fetchHistory = async (sealId: string) => {
    const { data } = await supabase
      .from("historial_sellos")
      .select("*")
      .eq('sello_id', sealId)
      .order("created_at", { ascending: false });
    setHistory(data || []);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSeal) return;

    try {
      const { error: updateError } = await supabase
        .from("sellos_seguridad")
        .update({
          estado: 'asignado',
          viaje_id: assignData.viaje_id || null,
          unidad: assignData.unidad,
          fecha_asignacion: new Date().toISOString()
        })
        .eq('id', selectedSeal.id);

      if (updateError) throw updateError;

      await supabase.from("historial_sellos").insert({
        sello_id: selectedSeal.id,
        accion: 'asignado',
        viaje_id: assignData.viaje_id || null,
        unidad: assignData.unidad,
        descripcion: `Asignado a ${assignData.unidad}`,
        created_by: user.id,
      });

      toast({ title: "Éxito", description: "Sello asignado exitosamente" });
      setIsAssignDialogOpen(false);
      fetchSeals();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo asignar el sello", variant: "destructive" });
    }
  };

  const openHistory = async (seal: Seal) => {
    setSelectedSeal(seal);
    await fetchHistory(seal.id);
    setIsHistoryDialogOpen(true);
  };

  const available = seals.filter(s => s.estado === 'disponible');
  const assigned = seals.filter(s => s.estado === 'asignado');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Tag className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sellos de Seguridad</h1>
            <p className="text-muted-foreground">Control y asignación a viajes/unidades</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{seals.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Disponibles</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-accent">{available.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Asignados</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-primary">{assigned.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">En Uso</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{assigned.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Sellos Registrados</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {seals.map((seal) => (
              <div key={seal.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Tag className="h-4 w-4" />
                  <div>
                    <p className="font-medium">{seal.numero_sello}</p>
                    {seal.unidad && <p className="text-sm text-muted-foreground">Asignado: {seal.unidad}</p>}
                  </div>
                  <Badge variant={seal.estado === 'disponible' ? 'default' : 'secondary'}>{seal.estado}</Badge>
                </div>
                <div className="flex gap-2">
                  {seal.estado === 'disponible' && (
                    <Button size="sm" onClick={() => { setSelectedSeal(seal); setIsAssignDialogOpen(true); }}>Asignar</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openHistory(seal)}><History className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Asignar Sello</DialogTitle></DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="space-y-2">
              <Label>Viaje (opcional)</Label>
              <Select value={assignData.viaje_id} onValueChange={(v) => setAssignData({...assignData, viaje_id: v})}>
                <SelectTrigger><SelectValue placeholder="Sin viaje" /></SelectTrigger>
                <SelectContent>{trips.map(t => <SelectItem key={t.id} value={t.id}>{t.unidad} - {t.origen}→{t.destino}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Input value={assignData.unidad} onChange={(e) => setAssignData({...assignData, unidad: e.target.value})} required />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Asignar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Historial del Sello {selectedSeal?.numero_sello}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="p-3 border rounded flex justify-between">
                <div>
                  <Badge>{h.accion}</Badge>
                  <p className="text-sm mt-1">{h.descripcion}</p>
                </div>
                <span className="text-xs text-muted-foreground"><Clock className="h-3 w-3 inline mr-1" />{new Date(h.created_at).toLocaleDateString("es-MX")}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
