CREATE TABLE public.sheets_config (
  id integer PRIMARY KEY DEFAULT 1,
  spreadsheet_id text NOT NULL,
  spreadsheet_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sheets_config_only_one CHECK (id = 1)
);

GRANT SELECT ON public.sheets_config TO authenticated;
GRANT ALL ON public.sheets_config TO service_role;

ALTER TABLE public.sheets_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios autenticados pueden leer la configuracion de sheets"
  ON public.sheets_config FOR SELECT TO authenticated USING (true);