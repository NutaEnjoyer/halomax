import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { callsAPI } from '../services/api';

const STATUS_MESSAGES = {
  initiating: 'Инициализация звонка...',
  calling: 'Звоним клиенту...',
  analyzing: 'Анализируем разговор...',
  preparing_followup: 'Готовим последующее сообщение...',
  sending_sms: 'Отправляем SMS...',
  adding_to_crm: 'Добавляем в CRM...',
  completed: 'Готово!',
  failed: 'Звонок не удался',
};

function CallStatus() {
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

        // Stop polling when completed or failed
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

    // Initial fetch
    fetchCallStatus();

    // Poll every 2 seconds
    pollInterval = setInterval(fetchCallStatus, 2000);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [callId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
          <p className="text-gray-700 font-medium text-lg">Загружаем статус звонка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-10 max-w-md w-full">
          <div className="glass-dark rounded-xl px-6 py-4 mb-6 border border-red-400/50">
            <p className="text-red-200 font-bold">Ошибка: {error}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="glass-button w-full text-white font-bold py-4 rounded-xl glow-hover"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = call?.status === 'completed';
  const isFailed = call?.status === 'failed';

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="glass-card rounded-3xl p-10">
          <h1 className="text-4xl font-bold text-white mb-10">Ход звонка</h1>

          {/* Status Steps */}
          <div className="space-y-5 mb-10">
            {Object.entries(STATUS_MESSAGES).map(([status, message]) => {
              if (status === 'failed') return null;

              const isCurrent = call?.status === status;
              const isPast = Object.keys(STATUS_MESSAGES).indexOf(call?.status) >
                            Object.keys(STATUS_MESSAGES).indexOf(status);

              return (
                <div key={status} className="flex items-center group">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mr-5 transition-all ${
                    isPast ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg' :
                    isCurrent ? 'bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse shadow-xl glow' :
                    'bg-gray-200'
                  }`}>
                    {isPast && (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {isCurrent && (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className={`text-xl transition-all ${
                    isCurrent ? 'font-bold text-white' :
                    isPast ? 'font-semibold text-white/80' :
                    'text-white/50'
                  }`}>
                    {message}
                  </span>
                </div>
              );
            })}
          </div>

          {isFailed && (
            <div className="glass-dark rounded-2xl px-6 py-5 mb-8 border border-red-400/50">
              <p className="text-red-200 font-bold text-lg">Звонок не удался. Попробуйте ещё раз.</p>
            </div>
          )}

          {/* Action Buttons */}
          {isCompleted && (
            <div className="space-y-4">
              <button
                onClick={() => navigate('/analytics')}
                className="glass-button w-full text-white font-bold py-5 rounded-2xl text-lg glow-hover transition-smooth"
              >
                Открыть аналитику
              </button>
              <button
                onClick={() => navigate('/start-call')}
                className="w-full glass-card hover:bg-white/30 text-white font-bold py-5 rounded-2xl text-lg transition-smooth"
              >
                Запустить ещё звонок
              </button>
            </div>
          )}

          {!isCompleted && !isFailed && (
            <div className="text-center">
              <div className="inline-block glass-card px-8 py-5 rounded-2xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-300 mx-auto mb-4"></div>
                <p className="text-white font-medium text-lg">Обрабатываем...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CallStatus;
