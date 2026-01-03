
import React, { useState, useMemo } from 'react';
import { Plane, Lock, User as UserIcon, ShieldCheck, AlertCircle, Database, DatabaseZap } from 'lucide-react';
import { User, Language } from '../types';
import { APP_NAME } from '../constants';
import { isSupabaseConfigured } from '../lib/supabase';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  language: Language;
}

const Login: React.FC<LoginProps> = ({ users, onLogin, language }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Exclude the system broadcast account from the count of real users
  const realUsersCount = useMemo(() => 
    users.filter(u => u.id !== '00000000-0000-0000-0000-000000000000').length, 
  [users]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (realUsersCount === 0) {
      setError(language === 'ar' ? 'لم يتم العثور على مستخدمين. يرجى تشغيل نص تثبيت قاعدة البيانات.' : 'No users found. Please run the database setup script in Supabase.');
      return;
    }

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

  const isConfigured = isSupabaseConfigured();

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

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          {/* Connection Status Badge */}
          <div className="absolute top-0 right-0 pt-3 pr-4">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isConfigured && realUsersCount > 0 ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'text-red-500 bg-red-50 dark:bg-red-900/10'}`}>
              {isConfigured && realUsersCount > 0 ? <DatabaseZap size={10}/> : <Database size={10}/>}
              {realUsersCount > 0 ? 'Live Hub' : 'Setup Required'}
            </div>
          </div>

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
              <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-1">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-red-600 dark:text-red-400">{error}</p>
                  {realUsersCount === 0 && (
                    <p className="text-[9px] text-red-500/70 font-medium">
                      Hint: Use your Supabase SQL Editor to run the Master Script in lib/supabase.ts.
                    </p>
                  )}
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={!isConfigured}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/30 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck size={20} />
              {language === 'ar' ? 'تسجيل الدخول الآمن' : 'Secure Login'}
            </button>
          </form>

          {realUsersCount === 0 && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
               <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 mb-1">First Time Setup?</p>
               <p className="text-[9px] text-blue-800 dark:text-blue-300 leading-tight">
                 Your database is empty. Once you run the SQL script, use:
                 <br/><span className="font-black">User: admin</span> / <span className="font-black">Pass: 123456</span>
               </p>
            </div>
          )}

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
