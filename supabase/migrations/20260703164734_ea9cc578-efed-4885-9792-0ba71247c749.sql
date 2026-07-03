ALTER TABLE public.zonas_seguridad ADD COLUMN IF NOT EXISTS orden INTEGER NOT NULL DEFAULT 0;
UPDATE public.zonas_seguridad z SET orden = sub.rn
FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY nombre) AS rn FROM public.zonas_seguridad) sub
WHERE z.id = sub.id AND z.orden = 0;