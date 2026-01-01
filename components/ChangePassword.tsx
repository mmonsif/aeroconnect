
import React, { useState } from 'react';
import { Key, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';

interface ChangePasswordProps {
  onComplete: (newPass: string) => void;
  language: Language;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ onComplete, language }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError(language === 'ar' ? 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.' : 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError(language === 'ar' ? 'كلمات المرور غير متطابقة.' : 'Passwords do not match.');
      return;
    }
    onComplete(password);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-2xl mb-4">
            <Key size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Set New Password</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Your current password is temporary. Please choose a secure new password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">New Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none dark:text-white ring-1 ring-slate-100 dark:ring-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Confirm New Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none dark:text-white ring-1 ring-slate-100 dark:ring-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="space-y-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={12} /> Password Requirements
            </p>
            <ul className="text-[10px] text-blue-700 dark:text-blue-300 space-y-1 mt-1 font-medium list-disc pl-4">
              <li>Minimum 6 characters</li>
              <li>Must not match previous password</li>
            </ul>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/30 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Update & Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
