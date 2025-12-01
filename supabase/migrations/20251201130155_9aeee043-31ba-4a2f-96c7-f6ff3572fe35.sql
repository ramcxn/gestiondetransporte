-- Add schedule fields to personal table for managing work hours
ALTER TABLE public.personal
ADD COLUMN IF NOT EXISTS hora_entrada_esperada time DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS hora_salida_esperada time DEFAULT '18:00:00',
ADD COLUMN IF NOT EXISTS hora_salida_sabado time DEFAULT '13:30:00',
ADD COLUMN IF NOT EXISTS turno text DEFAULT 'matutino',
ADD COLUMN IF NOT EXISTS dias_trabajo jsonb DEFAULT '["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]'::jsonb,
ADD COLUMN IF NOT EXISTS observaciones_horario text;