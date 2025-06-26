import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Configuration globale
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Services pour les contacts
export const contactService = {
  // Récupérer tous les contacts avec filtres
  getAll: (params = {}) => api.get('/contacts', { params }),
  
  // Récupérer un contact par ID
  getById: (id) => api.get(`/contacts/${id}`),
  
  // Créer un nouveau contact
  create: (data) => api.post('/contacts', data),
  
  // Modifier un contact
  update: (id, data) => api.put(`/contacts/${id}`, data),
  
  // Supprimer un contact
  delete: (id) => api.delete(`/contacts/${id}`),
  
  // Statistiques
  getStats: () => api.get('/contacts/stats'),
};

// Services pour les interactions
export const interactionService = {
  // Ajouter une interaction
  create: (data) => api.post('/interactions', data),
  
  // Interactions récentes
  getRecent: () => api.get('/interactions/recent'),
};

// Services pour les tâches
export const tacheService = {
  // Récupérer les tâches
  getAll: (params = {}) => api.get('/taches', { params }),
  
  // Créer une tâche
  create: (data) => api.post('/taches', data),
  
  // Modifier une tâche
  update: (id, data) => api.put(`/taches/${id}`, data),
};

// Services pour le dashboard
export const dashboardService = {
  // Données complètes du dashboard
  getData: () => api.get('/dashboard'),
};

// Services d'authentification
export const authService = {
  // Connexion
  login: (email, password) => api.post('/auth/login', { email, password }),
  
  // Vérification du token
  verify: () => api.get('/auth/verify'),
};

export default api;