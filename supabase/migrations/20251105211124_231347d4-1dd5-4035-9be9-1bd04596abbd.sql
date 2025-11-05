-- Create table for exit passes
CREATE TABLE public.vales_salida (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID NOT NULL REFERENCES public.personal(id) ON DELETE CASCADE,
  fecha_vale DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_salida_autorizada TIME NOT NULL,
  motivo TEXT NOT NULL,
  autorizado_por UUID NOT NULL REFERENCES public.profiles(id),
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'usado', 'vencido', 'cancelado')),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  client_id UUID REFERENCES public.clientes(id)
);

-- Enable RLS
ALTER TABLE public.vales_salida ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view vales_salida from their client"
  ON public.vales_salida
  FOR SELECT
  USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Admins can create vales_salida for their client"
  ON public.vales_salida
  FOR INSERT
  WITH CHECK (is_admin() AND client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Admins can update vales_salida from their client"
  ON public.vales_salida
  FOR UPDATE
  USING (is_admin() AND client_id = get_user_client_id());

CREATE POLICY "Admins can delete vales_salida"
  ON public.vales_salida
  FOR DELETE
  USING (is_admin());

-- Create index for performance
CREATE INDEX idx_vales_salida_personal_fecha ON public.vales_salida(personal_id, fecha_vale);
CREATE INDEX idx_vales_salida_estado ON public.vales_salida(estado);