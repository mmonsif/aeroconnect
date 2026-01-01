
import React from 'react';
import { User, Language, LeaveRequest } from '../types';
import { TRANSLATIONS } from '../constants';
import { 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  MessageSquareReply,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface MyLeaveBoardProps {
  user: User;
  language: Language;
  requests: LeaveRequest[];
  setRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
}

const MyLeaveBoard: React.FC<MyLeaveBoardProps> = ({ user, language, requests, setRequests }) => {
  const t = TRANSLATIONS[language];
  const myRequests = requests.filter(r => r.staffId === user.staffId);

  const handleWithdraw = (id: string) => {
    // Immediate direct state update to filter out the request
    setRequests(prev => prev.filter(r => r.id !== id));
    alert("Leave request has been successfully withdrawn. Management has been notified.");
  };

  const handleAcceptSuggestion = (req: LeaveRequest) => {
    if (!req.suggestedStartDate || !req.suggestedEndDate) return;
    
    // Transitions request directly to Approved with suggested dates
    setRequests(prev => prev.map(r => 
      r.id === req.id ? { 
        ...r, 
        status: 'approved', 
        startDate: req.suggestedStartDate!, 
        endDate: req.suggestedEndDate!,
        suggestion: undefined,
        suggestedStartDate: undefined,
        suggestedEndDate: undefined
      } : r
    ));
    alert("You have accepted the suggested dates. Your leave is now APPROVED.");
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'suggestion_sent': return 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
      default: return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 size={18} />;
      case 'rejected': return <XCircle size={18} />;
      case 'suggestion_sent': return <HelpCircle size={18} />;
      default: return <Clock size={18} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.myleave}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Track your leave applications and management feedback</p>
      </div>

      <div className="space-y-4">
        {myRequests.length > 0 ? myRequests.map(req => (
          <div key={req.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl border ${getStatusStyle(req.status)}`}>
                  {getStatusIcon(req.status)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-slate-900 dark:text-white ${req.status === 'suggestion_sent' ? 'line-through opacity-50' : ''}`}>{req.startDate} — {req.endDate}</h3>
                    <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                      {req.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">"{req.reason}"</p>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(req.status)}`}>
                  {req.status === 'suggestion_sent' ? 'Modification Requested' : req.status.replace('_', ' ')}
                </span>
                <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-tighter">Request ID: {req.id.split('-').pop()}</p>
              </div>
            </div>

            {req.status === 'suggestion_sent' && req.suggestedStartDate && (
              <div className="mt-6 p-5 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-800/30 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquareReply size={16} className="text-orange-600 dark:text-orange-400" />
                  <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Manager's Counter-offer</span>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 p-3 bg-white dark:bg-slate-800 rounded-xl border border-orange-100 dark:border-orange-800/50">
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Proposed Dates</p>
                     <p className="text-sm font-bold dark:text-white flex items-center gap-2">
                        {req.suggestedStartDate} <ArrowRight size={14} className="text-orange-500" /> {req.suggestedEndDate}
                     </p>
                  </div>
                </div>

                {req.suggestion && (
                  <p className="text-xs text-orange-800 dark:text-orange-300 leading-relaxed italic mb-4">
                    "{req.suggestion}"
                  </p>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAcceptSuggestion(req)}
                    className="flex-1 py-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    Accept Counter-offer
                  </button>
                  <button 
                    onClick={() => handleWithdraw(req.id)}
                    className="flex-1 py-3 bg-white dark:bg-slate-800 text-red-500 border border-red-100 dark:border-red-900/50 text-xs font-bold rounded-xl hover:bg-red-50 transition-all active:scale-95"
                  >
                    Withdraw Request
                  </button>
                </div>
              </div>
            )}
            
            {(req.status === 'pending' || req.status === 'rejected') && (
              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-end">
                <button 
                  onClick={() => handleWithdraw(req.id)}
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest active:scale-95"
                >
                  Withdraw Request
                </button>
              </div>
            )}
          </div>
        )) : (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
            <CalendarDays className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={64} />
            <h3 className="text-slate-400 font-bold uppercase tracking-widest">No Leave Applications Found</h3>
            <p className="text-slate-400 text-xs mt-1">Submit a new request from the dashboard.</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30 flex gap-3">
        <AlertCircle className="text-blue-600 shrink-0" size={18} />
        <p className="text-[10px] text-blue-800 dark:text-blue-300 leading-tight font-medium">
          <strong>Workflow Guide:</strong> When a manager suggests new dates, you can Accept them to instantly approve your leave, or Withdraw if the new dates do not work for you.
        </p>
      </div>
    </div>
  );
};

export default MyLeaveBoard;
