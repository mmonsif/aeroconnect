
import React, { useState, useRef, useEffect } from 'react';
import { User, Language, SafetyReport } from '../types';
import { TRANSLATIONS } from '../constants';
import { ShieldAlert, Send, Brain, AlertCircle, CheckCircle2, User as UserIcon, Lock, Sparkles, Languages } from 'lucide-react';
import { geminiService, SafetyAnalysisResponse } from '../services/gemini';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [analysis, setAnalysis] = useState<SafetyAnalysisResponse | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [showTranslatePopup, setShowTranslatePopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (selectedText && selectedText.length > 0) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        if (rect) {
          setSelectedText(selectedText);
          setPopupPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10
          });
          setShowTranslatePopup(true);
        }
      } else {
        setShowTranslatePopup(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
        setShowTranslatePopup(false);
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleTranslate = async () => {
    if (!selectedText.trim()) return;
    setIsTranslating(true);
    try {
      const targetLang = language === 'ar' ? 'en' : 'ar';
      const translated = await geminiService.translate(selectedText, targetLang);
      setTranslatedText(translated);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!reportText.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await geminiService.analyzeSafetyReport(reportText);
      setAnalysis(result);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const handleSubmit = async () => {
    if (!reportText.trim() || !isSupabaseConfigured()) return;

    // Create full report text including AI analysis
    let fullReport = reportText;
    if (analysis) {
      fullReport += '\n\n--- AI ANALYSIS REPORT ---\n';
      fullReport += `Summary: ${analysis.summary}\n\n`;
      if (analysis.entities.locations.length > 0) {
        fullReport += `Locations: ${analysis.entities.locations.join(', ')}\n`;
      }
      if (analysis.entities.equipment.length > 0) {
        fullReport += `Equipment: ${analysis.entities.equipment.join(', ')}\n`;
      }
      if (analysis.entities.personnel.length > 0) {
        fullReport += `Personnel: ${analysis.entities.personnel.join(', ')}\n`;
      }
    }

    const newReport: SafetyReport = {
      id: `R${Date.now()}`,
      reporterId: isAnonymous ? 'anonymous' : user.id,
      type: 'hazard',
      description: fullReport,
      severity: 'medium',
      status: 'open',
      aiAnalysis: analysis?.summary,
      entities: analysis?.entities,
      timestamp: new Date().toLocaleString()
    };

    await supabase.from('safety_reports').insert([{
      id: newReport.id,
      reporter_id: newReport.reporterId,
      type: newReport.type,
      description: newReport.description,
      severity: newReport.severity,
      status: newReport.status,
      ai_analysis: newReport.aiAnalysis,
      entities: newReport.entities
    }]);

    setReports(prev => [newReport, ...prev]);
    setReportText('');
    setAnalysis(null);
    setIsAnonymous(false);
    alert(isAnonymous ? "Anonymous report submitted safely." : "Report submitted successfully.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="inline-flex p-4 bg-red-50 text-red-600 rounded-2xl mb-4"><ShieldAlert size={32} /></div>
        <h1 className="text-3xl font-bold dark:text-white">{t.safety}</h1>
        <p className="text-sm text-slate-500 mt-2">Confidential reporting system for all ground hazards</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between px-2">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
            <UserIcon size={14} /> Hazard Description
          </label>
          <button 
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${isAnonymous ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-500'}`}
          >
            {isAnonymous ? <Lock size={12} /> : <UserIcon size={12} />}
            {isAnonymous ? 'Submission: Anonymous' : 'Submission: Identifiable'}
          </button>
        </div>
        
        <textarea 
          value={reportText} 
          onChange={(e) => setReportText(e.target.value)} 
          placeholder="Describe the hazard in detail (e.g., fuel spill near Stand 402, faulty GPU cable...)" 
          className="w-full h-40 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 dark:text-white outline-none ring-2 ring-transparent focus:ring-red-500 transition-all" 
        />

        {/* Translation Popup */}
        {showTranslatePopup && (
          <div
            className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-200"
            style={{
              left: `${popupPosition.x}px`,
              top: `${popupPosition.y}px`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Languages size={16} className="text-blue-500" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                Translate to {language === 'ar' ? 'English' : 'العربية'}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500 italic">"{selectedText}"</p>

              {translatedText && (
                <div className="border-t pt-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{translatedText}</p>
                </div>
              )}

              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="w-full py-2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isTranslating ? 'Translating...' : `Translate to ${language === 'ar' ? 'English' : 'العربية'}`}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !reportText} 
            className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <Brain size={20} className="inline mr-2" />
            {isAnalyzing ? t.analyzing : "AI Analysis"}
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={!reportText} 
            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
          >
            <Send size={20} className="inline mr-2" />
            {t.submitReport}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 mb-4 text-emerald-600">
            <Sparkles size={20} />
            <h3 className="font-bold text-xl uppercase tracking-tighter">AI Insight Report</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">{analysis.summary}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t dark:border-slate-800 pt-6">
             <EntityList title="Locations" items={analysis.entities.locations} />
             <EntityList title="Equipment" items={analysis.entities.equipment} />
             <EntityList title="Personnel" items={analysis.entities.personnel} />
          </div>
        </div>
      )}

      <div className="space-y-4 pb-20">
        <h3 className="font-bold dark:text-white flex items-center gap-2 px-2"><AlertCircle size={20} className="text-orange-500" />Recent Safety Feed</h3>
        {reports.slice(0, 5).map(rep => (
          <div key={rep.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex justify-between mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${rep.severity === 'high' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                {rep.severity} SEVERITY
              </span>
              <span className="text-[10px] text-slate-400 font-bold">{rep.timestamp}</span>
            </div>
            <p className="font-bold text-sm dark:text-white mb-1">{rep.description}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Reporter: {rep.reporterId === 'anonymous' ? 'Anonymous Staff' : 'Registered Member'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const EntityList = ({ title, items }: { title: string, items: string[] }) => (
  <div>
    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{title}</h4>
    <div className="flex flex-wrap gap-1">
      {items.length > 0 ? items.map(i => (
        <span key={i} className="text-[9px] bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded-lg font-bold">{i}</span>
      )) : <span className="text-[9px] italic text-slate-400">None detected</span>}
    </div>
  </div>
);

export default SafetyBoard;
