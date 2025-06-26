import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  Phone,
  Mail,
  Download
} from 'lucide-react';
import { contactService } from '../services/api';
import toast from 'react-hot-toast';

const Contacts = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    statut: '',
    source: '',
    regime: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const statusOptions = [
    'Nouveau', 'À Contacter', 'Contacté - NRP', 'En Négociation', 
    'Client - Gagné', 'Perdu', 'À Recycler'
  ];

  const sourceOptions = ['Facebook', 'TikTok', 'Import Manuel', 'Référence', 'Site Web'];
  const regimeOptions = ['Senior', 'TNS', 'Autre'];

  useEffect(() => {
    loadContacts();
  }, [filters, pagination.page]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };

      const response = await contactService.getAll(params);
      setContacts(response.data.contacts);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));

    } catch (error) {
      console.error('Erreur chargement contacts:', error);
      toast.error('Erreur lors du chargement des contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset à la page 1
  };

  const handleDeleteContact = async (id, nom, prenom) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le contact ${nom} ${prenom} ?`)) {
      return;
    }

    try {
      await contactService.delete(id);
      toast.success('Contact supprimé avec succès');
      loadContacts();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getStatusColor = (statut) => {
    const colors = {
      'Nouveau': 'bg-blue-100 text-blue-800',
      'À Contacter': 'bg-yellow-100 text-yellow-800',
      'Contacté - NRP': 'bg-orange-100 text-orange-800',
      'En Négociation': 'bg-purple-100 text-purple-800',
      'Client - Gagné': 'bg-green-100 text-green-800',
      'Perdu': 'bg-red-100 text-red-800',
      'À Recycler': 'bg-gray-100 text-gray-800'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Contacts</h1>
          <p className="text-gray-600 mt-2">
            Gérez vos prospects et clients ({pagination.total} total)
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/import')}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Importer CSV</span>
          </button>
          
          <button
            onClick={() => navigate('/contacts/new')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Contact</span>
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher nom, téléphone..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Filtre Statut */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={filters.statut}
            onChange={(e) => handleFilterChange('statut', e.target.value)}
          >
            <option value="">Tous les statuts</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Filtre Source */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={filters.source}
            onChange={(e) => handleFilterChange('source', e.target.value)}
          >
            <option value="">Toutes les sources</option>
            {sourceOptions.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>

          {/* Filtre Régime */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={filters.regime}
            onChange={(e) => handleFilterChange('regime', e.target.value)}
          >
            <option value="">Tous les régimes</option>
            {regimeOptions.map(regime => (
              <option key={regime} value={regime}>{regime}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-4">Chargement des contacts...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Téléphone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statut</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Source</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Score</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Dernière interaction</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {contact.nom} {contact.prenom}
                        </div>
                        {contact.email && (
                          <div className="text-sm text-gray-500">{contact.email}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">{contact.regime}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{contact.telephone}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contact.statut)}`}>
                        {contact.statut}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {contact.source}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(contact.score_engagement)}`}>
                        {contact.score_engagement}/100
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {contact.date_derniere_interaction ? 
                        new Date(contact.date_derniere_interaction).toLocaleDateString('fr-FR') : 
                        'Jamais'
                      }
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/contacts/${contact.id}`)}
                          className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => navigate(`/contacts/${contact.id}/edit`)}
                          className="p-2 hover:bg-yellow-100 text-yellow-600 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteContact(contact.id, contact.nom, contact.prenom)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {contacts.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Aucun contact trouvé avec ces critères
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Affichage {((pagination.page - 1) * pagination.limit) + 1} à{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
            {pagination.total} résultats
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Précédent
            </button>
            
            {[...Array(pagination.pages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                className={`px-3 py-1 border text-sm rounded ${
                  pagination.page === i + 1
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;