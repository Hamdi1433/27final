import express from 'express';
import pool from '../config/database.js';
import { verifyToken } from '../middleware/auth.js';
import { generateDashboardRecommendations } from '../services/openaiService.js';

const router = express.Router();
router.use(verifyToken);

// GET /api/dashboard - Données complètes du dashboard
router.get('/', async (req, res) => {
  try {
    // KPIs principaux
    const nouveauxLeads = await pool.query(`
      SELECT COUNT(*) FROM contact 
      WHERE date_creation >= NOW() - INTERVAL '7 days'
    `);

    const totalLeads30j = await pool.query(`
      SELECT COUNT(*) FROM contact 
      WHERE date_creation >= NOW() - INTERVAL '30 days'
    `);
    
    const clientsGagnes30j = await pool.query(`
      SELECT COUNT(*) FROM contact 
      WHERE statut = 'Client - Gagné' 
      AND date_creation >= NOW() - INTERVAL '30 days'
    `);

    const clientsActifs = await pool.query(`
      SELECT COUNT(DISTINCT contact_id) FROM contrat_client
    `);

    const leadsNRP = await pool.query(`
      SELECT COUNT(*) FROM contact 
      WHERE statut IN ('Contacté - NRP', 'À Recycler')
    `);

    // Tâches du jour
    const tachesDuJour = await pool.query(`
      SELECT 
        t.*,
        c.nom,
        c.prenom
      FROM tache t
      JOIN contact c ON t.contact_id = c.id
      WHERE t.statut = 'À faire' 
      AND DATE(t.date_echeance) = CURRENT_DATE
      ORDER BY t.date_echeance ASC
    `);

    // Graphique leads par source (30j)
    const leadsParSource = await pool.query(`
      SELECT 
        source,
        COUNT(*) as nombre,
        DATE(date_creation) as date
      FROM contact 
      WHERE date_creation >= NOW() - INTERVAL '30 days'
      GROUP BY source, DATE(date_creation)
      ORDER BY date DESC
    `);

    // Activité récente
    const activiteRecente = await pool.query(`
      SELECT 
        i.*,
        c.nom,
        c.prenom
      FROM interaction i
      JOIN contact c ON i.contact_id = c.id
      ORDER BY i.date_interaction DESC
      LIMIT 10
    `);

    // Calcul taux conversion
    const total30j = parseInt(totalLeads30j.rows[0].count);
    const gagnes30j = parseInt(clientsGagnes30j.rows[0].count);
    const tauxConversion = total30j > 0 ? Math.round((gagnes30j / total30j) * 100) : 0;

    const stats = {
      nouveauxLeads: parseInt(nouveauxLeads.rows[0].count),
      tauxConversion,
      clientsActifs: parseInt(clientsActifs.rows[0].count),
      leadsNRP: parseInt(leadsNRP.rows[0].count)
    };

    // Recommandations IA
    const recommendationsIA = await generateDashboardRecommendations(stats);

    res.json({
      kpis: stats,
      tachesDuJour: tachesDuJour.rows,
      leadsParSource: leadsParSource.rows,
      activiteRecente: activiteRecente.rows,
      recommendationsIA
    });

  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;