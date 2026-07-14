-- =====================================================
-- SALT CRM — Schéma Supabase (fait foi, idempotent)
-- =====================================================
-- Capture du schéma live. Rejouable sur un projet vierge (disaster recovery).
-- 6 tables + RLS par user_id + vues utiles.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENTREPRISES ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entreprises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    business_uid TEXT,
    secteur TEXT,
    ville TEXT,
    code_postal TEXT,
    adresse TEXT,
    canton TEXT DEFAULT 'GE',
    taille_employes INTEGER,
    site_web TEXT,
    linkedin_url TEXT,
    typologie TEXT NOT NULL CHECK (typologie IN ('prospect_mobile', 'prospect_blue', 'client_existant')),
    couleur TEXT NOT NULL DEFAULT 'blanc' CHECK (couleur IN ('blanc', 'jaune', 'rouge', 'vert')),
    statut_pamela_origine TEXT,
    pamela_valide BOOLEAN DEFAULT FALSE,      -- statut CRM interne Salt (validé / non validé)
    assignation TEXT,
    score_salt INTEGER CHECK (score_salt BETWEEN 1 AND 5),
    priorite TEXT CHECK (priorite IN ('A', 'B', 'C')),
    pourquoi_cible TEXT,
    echeance_contrat DATE,
    produits_actuels TEXT[],
    produits_a_vendre TEXT[],
    date_dernier_contact DATE,
    date_prochaine_relance DATE,
    notes_consolidees TEXT,
    source_fichier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Ajout idempotent de la colonne si la table préexiste
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS pamela_valide BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_entreprises_user ON entreprises(user_id);
CREATE INDEX IF NOT EXISTS idx_entreprises_typologie ON entreprises(typologie);
CREATE INDEX IF NOT EXISTS idx_entreprises_couleur ON entreprises(couleur);
CREATE INDEX IF NOT EXISTS idx_entreprises_nom ON entreprises(nom);
CREATE INDEX IF NOT EXISTS idx_entreprises_pamela ON entreprises(pamela_valide);

-- 2. CONTACTS ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE NOT NULL,
    prenom TEXT,
    nom TEXT,
    fonction TEXT,
    email TEXT,
    telephone TEXT,
    linkedin TEXT,
    est_decideur BOOLEAN DEFAULT FALSE,
    source_fichier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contacts_entreprise ON contacts(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);

-- 3. INTERACTIONS -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE NOT NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    date_interaction DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL CHECK (type IN ('email', 'appel', 'rdv', 'linkedin', 'autre')),
    direction TEXT CHECK (direction IN ('sortant', 'entrant')),
    resume TEXT,
    prochaine_action TEXT,
    date_prochaine_action DATE,
    source_fichier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_interactions_entreprise ON interactions(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);

-- 4. VAGUES -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    date_envoi DATE,
    description TEXT,
    source_fichier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ENTREPRISE_VAGUES (N:N) ------------------------------------------------
CREATE TABLE IF NOT EXISTS entreprise_vagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE NOT NULL,
    vague_id UUID REFERENCES vagues(id) ON DELETE CASCADE NOT NULL,
    date_email_1 TEXT,
    date_email_2 TEXT,
    date_email_3 TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RECOMMANDATIONS --------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommandations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE,
    texte TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRIGGER updated_at --------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_entreprises ON entreprises;
CREATE TRIGGER set_timestamp_entreprises BEFORE UPDATE ON entreprises
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_contacts ON contacts;
CREATE TRIGGER set_timestamp_contacts BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- ROW LEVEL SECURITY --------------------------------------------------------
ALTER TABLE entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE entreprise_vagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommandations ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['entreprises','contacts','interactions','vagues','entreprise_vagues','recommandations']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users own %1$s" ON %1$s;', t);
    EXECUTE format(
      'CREATE POLICY "Users own %1$s" ON %1$s FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);',
      t
    );
  END LOOP;
END $$;

-- VUES ----------------------------------------------------------------------
CREATE OR REPLACE VIEW entreprises_enrichies AS
SELECT
    e.*,
    (SELECT COUNT(*) FROM contacts c WHERE c.entreprise_id = e.id) AS nb_contacts,
    (SELECT COUNT(*) FROM interactions i WHERE i.entreprise_id = e.id) AS nb_interactions,
    (SELECT MAX(i.date_interaction) FROM interactions i WHERE i.entreprise_id = e.id) AS derniere_interaction
FROM entreprises e;
