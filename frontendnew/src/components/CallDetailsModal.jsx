import { useState, useEffect } from 'react';
import { callsAPI } from '../services/api';
import {
  X,
  Calendar,
  Clock,
  Phone,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  Loader2,
  Target,
  User,
  Bot,
} from 'lucide-react';

const DISPOSITION_LABELS = {
  interested: 'Заинтересован',
  rejected: 'Отказ',
  no_answer: 'Нет ответа',
  busy: 'Занято',
  wrong_number: 'Неверный номер',
  continue_in_chat: 'Продолжить в чате',
};

export default function CallDetailsModal({ call: initialCall, onClose }) {
  const [call, setCall] = useState(initialCall);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialCall.id && !initialCall.transcript) {
      fetchFullDetails();
    }
  }, [initialCall.id]);

  const fetchFullDetails = async () => {
    setLoading(true);
    try {
      const response = await callsAPI.getCall(initialCall.id);
      setCall(response.data);
    } catch (err) {
      console.error('Failed to fetch call details:', err);
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Parse transcript from format {"msg1","msg2",...} to array
  const parseTranscript = (transcript) => {
    if (!transcript) return [];
    try {
      const cleaned = transcript.trim().slice(1, -1);
      const messages = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        if (char === '"' && cleaned[i - 1] !== '\\') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          if (current.trim()) {
            messages.push(current.trim());
          }
          current = '';
        } else {
          current += char;
        }
      }
      if (current.trim()) {
        messages.push(current.trim());
      }
      return messages;
    } catch (e) {
      return [transcript];
    }
  };

  const hasTranscript = call?.transcript && call.transcript.trim().length > 0;
  const transcriptMessages = hasTranscript ? parseTranscript(call.transcript) : [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Детали звонка</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Basic Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Calendar size={14} />
                  <span className="text-xs font-medium">Дата и время</span>
                </div>
                <p className="font-medium text-gray-900">{formatDate(call.created_at)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Clock size={14} />
                  <span className="text-xs font-medium">Длительность</span>
                </div>
                <p className="font-medium text-gray-900">{formatDuration(call.duration)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Phone size={14} />
                  <span className="text-xs font-medium">Номер телефона</span>
                </div>
                <p className="font-medium text-gray-900">{call.phone_number}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Target size={14} />
                  <span className="text-xs font-medium">Результат</span>
                </div>
                <span
                  className={`badge ${
                    call.disposition === 'interested'
                      ? 'badge-success'
                      : call.disposition === 'rejected'
                      ? 'badge-error'
                      : 'badge-neutral'
                  }`}
                >
                  {DISPOSITION_LABELS[call.disposition] || 'Неизвестно'}
                </span>
              </div>
            </div>

            {/* Summary */}
            {call.summary && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-600" />
                  Краткое резюме
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">{call.summary}</p>
              </div>
            )}

            {/* CRM Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Информация CRM</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Статус</p>
                  <p
                    className={`font-medium ${
                      call.crm_status === 'added'
                        ? 'text-green-600'
                        : call.crm_status === 'not_created'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {call.crm_status === 'added' && 'Добавлено в CRM'}
                    {call.crm_status === 'pending' && 'В ожидании'}
                    {call.crm_status === 'not_created' && 'Не создано'}
                  </p>
                </div>

                {call.customer_interest && (
                  <div>
                    <p className="text-gray-500 mb-1">Интерес клиента</p>
                    <p className="font-medium text-gray-900">{call.customer_interest}</p>
                  </div>
                )}

                {call.funnel_goal && (
                  <div>
                    <p className="text-gray-500 mb-1">Цель воронки</p>
                    <p className="font-medium text-gray-900">{call.funnel_goal}</p>
                  </div>
                )}

                {call.funnel_achieved !== null && call.funnel_achieved !== undefined && (
                  <div>
                    <p className="text-gray-500 mb-1">Цель достигнута</p>
                    <p className="flex items-center gap-1">
                      {call.funnel_achieved ? (
                        <>
                          <CheckCircle2 size={16} className="text-green-600" />
                          <span className="font-medium text-green-600">Да</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={16} className="text-red-600" />
                          <span className="font-medium text-red-600">Нет</span>
                        </>
                      )}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-gray-500 mb-1">Ссылка в Telegram</p>
                  <p className="font-medium text-gray-900">
                    {call.telegram_link_sent ? 'Отправлено' : 'Не отправлено'}
                  </p>
                </div>
              </div>
            </div>

            {/* Follow-up Message */}
            {call.followup_message && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Send size={16} className="text-green-600" />
                  Сообщение после звонка
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  HALO автоматически отправил клиенту сообщение для продолжения диалога
                </p>
                <div className="p-3 bg-white rounded-lg border border-green-200">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {call.followup_message}
                  </p>
                </div>
              </div>
            )}

            {/* Transcript */}
            {hasTranscript && transcriptMessages.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Транскрипция разговора</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                  {transcriptMessages.map((message, index) => {
                    const isAgent = message.startsWith('Агент:');
                    const text = message.replace(/^(Агент:|Пользователь:)\s*/, '');

                    return (
                      <div
                        key={index}
                        className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                            isAgent
                              ? 'bg-white border border-gray-200'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          <p
                            className={`text-xs font-medium mb-1 flex items-center gap-1 ${
                              isAgent ? 'text-gray-500' : 'text-blue-100'
                            }`}
                          >
                            {isAgent ? (
                              <>
                                <Bot size={12} /> HALO
                              </>
                            ) : (
                              <>
                                <User size={12} /> Клиент
                              </>
                            )}
                          </p>
                          <p
                            className={`text-sm leading-relaxed ${
                              isAgent ? 'text-gray-700' : 'text-white'
                            }`}
                          >
                            {text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
