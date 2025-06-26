import express from 'express';
import pool from '../config/database.js';
import { verifyToken } from '../middleware/auth.js';
import { calculateEngagementScore, generateActionSuggestion, generateCrossSellOpportunity } from '../services/openaiService.js';

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(verifyToken);

// GET /api/contacts - Liste des contacts avec filtres
router.get('/', async (req, res) => {
  try {
    const { 
      statut, 
      source, 
      regime, 
      search, 
      page = 1, 
      limit = 20, 
      sortBy = 'date_creation', 
      sortOrder = 'DESC' 
    } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // Filtres
    if (statut) {
      whereConditions.push(`statut = $${++paramCount}`);
      queryParams.push(statut);
    }
    if (source) {
      whereConditions.push(`source = $${++paramCount}`);
      queryParams.push(source);
    }
    if (regime) {
      whereConditions.push(`regime = $${++paramCount}`);
      queryParams.push(regime);
    }
    if (search) {
      whereConditions.push(`(nom ILIKE $${++paramCount} OR prenom ILIKE $${paramCount} OR telephone ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Calcul offset pour pagination
    const offset = (page - 1) * limit;
    queryParams.push(limit, offset);

    const query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM interaction WHERE contact_id = c.id) as nb_interactions,
        (SELECT COUNT(*) FROM tache WHERE contact_id = c.id AND statut = 'À faire') as nb_taches
      FROM contact c
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    const result = await pool.query(query, queryParams);

    // Compter le total pour la pagination
    const countQuery = `SELECT COUNT(*) FROM contact c ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    res.json({
      contacts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération contacts:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/contacts/stats - Statistiques pour le dashboard
router.get('/stats', async (req, res) => {
  try {
    // Nouveaux leads (7 derniers jours)
    const nouveauxLeads = await pool.query(`
      SELECT COUNT(*) FROM contact 
      WHERE date_creation >= NOW() - INTERVAL '7 days'
    `);

    // Taux de conversion (30 derniers jours)
    const totalLeads = await pool.query(`
      SELECT COUNT(*) FROM contact 
      WHERE date_creation >= NOW() - INTERVAL '30 days'
    `);
    
    const clientsGagnes = await pool.query(`
      SELECT COUNT(*) FROM contact 
      WHERE statut = 'Client - Gagné' 
      AND date_creation >= NOW() - INTERVAL '30 days'
    `);

    // Clients actifs (ayant un contrat)
    const clientsActifs = await pool.query(`
      SELECT COUNT(DISTINCT contact_id) FROM contrat_client
    `);

    // Leads NRP à recycler
    const leadsNRP = await pool.query(`
      SELECT COUNT(*) FROM contact 
      WHERE statut IN ('Contacté - NRP', 'À Recycler')
    `);

    // Répartition par source (30 derniers jours)
    const repartitionSource = await pool.query(`
      SELECT source, COUNT(*) as nombre
      FROM contact 
      WHERE date_creation >= NOW() - INTERVAL '30 days'
      GROUP BY source
      ORDER BY nombre DESC
    `);

    const total = parseInt(totalLeads.rows[0].count);
    const gagnes = parseInt(clientsGagnes.rows[0].count);
    const tauxConversion = total > 0 ? Math.round((gagnes / total) * 100) : 0;

    res.json({
      nouveauxLeads: parseInt(nouveauxLeads.rows[0].count),
      tauxConversion,
      clientsActifs: parseInt(clientsActifs.rows[0].count),
      leadsNRP: parseInt(leadsNRP.rows[0].count),
      repartitionSource: repartitionSource.rows
    });

  } catch (error) {
    console.error('Erreur stats contacts:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/contacts/:id - Détail d'un contact
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Contact principal
    const contactResult = await pool.query('SELECT * FROM contact WHERE id = $1', [id]);
    
    if (contactResult.rows.length === 0) {
      return res.status(404).json({ message: 'Contact introuvable' });
    }

    const contact = contactResult.rows[0];

    // Interactions
    const interactionsResult = await pool.query(`
      SELECT * FROM interaction 
      WHERE contact_id = $1 
      ORDER BY date_interaction DESC
    `, [id]);

    // Tâches
    const tachesResult = await pool.query(`
      SELECT * FROM tache 
      WHERE contact_id = $1 
      ORDER BY date_echeance ASC
    `, [id]);

    // Contrats
    const contratsResult = await pool.query(`
      SELECT cc.*, p.nom_produit, p.categorie, p.description
      FROM contrat_client cc
      JOIN produit p ON cc.produit_id = p.id
      WHERE cc.contact_id = $1
      ORDER BY cc.date_souscription DESC
    `, [id]);

    // Génération suggestions IA
    const interactions = interactionsResult.rows;
    const contracts = contratsResult.rows;

    const [scoreIA, suggestionIA, crossSellIA] = await Promise.all([
      calculateEngagementScore(contact, interactions),
      generateActionSuggestion(contact, interactions),
      generateCrossSellOpportunity(contact, contracts)
    ]);

    res.json({
      contact: {
        ...contact,
        scoreIA
      },
      interactions: interactions,
      taches: tachesResult.rows,
      contrats: contracts,
      suggestions: {
        action: suggestionIA,
        crossSell: crossSellIA
      }
    });

  } catch (error) {
    console.error('Erreur détail contact:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/contacts - Créer un nouveau contact
router.post('/', async (req, res) => {
  try {
    const {
      nom, prenom, email, telephone, date_naissance,
      regime, source, statut, notes_generales
    } = req.body;

    if (!nom || !prenom || !telephone) {
      return res.status(400).json({ message: 'Nom, prénom et téléphone requis' });
    }

    const result = await pool.query(`
      INSERT INTO contact (nom, prenom, email, telephone, date_naissance, regime, source, statut, notes_generales)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [nom, prenom, email, telephone, date_naissance, regime || 'Autre', source || 'Import Manuel', statut || 'Nouveau', notes_generales]);

    // Créer une notification
    await pool.query(`
      INSERT INTO notification (type, message)
      VALUES ('Système', 'Nouveau contact ajouté: ${nom} ${prenom}')
    `);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Erreur création contact:', error);
    if (error.code === '23505') { // Contrainte unique
      res.status(400).json({ message: 'Ce téléphone existe déjà' });
    } else {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
});

// PUT /api/contacts/:id - Modifier un contact
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nom, prenom, email, telephone, date_naissance,
      regime, source, statut, notes_generales, score_engagement
    } = req.body;

    const result = await pool.query(`
      UPDATE contact 
      SET nom = $1, prenom = $2, email = $3, telephone = $4, date_naissance = $5,
          regime = $6, source = $7, statut = $8, notes_generales = $9, score_engagement = $10,
          date_derniere_interaction = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [nom, prenom, email, telephone, date_naissance, regime, source, statut, notes_generales, score_engagement, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Contact introuvable' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Erreur modification contact:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/contacts/:id - Supprimer un contact
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM contact WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Contact introuvable' });
    }

    res.json({ message: 'Contact supprimé avec succès' });

  } catch (error) {
    console.error('Erreur suppression contact:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;