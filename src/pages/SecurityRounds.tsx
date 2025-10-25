import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Shield, QrCode, Camera, CheckCircle2, Clock, MapPin, AlertTriangle, User } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SecurityRound {
  id: string;
  ubicacion: string;
  codigo_qr: string;
  incidente: boolean;
  descripcion_incidente: string | null;
  foto_url: string | null;
  created_at: string;
  created_by: string;
  creator_name?: string;
}

export default function SecurityRounds() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rounds, setRounds] = useState<SecurityRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    ubicacion: "",
    codigo_qr: "",
    incidente: false,
    descripcion_incidente: "",
  });

  useEffect(() => {
    fetchRounds();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('rounds-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rondines'
        },
        () => {
          fetchRounds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRounds = async () => {
    try {
      const { data: roundsData, error: roundsError } = await supabase
        .from("rondines")
        .select("*")
        .order("created_at", { ascending: false });

      if (roundsError) throw roundsError;

      // Fetch creator names
      const userIds = [...new Set(roundsData?.map(r => r.created_by) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);
      
      const enrichedRounds = roundsData?.map(round => ({
        ...round,
        creator_name: profilesMap.get(round.created_by) || "Usuario"
      })) || [];

      setRounds(enrichedRounds);
    } catch (error) {
      console.error("Error fetching rounds:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los rondines",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("rondines")
        .insert({
          ubicacion: formData.ubicacion,
          codigo_qr: formData.codigo_qr,
          incidente: formData.incidente,
          descripcion_incidente: formData.incidente ? formData.descripcion_incidente : null,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Rondín registrado exitosamente",
      });

      setFormData({
        ubicacion: "",
        codigo_qr: "",
        incidente: false,
        descripcion_incidente: "",
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error submitting round:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el rondín",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const todayRounds = rounds.filter(
    (r) => new Date(r.created_at).toDateString() === new Date().toDateString()
  );
  const completedRounds = todayRounds.length;
  const incidentsToday = todayRounds.filter((r) => r.incidente).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rondines de Seguridad</h1>
            <p className="text-muted-foreground">Inspección de instalaciones con registro QR</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <QrCode className="h-4 w-4 mr-2" />
              Nuevo Rondín
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Rondín de Seguridad</DialogTitle>
              <DialogDescription>Complete la información del punto de verificación</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ubicacion">Ubicación / Zona</Label>
                <Input
                  id="ubicacion"
                  placeholder="Ej: Zona A - Almacén Principal"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo_qr">Código QR</Label>
                <div className="flex gap-2">
                  <Input
                    id="codigo_qr"
                    placeholder="Escanee el código QR"
                    value={formData.codigo_qr}
                    onChange={(e) => setFormData({ ...formData, codigo_qr: e.target.value })}
                    required
                  />
                  <Button type="button" variant="outline">
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incidente"
                  checked={formData.incidente}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, incidente: checked as boolean })
                  }
                />
                <Label htmlFor="incidente" className="cursor-pointer">
                  ¿Se encontró algún incidente?
                </Label>
              </div>
              {formData.incidente && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción del Incidente</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Describa el incidente encontrado"
                      value={formData.descripcion_incidente}
                      onChange={(e) =>
                        setFormData({ ...formData, descripcion_incidente: e.target.value })
                      }
                      required={formData.incidente}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fotografía del Incidente</Label>
                    <Button type="button" variant="outline" className="w-full">
                      <Camera className="h-4 w-4 mr-2" />
                      Capturar Imagen
                    </Button>
                  </div>
                </>
              )}
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
                  {submitting ? "Registrando..." : "Registrar Rondín"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rondines Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{todayRounds.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Completados</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Checkpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{rounds.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Todos los registros</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incidentes Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{incidentsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {incidentsToday > 0 ? "Documentados" : "Sin incidentes"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Historial de Rondines</CardTitle>
          <CardDescription>Registro completo de inspecciones de seguridad</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : rounds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay rondines registrados
            </div>
          ) : (
            <div className="space-y-3">
              {rounds.map((round) => (
                <div
                  key={round.id}
                  className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-foreground">{round.ubicacion}</h4>
                        {round.incidente ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Incidente Reportado
                          </Badge>
                        ) : (
                          <Badge className="bg-accent text-accent-foreground">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Sin Incidentes
                          </Badge>
                        )}
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(round.created_at).toLocaleDateString("es-MX")} •{" "}
                            {new Date(round.created_at).toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4" />
                          <span>Código: {round.codigo_qr}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Guardia: {round.creator_name}</span>
                        </div>
                        {round.incidente && round.descripcion_incidente && (
                          <div className="mt-2 p-2 bg-destructive/10 rounded text-sm border border-destructive/20">
                            <strong className="text-destructive">Incidente:</strong>{" "}
                            {round.descripcion_incidente}
                          </div>
                        )}
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
