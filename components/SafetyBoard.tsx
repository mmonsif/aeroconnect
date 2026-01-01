
import React, { useState } from 'react';
import { User, Language, SafetyReport } from '../types';
import { TRANSLATIONS } from '../constants';
import { ShieldAlert, Send, Brain, AlertCircle, CheckCircle2, MapPin, Wrench, Users, Sparkles } from 'lucide-react';
import { geminiService, SafetyAnalysisResponse } from '../services/gemini';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface SafetyBoardProps {
  user: User;
  language: Language;
  reports: SafetyReport[];
  setReports: React.Dispatch<React.SetStateAction<SafetyReport[]>>;
}

const SafetyBoard: React.FC<SafetyBoardProps> = ({ user, language, reports }) => {
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
    } catch (error) { console.error(error); } finally { setIsAnalyzing(false); }
  };

  const handleSubmit = async () => {
    if (!reportText.trim() || !isSupabaseConfigured()) return;
    
    await supabase.from('safety_reports').insert([{
      id: `R${Date.now()}`,
      reporter_id: user.id,
      type: 'hazard',
      description: reportText,
      severity: 'medium',
      status: 'open',
      ai_analysis: analysis?.summary,
      entities: analysis?.entities
    }]);

    setReportText('');
    setAnalysis(null);
    alert("Report submitted.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="inline-flex p-4 bg-red-50 text-red-600 rounded-2xl mb-4"><ShieldAlert size={32} /></div>
        <h1 className="text-3xl font-bold dark:text-white">{t.safety}</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <textarea value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Describe the hazard..." className="w-full h-40 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 dark:text-white outline-none" />
        <div className="flex gap-3">
          <button onClick={handleAnalyze} disabled={isAnalyzing || !reportText} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold"><Brain size={20} className="inline mr-2" />{isAnalyzing ? t.analyzing : "Analyze AI"}</button>
          <button onClick={handleSubmit} disabled={!reportText} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold"><Send size={20} className="inline mr-2" />{t.submitReport}</button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
          <h3 className="font-bold text-slate-900 dark:text-white text-xl mb-4">AI Analysis Results</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">{analysis.summary}</p>
        </div>
      )}

      <div className="space-y-4 pb-20">
        <h3 className="font-bold dark:text-white flex items-center gap-2 px-2"><AlertCircle size={20} className="text-orange-500" />Recent Safety Feed</h3>
        {reports.slice(0, 10).map(rep => (
          <div key={rep.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded uppercase">{rep.severity} SEVERITY</span>
              <span className="text-[10px] text-slate-400 font-bold">{rep.timestamp}</span>
            </div>
            <p className="font-bold dark:text-white mb-2">{rep.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SafetyBoard;
