import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { callsAPI } from '../services/api';
import CallDetailsModal from '../components/CallDetailsModal';
import {
  Phone,
  MessageSquare,
  UserCheck,
  Clock,
  Plus,
  Loader2,
  Eye,
  RefreshCw,
} from 'lucide-react';

const DISPOSITION_LABELS = {
  interested: 'Заинтересован',
  rejected: 'Отказ',
  no_answer: 'Нет ответа',
  busy: 'Занято',
  wrong_number: 'Неверный номер',
  continue_in_chat: 'Продолжить в чате',
};

const CRM_STATUS_LABELS = {
  added: 'Добавлено',
  pending: 'В ожидании',
  not_created: 'Не создано',
};

const FUNNEL_LABELS = {
  called: 'Позвонили',
  answered: 'Ответили',
  interested: 'Заинтересованы',
  rejected: 'Отказали',
  no_answer: 'Нет ответа',
};

export default function Analytics() {
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card text-center p-12">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загружаем аналитику...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Аналитика</h1>
          <p className="page-subtitle">Статистика и история звонков</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="btn-outline">
            <RefreshCw size={18} />
            Обновить
          </button>
          <button onClick={() => navigate('/start-call')} className="btn-primary">
            <Plus size={18} />
            Новый звонок
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="kpi-value">{analytics.total_calls}</p>
                <p className="kpi-label">Всего звонков</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="kpi-value text-green-600">{analytics.talk_rate}%</p>
                <p className="kpi-label">Доля диалогов</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="kpi-value text-purple-600">{analytics.interest_rate}%</p>
                <p className="kpi-label">Заинтересованы</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="kpi-value">{formatDuration(analytics.avg_duration)}</p>
                <p className="kpi-label">Средняя длительность</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Funnel */}
      {analytics?.funnel && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Воронка конверсий</h2>
          <div className="space-y-4">
            {Object.entries(analytics.funnel).map(([stage, count]) => {
              const percentage =
                analytics.funnel.called > 0
                  ? Math.round((count / analytics.funnel.called) * 100)
                  : 0;

              return (
                <div key={stage}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {FUNNEL_LABELS[stage] || stage}
                    </span>
                    <span className="text-sm text-gray-500">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calls Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">История звонков</h2>
        </div>

        {calls.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">Пока нет звонков</p>
            <button onClick={() => navigate('/start-call')} className="btn-primary">
              <Plus size={18} />
              Первый звонок
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Телефон</th>
                  <th>Дата/время</th>
                  <th>Длительность</th>
                  <th>Результат</th>
                  <th>CRM</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => (
                  <tr key={call.id}>
                    <td className="font-medium text-gray-900">{call.phone_number}</td>
                    <td>{formatDate(call.created_at)}</td>
                    <td className="font-medium">{formatDuration(call.duration)}</td>
                    <td>
                      <span
                        className={`badge ${
                          call.disposition === 'interested'
                            ? 'badge-success'
                            : call.disposition === 'rejected'
                            ? 'badge-error'
                            : call.disposition === 'no_answer'
                            ? 'badge-warning'
                            : 'badge-neutral'
                        }`}
                      >
                        {DISPOSITION_LABELS[call.disposition] || call.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          call.crm_status === 'added'
                            ? 'badge-success'
                            : call.crm_status === 'not_created'
                            ? 'badge-error'
                            : 'badge-warning'
                        }`}
                      >
                        {CRM_STATUS_LABELS[call.crm_status] || '-'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedCall(call)}
                        className="btn-ghost btn-sm"
                      >
                        <Eye size={16} />
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

      {/* Call Details Modal */}
      {selectedCall && (
        <CallDetailsModal call={selectedCall} onClose={() => setSelectedCall(null)} />
      )}
    </div>
  );
}
