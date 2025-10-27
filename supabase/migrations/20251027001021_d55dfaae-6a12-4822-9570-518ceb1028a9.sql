-- Crear tabla de personal (administrativo y taller)
CREATE TABLE public.personal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  numero_empleado TEXT NOT NULL UNIQUE,
  puesto TEXT NOT NULL,
  departamento TEXT NOT NULL CHECK (departamento IN ('administrativo', 'taller')),
  fecha_alta DATE NOT NULL,
  direccion TEXT NOT NULL,
  telefono TEXT,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

ALTER TABLE public.personal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all personal"
ON public.personal FOR SELECT
USING (true);

CREATE POLICY "Users can create personal"
ON public.personal FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update personal"
ON public.personal FOR UPDATE
USING (true);

-- Crear tabla de mantenimientos
CREATE TABLE public.mantenimientos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unidad TEXT NOT NULL,
  tipo_mantenimiento TEXT NOT NULL CHECK (tipo_mantenimiento IN ('preventivo', 'correctivo', 'rescate')),
  fecha_mantenimiento DATE NOT NULL,
  odometro INTEGER NOT NULL,
  costo NUMERIC NOT NULL,
  proveedor TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  proximo_mantenimiento INTEGER,
  estado TEXT NOT NULL DEFAULT 'completado' CHECK (estado IN ('completado', 'en_proceso', 'programado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

ALTER TABLE public.mantenimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all mantenimientos"
ON public.mantenimientos FOR SELECT
USING (true);

CREATE POLICY "Users can create mantenimientos"
ON public.mantenimientos FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update mantenimientos"
ON public.mantenimientos FOR UPDATE
USING (true);

-- Agregar política UPDATE para visitas (para registrar salida)
CREATE POLICY "Users can update visitas"
ON public.visitas FOR UPDATE
USING (true);

-- Limpiar TODOS los datos de TODAS las tablas
DELETE FROM public.historial_sellos;
DELETE FROM public.sellos_seguridad;
DELETE FROM public.liquidaciones;
DELETE FROM public.incidentes;
DELETE FROM public.analisis_riesgos;
DELETE FROM public.viajes;
DELETE FROM public.rutas;
DELETE FROM public.rondines;
DELETE FROM public.zonas_seguridad;
DELETE FROM public.pruebas_alcoholimetro;
DELETE FROM public.operadores;
DELETE FROM public.ingreso_unidades;
DELETE FROM public.visitas;