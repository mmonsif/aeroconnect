
import React, { useState, useEffect } from 'react';
import { User, Language, Task, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
// Changed import from react-router-dom to react-router to resolve missing export errors
import { useLocation } from 'react-router';
import { Plus, MapPin, X, Edit, Trash2, Play, CheckCircle, User as UserIcon, AlertCircle, Activity } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface TaskBoardProps {
  user: User;
  language: Language;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  users: User[];
}

const TaskBoard: React.FC<TaskBoardProps> = ({ user, language, tasks, setTasks, users }) => {
  const t = TRANSLATIONS[language];
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState('all');
  
  const [taskForm, setTaskForm] = useState({ 
    title: '', 
    location: '', 
    priority: 'medium' as Task['priority'], 
    assignedTo: '', 
    department: user.department,
    description: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') { setIsModalOpen(true); }
  }, [location]);

  const handleSaveTask = async () => {
    if (!isSupabaseConfigured()) return;

    if (editingTask) {
      await supabase.from('tasks').update({
        title: taskForm.title,
        location: taskForm.location,
        priority: taskForm.priority,
        assigned_to: taskForm.assignedTo,
        department: taskForm.department,
        description: taskForm.description
      }).eq('id', editingTask.id);
    } else {
      await supabase.from('tasks').insert([{
        id: `T${Date.now()}`,
        title: taskForm.title,
        description: taskForm.description,
        assigned_to: taskForm.assignedTo,
        status: 'pending',
        priority: taskForm.priority,
        location: taskForm.location,
        department: taskForm.department
      }]);
    }
    resetForm();
  };

  const handleStatusUpdate = async (id: string, status: Task['status']) => {
    if (!isSupabaseConfigured()) return;
    
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));

    try {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSupabaseConfigured()) {
      alert("Database link not established.");
      return;
    }

    if (window.confirm("ARE YOU SURE? This operation will permanently remove this duty from the ground logs.")) {
      // Immediate Optimistic UI Update
      setTasks(prev => prev.filter(t => t.id !== id));

      try {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
      } catch (err: any) {
        console.error("Terminal Task Deletion Failed:", err);
        alert(`Security system blocked deletion: ${err?.message || 'Connection error'}. Reverting...`);
        
        // Manual re-sync to revert local state
        const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (data) setTasks(data.map((t: any) => ({
          id: t.id, title: t.title, description: t.description || '', assignedTo: t.assigned_to,
          status: t.status, priority: t.priority, location: t.location, department: t.department,
          createdAt: t.created_at
        })));
      }
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setTaskForm({ title: '', location: '', priority: 'medium', assignedTo: '', department: user.department, description: '' });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTaskForm({ title: task.title, location: task.location, priority: task.priority, assignedTo: task.assignedTo, department: task.department, description: task.description });
    setIsModalOpen(true);
  };

  const canModify = (task: Task) => 
    user.role === UserRole.ADMIN || 
    ((user.role === UserRole.MANAGER || user.role === UserRole.SUPERVISOR) && task.department === user.department);

  const canExecute = (task: Task) => 
    task.assignedTo === user.name || 
    ((user.role === UserRole.MANAGER || user.role === UserRole.SUPERVISOR) && task.department === user.department);

  const filteredTasks = tasks.filter(t => {
    // Status filter
    const matchesStatus = filter === 'all' || t.status === filter;

    // Role-based access control
    let canView = false;
    if (user.role === UserRole.ADMIN) {
      canView = true; // Admin sees all tasks
    } else if (user.role === UserRole.MANAGER || user.role === UserRole.SUPERVISOR) {
      // Manager sees tasks from their department and their own tasks
      canView = t.department === user.department || t.assignedTo === user.name;
    } else if (user.role === UserRole.STAFF) {
      // Staff sees only their own tasks
      canView = t.assignedTo === user.name;
    }

    return matchesStatus && canView;
  });

  const getStatusColor = (status: Task['status']) => {
    switch(status) {
      case 'in_progress': return 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]';
      case 'completed': return 'bg-emerald-500 text-white';
      case 'blocked': return 'bg-red-500 text-white';
      default: return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.tasks}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Hub Task Management & Execution</p>
        </div>
        {user.role !== UserRole.STAFF && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"><Plus size={20} />{t.assignTask}</button>
        )}
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
        {['all', 'pending', 'in_progress', 'completed', 'blocked'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${filter === f ? 'bg-slate-900 text-white dark:bg-white dark:text-black border-transparent' : 'bg-white text-slate-400 dark:bg-slate-900 dark:text-slate-500 border-slate-100 dark:border-slate-800'}`}>{f.replace('_', ' ')}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col gap-2">
                <span className={`w-fit px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  task.priority === 'critical' ? 'bg-red-600 text-white' : 
                  task.priority === 'high' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
                }`}>{task.priority} Priority</span>
                
                <span className={`w-fit px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${getStatusColor(task.status)}`}>
                  {task.status === 'in_progress' && <Activity size={10} className="animate-pulse"/>}
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {canModify(task) && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(task); }} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"><Edit size={16} /></button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} 
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete Permanently"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <h4 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">{task.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{task.description || "No specific instructions provided."}</p>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><MapPin size={12} /><span>{task.location}</span></div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest"><UserIcon size={12} /><span>{task.assignedTo}</span></div>
            </div>

            <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
               {canExecute(task) && task.status !== 'completed' && (
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <button onClick={() => handleStatusUpdate(task.id, 'in_progress')} className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-500/20"><Play size={14} className="inline mr-2" /> Start Duty</button>
                    )}
                    {(task.status === 'in_progress' || task.status === 'blocked') && (
                      <button onClick={() => handleStatusUpdate(task.id, 'completed')} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-500/20"><CheckCircle size={14} className="inline mr-2" /> Finish Duty</button>
                    )}
                  </div>
               )}
               {task.status === 'completed' && (
                  <div className="flex items-center justify-center py-2 text-emerald-500 gap-2">
                    <CheckCircle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Duty Completed</span>
                  </div>
               )}
            </div>
          </div>
        ))}
        {filteredTasks.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-30">
            <AlertCircle size={48} className="mx-auto mb-4" />
            <p className="text-sm font-black uppercase tracking-widest">No active tasks in this queue</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white mb-6">{editingTask ? 'Modify Hub Duty' : 'New Hub Duty'}</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Duty Title" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl outline-none border-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-blue-500 dark:text-white" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Gate/Stand" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-blue-500 dark:text-white" value={taskForm.location} onChange={e => setTaskForm({...taskForm, location: e.target.value})} />
                <select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-100 dark:ring-slate-700 dark:text-white" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value as any})}><option value="low">Low Priority</option><option value="medium">Normal</option><option value="high">High</option><option value="critical">Critical</option></select>
              </div>
              <select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-100 dark:ring-slate-700 dark:text-white" value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}>
                <option value="">Auto-Assignment / None</option>
                {users.map(u => <option key={u.id} value={u.name}>{u.name} ({u.department})</option>)}
              </select>
              <textarea placeholder="Specific Instructions..." className="w-full h-24 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-blue-500 dark:text-white resize-none" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
              <div className="flex gap-3 pt-2">
                <button onClick={resetForm} className="flex-1 py-3 text-slate-500 font-bold">Discard</button>
                <button onClick={handleSaveTask} className="flex-[2] py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">{editingTask ? 'Update Ops' : 'Initiate Ops'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
