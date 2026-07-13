-- =====================================================
-- SALT CRM PERSONNEL — Schéma Supabase
-- =====================================================
-- À exécuter dans Supabase SQL Editor (Settings > SQL Editor > New Query)
-- Copier-coller tout le bloc et cliquer "Run"
-- =====================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLE ENTREPRISES (table principale)
-- =====================================================
CREATE TABLE IF NOT EXISTS entreprises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Identification
    nom TEXT NOT NULL,
    business_uid TEXT,
    secteur TEXT,

    -- Localisation
    ville TEXT,
    code_postal TEXT,
    adresse TEXT,
    canton TEXT DEFAULT 'GE',

    -- Caractéristiques
    taille_employes INTEGER,
    site_web TEXT,
    linkedin_url TEXT,

    -- Typologie et statut commercial
    typologie TEXT NOT NULL CHECK (typologie IN ('prospect_mobile', 'prospect_blue', 'client_existant')),
    couleur TEXT NOT NULL DEFAULT 'blanc' CHECK (couleur IN ('blanc', 'jaune', 'rouge', 'vert')),
    statut_pamela_origine TEXT,
    assignation TEXT,

    -- Scoring (de la liste V2)
    score_salt INTEGER CHECK (score_salt BETWEEN 1 AND 5),
    priorite TEXT CHECK (priorite IN ('A', 'B', 'C')),
    pourquoi_cible TEXT,

    -- Contrat (pour clients existants)
    echeance_contrat DATE,
    produits_actuels TEXT[], -- {Mobile, Internet, Trunk}
    produits_a_vendre TEXT[],

    -- Suivi
    date_dernier_contact DATE,
    date_prochaine_relance DATE,
    notes_consolidees TEXT,

    -- Traçabilité
    source_fichier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entreprises_user ON entreprises(user_id);
CREATE INDEX IF NOT EXISTS idx_entreprises_typologie ON entreprises(typologie);
CREATE INDEX IF NOT EXISTS idx_entreprises_couleur ON entreprises(couleur);
CREATE INDEX IF NOT EXISTS idx_entreprises_nom ON entreprises(nom);
CREATE INDEX IF NOT EXISTS idx_entreprises_relance ON entreprises(date_prochaine_relance) WHERE date_prochaine_relance IS NOT NULL;

-- =====================================================
-- 2. TABLE CONTACTS (relation N:1 avec entreprises)
-- =====================================================
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

-- =====================================================
-- 3. TABLE INTERACTIONS (historique des échanges)
-- =====================================================
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
CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(date_interaction DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_prochaine ON interactions(date_prochaine_action) WHERE date_prochaine_action IS NOT NULL;

-- =====================================================
-- 4. TABLE VAGUES (campagnes d'emailing)
-- =====================================================
CREATE TABLE IF NOT EXISTS vagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    nom TEXT NOT NULL,
    date_envoi DATE,
    description TEXT,
    source_fichier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vagues_user ON vagues(user_id);

-- =====================================================
-- 5. TABLE LIAISON entreprise_vagues (N:N)
-- =====================================================
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

CREATE INDEX IF NOT EXISTS idx_ev_entreprise ON entreprise_vagues(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_ev_vague ON entreprise_vagues(vague_id);

-- =====================================================
-- 6. TRIGGER updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_entreprises ON entreprises;
CREATE TRIGGER set_timestamp_entreprises
BEFORE UPDATE ON entreprises
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_contacts ON contacts;
CREATE TRIGGER set_timestamp_contacts
BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Chaque utilisateur ne voit que ses propres données

ALTER TABLE entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE entreprise_vagues ENABLE ROW LEVEL SECURITY;

-- Policies entreprises
DROP POLICY IF EXISTS "Users see own entreprises" ON entreprises;
CREATE POLICY "Users see own entreprises" ON entreprises
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies contacts
DROP POLICY IF EXISTS "Users see own contacts" ON contacts;
CREATE POLICY "Users see own contacts" ON contacts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies interactions
DROP POLICY IF EXISTS "Users see own interactions" ON interactions;
CREATE POLICY "Users see own interactions" ON interactions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies vagues
DROP POLICY IF EXISTS "Users see own vagues" ON vagues;
CREATE POLICY "Users see own vagues" ON vagues
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies entreprise_vagues
DROP POLICY IF EXISTS "Users see own entreprise_vagues" ON entreprise_vagues;
CREATE POLICY "Users see own entreprise_vagues" ON entreprise_vagues
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 8. VUES UTILES
-- =====================================================

-- Vue : entreprises avec compteur de contacts et dernière interaction
CREATE OR REPLACE VIEW entreprises_enrichies AS
SELECT
    e.*,
    (SELECT COUNT(*) FROM contacts c WHERE c.entreprise_id = e.id) AS nb_contacts,
    (SELECT COUNT(*) FROM interactions i WHERE i.entreprise_id = e.id) AS nb_interactions,
    (SELECT MAX(i.date_interaction) FROM interactions i WHERE i.entreprise_id = e.id) AS derniere_interaction
FROM entreprises e;

-- Vue : relances du jour
CREATE OR REPLACE VIEW relances_du_jour AS
SELECT e.*
FROM entreprises e
WHERE e.date_prochaine_relance <= CURRENT_DATE
ORDER BY e.date_prochaine_relance ASC;

-- =====================================================
-- ✅ SCHÉMA INSTALLÉ
-- =====================================================
-- Étapes suivantes :
-- 1. Créer ton compte utilisateur via Authentication > Users > Add user
-- 2. Récupérer ton user_id depuis la console
-- 3. Importer les données via le script Node/Python ou l'app
-- =====================================================
