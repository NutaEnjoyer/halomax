import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { callsAPI } from '../services/api';
import CallDetailsModal from '../components/CallDetailsModal';

const DISPOSITION_LABELS = {
  interested: 'Заинтересован',
  rejected: 'Отказ',
  no_answer: 'Нет ответа',
  busy: 'Занято',
  wrong_number: 'Неверный номер',
  continue_in_chat: 'Продолжить в чате',
};

const CRM_STATUS_LABELS = {
  added: 'Добавлено в CRM',
  pending: 'В ожидании',
  not_created: 'Не создано',
};

function Analytics() {
  const navigate = useNavigate();
  const [calls, setCalls] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [callsRes, analyticsRes] = await Promise.all([
        callsAPI.listCalls(),
        callsAPI.getAnalytics(),
      ]);
      setCalls(callsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
          <p className="text-gray-700 font-medium text-lg">Загружаем аналитику...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-5xl font-bold text-white">HALO Аналитика</h1>
          <button
            onClick={() => navigate('/')}
            className="glass-button px-8 py-3 text-white font-bold rounded-xl glow-hover transition-smooth"
          >
            Новый звонок
          </button>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="glass-card rounded-2xl p-7 border-l-4 border-purple-500">
              <h3 className="text-xs font-bold text-white/70 mb-3 uppercase tracking-wide">Всего звонков</h3>
              <p className="text-5xl font-bold text-white">{analytics.total_calls}</p>
            </div>

            <div className="glass-card rounded-2xl p-7 border-l-4 border-green-500">
              <h3 className="text-xs font-bold text-white/70 mb-3 uppercase tracking-wide">Доля диалогов</h3>
              <p className="text-5xl font-bold text-green-300">{analytics.talk_rate}%</p>
            </div>

            <div className="glass-card rounded-2xl p-7 border-l-4 border-blue-500">
              <h3 className="text-xs font-bold text-white/70 mb-3 uppercase tracking-wide">Доля заинтересованных</h3>
              <p className="text-5xl font-bold text-blue-300">{analytics.interest_rate}%</p>
            </div>

            <div className="glass-card rounded-2xl p-7 border-l-4 border-orange-500">
              <h3 className="text-xs font-bold text-white/70 mb-3 uppercase tracking-wide">Средняя длительность</h3>
              <p className="text-5xl font-bold text-white">{formatDuration(analytics.avg_duration)}</p>
            </div>
          </div>
        )}

        {/* Funnel */}
        {analytics?.funnel && (
          <div className="glass-card rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Воронка конверсий</h2>
            <div className="space-y-5">
              {Object.entries(analytics.funnel).map(([stage, count]) => {
                const percentage = analytics.funnel.called > 0
                  ? Math.round((count / analytics.funnel.called) * 100)
                  : 0;

                return (
                  <div key={stage}>
                    <div className="flex justify-between mb-2">
                      <span className="font-bold capitalize text-white">{stage}</span>
                      <span className="text-white/70 font-semibold">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Calls Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-white/20">
            <h2 className="text-2xl font-bold text-white">История звонков</h2>
          </div>

          {calls.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-white/80 text-lg font-medium">Пока нет звонков. Запустите первый демо-звонок!</p>
              <button
                onClick={() => navigate('/')}
                className="mt-6 glass-button px-8 py-4 text-white font-bold rounded-xl glow-hover inline-block"
              >
                Первый звонок
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="glass border-b border-white/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase tracking-wider">Телефон</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase tracking-wider">Дата/время</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase tracking-wider">Длительность</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase tracking-wider">Результат</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase tracking-wider">Статус CRM</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {calls.map((call) => (
                    <tr key={call.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5 text-sm font-semibold text-white">{call.phone_number}</td>
                      <td className="px-6 py-5 text-sm text-white/70">{formatDate(call.created_at)}</td>
                      <td className="px-6 py-5 text-sm font-semibold text-white">{formatDuration(call.duration)}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex px-4 py-1.5 text-xs font-bold rounded-xl ${
                          call.disposition === 'interested' ? 'bg-green-100 text-green-800' :
                          call.disposition === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {DISPOSITION_LABELS[call.disposition] || call.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold">
                        <span className={`${
                          call.crm_status === 'added' ? 'text-green-300' :
                          call.crm_status === 'not_created' ? 'text-red-300' :
                          'text-yellow-300'
                        }`}>
                          {CRM_STATUS_LABELS[call.crm_status]}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <button
                          onClick={() => setSelectedCall(call)}
                          className="text-purple-300 hover:text-purple-100 text-sm font-bold hover:underline"
                        >
                          Подробнее
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Call Details Modal */}
      {selectedCall && (
        <CallDetailsModal
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </div>
  );
}

export default Analytics;
