-- ══════════════════════════════════════════════════════════════
-- SCRIPT SQL PER SUPABASE
-- 
-- ISTRUZIONI:
-- 1. Vai sul tuo progetto Supabase
-- 2. Clicca su "SQL Editor" nel menu a sinistra
-- 3. Copia e incolla tutto questo script
-- 4. Clicca "Run"
-- ══════════════════════════════════════════════════════════════


-- ── 1. Tabella profili utente (estende auth.users di Supabase) ──
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'inspector' CHECK (role IN ('admin', 'inspector')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: crea automaticamente il profilo quando un utente si registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'inspector')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 2. Tabella progetti ──
CREATE TABLE IF NOT EXISTS public.projects (
  id              TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  inspector       TEXT,
  selected_disc   TEXT,
  active_sections JSONB DEFAULT '{}',
  checklist       JSONB DEFAULT '{}',
  notes           JSONB DEFAULT '{}',
  remarks         JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indice per velocizzare le query per utente
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);


-- ── 3. Tabella libreria norme (unica riga condivisa) ──
CREATE TABLE IF NOT EXISTS public.norms_library (
  id           INTEGER PRIMARY KEY DEFAULT 1,
  disciplines  JSONB NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Inserisce riga iniziale vuota se non esiste
INSERT INTO public.norms_library (id, disciplines)
VALUES (1, '{}')
ON CONFLICT (id) DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- SICUREZZA: Row Level Security (RLS)
-- Ogni utente vede solo i propri dati.
-- L'admin vede tutto.
-- ══════════════════════════════════════════════════════════════

-- Abilita RLS su tutte le tabelle
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.norms_library  ENABLE ROW LEVEL SECURITY;


-- ── Policy: profiles ──
CREATE POLICY "Utente vede il proprio profilo"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin vede tutti i profili"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Utente aggiorna il proprio profilo"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


-- ── Policy: projects ──
CREATE POLICY "Ispettore vede i propri progetti"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin vede tutti i progetti"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Ispettore gestisce i propri progetti"
  ON public.projects FOR ALL
  USING (auth.uid() = user_id);


-- ── Policy: norms_library (tutti leggono, tutti scrivono) ──
CREATE POLICY "Tutti leggono la libreria norme"
  ON public.norms_library FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Tutti aggiornano la libreria norme"
  ON public.norms_library FOR ALL
  TO authenticated
  USING (true);


-- ══════════════════════════════════════════════════════════════
-- CREA IL PRIMO UTENTE ADMIN
-- 
-- Dopo aver eseguito questo script:
-- 1. Vai su Authentication → Users → Invite user
-- 2. Inserisci la tua email
-- 3. Poi esegui questo UPDATE sostituendo la tua email:
--
--    UPDATE public.profiles
--    SET role = 'admin'
--    WHERE email = 'tua@email.com';
--
-- ══════════════════════════════════════════════════════════════
