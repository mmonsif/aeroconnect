
import React, { useState } from 'react';
import { Plane, Lock, User as UserIcon, ShieldCheck, AlertCircle } from 'lucide-react';
import { User, Language } from '../types';
import { APP_NAME } from '../constants';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  language: Language;
}

const Login: React.FC<LoginProps> = ({ users, onLogin, language }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && (u.password === password || (!u.password && password === '123456')));
    
    if (user) {
      if (user.status === 'inactive') {
        setError(language === 'ar' ? 'هذا الحساب معطل.' : 'This account is deactivated.');
        return;
      }
      onLogin(user);
    } else {
      setError(language === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة.' : 'Invalid username or password.');
    }
  };

  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-500/30">
            <Plane className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{APP_NAME}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {language === 'ar' ? 'نظام إدارة عمليات المطار الأرضية' : 'Airport Ground Operations System'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                {language === 'ar' ? 'اسم المستخدم' : 'Username'}
              </label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  autoComplete="username"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none dark:text-white ring-1 ring-slate-100 dark:ring-slate-800 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter your username'}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  autoComplete="current-password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none dark:text-white ring-1 ring-slate-100 dark:ring-slate-800 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs font-bold animate-in slide-in-from-top-1">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/30 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck size={20} />
              {language === 'ar' ? 'تسجيل الدخول الآمن' : 'Secure Login'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {language === 'ar' ? 'نظام مرخص لموظفي المطار فقط' : 'Authorized Personnel Only'}
            </p>
          </div>
        </div>
        
        <div className="text-center space-y-1">
          <p className="text-[10px] text-slate-400 font-medium">AEROCONNECT OPERATIONS HUB | EGY Hub © 2026</p>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">All copy rights reserved to Mohamed Shehab</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
