-- ==========================================
-- FASE FINAL: DATOS POR DEFECTO Y CONSTRAINTS
-- ==========================================

-- 1. Crear cliente por defecto
INSERT INTO public.clientes (id, nombre, activo)
VALUES ('00000000-0000-0000-0000-000000000001', 'Cliente Principal', true)
ON CONFLICT DO NOTHING;

-- 2. Asignar client_id por defecto a profiles existentes
UPDATE public.profiles 
SET client_id = '00000000-0000-0000-0000-000000000001'
WHERE client_id IS NULL;

-- 3. Actualizar TODAS las tablas con datos existentes
UPDATE public.viajes SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.operadores SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.unidades SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.liquidaciones SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.personal SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.asistencia_personal SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.visitas SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.rondines SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.zonas_seguridad SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.sellos_seguridad SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.historial_sellos SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.pruebas_alcoholimetro SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.mantenimientos SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.ingreso_unidades SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.refacciones SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.ubicaciones_almacen SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.inventario_refacciones SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.solicitudes_refacciones SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.detalle_solicitudes_refacciones SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.movimientos_refacciones SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.refacciones_mantenimiento SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.inventario_equipos SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.analisis_riesgos SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.acciones_correctivas SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.incidentes SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.rutas SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;

-- 4. Hacer client_id NOT NULL en tablas críticas (primeras 10)
ALTER TABLE public.profiles ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE public.viajes ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE public.operadores ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE public.unidades ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE public.personal ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE public.refacciones ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE public.inventario_equipos ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE public.mantenimientos ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE public.liquidaciones ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE public.solicitudes_refacciones ALTER COLUMN client_id SET NOT NULL;