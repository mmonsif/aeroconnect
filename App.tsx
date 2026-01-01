
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  
  // Real-time Synced States
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
    setTimeout(() => setActiveToast(current => current?.id === newNotif.id ? null : current), 5000);
  }, []);

  // MASTER DATA SYNC
  const syncAllData = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    // 1. Fetch Users (Staff List)
    const { data: userData } = await supabase.from('users').select('*');
    if (userData) setUsers(userData.map(u => ({
      id: u.id, name: u.name, username: u.username, password: u.password,
      role: u.role as UserRole, staffId: u.staff_id, avatar: u.avatar || `https://picsum.photos/seed/${u.id}/200/200`,
      department: u.department, status: u.status, mustChangePassword: u.must_change_password
    })));

    // 2. Fetch Tasks
    const { data: taskData } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (taskData) setTasks(taskData.map(t => ({
      id: t.id, title: t.title, description: t.description, assignedTo: t.assigned_to,
      status: t.status, priority: t.priority, location: t.location, department: t.department,
      createdAt: t.created_at
    })));

    // 3. Fetch Documents
    const { data: docData } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (docData) setDocs(docData.map(d => ({
      id: d.id, name: d.name, type: d.type, uploadedBy: d.uploaded_by, date: new Date(d.created_at).toISOString().split('T')[0]
    })));

    // 4. Fetch Safety Reports
    const { data: safetyData } = await supabase.from('safety_reports').select('*').order('created_at', { ascending: false });
    if (safetyData) setSafetyReports(safetyData.map(r => ({
      id: r.id, reporterId: r.reporter_id, type: r.type, description: r.description,
      severity: r.severity, status: r.status, aiAnalysis: r.ai_analysis, entities: r.entities,
      timestamp: new Date(r.created_at).toLocaleTimeString()
    })));

    // 5. Fetch Leave Requests
    const { data: leaveData } = await supabase.from('leave_requests').select('*').order('created_at', { ascending: false });
    if (leaveData) setLeaveRequests(leaveData.map(l => ({
      id: l.id, staffId: l.staff_id, staffName: l.staff_name, type: l.type,
      startDate: l.start_date, endDate: l.end_date, status: l.status, reason: l.reason,
      suggestion: l.suggestion, suggestedStartDate: l.suggested_start_date, suggestedEndDate: l.suggested_end_date
    })));

    // 6. Fetch Forum Posts
    const { data: postsData } = await supabase.from('forum_posts').select('*, forum_replies(*)').order('created_at', { ascending: false });
    if (postsData) setForumPosts(postsData.map(p => ({
      id: p.id, authorId: p.author_id, authorName: p.author_name, title: p.title, content: p.content,
      createdAt: new Date(p.created_at).toLocaleTimeString(),
      replies: p.forum_replies?.map((r: any) => ({
        id: r.id, authorName: r.author_name, content: r.content, createdAt: new Date(r.created_at).toLocaleTimeString()
      })) || []
    })));
  }, []);

  // Initial Sync
  useEffect(() => {
    syncAllData();
  }, [syncAllData]);

  // REALTIME SUBSCRIPTIONS
  useEffect(() => {
    if (!currentUser || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel('app-global-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, syncAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, syncAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, syncAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'safety_reports' }, syncAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, syncAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts' }, syncAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_replies' }, syncAllData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const m = payload.new as any;
          if (m.recipient_id === currentUser.id) {
            addNotification({ title: `Message from ${m.sender_name}`, message: m.text, type: 'forum', severity: 'info' });
          }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, syncAllData, addNotification]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.mustChangePassword) { setNeedsPasswordChange(true); } else { setIsLoggedIn(true); }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const handleBroadcast = (message: string) => {
    addNotification({ title: 'BROADCAST', message, type: 'safety', severity: 'urgent' });
  };

  const isRTL = language === 'ar';

  if (!isLoggedIn && !needsPasswordChange) {
    // We need users for the login screen. Fetch them if not loaded.
    if (users.length === 0) {
      syncAllData();
    }
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
      <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-all duration-300 ${isRTL ? 'font-arabic' : ''}`}>
        {currentUser && (
          <Sidebar 
            user={currentUser} language={language} isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} onBroadcast={handleBroadcast}
          />
        )}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {activeToast && (
            <div className="fixed top-4 right-4 z-[100] w-full max-sm animate-in slide-in-from-right-full duration-300">
              <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-4 ${activeToast.severity === 'urgent' ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-900 dark:text-white border-slate-200 dark:border-slate-800'}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{activeToast.title}</p>
                  <p className="text-xs opacity-80">{activeToast.message}</p>
                </div>
                <button onClick={() => setActiveToast(null)}><X size={16} /></button>
              </div>
            </div>
          )}
          {currentUser && (
            <Header 
              user={currentUser} language={language} onToggleLanguage={toggleLanguage}
              onToggleSidebar={toggleSidebar} searchQuery={searchQuery} onSearchChange={setSearchQuery}
              notifications={notifications} setNotifications={setNotifications} onLogout={handleLogout}
            />
          )}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard user={currentUser!} language={language} onToggleTheme={() => {}} data={{ tasks, safetyReports, docs, forumPosts, leaveRequests, users }} searchQuery={searchQuery} setLeaveRequests={setLeaveRequests} />} />
              <Route path="/tasks" element={<TaskBoard user={currentUser!} language={language} tasks={tasks} setTasks={setTasks} />} />
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
