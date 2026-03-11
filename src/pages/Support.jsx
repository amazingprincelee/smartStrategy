import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LifeBuoy, Send, ChevronRight, Loader, CheckCircle, Plus, ArrowLeft } from 'lucide-react';
import {
  submitTicket, fetchUserTickets, fetchTicketById, replyToTicket, clearSupportState,
} from '../redux/slices/supportSlice';

const STATUS_BADGE = {
  open:         'bg-blue-500/20 text-blue-400',
  in_progress:  'bg-yellow-500/20 text-yellow-400',
  waiting_user: 'bg-orange-500/20 text-orange-400',
  resolved:     'bg-green-500/20 text-green-400',
  closed:       'bg-gray-500/20 text-gray-400',
};

const CATEGORIES = ['billing', 'bot', 'signal', 'arbitrage', 'account', 'withdrawal', 'other'];

function Badge({ label, style }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>{label}</span>;
}

export default function Support() {
  const dispatch = useDispatch();
  const { myTickets, myTotal, activeTicket, loading, error, success } = useSelector(s => s.support);
  const [view, setView]         = useState('list'); // 'list' | 'new' | 'ticket'
  const [reply, setReply]       = useState('');
  const [form, setForm]         = useState({ subject: '', message: '', category: 'other', priority: 'medium' });

  useEffect(() => {
    dispatch(fetchUserTickets());
    return () => dispatch(clearSupportState());
  }, [dispatch]);

  const openTicket = (id) => { dispatch(fetchTicketById(id)); setView('ticket'); };

  const submitForm = () => {
    if (!form.subject.trim() || !form.message.trim()) return;
    dispatch(submitTicket(form)).then(res => {
      if (!res.error) { setView('list'); setForm({ subject: '', message: '', category: 'other', priority: 'medium' }); }
    });
  };

  const sendReply = () => {
    if (!reply.trim()) return;
    dispatch(replyToTicket({ id: activeTicket._id, message: reply }));
    setReply('');
  };

  const fmtDT = (d) => d ? new Date(d).toLocaleString() : '—';

  return (
    <div className="min-h-screen bg-brandDark-900 text-white p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view !== 'list' && (
              <button onClick={() => setView('list')} className="p-1.5 rounded-lg hover:bg-brandDark-700 text-gray-400">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2"><LifeBuoy className="w-5 h-5 text-primary-400" /> Support</h1>
              <p className="text-gray-400 text-sm">We typically respond within 24 hours</p>
            </div>
          </div>
          {view === 'list' && (
            <button onClick={() => setView('new')} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> New Ticket
            </button>
          )}
        </div>

        {success && (
          <div className="flex items-center gap-2 bg-green-900/30 border border-green-700/40 text-green-300 rounded-xl px-4 py-2 text-sm">
            <CheckCircle className="w-4 h-4" /> {success}
          </div>
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* New ticket form */}
        {view === 'new' && (
          <div className="bg-brandDark-800 border border-brandDark-700 rounded-2xl p-6 space-y-4">
            <h2 className="text-gray-200 font-semibold">New Support Ticket</h2>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-brandDark-700 border border-brandDark-600 rounded-lg px-3 py-2 text-sm text-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full bg-brandDark-700 border border-brandDark-600 rounded-lg px-3 py-2 text-sm text-white">
                {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Subject</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Brief description of your issue"
                className="w-full bg-brandDark-700 border border-brandDark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500" />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Message</label>
              <textarea rows={6} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Describe your issue in detail…"
                className="w-full bg-brandDark-700 border border-brandDark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-primary-500" />
            </div>

            <div className="flex gap-3">
              <button onClick={submitForm} disabled={!form.subject.trim() || !form.message.trim() || loading.action}
                className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {loading.action ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Ticket
              </button>
              <button onClick={() => setView('list')} className="px-4 bg-brandDark-700 text-gray-300 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Ticket list */}
        {view === 'list' && (
          <div className="space-y-3">
            {loading.list
              ? <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-primary-500" /></div>
              : myTickets.length === 0
              ? (
                <div className="bg-brandDark-800 border border-brandDark-700 rounded-2xl p-10 text-center">
                  <LifeBuoy className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No support tickets yet</p>
                  <p className="text-gray-500 text-xs mt-1">Submit a ticket and we'll get back to you</p>
                </div>
              )
              : myTickets.map(t => (
                <button key={t._id} onClick={() => openTicket(t._id)}
                  className="w-full text-left bg-brandDark-800 border border-brandDark-700 rounded-xl p-4 hover:bg-brandDark-700/50 transition-colors flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-200 truncate">{t.subject}</p>
                      <Badge label={t.status.replace(/_/g,' ')} style={STATUS_BADGE[t.status] || STATUS_BADGE.open} />
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span className="capitalize">{t.category}</span>
                      <span>·</span>
                      <span>{t.replies?.length || 0} replies</span>
                      <span>·</span>
                      <span>{fmtDT(t.lastReplyAt || t.createdAt)}</span>
                    </div>
                  </div>
                  {!t.readByUser && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />}
                  <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                </button>
              ))
            }
          </div>
        )}

        {/* Single ticket view */}
        {view === 'ticket' && (
          loading.ticket
            ? <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-primary-500" /></div>
            : activeTicket && (
              <div className="bg-brandDark-800 border border-brandDark-700 rounded-2xl overflow-hidden">
                {/* Info bar */}
                <div className="p-5 border-b border-brandDark-700">
                  <h2 className="text-gray-200 font-semibold text-base">{activeTicket.subject}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge label={activeTicket.status.replace(/_/g,' ')} style={STATUS_BADGE[activeTicket.status] || STATUS_BADGE.open} />
                    <Badge label={activeTicket.category} style="bg-gray-500/20 text-gray-400" />
                    <Badge label={activeTicket.priority} style="bg-gray-500/20 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Opened {fmtDT(activeTicket.createdAt)}</p>
                </div>

                {/* Thread */}
                <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
                  <div className="bg-brandDark-700/50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-2">Your message</p>
                    <p className="text-sm text-gray-200 whitespace-pre-wrap">{activeTicket.message}</p>
                  </div>

                  {activeTicket.replies?.map((r, i) => (
                    <div key={i} className={`rounded-xl p-4 ${r.authorRole === 'admin' ? 'bg-primary-900/30 ml-6 border border-primary-700/30' : 'bg-brandDark-700/50 mr-6'}`}>
                      <p className="text-xs text-gray-500 mb-2">
                        {r.authorRole === 'admin' ? '🛡️ Support Team' : 'You'} · {fmtDT(r.createdAt)}
                      </p>
                      <p className="text-sm text-gray-200 whitespace-pre-wrap">{r.message}</p>
                    </div>
                  ))}
                </div>

                {/* Reply */}
                {activeTicket.status !== 'closed' && (
                  <div className="p-5 border-t border-brandDark-700">
                    <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder="Add a reply…"
                      className="w-full bg-brandDark-700 border border-brandDark-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-primary-500 mb-3" />
                    <button onClick={sendReply} disabled={!reply.trim() || loading.action}
                      className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                      {loading.action ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Reply
                    </button>
                  </div>
                )}
              </div>
            )
        )}
      </div>
    </div>
  );
}
