import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Calendar, FileText, MapPin, AlertTriangle, Download, Trash2, QrCode, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QRCodeGenerator, generateQRCodeDataURL } from "@/components/QRCodeGenerator";

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
  qr_code: string | null;
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [operatorToDelete, setOperatorToDelete] = useState<Operator | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [generatingQRs, setGeneratingQRs] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const { user, userRole, clientIdByDomain } = useAuth();
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

  const resetForm = () => {
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
    setEditingOperator(null);
  };

  const openEditDialog = (operator: Operator) => {
    setEditingOperator(operator);
    setFormData({
      nombre: operator.nombre || "",
      numero_empleado: operator.numero_empleado || "",
      fecha_alta: operator.fecha_alta || "",
      fecha_vencimiento_contrato: operator.fecha_vencimiento_contrato || "",
      direccion: operator.direccion || "",
      numero_licencia: operator.numero_licencia || "",
      fecha_vencimiento_licencia: operator.fecha_vencimiento_licencia || "",
    });
    setSelectedPDF(null);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      let pdfUrl: string | null = null;

      if (selectedPDF) {
        pdfUrl = await uploadPDF();
        if (!pdfUrl) {
          setSubmitting(false);
          return;
        }
      }

      if (editingOperator) {
        // Update existing operator
        const updateData: any = {
          nombre: formData.nombre,
          numero_empleado: formData.numero_empleado,
          fecha_alta: formData.fecha_alta,
          fecha_vencimiento_contrato: formData.fecha_vencimiento_contrato,
          direccion: formData.direccion,
          numero_licencia: formData.numero_licencia || null,
          fecha_vencimiento_licencia: formData.fecha_vencimiento_licencia || null,
        };
        if (pdfUrl) updateData.pdf_url = pdfUrl;

        const { error: updateError } = await supabase
          .from("operadores")
          .update(updateData)
          .eq("id", editingOperator.id);

        if (updateError) throw updateError;

        toast({
          title: "Éxito",
          description: "Operador actualizado exitosamente",
        });
      } else {
        // Get client_id basado en el dominio del email
        const clientId = clientIdByDomain;

        if (!clientId) throw new Error("No se pudo determinar el cliente");

        // Insert operator first to get the ID
        const { data: newOperator, error: insertError } = await supabase
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
            client_id: clientId,
            created_by: user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Generate QR code with operator ID
        const qrCode = `OPERADOR-${newOperator.id}`;

        const { error: updateError } = await supabase
          .from("operadores")
          .update({ qr_code: qrCode })
          .eq("id", newOperator.id);

        if (updateError) throw updateError;

        toast({
          title: "Éxito",
          description: "Operador registrado exitosamente",
        });
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error submitting operator:", error);
      toast({
        title: "Error",
        description: editingOperator ? "No se pudo actualizar el operador" : "No se pudo registrar el operador",
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

  const openQRDialog = (operator: Operator) => {
    setSelectedOperator(operator);
    setQrDialogOpen(true);
  };

  const downloadQRCode = async (operator: Operator) => {
    if (!operator.qr_code) return;

    try {
      const dataUrl = await generateQRCodeDataURL(operator.qr_code);
      const link = document.createElement("a");
      link.download = `QR-${operator.numero_empleado}-${operator.nombre}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast({
        title: "Error",
        description: "No se pudo descargar el código QR",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!operatorToDelete) return;

    try {
      const { error } = await supabase
        .from("operadores")
        .delete()
        .eq("id", operatorToDelete.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Operador eliminado exitosamente",
      });

      setDeleteDialogOpen(false);
      setOperatorToDelete(null);
    } catch (error) {
      console.error("Error deleting operator:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el operador",
        variant: "destructive",
      });
    }
  };

  const generateMissingQRCodes = async () => {
    if (!user) return;

    setGeneratingQRs(true);
    try {
      // Fetch operators without QR codes
      const { data: operatorsWithoutQR, error: fetchError } = await supabase
        .from("operadores")
        .select("id, numero_empleado")
        .is("qr_code", null);

      if (fetchError) throw fetchError;

      if (!operatorsWithoutQR || operatorsWithoutQR.length === 0) {
        toast({
          title: "Información",
          description: "Todos los operadores ya tienen código QR",
        });
        return;
      }

      // Generate QR codes for each operator
      const updates = operatorsWithoutQR.map(operator => ({
        id: operator.id,
        qr_code: `OPERADOR-${operator.numero_empleado}-${Date.now()}`
      }));

      // Update all operators with QR codes
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from("operadores")
          .update({ qr_code: update.qr_code })
          .eq("id", update.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Éxito",
        description: `Se generaron ${updates.length} códigos QR para operadores`,
      });

      fetchOperators();
    } catch (error) {
      console.error("Error generating QR codes:", error);
      toast({
        title: "Error",
        description: "No se pudieron generar los códigos QR",
        variant: "destructive",
      });
    } finally {
      setGeneratingQRs(false);
    }
  };

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
        <div className="flex gap-2">
          {userRole === "admin" && (
            <Button
              onClick={generateMissingQRCodes}
              disabled={generatingQRs}
              variant="outline"
              className="gap-2"
            >
              <QrCode className="h-4 w-4" />
              {generatingQRs ? "Generando..." : "Generar QR Faltantes"}
            </Button>
          )}
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
                    <div className="flex flex-col gap-3 mb-3">
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
                      <div className="w-full sm:w-auto">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="w-full sm:w-auto">
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openQRDialog(operator)}
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          Ver QR
                        </Button>
                        {userRole === "admin" && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              setOperatorToDelete(operator);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Operador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al operador {operatorToDelete?.nombre}. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Código QR del Operador</DialogTitle>
            <DialogDescription>
              {selectedOperator?.nombre} - {selectedOperator?.numero_empleado}
            </DialogDescription>
          </DialogHeader>
          {selectedOperator && selectedOperator.qr_code ? (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeGenerator value={selectedOperator.qr_code} size={250} />
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Este código QR puede ser escaneado en el sistema para identificación rápida del operador.</p>
              </div>
              <Button
                onClick={() => downloadQRCode(selectedOperator)}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar QR
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay código QR disponible
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
