import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileUploadProps {
  onFileAnalyzed: (data: any) => void;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileAnalyzed, className }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setSuccess(false);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const { analyzeProjectFile } = await import('../services/geminiService');
        const result = await analyzeProjectFile(base64, file.type);
        onFileAnalyzed(result);
        setSuccess(true);
      };
      reader.onerror = () => setError('Failed to read file');
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [onFileAnalyzed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-10 transition-all cursor-pointer flex flex-col items-center justify-center text-center",
          isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50",
          isAnalyzing && "pointer-events-none opacity-60"
        )}
      >
        <input {...getInputProps()} />
        
        {isAnalyzing ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <div>
              <p className="text-lg font-medium text-slate-900">Analyzing Project File...</p>
              <p className="text-sm text-slate-500">Gemini is extracting tasks, milestones, and RAID items.</p>
            </div>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <div>
              <p className="text-lg font-medium text-slate-900">Analysis Complete!</p>
              <p className="text-sm text-slate-500">Project data has been extracted successfully.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-lg font-medium text-slate-900">
              {isDragActive ? "Drop the file here" : "Import Project File"}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Drag & drop your Word, Excel, or PDF project plan
            </p>
            <div className="mt-6 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> PDF</span>
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> DOCX</span>
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> XLSX</span>
            </div>
          </>
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
};
