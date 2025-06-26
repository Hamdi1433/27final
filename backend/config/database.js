import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Configuration avec fallback pour environnement de développement sans PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'crm_assurance',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  // Ajout de configuration pour gérer les erreurs de connexion
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

// Test de connexion avec gestion d'erreur améliorée
pool.on('connect', () => {
  console.log('✅ Connexion PostgreSQL établie');
});

pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL:', err.message);
  if (err.code === 'ECONNREFUSED') {
    console.log('💡 Conseil: Assurez-vous que PostgreSQL est démarré et accessible sur le port 5432');
    console.log('💡 Pour Docker: docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres');
  }
});

// Fonction pour tester la connexion de manière gracieuse
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Test de connexion PostgreSQL réussi');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Test de connexion PostgreSQL échoué:', err.message);
    return false;
  }
};

export default pool;