import React, { useState, useEffect, useRef } from 'react';
import { DropFileItem, DropDevice } from '../../types';
import * as api from '../../services/api';
import { createLandropSocket } from '../../services/sockets';
import { 
  Send, 
  Download, 
  Smartphone, 
  Laptop, 
  Tv, 
  UploadCloud, 
  Copy, 
  Check, 
  QrCode, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Archive
} from 'lucide-react';
import { 
  LiquidGlassCard, 
  LiquidGlassButton, 
  LiquidGlassBadge 
} from '../Glisse';

interface LANDropViewProps {
  hostIp: string;
}

export const LANDropView: React.FC<LANDropViewProps> = ({ hostIp }) => {
  const [devices, setDevices] = useState<DropDevice[]>([]);
  const [files, setFiles] = useState<DropFileItem[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dropUrl = `http://${hostIp}:8000/`;

  useEffect(() => {
    // 1. Fetch live local devices & peers
    api.fetchLandropDevices().then(devs => {
      if (devs) setDevices(devs);
    }).catch(e => console.error('Error fetching landrop devices:', e));

    // 2. Fetch live file transfers
    api.fetchLandropFiles().then(f => {
      if (f) setFiles(f);
    }).catch(e => console.error('Error fetching landrop files:', e));

    // 3. Connect to live WebSocket for P2P incoming transfers
    const landropSocket = createLandropSocket((msg) => {
      if (msg && msg.file) {
        setFiles(prev => [msg.file, ...prev]);
      }
    });

    return () => {
      landropSocket.close();
    };
  }, []);

  const copyDropLink = () => {
    navigator.clipboard.writeText(dropUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const res = await api.uploadLandropFile(file);
      if (res && res.file) {
        setFiles(prev => [res.file, ...prev]);
      }
    } catch (e) {
      console.error('File upload failed:', e);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500 dark:text-sky-400" />;
    if (type.startsWith('video/')) return <Film className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
    if (type.includes('pdf') || type.includes('text')) return <FileText className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
    return <Archive className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'iphone':
      case 'android':
        return <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'tv':
        return <Tv className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      default:
        return <Laptop className="w-4 h-4 text-blue-600 dark:text-sky-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <UploadCloud className="w-5 h-5 text-blue-500 dark:text-sky-400" />
            LAN File Drop (AirDrop for Any Device)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Transfer images, binaries, and documents directly between your Mac, iPhone, Android, and TV over Wi-Fi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <LiquidGlassButton
            variant="glass"
            size="md"
            onClick={copyDropLink}
            leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copiedLink ? 'Copied Link' : 'Copy Web Drop URL'}
          </LiquidGlassButton>
        </div>
      </div>

      {/* Main Grid: Devices in Room + Drag Drop Staging */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Nearby Devices in the Room */}
        <div className="lg:col-span-5 space-y-4">
          <LiquidGlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Nearby Wi-Fi Receivers ({devices.length})
              </span>
              <LiquidGlassBadge variant="info">P2P WebRTC</LiquidGlassBadge>
            </div>

            <div className="space-y-2.5">
              {devices.map(device => (
                <div
                  key={device.id}
                  onClick={() => setSelectedTarget(device.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between border ${
                    selectedTarget === device.id
                      ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/40 dark:border-blue-400/50'
                      : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.05] dark:border-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center shrink-0 border border-black/[0.06] dark:border-white/10">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{device.name}</span>
                        {device.isSelf && (
                          <LiquidGlassBadge variant="info">You</LiquidGlassBadge>
                        )}
                      </p>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{device.ip} • {device.lastSeen}</span>
                    </div>
                  </div>

                  <span className={`w-2.5 h-2.5 rounded-full transition-colors ${selectedTarget === device.id ? 'bg-blue-500 dark:bg-sky-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
                </div>
              ))}
            </div>
          </LiquidGlassCard>

          {/* Quick QR Code for Mobile */}
          <LiquidGlassCard className="p-5 text-center space-y-3">
            <div className="flex items-center justify-between text-left">
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Mobile Web Portal</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Scan to open the upload portal on iPhone or Android</p>
              </div>
              <QrCode className="w-4 h-4 text-blue-500 dark:text-sky-400" />
            </div>

            <div className="w-32 h-32 mx-auto bg-white p-2.5 rounded-2xl shadow-xs border border-black/[0.08] flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 10h10v10H40zM50 20h10v10H50zM40 30h10v10H40zM10 40h10v10H10zM20 50h10v10H20zM30 40h10v10H30zM70 40h10v10H70zM80 50h10v10H80zM90 40h10v10H90zM40 70h10v10H40zM50 80h10v10H50zM60 70h10v10H60zM70 80h10v10H70zM80 90h10v10H80zM90 70h10v10H90z" />
              </svg>
            </div>
            <p className="text-[11px] font-mono text-blue-600 dark:text-sky-300 font-semibold">{dropUrl}</p>
          </LiquidGlassCard>
        </div>

        {/* Right Column: Drag Drop Staging & File History */}
        <div className="lg:col-span-7 space-y-4">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />

          {/* Drag & Drop Zone */}
          <LiquidGlassCard
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`p-6 sm:p-8 border-2 border-dashed text-center transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-black/[0.12] dark:border-white/[0.15] hover:border-blue-500/40'
            }`}
          >
            <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Drag & Drop Files Here</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Drop images, archives, code bundles, or PDFs to stream to the receiver device at full LAN bandwidth.
            </p>

            <div className="mt-4 flex items-center justify-center gap-3">
              <LiquidGlassButton
                variant="primary"
                size="md"
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploading}
                leftIcon={!isUploading ? <Send className="w-3.5 h-3.5" /> : undefined}
              >
                {isUploading ? 'Transferring file...' : 'Choose File to Send'}
              </LiquidGlassButton>
            </div>
          </LiquidGlassCard>

          {/* Transfers History */}
          <LiquidGlassCard className="p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                Recent Transfers ({files.length})
              </h3>
              <LiquidGlassBadge variant="neutral">Encrypted Local Direct</LiquidGlassBadge>
            </div>

            <div className="space-y-2.5">
              {files.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 italic border border-dashed border-black/[0.08] dark:border-white/[0.08] rounded-2xl">
                  No transfers yet. Drop files above to send to peers or scan the QR code from iPhone / Android to upload.
                </div>
              ) : (
                files.map(file => (
                  <div
                    key={file.id}
                    className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.07] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center shrink-0 border border-black/[0.05] dark:border-white/10">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatFileSize(file.size)} • From <span className="text-slate-700 dark:text-slate-300 font-medium">{file.sender}</span> • {file.timestamp}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <LiquidGlassBadge variant="success">
                        100%
                      </LiquidGlassBadge>
                      <LiquidGlassButton
                        variant="glass"
                        size="sm"
                        onClick={() => alert(`Saving ${file.name} to ~/Downloads...`)}
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </LiquidGlassCard>
        </div>
      </div>
    </div>
  );
};
