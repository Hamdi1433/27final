import pool from './database.js';

const createTables = async () => {
  try {
    // Table Contact
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE,
        telephone VARCHAR(20) UNIQUE NOT NULL,
        date_naissance DATE,
        regime VARCHAR(50) DEFAULT 'Autre',
        source VARCHAR(50) DEFAULT 'Import Manuel',
        statut VARCHAR(50) DEFAULT 'Nouveau',
        score_engagement INTEGER DEFAULT 10,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_derniere_interaction TIMESTAMP,
        notes_generales TEXT
      )
    `);

    // Table Interaction
    await pool.query(`
      CREATE TABLE IF NOT EXISTS interaction (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER REFERENCES contact(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        resultat VARCHAR(100),
        contenu TEXT,
        date_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table Tache
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tache (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER REFERENCES contact(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        date_echeance TIMESTAMP,
        statut VARCHAR(20) DEFAULT 'À faire',
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table Produit
    await pool.query(`
      CREATE TABLE IF NOT EXISTS produit (
        id SERIAL PRIMARY KEY,
        nom_produit VARCHAR(200) NOT NULL,
        categorie VARCHAR(50) NOT NULL,
        description TEXT
      )
    `);

    // Table ContratClient
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contrat_client (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER REFERENCES contact(id) ON DELETE CASCADE,
        produit_id INTEGER REFERENCES produit(id),
        date_souscription DATE,
        prime_annuelle DECIMAL(10,2)
      )
    `);

    // Table Email
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER REFERENCES contact(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL,
        sujet VARCHAR(500),
        corps TEXT,
        date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        est_lu BOOLEAN DEFAULT FALSE,
        fichier_joint VARCHAR(500)
      )
    `);

    // Table Notification
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification (
        id SERIAL PRIMARY KEY,
        utilisateur VARCHAR(100) DEFAULT 'admin',
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        lu BOOLEAN DEFAULT FALSE,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table Utilisateur (admin)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS utilisateur (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        mot_de_passe VARCHAR(255) NOT NULL,
        nom VARCHAR(100),
        role VARCHAR(20) DEFAULT 'admin',
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table Automation
    await pool.query(`
      CREATE TABLE IF NOT EXISTS automation (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(200) NOT NULL,
        declencheur JSON NOT NULL,
        action JSON NOT NULL,
        actif BOOLEAN DEFAULT TRUE,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insérer des données de test
    await insertSampleData();

    console.log('✅ Tables créées avec succès');
  } catch (error) {
    console.error('❌ Erreur création tables:', error);
  }
};

const insertSampleData = async () => {
  try {
    // Produits d'assurance
    await pool.query(`
      INSERT INTO produit (nom_produit, categorie, description) VALUES
      ('Mutuelle Santé Senior+', 'Santé', 'Couverture santé complète pour seniors'),
      ('Prévoyance TNS Pro', 'Prévoyance', 'Protection revenus pour travailleurs non-salariés'),
      ('Assurance Dépendance Gold', 'Dépendance', 'Prise en charge perte d\'autonomie'),
      ('Complémentaire Santé Famille', 'Santé', 'Protection santé pour toute la famille'),
      ('Garantie Obsèques Sérénité', 'Prévoyance', 'Prise en charge frais obsèques')
      ON CONFLICT DO NOTHING
    `);

    // Utilisateur admin par défaut
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await pool.query(`
      INSERT INTO utilisateur (email, mot_de_passe, nom, role) VALUES
      ('admin@crm-assurance.fr', $1, 'Administrateur', 'admin')
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword]);

    // Quelques contacts de démonstration
    await pool.query(`
      INSERT INTO contact (nom, prenom, email, telephone, regime, source, statut, score_engagement) VALUES
      ('Martin', 'Pierre', 'pierre.martin@email.fr', '0123456789', 'Senior', 'Facebook', 'À Contacter', 75),
      ('Dubois', 'Marie', 'marie.dubois@email.fr', '0123456790', 'TNS', 'TikTok', 'En Négociation', 85),
      ('Moreau', 'Jean', 'jean.moreau@email.fr', '0123456791', 'Autre', 'Import Manuel', 'Client - Gagné', 95)
      ON CONFLICT (telephone) DO NOTHING
    `);

    console.log('✅ Données d\'exemple insérées');
  } catch (error) {
    console.error('❌ Erreur insertion données:', error);
  }
};

export default createTables;