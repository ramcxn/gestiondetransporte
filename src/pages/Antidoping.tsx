import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FlaskConical, Calendar, CheckCircle, XCircle, Download, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AntidopingTest {
  id: string;
  nombre: string;
  tipo_persona: string;
  resultado: string;
  nivel: number | null;
  observaciones: string | null;
  archivo_url: string | null;
  created_at: string;
  created_by: string;
}

interface Operator {
  id: string;
  nombre: string;
}

interface Personal {
  id: string;
  nombre: string;
}

export default function Antidoping() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<AntidopingTest | null>(null);
  const [tests, setTests] = useState<AntidopingTest[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    tipo_persona: "operador",
    resultado: "negativo",
    nivel: "",
    observaciones: "",
  });

  useEffect(() => {
    fetchTests();
    fetchOperators();
    fetchPersonal();

    const channel = supabase
      .channel('antidoping-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pruebas_alcoholimetro'
        },
        () => {
          fetchTests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from("pruebas_alcoholimetro")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las pruebas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOperators = async () => {
    try {
      const { data, error } = await supabase
        .from("operadores")
        .select("id, nombre")
        .eq("estado", "activo")
        .order("nombre", { ascending: true });

      if (error) throw error;
      setOperators(data || []);
    } catch (error) {
      console.error("Error fetching operators:", error);
    }
  };

  const fetchPersonal = async () => {
    try {
      const { data, error } = await supabase
        .from("personal")
        .select("id, nombre")
        .eq("estado", "activo")
        .order("nombre", { ascending: true });

      if (error) throw error;
      setPersonal(data || []);
    } catch (error) {
      console.error("Error fetching personal:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Error",
          description: "Por favor seleccione un archivo PDF o una imagen (JPG, PNG)",
          variant: "destructive",
        });
      }
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    setUploadingFile(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('archivos-antidoping')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data } = await supabase.storage
        .from('archivos-antidoping')
        .createSignedUrl(filePath, 31536000); // 1 year expiry

      return data?.signedUrl || null;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      let archivoUrl = null;
      
      if (selectedFile) {
        archivoUrl = await uploadFile();
      }

      const { error } = await supabase
        .from("pruebas_alcoholimetro")
        .insert({
          nombre: formData.nombre,
          tipo_persona: formData.tipo_persona,
          resultado: formData.resultado,
          nivel: formData.nivel ? parseFloat(formData.nivel) : null,
          observaciones: formData.observaciones || null,
          archivo_url: archivoUrl,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Prueba de antidoping registrada exitosamente",
      });

      setFormData({
        nombre: "",
        tipo_persona: "operador",
        resultado: "negativo",
        nivel: "",
        observaciones: "",
      });
      setSelectedFile(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error submitting test:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar la prueba",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openDetails = (test: AntidopingTest) => {
    setSelectedTest(test);
    setDetailsDialogOpen(true);
  };

  const negativeTests = tests.filter(t => t.resultado === "negativo");
  const positiveTests = tests.filter(t => t.resultado === "positivo");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <FlaskConical className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Antidoping</h1>
            <p className="text-muted-foreground">Control de pruebas según requisitos CTPAT</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <FlaskConical className="h-4 w-4 mr-2" />
              Nueva Prueba
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Prueba de Antidoping</DialogTitle>
              <DialogDescription>Complete la información según requisitos CTPAT</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tipo_persona">Tipo de Persona</Label>
                  <Select 
                    value={formData.tipo_persona}
                    onValueChange={(value) => {
                      setFormData({ ...formData, tipo_persona: value, nombre: "" });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operador">Operador</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="visitante">Visitante</SelectItem>
                      <SelectItem value="proveedor">Proveedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Persona</Label>
                  {(formData.tipo_persona === "operador" || formData.tipo_persona === "personal") ? (
                    <Select
                      value={formData.nombre}
                      onValueChange={(value) => setFormData({ ...formData, nombre: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar persona" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.tipo_persona === "operador" ? (
                          operators.map((op) => (
                            <SelectItem key={op.id} value={op.nombre}>
                              {op.nombre}
                            </SelectItem>
                          ))
                        ) : (
                          personal.map((p) => (
                            <SelectItem key={p.id} value={p.nombre}>
                              {p.nombre}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="nombre"
                      placeholder="Nombre completo"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resultado">Resultado</Label>
                  <Select
                    value={formData.resultado}
                    onValueChange={(value) => setFormData({ ...formData, resultado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="negativo">Negativo</SelectItem>
                      <SelectItem value="positivo">Positivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nivel">Nivel (opcional)</Label>
                  <Input
                    id="nivel"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.nivel}
                    onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Observaciones adicionales"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="archivo">Archivo / Foto de Resultado (PDF o Imagen)</Label>
                <Input
                  id="archivo"
                  type="file"
                  accept="application/pdf,image/jpeg,image/jpg,image/png"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Archivo seleccionado: {selectedFile.name}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting || uploadingFile}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90"
                  disabled={submitting || uploadingFile}
                >
                  {submitting ? "Registrando..." : uploadingFile ? "Subiendo archivo..." : "Registrar Prueba"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pruebas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{tests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registradas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Negativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{negativeTests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Aprobadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Positivas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{positiveTests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cumplimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {tests.length > 0 ? Math.round((negativeTests.length / tests.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tasa de aprobación</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Historial de Pruebas</CardTitle>
          <CardDescription>Registro completo de pruebas de antidoping</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay pruebas registradas
            </div>
          ) : (
            <div className="space-y-3">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{test.nombre}</h4>
                        {test.resultado === "negativo" && (
                          <Badge className="bg-accent text-accent-foreground">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Negativo
                          </Badge>
                        )}
                        {test.resultado === "positivo" && (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Positivo
                          </Badge>
                        )}
                        <Badge variant="outline">{test.tipo_persona}</Badge>
                        {test.archivo_url && (
                          <Badge variant="secondary">
                            <FileText className="h-3 w-3 mr-1" />
                            Archivo adjunto
                          </Badge>
                        )}
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(test.created_at).toLocaleDateString("es-MX")} •{" "}
                            {new Date(test.created_at).toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {test.nivel && (
                          <div className="flex items-center gap-2">
                            <FlaskConical className="h-4 w-4" />
                            <span>Nivel: {test.nivel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {test.archivo_url && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(test.archivo_url!, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Archivo
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openDetails(test)}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Prueba</DialogTitle>
            <DialogDescription>Información completa del antidoping</DialogDescription>
          </DialogHeader>
          {selectedTest && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Nombre</Label>
                  <p className="font-semibold">{selectedTest.nombre}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p className="font-semibold">{selectedTest.tipo_persona}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Resultado</Label>
                  <Badge variant={selectedTest.resultado === "negativo" ? "default" : "destructive"}>
                    {selectedTest.resultado}
                  </Badge>
                </div>
                {selectedTest.nivel && (
                  <div>
                    <Label className="text-muted-foreground">Nivel</Label>
                    <p className="font-semibold">{selectedTest.nivel}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">Fecha y Hora</Label>
                  <p className="font-semibold">
                    {new Date(selectedTest.created_at).toLocaleDateString("es-MX", {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} • {new Date(selectedTest.created_at).toLocaleTimeString("es-MX")}
                  </p>
                </div>
                {selectedTest.observaciones && (
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Observaciones</Label>
                    <p className="mt-1">{selectedTest.observaciones}</p>
                  </div>
                )}
              </div>
              {selectedTest.archivo_url && (
                <div>
                  <Button 
                    className="w-full"
                    onClick={() => window.open(selectedTest.archivo_url!, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Archivo Adjunto
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
