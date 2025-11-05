import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Plus, Search, Camera, Calendar, AlertCircle } from "lucide-react";

export default function DocumentalReview() {
  const { user, clientId } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState<Record<string, File>>({});
  
  const [formData, setFormData] = useState({
    numero_economico: "",
    placas: "",
    operador_nombre: "",
    empresa: "",
    vigencia_licencia: "",
    vigencia_analisis_fisicoquimico: "",
    vigencia_dictamen_humos: "",
    vigencia_poliza_seguro: "",
    observaciones: "",
  });

  const { data: unidades } = useQuery({
    queryKey: ["unidades_documentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unidades")
        .select("id, numero_economico, placas, tipo, marca, modelo")
        .order("numero_economico");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: operadores } = useQuery({
    queryKey: ["operadores_documentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operadores")
        .select("id, nombre")
        .eq("estado", "activo")
        .order("nombre");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: revisiones, isLoading } = useQuery({
    queryKey: ["revision_documental"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revision_documental")
        .select("*")
        .order("fecha_revision", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const uploadPhoto = async (file: File, type: string) => {
    if (!user) return null;
    
    const fileName = `${user.id}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
    
    const { error: uploadError } = await supabase.storage
      .from("documentos-unidades")
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from("documentos-unidades")
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user || !clientId) throw new Error("No authenticated user");
      
      const photoUrls: Record<string, string | null> = {};
      
      for (const [key, file] of Object.entries(uploadingPhotos)) {
        photoUrls[key] = await uploadPhoto(file, key);
      }
      
      const { error } = await supabase
        .from("revision_documental")
        .insert({
          ...data,
          foto_tarjeta_circulacion: photoUrls.tarjeta_circulacion,
          foto_poliza_seguro: photoUrls.poliza_seguro,
          foto_analisis_fisicoquimico: photoUrls.analisis_fisicoquimico,
          foto_dictamen_humos: photoUrls.dictamen_humos,
          foto_licencia_operador: photoUrls.licencia_operador,
          client_id: clientId,
          created_by: user.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Revisión documental registrada exitosamente");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["revision_documental"] });
      resetForm();
    },
    onError: (error) => {
      toast.error("Error al registrar revisión");
      console.error(error);
    },
  });

  const resetForm = () => {
    setFormData({
      numero_economico: "",
      placas: "",
      operador_nombre: "",
      empresa: "",
      vigencia_licencia: "",
      vigencia_analisis_fisicoquimico: "",
      vigencia_dictamen_humos: "",
      vigencia_poliza_seguro: "",
      observaciones: "",
    });
    setUploadingPhotos({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handlePhotoChange = (key: string, file: File | null) => {
    if (file) {
      setUploadingPhotos({ ...uploadingPhotos, [key]: file });
    } else {
      const newPhotos = { ...uploadingPhotos };
      delete newPhotos[key];
      setUploadingPhotos(newPhotos);
    }
  };

  const filteredRevisiones = revisiones?.filter(rev =>
    rev.numero_economico?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rev.operador_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rev.placas?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case "vigente": return "default";
      case "proximo_vencer": return "secondary";
      case "vencido": return "destructive";
      default: return "outline";
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "vigente": return "text-green-600";
      case "proximo_vencer": return "text-yellow-600";
      case "vencido": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getDaysUntilExpiry = (date: string) => {
    const expiryDate = new Date(date);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const stats = {
    total: revisiones?.length || 0,
    vigentes: revisiones?.filter(r => r.estado_general === "vigente").length || 0,
    proximosVencer: revisiones?.filter(r => r.estado_general === "proximo_vencer").length || 0,
    vencidos: revisiones?.filter(r => r.estado_general === "vencido").length || 0,
  };

  const documentTypes = [
    { key: "tarjeta_circulacion", label: "Tarjeta de Circulación", vigenciaKey: null },
    { key: "poliza_seguro", label: "Póliza de Seguro", vigenciaKey: "vigencia_poliza_seguro" },
    { key: "analisis_fisicoquimico", label: "Análisis Fisicoquímico", vigenciaKey: "vigencia_analisis_fisicoquimico" },
    { key: "dictamen_humos", label: "Dictamen de Humos", vigenciaKey: "vigencia_dictamen_humos" },
    { key: "licencia_operador", label: "Licencia del Operador", vigenciaKey: "vigencia_licencia" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Revisión Documental
          </h1>
          <p className="text-muted-foreground mt-1">
            Control de documentos obligatorios con evidencia fotográfica
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Revisión
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registro de Revisión Documental</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_economico">Unidad *</Label>
                  <Select
                    value={formData.numero_economico}
                    onValueChange={(value) => {
                      const unidad = unidades?.find(u => u.numero_economico === value);
                      setFormData({ 
                        ...formData, 
                        numero_economico: value,
                        placas: unidad?.placas || ""
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades?.map((unidad) => (
                        <SelectItem key={unidad.id} value={unidad.numero_economico}>
                          {unidad.numero_economico} - {unidad.tipo} {unidad.marca} {unidad.modelo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placas">Placas</Label>
                  <Input
                    id="placas"
                    value={formData.placas}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operador_nombre">Operador *</Label>
                  <Select
                    value={formData.operador_nombre}
                    onValueChange={(value) => {
                      const operador = operadores?.find(op => op.nombre === value);
                      setFormData({ ...formData, operador_nombre: operador?.nombre || value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {operadores?.map((operador) => (
                        <SelectItem key={operador.id} value={operador.nombre}>
                          {operador.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa *</Label>
                  <Input
                    id="empresa"
                    required
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Documentos con Fotografía
                </h3>
                {documentTypes.map((doc) => (
                  <div key={doc.key} className="space-y-2">
                    <Label>{doc.label}</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(doc.key, e.target.files?.[0] || null)}
                      />
                      {doc.vigenciaKey && (
                        <Input
                          type="date"
                          placeholder="Fecha de vigencia"
                          value={formData[doc.vigenciaKey as keyof typeof formData] as string}
                          onChange={(e) => setFormData({ ...formData, [doc.vigenciaKey]: e.target.value })}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  <FileText className="h-4 w-4 mr-2" />
                  Registrar Revisión
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Unidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Documentos Vigentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.vigentes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Próximos a Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.proximosVencer}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.vencidos}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <Input
              placeholder="Buscar por unidad, operador o placas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRevisiones?.map((revision) => (
                <Card key={revision.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{revision.numero_economico}</h3>
                          <Badge variant={getEstadoBadgeVariant(revision.estado_general)}>
                            {revision.estado_general.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Operador: {revision.operador_nombre}</p>
                          <p>Empresa: {revision.empresa}</p>
                          {revision.placas && <p>Placas: {revision.placas}</p>}
                          <p>Fecha de revisión: {new Date(revision.fecha_revision).toLocaleDateString("es-MX")}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {revision.vigencia_licencia && (
                            <div className="text-sm">
                              <span className="font-medium">Licencia:</span>{" "}
                              <span className={getDaysUntilExpiry(revision.vigencia_licencia) < 15 ? "text-red-600" : ""}>
                                {new Date(revision.vigencia_licencia).toLocaleDateString("es-MX")}
                              </span>
                            </div>
                          )}
                          {revision.vigencia_analisis_fisicoquimico && (
                            <div className="text-sm">
                              <span className="font-medium">Análisis:</span>{" "}
                              <span className={getDaysUntilExpiry(revision.vigencia_analisis_fisicoquimico) < 15 ? "text-red-600" : ""}>
                                {new Date(revision.vigencia_analisis_fisicoquimico).toLocaleDateString("es-MX")}
                              </span>
                            </div>
                          )}
                          {revision.vigencia_dictamen_humos && (
                            <div className="text-sm">
                              <span className="font-medium">Humos:</span>{" "}
                              <span className={getDaysUntilExpiry(revision.vigencia_dictamen_humos) < 15 ? "text-red-600" : ""}>
                                {new Date(revision.vigencia_dictamen_humos).toLocaleDateString("es-MX")}
                              </span>
                            </div>
                          )}
                          {revision.vigencia_poliza_seguro && (
                            <div className="text-sm">
                              <span className="font-medium">Seguro:</span>{" "}
                              <span className={getDaysUntilExpiry(revision.vigencia_poliza_seguro) < 15 ? "text-red-600" : ""}>
                                {new Date(revision.vigencia_poliza_seguro).toLocaleDateString("es-MX")}
                              </span>
                            </div>
                          )}
                        </div>
                        {revision.observaciones && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <AlertCircle className="h-4 w-4 inline mr-1" />
                            {revision.observaciones}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredRevisiones?.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  No se encontraron revisiones documentales
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
