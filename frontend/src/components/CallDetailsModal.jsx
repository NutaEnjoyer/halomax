import React, { useState, useEffect } from 'react';
import { callsAPI } from '../services/api';

const DISPOSITION_LABELS = {
  interested: 'Interested',
  rejected: 'Rejected',
  no_answer: 'No Answer',
  busy: 'Busy',
  wrong_number: 'Wrong Number',
  continue_in_chat: 'Continue in Chat',
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
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // No parsing needed - just show raw transcript
  const hasTranscript = call?.transcript && call.transcript.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="glass-card rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="sticky top-0 glass border-b border-white/20 px-8 py-6 flex justify-between items-center rounded-t-3xl">
          <h2 className="text-3xl font-bold text-white">Call Details</h2>
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
            {/* Basic Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-5 rounded-xl">
                <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Date & Time</p>
                <p className="font-semibold text-white">{formatDate(call.created_at)}</p>
              </div>
              <div className="glass-card p-5 rounded-xl">
                <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Duration</p>
                <p className="font-semibold text-white">{formatDuration(call.duration)}</p>
              </div>
              <div className="glass-card p-5 rounded-xl">
                <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Phone Number</p>
                <p className="font-semibold text-white">{call.phone_number}</p>
              </div>
              <div className="glass-card p-5 rounded-xl">
                <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Disposition</p>
                <span className={`inline-flex px-4 py-1.5 text-sm font-bold rounded-xl ${
                  call.disposition === 'interested' ? 'bg-green-100 text-green-800' :
                  call.disposition === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {DISPOSITION_LABELS[call.disposition] || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Summary */}
            {call.summary && (
              <div className="glass-card rounded-xl p-6 border-l-4 border-blue-500">
                <h3 className="font-bold text-white mb-3 text-lg">Summary</h3>
                <p className="text-white/80 leading-relaxed">{call.summary}</p>
              </div>
            )}

            {/* CRM Block */}
            <div className="glass-card rounded-xl p-6 border-l-4 border-purple-500">
              <h3 className="font-bold text-white mb-4 text-lg">CRM Information</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Status</p>
                  <p className={`font-bold text-lg ${
                    call.crm_status === 'added' ? 'text-green-300' :
                    call.crm_status === 'not_created' ? 'text-red-300' :
                    'text-yellow-300'
                  }`}>
                    {call.crm_status === 'added' && 'Added to CRM'}
                    {call.crm_status === 'pending' && 'Pending'}
                    {call.crm_status === 'not_created' && 'Not Created'}
                  </p>
                </div>

                {call.customer_interest && (
                  <div>
                    <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Customer Interest</p>
                    <p className="text-white font-medium">{call.customer_interest}</p>
                  </div>
                )}

                {call.funnel_achieved !== null && call.funnel_achieved !== undefined && (
                  <div>
                    <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Funnel Goal Achieved</p>
                    <p className={`font-bold ${call.funnel_achieved ? 'text-green-300' : 'text-red-300'}`}>
                      {call.funnel_achieved ? 'Yes' : 'No'}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Telegram Link</p>
                  <p className="text-white font-medium">
                    {call.telegram_link_sent ? 'Sent via SMS' : 'Not sent'}
                  </p>
                </div>
              </div>
            </div>

            {/* Follow-up Message */}
            {call.followup_message && (
              <div className="glass-card rounded-xl p-6 border-l-4 border-green-500">
                <h3 className="font-bold text-white mb-3 text-lg">Follow-up Message</h3>
                <p className="text-white/80 leading-relaxed">{call.followup_message}</p>
              </div>
            )}

            {/* Transcript */}
            {hasTranscript && (
              <div className="glass-card rounded-xl p-6 border-l-4 border-indigo-500">
                <h3 className="font-bold text-white mb-4 text-lg">Транскрипция разговора</h3>
                <div className="bg-white/10 rounded-xl p-5">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-white/90 leading-relaxed">
                    {call.transcript}
                  </pre>
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
