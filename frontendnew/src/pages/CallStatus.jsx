import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { callsAPI } from '../services/api';
import {
  Phone,
  PhoneCall,
  Brain,
  MessageSquare,
  Send,
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
  Plus,
} from 'lucide-react';

const STATUS_CONFIG = {
  initiating: {
    message: 'Инициализация звонка',
    icon: Phone,
  },
  calling: {
    message: 'Звоним клиенту',
    icon: PhoneCall,
  },
  analyzing: {
    message: 'Анализируем разговор',
    icon: Brain,
  },
  preparing_followup: {
    message: 'Готовим сообщение',
    icon: MessageSquare,
  },
  sending_sms: {
    message: 'Отправляем SMS',
    icon: Send,
  },
  adding_to_crm: {
    message: 'Добавляем в CRM',
    icon: Database,
  },
  completed: {
    message: 'Готово!',
    icon: CheckCircle2,
  },
  failed: {
    message: 'Звонок не удался',
    icon: XCircle,
  },
};

const STATUS_ORDER = [
  'initiating',
  'calling',
  'analyzing',
  'preparing_followup',
  'sending_sms',
  'adding_to_crm',
  'completed',
];

export default function CallStatus() {
  const { callId } = useParams();
  const navigate = useNavigate();
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let pollInterval;

    const fetchCallStatus = async () => {
      try {
        const response = await callsAPI.getCall(callId);
        setCall(response.data);
        setLoading(false);

        if (response.data.status === 'completed' || response.data.status === 'failed') {
          if (pollInterval) {
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Не удалось получить статус звонка');
        setLoading(false);
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      }
    };

    fetchCallStatus();
    pollInterval = setInterval(fetchCallStatus, 2000);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [callId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card text-center p-12">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загружаем статус звонка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card text-center p-12 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            На главную
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = call?.status === 'completed';
  const isFailed = call?.status === 'failed';
  const currentStatusIndex = STATUS_ORDER.indexOf(call?.status);

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Ход звонка</h1>
        <p className="page-subtitle">
          {isCompleted
            ? 'Звонок успешно завершен'
            : isFailed
            ? 'Произошла ошибка'
            : 'Отслеживаем процесс в реальном времени'}
        </p>
      </div>

      {/* Status Card */}
      <div className="card mb-6">
        {/* Progress Steps */}
        <div className="space-y-4">
          {STATUS_ORDER.map((status, index) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            const isCurrent = call?.status === status;
            const isPast = currentStatusIndex > index;
            const isFutureOrFailed = !isPast && !isCurrent;

            return (
              <div key={status} className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    isPast
                      ? 'bg-green-100'
                      : isCurrent
                      ? 'bg-blue-100'
                      : 'bg-gray-100'
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : isCurrent ? (
                    <Icon className="w-5 h-5 text-blue-600 animate-pulse" />
                  ) : (
                    <Icon className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {/* Text */}
                <span
                  className={`font-medium transition-colors ${
                    isPast
                      ? 'text-gray-900'
                      : isCurrent
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}
                >
                  {config.message}
                </span>

                {/* Current indicator */}
                {isCurrent && !isCompleted && (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin ml-auto" />
                )}
              </div>
            );
          })}
        </div>

        {/* Failed message */}
        {isFailed && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-red-700 font-medium">
                Звонок не удался. Попробуйте ещё раз.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(isCompleted || isFailed) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/analytics')}
            className="btn-primary py-4"
          >
            <BarChart3 size={20} />
            Открыть аналитику
          </button>
          <button
            onClick={() => navigate('/start-call')}
            className="btn-outline py-4"
          >
            <Plus size={20} />
            Новый звонок
          </button>
        </div>
      )}

      {/* Processing indicator */}
      {!isCompleted && !isFailed && (
        <div className="card text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Обрабатываем...</p>
        </div>
      )}
    </div>
  );
}
