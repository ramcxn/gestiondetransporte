
ALTER TABLE public.viajes
  ADD COLUMN IF NOT EXISTS direccion_carga text,
  ADD COLUMN IF NOT EXISTS lat_carga double precision,
  ADD COLUMN IF NOT EXISTS lng_carga double precision,
  ADD COLUMN IF NOT EXISTS direccion_descarga text,
  ADD COLUMN IF NOT EXISTS lat_descarga double precision,
  ADD COLUMN IF NOT EXISTS lng_descarga double precision;
