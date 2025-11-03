import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Wine, Clock, CheckCircle, XCircle, User, Camera, Image as ImageIcon, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import QRScanner from "@/components/QRScanner";

interface BreathalyzerTest {
  id: string;
  nombre: string;
  tipo_persona: string;
  resultado: string;
  nivel: number | null;
  observaciones: string | null;
  archivo_url: string | null;
  created_at: string;
  created_by: string;
  creator_name?: string;
}

export default function Breathalyzer() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tests, setTests] = useState<BreathalyzerTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [operadores, setOperadores] = useState<Array<{ id: string; nombre: string; numero_empleado: string; qr_code: string | null }>>([]);
  const [personal, setPersonal] = useState<Array<{ id: string; nombre: string; numero_empleado: string; qr_code: string | null }>>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    tipo_persona: "operator",
    nivel: "0.00",
    observaciones: "",
    personId: "",
  });

  useEffect(() => {
    fetchTests();
    fetchOperadores();
    fetchPersonal();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('breathalyzer-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
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
      const { data: testsData, error: testsError } = await supabase
        .from("pruebas_alcoholimetro")
        .select("*")
        .order("created_at", { ascending: false });

      if (testsError) throw testsError;

      // Fetch creator names
      const userIds = [...new Set(testsData?.map(t => t.created_by) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);
      
      const enrichedTests = testsData?.map(test => ({
        ...test,
        creator_name: profilesMap.get(test.created_by) || "Usuario"
      })) || [];

      setTests(enrichedTests);
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

  const fetchOperadores = async () => {
    try {
      const { data, error } = await supabase
        .from("operadores")
        .select("id, nombre, numero_empleado, qr_code")
        .eq("estado", "activo")
        .order("nombre");

      if (error) throw error;
      setOperadores(data || []);
    } catch (error) {
      console.error("Error fetching operators:", error);
    }
  };

  const fetchPersonal = async () => {
    try {
      const { data, error } = await supabase
        .from("personal")
        .select("id, nombre, numero_empleado, qr_code")
        .eq("estado", "activo")
        .order("nombre");

      if (error) throw error;
      setPersonal(data || []);
    } catch (error) {
      console.error("Error fetching personal:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Error",
          description: "El archivo es muy grande. Máximo 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleQRScan = (qrData: string) => {
    try {
      // Try to find matching QR code in operadores
      const operador = operadores.find(op => op.qr_code === qrData);
      if (operador) {
        setFormData({
          ...formData,
          nombre: operador.nombre,
          tipo_persona: "operator",
          personId: operador.id,
        });
        setShowQRScanner(false);
        toast({
          title: "Operador identificado",
          description: `${operador.nombre} - ${operador.numero_empleado}`,
        });
        return;
      }

      // Try to find matching QR code in personal
      const empleado = personal.find(p => p.qr_code === qrData);
      if (empleado) {
        setFormData({
          ...formData,
          nombre: empleado.nombre,
          tipo_persona: "staff",
          personId: empleado.id,
        });
        setShowQRScanner(false);
        toast({
          title: "Personal identificado",
          description: `${empleado.nombre} - ${empleado.numero_empleado}`,
        });
        return;
      }

      toast({
        title: "QR no reconocido",
        description: "No se encontró registro para este código QR",
        variant: "destructive",
      });
      setShowQRScanner(false);
    } catch (error) {
      console.error("Error scanning QR:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar el código QR",
        variant: "destructive",
      });
      setShowQRScanner(false);
    }
  };

  const handlePersonSelect = (value: string) => {
    const [tipo, id] = value.split("-");
    let nombre = "";
    
    if (tipo === "operator") {
      const op = operadores.find(o => o.id === id);
      nombre = op?.nombre || "";
    } else if (tipo === "staff") {
      const emp = personal.find(p => p.id === id);
      nombre = emp?.nombre || "";
    }

    setFormData({
      ...formData,
      nombre,
      tipo_persona: tipo,
      personId: id,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const nivel = parseFloat(formData.nivel);
      const resultado = nivel === 0 ? "Negativo" : nivel < 0.08 ? "Positivo Bajo" : "Positivo Alto";

      let archivoUrl = null;

      // Upload file if selected
      if (selectedFile) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("client_id")
          .eq("id", user.id)
          .single();

        if (!profile?.client_id) throw new Error("No client_id found");

        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${profile.client_id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from("archivos-antidoping")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("archivos-antidoping")
          .getPublicUrl(fileName);

        archivoUrl = publicUrl;
      }

      const { error } = await supabase
        .from("pruebas_alcoholimetro")
        .insert({
          nombre: formData.nombre,
          tipo_persona: formData.tipo_persona,
          nivel: nivel,
          resultado: resultado,
          observaciones: formData.observaciones || null,
          archivo_url: archivoUrl,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Prueba de alcoholímetro registrada exitosamente",
      });

      setFormData({
        nombre: "",
        tipo_persona: "operator",
        nivel: "0.00",
        observaciones: "",
        personId: "",
      });
      setSelectedFile(null);
      setPreviewUrl(null);
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

  const todayTests = tests.filter(
    (t) => new Date(t.created_at).toDateString() === new Date().toDateString()
  );
  const passedTests = todayTests.filter((t) => t.resultado === "Negativo");
  const failedTests = todayTests.filter((t) => t.resultado !== "Negativo");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Wine className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pruebas de Alcoholímetro</h1>
            <p className="text-muted-foreground">Control de alcohol para personal que ingresa</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Wine className="h-4 w-4 mr-2" />
              Nueva Prueba
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Prueba de Alcoholímetro</DialogTitle>
              <DialogDescription>Complete la información de la prueba</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowQRScanner(true)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Escanear QR
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      O seleccionar manualmente
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="person-select">Seleccionar Persona</Label>
                  <Select
                    value={formData.personId ? `${formData.tipo_persona}-${formData.personId}` : ""}
                    onValueChange={handlePersonSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Buscar operador o personal..." />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Operadores
                      </div>
                      {operadores.map((op) => (
                        <SelectItem key={op.id} value={`operator-${op.id}`}>
                          {op.nombre} - {op.numero_empleado}
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t">
                        Personal
                      </div>
                      {personal.map((emp) => (
                        <SelectItem key={emp.id} value={`staff-${emp.id}`}>
                          {emp.nombre} - {emp.numero_empleado}
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t">
                        Otros
                      </div>
                      <SelectItem value="visitor-manual">Visitante (manual)</SelectItem>
                      <SelectItem value="provider-manual">Proveedor (manual)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.tipo_persona === "visitor" || formData.tipo_persona === "provider" || !formData.personId) && (
                  <div className="space-y-2">
                    <Label htmlFor="person-name">Nombre Completo</Label>
                    <Input
                      id="person-name"
                      placeholder="Nombre de la persona"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                      }
                      required
                    />
                  </div>
                )}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="result">Resultado (g/dL)</Label>
                  <Input
                    id="result"
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={formData.nivel}
                    onChange={(e) =>
                      setFormData({ ...formData, nivel: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    placeholder="Observaciones adicionales (opcional)"
                    value={formData.observaciones}
                    onChange={(e) =>
                      setFormData({ ...formData, observaciones: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="foto">Foto de la Prueba (opcional)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="foto"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    <Camera className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {previewUrl && (
                    <div className="mt-2 relative w-32 h-32">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg border border-border"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Límite permitido:</strong> 0.00 g/dL para operadores. Cualquier resultado positivo 
                  debe ser documentado y seguir el protocolo de seguridad.
                </p>
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
                  {submitting ? "Registrando..." : "Registrar Prueba"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pruebas Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{todayTests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{passedTests.length} aprobadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aprobadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{passedTests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {todayTests.length > 0
                ? `${((passedTests.length / todayTests.length) * 100).toFixed(1)}% de cumplimiento`
                : "Sin datos"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">No Aprobadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{failedTests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {failedTests.length > 0 ? "Protocolo aplicado" : "Ninguna"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{tests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Todas las pruebas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Historial de Pruebas</CardTitle>
          <CardDescription>Registro completo de pruebas de alcoholímetro</CardDescription>
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
                        {test.resultado === "Negativo" && (
                          <Badge className="bg-accent text-accent-foreground">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprobado
                          </Badge>
                        )}
                        {test.resultado !== "Negativo" && (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            {test.resultado}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground capitalize">
                          • {test.tipo_persona}
                        </span>
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(test.created_at).toLocaleDateString("es-MX")} •{" "}
                            {new Date(test.created_at).toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wine className="h-4 w-4" />
                          <span>Resultado: {test.nivel !== null ? test.nivel.toFixed(3) : '0.000'} g/dL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Aplicado por: {test.creator_name}</span>
                        </div>
                        {test.observaciones && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <strong>Observaciones:</strong> {test.observaciones}
                          </div>
                        )}
                        {test.archivo_url && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Foto de la prueba:</span>
                            </div>
                            <a
                              href={test.archivo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block"
                            >
                              <img
                                src={test.archivo_url}
                                alt="Foto de prueba"
                                className="w-40 h-40 object-cover rounded-lg border border-border hover:shadow-lg transition-shadow cursor-pointer"
                              />
                            </a>
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
