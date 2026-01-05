
import React, { useState, useEffect, useCallback } from 'react';
import { User, Language, UserRole, Task, SafetyReport, DocFile, ForumPost, LeaveRequest } from '../types';
import { TRANSLATIONS } from '../constants';
// Changed import from react-router-dom to react-router to resolve missing export errors
import { useNavigate } from 'react-router';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { 
  ClipboardList, 
  FileText, 
  PlusCircle,
  ShieldAlert,
  MessageSquare,
  Search,
  ChevronRight,
  FileCode,
  CalendarDays,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  CloudSun,
  Wind,
  Droplets,
  Eye,
  ThermometerSun,
  AlertTriangle,
  RefreshCw,
  Navigation,
  Users as UsersIcon,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface DashboardProps {
  user: User;
  language: Language;
  onToggleTheme: () => void;
  searchQuery: string;
  data: {
    tasks: Task[];
    safetyReports: SafetyReport[];
    docs: DocFile[];
    forumPosts: ForumPost[];
    leaveRequests: LeaveRequest[];
    users: User[];
  };
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
}

const Dashboard: React.FC<DashboardProps> = ({ user, language, onToggleTheme, data, searchQuery, setLeaveRequests }) => {
  const t = TRANSLATIONS[language];
  const navigate = useNavigate();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [showWeatherDetails, setShowWeatherDetails] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [weather, setWeather] = useState({
    temp: 24,
    wind: 12,
    visibility: '10km+',
    humidity: 45,
    condition: 'Syncing...',
    pressure: 1013,
    lastUpdate: new Date().toLocaleTimeString()
  });

  const fetchWeatherData = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=30.0444&longitude=31.2357&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure');
      const json = await res.json();
      const current = json.current;
      const weatherCodes: Record<number, string> = {
        0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Foggy', 51: 'Drizzle', 61: 'Light Rain', 80: 'Rain Showers', 95: 'Thunderstorm'
      };

      setWeather({
        temp: Math.round(current.temperature_2m),
        wind: Math.round(current.wind_speed_10m),
        visibility: '12km',
        humidity: current.relative_humidity_2m,
        condition: weatherCodes[current.weather_code] || 'Clear',
        pressure: Math.round(current.surface_pressure),
        lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (error) {
      console.error("Weather sync failed", error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 1800000);
    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  const [leaveForm, setLeaveForm] = useState({
    type: 'annual' as LeaveRequest['type'],
    startDate: '',
    endDate: '',
    reason: ''
  });

  const handleLeaveSubmit = async () => {
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      alert('Please fill in all required fields.');
      return;
    }

    const newReq: LeaveRequest = {
      id: `L-${Date.now()}`,
      staffId: user.staffId,
      staffName: user.name,
      type: leaveForm.type,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      status: 'pending',
      reason: leaveForm.reason
    };

    console.log('Submitting leave request:', newReq);
    console.log('Supabase configured:', isSupabaseConfigured());
    console.log('Current user:', { id: user.id, staffId: user.staffId, name: user.name });

    // Save to Supabase
    if (isSupabaseConfigured()) {
      try {
        console.log('Attempting to insert into Supabase...');
        const { data, error } = await supabase.from('leave_requests').insert([{
          id: newReq.id,
          staff_id: newReq.staffId,
          staff_name: newReq.staffName,
          type: newReq.type,
          start_date: newReq.startDate,
          end_date: newReq.endDate,
          status: newReq.status,
          reason: newReq.reason
        }]).select();

        if (error) {
          console.error('Supabase insert error:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          alert(`Failed to submit leave request: ${error.message}\n\nPlease check the console for more details.`);
          return;
        }

        console.log('Leave request inserted successfully:', data);
        console.log('Data returned from insert:', data);

        // Update local state with the data from Supabase
        if (data && data.length > 0) {
          setLeaveRequests(prev => [data[0], ...prev]);
        } else {
          setLeaveRequests(prev => [newReq, ...prev]);
        }

        setIsLeaveModalOpen(false);
        setLeaveForm({ type: 'annual', startDate: '', endDate: '', reason: '' });
        alert('Leave request submitted successfully!');

        // Force a data sync to ensure consistency
        setTimeout(() => {
          console.log('Triggering data sync after leave submission...');
          // This will be handled by the real-time subscription in App.tsx
        }, 1000);

      } catch (error: any) {
        console.error('Failed to submit leave request:', error);
        console.error('Error stack:', error.stack);
        alert(`Failed to submit leave request: ${error.message || 'Unknown error'}\n\nPlease check the console for more details.`);
      }
    } else {
      console.warn('Supabase not configured, using local state only');
      alert('Database not configured. Request saved locally only.');
      // Fallback to local state only if Supabase is not configured
      setLeaveRequests(prev => [newReq, ...prev]);
      setIsLeaveModalOpen(false);
      setLeaveForm({ type: 'annual', startDate: '', endDate: '', reason: '' });
    }
  };

  const getVisibleTasks = () => {
    return data.tasks.filter(task => {
      if (user.role === UserRole.ADMIN) return true;
      // Find the assigned user
      const assignedUser = data.users.find(u => u.name === task.assignedTo);
      if (assignedUser) {
        if (user.role === UserRole.STAFF) {
          // Staff sees only their own tasks
          return task.assignedTo === user.name;
        } else if (user.role === UserRole.MANAGER || user.role === UserRole.SUPERVISOR) {
          // Manager sees tasks assigned to them, or tasks where they are the manager of the assigned user in the same department
          return task.assignedTo === user.name ||
                 (assignedUser.managerId === user.id && assignedUser.department === user.department);
        }
      }
      return false;
    });
  };

  const visibleTasks = getVisibleTasks();
  const q = searchQuery.toLowerCase();
  
  // Comprehensive Deep Search Logic
  const results = {
    tasks: visibleTasks.filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.description.toLowerCase().includes(q) || 
      t.location.toLowerCase().includes(q)
    ),
    reports: data.safetyReports.filter(r => {
      const inDescription = r.description.toLowerCase().includes(q);
      const inAIAnalysis = r.aiAnalysis?.toLowerCase().includes(q);
      const inLocations = r.entities?.locations.some(loc => loc.toLowerCase().includes(q));
      const inEquipment = r.entities?.equipment.some(eq => eq.toLowerCase().includes(q));
      const inPersonnel = r.entities?.personnel.some(p => p.toLowerCase().includes(q));
      return inDescription || inAIAnalysis || inLocations || inEquipment || inPersonnel;
    }),
    docs: data.docs.filter(d => 
      d.name.toLowerCase().includes(q)
    ),
    staff: data.users.filter(u => 
      u.name.toLowerCase().includes(q) || 
      u.staffId.toLowerCase().includes(q) || 
      u.department.toLowerCase().includes(q)
    ),
    leave: data.leaveRequests.filter(l => {
      const isOwner = l.staffId === user.staffId;
      const isPrivileged = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
      if (!isOwner && !isPrivileged) return false;
      return l.staffName.toLowerCase().includes(q) || l.reason.toLowerCase().includes(q) || l.type.toLowerCase().includes(q);
    }),
  };

  const totalResults = results.tasks.length + results.reports.length + results.docs.length + results.staff.length + results.leave.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.welcome}, {user.name.split(' ')[0]}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Ops Hub: EGY-Central Active
          </p>
        </div>
        
        {searchQuery && (
          <div className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
            <Zap size={14} className="fill-white" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              {totalResults} Search Hits
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard onClick={() => navigate('/tasks')} icon={<ClipboardList className="text-blue-600 dark:text-blue-400" size={28} />} label={t.activeTasks} value={visibleTasks.filter(t => t.status !== 'completed').length.toString()} footer={`${visibleTasks.filter(t => t.priority === 'high' || t.priority === 'critical').length} urgent items`} color="blue" />
        <DashboardCard onClick={() => navigate('/manuals')} icon={<FileText className="text-purple-600 dark:text-purple-400" size={28} />} label={t.docs} value={data.docs.length.toString()} footer="Hub Manuals & SOPs" color="purple" />
        <DashboardCard onClick={() => navigate('/forum')} icon={<MessageSquare className="text-emerald-600 dark:text-emerald-400" size={28} />} label={t.forum} value={data.forumPosts.length.toString()} footer="Staff Discussions" color="emerald" />
        <div onClick={() => navigate('/safety')} className="relative overflow-hidden cursor-pointer group bg-orange-600 dark:bg-orange-700 p-6 rounded-3xl shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center text-center">
          <div className="bg-white/20 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
            <ShieldAlert className="text-white" size={32} />
          </div>
          <h2 className="text-white font-bold text-lg leading-tight uppercase tracking-tight">{t.sos}</h2>
          <p className="text-orange-100 text-[10px] mt-1 font-bold">Report hazard immediately</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 px-2">
            {t.quickActions}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {user.role !== UserRole.STAFF && (
              <button onClick={() => navigate('/tasks?action=new')} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-500 transition-all shadow-sm group">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                  <PlusCircle size={24} />
                </div>
                <div className="text-left rtl:text-right">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{t.addNewTask}</p>
                  <p className="text-[10px] text-slate-500">Assign Hub Duty</p>
                </div>
              </button>
            )}

            <button onClick={() => setIsLeaveModalOpen(true)} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-emerald-500 transition-all shadow-sm group">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                <CalendarDays size={24} />
              </div>
              <div className="text-left rtl:text-right">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{t.requestLeave}</p>
                <p className="text-[10px] text-slate-500">Portal submission</p>
              </div>
            </button>
          </div>


        </div>

        <div className="space-y-6">
           <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 px-2">
            Station Status
          </h3>
          
          <div 
            onClick={() => setShowWeatherDetails(true)}
            className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden group border border-white/5 cursor-pointer hover:scale-[1.02] transition-all"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700"></div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Hub Weather</p>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />
                <span className="text-[8px] font-bold uppercase">{weather.lastUpdate}</span>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between mb-6">
              <div className="space-y-1">
                <p className="text-4xl font-black">{weather.temp}°C</p>
                <p className="text-xs text-slate-400 font-medium">{weather.condition} • {weather.pressure} hPa</p>
              </div>
              <div className="p-4 bg-white/5 rounded-3xl group-hover:rotate-12 transition-transform">
                <CloudSun size={48} className="text-blue-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-white/5 rounded-2xl">
                <p className="text-[8px] uppercase text-slate-500 font-black mb-1">Wind</p>
                <p className="text-xs font-bold">{weather.wind} km/h</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl">
                <p className="text-[8px] uppercase text-slate-500 font-black mb-1">Vis</p>
                <p className="text-xs font-bold">{weather.visibility}</p>
              </div>
            </div>

            <div className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
              <span className="text-[10px] font-bold text-blue-400 uppercase">Telemetry Details</span>
              <ChevronRight size={14} className="text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* --- Search Results Tray (The Footer Section) --- */}
      {searchQuery && (
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-6 duration-500">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <Search className="text-blue-500" size={18} />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Search Intelligence findings</h3>
            </div>
            {totalResults === 0 && (
              <span className="text-[10px] font-bold text-red-500 uppercase">No Matches in Hub</span>
            )}
          </div>

          <div className="space-y-3">
            {/* COMPACT ROWS FOR ALL CATEGORIES */}
            {results.staff.map(u => (
              <CompactResultRow key={u.id} icon={<UsersIcon size={14}/>} title={u.name} subtitle={`Personnel • ${u.staffId} • ${u.department}`} onClick={() => navigate('/admin?tab=users')} color="indigo" />
            ))}
            {results.tasks.map(t => (
              <CompactResultRow key={t.id} icon={<ClipboardList size={14}/>} title={t.title} subtitle={`Operational Task • ${t.location}`} onClick={() => navigate('/tasks')} color="blue" />
            ))}
            {results.reports.map(r => (
              <CompactResultRow key={r.id} icon={<ShieldCheck size={14}/>} title={r.description.substring(0, 60)} subtitle={`Safety Intel • ${r.timestamp}`} onClick={() => navigate('/safety')} color="red" />
            ))}
            {results.leave.map(l => (
              <CompactResultRow key={l.id} icon={<CalendarDays size={14}/>} title={l.staffName} subtitle={`Leave Application • ${l.type} • ${l.startDate}`} onClick={() => l.staffId === user.staffId ? navigate('/my-leave') : navigate('/admin?tab=leave')} color="emerald" />
            ))}
            {results.docs.map(d => (
              <CompactResultRow key={d.id} icon={<FileCode size={14}/>} title={d.name} subtitle={`Doc Manual • ${d.type}`} onClick={() => navigate('/manuals')} color="purple" />
            ))}
          </div>

          {totalResults > 5 && (
            <p className="text-center mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing all {totalResults} operational matches</p>
          )}
        </div>
      )}

      {/* Weather Modal */}
      {showWeatherDetails && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowWeatherDetails(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600"><CloudSun size={32} /></div>
                <div>
                  <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Station Intel</h2>
                  <p className="text-xs text-slate-500">Hub Telemetry EGY-Central</p>
                </div>
              </div>
              <button onClick={() => setShowWeatherDetails(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90"><X size={24} className="text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <WeatherItem icon={<ThermometerSun size={18} />} label="Temperature" value={`${weather.temp}°C`} detail={`Live Sync ${weather.lastUpdate}`} />
              <WeatherItem icon={<Wind size={18} />} label="Wind Speed" value={`${weather.wind} km/h`} detail="Direction: NNW" />
              <WeatherItem icon={<Eye size={18} />} label="Visibility" value={weather.visibility} detail="Unrestricted" />
              <WeatherItem icon={<Droplets size={18} />} label="Humidity" value={`${weather.humidity}%`} detail={`${weather.pressure} hPa`} />
            </div>
            <button onClick={() => setShowWeatherDetails(false)} className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-2xl shadow-xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2">
              <CheckCircle2 size={18} /> Return to Operations
            </button>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsLeaveModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold dark:text-white">{t.applyForLeave}</h2>
              <button onClick={() => setIsLeaveModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full active:scale-90 transition-all"><X size={24} className="text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t.leaveType}</label>
                <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none dark:text-white" value={leaveForm.type} onChange={e => setLeaveForm({...leaveForm, type: e.target.value as any})}>
                  <option value="annual">{t.annual}</option>
                  <option value="sick">{t.sick}</option>
                  <option value="emergency">{t.emergency}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t.startDate}</label><input type="date" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-3 outline-none dark:text-white" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t.endDate}</label><input type="date" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-3 outline-none dark:text-white" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} /></div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t.leaveReason}</label><textarea className="w-full h-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-3 outline-none dark:text-white resize-none" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} /></div>
              <button onClick={handleLeaveSubmit} className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-xl mt-2 transition-all active:scale-[0.98]">{t.submitApplication}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CompactResultRowProps { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void; color: string; }
const CompactResultRow: React.FC<CompactResultRowProps> = ({ icon, title, subtitle, onClick, color }) => {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/10",
    red: "text-red-600 bg-red-50 dark:bg-red-900/10",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10",
    purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/10",
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10",
  };

  return (
    <div 
      onClick={onClick} 
      className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-blue-500 cursor-pointer group transition-all"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={`p-2 rounded-lg shrink-0 ${colorMap[color] || 'bg-slate-100 text-slate-600'}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold dark:text-white truncate">{title}</h4>
          <p className="text-[10px] text-slate-500 font-medium truncate">{subtitle}</p>
        </div>
      </div>
      <ChevronRight size={12} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0 ml-4" />
    </div>
  );
};

const WeatherItem = ({ icon, label, value, detail }: { icon: React.ReactNode, label: string, value: string, detail: string }) => (
  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-blue-500/20 transition-all">
    <div className="flex items-center gap-2 text-blue-500 mb-2">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    </div>
    <p className="text-xl font-black dark:text-white">{value}</p>
    <p className="text-[10px] text-slate-500 font-medium">{detail}</p>
  </div>
);

const DashboardCard: React.FC<any> = ({ icon, label, value, footer, color, onClick }) => {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/20",
    purple: "bg-purple-50 dark:bg-purple-900/20",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20",
  };

  return (
    <div onClick={onClick} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group cursor-pointer">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color]} group-hover:rotate-6 transition-transform`}>{icon}</div>
        <div className="text-right rtl:text-left"><p className="text-3xl font-black text-slate-900 dark:text-white">{value}</p></div>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="h-0.5 w-12 bg-slate-100 dark:bg-slate-800 rounded-full my-2"></div>
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 italic">{footer}</p>
      </div>
    </div>
  );
};

export default Dashboard;
