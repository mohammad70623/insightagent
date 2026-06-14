import React, { useState, useRef, useEffect } from 'react';
import { CloudUpload, FileText, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';


export default function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  
 
  const activeIntervalsRef = useRef({});
  const fileInputRef = useRef(null);

  
  useEffect(() => {
    return () => {
      Object.values(activeIntervalsRef.current).forEach(clearInterval);
    };
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const processFiles = (files) => {
    const fileList = Array.from(files);
    setErrorMessage(''); 
    
    fileList.forEach((file) => {
      
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage(`File "${file.name}" exceeds the 50MB enterprise limit.`);
        return;
      }

      
      const newFileId = window.crypto?.randomUUID ? crypto.randomUUID() : `file-${Date.now()}-${Math.random()}`;
      
      const newFileObject = {
        id: newFileId,
        name: file.name,
        size: formatFileSize(file.size),
        status: 'PROCESSING',
        progress: 0
      };

      setUploadedFiles((prev) => [newFileObject, ...prev]);

      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 15) + 5;
        
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          delete activeIntervalsRef.current[newFileId]; 
          
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === newFileId ? { ...f, progress: 100, status: 'COMPLETED' } : f
            )
          );
        } else {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === newFileId ? { ...f, progress: currentProgress } : f
            )
          );
        }
      }, 200);

     
      activeIntervalsRef.current[newFileId] = interval;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const triggerFileBrowser = () => {
    fileInputRef.current.click();
  };

  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerFileBrowser();
    }
  };

  const deleteFile = (id) => {
    if (activeIntervalsRef.current[id]) {
      clearInterval(activeIntervalsRef.current[id]);
      delete activeIntervalsRef.current[id];
    }
    setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in font-sans">
      
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden" 
        accept=".csv,.json,.txt,.pdf"
      />

    
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Data Ingest Engine</h2>
        <p className="text-xs text-brand-muted mt-1.5">
          Ingest raw unstructured data into the secure Vector database. Supported formats: CSV, JSON, TXT, PDF.
        </p>
      </div>

     
      {errorMessage && (
        <div className="alert alert-error bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl py-3 px-4 flex items-center gap-2 animate-fade-in">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
       
        <div className="lg:col-span-7 space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileBrowser}
            onKeyDown={handleKeyDown}
            
          
            role="button"
            tabIndex={0}
            aria-label="File dropzone. Click or press enter to upload datasets."
            
            className={`relative flex flex-col items-center justify-center min-h-[350px] rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer bg-surface select-none outline-none focus:border-brand-primary ${
              isDragging 
                ? 'border-brand-primary bg-brand-primary/5 shadow-[0_0_20px_rgba(129,140,248,0.1)]' 
                : 'border-gray-800/80 hover:border-brand-primary/40'
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0B0F19] border border-gray-800 shadow-md mb-4 text-brand-primary">
              <CloudUpload size={28} className={isDragging ? 'animate-bounce' : ''} />
            </div>
            
            <h3 className="text-sm font-bold text-white tracking-wide">
              Drag and drop your dataset here, or <span className="text-brand-primary hover:underline">browse files</span>
            </h3>
            <p className="text-[11px] text-brand-muted mt-1.5 max-w-xs">
              Files are automatically encrypted and chunked into optimized vector fragments for high-fidelity RAG lookup.
            </p>
            <span className="text-[10px] text-gray-600 font-mono mt-4">Max allocation size per transmission: 50MB</span>
          </div>
        </div>

       
        <div className="lg:col-span-5 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl flex flex-col justify-between min-h-[350px]">
          <div className="flex-1 overflow-y-auto max-h-[380px] pr-1">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono mb-4 sticky top-0 bg-surface pb-2">
              📦 Ingestion Control Queue ({uploadedFiles.length})
            </h4>
            
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="rounded-lg bg-[#0B0F19]/60 p-4 border border-gray-850/40 flex items-center justify-between gap-4 animate-fade-in">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-surface border border-gray-800 text-brand-primary shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate" title={file.name}>{file.name}</p>
                        <p className="text-[10px] text-brand-muted mt-0.5">{file.size}</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-800 h-1 rounded-full mt-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-200 ${
                          file.status === 'COMPLETED' ? 'bg-green-400' : 'bg-brand-primary'
                        }`} 
                        style={{ width: `${file.progress}%` }} 
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {file.status === 'COMPLETED' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                        <CheckCircle2 size={10} /> INDEXED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        <AlertCircle size={10} className="animate-spin" /> {file.progress}%
                      </span>
                    )}
                    <button 
                      onClick={() => deleteFile(file.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer p-1"
                      aria-label="Remove asset"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {uploadedFiles.length === 0 && (
                <div className="text-center py-12 border border-dashed border-gray-800 rounded-lg bg-[#0B0F19]/20">
                  <p className="text-xs text-brand-muted">No files currently active in session queue.</p>
                </div>
              )}
            </div>
          </div>

          <button 
            disabled={uploadedFiles.length === 0}
            className="btn btn-sm w-full border-none bg-brand-primary text-black font-bold hover:bg-indigo-400 capitalize h-9 rounded-lg mt-4 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Commit Pipeline to Vector DB
          </button>
        </div>

      </div>

    </div>
  );
}