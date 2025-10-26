import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Building2, Clock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Visit {
  id: string;
  nombre: string;
  empresa: string;
  tipo: string;
  motivo: string;
  area_visita: string;
  credencial_url: string | null;
  created_at: string;
  created_by: string;
  creator_name?: string;
}

export default function Visits() {
  const [visitorType, setVisitorType] = useState<"visitante" | "proveedor">("visitante");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    fetchVisits();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('visits-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
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
  }, []);

  const fetchVisits = async () => {
    try {
      const { data: visitsData, error: visitsError } = await supabase
        .from("visitas")
        .select("*")
        .order("created_at", { ascending: false });

      if (visitsError) throw visitsError;

      // Fetch creator names
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
    if (!user) return;

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
          created_by: user.id,
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

  const todayVisits = visits.filter(
    (v) => new Date(v.created_at).toDateString() === new Date().toDateString()
  );
  const activeVisits = todayVisits.filter((v) => v.tipo === "visitante");
  const activeProviders = todayVisits.filter((v) => v.tipo === "proveedor");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary rounded-lg">
          <Users className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visitas y Proveedores</h1>
          <p className="text-muted-foreground">Control de acceso con registro fotográfico</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Visitas Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeVisits.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Activas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Proveedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeProviders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">En instalaciones</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{visits.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Todos los registros</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
                  <div className="flex items-center gap-2">
                    <Input
                      id="credential"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                  </div>
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
                    Seleccione una foto de la identificación oficial
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

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Historial Reciente</CardTitle>
            <CardDescription>Últimas visitas y proveedores registrados</CardDescription>
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
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {visits.slice(0, 10).map((visit) => (
                  <div
                    key={visit.id}
                    className="p-3 rounded-lg border border-border hover:shadow-card transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground">{visit.nombre}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {visit.empresa}
                        </p>
                      </div>
                      <Badge variant={visit.tipo === "visitante" ? "default" : "secondary"}>
                        {visit.tipo}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(visit.created_at).toLocaleDateString("es-MX")} •{" "}
                          {new Date(visit.created_at).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>Registrado por: {visit.creator_name}</span>
                      </div>
                      <p className="mt-1">
                        <strong>Motivo:</strong> {visit.motivo}
                      </p>
                      <p>
                        <strong>Área:</strong> {visit.area_visita}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
