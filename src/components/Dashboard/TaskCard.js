import React from 'react';
import { Clock, User, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TaskCard = ({ task, onComplete }) => {
  const isUrgent = new Date(task.date_echeance) < new Date();
  
  return (
    <div className={`bg-white rounded-lg border-l-4 p-4 shadow-sm hover:shadow-md transition-shadow ${
      isUrgent ? 'border-l-red-500' : 'border-l-blue-500'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">
              {task.nom} {task.prenom}
            </span>
            <span className="text-sm text-gray-500">• {task.telephone}</span>
          </div>
          
          <p className="text-gray-800 mb-3">{task.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>
                {format(new Date(task.date_echeance), 'dd MMM yyyy à HH:mm', { locale: fr })}
              </span>
            </div>
            {isUrgent && (
              <span className="text-red-600 font-medium">Urgent</span>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onComplete(task.id)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Marquer comme terminé"
        >
          <CheckCircle className="w-5 h-5 text-gray-400 hover:text-green-600" />
        </button>
      </div>
    </div>
  );
};

export default TaskCard;