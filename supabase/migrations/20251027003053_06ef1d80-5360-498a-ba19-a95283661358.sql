-- Create unidades table for equipment inventory
CREATE TABLE public.unidades (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_economico text NOT NULL UNIQUE,
  tipo text NOT NULL,
  marca text NOT NULL,
  modelo text NOT NULL,
  placas text,
  ubicacion text NOT NULL,
  estado text NOT NULL DEFAULT 'disponible',
  odometro integer NOT NULL DEFAULT 0,
  requiere_mantenimiento boolean NOT NULL DEFAULT false,
  ultima_entrada timestamp with time zone,
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all unidades"
  ON public.unidades
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create unidades"
  ON public.unidades
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update unidades"
  ON public.unidades
  FOR UPDATE
  USING (true);

-- Create index for better performance
CREATE INDEX idx_unidades_tipo ON public.unidades(tipo);
CREATE INDEX idx_unidades_estado ON public.unidades(estado);