import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Package, Edit, AlertCircle, ArrowLeft, Trash2, Upload } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function WarehouseCatalog() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: refacciones, isLoading } = useQuery({
    queryKey: ["refacciones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refacciones")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: ubicaciones } = useQuery({
    queryKey: ["ubicaciones_almacen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ubicaciones_almacen")
        .select("*")
        .eq("activa", true)
        .order("codigo");
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Obtener el client_id basado en el dominio del email
      const { data: clientIdByDomain } = await supabase.rpc('get_client_id_by_email_domain');
      
      // Si no hay client_id por dominio, obtener del perfil
      let clientId = clientIdByDomain;
      if (!clientId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('client_id')
          .eq('id', user.id)
          .single();
        clientId = profile?.client_id;
      }

      if (!clientId) throw new Error("No se encontró el cliente del usuario");

      const { error } = await supabase.from("refacciones").insert([
        { 
          ...formData, 
          created_by: user.id,
          client_id: clientId
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refacciones"] });
      toast({ title: "Refacción creada exitosamente" });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear refacción",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (refaccionId: string) => {
      const { error } = await supabase
        .from("refacciones")
        .delete()
        .eq("id", refaccionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refacciones"] });
      toast({ title: "Refacción eliminada exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar refacción",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      numero_parte: formData.get("numero_parte"),
      descripcion: formData.get("descripcion"),
      categoria: formData.get("categoria"),
      proveedor: formData.get("proveedor"),
      precio_unitario: parseFloat(formData.get("precio_unitario") as string),
      unidad_medida: formData.get("unidad_medida"),
      ubicacion_principal: formData.get("ubicacion_principal") || null,
      stock_minimo: parseInt(formData.get("stock_minimo") as string),
      stock_maximo: parseInt(formData.get("stock_maximo") as string),
      punto_reorden: parseInt(formData.get("punto_reorden") as string),
      requiere_serie: formData.get("requiere_serie") === "on",
      tiene_caducidad: formData.get("tiene_caducidad") === "on",
      dias_vida_util: formData.get("dias_vida_util") ? parseInt(formData.get("dias_vida_util") as string) : null,
      notas: formData.get("notas"),
    });
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay usuario autenticado");

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single();

      if (!profile?.client_id) throw new Error("No se encontró el cliente del usuario");

      // Obtener el client_id basado en el dominio del email
      const { data: clientIdByDomain } = await supabase.rpc('get_client_id_by_email_domain');
      const clientId = clientIdByDomain || profile.client_id;

      let imported = 0;
      // Skip header row (row 0)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length < 2) continue;

        const codigo = row[0]?.toString().trim();
        const descripcion = row[1]?.toString().trim();
        const ubicacion = row[5]?.toString().trim() || '';
        const categoria = row[6]?.toString().trim() || 'General';
        const activo = row[8]?.toString().trim().toUpperCase() === 'SI';

        if (!codigo || !descripcion) continue;

        let ubicacionId = null;
        if (ubicacion && ubicaciones) {
          const ubicacionMatch = ubicaciones.find(u => 
            u.descripcion.toLowerCase().includes(ubicacion.toLowerCase()) ||
            u.codigo.toLowerCase().includes(ubicacion.toLowerCase())
          );
          if (ubicacionMatch) ubicacionId = ubicacionMatch.id;
        }

        const { error } = await supabase
          .from('refacciones')
          .insert([{
            numero_parte: codigo,
            descripcion: descripcion,
            categoria: categoria,
            proveedor: 'Por definir',
            precio_unitario: 0,
            unidad_medida: 'PZA',
            ubicacion_principal: ubicacionId,
            stock_minimo: 0,
            stock_maximo: 100,
            punto_reorden: 10,
            activa: activo,
            client_id: clientId,
            created_by: user.id
          }]);

        if (!error) imported++;
      }

      toast({ title: `${imported} refacciones importadas exitosamente` });
      queryClient.invalidateQueries({ queryKey: ["refacciones"] });
      setImportDialogOpen(false);
    } catch (error) {
      console.error('Error importing Excel:', error);
      toast({
        title: "Error al importar archivo",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const filteredRefacciones = refacciones?.filter((r) =>
    r.numero_parte.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/almacen">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Almacén
          </Button>
        </Link>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar refacciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
                <DialogTitle>Importar Refacciones desde Excel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Archivo Excel (.xls, .xlsx)</Label>
                  <Input
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={handleImportExcel}
                    disabled={importing}
                  />
                  <p className="text-sm text-muted-foreground">
                    El archivo debe contener las columnas: Codigo, Articulo, Ubicación, Familia, Activo
                  </p>
                </div>
                {importing && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Importando...</span>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Refacción
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Refacción</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_parte">Número de Parte *</Label>
                  <Input id="numero_parte" name="numero_parte" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría *</Label>
                  <Input id="categoria" name="categoria" required placeholder="Ej: Motor, Suspensión, Frenos" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea id="descripcion" name="descripcion" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proveedor">Proveedor *</Label>
                  <Input id="proveedor" name="proveedor" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precio_unitario">Precio Unitario *</Label>
                  <Input id="precio_unitario" name="precio_unitario" type="number" step="0.01" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unidad_medida">Unidad de Medida *</Label>
                  <Input id="unidad_medida" name="unidad_medida" required placeholder="Ej: PZA, LT, KG" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ubicacion_principal">Ubicación Principal</Label>
                  <Select name="ubicacion_principal">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {ubicaciones?.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.codigo} - {u.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock_minimo">Stock Mínimo *</Label>
                  <Input id="stock_minimo" name="stock_minimo" type="number" defaultValue="0" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="punto_reorden">Punto de Reorden *</Label>
                  <Input id="punto_reorden" name="punto_reorden" type="number" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_maximo">Stock Máximo *</Label>
                  <Input id="stock_maximo" name="stock_maximo" type="number" required />
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox id="requiere_serie" name="requiere_serie" />
                  <Label htmlFor="requiere_serie">Requiere Número de Serie</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="tiene_caducidad" name="tiene_caducidad" />
                  <Label htmlFor="tiene_caducidad">Tiene Caducidad</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dias_vida_util">Días de Vida Útil</Label>
                <Input id="dias_vida_util" name="dias_vida_util" type="number" placeholder="Solo si tiene caducidad" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea id="notas" name="notas" />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRefacciones?.map((refaccion) => (
          <Card key={refaccion.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{refaccion.numero_parte}</CardTitle>
                </div>
                <Badge variant={refaccion.activa ? "default" : "secondary"}>
                  {refaccion.activa ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{refaccion.descripcion}</p>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categoría:</span>
                  <Badge variant="outline">{refaccion.categoria}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proveedor:</span>
                  <span className="font-medium">{refaccion.proveedor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio:</span>
                  <span className="font-medium">${refaccion.precio_unitario} / {refaccion.unidad_medida}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stock:</span>
                  <span className="font-medium">
                    Min: {refaccion.stock_minimo} | Reorden: {refaccion.punto_reorden} | Max: {refaccion.stock_maximo}
                  </span>
                </div>
              </div>

              {(refaccion.requiere_serie || refaccion.tiene_caducidad) && (
                <div className="flex gap-2">
                  {refaccion.requiere_serie && (
                    <Badge variant="secondary" className="text-xs">Serie</Badge>
                  )}
                  {refaccion.tiene_caducidad && (
                    <Badge variant="secondary" className="text-xs">Caducidad</Badge>
                  )}
                </div>
              )}

              <div className="pt-3 border-t">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar refacción?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente la refacción "{refaccion.numero_parte}" del catálogo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(refaccion.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRefacciones?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No se encontraron refacciones</p>
            <p className="text-sm text-muted-foreground">Agrega tu primera refacción al catálogo</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}