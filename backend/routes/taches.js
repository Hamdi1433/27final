import express from 'express';
import pool from '../config/database.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

// GET /api/taches - Liste des tâches
router.get('/', async (req, res) => {
  try {
    const { statut = 'À faire' } = req.query;

    const result = await pool.query(`
      SELECT 
        t.*,
        c.nom,
        c.prenom,
        c.telephone
      FROM tache t
      JOIN contact c ON t.contact_id = c.id
      WHERE t.statut = $1
      ORDER BY t.date_echeance ASC
    `, [statut]);

    res.json(result.rows);

  } catch (error) {
    console.error('Erreur récupération tâches:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/taches - Créer une tâche
router.post('/', async (req, res) => {
  try {
    const { contact_id, description, date_echeance } = req.body;

    if (!contact_id || !description) {
      return res.status(400).json({ message: 'Contact et description requis' });
    }

    const result = await pool.query(`
      INSERT INTO tache (contact_id, description, date_echeance)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [contact_id, description, date_echeance]);

    // Créer une notification
    await pool.query(`
      INSERT INTO notification (type, message)
      VALUES ('Tâche', 'Nouvelle tâche créée: ${description}')
    `);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Erreur création tâche:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/taches/:id - Modifier une tâche
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { description, date_echeance, statut } = req.body;

    const result = await pool.query(`
      UPDATE tache 
      SET description = $1, date_echeance = $2, statut = $3
      WHERE id = $4
      RETURNING *
    `, [description, date_echeance, statut, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tâche introuvable' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Erreur modification tâche:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;