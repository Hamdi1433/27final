import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  UserCheck, 
  AlertCircle,
  Bot,
  Activity
} from 'lucide-react';
import KPICard from '../components/Dashboard/KPICard';
import TaskCard from '../components/Dashboard/TaskCard';
import ChartCard from '../components/Dashboard/ChartCard';
import { dashboardService, tacheService } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await dashboardService.getData();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await tacheService.update(taskId, { statut: 'Terminé' });
      toast.success('Tâche marquée comme terminée');
      loadDashboardData(); // Recharger les données
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la tâche');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          Erreur lors du chargement des données
        </div>
      </div>
    );
  }

  const { kpis, tachesDuJour, leadsParSource, activiteRecente, recommendationsIA } = dashboardData;

  // Transformation des données pour les graphiques
  const chartData = leadsParSource.reduce((acc, item) => {
    const existing = acc.find(d => d.name === item.source);
    if (existing) {
      existing.value += parseInt(item.nombre);
    } else {
      acc.push({ name: item.source, value: parseInt(item.nombre) });
    }
    return acc;
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Vue d'ensemble de votre activité commerciale</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Nouveaux Leads"
          value={kpis.nouveauxLeads}
          icon={Users}
          color="blue"
          subtitle="7 derniers jours"
        />
        <KPICard
          title="Taux Conversion"
          value={`${kpis.tauxConversion}%`}
          icon={TrendingUp}
          color="green"
          subtitle="30 derniers jours"
        />
        <KPICard
          title="Clients Actifs"
          value={kpis.clientsActifs}
          icon={UserCheck}
          color="purple"
          subtitle="Avec contrats"
        />
        <KPICard
          title="Leads NRP"
          value={kpis.leadsNRP}
          icon={AlertCircle}
          color="orange"
          subtitle="À recycler"
        />
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne gauche - Tâches et activité */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Mes tâches du jour */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Mes tâches du jour</h2>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {tachesDuJour.length} tâche{tachesDuJour.length > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="space-y-4">
              {tachesDuJour.length > 0 ? (
                tachesDuJour.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onComplete={handleCompleteTask}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  🎉 Aucune tâche prévue aujourd'hui !
                </div>
              )}
            </div>
          </div>

          {/* Graphique leads par source */}
          {chartData.length > 0 && (
            <ChartCard
              title="Leads par source (30j)"
              type="pie"
              data={chartData}
              height={250}
            />
          )}
        </div>

        {/* Colonne droite - IA et activité */}
        <div className="space-y-6">
          
          {/* Recommandations IA */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Bot className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Suggestions IA</h2>
            </div>
            
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {recommendationsIA}
            </div>
          </div>

          {/* Activité récente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Activité récente</h2>
            </div>
            
            <div className="space-y-3">
              {activiteRecente.slice(0, 5).map(activity => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.nom} {activity.prenom}</span>
                      {' • '}{activity.type}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {activity.contenu || activity.resultat}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.date_interaction).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;