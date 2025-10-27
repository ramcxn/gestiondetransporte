-- Crear tabla de ubicaciones del almacén
CREATE TABLE public.ubicaciones_almacen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('estanteria', 'bin', 'zona')),
  capacidad INTEGER,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Crear tabla catálogo de refacciones
CREATE TABLE public.refacciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_parte TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL,
  categoria TEXT NOT NULL,
  proveedor TEXT NOT NULL,
  precio_unitario NUMERIC NOT NULL,
  unidad_medida TEXT NOT NULL,
  ubicacion_principal UUID REFERENCES public.ubicaciones_almacen(id),
  stock_minimo INTEGER NOT NULL DEFAULT 0,
  stock_maximo INTEGER NOT NULL,
  punto_reorden INTEGER NOT NULL,
  requiere_serie BOOLEAN NOT NULL DEFAULT false,
  tiene_caducidad BOOLEAN NOT NULL DEFAULT false,
  dias_vida_util INTEGER,
  foto_url TEXT,
  notas TEXT,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Crear tabla de inventario físico (con números de serie individuales)
CREATE TABLE public.inventario_refacciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  refaccion_id UUID NOT NULL REFERENCES public.refacciones(id),
  numero_serie TEXT,
  lote TEXT,
  fecha_recepcion DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_caducidad DATE,
  ubicacion_id UUID NOT NULL REFERENCES public.ubicaciones_almacen(id),
  estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'reservado', 'asignado', 'dañado', 'caducado')),
  mantenimiento_id UUID REFERENCES public.mantenimientos(id),
  costo_unitario NUMERIC NOT NULL,
  proveedor TEXT NOT NULL,
  documento_recepcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(refaccion_id, numero_serie)
);

-- Crear tabla de solicitudes de refacciones
CREATE TABLE public.solicitudes_refacciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folio TEXT NOT NULL UNIQUE,
  mantenimiento_id UUID REFERENCES public.mantenimientos(id),
  unidad TEXT NOT NULL,
  prioridad TEXT NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'en_picking', 'completada', 'cancelada')),
  solicitante UUID NOT NULL REFERENCES auth.users(id),
  aprobador UUID REFERENCES auth.users(id),
  fecha_solicitud TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_requerida TIMESTAMP WITH TIME ZONE,
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  fecha_completada TIMESTAMP WITH TIME ZONE,
  observaciones TEXT,
  motivo_cancelacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Crear tabla de detalle de solicitudes
CREATE TABLE public.detalle_solicitudes_refacciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes_refacciones(id) ON DELETE CASCADE,
  refaccion_id UUID NOT NULL REFERENCES public.refacciones(id),
  cantidad_solicitada INTEGER NOT NULL,
  cantidad_entregada INTEGER DEFAULT 0,
  inventario_asignado_id UUID REFERENCES public.inventario_refacciones(id),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'reservado', 'entregado', 'no_disponible')),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de movimientos de refacciones (historial)
CREATE TABLE public.movimientos_refacciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida', 'transferencia', 'ajuste', 'devolucion')),
  refaccion_id UUID NOT NULL REFERENCES public.refacciones(id),
  inventario_id UUID REFERENCES public.inventario_refacciones(id),
  cantidad INTEGER NOT NULL,
  ubicacion_origen UUID REFERENCES public.ubicaciones_almacen(id),
  ubicacion_destino UUID REFERENCES public.ubicaciones_almacen(id),
  solicitud_id UUID REFERENCES public.solicitudes_refacciones(id),
  mantenimiento_id UUID REFERENCES public.mantenimientos(id),
  costo_unitario NUMERIC,
  costo_total NUMERIC,
  documento_referencia TEXT,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Crear función para generar folio de solicitud
CREATE OR REPLACE FUNCTION public.generate_solicitud_folio()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_folio TEXT;
  folio_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO folio_count FROM public.solicitudes_refacciones 
  WHERE DATE(created_at) = CURRENT_DATE;
  
  new_folio := 'SOL-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((folio_count + 1)::TEXT, 4, '0');
  
  RETURN new_folio;
END;
$$;

-- Habilitar RLS en todas las tablas
ALTER TABLE public.ubicaciones_almacen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_refacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_refacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_solicitudes_refacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_refacciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ubicaciones_almacen
CREATE POLICY "Users can view all ubicaciones_almacen" ON public.ubicaciones_almacen
  FOR SELECT USING (true);

CREATE POLICY "Users can create ubicaciones_almacen" ON public.ubicaciones_almacen
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own ubicaciones_almacen or admins" ON public.ubicaciones_almacen
  FOR UPDATE USING (auth.uid() = created_by OR is_admin());

-- Políticas RLS para refacciones
CREATE POLICY "Users can view all refacciones" ON public.refacciones
  FOR SELECT USING (true);

CREATE POLICY "Users can create refacciones" ON public.refacciones
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own refacciones or admins" ON public.refacciones
  FOR UPDATE USING (auth.uid() = created_by OR is_admin());

-- Políticas RLS para inventario_refacciones
CREATE POLICY "Users can view all inventario_refacciones" ON public.inventario_refacciones
  FOR SELECT USING (true);

CREATE POLICY "Users can create inventario_refacciones" ON public.inventario_refacciones
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own inventario_refacciones or admins" ON public.inventario_refacciones
  FOR UPDATE USING (auth.uid() = created_by OR is_admin());

-- Políticas RLS para solicitudes_refacciones
CREATE POLICY "Users can view all solicitudes_refacciones" ON public.solicitudes_refacciones
  FOR SELECT USING (true);

CREATE POLICY "Users can create solicitudes_refacciones" ON public.solicitudes_refacciones
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own solicitudes_refacciones or admins" ON public.solicitudes_refacciones
  FOR UPDATE USING (auth.uid() = created_by OR is_admin());

-- Políticas RLS para detalle_solicitudes_refacciones
CREATE POLICY "Users can view all detalle_solicitudes_refacciones" ON public.detalle_solicitudes_refacciones
  FOR SELECT USING (true);

CREATE POLICY "Users can create detalle_solicitudes_refacciones" ON public.detalle_solicitudes_refacciones
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update detalle_solicitudes_refacciones" ON public.detalle_solicitudes_refacciones
  FOR UPDATE USING (true);

-- Políticas RLS para movimientos_refacciones
CREATE POLICY "Users can view all movimientos_refacciones" ON public.movimientos_refacciones
  FOR SELECT USING (true);

CREATE POLICY "Users can create movimientos_refacciones" ON public.movimientos_refacciones
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_inventario_refacciones_refaccion ON public.inventario_refacciones(refaccion_id);
CREATE INDEX idx_inventario_refacciones_ubicacion ON public.inventario_refacciones(ubicacion_id);
CREATE INDEX idx_inventario_refacciones_estado ON public.inventario_refacciones(estado);
CREATE INDEX idx_solicitudes_estado ON public.solicitudes_refacciones(estado);
CREATE INDEX idx_movimientos_tipo ON public.movimientos_refacciones(tipo_movimiento);
CREATE INDEX idx_movimientos_fecha ON public.movimientos_refacciones(created_at);