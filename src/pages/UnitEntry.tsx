import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Truck, Camera, AlertCircle } from "lucide-react";

const ctpatPoints = [
  "1. Puertas y cerraduras de caja",
  "2. Sistema de iluminación exterior",
  "3. Sello de seguridad",
  "4. Puertas laterales",
  "5. Panel frontal",
  "6. Panel lateral izquierdo",
  "7. Panel lateral derecho",
  "8. Techo",
  "9. Piso interior",
  "10. Compartimento de carga",
  "11. Quinta rueda",
  "12. Neumáticos y llantas",
  "13. Tanque de combustible",
  "14. Batería y cableado",
  "15. Sistema de escape",
  "16. Chasis y suspensión",
  "17. Documentación y placas",
];

export default function UnitEntry() {
  const [checkedPoints, setCheckedPoints] = useState<Record<string, boolean>>({});
  const [entryType, setEntryType] = useState<"entrada" | "salida">("entrada");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const checkedCount = Object.values(checkedPoints).filter(Boolean).length;
    
    if (checkedCount < ctpatPoints.length) {
      toast.error("Por favor complete todos los 17 puntos de inspección CTPAT");
      return;
    }

    toast.success(`Unidad registrada exitosamente (${entryType})`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary rounded-lg">
          <Truck className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ingreso de Unidades</h1>
          <p className="text-muted-foreground">Registro basado en 17 puntos de seguridad CTPAT</p>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Nueva Inspección de Unidad</CardTitle>
              <CardDescription>Complete todos los campos requeridos y los 17 puntos CTPAT</CardDescription>
            </div>
            <Select value={entryType} onValueChange={(value: "entrada" | "salida") => setEntryType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="salida">Salida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basico" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basico">Datos Básicos</TabsTrigger>
                <TabsTrigger value="inspeccion">Inspección CTPAT</TabsTrigger>
                <TabsTrigger value="adicional">Información Adicional</TabsTrigger>
              </TabsList>

              <TabsContent value="basico" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tracto">Número de Tracto</Label>
                    <Input id="tracto" placeholder="MX-1234" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remolque">Número de Remolque</Label>
                    <Input id="remolque" placeholder="REM-567" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dolly">Número de Dolly</Label>
                    <Input id="dolly" placeholder="DOL-890" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remolque2">Segundo Remolque</Label>
                    <Input id="remolque2" placeholder="REM-891" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="operador">Operador</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar operador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="op1">Juan Pérez</SelectItem>
                        <SelectItem value="op2">María García</SelectItem>
                        <SelectItem value="op3">Carlos López</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="odometro">Odómetro (km)</Label>
                    <Input id="odometro" type="number" placeholder="150000" required />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="inspeccion" className="space-y-4">
                <div className="p-4 bg-muted rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Inspección CTPAT Obligatoria</p>
                    <p className="text-muted-foreground mt-1">
                      Verifique cada uno de los 17 puntos de seguridad antes de aprobar el ingreso/salida de la unidad.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {ctpatPoints.map((point, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={`point-${index}`}
                        checked={checkedPoints[index] || false}
                        onCheckedChange={(checked) =>
                          setCheckedPoints((prev) => ({ ...prev, [index]: checked === true }))
                        }
                      />
                      <label
                        htmlFor={`point-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {point}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <span className="text-sm font-medium text-foreground">Puntos completados:</span>
                  <Badge variant={Object.values(checkedPoints).filter(Boolean).length === ctpatPoints.length ? "default" : "secondary"}>
                    {Object.values(checkedPoints).filter(Boolean).length} / {ctpatPoints.length}
                  </Badge>
                </div>
              </TabsContent>

              <TabsContent value="adicional" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fotografías de la Unidad</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                        <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Foto 1 - Vista Frontal</p>
                      </div>
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                        <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Foto 2 - Vista Lateral</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border">
                    <Checkbox id="mantenimiento" />
                    <label htmlFor="mantenimiento" className="text-sm font-medium leading-none cursor-pointer">
                      Unidad requiere mantenimiento
                    </label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border">
                    <Checkbox id="incidente" />
                    <label htmlFor="incidente" className="text-sm font-medium leading-none cursor-pointer">
                      Reportar accidente/siniestro/golpe
                    </label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      placeholder="Ingrese cualquier observación adicional sobre el estado de la unidad..."
                      rows={4}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Registrar {entryType === "entrada" ? "Entrada" : "Salida"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
