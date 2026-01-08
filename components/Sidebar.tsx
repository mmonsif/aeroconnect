
import React, { useState } from 'react';
// Changed import from react-router-dom to react-router to resolve missing export errors
import { NavLink } from 'react-router';
import { NAVIGATION_ITEMS, TRANSLATIONS, APP_NAME } from '../constants';
import { User, Language, UserRole } from '../types';
import { Plane, X, ShieldCheck, AlertCircle, Send, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  user: User;
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onBroadcast: (message: string) => void;
  unreadChatsCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ user, language, isOpen, onClose, onBroadcast, unreadChatsCount = 0 }) => {
  const t = TRANSLATIONS[language];
  const isRTL = language === 'ar';
  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SAFETY_MANAGER || user.role === UserRole.MANAGER;
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) return;

    try {
      // Create broadcast alert in database
      const { data: allUsers } = await supabase.from('users').select('id');
      const recipientIds = allUsers?.map(u => u.id) || [];

      const { data: broadcastData, error } = await supabase
        .from('broadcast_alerts')
        .insert([{
          sender_id: user.id,
          sender_name: user.name,
          message: broadcastMessage,
          recipients: recipientIds,
          read_by: [user.id] // Sender automatically reads it
        }])
        .select()
        .single();

      if (error) {
        console.error('Broadcast creation error:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        alert(`Failed to send broadcast alert: ${error.message}`);
        return;
      }

      // Call the existing onBroadcast callback for any additional handling
      onBroadcast(broadcastMessage);

      // Create notifications for all users
      const notifications = recipientIds.map(userId => ({
        id: `notif_${Date.now()}_${userId}`,
        title: 'Emergency Broadcast',
        message: broadcastMessage,
        type: 'broadcast' as const,
        severity: 'urgent' as const,
        isRead: false,
        timestamp: new Date()
      }));

      // Here you would typically send these notifications to a notification service
      // For now, we'll just log them
      console.log('Broadcast notifications created:', notifications);

      setBroadcastMessage('');
      setIsBroadcastModalOpen(false);
      onClose();
      alert('Emergency broadcast sent to all personnel!');
    } catch (error) {
      console.error('Broadcast error:', error);
      alert('Failed to send broadcast. Please check your connection and try again.');
    }
  };

  const sidebarClasses = `
    fixed lg:relative lg:top-auto z-50 min-h-screen bg-slate-900 dark:bg-black text-white border-r border-slate-800 transition-all duration-300
    ${isOpen ? (isRTL ? 'right-0' : 'left-0') : (isRTL ? '-right-64' : '-left-64')}
    lg:left-0 lg:right-auto lg:translate-x-0 w-64 flex flex-col
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Plane className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {NAVIGATION_ITEMS.map((item) => {
            if (item.restricted && !isAdmin) return null;
            return (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                {item.icon}
                <span className="font-medium">{(t as any)[item.label]}</span>
                {item.id === 'messages' && unreadChatsCount > 0 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse ring-2 ring-white/20">
                    {unreadChatsCount}
                  </span>
                )}
              </NavLink>
            );
          })}
          
          {isAdmin && (
            <div className="pt-6 mt-6 border-t border-slate-800 space-y-1">
              <p className="px-4 text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Security Hub</p>
              <NavLink
                to="/admin?tab=safety"
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive ? 'bg-orange-600 text-white' : 'text-orange-400 hover:bg-orange-900/20'}
                `}
              >
                <ShieldCheck size={20} />
                <span className="font-medium">{t.safetyReview}</span>
              </NavLink>
              <button 
                onClick={() => setIsBroadcastModalOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <AlertCircle size={20} />
                <span className="font-medium">Broadcast Alert</span>
              </button>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="p-4 rounded-xl bg-slate-800/50 mb-2 text-center space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">v 1.0.0 . 2026</p>
            <p className="text-[8px] text-slate-600 font-medium leading-tight">All copy rights reserved to Mohamed Shehab</p>
          </div>
        </div>
      </aside>

      {/* Broadcast Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-red-600 p-6 flex items-center gap-4 text-white">
              <div className="p-3 bg-white/20 rounded-2xl">
                <ShieldAlert size={32} />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Emergency Broadcast</h2>
                <p className="text-red-100 text-xs">This message will be sent to ALL ground personnel.</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Alert Message</label>
                <textarea 
                  placeholder="Type the emergency instruction clearly..."
                  className="w-full h-40 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-none outline-none text-slate-900 dark:text-white resize-none ring-2 ring-slate-100 dark:ring-slate-800 focus:ring-red-500 transition-all font-medium"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-800/30 flex gap-3 items-start">
                <AlertCircle className="text-orange-600 shrink-0" size={18} />
                <p className="text-[11px] text-orange-800 dark:text-orange-300 leading-tight">
                  <span className="font-bold">Important:</span> Only use this for high-priority operational risks or security events. Use the Chat/Forum for non-urgent communication.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSendBroadcast}
                  disabled={!broadcastMessage.trim()}
                  className="flex-[2] py-3 bg-red-600 text-white font-bold rounded-2xl shadow-xl shadow-red-500/30 hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                  Initiate Global Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
