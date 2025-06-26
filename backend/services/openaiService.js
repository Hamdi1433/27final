import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-fake-key'
});

export const calculateEngagementScore = async (contact, interactions) => {
  try {
    const prompt = `
    Analyse ce contact d'assurance et calcule un score d'engagement de 1 à 100.
    
    Contact: ${contact.nom} ${contact.prenom}, ${contact.regime}, statut: ${contact.statut}
    Dernière interaction: ${contact.date_derniere_interaction}
    
    Interactions récentes:
    ${interactions.map(i => `- ${i.type}: ${i.contenu} (${i.date_interaction})`).join('\n')}
    
    Retourne uniquement un nombre entre 1 et 100.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 10,
      temperature: 0.3
    });

    const score = parseInt(response.choices[0].message.content.trim());
    return isNaN(score) ? 50 : Math.max(1, Math.min(100, score));
  } catch (error) {
    console.error('Erreur calcul score IA:', error);
    return 50; // Score par défaut
  }
};

export const generateActionSuggestion = async (contact, interactions) => {
  try {
    const prompt = `
    Tu es un expert courtier en assurance. Suggère la meilleure action suivante pour ce contact.
    
    Contact: ${contact.nom} ${contact.prenom}
    Régime: ${contact.regime}
    Statut: ${contact.statut}
    Score engagement: ${contact.score_engagement}/100
    
    Dernières interactions:
    ${interactions.slice(0, 3).map(i => `- ${i.type}: ${i.resultat || i.contenu}`).join('\n')}
    
    Réponds en 1-2 phrases maximum avec une action concrète.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.7
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Erreur suggestion IA:', error);
    return "Planifier un appel de suivi dans les 48h.";
  }
};

export const generateCrossSellOpportunity = async (contact, contracts) => {
  try {
    if (!contracts.length) {
      return "Proposer une première souscription selon le profil client.";
    }

    const prompt = `
    Client ${contact.regime} ayant souscrit:
    ${contracts.map(c => `- ${c.nom_produit} (${c.categorie})`).join('\n')}
    
    Quelle opportunité de cross-selling recommandes-tu ?
    Réponds en 1 phrase.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 80,
      temperature: 0.7
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Erreur cross-sell IA:', error);
    return "Analyser les besoins complémentaires du client.";
  }
};

export const generateEmailContent = async (context, type = 'relance') => {
  try {
    const prompts = {
      relance: `Rédige un email professionnel de relance pour un prospect qui n'a pas répondu. Ton: courtois mais déterminé. Contexte: ${context}`,
      suivi: `Rédige un email de suivi après un contact positif. Ton: professionnel et engageant. Contexte: ${context}`,
      proposition: `Rédige un email de proposition commerciale personnalisée. Contexte: ${context}`
    };

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompts[type] || prompts.relance }],
      max_tokens: 300,
      temperature: 0.7
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Erreur génération email IA:', error);
    return "Email généré automatiquement - À personnaliser selon le contexte client.";
  }
};

export const generateDashboardRecommendations = async (stats) => {
  try {
    const prompt = `
    Analyse ces statistiques CRM et donne 3 recommandations prioritaires:
    
    - Nouveaux leads (7j): ${stats.nouveauxLeads}
    - Taux conversion: ${stats.tauxConversion}%
    - Clients actifs: ${stats.clientsActifs}
    - Leads NRP à recycler: ${stats.leadsNRP}
    
    Format: 3 puces courtes et actionables.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.7
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Erreur recommandations IA:', error);
    return "• Relancer les prospects inactifs\n• Optimiser le suivi des négociations\n• Analyser les sources de leads performantes";
  }
};