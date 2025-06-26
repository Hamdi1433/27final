import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Configuration
dotenv.config();

// Import des routes
import authRoutes from './routes/auth.js';
import contactsRoutes from './routes/contacts.js';
import interactionsRoutes from './routes/interactions.js';
import tachesRoutes from './routes/taches.js';
import dashboardRoutes from './routes/dashboard.js';

// Initialisation base de données
import createTables from './config/initDb.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/interactions', interactionsRoutes);
app.use('/api/taches', tachesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CRM Assurance API is running',
    timestamp: new Date().toISOString() 
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// WebSocket pour notifications temps réel
io.on('connection', (socket) => {
  console.log('👤 Client connecté:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Utilisateur ${userId} rejoint la room`);
  });

  socket.on('disconnect', () => {
    console.log('👤 Client déconnecté:', socket.id);
  });
});

// Export io pour utilisation dans d'autres modules
export { io };

// Initialisation et démarrage du serveur
const startServer = async () => {
  try {
    console.log('🚀 Initialisation du serveur CRM Assurance...');
    
    // Initialiser la base de données
    await createTables();
    
    // Démarrer le serveur
    server.listen(PORT, () => {
      console.log(`✅ Serveur démarré sur le port ${PORT}`);
      console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
    });

  } catch (error) {
    console.error('❌ Erreur démarrage serveur:', error);
    process.exit(1);
  }
};

startServer();