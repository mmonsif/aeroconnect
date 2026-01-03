
import React, { useState } from 'react';
import { User, Language, ForumPost, ForumReply } from '../types';
import { TRANSLATIONS } from '../constants';
import { Plus, User as UserIcon, Clock, Send } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ForumBoardProps {
  user: User;
  language: Language;
  posts: ForumPost[];
  setPosts: React.Dispatch<React.SetStateAction<ForumPost[]>>;
}

const ForumBoard: React.FC<ForumBoardProps> = ({ user, language, posts }) => {
  const t = TRANSLATIONS[language];
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  const handleCreatePost = async () => {
    if (!newTitle || !newContent || !isSupabaseConfigured()) return;
    await supabase.from('forum_posts').insert([{
      id: `f-${Date.now()}`,
      author_id: user.id,
      author_name: user.name,
      title: newTitle,
      content: newContent
    }]);
    setNewTitle('');
    setNewContent('');
    setShowForm(false);
  };

  const handleReplySubmit = async (postId: string) => {
    const text = replyInputs[postId];
    if (!text?.trim() || !isSupabaseConfigured()) return;
    await supabase.from('forum_replies').insert([{
      id: `r-${Date.now()}`,
      post_id: postId,
      author_name: user.name,
      content: text
    }]);
    setReplyInputs(prev => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">{t.forum}</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold"><Plus size={20} className="inline mr-2" />New Post</button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <input type="text" placeholder="Title" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl dark:text-white border outline-none" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          <textarea placeholder="Content..." className="w-full h-32 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl dark:text-white border outline-none" value={newContent} onChange={e => setNewContent(e.target.value)} />
          <button onClick={handleCreatePost} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">Publish</button>
        </div>
      )}

      <div className="space-y-4 pb-20">
        {posts.map(post => (
          <div key={post.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-2 uppercase">
              <UserIcon size={12} /> {post.authorName} • <Clock size={12} /> {post.createdAt}
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-2">{post.title}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">{post.content}</p>
            
            <div className="space-y-2">
              {post.replies?.map(reply => (
                <div key={reply.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-xs relative group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold dark:text-white">{reply.author_name}: </span>
                    <span className="text-[9px] text-slate-400 font-medium">{reply.createdAt}</span>
                  </div>
                  <span className="dark:text-slate-400 leading-relaxed">{reply.content}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input type="text" placeholder="Reply..." className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2 text-xs dark:text-white border outline-none" value={replyInputs[post.id] || ''} onChange={e => setReplyInputs(prev => ({ ...prev, [post.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleReplySubmit(post.id)} />
              <button onClick={() => handleReplySubmit(post.id)} className="p-2 bg-emerald-600 text-white rounded-xl active:scale-95 transition-transform"><Send size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForumBoard;
