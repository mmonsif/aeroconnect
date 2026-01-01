
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
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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

  const handleSaveUser = async () => {
    if (!form.name || !form.staffId || !form.username || !isSupabaseConfigured()) return;

    if (targetUser && isEditModalOpen) {
      await supabase.from('users').update({
        name: form.name,
        staff_id: form.staffId,
        username: form.username,
        role: form.role,
        department: form.department,
        status: form.status
      }).eq('id', targetUser.id);
    } else {
      await supabase.from('users').insert([{
        name: form.name,
        staff_id: form.staffId,
        username: form.username,
        password: form.password || '123456',
        role: form.role,
        department: form.department,
        status: 'active',
        must_change_password: true
      }]);
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

  const confirmDeleteUser = async () => {
    if (targetUser && isSupabaseConfigured()) {
      await supabase.from('users').delete().eq('id', targetUser.id);
      closeModals();
    }
  };

  const toggleStatus = async (u: User) => {
    if (!isSupabaseConfigured()) return;
    await supabase.from('users').update({ status: u.status === 'active' ? 'inactive' : 'active' }).eq('id', u.id);
  };

  const handleResetPassword = async () => {
    if (targetUser && newPassword.trim() && isSupabaseConfigured()) {
      await supabase.from('users').update({ password: newPassword, must_change_password: true }).eq('id', targetUser.id);
      closeModals();
    }
  };

  const openEdit = (u: User) => {
    setTargetUser(u);
    setForm({ 
      name: u.name, 
      staffId: u.staffId, 
      username: u.username, 
      password: '', 
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
          <p className="text-xs text-slate-500">Manage airport staff accounts</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20">
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
              <tr key={u.id} className={`text-sm dark:text-slate-300 group hover:bg-slate-50/50 transition-colors ${u.status === 'inactive' ? 'opacity-50 grayscale' : ''}`}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} className="w-8 h-8 rounded-lg" alt="" />
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase">{u.staffId}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-medium text-slate-600">@{u.username}</td>
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
                    <button onClick={() => openEdit(u)} className="p-1.5 text-slate-400 hover:text-blue-500"><Edit size={16}/></button>
                    <button onClick={() => { setTargetUser(u); setIsResetModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-orange-500"><Key size={16}/></button>
                    <button onClick={() => toggleStatus(u)} className="p-1.5 text-slate-400 hover:text-emerald-500">
                      {u.status === 'active' ? <Power size={16}/> : <PowerOff size={16}/>}
                    </button>
                    <button onClick={() => { setTargetUser(u); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
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
              <input placeholder="Full Name" className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white border" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input placeholder="Staff ID" className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border" value={form.staffId} onChange={e => setForm({...form, staffId: e.target.value})} />
              <input placeholder="Username" className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
              {!targetUser && <input type="password" placeholder="Initial Password" className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />}
              <div className="grid grid-cols-2 gap-4">
                <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={closeModals} className="flex-1 py-3 text-slate-500 font-bold">Cancel</button>
                <button onClick={handleSaveUser} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isResetModalOpen && targetUser && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-bold dark:text-white mb-4">Reset Password</h2>
            <div className="space-y-4">
              <input type="password" placeholder="New Password" className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white border" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <div className="flex gap-2 pt-2">
                <button onClick={closeModals} className="flex-1 py-3 text-slate-500 font-bold">Cancel</button>
                <button onClick={handleResetPassword} className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg">Update</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && targetUser && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 text-center">
            <h2 className="text-xl font-bold dark:text-white mb-6">Delete User @{targetUser.username}?</h2>
            <div className="flex gap-2">
              <button onClick={closeModals} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
              <button onClick={confirmDeleteUser} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg">Delete</button>
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
    const coreRoles = [UserRole.ADMIN, UserRole.STAFF, UserRole.MANAGER];
    if (coreRoles.includes(role as any)) {
      alert("Cannot remove system-critical roles.");
      return;
    }
    setRoles(roles.filter(r => r !== role));
  };

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="space-y-6">
        <h3 className="text-xl font-bold dark:text-white">Departments</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="New Department" 
            className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border text-sm dark:text-white"
            value={newDept}
            onChange={e => setNewDept(e.target.value)}
          />
          <button onClick={addDept} className="p-3 bg-slate-900 text-white rounded-xl"><Plus size={20}/></button>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {departments.map(dept => (
            <div key={dept} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 rounded-2xl">
              <span className="text-sm font-bold dark:text-slate-300">{dept}</span>
              <button onClick={() => removeDept(dept)} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold dark:text-white">Designations</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="New Role" 
            className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border text-sm dark:text-white"
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
          />
          <button onClick={addRole} className="p-3 bg-slate-900 text-white rounded-xl"><Plus size={20}/></button>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {roles.map(role => (
            <div key={role} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 rounded-2xl">
              <span className="text-sm font-bold dark:text-slate-300 capitalize">{role}</span>
              {!([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] as any).includes(role) && (
                <button onClick={() => removeRole(role)} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
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

  const handleStatusUpdate = async (req: LeaveRequest, status: 'approved' | 'rejected') => {
    if (!isSupabaseConfigured()) return;
    await supabase.from('leave_requests').update({ status }).eq('id', req.id);
  };

  const handleSuggestClick = (req: LeaveRequest) => {
    setActiveSuggestionReq(req);
    setSuggestionDates({ start: req.startDate, end: req.endDate, note: '' });
  };

  const submitSuggestion = async () => {
    if (!suggestionDates.start || !suggestionDates.end || !activeSuggestionReq || !isSupabaseConfigured()) return;
    await supabase.from('leave_requests').update({ 
      status: 'suggestion_sent', 
      suggested_start_date: suggestionDates.start,
      suggested_end_date: suggestionDates.end,
      suggestion: suggestionDates.note 
    }).eq('id', activeSuggestionReq.id);
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
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-center">
              {r.status === 'pending' && (
                <>
                  <button onClick={() => handleSuggestClick(r)} className="px-3 py-2 text-orange-600 hover:bg-orange-50 rounded-xl text-xs font-bold transition-all">Suggest Dates</button>
                  <button onClick={() => handleStatusUpdate(r, 'rejected')} className="px-3 py-2 text-red-600 font-bold text-xs hover:bg-red-50 rounded-xl">Reject</button>
                  <button onClick={() => handleStatusUpdate(r, 'approved')} className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20">Approve</button>
                </>
              )}
              {r.status === 'suggestion_sent' && <span className="text-[10px] font-bold text-slate-400 uppercase italic">Awaiting staff response...</span>}
              {r.status === 'approved' && <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Approved</span>}
              {r.status === 'rejected' && <span className="px-4 py-1.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Rejected</span>}
            </div>
          </div>
        )) : (
          <div className="py-20 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium">No pending staff leave requests</p>
          </div>
        )}
      </div>

      {activeSuggestionReq && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold dark:text-white mb-6">Suggest Alternative Dates</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none dark:text-white text-xs" value={suggestionDates.start} onChange={e => setSuggestionDates({...suggestionDates, start: e.target.value})} />
                <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none dark:text-white text-xs" value={suggestionDates.end} onChange={e => setSuggestionDates({...suggestionDates, end: e.target.value})} />
              </div>
              <textarea placeholder="Reason for change..." className="w-full h-24 bg-slate-50 dark:bg-slate-800 p-3 border rounded-xl outline-none dark:text-white text-xs resize-none" value={suggestionDates.note} onChange={e => setSuggestionDates({...suggestionDates, note: e.target.value})} />
              <div className="flex gap-2 pt-2">
                <button onClick={() => setActiveSuggestionReq(null)} className="flex-1 py-3 text-slate-500 font-bold">Cancel</button>
                <button onClick={submitSuggestion} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg">Send offer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SafetyReview = ({ reports, setReports }: { reports: SafetyReport[], setReports: any }) => {
  const updateStatus = async (id: string, status: SafetyReport['status']) => {
    if (!isSupabaseConfigured()) return;
    await supabase.from('safety_reports').update({ status }).eq('id', id);
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
