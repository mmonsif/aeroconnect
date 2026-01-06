
import React, { useState, useRef } from 'react';
import { User, Language, DocFile, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import {
  FileText,
  Search,
  Plus,
  Eye,
  Trash2,
  Download,
  UploadCloud,
  FileCheck
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ManualsBoardProps {
  user: User;
  language: Language;
  docs: DocFile[];
  setDocs: React.Dispatch<React.SetStateAction<DocFile[]>>;
}

const ManualsBoard: React.FC<ManualsBoardProps> = ({ user, language, docs, setDocs }) => {
  const t = TRANSLATIONS[language];
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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

  const handleUpload = async () => {
    if (!newDocName.trim() || !selectedFile || !isSupabaseConfigured()) {
      alert("Missing name, file, or database connection.");
      return;
    }

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${newDocName}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload file. Please try again.');
        return;
      }

      // Save document metadata to database
      const { error: dbError } = await supabase.from('documents').insert([{
        name: newDocName,
        type: newDocType,
        uploaded_by: user.name,
        file_path: fileName,
        file_size: selectedFile.size
      }]);

      if (dbError) {
        console.error('Database error:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('documents').remove([fileName]);
        alert('Failed to save document metadata. Please try again.');
        return;
      }

      // Immediately add the new document to the local state for instant UI update
      const newDoc = {
        id: 'temp-' + Date.now(), // Temporary ID until real data loads
        name: newDocName,
        type: newDocType,
        uploadedBy: user.name,
        date: new Date().toLocaleDateString(),
        filePath: fileName,
        fileSize: selectedFile.size
      };
      setDocs(prev => [newDoc, ...prev]);

      // Refresh documents list from server in background
      const { data: docsData } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
      if (docsData) {
        setDocs(docsData.map(doc => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          uploadedBy: doc.uploaded_by,
          date: new Date(doc.created_at).toLocaleDateString(),
          filePath: doc.file_path,
          fileSize: doc.file_size
        })));
      }

      closeUploadModal();
      alert('Document uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document. Please try again.');
    }
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setNewDocName('');
    setNewDocType('PDF');
  };

  const deleteDoc = async (id: string) => {
    if (confirm("Remove this document from the portal?") && isSupabaseConfigured()) {
      try {
        // First get the document to check if it has a file path
        const { data: doc } = await supabase.from('documents').select('file_path').eq('id', id).single();

        // Delete from database
        const { error: dbError } = await supabase.from('documents').delete().eq('id', id);

        if (dbError) {
          console.error('Database delete error:', dbError);
          alert('Failed to delete document metadata. Please try again.');
          return;
        }

        // Delete file from storage if it exists
        if (doc?.file_path) {
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([doc.file_path]);

          if (storageError) {
            console.error('Storage delete error:', storageError);
            // Don't show error to user as the database record is already deleted
          }
        }

        // Refresh documents list
        const { data: docsData } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
        if (docsData) {
          setDocs(docsData.map(doc => ({
            id: doc.id,
            name: doc.name,
            type: doc.type,
            uploadedBy: doc.uploaded_by,
            date: new Date(doc.created_at).toLocaleDateString(),
            filePath: doc.file_path,
            fileSize: doc.file_size
          })));
        }

        alert('Document deleted successfully!');
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  const handleDownload = async (doc: DocFile) => {
    try {
      if (doc.filePath) {
        // Get public URL for the file
        const { data } = supabase.storage
          .from('documents')
          .getPublicUrl(doc.filePath);

        if (data?.publicUrl) {
          // Extract original file extension from filePath
          const fileExtension = doc.filePath.split('.').pop()?.toLowerCase() || '';
          const downloadName = `${doc.name}.${fileExtension}`;

          // Create download link using public URL
          const a = document.createElement('a');
          a.href = data.publicUrl;
          a.download = downloadName;
          // Remove target to allow proper download instead of opening in new tab
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          alert('Failed to generate download link. Please try again.');
        }
      } else {
        // Fallback to demo content if no file path
        const content = `AEROCONNECT SECURE DOCUMENT ACCESS\n\nFilename: ${doc.name}\nType: ${doc.type} MANUAL\nSecurity Level: INTERNAL\nAuthorized for: ${user.name} (${user.staffId})\nDownloaded on: ${new Date().toLocaleString()}\n\n[CONFIDENTIAL DOCUMENT CONTENT HASH: 8f9e2b1c]`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.name}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const handleOnlineView = async (doc: DocFile) => {
    try {
      if (doc.filePath) {
        // Get public URL for online viewing
        const { data } = supabase.storage
          .from('documents')
          .getPublicUrl(doc.filePath);

        if (data?.publicUrl) {
          // Open in new tab
          window.open(data.publicUrl, '_blank', 'noopener,noreferrer');
        } else {
          alert('Failed to generate online view link. Please try downloading instead.');
        }
      } else {
        alert('This document is not available for online viewing. Please download it instead.');
      }
    } catch (error) {
      console.error('Online view error:', error);
      alert('Failed to open document online. Please try downloading instead.');
    }
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
                    <span className="text-[9px] text-slate-400 font-bold">{doc.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOnlineView(doc)}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                >
                  <Eye size={18} />
                </button>
                <button 
                  onClick={() => handleDownload(doc)} 
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-all"
                >
                  <Download size={18} />
                </button>
                {isAdmin && (
                  <button onClick={() => deleteDoc(doc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="py-20 text-center">
              <FileText className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={48} />
              <p className="text-slate-400 text-sm font-medium">No documents found.</p>
            </div>
          )}
        </div>
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold dark:text-white mb-6">Upload Local Manual</h3>
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                />
                {selectedFile ? (
                  <div className="text-center">
                    <FileCheck className="text-emerald-500 mx-auto mb-2" size={40} />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{selectedFile.name}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <UploadCloud className="text-slate-400 group-hover:text-blue-500 mx-auto mb-2 transition-colors" size={40} />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Click to select file</p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Display Name</label>
                <input 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none dark:text-white"
                  value={newDocName} 
                  onChange={e => setNewDocName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Category</label>
                <select 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none dark:text-white" 
                  value={newDocType} 
                  onChange={e => setNewDocType(e.target.value)}
                >
                  <option value="PDF">PDF</option>
                  <option value="DOC">DOC</option>
                  <option value="XLS">XLS</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={closeUploadModal} className="flex-1 py-3 text-slate-400 font-bold">Cancel</button>
                <button onClick={handleUpload} className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl">Confirm Upload</button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

const MetaItem = ({ icon, label, value, color }: any) => {
  const colors: any = {
    emerald: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10",
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-900/10",
    purple: "text-purple-500 bg-purple-50 dark:bg-purple-900/10",
    indigo: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/10",
  };
  return (
    <div className="text-center p-3 rounded-2xl bg-white dark:bg-slate-950 border dark:border-slate-800 shadow-sm">
      <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${colors[color]}`}>{icon}</div>
      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
      <p className="text-[10px] font-bold dark:text-white mt-0.5">{value}</p>
    </div>
  );
};

export default ManualsBoard;
