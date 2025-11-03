-- Función para actualizar estado del equipo a 'en_uso' cuando inicia un viaje
CREATE OR REPLACE FUNCTION actualizar_estado_equipo_viaje()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar estado del equipo a 'en_uso' cuando se crea un viaje en estado 'en_transito' o 'activo'
  IF (TG_OP = 'INSERT' AND NEW.estado IN ('en_transito', 'activo')) OR 
     (TG_OP = 'UPDATE' AND NEW.estado IN ('en_transito', 'activo') AND OLD.estado != NEW.estado) THEN
    UPDATE inventario_equipos 
    SET estado = 'en_uso',
        updated_at = now()
    WHERE numero_economico = NEW.unidad;
  END IF;

  -- Actualizar estado del equipo a 'disponible' cuando el viaje se completa
  IF TG_OP = 'UPDATE' AND NEW.estado = 'completado' AND OLD.estado != 'completado' THEN
    UPDATE inventario_equipos 
    SET estado = 'disponible',
        updated_at = now()
    WHERE numero_economico = NEW.unidad;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para viajes
DROP TRIGGER IF EXISTS trigger_actualizar_estado_equipo_viaje ON viajes;
CREATE TRIGGER trigger_actualizar_estado_equipo_viaje
AFTER INSERT OR UPDATE ON viajes
FOR EACH ROW
EXECUTE FUNCTION actualizar_estado_equipo_viaje();

-- Función para actualizar estado del equipo cuando se registra mantenimiento
CREATE OR REPLACE FUNCTION actualizar_estado_equipo_mantenimiento()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar estado a 'mantenimiento' cuando se crea un mantenimiento
  IF TG_OP = 'INSERT' AND NEW.equipo_id IS NOT NULL THEN
    UPDATE inventario_equipos 
    SET estado = 'mantenimiento',
        updated_at = now()
    WHERE id = NEW.equipo_id;
  END IF;

  -- Actualizar estado a 'disponible' cuando el mantenimiento se completa
  IF TG_OP = 'UPDATE' AND NEW.estado = 'completado' AND OLD.estado != 'completado' AND NEW.equipo_id IS NOT NULL THEN
    UPDATE inventario_equipos 
    SET estado = 'disponible',
        updated_at = now()
    WHERE id = NEW.equipo_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para mantenimientos
DROP TRIGGER IF EXISTS trigger_actualizar_estado_equipo_mantenimiento ON mantenimientos;
CREATE TRIGGER trigger_actualizar_estado_equipo_mantenimiento
AFTER INSERT OR UPDATE ON mantenimientos
FOR EACH ROW
EXECUTE FUNCTION actualizar_estado_equipo_mantenimiento();

-- Función para actualizar estado del equipo cuando se registra ingreso de unidad
CREATE OR REPLACE FUNCTION actualizar_estado_equipo_ingreso()
RETURNS TRIGGER AS $$
BEGIN
  -- Si es salida y requiere mantenimiento, marcar como mantenimiento
  IF NEW.tipo_movimiento = 'salida' AND NEW.requiere_mantenimiento = true THEN
    IF NEW.tracto_id IS NOT NULL THEN
      UPDATE inventario_equipos SET estado = 'mantenimiento', updated_at = now() WHERE id = NEW.tracto_id;
    END IF;
    IF NEW.dolly_id IS NOT NULL THEN
      UPDATE inventario_equipos SET estado = 'mantenimiento', updated_at = now() WHERE id = NEW.dolly_id;
    END IF;
    IF NEW.remolque_1_id IS NOT NULL THEN
      UPDATE inventario_equipos SET estado = 'mantenimiento', updated_at = now() WHERE id = NEW.remolque_1_id;
    END IF;
    IF NEW.remolque_2_id IS NOT NULL THEN
      UPDATE inventario_equipos SET estado = 'mantenimiento', updated_at = now() WHERE id = NEW.remolque_2_id;
    END IF;
  END IF;

  -- Si es entrada y no requiere mantenimiento, marcar como disponible
  IF NEW.tipo_movimiento = 'entrada' AND NEW.requiere_mantenimiento = false THEN
    IF NEW.tracto_id IS NOT NULL THEN
      UPDATE inventario_equipos SET estado = 'disponible', updated_at = now() WHERE id = NEW.tracto_id;
    END IF;
    IF NEW.dolly_id IS NOT NULL THEN
      UPDATE inventario_equipos SET estado = 'disponible', updated_at = now() WHERE id = NEW.dolly_id;
    END IF;
    IF NEW.remolque_1_id IS NOT NULL THEN
      UPDATE inventario_equipos SET estado = 'disponible', updated_at = now() WHERE id = NEW.remolque_1_id;
    END IF;
    IF NEW.remolque_2_id IS NOT NULL THEN
      UPDATE inventario_equipos SET estado = 'disponible', updated_at = now() WHERE id = NEW.remolque_2_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para ingreso de unidades
DROP TRIGGER IF EXISTS trigger_actualizar_estado_equipo_ingreso ON ingreso_unidades;
CREATE TRIGGER trigger_actualizar_estado_equipo_ingreso
AFTER INSERT ON ingreso_unidades
FOR EACH ROW
EXECUTE FUNCTION actualizar_estado_equipo_ingreso();