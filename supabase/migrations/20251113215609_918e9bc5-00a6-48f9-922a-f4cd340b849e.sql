-- Eliminar índices si existen
DROP INDEX IF EXISTS idx_rondines_client_id;
DROP INDEX IF EXISTS idx_rondines_estado;
DROP INDEX IF EXISTS idx_rondines_created_by;
DROP INDEX IF EXISTS idx_visitas_zonas_rondin_id;

-- Renombrar la tabla actual de rondines a visitas_zonas
ALTER TABLE rondines RENAME TO visitas_zonas;

-- Crear la nueva tabla de rondines que representa un recorrido completo
CREATE TABLE rondines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT NOT NULL UNIQUE,
  fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  fecha_fin TIMESTAMP WITH TIME ZONE,
  estado TEXT NOT NULL DEFAULT 'en_progreso' CHECK (estado IN ('en_progreso', 'completado', 'cancelado')),
  zonas_totales INTEGER NOT NULL,
  zonas_visitadas INTEGER NOT NULL DEFAULT 0,
  incidentes_reportados INTEGER NOT NULL DEFAULT 0,
  observaciones TEXT,
  client_id UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Agregar columna rondin_id a visitas_zonas para relacionarlas
ALTER TABLE visitas_zonas ADD COLUMN rondin_id UUID REFERENCES rondines(id) ON DELETE CASCADE;

-- Índices para mejor rendimiento
CREATE INDEX idx_rondines_client_id ON rondines(client_id);
CREATE INDEX idx_rondines_estado ON rondines(estado);
CREATE INDEX idx_rondines_created_by ON rondines(created_by);
CREATE INDEX idx_visitas_zonas_rondin_id ON visitas_zonas(rondin_id);

-- Enable RLS
ALTER TABLE rondines ENABLE ROW LEVEL SECURITY;

-- RLS Policies para rondines
CREATE POLICY "Users can create rondines for their client"
  ON rondines
  FOR INSERT
  WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can view rondines from their client"
  ON rondines
  FOR SELECT
  USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

CREATE POLICY "Users can update rondines from their client"
  ON rondines
  FOR UPDATE
  USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());

CREATE POLICY "Admins can delete rondines"
  ON rondines
  FOR DELETE
  USING (is_admin());

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_rondines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rondines_updated_at_trigger
  BEFORE UPDATE ON rondines
  FOR EACH ROW
  EXECUTE FUNCTION update_rondines_updated_at();

-- Función para generar folio de rondín
CREATE OR REPLACE FUNCTION generate_rondin_folio()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  folio TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num FROM rondines WHERE DATE(created_at) = CURRENT_DATE;
  folio := 'RON-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_num::TEXT, 3, '0');
  RETURN folio;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-generar folio
CREATE OR REPLACE FUNCTION set_rondin_folio()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.folio IS NULL OR NEW.folio = '' THEN
    NEW.folio := generate_rondin_folio();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_rondin_folio_trigger
  BEFORE INSERT ON rondines
  FOR EACH ROW
  EXECUTE FUNCTION set_rondin_folio();