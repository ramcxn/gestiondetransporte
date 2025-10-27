import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Calendar, FileText, MapPin, AlertTriangle, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Operator {
  id: string;
  nombre: string;
  numero_empleado: string;
  fecha_alta: string;
  fecha_vencimiento_contrato: string;
  direccion: string;
  numero_licencia: string | null;
  fecha_vencimiento_licencia: string | null;
  pdf_url: string | null;
  estado: string;
  created_at: string;
}

export default function Operators() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<File | null>(null);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    numero_empleado: "",
    fecha_alta: "",
    fecha_vencimiento_contrato: "",
    direccion: "",
    numero_licencia: "",
    fecha_vencimiento_licencia: "",
  });

  useEffect(() => {
    fetchOperators();

    const channel = supabase
      .channel('operators-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'operadores'
        },
        () => {
          fetchOperators();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOperators = async () => {
    try {
      const { data, error } = await supabase
        .from("operadores")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOperators(data || []);
    } catch (error) {
      console.error("Error fetching operators:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los operadores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePDFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedPDF(file);
    } else {
      toast({
        title: "Error",
        description: "Por favor seleccione un archivo PDF",
        variant: "destructive",
      });
    }
  };

  const uploadPDF = async (): Promise<string | null> => {
    if (!selectedPDF || !user) return null;

    setUploadingPDF(true);
    try {
      const fileName = `${user.id}-${Date.now()}.pdf`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos-operadores')
        .upload(filePath, selectedPDF);

      if (uploadError) throw uploadError;

      // For private buckets, we need to generate a signed URL
      const { data } = await supabase.storage
        .from('documentos-operadores')
        .createSignedUrl(filePath, 31536000); // 1 year expiry

      return data?.signedUrl || null;
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo subir el documento PDF",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingPDF(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      let pdfUrl = null;
      
      if (selectedPDF) {
        pdfUrl = await uploadPDF();
        if (!pdfUrl) {
          setSubmitting(false);
          return;
        }
      }

      const { error } = await supabase
        .from("operadores")
        .insert({
          nombre: formData.nombre,
          numero_empleado: formData.numero_empleado,
          fecha_alta: formData.fecha_alta,
          fecha_vencimiento_contrato: formData.fecha_vencimiento_contrato,
          direccion: formData.direccion,
          numero_licencia: formData.numero_licencia || null,
          fecha_vencimiento_licencia: formData.fecha_vencimiento_licencia || null,
          pdf_url: pdfUrl,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Operador registrado exitosamente",
      });

      setFormData({
        nombre: "",
        numero_empleado: "",
        fecha_alta: "",
        fecha_vencimiento_contrato: "",
        direccion: "",
        numero_licencia: "",
        fecha_vencimiento_licencia: "",
      });
      setSelectedPDF(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error submitting operator:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el operador",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isLicenseExpiring = (date: string | null) => {
    if (!date) return false;
    const expiryDate = new Date(date);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 60 && diffDays >= 0;
  };

  const isLicenseExpired = (date: string | null) => {
    if (!date) return false;
    const expiryDate = new Date(date);
    const today = new Date();
    return expiryDate < today;
  };

  const expiringLicenses = operators.filter(op => 
    op.fecha_vencimiento_licencia && isLicenseExpiring(op.fecha_vencimiento_licencia)
  );

  const expiredLicenses = operators.filter(op => 
    op.fecha_vencimiento_licencia && isLicenseExpired(op.fecha_vencimiento_licencia)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <UserCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión del Operador</h1>
            <p className="text-muted-foreground">Control de contratos y documentación</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <UserCheck className="h-4 w-4 mr-2" />
              Nuevo Operador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Operador</DialogTitle>
              <DialogDescription>Complete la información del operador y su contrato</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="operator-name">Nombre Completo</Label>
                  <Input 
                    id="operator-name" 
                    placeholder="Nombre del operador" 
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operator-id">ID Empleado</Label>
                  <Input 
                    id="operator-id" 
                    placeholder="OP-XXX" 
                    value={formData.numero_empleado}
                    onChange={(e) => setFormData({ ...formData, numero_empleado: e.target.value })}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Fecha de Alta</Label>
                  <Input 
                    id="start-date" 
                    type="date" 
                    value={formData.fecha_alta}
                    onChange={(e) => setFormData({ ...formData, fecha_alta: e.target.value })}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Vencimiento de Contrato</Label>
                  <Input 
                    id="end-date" 
                    type="date" 
                    value={formData.fecha_vencimiento_contrato}
                    onChange={(e) => setFormData({ ...formData, fecha_vencimiento_contrato: e.target.value })}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license-number">Número de Licencia</Label>
                  <Input 
                    id="license-number" 
                    placeholder="LIC-12345678" 
                    value={formData.numero_licencia}
                    onChange={(e) => setFormData({ ...formData, numero_licencia: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license-expiry">Vencimiento de Licencia</Label>
                  <Input 
                    id="license-expiry" 
                    type="date" 
                    value={formData.fecha_vencimiento_licencia}
                    onChange={(e) => setFormData({ ...formData, fecha_vencimiento_licencia: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input 
                  id="address" 
                  placeholder="Dirección completa" 
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract-pdf">Documentos del Contrato (PDF)</Label>
                <Input
                  id="contract-pdf"
                  type="file"
                  accept="application/pdf"
                  onChange={handlePDFChange}
                  className="cursor-pointer"
                />
                {selectedPDF && (
                  <p className="text-sm text-muted-foreground">
                    Archivo seleccionado: {selectedPDF.name}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting || uploadingPDF}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90"
                  disabled={submitting || uploadingPDF}
                >
                  {submitting ? "Registrando..." : uploadingPDF ? "Subiendo PDF..." : "Registrar Operador"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {(expiringLicenses.length > 0 || expiredLicenses.length > 0) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {expiredLicenses.length > 0 && (
              <p className="font-semibold mb-1">
                ⚠️ {expiredLicenses.length} licencia(s) vencida(s): {expiredLicenses.map(op => op.nombre).join(", ")}
              </p>
            )}
            {expiringLicenses.length > 0 && (
              <p>
                🔔 {expiringLicenses.length} licencia(s) por vencer en los próximos 60 días: {expiringLicenses.map(op => op.nombre).join(", ")}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Operadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{operators.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {operators.filter(op => op.estado === "activo").length} activos
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Licencias por Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{expiringLicenses.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Próximos 60 días</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Licencias Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{expiredLicenses.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Requieren renovación</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Registro de Operadores</CardTitle>
          <CardDescription>Información de contratos y documentación</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : operators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay operadores registrados
            </div>
          ) : (
            <div className="space-y-3">
              {operators.map((operator) => {
                const licenseExpiring = operator.fecha_vencimiento_licencia && isLicenseExpiring(operator.fecha_vencimiento_licencia);
                const licenseExpired = operator.fecha_vencimiento_licencia && isLicenseExpired(operator.fecha_vencimiento_licencia);
                
                return (
                  <div
                    key={operator.id}
                    className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className="font-semibold text-foreground">{operator.nombre}</h4>
                          <Badge variant={operator.estado === "activo" ? "default" : "secondary"}>
                            {operator.estado}
                          </Badge>
                          <span className="text-sm text-muted-foreground">• {operator.numero_empleado}</span>
                          {licenseExpired && (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Licencia Vencida
                            </Badge>
                          )}
                          {licenseExpiring && !licenseExpired && (
                            <Badge variant="outline" className="border-secondary text-secondary">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Licencia por Vencer
                            </Badge>
                          )}
                        </div>
                        <div className="grid gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Contrato: {new Date(operator.fecha_alta).toLocaleDateString("es-MX")} - {new Date(operator.fecha_vencimiento_contrato).toLocaleDateString("es-MX")}
                            </span>
                          </div>
                          {operator.numero_licencia && (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>
                                Licencia: {operator.numero_licencia}
                                {operator.fecha_vencimiento_licencia && 
                                  ` • Vence: ${new Date(operator.fecha_vencimiento_licencia).toLocaleDateString("es-MX")}`
                                }
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{operator.direccion}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              Ver Detalles
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalles del Operador</DialogTitle>
                              <DialogDescription>Información completa del operador</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <Label className="text-muted-foreground">Nombre Completo</Label>
                                  <p className="font-medium text-foreground">{operator.nombre}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Número de Empleado</Label>
                                  <p className="font-medium text-foreground">{operator.numero_empleado}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Fecha de Alta</Label>
                                  <p className="font-medium text-foreground">
                                    {new Date(operator.fecha_alta).toLocaleDateString("es-MX")}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Vencimiento de Contrato</Label>
                                  <p className="font-medium text-foreground">
                                    {new Date(operator.fecha_vencimiento_contrato).toLocaleDateString("es-MX")}
                                  </p>
                                </div>
                                {operator.numero_licencia && (
                                  <>
                                    <div>
                                      <Label className="text-muted-foreground">Número de Licencia</Label>
                                      <p className="font-medium text-foreground">{operator.numero_licencia}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Vencimiento de Licencia</Label>
                                      <p className="font-medium text-foreground">
                                        {operator.fecha_vencimiento_licencia 
                                          ? new Date(operator.fecha_vencimiento_licencia).toLocaleDateString("es-MX")
                                          : "N/A"}
                                      </p>
                                    </div>
                                  </>
                                )}
                                <div>
                                  <Label className="text-muted-foreground">Estado</Label>
                                  <Badge variant={operator.estado === "activo" ? "default" : "secondary"}>
                                    {operator.estado}
                                  </Badge>
                                </div>
                                <div className="md:col-span-2">
                                  <Label className="text-muted-foreground">Dirección</Label>
                                  <p className="font-medium text-foreground">{operator.direccion}</p>
                                </div>
                              </div>
                              {operator.pdf_url && (
                                <Button 
                                  className="w-full"
                                  variant="outline"
                                  onClick={() => window.open(operator.pdf_url!, '_blank')}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Ver Documento PDF
                                </Button>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        {operator.pdf_url && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(operator.pdf_url!, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Ver PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
