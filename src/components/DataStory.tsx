import React, { useState } from 'react';
import { DesignDoc, ProjectFile } from '../types';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  File, 
  FileSpreadsheet, 
  FileArchive,
  Eye,
  Plus,
  Loader2,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';

interface DataStoryProps {
  hld: DesignDoc | null;
  lld: DesignDoc | null;
  files: ProjectFile[];
  onSaveDoc: (id: 'hld' | 'lld', content: string) => Promise<void>;
  onUploadFile: (docId: 'hld' | 'lld', file: File) => Promise<void>;
  onDeleteFile: (fileId: string) => Promise<void>;
}

export const DataStory: React.FC<DataStoryProps> = ({ 
  hld, 
  lld, 
  files, 
  onSaveDoc, 
  onUploadFile, 
  onDeleteFile 
}) => {
  const [activeDoc, setActiveDoc] = useState<'hld' | 'lld'>('hld');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const currentDoc = activeDoc === 'hld' ? hld : lld;
  const currentFiles = files.filter(f => f.docId === activeDoc);

  const handleStartEdit = () => {
    setEditContent(currentDoc?.content || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveDoc(activeDoc, editContent);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of acceptedFiles) {
        await onUploadFile(activeDoc, file);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  });

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes('word') || type.includes('document')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (type.includes('excel') || type.includes('sheet')) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header & Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Data Story</h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">Technical architecture and design documentation</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => { setActiveDoc('hld'); setIsEditing(false); }}
              className={cn(
                "px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                activeDoc === 'hld' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Layers className="w-4 h-4" />
              High-Level Design (HLD)
            </button>
            <button 
              onClick={() => { setActiveDoc('lld'); setIsEditing(false); }}
              className={cn(
                "px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                activeDoc === 'lld' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Layout className="w-4 h-4" />
              Low-Level Design (LLD)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Editor/Viewer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[600px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {activeDoc === 'hld' ? 'Architecture Overview' : 'Technical Specifications'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleStartEdit}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit Content
                  </button>
                )}
              </div>
            </div>

            <div className="flex-grow flex flex-col">
              {isEditing ? (
                <div className="flex-grow flex flex-col p-4">
                  <textarea 
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Enter documentation content using Markdown..."
                    className="flex-grow w-full p-4 text-sm font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                  />
                  <div className="mt-2 text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Markdown is supported for formatting.
                  </div>
                </div>
              ) : (
                <div className="p-8 prose prose-slate max-w-none">
                  {currentDoc?.content ? (
                    <div className="markdown-body">
                      <Markdown>{currentDoc.content}</Markdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-slate-200" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-2">No Content Yet</h4>
                      <p className="text-slate-500 max-w-xs mx-auto mb-6">
                        Start documenting the {activeDoc.toUpperCase()} for this project to keep your team aligned.
                      </p>
                      <button 
                        onClick={handleStartEdit}
                        className="text-blue-600 font-bold text-sm hover:underline"
                      >
                        Create Initial Draft
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {currentDoc && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Last updated: {format(currentDoc.updatedAt, 'MMM d, yyyy HH:mm')}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  By: {currentDoc.updatedBy}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Files & Resources */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-500" />
              Supporting Files
            </h4>
            
            <div 
              {...getRootProps()} 
              className={cn(
                "border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer mb-6",
                isDragActive ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50/50"
              )}
            >
              <input {...getInputProps()} />
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                {isUploading ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : <Plus className="w-5 h-5 text-blue-600" />}
              </div>
              <p className="text-xs font-bold text-slate-700 mb-1">
                {isUploading ? 'Uploading...' : 'Upload Resource'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                PDF, Word, or Excel files
              </p>
            </div>

            <div className="space-y-3">
              {currentFiles.length > 0 ? (
                currentFiles.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex-shrink-0">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">
                          {(file.size / 1024).toFixed(1)} KB • {format(file.uploadedAt, 'MMM d')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button 
                        onClick={() => onDeleteFile(file.id)}
                        className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <FileText className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400 font-medium">No files uploaded yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Design Review
            </h4>
            <p className="text-xs text-blue-100 leading-relaxed mb-4">
              Ensure your HLD and LLD are reviewed by the technical lead before moving to the development phase.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Ready for Review</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Layers = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const Layout = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
