CREATE TABLE public.gestion_datos (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  cats jsonb NOT NULL DEFAULT '["Registro por error","Cuelga el teléfono","No atiende llamada","Calificado en marcación"]'::jsonb,
  errores jsonb NOT NULL DEFAULT '[]'::jsonb,
  calificados jsonb NOT NULL DEFAULT '[]'::jsonb,
  cierres jsonb NOT NULL DEFAULT '[]'::jsonb,
  perdidos jsonb NOT NULL DEFAULT '[]'::jsonb,
  entrantes jsonb NOT NULL DEFAULT '[]'::jsonb,
  llamadas_realizadas jsonb NOT NULL DEFAULT '{}'::jsonb,
  metas jsonb NOT NULL DEFAULT '{}'::jsonb,
  config jsonb NOT NULL DEFAULT '{"tramo1":60,"tasa1":20,"tramo2":100,"tasa2":35,"acelerador":1.5,"descuentoAnual":10}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gestion_datos TO authenticated;
GRANT ALL ON public.gestion_datos TO service_role;
ALTER TABLE public.gestion_datos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.gestion_datos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.gestion_datos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.gestion_datos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.gestion_datos FOR DELETE TO authenticated USING (auth.uid() = user_id);