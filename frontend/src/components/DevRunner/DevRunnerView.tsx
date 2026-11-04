import React, { useState } from 'react';
import { DevProject, ProjectService, SystemPort, AISettings } from '../../types';
import { AISettingsModal } from './AISettingsModal';
import { AIDiagnoseModal } from './AIDiagnoseModal';
import { ShareNetworkModal } from './ShareNetworkModal';
import { VercelDeployModal } from './VercelDeployModal';
import { CustomDomainModal } from './CustomDomainModal';
import { EnvVaultModal } from './EnvVaultModal';
import { WebhookInspectorModal } from './WebhookInspectorModal';
import { DatabaseViewerModal } from './DatabaseViewerModal';
import { OpenAPIDocModal } from './OpenAPIDocModal';
import { MultiCloudDeployModal } from './MultiCloudDeployModal';
import { 
  Play, 
  Square, 
  RotateCw, 
  Terminal, 
  Plus, 
  AlertCircle, 
  Copy, 
  Check, 
  Trash2, 
  Code, 
  Box, 
  ExternalLink, 
  Flame,
  Folder, 
  GitBranch, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  ArrowLeft, 
  ChevronRight, 
  Search, 
  Wand2, 
  Share2, 
  Globe, 
  KeyRound, 
  Webhook, 
  Database, 
  FileCode, 
  UploadCloud 
} from 'lucide-react';
import { 
  LiquidGlassCard, 
  LiquidGlassButton, 
  LiquidGlassBadge, 
  LiquidGlassInput, 
  LiquidGlassTabs, 
  LiquidGlassModal 
} from '../Glisse';

interface DevRunnerViewProps {
  projects: DevProject[];
  systemPorts: SystemPort[];
  aiSettings: AISettings;
  onUpdateAISettings: (newSettings: AISettings) => void;
  onStartService: (projectId: string, serviceId: string) => void;
  onStopService: (projectId: string, serviceId: string) => void;
  onRestartService: (projectId: string, serviceId: string) => void;
  onStartAllProjectServices: (projectId: string) => void;
  onStopAllProjectServices: (projectId: string) => void;
  onAddProject: (project: Omit<DevProject, 'id' | 'createdAt'>) => void;
  onClearLogs: (projectId: string, serviceId?: string) => void;
  onUpdateProjectVercel?: (projectId: string, url: string) => void;
}

export const DevRunnerView: React.FC<DevRunnerViewProps> = ({
  projects,
  systemPorts,
  aiSettings,
  onUpdateAISettings,
  onStartService,
  onStopService,
  onRestartService,
  onStartAllProjectServices,
  onStopAllProjectServices,
  onAddProject,
  onClearLogs,
  onUpdateProjectVercel
}) => {
  // Navigation: null = Projects Directory (Page 1), id = Project Detail View (Page 2)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [selectedServiceTab, setSelectedServiceTab] = useState<string>('all');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  
  // Modals
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isAISettingsModalOpen, setIsAISettingsModalOpen] = useState(false);
  const [isAIDiagnoseOpen, setIsAIDiagnoseOpen] = useState(false);
  const [serviceToShare, setServiceToShare] = useState<ProjectService | null>(null);
  const [projectToDeployVercel, setProjectToDeployVercel] = useState<DevProject | null>(null);
  const [serviceForCustomDomain, setServiceForCustomDomain] = useState<ProjectService | null>(null);
  const [isEnvVaultOpen, setIsEnvVaultOpen] = useState(false);
  const [isWebhookInspectorOpen, setIsWebhookInspectorOpen] = useState(false);
  const [isDatabaseViewerOpen, setIsDatabaseViewerOpen] = useState(false);
  const [isOpenAPIDocOpen, setIsOpenAPIDocOpen] = useState(false);
  const [isMultiCloudDeployOpen, setIsMultiCloudDeployOpen] = useState(false);

  const [copiedLog, setCopiedLog] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  // Add Project Wizard state
  const [addMode, setAddMode] = useState<'local' | 'github' | 'prompt'>('local');
  const [localPath, setLocalPath] = useState('/Users/den/Documents/projects/my-new-app');
  const [githubUrl, setGithubUrl] = useState('https://github.com/developer/fullstack-app.git');
  const [promptText, setPromptText] = useState('Run a Django REST API backend on port 8000 with PostgreSQL, and Vite React frontend on port 3000');
  const [analyzedPreview, setAnalyzedPreview] = useState<{
    name: string;
    description: string;
    frameworks: string[];
    filesFound: string[];
    services: Omit<ProjectService, 'id' | 'status' | 'logs'>[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'node':
        return { container: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20', icon: <Code className="w-3.5 h-3.5" /> };
      case 'django':
        return { container: 'bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20', icon: <Flame className="w-3.5 h-3.5" /> };
      case 'docker':
        return { container: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20', icon: <Box className="w-3.5 h-3.5" /> };
      default:
        return { container: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20', icon: <Terminal className="w-3.5 h-3.5" /> };
    }
  };

  const getSourceBadge = (source: DevProject['sourceType']) => {
    switch (source) {
      case 'local_folder':
        return { label: 'Local Folder', icon: <Folder className="w-3 h-3 text-blue-500" /> };
      case 'github_repo':
        return { label: 'GitHub Repo', icon: <GitBranch className="w-3 h-3 text-indigo-500" /> };
      case 'custom_instructions':
        return { label: 'Custom Prompt', icon: <Sparkles className="w-3 h-3 text-amber-500" /> };
    }
  };

  // Run automated analysis on project source using active AI engine
  const handleAnalyzeSource = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      if (addMode === 'local') {
        const folderName = localPath.split('/').filter(Boolean).pop() || 'Detected Project';
        setAnalyzedPreview({
          name: folderName.toUpperCase(),
          description: `Auto-inspected project in ${localPath} via ${aiSettings.provider} (${aiSettings.model})`,
          frameworks: ['Next.js 15', 'Node.js v24', 'Tailwind CSS'],
          filesFound: ['package.json', 'next.config.js', 'postcss.config.js'],
          services: [
            {
              name: 'Next.js Dev Server',
              category: 'node',
              command: 'npm run dev',
              cwd: localPath,
              port: 3000
            }
          ]
        });
      } else if (addMode === 'github') {
        const repoName = githubUrl.split('/').pop()?.replace('.git', '') || 'Cloned Repository';
        setAnalyzedPreview({
          name: repoName,
          description: `Cloned from ${githubUrl} via ${aiSettings.provider}`,
          frameworks: ['Django 5.1', 'Python 3.15', 'Docker Compose', 'PostgreSQL'],
          filesFound: ['manage.py', 'requirements.txt', 'docker-compose.yml'],
          services: [
            {
              name: 'Django Web Server',
              category: 'django',
              command: 'python manage.py runserver 0.0.0.0:8000',
              cwd: `/Users/den/Documents/projects/${repoName}`,
              port: 8000
            },
            {
              name: 'PostgreSQL Database',
              category: 'docker',
              command: 'docker compose up -d postgres',
              cwd: `/Users/den/Documents/projects/${repoName}`,
              port: 5432
            }
          ]
        });
      } else {
        setAnalyzedPreview({
          name: 'Custom Service Stack',
          description: promptText,
          frameworks: [`Synthesized by ${aiSettings.model}`, 'FastAPI', 'Vite'],
          filesFound: ['user_instructions.md'],
          services: [
            {
              name: 'Backend API Server',
              category: 'python',
              command: 'uvicorn main:app --port 8000 --reload',
              port: 8000
            },
            {
              name: 'Frontend Client',
              category: 'node',
              command: 'npm run dev',
              port: 3000
            }
          ]
        });
      }
      setIsAnalyzing(false);
    }, 900);
  };

  const handleSaveAnalyzedProject = () => {
    if (!analyzedPreview) return;

    const newProjectServices: ProjectService[] = analyzedPreview.services.map((svc, idx) => ({
      ...svc,
      id: `svc-${Date.now()}-${idx}`,
      status: 'stopped',
      logs: [
        {
          timestamp: new Date().toLocaleTimeString(),
          type: 'system',
          message: `Configured service "${svc.name}". Ready to launch.`
        }
      ]
    }));

    onAddProject({
      name: analyzedPreview.name,
      description: analyzedPreview.description,
      sourceType: addMode === 'local' ? 'local_folder' : addMode === 'github' ? 'github_repo' : 'custom_instructions',
      path: addMode === 'local' ? localPath : addMode === 'github' ? `/Users/den/Documents/projects/${analyzedPreview.name}` : '/Users/den/Documents/custom',
      githubUrl: addMode === 'github' ? githubUrl : undefined,
      customInstructions: addMode === 'prompt' ? promptText : undefined,
      detectedStack: {
        frameworks: analyzedPreview.frameworks,
        runtimes: ['Node.js', 'Python'],
        filesFound: analyzedPreview.filesFound
      },
      services: newProjectServices
    });

    setIsAddProjectModalOpen(false);
    setAnalyzedPreview(null);
  };

  const copyAllLogs = () => {
    if (!activeProject) return;
    const servicesToCollect = selectedServiceTab === 'all'
      ? activeProject.services
      : activeProject.services.filter(s => s.id === selectedServiceTab);
    
    const allLogs = servicesToCollect.flatMap(s => s.logs.map(l => `[${s.name}] [${l.timestamp}] ${l.message}`));
    navigator.clipboard.writeText(allLogs.join('\n'));
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const copyProjectPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const checkPortConflict = (port?: number, serviceStatus?: string) => {
    if (!port || serviceStatus === 'running') return null;
    return systemPorts.find(p => p.port === port);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
    p.detectedStack.frameworks.some(f => f.toLowerCase().includes(projectSearchQuery.toLowerCase()))
  );

  const totalServices = projects.reduce((acc, p) => acc + p.services.length, 0);
  const activeServices = projects.reduce((acc, p) => acc + p.services.filter(s => s.status === 'running').length, 0);

  // Filter logs for the active project
  const displayLogs = activeProject
    ? (selectedServiceTab === 'all'
        ? activeProject.services.flatMap(s => s.logs.map(l => ({ ...l, serviceName: s.name })))
        : activeProject.services.find(s => s.id === selectedServiceTab)?.logs.map(l => ({ ...l, serviceName: '' })) || [])
    : [];

  const activeServiceObj = activeProject?.services.find(s => s.id === selectedServiceTab) || activeProject?.services[0];

  return (
    <div className="space-y-6">
      {/* =========================================================================
          PAGE 1: PROJECTS DIRECTORY (Visible when activeProjectId is null)
          ========================================================================= */}
      {!activeProject ? (
        <div className="space-y-5">
          {/* Top Bar: Title, AI Settings, & Import Project */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                <Layers className="w-5 h-5 text-blue-500 dark:text-sky-400" />
                Dev Projects ({projects.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Launch and monitor local dev services, live terminal output, tunnels, and cloud deployments.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* AI Engine Status Button */}
              <LiquidGlassButton
                variant="glass"
                size="md"
                onClick={() => setIsAISettingsModalOpen(true)}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-sky-400" />}
                rightIcon={<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                title="Configure AI API Settings"
              >
                <span>AI: <strong className="capitalize">{aiSettings.provider}</strong> ({aiSettings.model})</span>
              </LiquidGlassButton>

              <LiquidGlassBadge variant="neutral">
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{activeServices}</strong> of {totalServices} active
              </LiquidGlassBadge>

              <LiquidGlassButton
                variant="primary"
                size="md"
                onClick={() => {
                  setAnalyzedPreview(null);
                  setIsAddProjectModalOpen(true);
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Project
              </LiquidGlassButton>
            </div>
          </div>

          {/* Search bar */}
          <div className="max-w-sm">
            <LiquidGlassInput
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={projectSearchQuery}
              onChange={(e) => setProjectSearchQuery(e.target.value)}
              onClear={() => setProjectSearchQuery('')}
              placeholder="Search projects or tech stack..."
            />
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => {
              const runningCount = project.services.filter(s => s.status === 'running').length;
              const sourceBadge = getSourceBadge(project.sourceType);

              return (
                <LiquidGlassCard
                  key={project.id}
                  interactive
                  onClick={() => {
                    setActiveProjectId(project.id);
                    setSelectedServiceTab('all');
                  }}
                  className="p-5 flex flex-col justify-between group"
                >
                  <div>
                    {/* Source tag & status pill */}
                    <div className="flex items-center justify-between gap-2">
                      <LiquidGlassBadge variant="neutral">
                        <span className="flex items-center gap-1.5">
                          {sourceBadge.icon}
                          <span>{sourceBadge.label}</span>
                        </span>
                      </LiquidGlassBadge>

                      {project.vercelDeployment ? (
                        <a
                          href={project.vercelDeployment.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-black text-white border border-white/20 hover:border-white/50"
                        >
                          <span>▲ Live Vercel</span>
                        </a>
                      ) : runningCount > 0 ? (
                        <LiquidGlassBadge variant="success" dot pulse>
                          {runningCount}/{project.services.length} active
                        </LiquidGlassBadge>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400">
                          {project.services.length} Services
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base mt-3 group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors tracking-tight">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Services Pill Preview */}
                    <div className="mt-3.5 space-y-1.5">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Services:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {project.services.map(svc => (
                          <span
                            key={svc.id}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono inline-flex items-center gap-1 border ${
                              svc.status === 'running'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-black/[0.03] dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 border-black/[0.05] dark:border-white/[0.06]'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${svc.status === 'running' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <span>{svc.name.split(' ')[0]}</span>
                            {svc.port && <span className="opacity-70">:{svc.port}</span>}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tech Stack Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-3.5">
                      {project.detectedStack.frameworks.map(fw => (
                        <span key={fw} className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/[0.03] dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 border border-black/[0.05] dark:border-white/[0.06]">
                          {fw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer: Run All + Open Project Button */}
                  <div className="mt-5 pt-3.5 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {runningCount < project.services.length ? (
                        <LiquidGlassButton
                          variant="glass"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartAllProjectServices(project.id);
                          }}
                          leftIcon={<Play className="w-3 h-3 fill-current text-emerald-500" />}
                        >
                          Run All
                        </LiquidGlassButton>
                      ) : (
                        <LiquidGlassButton
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStopAllProjectServices(project.id);
                          }}
                          leftIcon={<Square className="w-3 h-3 fill-current" />}
                        >
                          Stop All
                        </LiquidGlassButton>
                      )}
                    </div>

                    <LiquidGlassButton
                      variant="glass"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveProjectId(project.id);
                        setSelectedServiceTab('all');
                      }}
                      rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      Open Project
                    </LiquidGlassButton>
                  </div>
                </LiquidGlassCard>
              );
            })}
          </div>
        </div>
      ) : (
        /* =========================================================================
           PAGE 2: DEDICATED PROJECT DETAIL VIEW (Opened after clicking project)
           ========================================================================= */
        <div className="space-y-5">
          {/* Top Breadcrumb & Control Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <LiquidGlassButton
                variant="glass"
                size="sm"
                onClick={() => setActiveProjectId(null)}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Projects
              </LiquidGlassButton>

              <span className="text-slate-400">/</span>

              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{activeProject.name}</h2>
                {getSourceBadge(activeProject.sourceType).icon}
              </div>
            </div>

            {/* Quick Actions & Cloud Deployments for This Project */}
            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <LiquidGlassButton
                variant="glass"
                size="sm"
                onClick={() => setProjectToDeployVercel(activeProject)}
                leftIcon={
                  <svg viewBox="0 0 116 100" className="w-3 h-3 fill-current">
                    <path d="M57.5 0L115 100H0L57.5 0z" />
                  </svg>
                }
              >
                Deploy to Vercel
              </LiquidGlassButton>

              <LiquidGlassButton
                variant="glass"
                size="sm"
                onClick={() => setIsAISettingsModalOpen(true)}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-sky-400" />}
              >
                AI: {aiSettings.model}
              </LiquidGlassButton>

              <LiquidGlassButton
                variant="primary"
                size="sm"
                onClick={() => onStartAllProjectServices(activeProject.id)}
                leftIcon={<Play className="w-3 h-3 fill-current" />}
              >
                Run All
              </LiquidGlassButton>

              <LiquidGlassButton
                variant="danger"
                size="sm"
                onClick={() => onStopAllProjectServices(activeProject.id)}
                leftIcon={<Square className="w-3 h-3 fill-current" />}
              >
                Stop All
              </LiquidGlassButton>
            </div>
          </div>

          {/* Project Path & Stack Sub-bar */}
          <LiquidGlassCard className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 truncate">
              <span className="text-slate-400">Directory:</span>
              <span className="text-slate-800 dark:text-slate-200 truncate font-semibold">{activeProject.path}</span>
              <button
                onClick={() => copyProjectPath(activeProject.path)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
                title="Copy Path"
              >
                {copiedPath ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {activeProject.vercelDeployment && (
                <a
                  href={activeProject.vercelDeployment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 font-bold inline-flex items-center gap-1"
                >
                  <span>▲ Vercel: {activeProject.vercelDeployment.url.replace('https://', '')}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
              {activeProject.detectedStack.frameworks.map(f => (
                <span key={f} className="px-2 py-0.5 rounded text-[10px] bg-black/[0.04] dark:bg-white/[0.06] text-slate-700 dark:text-slate-300">
                  {f}
                </span>
              ))}
            </div>
          </LiquidGlassCard>

          {/* Dev Supercharger Toolbar: .env Vault, Webhooks, Databases */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <LiquidGlassButton
                variant="glass"
                size="sm"
                onClick={() => setIsEnvVaultOpen(true)}
                leftIcon={<KeyRound className="w-3.5 h-3.5 text-emerald-500" />}
              >
                .env Vault
              </LiquidGlassButton>

              <LiquidGlassButton
                variant="glass"
                size="sm"
                onClick={() => setIsWebhookInspectorOpen(true)}
                leftIcon={<Webhook className="w-3.5 h-3.5 text-purple-500" />}
              >
                Webhooks Relay
              </LiquidGlassButton>

              <LiquidGlassButton
                variant="glass"
                size="sm"
                onClick={() => setIsDatabaseViewerOpen(true)}
                leftIcon={<Database className="w-3.5 h-3.5 text-cyan-500" />}
              >
                Database Viewer
              </LiquidGlassButton>

              <LiquidGlassButton
                variant="glass"
                size="sm"
                onClick={() => setIsOpenAPIDocOpen(true)}
                leftIcon={<FileCode className="w-3.5 h-3.5 text-blue-500" />}
              >
                OpenAPI Docs
              </LiquidGlassButton>

              <LiquidGlassButton
                variant="glass"
                size="sm"
                onClick={() => setIsMultiCloudDeployOpen(true)}
                leftIcon={<UploadCloud className="w-3.5 h-3.5 text-indigo-500" />}
              >
                Multi-Cloud Deploy
              </LiquidGlassButton>
            </div>

            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              Supercharger Active: SSL + Secrets + Relay
            </span>
          </div>

          {/* Split Layout: Services Left + macOS Terminal Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Panel: PROJECT SERVICES */}
            <div className="lg:col-span-5 space-y-3">
              <LiquidGlassCard className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Services ({activeProject.services.length})
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 truncate max-w-[180px]" title={activeProject.path}>
                    {activeProject.path}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeProject.services.map(service => {
                    const portConflict = checkPortConflict(service.port, service.status);
                    const badge = getCategoryBadge(service.category);

                    return (
                      <div
                        key={service.id}
                        className="bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.07] rounded-xl p-3.5 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg ${badge.container} flex items-center justify-center shrink-0`}>
                              {badge.icon}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white text-xs tracking-tight">{service.name}</h4>
                              <span className="text-[11px] font-mono text-slate-400">
                                {service.port ? `Port :${service.port}` : 'Daemon Worker'}
                              </span>
                            </div>
                          </div>

                          <div>
                            {service.status === 'running' ? (
                              <LiquidGlassBadge variant="success" dot pulse>
                                Running
                              </LiquidGlassBadge>
                            ) : (
                              <LiquidGlassBadge variant="neutral">
                                Stopped
                              </LiquidGlassBadge>
                            )}
                          </div>
                        </div>

                        {/* Command box */}
                        <div className="bg-slate-900 dark:bg-[#050914] border border-black/[0.08] dark:border-white/[0.06] rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-200 flex items-center justify-between">
                          <span className="truncate pr-2">{service.command}</span>
                        </div>

                        {/* Port conflict alert & Smart 1-Click Rebind */}
                        {portConflict && (
                          <div className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-600 dark:text-rose-300 flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 truncate">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="truncate">Port {service.port} occupied by {portConflict.processName} (PID {portConflict.pid})</span>
                            </div>
                            <button
                              onClick={() => {
                                const newP = (service.port || 3000) + 1;
                                service.port = newP;
                                service.command = service.command.replace(/--port \d+|:\d+|-p \d+/, `--port ${newP}`);
                              }}
                              className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] shrink-0 active:scale-95 transition-all shadow-sm"
                              title="Automatically assign next free listening port"
                            >
                              ⚡ Rebind to :{(service.port || 3000) + 1}
                            </button>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="pt-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {service.status !== 'running' ? (
                              <LiquidGlassButton
                                variant="glass"
                                size="sm"
                                onClick={() => onStartService(activeProject.id, service.id)}
                                leftIcon={<Play className="w-3 h-3 fill-current text-emerald-500" />}
                              >
                                Start
                              </LiquidGlassButton>
                            ) : (
                              <LiquidGlassButton
                                variant="danger"
                                size="sm"
                                onClick={() => onStopService(activeProject.id, service.id)}
                                leftIcon={<Square className="w-3 h-3 fill-current" />}
                              >
                                Stop
                              </LiquidGlassButton>
                            )}

                            <LiquidGlassButton
                              variant="glass"
                              size="sm"
                              onClick={() => onRestartService(activeProject.id, service.id)}
                              leftIcon={<RotateCw className="w-3 h-3" />}
                              title="Restart service"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            {service.status === 'running' && (
                              <LiquidGlassButton
                                variant="glass"
                                size="sm"
                                onClick={() => setServiceToShare(service)}
                                leftIcon={<Share2 className="w-3 h-3 text-blue-500" />}
                              >
                                Share
                              </LiquidGlassButton>
                            )}

                            {service.port && (
                              <LiquidGlassButton
                                variant="glass"
                                size="sm"
                                onClick={() => setServiceForCustomDomain(service)}
                                leftIcon={<Globe className="w-3 h-3 text-blue-500" />}
                              >
                                {service.customDomain?.enabled ? service.customDomain.domain : 'SSL'}
                              </LiquidGlassButton>
                            )}

                            {service.port && service.status === 'running' && (
                              <a
                                href={`http://localhost:${service.port}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 font-mono pl-1"
                              >
                                <span>:{service.port}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </LiquidGlassCard>
            </div>

            {/* Right Panel: macOS Terminal with AI Diagnose Button */}
            <LiquidGlassCard className="lg:col-span-7 overflow-hidden flex flex-col h-[460px] sm:h-[540px] p-0">
              {/* Terminal Titlebar with Service Tabs & AI Diagnose Button */}
              <div className="bg-black/[0.03] dark:bg-white/[0.04] border-b border-black/[0.06] dark:border-white/[0.08] px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  
                  {/* Service Tab Selectors */}
                  <div className="flex items-center gap-1 ml-1.5 sm:ml-3 bg-black/[0.04] dark:bg-black/40 p-0.5 rounded-lg border border-black/[0.06] dark:border-white/[0.06] overflow-x-auto max-w-[150px] sm:max-w-none no-scrollbar touch-pan-x">
                    <button
                      onClick={() => setSelectedServiceTab('all')}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        selectedServiceTab === 'all'
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      All Services
                    </button>
                    {activeProject.services.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedServiceTab(s.id)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors truncate max-w-[130px] ${
                          selectedServiceTab === s.id
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <LiquidGlassButton
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAIDiagnoseOpen(true)}
                    leftIcon={<Wand2 className="w-3.5 h-3.5 text-white" />}
                  >
                    AI Diagnose
                  </LiquidGlassButton>

                  <LiquidGlassButton
                    variant="glass"
                    size="sm"
                    onClick={copyAllLogs}
                    leftIcon={copiedLog ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    title="Copy Terminal Logs"
                  />
                  <LiquidGlassButton
                    variant="glass"
                    size="sm"
                    onClick={() => onClearLogs(activeProject.id, selectedServiceTab === 'all' ? undefined : selectedServiceTab)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    title="Clear Logs"
                  />
                </div>
              </div>

              {/* Terminal Screen Body */}
              <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1 bg-slate-950/95 dark:bg-[#050914]/95 text-slate-200">
                {displayLogs.length > 0 ? (
                  displayLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="text-slate-500 select-none text-[11px] shrink-0">{log.timestamp}</span>
                      {log.serviceName && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.08] text-sky-300 shrink-0 border border-white/[0.08]">
                          {log.serviceName}
                        </span>
                      )}
                      <span
                        className={
                          log.type === 'stderr'
                            ? 'text-rose-400 font-medium'
                            : log.type === 'system'
                            ? 'text-sky-300 font-semibold'
                            : 'text-slate-200'
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center">
                    <Terminal className="w-8 h-8 mb-2 opacity-40 text-blue-400" />
                    <p>No active logs for this service.</p>
                    <p className="text-[11px] mt-1 text-slate-600">Start the service or click &quot;Run All Services&quot;.</p>
                  </div>
                )}
              </div>

              {/* Terminal Footer */}
              <div className="bg-black/[0.03] dark:bg-white/[0.04] border-t border-black/[0.06] dark:border-white/[0.08] px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-300">
                <span>{activeProject.name}</span>
                <span className="text-emerald-500 font-semibold">WebSocket Connected</span>
              </div>
            </LiquidGlassCard>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {isAddProjectModalOpen && (
        <LiquidGlassModal
          isOpen={isAddProjectModalOpen}
          onClose={() => setIsAddProjectModalOpen(false)}
          title="Import & Configure Dev Project"
          subtitle="Point to a local folder, clone from GitHub, or describe stack with AI"
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            {/* Source Mode Switcher Tabs */}
            <LiquidGlassTabs
              value={addMode}
              onChange={(val) => {
                setAddMode(val as 'local' | 'github' | 'prompt');
                setAnalyzedPreview(null);
              }}
              size="md"
              className="w-full flex justify-center"
              options={[
                { id: 'local', label: 'Local Folder', icon: <Folder className="w-3.5 h-3.5" /> },
                { id: 'github', label: 'GitHub Clone', icon: <GitBranch className="w-3.5 h-3.5" /> },
                { id: 'prompt', label: 'Custom Prompt', icon: <Sparkles className="w-3.5 h-3.5" /> }
              ]}
            />

            {/* Input by Mode */}
            <div className="space-y-3">
              {addMode === 'local' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Local Directory Path</label>
                  <LiquidGlassInput
                    placeholder="/Users/den/Documents/projects/my-api"
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    className="font-mono"
                  />
                  <span className="text-[11px] text-slate-400 block pt-1">
                    Net GUI will automatically inspect package.json, manage.py, and requirements.txt.
                  </span>
                </div>
              )}

              {addMode === 'github' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">GitHub Repository URL</label>
                  <LiquidGlassInput
                    placeholder="https://github.com/organization/repository.git"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="font-mono"
                  />
                  <span className="text-[11px] text-slate-400 block pt-1">
                    Will be cloned into your workspace and mapped to execution commands.
                  </span>
                </div>
              )}

              {addMode === 'prompt' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Custom Running Instructions</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Start Next.js frontend on port 3000, Django backend on port 8000, and Docker compose for Redis"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                  <span className="text-[11px] text-slate-400 block pt-1">
                    AI engine converts your natural language description into executable daemon commands.
                  </span>
                </div>
              )}

              {/* Trigger Inspection Button */}
              {!analyzedPreview && (
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    AI Engine: <strong className="text-slate-700 dark:text-slate-200">{aiSettings.model}</strong>
                  </span>

                  <LiquidGlassButton
                    variant="primary"
                    size="md"
                    onClick={handleAnalyzeSource}
                    isLoading={isAnalyzing}
                    leftIcon={!isAnalyzing ? <ArrowRight className="w-3.5 h-3.5" /> : undefined}
                  >
                    {isAnalyzing ? 'Analyzing with AI...' : 'Inspect & Extract Commands'}
                  </LiquidGlassButton>
                </div>
              )}
            </div>

            {/* Inspection Results Box */}
            {analyzedPreview && (
              <LiquidGlassCard className="p-4 space-y-3 border-blue-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600 dark:text-sky-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Inspection Complete
                  </span>
                  <div className="flex items-center gap-1.5">
                    {analyzedPreview.frameworks.map(f => (
                      <LiquidGlassBadge key={f} variant="neutral">
                        {f}
                      </LiquidGlassBadge>
                    ))}
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-slate-400">Project:</span>{' '}
                  <strong className="text-slate-900 dark:text-white">{analyzedPreview.name}</strong>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Found files: {analyzedPreview.filesFound.join(', ')}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.08]">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block">Extracted Services & Ports:</span>
                  {analyzedPreview.services.map((svc, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-black/40 border border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-xs font-mono">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{svc.name}</p>
                        <span className="text-slate-400 text-[11px]">{svc.command}</span>
                      </div>
                      {svc.port && (
                        <LiquidGlassBadge variant="info">
                          :{svc.port}
                        </LiquidGlassBadge>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.08]">
                  <LiquidGlassButton
                    variant="glass"
                    size="sm"
                    onClick={() => setAnalyzedPreview(null)}
                  >
                    Re-analyze
                  </LiquidGlassButton>
                  <LiquidGlassButton
                    variant="primary"
                    size="sm"
                    onClick={handleSaveAnalyzedProject}
                  >
                    Confirm & Add to Projects
                  </LiquidGlassButton>
                </div>
              </LiquidGlassCard>
            )}
          </div>
        </LiquidGlassModal>
      )}

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={isAISettingsModalOpen}
        onClose={() => setIsAISettingsModalOpen(false)}
        settings={aiSettings}
        onSave={onUpdateAISettings}
      />

      {/* AI Diagnose Modal */}
      <AIDiagnoseModal
        isOpen={isAIDiagnoseOpen}
        onClose={() => setIsAIDiagnoseOpen(false)}
        service={activeServiceObj}
        logs={displayLogs}
        aiSettings={aiSettings}
        onApplyFix={(_cmd) => {
          if (activeProject && activeServiceObj) {
            onRestartService(activeProject.id, activeServiceObj.id);
          }
        }}
      />

      {/* Share Localhost Across Network Modal */}
      {serviceToShare && (
        <ShareNetworkModal
          isOpen={!!serviceToShare}
          onClose={() => setServiceToShare(null)}
          service={serviceToShare}
          hostIp="192.168.1.105"
        />
      )}

      {/* Deploy to Vercel Modal */}
      {projectToDeployVercel && (
        <VercelDeployModal
          isOpen={!!projectToDeployVercel}
          onClose={() => setProjectToDeployVercel(null)}
          project={projectToDeployVercel}
          onDeploySuccess={(projId, url) => {
            if (onUpdateProjectVercel) {
              onUpdateProjectVercel(projId, url);
            }
          }}
        />
      )}

      {/* Local Custom Domain & SSL Modal */}
      {serviceForCustomDomain && (
        <CustomDomainModal
          isOpen={!!serviceForCustomDomain}
          onClose={() => setServiceForCustomDomain(null)}
          service={serviceForCustomDomain}
          onSaveDomain={(domain, enabled) => {
            if (activeProject) {
              serviceForCustomDomain.customDomain = {
                enabled,
                domain,
                targetPort: serviceForCustomDomain.port || 3000,
                sslActive: true,
                certExpiry: '364 days remaining'
              };
            }
          }}
        />
      )}

      {/* .env Secrets Vault Modal */}
      {activeProject && isEnvVaultOpen && (
        <EnvVaultModal
          isOpen={isEnvVaultOpen}
          onClose={() => setIsEnvVaultOpen(false)}
          project={activeProject}
          onSaveEnv={(_projId, envs) => {
            activeProject.envVariables = envs;
          }}
        />
      )}

      {/* Webhook Inspector & Replayer Modal */}
      {activeProject && isWebhookInspectorOpen && (
        <WebhookInspectorModal
          isOpen={isWebhookInspectorOpen}
          onClose={() => setIsWebhookInspectorOpen(false)}
          project={activeProject}
        />
      )}

      {/* Database & Redis Micro-Viewer Modal */}
      {activeProject && isDatabaseViewerOpen && (
        <DatabaseViewerModal
          isOpen={isDatabaseViewerOpen}
          onClose={() => setIsDatabaseViewerOpen(false)}
          project={activeProject}
        />
      )}

      {/* OpenAPI / Swagger Playground Modal */}
      {activeProject && isOpenAPIDocOpen && (
        <OpenAPIDocModal
          isOpen={isOpenAPIDocOpen}
          onClose={() => setIsOpenAPIDocOpen(false)}
          project={activeProject}
        />
      )}

      {/* Multi-Cloud Deployment Modal (Railway / Fly.io / Vercel) */}
      {activeProject && isMultiCloudDeployOpen && (
        <MultiCloudDeployModal
          isOpen={isMultiCloudDeployOpen}
          onClose={() => setIsMultiCloudDeployOpen(false)}
          project={activeProject}
          onDeploySuccess={(_projId, plat, url) => {
            activeProject.cloudDeployment = {
              platform: plat,
              url,
              status: 'live',
              region: 'us-west (Oregon)'
            };
          }}
        />
      )}
    </div>
  );
};
