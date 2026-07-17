
CREATE OR REPLACE FUNCTION public.operador_registrar_ubicacion_tracking(
  _qr_code text,
  _viaje_id uuid,
  _lat double precision,
  _lng double precision,
  _accuracy double precision DEFAULT NULL,
  _speed double precision DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  op record;
  new_id uuid;
  loc text;
BEGIN
  SELECT id, nombre, client_id INTO op FROM public.operadores
   WHERE qr_code = _qr_code OR numero_empleado = _qr_code LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  loc := _lat::text || ',' || _lng::text;

  INSERT INTO public.operador_ubicaciones_historial(operador_id, viaje_id, client_id, evento, lat, lng, ubicacion_texto)
  VALUES (op.id, _viaje_id, op.client_id, 'tracking', _lat, _lng, loc)
  RETURNING id INTO new_id;

  UPDATE public.viajes
     SET ubicacion_actual = loc,
         ultima_actualizacion_ubicacion = now()
   WHERE id = _viaje_id AND operador = op.nombre AND estado = 'en_transito';

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.operador_registrar_ubicacion_tracking(text, uuid, double precision, double precision, double precision, double precision) TO anon, authenticated;
