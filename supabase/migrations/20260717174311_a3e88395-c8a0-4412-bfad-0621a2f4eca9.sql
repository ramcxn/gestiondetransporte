
CREATE TABLE public.viaje_bitacora_intentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viaje_id uuid,
  operador_id uuid,
  qr_code text,
  accion text NOT NULL,
  resultado text NOT NULL CHECK (resultado IN ('exito','error')),
  error_code text,
  error_message text,
  payload jsonb,
  server_response jsonb,
  lat double precision,
  lng double precision,
  fuente_ubicacion text,
  user_agent text,
  client_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.viaje_bitacora_intentos TO authenticated;
GRANT ALL ON public.viaje_bitacora_intentos TO service_role;

ALTER TABLE public.viaje_bitacora_intentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios con permiso de viajes pueden ver bitacora"
ON public.viaje_bitacora_intentos
FOR SELECT
TO authenticated
USING (public.has_table_module_permission(auth.uid(), 'viajes', 'read'));

CREATE INDEX idx_viaje_bitacora_viaje ON public.viaje_bitacora_intentos(viaje_id, created_at DESC);
CREATE INDEX idx_viaje_bitacora_operador ON public.viaje_bitacora_intentos(operador_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.operador_registrar_intento_bitacora(
  _qr_code text,
  _viaje_id uuid,
  _accion text,
  _resultado text,
  _error_code text DEFAULT NULL,
  _error_message text DEFAULT NULL,
  _payload jsonb DEFAULT NULL,
  _server_response jsonb DEFAULT NULL,
  _lat double precision DEFAULT NULL,
  _lng double precision DEFAULT NULL,
  _fuente_ubicacion text DEFAULT NULL,
  _user_agent text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  op record;
  new_id uuid;
BEGIN
  SELECT id, client_id INTO op FROM public.operadores
   WHERE qr_code = _qr_code OR numero_empleado = _qr_code LIMIT 1;

  INSERT INTO public.viaje_bitacora_intentos(
    viaje_id, operador_id, qr_code, accion, resultado,
    error_code, error_message, payload, server_response,
    lat, lng, fuente_ubicacion, user_agent, client_id
  ) VALUES (
    _viaje_id, op.id, _qr_code, _accion,
    CASE WHEN lower(_resultado) IN ('exito','ok','success') THEN 'exito' ELSE 'error' END,
    _error_code, _error_message, _payload, _server_response,
    _lat, _lng, _fuente_ubicacion, _user_agent, op.client_id
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.operador_registrar_intento_bitacora(
  text, uuid, text, text, text, text, jsonb, jsonb,
  double precision, double precision, text, text
) TO anon, authenticated;
