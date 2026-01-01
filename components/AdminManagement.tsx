
import React, { useState } from 'react';
import { User, Language, UserRole, LeaveRequest, DocFile, SafetyReport, Task } from '../types';
import { TRANSLATIONS } from '../constants';
import { useLocation } from 'react-router-dom';
import { 
  Users as UsersIcon, 
  Calendar, 
  ShieldCheck, 
  Check, 
  Plus, 
  Clock,
  Edit,
  Trash2,
  MessageSquareReply,
  Key, 
  Power,
  PowerOff,
  UserPlus,
  AlertTriangle,
  Lock,
  X,
  Briefcase,
  Layers,
  ChevronRight,
  ShieldPlus
} from 'lucide-react';

interface AdminManagementProps {
  user: User;
  language: Language;
  data: {
    tasks: Task[];
    safetyReports: SafetyReport[];
    docs: DocFile[];
    leaveRequests: LeaveRequest[];
    users: User[];
    departments: string[];
    roles: string[];
  };
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setSafetyReports: React.Dispatch<React.SetStateAction<SafetyReport[]>>;
  setDocs: React.Dispatch<React.SetStateAction<DocFile[]>>;
  setDepartments: React.Dispatch<React.SetStateAction<string[]>>;
  setRoles: React.Dispatch<React.SetStateAction<string[]>>;
}

const AdminManagement: React.FC<AdminManagementProps> = ({ 
  user, 
  language, 
  data, 
  setLeaveRequests, 
  setUsers, 
  setSafetyReports, 
  setDocs,
  setDepartments,
  setRoles
}) => {
  const t = TRANSLATIONS[language];
  const query = new URLSearchParams(useLocation().search);
  const [activeTab, setActiveTab] = useState(query.get('tab') || 'users');

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black dark:text-white tracking-tighter uppercase">{t.admin}</h1>
      </div>
      
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit">
        {[
          { id: 'users', label: t.userManagement, icon: <UsersIcon size={16}/> },
          { id: 'leave', label: t.leaveRequests, icon: <Calendar size={16}/> },
          { id: 'safety', label: t.safetyReview, icon: <ShieldCheck size={16}/> },
          { id: 'org', label: 'Organization', icon: <Layers size={16}/> },
        ].map(tab => (
          <button
            key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm min-h-[400px]">
        {activeTab === 'users' && <UserManagement users={data.users} setUsers={setUsers} departments={data.departments} roles={data.roles} isAdmin={user.role === UserRole.ADMIN} />}
        {activeTab === 'leave' && <LeaveManagementForm currentUser={user} requests={data.leaveRequests} setRequests={setLeaveRequests} language={language} />}
        {activeTab === 'safety' && <SafetyReview reports={data.safetyReports} setReports={setSafetyReports} />}
        {activeTab === 'org' && <OrgStructureManagement departments={data.departments} roles={data.roles} setDepartments={setDepartments} setRoles={setRoles} />}
      </div>
    </div>
  );
};

const UserManagement = ({ users, setUsers, departments, roles, isAdmin }: { users: User[], setUsers: any, departments: string[], roles: string[], isAdmin: boolean }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  
  const [form, setForm] = useState({ 
    name: '', 
    staffId: '', 
    username: '', 
    password: '', 
    role: UserRole.STAFF as string, 
    department: departments[0] || 'Operations',
    status: 'active' as 'active' | 'inactive'
  });

  const [newPassword, setNewPassword] = useState('');

  const handleSaveUser = () => {
    if (!form.name || !form.staffId || !form.username) {
      alert("Please fill in required fields.");
      return;
    }
    if (targetUser && isEditModalOpen) {
      setUsers((prev: User[]) => prev.map(u => u.id === targetUser.id ? { ...u, ...form } : u));
    } else {
      const newUser: User = { 
        ...form, 
        id: Date.now().toString(), 
        avatar: `https://picsum.photos/seed/${form.staffId}/200/200`,
        mustChangePassword: true,
        role: form.role as UserRole
      };
      setUsers((prev: User[]) => [...prev, newUser]);
    }
    closeModals();
  };

  const closeModals = () => {
    setIsEditModalOpen(false);
    setIsResetModalOpen(false);
    setIsDeleteModalOpen(false);
    setTargetUser(null);
    setNewPassword('');
    setForm({ name: '', staffId: '', username: '', password: '', role: UserRole.STAFF, department: departments[0] || 'Operations', status: 'active' });
  };

  const confirmDeleteUser = () => {
    if (targetUser) {
      setUsers((prev: User[]) => prev.filter(u => u.id !== targetUser.id));
      closeModals();
    }
  };

  const toggleStatus = (u: User) => {
    setUsers((prev: User[]) => prev.map(user => 
      user.id === u.id ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' } : user
    ));
  };

  const handleResetPassword = () => {
    if (targetUser && newPassword.trim()) {
      setUsers((prev: User[]) => prev.map(user => 
        user.id === targetUser.id ? { ...user, password: newPassword, mustChangePassword: true } : user
      ));
      alert(`Password for @${targetUser.username} has been updated.`);
      closeModals();
    }
  };

  const openEdit = (u: User) => {
    setTargetUser(u);
    setForm({ 
      name: u.name, 
      staffId: u.staffId, 
      username: u.username, 
      password: u.password || '', 
      role: u.role, 
      department: u.department,
      status: u.status
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold dark:text-white">System Users</h3>
          <p className="text-xs text-slate-500">Manage airport staff accounts and credentials</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
            <UserPlus size={16}/> Add New User
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left rtl:text-right">
          <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <tr>
              <th className="p-4">Staff Member</th>
              <th className="p-4">Username</th>
              <th className="p-4">Role</th>
              <th className="p-4">Dept</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map(u => (
              <tr key={u.id} className={`text-sm dark:text-slate-300 group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${u.status === 'inactive' ? 'opacity-50 grayscale' : ''}`}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} className="w-8 h-8 rounded-lg" alt="" />
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase">{u.staffId}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-medium text-slate-600 dark:text-slate-400">@{u.username}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${u.role === UserRole.ADMIN ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{u.role}</span>
                </td>
                <td className="p-4 text-xs font-medium text-slate-500">{u.department}</td>
                <td className="p-4">
                  <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${u.status === 'active' ? 'text-emerald-500' : 'text-slate-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {u.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)} title="Edit Details" className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"><Edit size={16}/></button>
                    <button onClick={() => { setTargetUser(u); setIsResetModalOpen(true); }} title="Reset Password" className="p-1.5 text-slate-400 hover:text-orange-500 transition-colors"><Key size={16}/></button>
                    <button onClick={() => toggleStatus(u)} title={u.status === 'active' ? 'Deactivate Account' : 'Activate Account'} className={`p-1.5 transition-colors ${u.status === 'active' ? 'text-slate-400 hover:text-red-500' : 'text-emerald-500 hover:text-emerald-600'}`}>
                      {u.status === 'active' ? <Power size={16}/> : <PowerOff size={16}/>}
                    </button>
                    <button onClick={() => { setTargetUser(u); setIsDeleteModalOpen(true); }} title="Delete User" className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-bold dark:text-white mb-6">{targetUser ? 'Edit System Account' : 'Create New Account'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Full Name</label>
                  <input placeholder="Ahmed Al..." className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Staff ID</label>
                  <input placeholder="EGY-123" className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white border border-slate-200 dark:border-slate-700" value={form.staffId} onChange={e => setForm({...form, staffId: e.target.value})} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Username</label>
                  <input placeholder="user_ground" className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white border border-slate-200 dark:border-slate-700" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Initial Password</label>
                  <input type="password" placeholder="••••••••" className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white border border-slate-200 dark:border-slate-700" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Account Role</label>
                  <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white border border-slate-200 dark:border-slate-700" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    {roles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Department</label>
                  <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl outline-none dark:text-white focus:ring-2 focus:ring-blue-500" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button onClick={closeModals} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                <button onClick={handleSaveUser} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
                  {targetUser ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isResetModalOpen && targetUser && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4 text-orange-500">
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl"><Key size={24}/></div>
              <h2 className="text-xl font-bold dark:text-white">Reset Password</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">Set a new secure password for @{targetUser.username}.</p>
            <div className="space-y-4">
              <input type="password" placeholder="New Password" className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white border" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <div className="flex gap-2 pt-2">
                <button onClick={closeModals} className="flex-1 py-3 text-slate-500 font-bold">Cancel</button>
                <button onClick={handleResetPassword} className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20">Update</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && targetUser && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 text-center">
            <div className="mx-auto p-4 bg-red-50 text-red-600 rounded-full w-fit mb-4"><AlertTriangle size={32}/></div>
            <h2 className="text-xl font-bold dark:text-white mb-2">Delete User?</h2>
            <div className="flex gap-2 mt-6">
              <button onClick={closeModals} className="flex-1 py-3 bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={confirmDeleteUser} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OrgStructureManagement = ({ departments, roles, setDepartments, setRoles }: { departments: string[], roles: string[], setDepartments: any, setRoles: any }) => {
  const [newDept, setNewDept] = useState('');
  const [newRole, setNewRole] = useState('');

  const addDept = () => {
    if (newDept.trim() && !departments.includes(newDept)) {
      setDepartments([...departments, newDept.trim()]);
      setNewDept('');
    }
  };

  const addRole = () => {
    if (newRole.trim() && !roles.includes(newRole)) {
      setRoles([...roles, newRole.trim()]);
      setNewRole('');
    }
  };

  const removeDept = (dept: string) => {
    if (departments.length > 1) {
      setDepartments(departments.filter(d => d !== dept));
    }
  };

  const removeRole = (role: string) => {
    // Prevent removing core roles
    const coreRoles = [UserRole.ADMIN, UserRole.STAFF, UserRole.MANAGER];
    if (coreRoles.includes(role as any)) {
      alert("Cannot remove system-critical roles.");
      return;
    }
    setRoles(roles.filter(r => r !== role));
  };

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl"><Briefcase size={24}/></div>
          <div>
            <h3 className="text-xl font-bold dark:text-white">Departments</h3>
            <p className="text-xs text-slate-500">Configure organizational hubs</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="New Department Name" 
            className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
            value={newDept}
            onChange={e => setNewDept(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addDept()}
          />
          <button onClick={addDept} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-colors"><Plus size={20}/></button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {departments.map(dept => (
            <div key={dept} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl group hover:border-indigo-500 transition-all">
              <span className="text-sm font-bold dark:text-slate-300">{dept}</span>
              <button onClick={() => removeDept(dept)} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl"><ShieldPlus size={24}/></div>
          <div>
            <h3 className="text-xl font-bold dark:text-white">Designations & Roles</h3>
            <p className="text-xs text-slate-500">Define operational permissions</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="New Designation" 
            className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-slate-200 dark:border-slate-800 text-sm dark:text-white"
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRole()}
          />
          <button onClick={addRole} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-purple-600 transition-colors"><Plus size={20}/></button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {roles.map(role => (
            <div key={role} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl group hover:border-purple-500 transition-all">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold dark:text-slate-300 capitalize">{role}</span>
                {[UserRole.ADMIN, UserRole.MANAGER].includes(role as any) && (
                  <span className="text-[8px] font-black uppercase text-blue-500 border border-blue-500/20 px-1 py-0.5 rounded">Core Logic</span>
                )}
              </div>
              {!([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] as any).includes(role) && (
                <button onClick={() => removeRole(role)} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LeaveManagementForm = ({ currentUser, requests, setRequests, language }: { currentUser: User, requests: LeaveRequest[], setRequests: any, language: Language }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suggestion_sent'>('all');
  const [activeSuggestionReq, setActiveSuggestionReq] = useState<LeaveRequest | null>(null);
  const [suggestionDates, setSuggestionDates] = useState({ start: '', end: '', note: '' });

  const handleStatusUpdate = (req: LeaveRequest, status: 'approved' | 'rejected') => {
    setRequests((prev: LeaveRequest[]) => prev.map(r => r.id === req.id ? { ...r, status } : r));
  };

  const handleSuggestClick = (req: LeaveRequest) => {
    setActiveSuggestionReq(req);
    setSuggestionDates({ start: req.startDate, end: req.endDate, note: '' });
  };

  const submitSuggestion = () => {
    if (!suggestionDates.start || !suggestionDates.end) {
      alert("Please specify alternative dates.");
      return;
    }
    setRequests((prev: LeaveRequest[]) => prev.map(r => 
      r.id === activeSuggestionReq?.id ? { 
        ...r, 
        status: 'suggestion_sent', 
        suggestedStartDate: suggestionDates.start,
        suggestedEndDate: suggestionDates.end,
        suggestion: suggestionDates.note 
      } : r
    ));
    setActiveSuggestionReq(null);
  };

  const filteredRequests = requests.filter(r => {
    const isNotMe = r.staffId !== currentUser.staffId;
    const matchesFilter = filter === 'all' || r.status === filter;
    return isNotMe && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-6 border-b border-slate-100 dark:border-slate-800 w-full overflow-x-auto">
          {(['all', 'pending', 'approved', 'rejected', 'suggestion_sent'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`pb-3 px-1 text-sm font-bold relative transition-all whitespace-nowrap ${filter === f ? 'text-blue-600' : 'text-slate-400'}`}>
              {f.replace('_', ' ').toUpperCase()}
              {filter === f && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredRequests.length > 0 ? filteredRequests.map(r => (
          <div key={r.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl gap-6 flex flex-col md:flex-row md:items-center justify-between shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-bold text-slate-500 uppercase shrink-0">{r.staffName.charAt(0)}</div>
              <div>
                <p className="font-bold dark:text-white">{r.staffName}</p>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1 font-medium"><Clock size={12}/> {r.startDate} to {r.endDate}</span>
                  <span className="font-bold uppercase tracking-widest text-blue-500">{r.type}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 italic line-clamp-2">"{r.reason}"</p>
                {r.status === 'suggestion_sent' && r.suggestedStartDate && (
                  <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-800/30">
                    <p className="text-[10px] text-orange-600 dark:text-orange-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1"><MessageSquareReply size={10}/> Counter-offer Sent</p>
                    <p className="text-[10px] font-bold text-orange-800 dark:text-orange-200">{r.suggestedStartDate} to {r.suggestedEndDate}</p>
                    {r.suggestion && <p className="text-[10px] text-orange-700 dark:text-orange-300 italic mt-1">{r.suggestion}</p>}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-center">
              {r.status === 'pending' && (
                <>
                  <button onClick={() => handleSuggestClick(r)} className="px-3 py-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded-xl text-xs font-bold transition-all">Suggest Dates</button>
                  <button onClick={() => handleStatusUpdate(r, 'rejected')} className="px-3 py-2 text-red-600 font-bold text-xs hover:bg-red-50 rounded-xl">Reject</button>
                  <button onClick={() => handleStatusUpdate(r, 'approved')} className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20">Approve</button>
                </>
              )}
              {r.status === 'suggestion_sent' && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase italic">Awaiting staff response...</span>
                  <button onClick={() => handleStatusUpdate(r, 'rejected')} className="px-3 py-2 text-red-600 font-bold text-xs hover:bg-red-50 rounded-xl">Reject (Cancel Offer)</button>
                </div>
              )}
              {r.status === 'approved' && <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Approved</span>}
              {r.status === 'rejected' && <span className="px-4 py-1.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Rejected</span>}
            </div>
          </div>
        )) : (
          <div className="py-20 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Calendar className="mx-auto mb-2 opacity-20" size={40} />
            <p className="text-sm font-medium">No pending staff leave requests</p>
          </div>
        )}
      </div>

      {activeSuggestionReq && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white">Suggest Alternative Dates</h3>
              <button onClick={() => setActiveSuggestionReq(null)}><X className="text-slate-400" /></button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-4">
                <p className="text-[10px] font-black uppercase text-blue-500 mb-1">Original Request</p>
                <p className="text-xs font-bold dark:text-white">{activeSuggestionReq.startDate} to {activeSuggestionReq.endDate}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Suggested Start</label>
                  <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none dark:text-white text-xs" value={suggestionDates.start} onChange={e => setSuggestionDates({...suggestionDates, start: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Suggested End</label>
                  <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none dark:text-white text-xs" value={suggestionDates.end} onChange={e => setSuggestionDates({...suggestionDates, end: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Message to Staff</label>
                <textarea placeholder="Reason for change..." className="w-full h-24 bg-slate-50 dark:bg-slate-800 p-3 border rounded-xl outline-none dark:text-white text-xs resize-none" value={suggestionDates.note} onChange={e => setSuggestionDates({...suggestionDates, note: e.target.value})} />
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setActiveSuggestionReq(null)} className="flex-1 py-3 text-slate-500 font-bold">Cancel</button>
                <button onClick={submitSuggestion} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700">Send Counter-offer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SafetyReview = ({ reports, setReports }: { reports: SafetyReport[], setReports: any }) => {
  const updateStatus = (id: string, status: SafetyReport['status']) => {
    setReports((prev: SafetyReport[]) => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  return (
    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      {reports.length > 0 ? reports.map(rep => (
        <div key={rep.id} className={`p-5 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-3 bg-white dark:bg-slate-900 shadow-sm transition-opacity ${rep.status === 'resolved' ? 'opacity-60' : ''}`}>
          <div className="flex justify-between items-start">
            <div className="flex gap-2 items-center">
              <span className={`px-2 py-1 text-[10px] font-bold rounded-lg uppercase ${rep.severity === 'high' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                {rep.severity} SEVERITY
              </span>
              <span className={`px-2 py-1 text-[10px] font-bold rounded-lg uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}>
                {rep.status}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">{rep.timestamp}</span>
          </div>
          <p className="font-bold dark:text-white leading-snug">{rep.description}</p>
          
          {rep.status !== 'resolved' && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
              {rep.status === 'open' && (
                <button 
                  onClick={() => updateStatus(rep.id, 'investigating')}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                  Investigate
                </button>
              )}
              <button 
                onClick={() => updateStatus(rep.id, 'resolved')}
                className="flex-1 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                Mark Resolved
              </button>
            </div>
          )}
        </div>
      )) : (
        <div className="py-20 text-center text-slate-400">No open safety reports in the queue.</div>
      )}
    </div>
  );
};

export default AdminManagement;
