import React, { useState, useEffect } from 'react';
import { callsAPI } from '../services/api';

const DISPOSITION_LABELS = {
  interested: 'Заинтересован',
  rejected: 'Отказ',
  no_answer: 'Нет ответа',
  busy: 'Занято',
  wrong_number: 'Неверный номер',
  continue_in_chat: 'Продолжить в чате',
};

function CallDetailsModal({ call: initialCall, onClose }) {
  const [call, setCall] = useState(initialCall);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch full call details if needed
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

  const getFollowUp = (followUpMessage) => {
    return (
      "HALO сам проанализировал разговор и отправил клиенту сообщение,\n" +
      "чтобы продолжить диалог.\n\n" +
      "📩 Отправлено клиенту в Telegram\n" +
      "⏱ Через 12 секунд после окончания звонка\n\n" +
      "HALO → Клиенту:\n" +
      "\n" +
      followUpMessage + "\n" +
      "--------------------------------"
    );
  };

  // Parse transcript from format {"msg1","msg2",...} to array
  const parseTranscript = (transcript) => {
    if (!transcript) return [];
    try {
      // Remove curly braces and split by ","
      const cleaned = transcript.trim().slice(1, -1); // Remove { and }
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="glass-card rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 glass border-b border-white/20 px-8 py-6 flex justify-between items-center rounded-t-3xl">
          <h2 className="text-3xl font-bold text-white">Детали звонка</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center text-white/70 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
          </div>
        ) : (
          <div className="px-8 py-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-5 rounded-xl">
              <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Дата и время</p>
                <p className="font-semibold text-white">{formatDate(call.created_at)}</p>
              </div>
              <div className="glass-card p-5 rounded-xl">
              <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Длительность</p>
                <p className="font-semibold text-white">{formatDuration(call.duration)}</p>
              </div>
              <div className="glass-card p-5 rounded-xl">
              <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Номер телефона</p>
                <p className="font-semibold text-white">{call.phone_number}</p>
              </div>
              <div className="glass-card p-5 rounded-xl">
              <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Результат</p>
                <span className={`inline-flex px-4 py-1.5 text-sm font-bold rounded-xl ${
                  call.disposition === 'interested' ? 'bg-green-100 text-green-800' :
                  call.disposition === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {DISPOSITION_LABELS[call.disposition] || 'Неизвестно'}
                </span>
              </div>
            </div>

            {call.summary && (
              <div className="glass-card rounded-xl p-6 border-l-4 border-blue-500">
                <h3 className="font-bold text-white mb-3 text-lg">Краткое резюме</h3>
                <p className="text-white/80 leading-relaxed">{call.summary}</p>
              </div>
            )}

            <div className="glass-card rounded-xl p-6 border-l-4 border-purple-500">
              <h3 className="font-bold text-white mb-4 text-lg">Информация CRM</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Статус</p>
                  <p className={`font-bold text-lg ${
                    call.crm_status === 'added' ? 'text-green-300' :
                    call.crm_status === 'not_created' ? 'text-red-300' :
                    'text-yellow-300'
                  }`}>
                    {call.crm_status === 'added' && 'Добавлено в CRM'}
                    {call.crm_status === 'pending' && 'В ожидании'}
                    {call.crm_status === 'not_created' && 'Не создано'}
                  </p>
                </div>

                {call.customer_interest && (
                  <div>
                    <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Интерес клиента</p>
                    <p className="text-white font-medium">{call.customer_interest}</p>
                  </div>
                )}

                {call.funnel_goal && (
                  <div>
                    <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Цель воронки</p>
                    <p className="text-white font-medium">{call.funnel_goal}</p>
                  </div>
                )}

                {call.funnel_achieved !== null && call.funnel_achieved !== undefined && (
                  <div>
                    <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Цель воронки достигнута</p>
                    <p className={`font-bold ${call.funnel_achieved ? 'text-green-300' : 'text-red-300'}`}>
                      {call.funnel_achieved ? 'Да' : 'Нет'}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Ссылка в Telegram</p>
                  <p className="text-white font-medium">
                    {call.telegram_link_sent ? 'Отправлено по SMS' : 'Не отправлено'}
                  </p>
                </div>
              </div>
            </div>

            {/* Follow-up Message */}
            {call.followup_message && (
              <div className="glass-card rounded-xl p-6 border-l-4 border-green-500">
                <h3 className="font-bold text-white mb-3 text-lg">Что HALO сделал после звонка</h3>
                <p className="text-white/80 leading-relaxed">{getFollowUp(call.followup_message)}</p>
              </div>
            )}

            {/* Transcript */}
            {hasTranscript && transcriptMessages.length > 0 && (
              <div className="glass-card rounded-xl p-6 border-l-4 border-indigo-500">
                <h3 className="font-bold text-white mb-4 text-lg">Транскрипция разговора</h3>
                <div className="space-y-3">
                  {transcriptMessages.map((message, index) => {
                    const isAgent = message.startsWith('Агент:');
                    const text = message.replace(/^(Агент:|Пользователь:)\s*/, '');

                    return (
                      <div
                        key={index}
                        className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            isAgent
                              ? 'bg-purple-500/30 rounded-tl-sm'
                              : 'bg-blue-500/30 rounded-tr-sm'
                          }`}
                        >
                          <p className={`text-xs font-bold mb-1 ${
                            isAgent ? 'text-purple-300' : 'text-blue-300'
                          }`}>
                            {isAgent ? 'HALO' : 'Клиент'}
                          </p>
                          <p className="text-white/90 text-sm leading-relaxed">{text}</p>
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

export default CallDetailsModal;
