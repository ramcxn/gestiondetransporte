import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, Phone, MapPin, UserX, QrCode, Edit, Download, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeGenerator, generateQRCodeDataURL } from "@/components/QRCodeGenerator";
import { calcularDiasVacaciones } from "@/lib/vacacionesUtils";

interface PersonalRecord {
  id: string;
  nombre: string;
  numero_empleado: string;
  puesto: string;
  departamento: string;
  fecha_alta: string;
  direccion: string;
  telefono: string | null;
  estado: string;
  created_at: string;
  qr_code: string | null;
  dias_vacaciones_disponibles: number;
  dias_vacaciones_tomados: number;
}

export default function Personal() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PersonalRecord | null>(null);
  const [personal, setPersonal] = useState<PersonalRecord[]>([]);
  const [departamentos, setDepartamentos] = useState<Array<{ id: string; nombre: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personToDeactivate, setPersonToDeactivate] = useState<PersonalRecord | null>(null);
  const [personToDelete, setPersonToDelete] = useState<PersonalRecord | null>(null);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [generatingQRs, setGeneratingQRs] = useState(false);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    numero_empleado: "",
    puesto: "",
    departamento: "administrativo",
    fecha_alta: "",
    direccion: "",
    telefono: "",
  });

  useEffect(() => {
    fetchPersonal();
    fetchDepartamentos();

    const personalChannel = supabase
      .channel('personal-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'personal'
        },
        () => {
          fetchPersonal();
        }
      )
      .subscribe();

    const deptChannel = supabase
      .channel('departamentos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'departamentos'
        },
        () => {
          fetchDepartamentos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(personalChannel);
      supabase.removeChannel(deptChannel);
    };
  }, []);

  const fetchPersonal = async () => {
    try {
      const { data, error } = await supabase
        .from("personal")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPersonal(data || []);
    } catch (error) {
      console.error("Error fetching personal:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el personal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartamentos = async () => {
    try {
      const { data, error } = await supabase
        .from("departamentos")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre", { ascending: true });

      if (error) throw error;
      setDepartamentos(data || []);
    } catch (error) {
      console.error("Error fetching departamentos:", error);
    }
  };

  const handleAddDepartment = async () => {
    if (!user || !newDepartmentName.trim()) return;

    try {
      // Get client_id using RPC function
      const { data: rpcClientId } = await supabase.rpc('get_client_id_by_email_domain');
      
      let finalClientId = rpcClientId;
      
      // Fallback to profile client_id if RPC returns null
      if (!finalClientId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("client_id")
          .eq("id", user.id)
          .single();
        finalClientId = profile?.client_id;
      }

      if (!finalClientId) throw new Error("No client_id found");

      const { error } = await supabase
        .from("departamentos")
        .insert({
          nombre: newDepartmentName.trim(),
          client_id: finalClientId,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Departamento agregado exitosamente",
      });

      setNewDepartmentName("");
      setDepartmentDialogOpen(false);
      fetchDepartamentos();
    } catch (error: any) {
      console.error("Error adding department:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el departamento",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      // Get client_id using RPC function
      const { data: rpcClientId } = await supabase.rpc('get_client_id_by_email_domain');
      
      let finalClientId = rpcClientId;
      
      // Fallback to profile client_id if RPC returns null
      if (!finalClientId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("client_id")
          .eq("id", user.id)
          .single();
        finalClientId = profile?.client_id;
      }

      if (!finalClientId) throw new Error("No client_id found");

      if (isEditMode && formData.id) {
        // Update existing record
        const { error } = await supabase
          .from("personal")
          .update({
            nombre: formData.nombre,
            numero_empleado: formData.numero_empleado,
            puesto: formData.puesto,
            departamento: formData.departamento,
            fecha_alta: formData.fecha_alta,
            direccion: formData.direccion,
            telefono: formData.telefono || null,
          })
          .eq("id", formData.id);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Personal actualizado exitosamente",
        });
      } else {
        // Calculate initial vacation days
        const diasVacaciones = calcularDiasVacaciones(formData.fecha_alta);

        // Insert new personal record
        const { data: newPersonal, error: insertError } = await supabase
          .from("personal")
          .insert({
            nombre: formData.nombre,
            numero_empleado: formData.numero_empleado,
            puesto: formData.puesto,
            departamento: formData.departamento,
            fecha_alta: formData.fecha_alta,
            direccion: formData.direccion,
            telefono: formData.telefono || null,
            dias_vacaciones_disponibles: diasVacaciones,
            dias_vacaciones_tomados: 0,
            client_id: finalClientId,
            created_by: user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Generate QR code with personal ID
        const qrCode = `PERSONAL-${newPersonal.id}`;
        
        // Update with QR code
        const { error: updateError } = await supabase
          .from("personal")
          .update({ qr_code: qrCode })
          .eq("id", newPersonal.id);

        if (updateError) throw updateError;

        toast({
          title: "Éxito",
          description: "Personal registrado exitosamente",
        });
      }

      setFormData({
        id: "",
        nombre: "",
        numero_empleado: "",
        puesto: "",
        departamento: "administrativo",
        fecha_alta: "",
        direccion: "",
        telefono: "",
      });
      setIsDialogOpen(false);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error submitting personal:", error);
      toast({
        title: "Error",
        description: isEditMode ? "No se pudo actualizar el personal" : "No se pudo registrar el personal",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openDetails = (person: PersonalRecord) => {
    setSelectedPerson(person);
    setDetailsDialogOpen(true);
  };

  const openEditDialog = (person: PersonalRecord) => {
    setFormData({
      id: person.id,
      nombre: person.nombre,
      numero_empleado: person.numero_empleado,
      puesto: person.puesto,
      departamento: person.departamento,
      fecha_alta: person.fecha_alta,
      direccion: person.direccion,
      telefono: person.telefono || "",
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const openQRDialog = (person: PersonalRecord) => {
    setSelectedPerson(person);
    setQrDialogOpen(true);
  };

  const handleDeactivate = async () => {
    if (!personToDeactivate) return;

    try {
      const { error } = await supabase
        .from("personal")
        .update({ estado: "inactivo" })
        .eq("id", personToDeactivate.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Empleado dado de baja exitosamente",
      });

      setDeactivateDialogOpen(false);
      setPersonToDeactivate(null);
    } catch (error) {
      console.error("Error deactivating personal:", error);
      toast({
        title: "Error",
        description: "No se pudo dar de baja al empleado",
        variant: "destructive",
      });
    }
  };

  const openDeactivateDialog = (person: PersonalRecord) => {
    setPersonToDeactivate(person);
    setDeactivateDialogOpen(true);
  };

  const downloadQRCode = async (person: PersonalRecord) => {
    if (!person.qr_code) return;

    try {
      const dataUrl = await generateQRCodeDataURL(person.qr_code);
      const link = document.createElement("a");
      link.download = `QR-${person.numero_empleado}-${person.nombre}.png`;
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
    if (!personToDelete) return;

    try {
      const { error } = await supabase
        .from("personal")
        .delete()
        .eq("id", personToDelete.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Personal eliminado exitosamente",
      });

      setDeleteDialogOpen(false);
      setPersonToDelete(null);
    } catch (error) {
      console.error("Error deleting personal:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el personal",
        variant: "destructive",
      });
    }
  };

  const generateMissingQRCodes = async () => {
    if (!user) return;

    setGeneratingQRs(true);
    try {
      // Fetch personal without QR codes
      const { data: personalWithoutQR, error: fetchError } = await supabase
        .from("personal")
        .select("id, numero_empleado")
        .is("qr_code", null);

      if (fetchError) throw fetchError;

      if (!personalWithoutQR || personalWithoutQR.length === 0) {
        toast({
          title: "Información",
          description: "Todo el personal ya tiene código QR",
        });
        return;
      }

      // Generate QR codes for each person
      const updates = personalWithoutQR.map(person => ({
        id: person.id,
        qr_code: `PERSONAL-${person.numero_empleado}-${Date.now()}`
      }));

      // Update all personal with QR codes
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from("personal")
          .update({ qr_code: update.qr_code })
          .eq("id", update.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Éxito",
        description: `Se generaron ${updates.length} códigos QR para personal`,
      });

      fetchPersonal();
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

  const administrativo = personal.filter(p => p.departamento === "administrativo");
  const taller = personal.filter(p => p.departamento === "taller");
  const activos = personal.filter(p => p.estado === "activo");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Users className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Personal</h1>
            <p className="text-muted-foreground">Administrativo y de Taller</p>
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
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setIsEditMode(false);
              setFormData({
                id: "",
                nombre: "",
                numero_empleado: "",
                puesto: "",
                departamento: "administrativo",
                fecha_alta: "",
                direccion: "",
                telefono: "",
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Users className="h-4 w-4 mr-2" />
                Nuevo Personal
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Editar Personal" : "Registrar Personal"}</DialogTitle>
              <DialogDescription>Complete la información del empleado</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo</Label>
                  <Input
                    id="nombre"
                    placeholder="Nombre completo"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_empleado">Número de Empleado</Label>
                  <Input
                    id="numero_empleado"
                    placeholder="EMP-XXX"
                    value={formData.numero_empleado}
                    onChange={(e) => setFormData({ ...formData, numero_empleado: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="departamento">Departamento</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDepartmentDialogOpen(true)}
                      className="h-auto p-1 text-xs"
                    >
                      + Agregar
                    </Button>
                  </div>
                  <Select
                    value={formData.departamento}
                    onValueChange={(value) => setFormData({ ...formData, departamento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map((dept) => (
                        <SelectItem key={dept.id} value={dept.nombre}>
                          {dept.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="puesto">Puesto</Label>
                  <Input
                    id="puesto"
                    placeholder="Ej: Gerente, Mecánico"
                    value={formData.puesto}
                    onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_alta">Fecha de Alta</Label>
                  <Input
                    id="fecha_alta"
                    type="date"
                    value={formData.fecha_alta}
                    onChange={(e) => setFormData({ ...formData, fecha_alta: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    placeholder="555-1234567"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  placeholder="Dirección completa"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  required
                />
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
                  {submitting ? "Registrando..." : "Registrar Personal"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{personal.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{activos.length} activos</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Administrativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{administrativo.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Personal de oficina</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taller</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{taller.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Personal técnico</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Registro de Personal</CardTitle>
          <CardDescription>Listado completo de empleados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : personal.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay personal registrado
            </div>
          ) : (
            <div className="space-y-3">
              {personal.map((person) => (
                <div
                  key={person.id}
                  className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{person.nombre}</h4>
                        <Badge variant={person.estado === "activo" ? "default" : "secondary"}>
                          {person.estado}
                        </Badge>
                        <Badge variant={person.departamento === "administrativo" ? "outline" : "secondary"}>
                          {person.departamento}
                        </Badge>
                        <span className="text-sm text-muted-foreground">• {person.numero_empleado}</span>
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Puesto: {person.puesto} • Alta: {new Date(person.fecha_alta).toLocaleDateString("es-MX")}</span>
                        </div>
                        {person.telefono && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{person.telefono}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{person.direccion}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetails(person)}
                          className="w-full sm:w-auto"
                        >
                          Ver Detalles
                        </Button>
                        {person.estado === "activo" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(person)}
                              className="w-full sm:w-auto"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openQRDialog(person)}
                              className="w-full sm:w-auto"
                            >
                              <QrCode className="h-4 w-4 mr-1" />
                              Ver QR
                            </Button>
                          </>
                        )}
                      </div>
                      {person.estado === "activo" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeactivateDialog(person)}
                          className="w-full sm:w-auto"
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Dar de Baja
                        </Button>
                      )}
                      {userRole === "admin" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setPersonToDelete(person);
                            setDeleteDialogOpen(true);
                          }}
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      )}
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
            <DialogTitle>Detalles del Personal</DialogTitle>
            <DialogDescription>Información completa del empleado</DialogDescription>
          </DialogHeader>
          {selectedPerson && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Nombre Completo</Label>
                  <p className="font-medium text-foreground">{selectedPerson.nombre}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Número de Empleado</Label>
                  <p className="font-medium text-foreground">{selectedPerson.numero_empleado}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Departamento</Label>
                  <Badge variant={selectedPerson.departamento === "administrativo" ? "outline" : "secondary"}>
                    {selectedPerson.departamento}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Puesto</Label>
                  <p className="font-medium text-foreground">{selectedPerson.puesto}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Alta</Label>
                  <p className="font-medium text-foreground">
                    {new Date(selectedPerson.fecha_alta).toLocaleDateString("es-MX")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <Badge variant={selectedPerson.estado === "activo" ? "default" : "secondary"}>
                    {selectedPerson.estado}
                  </Badge>
                </div>
                {selectedPerson.telefono && (
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="font-medium text-foreground">{selectedPerson.telefono}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">Dirección</Label>
                  <p className="font-medium text-foreground">{selectedPerson.direccion}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Código QR de Acceso</DialogTitle>
            <DialogDescription>
              {selectedPerson?.nombre} - {selectedPerson?.numero_empleado}
            </DialogDescription>
          </DialogHeader>
          {selectedPerson && selectedPerson.qr_code ? (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeGenerator value={selectedPerson.qr_code} size={250} />
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Este código QR puede ser escaneado en el sistema de asistencia para registrar entrada y salida.</p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-foreground mb-1">Información de Vacaciones:</p>
                  <p>Días disponibles: <span className="font-semibold">{selectedPerson.dias_vacaciones_disponibles}</span></p>
                  <p>Días tomados: <span className="font-semibold">{selectedPerson.dias_vacaciones_tomados}</span></p>
                </div>
              </div>
              <Button
                onClick={() => downloadQRCode(selectedPerson)}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar QR
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No se ha generado un código QR para este empleado
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Dar de baja a este empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cambiará el estado del empleado {personToDeactivate?.nombre} a "inactivo".
              El registro se mantendrá en el sistema pero no aparecerá en las estadísticas de empleados activos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} className="bg-destructive hover:bg-destructive/90">
              Dar de Baja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Department Dialog */}
      <Dialog open={departmentDialogOpen} onOpenChange={setDepartmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Departamento</DialogTitle>
            <DialogDescription>Ingrese el nombre del nuevo departamento</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-department">Nombre del Departamento</Label>
              <Input
                id="new-department"
                placeholder="Ej: Recursos Humanos, Ventas"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDepartmentDialogOpen(false);
                  setNewDepartmentName("");
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddDepartment} disabled={!newDepartmentName.trim()}>
                Agregar Departamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Personal?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a {personToDelete?.nombre}. 
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
    </div>
  );
}
