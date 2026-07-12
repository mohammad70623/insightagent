import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api, apiService } from '../services/api';
import { Trash2 } from 'lucide-react';

// Status badge helper
const StatusBadge = ({ status, progress }) => {
  const map = {
    READY:    { label: '⟳ READY',                    cls: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
    INDEXING: { label: `⚡ INDEXING (${progress}%)`, cls: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
    INDEXED:  { label: '✓ INDEXED',                  cls: 'bg-green-500/20 text-green-400 border-green-500/40' },
    FAILED:   { label: '✗ FAILED',                   cls: 'bg-red-500/20 text-red-400 border-red-500/40' },
  };
  const { label, cls } = map[status] || map.READY;
  return (
    <span className={`px-2.5 py-1 rounded text-xs font-bold border ${cls}`}>{label}</span>
  );
};

const Upload = () => {
  const [queuedFiles, setQueuedFiles] = useState([]);    // Files staged for upload
  const [indexedFiles, setIndexedFiles] = useState([]);  // Files already in Qdrant
  const [isCommitting, setIsCommitting] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const clearTimers = useRef({});

  // Load indexed files from Qdrant on mount
  const fetchIndexedFiles = useCallback(async () => {
    setIsLoadingFiles(true);
    try {
      const data = await apiService.getUploadedFiles();
      setIndexedFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch indexed files:', err.message);
      // Gracefully handle 401s without crashing the router if the interceptor handles it
      if (!err.message.includes("Session expired")) {
        setErrorMessage("Could not load indexed files. Please try refreshing.");
      }
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    fetchIndexedFiles();
    // Cleanup timers on unmount to prevent memory leaks
    return () => Object.values(clearTimers.current).forEach(clearTimeout);
  }, [fetchIndexedFiles]);

  // Stage files for upload
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || e.dataTransfer?.files || []);
    if (!files.length) return;

    // Size check validation
    const invalidFile = files.find((file) => file.size > 10 * 1024 * 1024);
    if (invalidFile) {
      alert("⚠️ File Too Large: Maximum allowed file size is 10 MB. Please compress your document and try again.");
      e.target.value = '';
      return false;
    }

    const newEntries = files.map((file) => ({
      id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
      name: file.name,
      rawFile: file,
      status: 'READY',
      progress: 0,
    }));
    setQueuedFiles((prev) => [...prev, ...newEntries]);
    e.target.value = null; // Reset so same file can be re-selected
  };

  // Remove a staged file before committing
  const handleRemoveQueued = (id) => {
    setQueuedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Commit all READY files to Qdrant sequentially
  const handleCommitPipeline = async () => {
    const readyFiles = queuedFiles.filter((f) => f.status === 'READY');
    if (!readyFiles.length || isCommitting) return;

    setIsCommitting(true);
    setErrorMessage('');

    // We now use the central API instance

    for (const fileObj of readyFiles) {
      // Mark as INDEXING
      setQueuedFiles((prev) =>
        prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'INDEXING', progress: 0 } : f))
      );

      try {
        const formData = new FormData();
        formData.append('file', fileObj.rawFile);

        await api.post('/chat/index-payload', formData, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setQueuedFiles((prev) =>
              prev.map((f) =>
                f.id === fileObj.id
                  ? { ...f, progress: percentCompleted }
                  : f
              )
            );
          }
        });

        // Mark INDEXED, then auto-clear after 3 seconds and refresh list
        setQueuedFiles((prev) =>
          prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'INDEXED', progress: 100 } : f))
        );

        clearTimers.current[fileObj.id] = setTimeout(() => {
          setQueuedFiles((prev) => prev.filter((f) => f.id !== fileObj.id));
          delete clearTimers.current[fileObj.id];
          fetchIndexedFiles();
        }, 3000);

      } catch (err) {
        setQueuedFiles((prev) =>
          prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'FAILED', progress: 0 } : f))
        );
        const errorDetail = err.response?.data?.detail || err.message;
        setErrorMessage(`Failed to index "${fileObj.name}": ${errorDetail}`);
      }
    }

    setIsCommitting(false);
  };

  // Delete an indexed file's vectors from Qdrant
  const handleDeleteIndexed = async (documentId, filename) => {
    if (deletingId) return;
    setDeletingId(documentId);
    setErrorMessage('');
    try {
      await apiService.deleteFile(documentId);
      setIndexedFiles((prev) => prev.filter((f) => f.document_id !== documentId));
    } catch (err) {
      setErrorMessage(`Failed to delete "${filename}": ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const readyCount = queuedFiles.filter((f) => f.status === 'READY').length;

  return (
    <div className="p-6 bg-[#111827] min-h-screen text-gray-100 space-y-8">

      {/* ──────────────── INGESTION PANEL ──────────────── */}
      <div className="max-w-3xl mx-auto bg-[#1f2937] rounded-xl p-6 border border-gray-700 shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-[#38bdf8] flex items-center gap-2">
          📁 Upload Workspace Files
        </h2>

        {/* Drop Zone */}
        <label className="block border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-[#38bdf8] transition relative mb-6 cursor-pointer">
          <input
            type="file"
            multiple
            accept=".txt,.csv,.json,.pdf"
            onChange={handleFileSelect}
            disabled={isCommitting}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="pointer-events-none space-y-1">
            <div className="text-3xl">📂</div>
            <p className="text-sm text-gray-400">Drag & Drop or click to select files</p>
            <p className="text-xs text-gray-600">Supported: .txt, .csv, .json, .pdf</p>
            <p className="text-xs text-gray-500/75 mt-0.5 font-mono">Maximum file size allowed is 10 MB.</p>
          </div>
        </label>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4">
            <div className="bg-red-500/20 text-red-400 border border-red-500/50 p-3 rounded text-xs font-mono flex items-start gap-2">
              <span>⚠️</span>
              <span className="flex-1">{errorMessage}</span>
              <button onClick={() => setErrorMessage('')} className="font-bold hover:text-white ml-1 text-base leading-none">×</button>
            </div>
            {errorMessage.includes("PAYWALL_LIMIT_REACHED") && (
              <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-gray-300">
                  <span className="font-bold text-white block mb-0.5">⚠️ Subscription Ingestion Limit Reached!</span>
                  You have exceeded your plan's upload threshold. Upgrade or renew your subscription tier to continue indexing.
                </div>
                <a 
                  href="/app/billing" 
                  className="px-4 py-2 bg-[#38bdf8] hover:bg-[#7dd3fc] text-black font-bold rounded-lg text-xs transition-all shrink-0 no-underline inline-block text-center"
                >
                  Upgrade / Renew Plan
                </a>
              </div>
            )}
          </div>
        )}

        {/* Upload Queue */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Selected Files ({queuedFiles.length})
          </h3>
          {queuedFiles.length === 0 ? (
            <p className="text-sm text-gray-500 italic p-4 bg-[#111827] rounded border border-gray-800 text-center">
              No files staged. Select files above to begin.
            </p>
          ) : (
            queuedFiles.map((file) => (
              <div key={file.id} className="flex flex-col p-3.5 bg-[#111827] rounded border border-gray-700 font-mono text-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-gray-300 min-w-0">📄 {file.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={file.status} progress={file.progress} />
                    {file.status === 'READY' && (
                      <button
                        onClick={() => handleRemoveQueued(file.id)}
                        className="text-gray-600 hover:text-red-400 transition text-lg leading-none"
                        title="Remove from queue"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {(file.status === 'INDEXING' || file.status === 'INDEXED') && (
                  <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                        file.status === 'INDEXED' ? 'bg-green-500' : 'bg-[#38bdf8] animate-pulse'
                      }`}
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Commit Button */}
        <button
          onClick={handleCommitPipeline}
          disabled={isCommitting || readyCount === 0}
          className="w-full py-3 bg-[#38bdf8] hover:bg-[#7dd3fc] disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-bold rounded-lg transition tracking-wide text-sm shadow-lg cursor-pointer disabled:cursor-not-allowed"
        >
          {isCommitting
            ? '⚡ Saving Files...'
            : readyCount > 0
            ? `Save ${readyCount} File${readyCount > 1 ? 's' : ''} to Workspace`
            : 'Save Files to Workspace'}
        </button>
      </div>

      {/* ──────────────── INDEXED FILES PANEL ──────────────── */}
      <div className="max-w-3xl mx-auto bg-[#1f2937] rounded-xl p-6 border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-green-400 flex items-center gap-2">
            📑 Uploaded Documents
          </h2>
          <button
            onClick={fetchIndexedFiles}
            disabled={isLoadingFiles}
            className="text-xs text-gray-400 hover:text-white transition font-mono disabled:opacity-40 cursor-pointer"
          >
            {isLoadingFiles ? '⟳ Loading...' : '↻ Refresh'}
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-800 bg-[#111827]">
          {isLoadingFiles ? (
            <div className="p-6 text-center text-gray-500 text-sm animate-pulse font-mono">
              Loading indexed documents...
            </div>
          ) : indexedFiles.length === 0 ? (
            <p className="text-sm text-gray-500 italic p-6 text-center">
              No documents indexed yet. Upload a file above to begin.
            </p>
          ) : (
            <div className="divide-y divide-gray-800">
              {indexedFiles.map((file) => (
                <div
                  key={file.document_id}
                  className="flex items-center justify-between p-4 hover:bg-[#1f2937]/50 transition gap-3"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-200 truncate">
                      📄 {file.filename || 'Unknown File'}
                    </span>
                    {/* ID mapping commented out for clean corporate UX view */}
                  </div>
                  <button
                    onClick={() => handleDeleteIndexed(file.document_id, file.filename)}
                    disabled={deletingId === file.document_id}
                    className="shrink-0 px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {deletingId === file.document_id ? 'Deleting...' : (
                      <>
                        Delete <Trash2 size={14} className="inline-block ml-1" />
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;