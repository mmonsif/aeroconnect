
import React, { useState } from 'react';
import { User, Language, ForumPost, ForumReply } from '../types';
import { TRANSLATIONS } from '../constants';
import { MessageSquare, Plus, User as UserIcon, Clock, Send, CheckCircle2 } from 'lucide-react';

interface ForumBoardProps {
  user: User;
  language: Language;
  posts: ForumPost[];
  setPosts: React.Dispatch<React.SetStateAction<ForumPost[]>>;
}

const ForumBoard: React.FC<ForumBoardProps> = ({ user, language, posts, setPosts }) => {
  const t = TRANSLATIONS[language];
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [lastRepliedId, setLastRepliedId] = useState<string | null>(null);

  const handleCreatePost = () => {
    if (!newTitle || !newContent) return;
    const post: ForumPost = {
      id: `f-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      title: newTitle,
      content: newContent,
      createdAt: 'Just now',
      replies: []
    };
    setPosts(prev => [post, ...prev]);
    setNewTitle('');
    setNewContent('');
    setShowForm(false);
  };

  const handleReplySubmit = (postId: string) => {
    const replyText = replyInputs[postId];
    if (!replyText?.trim()) return;

    const newReply: ForumReply = {
      id: `r-${Date.now()}`,
      authorName: user.name,
      content: replyText,
      createdAt: 'Just now'
    };

    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, replies: [...p.replies, newReply] } : p
    ));

    setReplyInputs(prev => ({ ...prev, [postId]: '' }));
    
    // Feedback
    setLastRepliedId(postId);
    setTimeout(() => setLastRepliedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">{t.forum}</h1>
          <p className="text-sm text-slate-500">Collaborative discussions for all ground staff</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} /> New Discussion
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in slide-in-from-top-4 duration-300">
          <input 
            type="text" placeholder="Topic Title" 
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 outline-none dark:text-white ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-emerald-500"
            value={newTitle} onChange={e => setNewTitle(e.target.value)}
          />
          <textarea 
            placeholder="Detailed description..." 
            className="w-full h-32 bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 outline-none dark:text-white resize-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-emerald-500"
            value={newContent} onChange={e => setNewContent(e.target.value)}
          />
          <button onClick={handleCreatePost} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">Publish Discussion</button>
        </div>
      )}

      <div className="space-y-4 pb-10">
        {posts.map(post => (
          <div key={post.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:border-emerald-500 transition-all group">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
              <UserIcon size={12} /> {post.authorName} • <Clock size={12} /> {post.createdAt}
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-2 group-hover:text-emerald-500 transition-colors">{post.title}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">{post.content}</p>
            
            <div className="space-y-3">
              {post.replies.map(reply => (
                <div key={reply.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-xs animate-in fade-in slide-in-from-left-2 shadow-inner">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{reply.authorName}</span>
                    <span className="text-[10px] text-slate-400 italic">{reply.createdAt}</span>
                  </div>
                  <span className="text-slate-600 dark:text-slate-400 leading-normal">{reply.content}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Share your thoughts..." 
                  className={`w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none dark:text-white ring-1 transition-all ${
                    lastRepliedId === post.id ? 'ring-emerald-500' : 'ring-slate-100 dark:ring-slate-800 focus:ring-emerald-500'
                  }`}
                  value={replyInputs[post.id] || ''}
                  onChange={e => setReplyInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleReplySubmit(post.id)}
                />
                {lastRepliedId === post.id && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                    <CheckCircle2 size={16} />
                  </span>
                )}
              </div>
              <button 
                onClick={() => handleReplySubmit(post.id)}
                className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForumBoard;
