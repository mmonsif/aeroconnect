
import React, { useState, useRef } from 'react';
import { User, Language, DocFile, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import { 
  FileText, 
  Search, 
  Plus, 
  Eye, 
  Trash2, 
  X, 
  Download, 
  ExternalLink,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  Calendar,
  User as UserIcon
} from 'lucide-react';

interface ManualsBoardProps {
  user: User;
  language: Language;
  docs: DocFile[];
  setDocs: React.Dispatch<React.SetStateAction<DocFile[]>>;
}

const ManualsBoard: React.FC<ManualsBoardProps> = ({ user, language, docs, setDocs }) => {
  const t = TRANSLATIONS[language];
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<DocFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('PDF');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewDocName(file.name.split('.')[0]);
      const ext = file.name.split('.').pop()?.toUpperCase();
      if (ext === 'PDF') setNewDocType('PDF');
      else if (ext === 'DOC' || ext === 'DOCX') setNewDocType('DOC');
      else if (ext === 'XLS' || ext === 'XLSX') setNewDocType('XLS');
    }
  };

  const handleUpload = () => {
    if (!newDocName.trim()) {
      alert("Please provide a name for the document.");
      return;
    }
    
    const extensions: Record<string, string> = { 'PDF': '.pdf', 'XLS': '.xlsx', 'DOC': '.docx', 'IMG': '.jpg' };
    const ext = extensions[newDocType] || '.pdf';
    let finalName = newDocName;
    if (!finalName.toLowerCase().endsWith(ext)) finalName = `${finalName}${ext}`;

    const doc: DocFile = {
      id: `D-${Date.now()}`,
      name: finalName,
      type: newDocType,
      uploadedBy: user.name,
      date: new Date().toISOString().split('T')[0]
    };
    setDocs((prev) => [doc, ...prev]);
    closeUploadModal();
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setNewDocName('');
    setNewDocType('PDF');
  };

  const deleteDoc = (id: string) => {
    if (confirm("Remove this document from the portal?")) {
      setDocs((prev) => prev.filter(d => d.id !== id));
    }
  };

  const getDocBlob = (doc: DocFile) => {
    let content = `AeroConnect Internal Document\nFile: ${doc.name}\nGenerated: ${new Date().toISOString()}\n\nOPERATIONAL GUIDELINES:\n- Authorized Personnel Only.\n- Ensure all ground equipment is staged at assigned stand.\n- Report any FOD discovered on the ramp immediately.\n- Follow v1.0.0 procedures for safety compliance.\n\nEGY Hub Operations System © 2026`;
    let mimeType = 'text/plain';
    
    if (doc.type === 'PDF') {
      // Mock minimal valid PDF content
      content = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj\n4 0 obj<</Length 100>>stream\nBT /F1 18 Tf 50 700 Td (AeroConnect Internal: ${doc.name}) Tj 0 -25 Td (Authorized access only.) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\n0000000195 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n345\n%%EOF`;
      mimeType = 'application/pdf';
    }
    
    return new Blob([content], { type: mimeType });
  };

  const handleDownload = (doc: DocFile) => {
    const blob = getDocBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredDocs = docs.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.manuals}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Official airport documentation and operational guides</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
          >
            <Plus size={20} /> Upload Manual
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or category..." 
              className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-2 pl-10 pr-4 text-sm outline-none dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredDocs.length > 0 ? filteredDocs.map(doc => (
            <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${
                  doc.type === 'PDF' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 
                  doc.type === 'XLS' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 
                  'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                }`}>
                  <FileText size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm dark:text-white">{doc.name}</h4>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{doc.type} MANUAL</span>
                    <span className="text-[9px] text-slate-300">•</span>
                    <span className="text-[9px] text-slate-400 font-bold">1.2 MB</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setViewingDoc(doc)} 
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                  title="View Preview"
                >
                  <Eye size={18} />
                </button>
                <button 
                  onClick={() => handleDownload(doc)} 
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-all"
                  title="Download File"
                >
                  <Download size={18} />
                </button>
                {isAdmin && (
                  <button onClick={() => deleteDoc(doc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" title="Delete">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="py-20 text-center">
              <FileText className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={48} />
              <p className="text-slate-400 text-sm font-medium">No documents found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      {/* Internal Document Viewer (Preview Modal) */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{viewingDoc.name}</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">AeroConnect Secure Viewer • v1.0.4</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDownload(viewingDoc)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  <Download size={14} /> Download
                </button>
                <button onClick={() => setViewingDoc(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-slate-100 dark:bg-slate-950/50">
              <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 shadow-2xl rounded-2xl min-h-[1000px] border border-slate-200 dark:border-slate-800 p-12 relative">
                {/* Mock Document Content UI */}
                <div className="absolute top-0 right-0 p-8">
                  <div className="flex flex-col items-end opacity-20 rotate-12 select-none pointer-events-none">
                    <ShieldCheck size={120} className="text-blue-500" />
                    <p className="text-xl font-black uppercase text-blue-500">Authorized</p>
                  </div>
                </div>

                <div className="space-y-8 relative z-10">
                  <div className="pb-8 border-b border-slate-100 dark:border-slate-800">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">Airport Operational Manual</h1>
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Calendar size={14} /> Issued: {viewingDoc.date}</span>
                      <span className="flex items-center gap-1"><UserIcon size={14} /> By: {viewingDoc.uploadedBy}</span>
                      <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-500" /> Verified Hub Document</span>
                    </div>
                  </div>

                  <div className="prose dark:prose-invert max-w-none space-y-6">
                    <section>
                      <h2 className="text-lg font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">1.0 Scope of Operations</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        This document details the standard operating procedures (SOP) for ground handling at EGY Hub Terminal 3. 
                        It applies to all ground crew, supervisors, and third-party contractors working within the sterile ramp areas.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-lg font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">2.0 Safety Protocols</h2>
                      <div className="space-y-3">
                        {[
                          "All personnel must wear High-Visibility (Hi-Vis) vests at all times while on the ramp.",
                          "Foreign Object Debris (FOD) checks must be performed before any aircraft stand entry.",
                          "Hearing protection is mandatory during engine start-up and taxiing procedures.",
                          "Smoking is strictly prohibited in all operational areas including stands and taxiways."
                        ].map((item, i) => (
                          <div key={i} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-sm border-l-4 border-blue-500">
                            <span className="font-bold text-blue-500">2.{i+1}</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h2 className="text-lg font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">3.0 Equipment Staging</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Ground Support Equipment (GSE) must be returned to designated parking zones immediately after use. 
                        Blocking of emergency exit routes or fire hydrant access will result in immediate disciplinary action.
                      </p>
                    </section>
                  </div>

                  <div className="pt-12 mt-12 border-t border-slate-100 dark:border-slate-800 text-center space-y-2 opacity-50">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">AeroConnect Operations • Hub-Security-Level: HIGH</p>
                    <p className="text-[8px] text-slate-500">Electronic Copy: Not valid for physical submission unless stamped by Hub Manager.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
               <p className="text-[9px] text-slate-400 font-bold uppercase">Viewing Page 1 of 1</p>
               <div className="flex gap-2">
                 <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-400 cursor-not-allowed">Previous</button>
                 <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-400 cursor-not-allowed">Next</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal (Existing functionality preserved) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold dark:text-white mb-6">Upload Local Manual</h3>
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all active:scale-[0.98]"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                />
                {selectedFile ? (
                  <div className="text-center animate-in zoom-in-50">
                    <FileCheck className="text-emerald-500 mx-auto mb-2" size={40} />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Ready to upload</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <UploadCloud className="text-slate-400 group-hover:text-blue-500 mx-auto mb-2 transition-colors" size={40} />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Select files from computer</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">PDF, DOC, or XLS allowed</p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Display Name</label>
                <input 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl outline-none dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  value={newDocName} 
                  placeholder="e.g. Ground Safety Standards 2026"
                  onChange={e => setNewDocName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Manual Category</label>
                <select 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl outline-none dark:text-white focus:ring-2 focus:ring-blue-500" 
                  value={newDocType} 
                  onChange={e => setNewDocType(e.target.value)}
                >
                  <option value="PDF">Standard PDF Manual</option>
                  <option value="DOC">Operating Procedure (DOC)</option>
                  <option value="XLS">Equipment Inventory (XLS)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={closeUploadModal} className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Cancel</button>
                <button 
                  onClick={handleUpload} 
                  disabled={!newDocName}
                  className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  Confirm Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualsBoard;
