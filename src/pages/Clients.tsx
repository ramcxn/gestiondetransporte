import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Building2, Search, Plus, FileText, Shield, Users, MapPin, Upload } from "lucide-react";

interface ClientInvestigation {
  // Datos generales
  razon_social: string;
  nombre_comercial: string;
  rfc: string;
  direccion_fiscal: string;
  telefono: string;
  email: string;
  sitio_web?: string;
  
  // Representante legal
  representante_legal: string;
  identificacion_representante: string;
  
  // Investigación CTPAT
  años_operacion: number;
  referencias_comerciales: any[];
  historial_credito: string;
  certificaciones: string[];
  
  // Seguridad
  sistemas_seguridad: string;
  personal_seguridad: number;
  capacitacion_seguridad: string;
  
  // Instalaciones
  descripcion_instalaciones: string;
  medidas_perimetrales: string;
  control_acceso: string;
  
  // Documentación
  constancia_fiscal?: string;
  identificacion_oficial?: string;
  comprobante_domicilio?: string;
  acta_constitutiva?: string;
  
  // Evaluación
  nivel_riesgo: "bajo" | "medio" | "alto";
  observaciones: string;
  aprobado: boolean;
  fecha_aprobacion?: string;
}

export default function Clients() {
  const { userRole } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const [formData, setFormData] = useState<Partial<ClientInvestigation>>({
    referencias_comerciales: [],
    certificaciones: [],
  });

  const { data: clientes, isLoading, refetch } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("clientes")
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente registrado exitosamente");
      setDialogOpen(false);
      refetch();
      setFormData({ referencias_comerciales: [], certificaciones: [] });
    },
    onError: (error) => {
      toast.error("Error al registrar cliente");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

      const clientsToImport = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length < 1) continue;
        
        const nombreFiscal = row[5]?.toString().trim();
        const rfc = row[3]?.toString().trim();
        const telefono = row[22]?.toString().trim();
        const email = row[24]?.toString().trim();
        
        const calle = row[13]?.toString().trim() || '';
        const noExt = row[14]?.toString().trim() || '';
        const colonia = row[16]?.toString().trim() || '';
        const municipio = row[18]?.toString().trim() || '';
        const estado = row[19]?.toString().trim() || '';
        const cp = row[20]?.toString().trim() || '';
        const direccion = `${calle} ${noExt}, ${colonia}, ${municipio}, ${estado}, CP ${cp}`.replace(/\s+/g, ' ').trim();
        
        if (nombreFiscal && rfc && rfc !== 'XAXX010101000') {
          clientsToImport.push({
            nombre: nombreFiscal,
            rfc: rfc,
            telefono: telefono || null,
            email: email || null,
            direccion: direccion || null,
            activo: true,
          });
        }
      }

      if (clientsToImport.length > 0) {
        const { error } = await supabase
          .from('clientes')
          .insert(clientsToImport);

        if (error) throw error;

        toast.success(`${clientsToImport.length} clientes importados exitosamente`);
        setImportDialogOpen(false);
        refetch();
      } else {
        toast.error('No se encontraron clientes válidos para importar');
      }
    } catch (error) {
      console.error('Error importing clients:', error);
      toast.error('Error al importar clientes');
    } finally {
      setImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  const filteredClientes = clientes?.filter(cliente =>
    cliente.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cliente.rfc?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (userRole !== "admin") {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Gestión de Clientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Investigación y validación CTPAT de socios comerciales
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importar Excel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Clientes desde Excel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="excel-file">Archivo Excel (.xls, .xlsx, .csv)</Label>
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xls,.xlsx,.csv,.tsv"
                    onChange={handleImportExcel}
                    disabled={importing}
                  />
                  <p className="text-sm text-muted-foreground">
                    Seleccione el archivo Excel con el catálogo de clientes
                  </p>
                </div>
                {importing && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Importando clientes...</span>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Investigación de Cliente CTPAT</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
                  <TabsTrigger value="instalaciones">Instalaciones</TabsTrigger>
                  <TabsTrigger value="evaluacion">Evaluación</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="razon_social">Razón Social *</Label>
                      <Input
                        id="razon_social"
                        required
                        value={formData.razon_social || ""}
                        onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nombre_comercial">Nombre Comercial</Label>
                      <Input
                        id="nombre_comercial"
                        value={formData.nombre_comercial || ""}
                        onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rfc">RFC *</Label>
                      <Input
                        id="rfc"
                        required
                        value={formData.rfc || ""}
                        onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        type="tel"
                        value={formData.telefono || ""}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="años_operacion">Años de Operación</Label>
                      <Input
                        id="años_operacion"
                        type="number"
                        value={formData.años_operacion || ""}
                        onChange={(e) => setFormData({ ...formData, años_operacion: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direccion_fiscal">Dirección Fiscal *</Label>
                    <Textarea
                      id="direccion_fiscal"
                      required
                      value={formData.direccion_fiscal || ""}
                      onChange={(e) => setFormData({ ...formData, direccion_fiscal: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="representante_legal">Representante Legal</Label>
                      <Input
                        id="representante_legal"
                        value={formData.representante_legal || ""}
                        onChange={(e) => setFormData({ ...formData, representante_legal: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="identificacion_representante">Identificación del Representante</Label>
                      <Input
                        id="identificacion_representante"
                        value={formData.identificacion_representante || ""}
                        onChange={(e) => setFormData({ ...formData, identificacion_representante: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="seguridad" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sistemas_seguridad">Sistemas de Seguridad</Label>
                    <Textarea
                      id="sistemas_seguridad"
                      placeholder="Describa los sistemas de seguridad implementados (CCTV, alarmas, control de acceso, etc.)"
                      value={formData.sistemas_seguridad || ""}
                      onChange={(e) => setFormData({ ...formData, sistemas_seguridad: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personal_seguridad">Personal de Seguridad</Label>
                    <Input
                      id="personal_seguridad"
                      type="number"
                      placeholder="Número de personal de seguridad"
                      value={formData.personal_seguridad || ""}
                      onChange={(e) => setFormData({ ...formData, personal_seguridad: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacitacion_seguridad">Capacitación en Seguridad</Label>
                    <Textarea
                      id="capacitacion_seguridad"
                      placeholder="Describa los programas de capacitación en seguridad"
                      value={formData.capacitacion_seguridad || ""}
                      onChange={(e) => setFormData({ ...formData, capacitacion_seguridad: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="historial_credito">Historial Crediticio</Label>
                    <Textarea
                      id="historial_credito"
                      placeholder="Información del historial crediticio y referencias comerciales"
                      value={formData.historial_credito || ""}
                      onChange={(e) => setFormData({ ...formData, historial_credito: e.target.value })}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="instalaciones" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="descripcion_instalaciones">Descripción de Instalaciones</Label>
                    <Textarea
                      id="descripcion_instalaciones"
                      placeholder="Describa las instalaciones físicas, ubicación, tamaño, etc."
                      value={formData.descripcion_instalaciones || ""}
                      onChange={(e) => setFormData({ ...formData, descripcion_instalaciones: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medidas_perimetrales">Medidas de Seguridad Perimetral</Label>
                    <Textarea
                      id="medidas_perimetrales"
                      placeholder="Describa cercas, muros, iluminación perimetral, etc."
                      value={formData.medidas_perimetrales || ""}
                      onChange={(e) => setFormData({ ...formData, medidas_perimetrales: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="control_acceso">Control de Acceso</Label>
                    <Textarea
                      id="control_acceso"
                      placeholder="Describa los procedimientos de control de acceso a las instalaciones"
                      value={formData.control_acceso || ""}
                      onChange={(e) => setFormData({ ...formData, control_acceso: e.target.value })}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="evaluacion" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nivel_riesgo">Nivel de Riesgo</Label>
                    <select
                      id="nivel_riesgo"
                      className="w-full border rounded-md p-2"
                      value={formData.nivel_riesgo || "medio"}
                      onChange={(e) => setFormData({ ...formData, nivel_riesgo: e.target.value as any })}
                    >
                      <option value="bajo">Bajo</option>
                      <option value="medio">Medio</option>
                      <option value="alto">Alto</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones Generales</Label>
                    <Textarea
                      id="observaciones"
                      placeholder="Conclusiones de la investigación CTPAT"
                      value={formData.observaciones || ""}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      rows={6}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="aprobado"
                      checked={formData.aprobado || false}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        aprobado: e.target.checked,
                        fecha_aprobacion: e.target.checked ? new Date().toISOString() : undefined
                      })}
                    />
                    <Label htmlFor="aprobado">Cliente Aprobado CTPAT</Label>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  <FileText className="h-4 w-4 mr-2" />
                  Guardar Investigación
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <Input
              placeholder="Buscar por nombre o RFC..."
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
              {filteredClientes?.map((cliente) => (
                <Card key={cliente.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{cliente.nombre}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {cliente.rfc || "Sin RFC"}
                          </span>
                          {cliente.email && (
                            <span>{cliente.email}</span>
                          )}
                          {cliente.telefono && (
                            <span>{cliente.telefono}</span>
                          )}
                        </div>
                        {cliente.direccion && (
                          <p className="text-sm text-muted-foreground flex items-start gap-1 mt-2">
                            <MapPin className="h-4 w-4 mt-0.5" />
                            {cliente.direccion}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          cliente.activo 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {cliente.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredClientes?.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  No se encontraron clientes
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
