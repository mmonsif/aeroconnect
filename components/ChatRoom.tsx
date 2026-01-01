
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { User, Language, ChatMessage } from '../types';
import { TRANSLATIONS } from '../constants';
import { 
  Send, Globe, CheckCheck, Check, Phone, Video, 
  Search, ChevronLeft, AlertCircle, Languages, 
  X, Mic, MicOff, VideoOff, PhoneOff, UserPlus, Users,
  MessageSquare
} from 'lucide-react';
import { geminiService } from '../services/gemini';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface ChatRoomProps {
  user: User;
  language: Language;
  users: User[];
  globalMessages: ChatMessage[];
  setGlobalMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ user, language, users, globalMessages, setGlobalMessages }) => {
  const t = TRANSLATIONS[language];
  
  // Discover people who have sent or received messages
  const activeContacts = useMemo(() => {
    const ids = new Set<string>();
    globalMessages.forEach(m => {
      if (m.senderId !== user.id) ids.add(m.senderId);
      if (m.recipientId !== user.id) ids.add(m.recipientId);
    });

    return Array.from(ids).map(id => {
      const u = users.find(u => u.id === id);
      return u ? {
        id: u.id,
        name: u.name,
        avatar: u.avatar || `https://picsum.photos/seed/${u.id}/100/100`,
        status: u.status === 'active' ? 'Online' : 'Offline',
        department: u.department
      } : null;
    }).filter(Boolean) as any[];
  }, [globalMessages, users, user.id]);

  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [globalMessages, selectedContact, showListOnMobile]);

  // Mark as read when entering a chat
  useEffect(() => {
    const markAsRead = async () => {
      if (!selectedContact || !isSupabaseConfigured()) return;
      
      const hasUnread = globalMessages.some(m => 
        m.senderId === selectedContact.id && m.recipientId === user.id && m.status !== 'read'
      );

      if (hasUnread) {
        await supabase
          .from('messages')
          .update({ status: 'read' })
          .match({ sender_id: selectedContact.id, recipient_id: user.id, status: 'sent' });
        
        setGlobalMessages(prev => prev.map(m => 
          (m.senderId === selectedContact.id && m.recipientId === user.id) 
            ? { ...m, status: 'read' as const } 
            : m
        ));
      }
    };
    markAsRead();
  }, [selectedContact, globalMessages, user.id, setGlobalMessages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedContact) return;
    const text = input.trim();
    setInput('');

    if (isSupabaseConfigured()) {
      await supabase.from('messages').insert([{
        sender_id: user.id,
        recipient_id: selectedContact.id,
        sender_name: user.name,
        text: text,
        status: 'sent'
      }]);
    }
  };

  const filteredContacts = activeContacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const currentChatMessages = useMemo(() => {
    if (!selectedContact) return [];
    return globalMessages.filter(m => 
      (m.senderId === user.id && m.recipientId === selectedContact.id) ||
      (m.senderId === selectedContact.id && m.recipientId === user.id)
    );
  }, [globalMessages, selectedContact, user.id]);

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl animate-in fade-in duration-300">
      
      {/* Sidebar (Chat List) */}
      <div className={`${showListOnMobile ? 'w-full' : 'hidden'} md:w-80 md:flex flex-col border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950`}>
        <div className="p-4 border-b dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">Ops Link</h2>
          <button onClick={() => setIsNewChatOpen(true)} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
            <UserPlus size={18} />
          </button>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" placeholder="Search team members..." 
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2 pl-9 text-xs outline-none dark:text-white shadow-inner"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredContacts.length > 0 ? filteredContacts.map(c => {
            const unreadCount = globalMessages.filter(m => m.senderId === c.id && m.recipientId === user.id && m.status !== 'read').length;
            const lastMsg = globalMessages.filter(m => (m.senderId === c.id || m.recipientId === c.id)).pop();
            return (
              <div 
                key={c.id} 
                onClick={() => { setSelectedContact(c); setShowListOnMobile(false); }}
                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors border-b dark:border-slate-800/50 ${selectedContact?.id === c.id ? 'bg-white dark:bg-slate-800 border-r-4 border-blue-500' : ''}`}
              >
                <div className="relative shrink-0">
                  <img src={c.avatar} className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-700" alt="" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950 animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-sm dark:text-white truncate">{c.name}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{lastMsg?.timestamp || ''}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter truncate">{lastMsg?.text || c.department}</p>
                </div>
              </div>
            );
          }) : (
            <div className="p-10 text-center opacity-30">
              <Users size={40} className="mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase">Start a conversation</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${!showListOnMobile ? 'w-full' : 'hidden'} md:flex md:flex-1 flex flex-col bg-slate-50 dark:bg-slate-950`}>
        {selectedContact ? (
          <>
            <div className="p-4 border-b dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowListOnMobile(true)} className="md:hidden p-2 text-slate-400"><ChevronLeft size={20}/></button>
                <img src={selectedContact.avatar} className="w-10 h-10 rounded-full" alt="" />
                <div>
                  <h3 className="font-bold text-sm dark:text-white leading-tight">{selectedContact.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedContact.status === 'Online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedContact.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Phone size={18}/></button>
                <button className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Video size={18}/></button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
              {currentChatMessages.map(m => {
                const isMe = m.senderId === user.id;
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm relative ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700'}`}>
                      {!isMe && <p className="text-[9px] font-black text-blue-500 uppercase mb-1">{m.senderName}</p>}
                      <p className="text-sm leading-relaxed">{m.text}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                        <span className="text-[9px] font-bold">{m.timestamp}</span>
                        {isMe && (
                          m.status === 'read' 
                            ? <CheckCheck size={12} className="text-blue-300" />
                            : <Check size={12} className="opacity-50" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {currentChatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
                  <AlertCircle size={40} className="mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">End-to-End Encrypted Link</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl ring-1 ring-slate-100 dark:ring-slate-700 focus-within:ring-blue-500 transition-all">
                <input 
                  type="text" placeholder="Type secure message..." 
                  className="flex-1 bg-transparent border-none outline-none text-sm px-3 dark:text-white"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} disabled={!input.trim()} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-30">
            <MessageSquare size={60} className="mb-4 text-blue-600" />
            <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">AeroConnect Secure Hub</h3>
            <p className="text-sm max-w-xs mt-2 font-medium">Historical messages are automatically synced from the secure operations cloud.</p>
          </div>
        )}
      </div>

      {/* Directory Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase dark:text-white">Team Directory</h3>
              <button onClick={() => setIsNewChatOpen(false)}><X className="text-slate-400" /></button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {users.filter(u => u.id !== user.id).map(u => (
                <div 
                  key={u.id} 
                  onClick={() => {
                    setSelectedContact({ id: u.id, name: u.name, avatar: u.avatar, status: 'Online', department: u.department });
                    setIsNewChatOpen(false);
                    setShowListOnMobile(false);
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl cursor-pointer border border-transparent hover:border-blue-500/20 transition-all"
                >
                  <img src={u.avatar} className="w-10 h-10 rounded-full" alt="" />
                  <div className="flex-1">
                    <p className="text-sm font-bold dark:text-white">{u.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase">{u.department}</p>
                  </div>
                  <ChevronLeft size={16} className="text-slate-300 rotate-180" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
