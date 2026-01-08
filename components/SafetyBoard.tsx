
import React, { useState, useRef, useEffect } from 'react';
import { User, Language, SafetyReport } from '../types';
import { TRANSLATIONS } from '../constants';
import { ShieldAlert, Send, Brain, AlertCircle, CheckCircle2, User as UserIcon, Lock, Sparkles, Languages, Paperclip, X, Image as ImageIcon } from 'lucide-react';
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
  const [attachedImages, setAttachedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachedImages(prev => [...prev, ...files]);
      const newUrls = files.map(file => URL.createObjectURL(file as Blob));
      setImageUrls(prev => [...prev, ...newUrls]);
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imageUrls[index]);
    setImageUrls(prev => prev.filter((_, i) => i !== index));
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

    // Upload images to Supabase Storage
    let uploadedImageUrls: string[] = [];
    if (attachedImages.length > 0) {
      for (const image of attachedImages) {
        const fileName = `safety-${Date.now()}-${Math.random().toString(36).substring(7)}.${image.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('safety_images')
          .upload(fileName, image);

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('safety_images')
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          uploadedImageUrls.push(urlData.publicUrl);
        }
      }
    }

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
      reporterName: isAnonymous ? undefined : user.name,
      type: 'hazard',
      description: fullReport,
      severity: 'medium',
      status: 'open',
      aiAnalysis: analysis?.summary,
      entities: analysis?.entities,
      imageUrls: uploadedImageUrls,
      timestamp: new Date().toLocaleString()
    };

    await supabase.from('safety_reports').insert([{
      id: newReport.id,
      reporter_id: newReport.reporterId,
      reporter_name: newReport.reporterName,
      type: newReport.type,
      description: newReport.description,
      severity: newReport.severity,
      status: newReport.status,
      ai_analysis: newReport.aiAnalysis,
      entities: newReport.entities,
      images: newReport.imageUrls
    }]);

    setReports(prev => [newReport, ...prev]);
    setReportText('');
    setAnalysis(null);
    setIsAnonymous(false);
    setAttachedImages([]);
    setImageUrls([]);
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border-2 shadow-lg ${isAnonymous ? 'bg-orange-600 text-white border-orange-700 shadow-orange-500/30' : 'bg-blue-600 text-white border-blue-700 shadow-blue-500/30'}`}
          >
            {isAnonymous ? <Lock size={14} /> : <UserIcon size={14} />}
            {isAnonymous ? 'Anonymous Report' : 'Identifiable Report'}
          </button>
        </div>
        
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Describe the hazard in detail (e.g., fuel spill near Stand 402, faulty GPU cable...)"
            className="w-full h-40 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pr-12 dark:text-white outline-none ring-2 ring-transparent focus:ring-red-500 transition-all"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
            title="Attach Images"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Image Previews */}
        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Attachment ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

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
