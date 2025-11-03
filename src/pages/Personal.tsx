import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, Phone, MapPin, UserX } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
}

export default function Personal() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PersonalRecord | null>(null);
  const [personal, setPersonal] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [personToDeactivate, setPersonToDeactivate] = useState<PersonalRecord | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
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

    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      // Get client_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", user.id)
        .single();

      if (!profile?.client_id) throw new Error("No client_id found");

      const { error } = await supabase
        .from("personal")
        .insert({
          nombre: formData.nombre,
          numero_empleado: formData.numero_empleado,
          puesto: formData.puesto,
          departamento: formData.departamento,
          fecha_alta: formData.fecha_alta,
          direccion: formData.direccion,
          telefono: formData.telefono || null,
          client_id: profile.client_id,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Personal registrado exitosamente",
      });

      setFormData({
        nombre: "",
        numero_empleado: "",
        puesto: "",
        departamento: "administrativo",
        fecha_alta: "",
        direccion: "",
        telefono: "",
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error submitting personal:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el personal",
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Users className="h-4 w-4 mr-2" />
              Nuevo Personal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Personal</DialogTitle>
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
                  <Label htmlFor="departamento">Departamento</Label>
                  <Select
                    value={formData.departamento}
                    onValueChange={(value) => setFormData({ ...formData, departamento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrativo">Administrativo</SelectItem>
                      <SelectItem value="taller">Taller</SelectItem>
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
                  <div className="flex items-start justify-between">
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetails(person)}
                      >
                        Ver Detalles
                      </Button>
                      {person.estado === "activo" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeactivateDialog(person)}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Dar de Baja
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
    </div>
  );
}
