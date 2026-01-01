
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { Bell, X, AlertCircle, Info, CheckCircle2, Languages, Copy, Check } from 'lucide-react';
import { geminiService } from './services/gemini';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>([]);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  const [selection, setSelection] = useState<{ text: string, x: number, y: number } | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const translationRef = useRef<HTMLDivElement>(null);

  const [departments, setDepartments] = useState<string[]>(['Operations', 'Maintenance', 'Security', 'Baggage', 'IT', 'Customer Service']);
  const [availableRoles, setAvailableRoles] = useState<string[]>([
    UserRole.STAFF, 
    UserRole.SUPERVISOR, 
    UserRole.MANAGER, 
    UserRole.SAFETY_MANAGER, 
    UserRole.ADMIN
  ]);

  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Ahmed Al-Farsi', username: 'ahmed_ops', role: UserRole.ADMIN, staffId: 'STAFF-EGY-992', avatar: 'https://picsum.photos/seed/staff1/200/200', department: 'Operations', status: 'active', password: 'admin' },
    { id: '2', name: 'Sara Miller', username: 'sara_ground', role: UserRole.STAFF, staffId: 'STAFF-EGY-104', avatar: 'https://picsum.photos/seed/staff2/200/200', department: 'Operations', status: 'active', password: '123', mustChangePassword: true },
    { id: '3', name: 'John Doe', username: 'john_manager', role: UserRole.MANAGER, staffId: 'STAFF-EGY-112', avatar: 'https://picsum.photos/seed/staff3/200/200', department: 'Maintenance', status: 'active', password: '123', mustChangePassword: true }
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: 'T1', title: 'Baggage Loading - EK201', description: 'Manual loading required at Gate A1.', assignedTo: 'Ahmed Al-Farsi', status: 'in_progress', priority: 'high', location: 'Gate A1', createdAt: new Date().toISOString(), department: 'Operations' },
    { id: 'T2', title: 'Fueling Check - QR102', description: 'Standard fueling procedure.', assignedTo: 'John Doe', status: 'pending', priority: 'medium', location: 'Stand 42', createdAt: new Date().toISOString(), department: 'Maintenance' },
  ]);

  const [safetyReports, setSafetyReports] = useState<SafetyReport[]>([
    { id: 'R1', reporterId: '1', type: 'hazard', description: 'Fuel spill near Stand 4', severity: 'high', status: 'open', timestamp: '1h ago' }
  ]);

  const [docs, setDocs] = useState<DocFile[]>([
    { id: 'D1', name: 'Terminal 3 Emergency Manual.pdf', type: 'PDF', uploadedBy: 'Ahmed', date: '2026-05-15' },
    { id: 'D2', name: 'Ramp Safety Protocol v2.1.pdf', type: 'PDF', uploadedBy: 'Manager', date: '2026-05-10' }
  ]);

  const [forumPosts, setForumPosts] = useState<ForumPost[]>([
    {
      id: 'f1',
      authorId: '1',
      authorName: 'Admin',
      title: 'New Safety Protocols for Ramp Operations',
      content: 'Please review the updated guidelines for ramp activities effective June 1st.',
      createdAt: '2 hours ago',
      replies: [
        { id: 'r1', authorName: 'Staff X', content: 'Will there be a training session?', createdAt: '1 hour ago' }
      ]
    }
  ]);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    { id: 'L1', staffId: 'STAFF-EGY-104', staffName: 'Sara Miller', type: 'annual', startDate: '2026-06-01', endDate: '2026-06-15', status: 'pending', reason: 'Vacation' },
    { id: 'L2', staffId: 'STAFF-EGY-112', staffName: 'John Doe', type: 'sick', startDate: '2026-05-20', endDate: '2026-05-22', status: 'approved', reason: 'Medical appointment' }
  ]);

  const t = useMemo(() => TRANSLATIONS[language], [language]);
  const isRTL = language === 'ar';

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `n-${Date.now()}`,
      timestamp: new Date(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    setActiveToast(newNotif);
    setTimeout(() => setActiveToast(current => current?.id === newNotif.id ? null : current), 5000);
  }, []);

  // CRITICAL: Fetch existing messages for the current user from Supabase
  const syncMessageHistory = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured()) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: true });

    if (data) {
      setGlobalMessages(data.map((m: any) => ({
        id: m.id,
        senderId: m.sender_id,
        recipientId: m.recipient_id,
        senderName: m.sender_name,
        text: m.text,
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: m.status || 'sent'
      })));
    }
  }, []);

  // Real-time listener setup
  useEffect(() => {
    if (!currentUser || !isSupabaseConfigured()) return;

    // Load history once
    syncMessageHistory(currentUser.id);

    // Listen for new messages or status updates
    const channel = supabase
      .channel(`user-messages-${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const m = payload.new as any;
          if (m.sender_id === currentUser.id || m.recipient_id === currentUser.id) {
            setGlobalMessages(prev => {
              if (prev.some(msg => msg.id === m.id)) return prev;
              const newMsg: ChatMessage = {
                id: m.id,
                senderId: m.sender_id,
                recipientId: m.recipient_id,
                senderName: m.sender_name,
                text: m.text,
                timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: m.status || 'sent'
              };
              return [...prev, newMsg];
            });

            // Browser notification if we are the recipient
            if (m.recipient_id === currentUser.id) {
              addNotification({
                title: `New message from ${m.sender_name}`,
                message: m.text,
                type: 'forum',
                severity: 'info'
              });
            }
          }
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as any;
          setGlobalMessages(prev => prev.map(m => 
            m.id === updated.id ? { ...m, status: updated.status } : m
          ));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, syncMessageHistory, addNotification]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.mustChangePassword) {
      setNeedsPasswordChange(true);
    } else {
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setNeedsPasswordChange(false);
    setGlobalMessages([]);
  };

  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const handleBroadcast = (message: string) => {
    addNotification({ title: 'BROADCAST', message, type: 'safety', severity: 'urgent' });
  };

  const unreadMessagesCount = useMemo(() => {
    if (!currentUser) return 0;
    return globalMessages.filter(m => m.recipientId === currentUser.id && m.status !== 'read').length;
  }, [globalMessages, currentUser]);

  if (!isLoggedIn && !needsPasswordChange) {
    return <Login users={users} onLogin={handleLogin} language={language} />;
  }

  if (needsPasswordChange) {
    return <ChangePassword onComplete={(p) => { 
      setUsers(prev => prev.map(u => u.id === currentUser?.id ? { ...u, password: p, mustChangePassword: false } : u));
      setCurrentUser(curr => curr ? { ...curr, mustChangePassword: false } : null);
      setNeedsPasswordChange(false);
      setIsLoggedIn(true);
    }} language={language} />;
  }

  return (
    <Router>
      <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-all duration-300 ${isRTL ? 'font-arabic' : ''}`}>
        {currentUser && (
          <Sidebar 
            user={currentUser} 
            language={language} 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            onBroadcast={handleBroadcast}
            unreadChatsCount={unreadMessagesCount}
          />
        )}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {activeToast && (
            <div className={`fixed top-4 right-4 z-[100] w-full max-sm animate-in slide-in-from-right-full duration-300 ${isRTL ? 'right-auto left-4' : 'right-4'}`}>
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
              user={currentUser} 
              language={language} 
              onToggleLanguage={toggleLanguage}
              onToggleSidebar={toggleSidebar}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              notifications={notifications}
              setNotifications={setNotifications}
              onLogout={handleLogout}
            />
          )}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard user={currentUser!} language={language} onToggleTheme={toggleTheme} data={{ tasks, safetyReports, docs, forumPosts, leaveRequests, users }} searchQuery={searchQuery} setLeaveRequests={setLeaveRequests} />} />
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
