
import React, { useState, useEffect } from 'react';
import { User, Language, Task, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import { useLocation } from 'react-router-dom';
import { Plus, MapPin, Clock, X, Edit, Trash2, Play, CheckCircle, User as UserIcon, Briefcase } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface TaskBoardProps {
  user: User;
  language: Language;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const ACTIVE_USERS = [
  { id: 'u1', name: 'Ahmed Al-Farsi', department: 'Operations' },
  { id: 'u2', name: 'Sara Miller', department: 'Operations' },
  { id: 'u3', name: 'John Doe', department: 'Maintenance' },
  { id: 'u4', name: 'Staff X', department: 'Maintenance' },
  { id: 'u5', name: 'Fatima Zahra', department: 'Security' },
];

const TaskBoard: React.FC<TaskBoardProps> = ({ user, language, tasks, setTasks }) => {
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
    await supabase.from('tasks').update({ status }).eq('id', id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure?")) {
      await supabase.from('tasks').delete().eq('id', id);
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

  const canModify = (task: Task) => user.role === UserRole.ADMIN || ((user.role === UserRole.MANAGER || user.role === UserRole.SUPERVISOR) && task.department === user.department);
  const canExecute = (task: Task) => task.assignedTo === user.name;
  const filteredTasks = tasks.filter(t => filter === 'all' || t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.tasks}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Hub Task Management</p>
        </div>
        {user.role !== UserRole.STAFF && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20"><Plus size={20} />{t.assignTask}</button>
        )}
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'pending', 'in_progress', 'completed', 'blocked'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${filter === f ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}>{f.toUpperCase()}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group">
            <div className="flex items-start justify-between mb-4">
              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${task.priority === 'high' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{task.priority} Priority</span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {canModify(task) && (
                  <><button onClick={() => handleEdit(task)} className="p-1.5 text-slate-400 hover:text-blue-500"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(task.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button></>
                )}
              </div>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">{task.title}</h4>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin size={14} /><span>{task.location}</span></div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"><UserIcon size={14} /><span>{task.assignedTo}</span></div>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
               {canExecute(task) && task.status !== 'completed' && (
                  <div className="grid grid-cols-2 gap-2">
                    {task.status === 'pending' && <button onClick={() => handleStatusUpdate(task.id, 'in_progress')} className="col-span-2 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"><Play size={14} className="inline mr-2" /> Start Task</button>}
                    {task.status === 'in_progress' && <button onClick={() => handleStatusUpdate(task.id, 'completed')} className="col-span-2 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold"><CheckCircle size={14} className="inline mr-2" /> Finish Task</button>}
                  </div>
               )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold dark:text-white mb-6">{editingTask ? 'Edit Task' : 'New Task'}</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Task Title" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl outline-none border" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Location" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border" value={taskForm.location} onChange={e => setTaskForm({...taskForm, location: e.target.value})} />
                <select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value as any})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
              </div>
              <select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border" value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}><option value="">Select Staff</option>{ACTIVE_USERS.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select>
              <textarea placeholder="Description" className="w-full h-24 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
              <button onClick={handleSaveTask} className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl">{editingTask ? 'Save' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
