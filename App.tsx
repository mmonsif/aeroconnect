
import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Changed import from react-router-dom to react-router to resolve missing export errors
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router';
import { UserRole, Language, User, Task, SafetyReport, DocFile, ForumPost, LeaveRequest, AppNotification, ChatMessage } from './types';
import { TRANSLATIONS } from './constants';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import SafetyBoard from './components/SafetyBoard';
import ChatRoom from './components/ChatRoom';
import ForumBoard from './components/ForumBoard';
import AdminManagement from './components/AdminManagement';
import ManualsBoard from './components/ManualsBoard';
import MyLeaveBoard from './components/MyLeaveBoard';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';
import { X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';

// Use a valid UUID format for broadcasts. 
// Note: This user MUST exist in your "users" table to satisfy foreign key constraints.
const BROADCAST_ID = '00000000-0000-0000-0000-000000000000';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  
  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [safetyReports, setSafetyReports] = useState<SafetyReport[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  const [departments, setDepartments] = useState<string[]>(['Operations', 'Maintenance', 'Security', 'Baggage', 'IT', 'Customer Service']);
  const [availableRoles, setAvailableRoles] = useState<string[]>([
    UserRole.STAFF, UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.SAFETY_MANAGER, UserRole.ADMIN
  ]);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: AppNotification = { ...notif, id: `n-${Date.now()}`, timestamp: new Date(), isRead: false };
    setNotifications(prev => [newNotif, ...prev]);
    setActiveToast(newNotif);
    setTimeout(() => setActiveToast(current => current?.id === newNotif.id ? null : current), 8000);
  }, []);

  const syncAllData = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const [
        { data: userData },
        { data: taskData },
        { data: docData },
        { data: safetyData },
        { data: leaveData },
        { data: postsData },
        { data: messageData }
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('documents').select('*').order('created_at', { ascending: false }),
        supabase.from('safety_reports').select('*').order('created_at', { ascending: false }),
        supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('forum_posts').select('*, forum_replies(*)').order('created_at', { ascending: false }),
        supabase.from('messages').select('*').order('created_at', { ascending: true })
      ]);

      if (userData) setUsers(userData.map(u => ({
        id: u.id, name: u.name, username: u.username, password: u.password,
        role: u.role as UserRole, staffId: u.staff_id, avatar: u.avatar || `https://picsum.photos/seed/${u.id}/200/200`,
        department: u.department, status: u.status, mustChangePassword: u.must_change_password,
        managerId: u.manager_id
      })));

      if (taskData) setTasks(taskData.map(t => ({
        id: t.id, title: t.title, description: t.description || '', assignedTo: t.assigned_to || 'Unassigned',
        status: t.status, priority: t.priority, location: t.location || 'N/A', department: t.department || 'General',
        createdAt: t.created_at
      })));

      if (docData) setDocs(docData.map(d => ({
        id: d.id, name: d.name, type: d.type, uploadedBy: d.uploaded_by, date: new Date(d.created_at).toISOString().split('T')[0]
      })));

      if (safetyData) setSafetyReports(safetyData.map(r => ({
        id: r.id, reporterId: r.reporter_id, type: r.type, description: r.description,
        severity: r.severity, status: r.status, aiAnalysis: r.ai_analysis, entities: r.entities,
        timestamp: new Date(r.created_at).toLocaleString()
      })));

      if (leaveData) setLeaveRequests(leaveData.map(l => ({
        id: l.id, staffId: l.staff_id, staffName: l.staff_name, type: l.type,
        startDate: l.start_date, endDate: l.end_date, status: l.status, reason: l.reason,
        suggestion: l.suggestion, suggestedStartDate: l.suggested_start_date, suggestedEndDate: l.suggested_end_date
      })));

      if (postsData) setForumPosts(postsData.map(p => ({
        id: p.id, authorId: p.author_id, authorName: p.author_name, title: p.title, content: p.content,
        createdAt: new Date(p.created_at).toLocaleString(),
        replies: (p.forum_replies || []).map((r: any) => ({
          id: r.id, post_id: r.post_id, author_name: r.author_name, content: r.content, createdAt: new Date(r.created_at).toLocaleString()
        }))
      })));

      if (messageData) setGlobalMessages(messageData.map(m => ({
        id: m.id, senderId: m.sender_id, recipientId: m.recipient_id, senderName: m.sender_name,
        text: m.text, status: m.status, timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    } catch (err) {
      console.warn("Operational data sync incomplete. Check Supabase schema.", err);
    }
  }, []);

  useEffect(() => {
    syncAllData();
  }, [syncAllData]);

  useEffect(() => {
    if (!currentUser || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel('full-app-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const m = payload.new as any;
            if (m.sender_id === currentUser.id) return;
            if (m.recipient_id === currentUser.id || m.recipient_id === BROADCAST_ID) {
              const isEmergency = m.recipient_id === BROADCAST_ID;
              addNotification({ 
                title: isEmergency ? "🚨 EMERGENCY BROADCAST" : "New Secure Message", 
                message: m.text, 
                type: isEmergency ? 'safety' : 'forum', 
                severity: isEmergency ? 'urgent' : 'info' 
              });
            }
          }
          syncAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_replies' }, () => {
        syncAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'safety_reports' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const r = payload.new as any;
            if (r.reporter_id === currentUser.id) return;
            if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SAFETY_MANAGER || currentUser.role === UserRole.MANAGER) {
              addNotification({
                title: "Safety Intelligence Alert",
                message: `New hazard reported: ${r.description.substring(0, 40)}...`,
                type: 'safety',
                severity: r.severity === 'high' ? 'urgent' : 'info'
              });
            }
          }
          syncAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const p = payload.new as any;
            if (p.author_id === currentUser.id) return;
            addNotification({
              title: "Forum Update",
              message: `${p.author_name} posted: ${p.title}`,
              type: 'forum',
              severity: 'info'
            });
          }
          syncAllData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'documents' }, (payload) => {
          const d = payload.new as any;
          if (d.uploaded_by === currentUser.name) return;
          addNotification({
            title: "Manual Updated",
            message: `${d.name} is now available in the portal.`,
            type: 'doc',
            severity: 'info'
          });
          syncAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const t = payload.new as any;
            if (t.assigned_to === currentUser.name) {
              addNotification({
                title: "New Duty Assignment",
                message: `Assigned: ${t.title}`,
                type: 'task',
                severity: t.priority === 'critical' ? 'urgent' : 'info'
              });
            }
          } else if (payload.eventType === 'UPDATE') {
             const t = payload.new as any;
             if (t.assigned_to === currentUser.name && (t.status === 'in_progress' || t.status === 'completed')) {
                addNotification({
                  title: `Task Synchronized`,
                  message: `Task "${t.title}" is now ${t.status.replace('_', ' ')}`,
                  type: 'task',
                  severity: 'info'
                });
             }
          }
          syncAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, (payload) => {
          const l = payload.new as any;
          if (payload.eventType === 'INSERT') {
            if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER) {
              addNotification({
                title: "New Leave Request",
                message: `${l.staff_name} submitted a request.`,
                type: 'leave',
                severity: 'info'
              });
            }
          } else if (payload.eventType === 'UPDATE') {
             if (l.staff_id === currentUser.staffId) {
               addNotification({
                 title: "Leave Status Updated",
                 message: `Your request has been ${l.status}.`,
                 type: 'leave',
                 severity: l.status === 'approved' ? 'info' : 'urgent'
               });
             }
          }
          syncAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, syncAllData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, syncAllData, addNotification]);

  const unreadChatsCount = useMemo(() => {
    if (!currentUser) return 0;
    return globalMessages.filter(m => m.recipientId === currentUser.id && m.status !== 'read').length;
  }, [globalMessages, currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.mustChangePassword) { setNeedsPasswordChange(true); } else { setIsLoggedIn(true); }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

  const handleBroadcast = useCallback(async (message: string) => {
    if (!currentUser || !isSupabaseConfigured()) return;
    try {
      const { error } = await supabase.from('messages').insert([{
        sender_id: currentUser.id,
        recipient_id: BROADCAST_ID,
        sender_name: currentUser.name,
        text: message,
        status: 'sent'
      }]);
      
      if (error) {
        throw error;
      }
      
      addNotification({
        title: "Broadcast Sent",
        message: "Your emergency alert has been transmitted to all personnel.",
        type: 'safety',
        severity: 'info'
      });
    } catch (err: any) {
      console.error("Broadcast failed:", err);
      let userFriendlyMessage = err?.message || String(err);
      
      if (userFriendlyMessage.includes("foreign key constraint")) {
        userFriendlyMessage = "The broadcast account does not exist in your database. Please run the SQL setup script in lib/supabase.ts to create the SYSTEM BROADCAST user.";
      }
      
      alert(`System failed to transmit broadcast:\n\n${userFriendlyMessage}`);
    }
  }, [currentUser, addNotification]);

  if (!isLoggedIn && !needsPasswordChange) {
    return <Login users={users} onLogin={handleLogin} language={language} />;
  }

  if (needsPasswordChange) {
    return <ChangePassword onComplete={async (p) => { 
      if (currentUser) {
        await supabase.from('users').update({ password: p, must_change_password: false }).eq('id', currentUser.id);
        setCurrentUser(curr => curr ? { ...curr, mustChangePassword: false } : null);
        setNeedsPasswordChange(false);
        setIsLoggedIn(true);
      }
    }} language={language} />;
  }

  return (
    <Router>
      <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-all duration-300 ${language === 'ar' ? 'font-arabic' : ''}`}>
        {currentUser && (
          <Sidebar 
            user={currentUser} language={language} isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} onBroadcast={handleBroadcast}
            unreadChatsCount={unreadChatsCount}
          />
        )}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {activeToast && (
            <div className="fixed top-4 right-4 z-[100] w-[320px] animate-in slide-in-from-right-full">
              <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-4 ${activeToast.severity === 'urgent' ? 'bg-red-600 text-white pulse-red' : 'bg-white dark:bg-slate-900 dark:text-white border-slate-200 dark:border-slate-800'}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[10px] uppercase tracking-widest opacity-70">{activeToast.title}</p>
                  <p className="text-xs font-bold mt-0.5 line-clamp-2">{activeToast.message}</p>
                </div>
                <button onClick={() => setActiveToast(null)}><X size={16} /></button>
              </div>
            </div>
          )}
          {currentUser && (
            <Header 
              user={currentUser} language={language} onToggleLanguage={() => setLanguage(l => l === 'en' ? 'ar' : 'en')}
              onToggleSidebar={toggleSidebar} searchQuery={searchQuery} onSearchChange={setSearchQuery}
              notifications={notifications} setNotifications={setNotifications} onLogout={handleLogout}
            />
          )}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard user={currentUser!} language={language} onToggleTheme={() => {}} data={{ tasks, safetyReports, docs, forumPosts, leaveRequests, users }} searchQuery={searchQuery} setLeaveRequests={setLeaveRequests} />} />
              <Route path="/tasks" element={<TaskBoard user={currentUser!} language={language} tasks={tasks} setTasks={setTasks} users={users} />} />
              <Route path="/safety" element={<SafetyBoard user={currentUser!} language={language} reports={safetyReports} setReports={setSafetyReports} />} />
              <Route path="/forum" element={<ForumBoard user={currentUser!} language={language} posts={forumPosts} setPosts={setForumPosts} />} />
              <Route path="/messages" element={<ChatRoom user={currentUser!} language={language} users={users} globalMessages={globalMessages} setGlobalMessages={setGlobalMessages} />} />
              <Route path="/manuals" element={<ManualsBoard user={currentUser!} language={language} docs={docs} setDocs={setDocs} />} />
              <Route path="/my-leave" element={<MyLeaveBoard user={currentUser!} language={language} requests={leaveRequests} setRequests={setLeaveRequests} />} />
              <Route path="/admin" element={<AdminManagement user={currentUser!} language={language} data={{ tasks, safetyReports, docs, leaveRequests, users, departments, roles: availableRoles }} setLeaveRequests={setLeaveRequests} setUsers={setUsers} setSafetyReports={setSafetyReports} setDocs={setDocs} setDepartments={setDepartments} setRoles={setAvailableRoles} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
