import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Shield, QrCode, CheckCircle2, Clock, MapPin, AlertTriangle, User, Camera } from "lucide-react";
import QRScanner from "@/components/QRScanner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface SecurityZone {
  id: string;
  nombre: string;
  codigo_qr: string;
  ubicacion: string;
  activa: boolean;
}

export default function SecurityRounds() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [rounds, setRounds] = useState<SecurityRound[]>([]);
  const [zones, setZones] = useState<SecurityZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    zona_id: "",
    incidente: false,
    descripcion_incidente: "",
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchZones();
    fetchRounds();

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

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase
        .from("zonas_seguridad")
        .select("*")
        .eq('activa', true)
        .order("nombre", { ascending: true });

      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error("Error fetching zones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las zonas de seguridad",
        variant: "destructive",
      });
    }
  };

  const fetchRounds = async () => {
    try {
      const { data: roundsData, error: roundsError } = await supabase
        .from("rondines")
        .select("*")
        .order("created_at", { ascending: false });

      if (roundsError) throw roundsError;

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage || !user) return null;

    setUploadingImage(true);
    try {
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('fotos-rondines')
        .upload(filePath, selectedImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('fotos-rondines')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.zona_id) {
      toast({
        title: "Error",
        description: "Por favor seleccione una zona",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      let fotoUrl = null;
      
      if (selectedImage) {
        fotoUrl = await uploadImage();
      }

      const selectedZone = zones.find(z => z.id === formData.zona_id);
      
      const { error } = await supabase
        .from("rondines")
        .insert({
          ubicacion: selectedZone?.ubicacion || "",
          codigo_qr: selectedZone?.codigo_qr || "",
          incidente: formData.incidente,
          descripcion_incidente: formData.incidente ? formData.descripcion_incidente : null,
          foto_url: fotoUrl,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Rondín registrado exitosamente",
      });

      setFormData({
        zona_id: "",
        incidente: false,
        descripcion_incidente: "",
      });
      setSelectedImage(null);
      setImagePreview(null);
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

  const handleQRScan = (qrCode: string) => {
    const zone = zones.find(z => z.codigo_qr === qrCode);
    if (zone) {
      setFormData({ ...formData, zona_id: zone.id });
      toast({
        title: "QR Escaneado",
        description: `Zona detectada: ${zone.nombre}`,
      });
    } else {
      toast({
        title: "Código no encontrado",
        description: "El código QR no corresponde a ninguna zona registrada",
        variant: "destructive",
      });
    }
    setShowQRScanner(false);
  };

  const todayRounds = rounds.filter(
    (r) => new Date(r.created_at).toDateString() === new Date().toDateString()
  );
  const completedRounds = todayRounds.length;
  const incidentsToday = todayRounds.filter((r) => r.incidente).length;
  const zonesCheckedToday = new Set(todayRounds.map(r => r.codigo_qr)).size;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rondines de Seguridad</h1>
            <p className="text-muted-foreground">Inspección de {zones.length} zonas con registro QR</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <QrCode className="h-4 w-4 mr-2" />
              Nuevo Rondín
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Rondín de Seguridad</DialogTitle>
              <DialogDescription>Escanee el código QR o seleccione la zona manualmente</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zona">Zona de Seguridad</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.zona_id}
                    onValueChange={(value) => setFormData({ ...formData, zona_id: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar zona" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.nombre} - {zone.ubicacion} ({zone.codigo_qr})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={() => setShowQRScanner(true)}>
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Haga clic en el botón con la cámara para escanear el código QR de la zona
                </p>
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
              <div className="space-y-2">
                <Label htmlFor="zone-photo">Fotografía de la Zona</Label>
                <Input
                  id="zone-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                {imagePreview && (
                  <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Fotografía del estado actual de la zona
                </p>
              </div>
              {formData.incidente && (
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
              )}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting || uploadingImage}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  disabled={submitting || uploadingImage}
                >
                  {submitting ? "Registrando..." : uploadingImage ? "Subiendo imagen..." : "Registrar Rondín"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Zonas Verificadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{zonesCheckedToday}/{zones.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Hoy</p>
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
          <CardTitle>Zonas de Seguridad ({zones.length})</CardTitle>
          <CardDescription>Puntos de verificación con código QR</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {zones.map((zone) => {
              const zoneRoundsToday = todayRounds.filter(r => r.codigo_qr === zone.codigo_qr);
              const hasIncidents = zoneRoundsToday.some(r => r.incidente);
              
              return (
                <div
                  key={zone.id}
                  className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-foreground">{zone.nombre}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{zone.ubicacion}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {zone.codigo_qr}
                        </Badge>
                        {zoneRoundsToday.length > 0 && (
                          <Badge variant={hasIncidents ? "destructive" : "default"} className="text-xs">
                            {zoneRoundsToday.length} hoy
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                        {round.foto_url && (
                          <div className="mt-2">
                            <img 
                              src={round.foto_url} 
                              alt="Foto del incidente" 
                              className="w-full max-w-md h-48 object-cover rounded-lg border"
                            />
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

      {showQRScanner && (
        <QRScanner 
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
}
