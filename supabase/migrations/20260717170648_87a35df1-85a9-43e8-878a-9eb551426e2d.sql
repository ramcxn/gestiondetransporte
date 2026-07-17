
-- Trip documents uploaded by operators
CREATE TABLE IF NOT EXISTS public.operador_documentos_viaje (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operador_id uuid NOT NULL REFERENCES public.operadores(id) ON DELETE CASCADE,
  viaje_id uuid REFERENCES public.viajes(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  archivo_url text NOT NULL,
  notas text,
  client_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operador_documentos_viaje TO authenticated;
GRANT ALL ON public.operador_documentos_viaje TO service_role;
GRANT SELECT, INSERT ON public.operador_documentos_viaje TO anon;

ALTER TABLE public.operador_documentos_viaje ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/staff can view op docs by client"
  ON public.operador_documentos_viaje FOR SELECT
  USING (public.is_admin() OR client_id = public.get_user_client_id());

CREATE POLICY "Admins can manage op docs"
  ON public.operador_documentos_viaje FOR ALL
  USING (public.is_admin() OR client_id = public.get_user_client_id())
  WITH CHECK (public.is_admin() OR client_id = public.get_user_client_id());

CREATE TABLE IF NOT EXISTS public.contactos_emergencia_operador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  telefono text NOT NULL,
  categoria text NOT NULL DEFAULT 'general',
  descripcion text,
  orden int NOT NULL DEFAULT 0,
  client_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contactos_emergencia_operador TO authenticated;
GRANT ALL ON public.contactos_emergencia_operador TO service_role;
GRANT SELECT ON public.contactos_emergencia_operador TO anon;

ALTER TABLE public.contactos_emergencia_operador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view emergency contacts"
  ON public.contactos_emergencia_operador FOR SELECT
  USING (true);

CREATE POLICY "Admins manage emergency contacts"
  ON public.contactos_emergencia_operador FOR ALL
  USING (public.is_admin() OR client_id = public.get_user_client_id())
  WITH CHECK (public.is_admin() OR client_id = public.get_user_client_id());

-- Storage policies for portal bucket
CREATE POLICY "Portal op upload docs"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'documentos-viaje-operador');

CREATE POLICY "Portal op read docs"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'documentos-viaje-operador');

-- RPC: authenticate operator by QR and return portal data
CREATE OR REPLACE FUNCTION public.get_operador_portal_data(_qr_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  op record;
  result jsonb;
BEGIN
  SELECT * INTO op FROM public.operadores 
   WHERE qr_code = _qr_code OR numero_empleado = _qr_code 
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'operador_no_encontrado');
  END IF;

  result := jsonb_build_object(
    'operador', to_jsonb(op) - 'created_by',
    'viajes', COALESCE((
      SELECT jsonb_agg(to_jsonb(v) ORDER BY v.fecha_salida DESC)
      FROM (
        SELECT * FROM public.viajes 
        WHERE operador = op.nombre AND client_id = op.client_id
        ORDER BY fecha_salida DESC LIMIT 50
      ) v
    ), '[]'::jsonb),
    'liquidaciones', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', l.id, 'folio', l.folio, 'monto_operador', l.monto_operador,
        'monto_total', l.monto_total, 'monto_neto', l.monto_neto,
        'deduccion', l.deduccion, 'estado', l.estado,
        'fecha_liquidacion', l.fecha_liquidacion, 'observaciones', l.observaciones,
        'viaje', jsonb_build_object('origen', v.origen, 'destino', v.destino, 'unidad', v.unidad)
      ))
      FROM public.liquidaciones l
      LEFT JOIN public.viajes v ON v.id = l.viaje_id
      WHERE v.operador = op.nombre AND l.client_id = op.client_id
    ), '[]'::jsonb),
    'unidad_actual', (
      SELECT to_jsonb(e) FROM public.inventario_equipos e
      WHERE e.numero_economico = (
        SELECT vi.unidad FROM public.viajes vi
        WHERE vi.operador = op.nombre AND vi.estado IN ('activo','en_transito')
        ORDER BY vi.fecha_salida DESC LIMIT 1
      )
      LIMIT 1
    ),
    'ultimo_mantenimiento', (
      SELECT to_jsonb(m) FROM public.mantenimientos m
      WHERE m.unidad = (
        SELECT vi.unidad FROM public.viajes vi
        WHERE vi.operador = op.nombre
        ORDER BY vi.fecha_salida DESC NULLS LAST LIMIT 1
      )
      ORDER BY m.fecha_mantenimiento DESC LIMIT 1
    ),
    'documentos', COALESCE((
      SELECT jsonb_agg(to_jsonb(d) ORDER BY d.created_at DESC)
      FROM public.operador_documentos_viaje d
      WHERE d.operador_id = op.id
    ), '[]'::jsonb),
    'contactos', COALESCE((
      SELECT jsonb_agg(to_jsonb(c) ORDER BY c.orden, c.nombre)
      FROM public.contactos_emergencia_operador c
      WHERE c.client_id = op.client_id OR c.client_id IS NULL
    ), '[]'::jsonb),
    'notificaciones', jsonb_build_object(
      'licencia_vence', op.fecha_vencimiento_licencia,
      'contrato_vence', op.fecha_vencimiento_contrato,
      'dias_vacaciones_disponibles', op.dias_vacaciones_disponibles
    )
  );
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_operador_portal_data(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_operador_portal_data(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.operador_registrar_documento(
  _qr_code text, _viaje_id uuid, _tipo text, _archivo_url text, _notas text
) RETURNS jsonb
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
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'operador_no_encontrado');
  END IF;
  INSERT INTO public.operador_documentos_viaje(operador_id, viaje_id, tipo, archivo_url, notas, client_id)
  VALUES (op.id, _viaje_id, _tipo, _archivo_url, _notas, op.client_id)
  RETURNING id INTO new_id;
  RETURN jsonb_build_object('ok', true, 'id', new_id);
END;
$$;

REVOKE ALL ON FUNCTION public.operador_registrar_documento(text, uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.operador_registrar_documento(text, uuid, text, text, text) TO anon, authenticated;
