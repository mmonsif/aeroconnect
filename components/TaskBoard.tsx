
import React, { useState, useEffect } from 'react';
import { User, Language, Task, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import { useLocation } from 'react-router-dom';
import { Plus, MapPin, Clock, X, Edit, Trash2, Play, CheckCircle, User as UserIcon, Briefcase } from 'lucide-react';

interface TaskBoardProps {
  user: User;
  language: Language;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

// Mock list of active users for the "Assigned To" dropdown
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
    if (params.get('action') === 'new') {
      setIsModalOpen(true);
    }
  }, [location]);

  const handleSaveTask = () => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { 
        ...t, 
        title: taskForm.title, 
        location: taskForm.location, 
        priority: taskForm.priority,
        assignedTo: taskForm.assignedTo,
        department: taskForm.department,
        description: taskForm.description
      } : t));
    } else {
      const newTask: Task = {
        id: `T${Date.now()}`,
        title: taskForm.title || 'New Task',
        description: taskForm.description || 'Standard operational task.',
        assignedTo: taskForm.assignedTo || user.name,
        status: 'pending',
        priority: taskForm.priority,
        location: taskForm.location || 'Terminal 3',
        createdAt: new Date().toISOString(),
        department: taskForm.department
      };
      setTasks([newTask, ...tasks]);
    }
    resetForm();
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setTaskForm({ 
      title: '', 
      location: '', 
      priority: 'medium', 
      assignedTo: '', 
      department: user.department, 
      description: '' 
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTaskForm({ 
      title: task.title, 
      location: task.location, 
      priority: task.priority, 
      assignedTo: task.assignedTo, 
      department: task.department,
      description: task.description 
    });
    setIsModalOpen(true);
  };

  const handleStatusUpdate = (id: string, status: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  // Role-based permission logic
  const canModify = (task: Task) => {
    if (user.role === UserRole.ADMIN) return true;
    if ((user.role === UserRole.MANAGER || user.role === UserRole.SUPERVISOR) && task.department === user.department) return true;
    return false;
  };

  const canExecute = (task: Task) => {
    // Staff can only "Start" or "Finish" tasks assigned to them
    return task.assignedTo === user.name;
  };

  // Hierarchy Based Filtering
  const getVisibleTasks = () => {
    return tasks.filter(task => {
      // Admin sees everything
      if (user.role === UserRole.ADMIN) return true;
      
      // Managers and Supervisors see tasks in their department
      if (user.role === UserRole.MANAGER || user.role === UserRole.SUPERVISOR) {
        return task.department === user.department;
      }
      
      // Staff see only tasks specifically assigned to them
      return task.assignedTo === user.name;
    });
  };

  const filteredTasks = getVisibleTasks().filter(t => filter === 'all' || t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.tasks}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage and track airport ground operations</p>
        </div>
        {(user.role !== UserRole.STAFF) && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus size={20} />
            {t.assignTask}
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'pending', 'in_progress', 'completed', 'blocked'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border
              ${filter === f 
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-black' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'}`}
          >
            {f.toUpperCase().replace('_', ' ')}
          </button>
        ))}
      </div>

      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-1">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase w-fit
                    ${task.priority === 'high' || task.priority === 'critical' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                    {task.priority} Priority
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{task.department}</span>
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canModify(task) && (
                    <>
                      <button onClick={() => handleEdit(task)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(task.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{task.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{task.description}</p>
              
              <div className="space-y-2 mb-4 flex-1">
                <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin size={14} /><span>{task.location}</span></div>
                <div className="flex items-center gap-2 text-xs text-slate-500"><Clock size={14} /><span>{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</span></div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"><UserIcon size={14} /><span>{task.assignedTo}</span></div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    task.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                {canExecute(task) && task.status !== 'completed' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {task.status === 'pending' && (
                      <button 
                        onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                        className="col-span-2 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                      >
                        <Play size={14} /> Start Task
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button 
                        onClick={() => handleStatusUpdate(task.id, 'completed')}
                        className="col-span-2 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                      >
                        <CheckCircle size={14} /> Finish Task
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
           <Briefcase className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={64} />
           <h3 className="text-slate-400 font-bold uppercase tracking-widest">No Visible Tasks</h3>
           <p className="text-slate-400 text-xs mt-1">Tasks for your department or specifically assigned to you will appear here.</p>
        </div>
      )}

      {/* Task Modal (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold dark:text-white">{editingTask ? 'Edit Task' : 'Assign New Task'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Task Title</label>
                <input 
                  type="text" placeholder="e.g. Baggage Unloading EK201" 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Location</label>
                  <input 
                    type="text" placeholder="Gate/Stand" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    value={taskForm.location} onChange={e => setTaskForm({...taskForm, location: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Priority</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value as any})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Assigned To</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}
                >
                  <option value="">Select active staff...</option>
                  {ACTIVE_USERS.map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.department})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Department</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  value={taskForm.department} onChange={e => setTaskForm({...taskForm, department: e.target.value})}
                  disabled={user.role !== UserRole.ADMIN}
                >
                  <option value="Operations">Operations</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Security">Security</option>
                  <option value="Baggage">Baggage</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Description</label>
                <textarea 
                  placeholder="Additional task details..." 
                  className="w-full h-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none dark:text-white resize-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                />
              </div>

              <button 
                onClick={handleSaveTask}
                className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 mt-2 transition-all active:scale-95"
              >
                {editingTask ? 'Save Changes' : 'Assign Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
