
import React, { useState } from 'react';
import { User, Language, SafetyReport } from '../types';
import { TRANSLATIONS } from '../constants';
import { 
  ShieldAlert, Send, Brain, AlertCircle, CheckCircle2, 
  MapPin, Wrench, Users, Sparkles, Tag
} from 'lucide-react';
import { geminiService, SafetyAnalysisResponse } from '../services/gemini';

interface SafetyBoardProps {
  user: User;
  language: Language;
  reports: SafetyReport[];
  setReports: React.Dispatch<React.SetStateAction<SafetyReport[]>>;
}

const SafetyBoard: React.FC<SafetyBoardProps> = ({ user, language, reports, setReports }) => {
  const t = TRANSLATIONS[language];
  const [reportText, setReportText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SafetyAnalysisResponse | null>(null);

  const handleAnalyze = async () => {
    if (!reportText.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await geminiService.analyzeSafetyReport(reportText);
      setAnalysis(result);
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    if (!reportText.trim()) return;
    const newReport: SafetyReport = {
      id: `R${Date.now()}`,
      reporterId: user.id,
      type: 'hazard',
      description: reportText,
      severity: 'medium',
      status: 'open',
      timestamp: 'Just now',
      aiAnalysis: analysis?.summary,
      entities: analysis?.entities
    };
    setReports([newReport, ...reports]);
    setReportText('');
    setAnalysis(null);
    alert("Safety report submitted successfully.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="inline-flex p-4 bg-red-50 text-red-600 rounded-2xl mb-4">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.safety}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Submit and analyze operational safety incidents in real-time.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <textarea 
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          placeholder={language === 'ar' ? "صف ما حدث بالتفصيل..." : "Describe exactly what happened..."}
          className="w-full h-40 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-red-500 transition-all text-slate-800 dark:text-white outline-none"
        />
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || !reportText}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <Brain size={20} />
            {isAnalyzing ? t.analyzing : "Analyze with AI"}
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!reportText}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
          >
            <Send size={20} />
            {t.submitReport}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl animate-in slide-in-from-bottom-4 duration-500 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4">
             <div className="flex items-center gap-1 bg-blue-500/10 px-3 py-1 rounded-full">
               <Sparkles size={12} className="text-blue-600" />
               <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">AI Safety Intelligence</span>
             </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xl uppercase tracking-tighter">Analysis Summary</h3>
          </div>
          
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm mb-8">
            {analysis.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
             <EntitySection icon={<MapPin size={16}/>} label="Detected Locations" items={analysis.entities.locations} color="blue" />
             {/* Use Wrench icon for Equipment */}
             <EntitySection icon={<Wrench size={16}/>} label="Equipment Identified" items={analysis.entities.equipment} color="orange" />
             <EntitySection icon={<Users size={16}/>} label="Personnel Involved" items={analysis.entities.personnel} color="purple" />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 px-2">
          <AlertCircle size={20} className="text-orange-500" />
          Recent Safety Reports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
          {reports.slice(0, 6).map(rep => (
            <div key={rep.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-slate-300 transition-all">
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rep.severity === 'high' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                  {rep.severity.toUpperCase()} SEVERITY
                </span>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{rep.timestamp}</span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">{rep.description}</h4>
              
              {rep.entities && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {rep.entities.locations.slice(0, 2).map((loc, i) => (
                    <span key={i} className="flex items-center gap-1 text-[9px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-1.5 py-0.5 rounded">
                      <MapPin size={10} /> {loc}
                    </span>
                  ))}
                  {rep.entities.equipment.slice(0, 2).map((eq, i) => (
                    <span key={i} className="flex items-center gap-1 text-[9px] font-bold bg-orange-50 dark:bg-orange-900/20 text-orange-600 px-1.5 py-0.5 rounded">
                      {/* Use Wrench icon for Equipment */}
                      <Wrench size={10} /> {eq}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface EntitySectionProps {
  icon: React.ReactNode;
  label: string;
  items: string[];
  color: 'blue' | 'orange' | 'purple';
}

const EntitySection: React.FC<EntitySectionProps> = ({ icon, label, items, color }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    orange: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
    purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/20"
  };

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${color === 'blue' ? 'text-blue-500' : color === 'orange' ? 'text-orange-500' : 'text-purple-500'}`}>
        {icon}
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.length > 0 ? items.map((item, i) => (
          <span key={i} className={`px-2 py-1 rounded-lg text-xs font-bold transition-all hover:scale-105 ${colors[color]}`}>
            {item}
          </span>
        )) : (
          <span className="text-[10px] text-slate-400 font-medium italic">None detected</span>
        )}
      </div>
    </div>
  );
};

export default SafetyBoard;
