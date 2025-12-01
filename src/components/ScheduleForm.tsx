import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PersonalRecord {
  id: string;
  nombre: string;
  numero_empleado: string;
  hora_entrada_esperada: string | null;
  hora_salida_esperada: string | null;
  hora_salida_sabado: string | null;
  turno: string | null;
  dias_trabajo: any;
  observaciones_horario: string | null;
}

interface ScheduleFormProps {
  person: PersonalRecord;
  onClose: () => void;
}

const DIAS_SEMANA = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" }
];

export default function ScheduleForm({ person, onClose }: ScheduleFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  // Parse dias_trabajo from JSONB
  const parseDiasTrabajo = (dias: any): string[] => {
    if (!dias) return ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    if (Array.isArray(dias)) return dias;
    if (typeof dias === "string") {
      try {
        return JSON.parse(dias);
      } catch {
        return ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
      }
    }
    return ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  };

  const [formData, setFormData] = useState({
    hora_entrada_esperada: person.hora_entrada_esperada || "09:00",
    hora_salida_esperada: person.hora_salida_esperada || "18:00",
    hora_salida_sabado: person.hora_salida_sabado || "13:30",
    turno: person.turno || "matutino",
    dias_trabajo: parseDiasTrabajo(person.dias_trabajo),
    observaciones_horario: person.observaciones_horario || ""
  });

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      dias_trabajo: prev.dias_trabajo.includes(day)
        ? prev.dias_trabajo.filter(d => d !== day)
        : [...prev.dias_trabajo, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("personal")
        .update({
          hora_entrada_esperada: formData.hora_entrada_esperada,
          hora_salida_esperada: formData.hora_salida_esperada,
          hora_salida_sabado: formData.hora_salida_sabado,
          turno: formData.turno,
          dias_trabajo: formData.dias_trabajo,
          observaciones_horario: formData.observaciones_horario || null
        })
        .eq("id", person.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Horario actualizado exitosamente"
      });

      onClose();
    } catch (error: any) {
      console.error("Error updating schedule:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el horario",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="turno">Turno</Label>
          <Select
            value={formData.turno}
            onValueChange={(value) => setFormData({ ...formData, turno: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="matutino">Matutino</SelectItem>
              <SelectItem value="vespertino">Vespertino</SelectItem>
              <SelectItem value="nocturno">Nocturno</SelectItem>
              <SelectItem value="mixto">Mixto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hora_entrada_esperada">Hora de Entrada</Label>
          <Input
            id="hora_entrada_esperada"
            type="time"
            value={formData.hora_entrada_esperada}
            onChange={(e) => setFormData({ ...formData, hora_entrada_esperada: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hora_salida_esperada">Hora de Salida (L-V)</Label>
          <Input
            id="hora_salida_esperada"
            type="time"
            value={formData.hora_salida_esperada}
            onChange={(e) => setFormData({ ...formData, hora_salida_esperada: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hora_salida_sabado">Hora de Salida (Sábado)</Label>
          <Input
            id="hora_salida_sabado"
            type="time"
            value={formData.hora_salida_sabado}
            onChange={(e) => setFormData({ ...formData, hora_salida_sabado: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Días de Trabajo</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DIAS_SEMANA.map(dia => (
            <div key={dia.value} className="flex items-center space-x-2">
              <Checkbox
                id={dia.value}
                checked={formData.dias_trabajo.includes(dia.value)}
                onCheckedChange={() => handleDayToggle(dia.value)}
              />
              <Label
                htmlFor={dia.value}
                className="text-sm font-normal cursor-pointer"
              >
                {dia.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observaciones_horario">Observaciones del Horario</Label>
        <Textarea
          id="observaciones_horario"
          placeholder="Notas adicionales sobre el horario..."
          value={formData.observaciones_horario}
          onChange={(e) => setFormData({ ...formData, observaciones_horario: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Guardando..." : "Guardar Horario"}
        </Button>
      </div>
    </form>
  );
}
