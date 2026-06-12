import React, { useState } from 'react';
import { CloudUpload, FileText, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';


export default function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  
  const [uploadedFiles, setUploadedFiles] = useState([
    { id: 1, name: 'Q4_Financial_Report.csv', size: '2.4 MB', status: 'COMPLETED', progress: 100 },
    { id: 2, name: 'Customer_Feedback_Logs.json', size: '1.1 MB', status: 'PROCESSING', progress: 65 }
  ]);

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
   
  };

  const deleteFile = (id) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in font-sans">
      
      {/* ─── HEADER TYPOGRAPHY ─── */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Data Ingest Engine</h2>
        <p className="text-xs text-brand-muted mt-1.5">
          Ingest raw unstructured data into the secure Vector database. Supported formats: CSV, JSON, TXT, PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
       
        <div className="lg:col-span-7 space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center min-h-[350px] rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer bg-surface ${
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

        {/* ─── RIGHT: PROCESSING QUEUE STATUS ─── */}
        <div className="lg:col-span-5 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono mb-4">
              📦 Ingestion Control Queue
            </h4>
            
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="rounded-lg bg-[#0B0F19]/60 p-4 border border-gray-850/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-surface border border-gray-800 text-brand-primary shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                      <p className="text-[10px] text-brand-muted mt-0.5">{file.size}</p>
                      
                      
                      {file.status === 'PROCESSING' && (
                        <div className="w-full bg-gray-800 h-1 rounded-full mt-2 overflow-hidden">
                          <div className="bg-brand-primary h-full rounded-full transition-all duration-300" style={{ width: `${file.progress}%` }} />
                        </div>
                      )}
                    </div>
                  </div>

                
                  <div className="flex items-center gap-3 shrink-0">
                    {file.status === 'COMPLETED' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                        <CheckCircle2 size={10} /> INDEXED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
                        <AlertCircle size={10} /> CHUNKING ({file.progress}%)
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
                <p className="text-xs text-brand-muted text-center py-8">No files currently active in queue.</p>
              )}
            </div>
          </div>

          <button className="btn btn-sm w-full border-none bg-brand-primary text-black font-bold hover:bg-indigo-400 capitalize h-9 rounded-lg mt-4 cursor-pointer">
            Commit Pipeline to Vector DB
          </button>
        </div>

      </div>

    </div>
  );
}