import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Building2, Clock, User, LogOut, Camera, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import VisitsReportDialog from "@/components/VisitsReportDialog";

interface Visit {
  id: string;
  nombre: string;
  empresa: string;
  tipo: string;
  motivo: string;
  area_visita: string;
  credencial_url: string | null;
  estado: string;
  created_at: string;
  fecha_salida: string | null;
  created_by: string;
  creator_name?: string;
}

export default function Visits() {
  const [visitorType, setVisitorType] = useState<"visitante" | "proveedor">("visitante");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    motivo: "",
    area_visita: "",
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const loadClientId = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("client_id")
          .eq("id", user.id)
          .single();
        
        if (data) {
          setClientId(data.client_id);
        }
      }
    };

    loadClientId();
    fetchVisits();

    const channel = supabase
      .channel('visits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visitas'
        },
        () => {
          fetchVisits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchVisits = async () => {
    try {
      const { data: visitsData, error: visitsError } = await supabase
        .from("visitas")
        .select("*")
        .order("created_at", { ascending: false });

      if (visitsError) throw visitsError;

      const userIds = [...new Set(visitsData?.map(v => v.created_by) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);
      
      const enrichedVisits = visitsData?.map(visit => ({
        ...visit,
        creator_name: profilesMap.get(visit.created_by) || "Usuario"
      })) || [];

      setVisits(enrichedVisits);
    } catch (error) {
      console.error("Error fetching visits:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las visitas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCameraCapture = (videoElement: HTMLVideoElement) => {
    try {
      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('No se pudo obtener el contexto del canvas');
      }
      
      ctx.drawImage(videoElement, 0, 0);
      
      // Convert to blob and file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `credencial-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setSelectedImage(file);
          setImagePreview(canvas.toDataURL('image/jpeg'));
          setShowCamera(false);
          
          toast({
            title: "Éxito",
            description: "Foto capturada exitosamente",
          });
        }
      }, 'image/jpeg', 0.95);
      
    } catch (error) {
      console.error("Error capturing photo:", error);
      toast({
        title: "Error",
        description: "No se pudo capturar la foto",
        variant: "destructive",
      });
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
        .from('credenciales-visitas')
        .upload(filePath, selectedImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('credenciales-visitas')
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
    if (!user || !clientId) {
      toast({
        title: "Error",
        description: "No se pudo obtener la información del usuario",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      let credencialUrl = null;
      
      if (selectedImage) {
        credencialUrl = await uploadImage();
        if (!credencialUrl) {
          setSubmitting(false);
          return;
        }
      }

      const { error } = await supabase
        .from("visitas")
        .insert({
          nombre: formData.nombre,
          empresa: formData.empresa,
          tipo: visitorType,
          motivo: formData.motivo,
          area_visita: formData.area_visita,
          credencial_url: credencialUrl,
          estado: 'en_instalaciones',
          created_by: user.id,
          client_id: clientId,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `${visitorType === "visitante" ? "Visitante" : "Proveedor"} registrado exitosamente`,
      });

      setFormData({
        nombre: "",
        empresa: "",
        motivo: "",
        area_visita: "",
      });
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error submitting visit:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar la visita",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExit = async (visitId: string) => {
    try {
      const { error } = await supabase
        .from("visitas")
        .update({
          estado: 'salio',
          fecha_salida: new Date().toISOString()
        })
        .eq('id', visitId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Salida registrada exitosamente",
      });
    } catch (error) {
      console.error("Error recording exit:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar la salida",
        variant: "destructive",
      });
    }
  };

  const todayVisits = visits.filter(
    (v) => new Date(v.created_at).toDateString() === new Date().toDateString()
  );
  const activeVisits = todayVisits.filter((v) => v.estado === "en_instalaciones");
  const activeVisitors = activeVisits.filter((v) => v.tipo === "visitante");
  const activeProviders = activeVisits.filter((v) => v.tipo === "proveedor");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Users className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Visitas y Proveedores</h1>
            <p className="text-muted-foreground">Control de acceso con registro fotográfico</p>
          </div>
        </div>
        <VisitsReportDialog />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Nuevo Registro</CardTitle>
              <CardDescription>Ingrese los datos del visitante o proveedor</CardDescription>
            </div>
            <Select value={visitorType} onValueChange={(value: "visitante" | "proveedor") => setVisitorType(value)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visitante">Visitante</SelectItem>
                <SelectItem value="proveedor">Proveedor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                placeholder="Ej: Juan Pérez García"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                placeholder="Ej: ABC Logistics"
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo de Visita</Label>
              <Textarea
                id="reason"
                placeholder="Describa el motivo de la visita"
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Área a Visitar</Label>
              <Input
                id="area"
                placeholder="Ej: Almacén, Oficinas, Patio"
                value={formData.area_visita}
                onChange={(e) => setFormData({ ...formData, area_visita: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credential">Fotografía de Credencial</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCamera(true)}
                    className="flex-1"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Tomar Foto
                  </Button>
                </div>
                {imagePreview && (
                  <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImagePreview(null);
                        setSelectedImage(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Tome una foto de la identificación oficial
                </p>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={submitting || uploadingImage}
            >
              {submitting ? "Registrando..." : uploadingImage ? "Subiendo imagen..." : "Registrar Entrada"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Visitantes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeVisitors.length}</div>
            <p className="text-xs text-muted-foreground mt-1">En instalaciones</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Proveedores Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeProviders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">En instalaciones</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Registros Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{todayVisits.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Entradas registradas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Accesos Recientes</CardTitle>
          <CardDescription>Personas actualmente en las instalaciones</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : activeVisits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay visitantes activos
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {activeVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="p-3 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{visit.nombre}</h4>
                        <Badge variant={visit.tipo === "visitante" ? "default" : "secondary"}>
                          {visit.tipo}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                        <Building2 className="h-3 w-3" />
                        {visit.empresa}
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            Entrada: {new Date(visit.created_at).toLocaleDateString("es-MX")} •{" "}
                            {new Date(visit.created_at).toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p>
                          <strong>Área:</strong> {visit.area_visita}
                        </p>
                      </div>
                    </div>
                    {visit.estado === "en_instalaciones" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExit(visit.id)}
                        className="w-full sm:w-auto"
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Salida
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Historial Completo</CardTitle>
          <CardDescription>Todas las visitas registradas (incluyendo salidas)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay visitas registradas
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {visits.slice(0, 20).map((visit) => (
                <div
                  key={visit.id}
                  className="p-3 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-foreground">{visit.nombre}</h4>
                        <Badge variant={visit.tipo === "visitante" ? "default" : "secondary"}>
                          {visit.tipo}
                        </Badge>
                        <Badge variant={visit.estado === "en_instalaciones" ? "default" : "outline"}>
                          {visit.estado === "en_instalaciones" ? "En instalaciones" : "Salió"}
                        </Badge>
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{visit.empresa}</span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            Entrada: {new Date(visit.created_at).toLocaleDateString("es-MX")} •{" "}
                            {new Date(visit.created_at).toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {visit.fecha_salida && (
                          <div className="flex items-center gap-2">
                            <LogOut className="h-3 w-3" />
                            <span>
                              Salida: {new Date(visit.fecha_salida).toLocaleDateString("es-MX")} •{" "}
                              {new Date(visit.fecha_salida).toLocaleTimeString("es-MX", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>Registrado por: {visit.creator_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

function CameraCapture({ 
  onCapture, 
  onClose 
}: { 
  onCapture: (videoElement: HTMLVideoElement) => void; 
  onClose: () => void 
}) {
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment', 
            width: { ideal: 1920 }, 
            height: { ideal: 1080 } 
          }
        });
        currentStream = mediaStream;
        setStream(mediaStream);
      } catch (error) {
        console.error("Error starting camera:", error);
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef) {
      onCapture(videoRef);
      // Stop the camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
          onClick={() => {
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
            }
            onClose();
          }}
        >
          <X className="h-6 w-6" />
        </Button>
        
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={(ref) => {
              if (ref && stream && !videoRef) {
                ref.srcObject = stream;
                ref.play();
                setVideoRef(ref);
              }
            }}
            autoPlay
            playsInline
            className="w-full h-auto"
          />
          
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <Button
              size="lg"
              onClick={handleCapture}
              className="rounded-full h-16 w-16 bg-white hover:bg-gray-200"
            >
              <Camera className="h-8 w-8 text-black" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
