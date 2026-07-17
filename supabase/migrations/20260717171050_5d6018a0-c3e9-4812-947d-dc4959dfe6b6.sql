
CREATE OR REPLACE FUNCTION public.operador_actualizar_estado_viaje(
  _qr_code text, _viaje_id uuid, _nuevo_estado text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  op record;
  updated int;
BEGIN
  IF _nuevo_estado NOT IN ('en_zona_carga','en_transito','completado') THEN
    RETURN jsonb_build_object('error','estado_invalido');
  END IF;

  SELECT id, nombre, client_id INTO op FROM public.operadores
   WHERE qr_code = _qr_code OR numero_empleado = _qr_code LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error','operador_no_encontrado');
  END IF;

  UPDATE public.viajes
     SET estado = _nuevo_estado,
         fecha_llegada_real = CASE WHEN _nuevo_estado = 'completado' THEN now() ELSE fecha_llegada_real END,
         ultima_actualizacion_ubicacion = now()
   WHERE id = _viaje_id AND operador = op.nombre;
  GET DIAGNOSTICS updated = ROW_COUNT;

  IF updated = 0 THEN
    RETURN jsonb_build_object('error','viaje_no_encontrado');
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.operador_actualizar_estado_viaje(text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.operador_actualizar_estado_viaje(text, uuid, text) TO anon, authenticated;
