
import React, { useState, useRef, useEffect } from 'react';
import { User, Language, AppNotification, Task, SafetyReport, DocFile, LeaveRequest } from '../types';
import { TRANSLATIONS } from '../constants';
import { Bell, Search, Languages, Menu, Check, Trash2, Clock, LogOut, FileText, Users, ClipboardList, AlertTriangle, Calendar } from 'lucide-react';
// Changed import from react-router-dom to react-router to resolve missing export errors
import { useNavigate } from 'react-router';

interface SearchResults {
  tasks: Task[];
  docs: DocFile[];
  staff: User[];
  leave: LeaveRequest[];
  reports: SafetyReport[];
}

interface HeaderProps {
  user: User;
  language: Language;
  onToggleLanguage: () => void;
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  onLogout: () => void;
  searchResults: SearchResults | null;
}

const Header: React.FC<HeaderProps> = ({
  user,
  language,
  onToggleLanguage,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  notifications,
  setNotifications,
  onLogout,
  searchResults
}) => {
  const t = TRANSLATIONS[language];
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification.id);
    setShowNotifications(false);

    // Navigate based on notification type
    switch (notification.type) {
      case 'task':
        navigate('/tasks');
        break;
      case 'safety':
        navigate('/safety');
        break;
      case 'doc':
        navigate('/manuals');
        break;
      case 'leave':
        navigate('/my-leave');
        break;
      case 'forum':
        navigate('/forum');
        break;
      case 'message':
        navigate('/messages');
        break;
      case 'broadcast':
        // Broadcasts might not have a specific page, stay on current page
        break;
      default:
        break;
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center gap-4 flex-1">
        <button 
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          onClick={onToggleSidebar}
        >
          <Menu size={24} />
        </button>
        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-xl py-2 px-10 focus:ring-2 focus:ring-blue-500 transition-all text-sm outline-none shadow-inner`}
          />
          {searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-h-96 overflow-y-auto z-50">
              {searchResults.tasks.length > 0 && (
                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList size={16} className="text-blue-500" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tasks</span>
                  </div>
                  {searchResults.tasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      onClick={() => navigate('/tasks')}
                      className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      <p className="text-sm font-medium dark:text-white">{task.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{task.location}</p>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.docs.length > 0 && (
                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-green-500" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Documents</span>
                  </div>
                  {searchResults.docs.slice(0, 3).map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => navigate('/manuals')}
                      className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      <p className="text-sm font-medium dark:text-white">{doc.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{doc.type}</p>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.staff.length > 0 && (
                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-purple-500" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Staff</span>
                  </div>
                  {searchResults.staff.slice(0, 3).map(staff => (
                    <div
                      key={staff.id}
                      onClick={() => navigate('/admin?tab=users')}
                      className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      <p className="text-sm font-medium dark:text-white">{staff.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{staff.staffId} - {staff.department}</p>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.leave.length > 0 && (
                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-orange-500" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Leave Requests</span>
                  </div>
                  {searchResults.leave.slice(0, 3).map(leave => (
                    <div
                      key={leave.id}
                      onClick={() => navigate('/admin?tab=leave')}
                      className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      <p className="text-sm font-medium dark:text-white">{leave.staffName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{leave.type} - {leave.status}</p>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.reports.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-red-500" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Safety Reports</span>
                  </div>
                  {searchResults.reports.slice(0, 3).map(report => (
                    <div
                      key={report.id}
                      onClick={() => navigate('/safety')}
                      className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      <p className="text-sm font-medium dark:text-white">{report.type}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{report.description.substring(0, 50)}...</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 relative">
        <button 
          onClick={onToggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors"
        >
          <Languages size={18} />
          <span className="hidden sm:inline">{language === 'en' ? 'العربية' : 'English'}</span>
        </button>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

        {/* Notification Bell & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-lg relative transition-colors ${showNotifications ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-sm dark:text-white">Notifications</h3>
                <div className="flex gap-2">
                  <button onClick={markAllRead} className="text-[10px] font-bold text-blue-500 hover:underline">Mark read</button>
                  <button onClick={clearNotifications} className="text-[10px] font-bold text-red-500 hover:underline">Clear all</button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors relative ${!n.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                    >
                      {!n.isRead && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${n.severity === 'urgent' ? 'text-red-500' : 'text-slate-400'}`}>
                          {n.type}
                        </span>
                        <span className="text-[9px] text-slate-400 flex items-center gap-1">
                          <Clock size={8} /> {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-bold dark:text-white line-clamp-1">{n.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="mx-auto text-slate-200 dark:text-slate-800 mb-2" size={32} />
                    <p className="text-xs text-slate-400 font-medium">No new notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

        <div className="flex items-center gap-3 ml-2 group relative">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-900 dark:text-white">{user.name}</p>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{user.staffId}</p>
          </div>
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 object-cover shadow-sm group-hover:ring-2 group-hover:ring-blue-500 transition-all"
          />
          
          <button 
            onClick={onLogout}
            title={t.logout}
            className="p-2 ml-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
