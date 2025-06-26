import express from 'express';
import pool from '../config/database.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

// POST /api/interactions - Ajouter une interaction
router.post('/', async (req, res) => {
  try {
    const { contact_id, type, resultat, contenu } = req.body;

    if (!contact_id || !type || !contenu) {
      return res.status(400).json({ message: 'Données manquantes' });
    }

    const result = await pool.query(`
      INSERT INTO interaction (contact_id, type, resultat, contenu)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [contact_id, type, resultat, contenu]);

    // Mettre à jour la date de dernière interaction du contact
    await pool.query(`
      UPDATE contact 
      SET date_derniere_interaction = CURRENT_TIMESTAMP 
      WHERE id = $1
    `, [contact_id]);

    // Créer une notification
    await pool.query(`
      INSERT INTO notification (type, message)
      VALUES ('Interaction', 'Nouvelle interaction ${type} ajoutée')
    `);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Erreur ajout interaction:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/interactions/recent - Interactions récentes pour le dashboard
router.get('/recent', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        i.*,
        c.nom,
        c.prenom,
        c.telephone
      FROM interaction i
      JOIN contact c ON i.contact_id = c.id
      ORDER BY i.date_interaction DESC
      LIMIT 10
    `);

    res.json(result.rows);

  } catch (error) {
    console.error('Erreur interactions récentes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;