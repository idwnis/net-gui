import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/Layout/AppLayout';
import { NetworkRadarView } from './components/NetworkRadar/NetworkRadarView';
import { LocalPortsView } from './components/LocalPorts/LocalPortsView';
import { DevRunnerView } from './components/DevRunner/DevRunnerView';
import { VpnGatewayView } from './components/VpnGateway/VpnGatewayView';
import { LANDropView } from './components/LANDrop/LANDropView';
import { APISnifferView } from './components/APISniffer/APISnifferView';
import { SystemMonitorView } from './components/SystemMonitor/SystemMonitorView';
import { AISwitchboardView } from './components/AISwitchboard/AISwitchboardView';
import { DomainWatchdogView } from './components/DomainWatchdog/DomainWatchdogView';
import { MOCK_DEVICES, MOCK_SYSTEM_PORTS, MOCK_PROJECTS } from './mock/data';
import { NetworkDevice, SystemPort, DevProject, AISettings } from './types';
import * as api from './services/api';

const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  autoAnalyzeOnImport: true,
  autoErrorAnalysis: true,
  temperature: 0.3
};

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'radar' | 'ports' | 'runner' | 'vpn' | 'drop' | 'sniffer' | 'system' | 'ai' | 'watchdog'>('runner');
  
  // State
  const [devices, setDevices] = useState<NetworkDevice[]>(MOCK_DEVICES);
  const [systemPorts, setSystemPorts] = useState<SystemPort[]>(MOCK_SYSTEM_PORTS);
  const [projects, setProjects] = useState<DevProject[]>(MOCK_PROJECTS);
  
  // AI Settings State (persisted in localStorage)
  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    try {
      const saved = localStorage.getItem('netgui_ai_settings') || localStorage.getItem('netpulse_ai_settings');
      return saved ? JSON.parse(saved) : DEFAULT_AI_SETTINGS;
    } catch {
      return DEFAULT_AI_SETTINGS;
    }
  });

  const handleUpdateAISettings = (newSettings: AISettings) => {
    setAiSettings(newSettings);
    try {
      localStorage.setItem('netgui_ai_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to persist AI settings', e);
    }
  };

  // Loading & Action states
  const [isScanningNetwork, setIsScanningNetwork] = useState(false);
  const [isLoadingPorts, setIsLoadingPorts] = useState(false);

  // Sync state with live Django Backend on initial mount
  useEffect(() => {
    api.fetchNetworkDevices().then(res => {
      if (res.devices && res.devices.length > 0) setDevices(res.devices);
    }).catch(e => console.debug('Backend offline, using mock devices:', e));

    api.fetchSystemPorts(true).then(res => {
      if (res.ports && res.ports.length > 0) setSystemPorts(res.ports);
    }).catch(e => console.debug('Backend offline, using mock ports:', e));

    api.fetchProjects().then(projs => {
      if (projs && projs.length > 0) setProjects(projs);
    }).catch(e => console.debug('Backend offline, using mock projects:', e));
  }, []);

  // Network Scanner trigger
  const handleScanNetwork = () => {
    setIsScanningNetwork(true);
    api.triggerSubnetScan()
      .then(res => {
        if (res.devices) setDevices(res.devices);
      })
      .catch(e => console.debug('Subnet scan error:', e))
      .finally(() => setIsScanningNetwork(false));
  };

  // Toggle Trusted Whitelist Status
  const handleToggleTrust = (deviceId: string) => {
    api.toggleDeviceTrust(deviceId)
      .then(res => {
        if (res.device) {
          setDevices(prev => prev.map(d => d.id === deviceId ? res.device : d));
        }
      })
      .catch(() => {
        setDevices(prev => prev.map(d => {
          if (d.id === deviceId) {
            return { ...d, isTrusted: !d.isTrusted };
          }
          return d;
        }));
      });
  };

  // Port Refresh trigger
  const handleRefreshPorts = () => {
    setIsLoadingPorts(true);
    api.fetchSystemPorts(true)
      .then(res => {
        if (res.ports) setSystemPorts(res.ports);
      })
      .catch(e => console.debug('Refresh ports error:', e))
      .finally(() => setIsLoadingPorts(false));
  };

  // Kill Process
  const handleKillProcess = (pid: number) => {
    api.killProcess(pid)
      .then(() => {
        setSystemPorts(prev => prev.filter(p => p.pid !== pid));
      })
      .catch(() => {
        setSystemPorts(prev => prev.filter(p => p.pid !== pid));
      });
  };

  // Project Service Control Handlers
  const handleStartService = (projectId: string, serviceId: string) => {
    api.controlService(serviceId, 'start')
      .then(() => {
        api.fetchProjects().then(projs => { if (projs) setProjects(projs); });
      })
      .catch(() => {
        setProjects(prev => prev.map(project => {
          if (project.id !== projectId) return project;
          return {
            ...project,
            services: project.services.map(svc => {
              if (svc.id !== serviceId) return svc;
              const assignedPid = Math.floor(Math.random() * 20000) + 10000;
              return {
                ...svc,
                status: 'running',
                pid: assignedPid,
                logs: [
                  ...svc.logs,
                  {
                    timestamp: new Date().toLocaleTimeString(),
                    type: 'system',
                    message: `[Net GUI Supervisor] Service started with PID ${assignedPid}`
                  },
                  {
                    timestamp: new Date().toLocaleTimeString(),
                    type: 'stdout',
                    message: `Executing: ${svc.command}`
                  }
                ]
              };
            })
          };
        }));
      });
  };

  const handleStopService = (projectId: string, serviceId: string) => {
    api.controlService(serviceId, 'stop')
      .then(() => {
        api.fetchProjects().then(projs => { if (projs) setProjects(projs); });
      })
      .catch(() => {
        setProjects(prev => prev.map(project => {
          if (project.id !== projectId) return project;
          return {
            ...project,
            services: project.services.map(svc => {
              if (svc.id !== serviceId) return svc;
              return {
                ...svc,
                status: 'stopped',
                pid: undefined,
                logs: [
                  ...svc.logs,
                  {
                    timestamp: new Date().toLocaleTimeString(),
                    type: 'system',
                    message: `[Net GUI Supervisor] Service terminated by user request`
                  }
                ]
              };
            })
          };
        }));
      });
  };

  const handleRestartService = (projectId: string, serviceId: string) => {
    handleStopService(projectId, serviceId);
    setTimeout(() => {
      handleStartService(projectId, serviceId);
    }, 600);
  };

  const handleStartAllProjectServices = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    project.services.forEach(svc => {
      if (svc.status !== 'running') {
        handleStartService(projectId, svc.id);
      }
    });
  };

  const handleStopAllProjectServices = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    project.services.forEach(svc => {
      if (svc.status === 'running') {
        handleStopService(projectId, svc.id);
      }
    });
  };

  const handleAddProject = (newProjectData: Omit<DevProject, 'id' | 'createdAt'>) => {
    api.createProject(newProjectData)
      .then(created => {
        setProjects(prev => [created, ...prev]);
      })
      .catch(() => {
        const newProj: DevProject = {
          ...newProjectData,
          id: `proj-${Date.now()}`,
          createdAt: 'Just now',
          services: newProjectData.services.map(s => ({
            ...s,
            id: `svc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            status: 'stopped',
            logs: [
              {
                timestamp: new Date().toLocaleTimeString(),
                type: 'system',
                message: `Project registered and ready for execution`
              }
            ]
          }))
        };
        setProjects(prev => [newProj, ...prev]);
      });
  };

  const handleClearLogs = (projectId: string, serviceId?: string) => {
    if (serviceId) {
      api.clearServiceLogs(serviceId).catch(() => {});
    }
    setProjects(prev => prev.map(project => {
      if (project.id !== projectId) return project;
      return {
        ...project,
        services: project.services.map(svc => {
          if (serviceId && svc.id !== serviceId) return svc;
          return {
            ...svc,
            logs: []
          };
        })
      };
    }));
  };

  const handleUpdateProjectVercel = (projectId: string, url: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        vercelDeployment: {
          url,
          status: 'ready',
          deployedAt: 'Just now'
        }
      };
    }));
  };

  const onlineDevicesCount = devices.filter(d => d.status === 'online').length;
  const activeTasksCount = projects.reduce((acc, p) => acc + p.services.filter(s => s.status === 'running').length, 0);

  return (
    <AppLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      onlineDevicesCount={onlineDevicesCount}
      openPortsCount={systemPorts.length}
      activeTasksCount={activeTasksCount}
    >
      {currentTab === 'radar' && (
        <NetworkRadarView
          devices={devices}
          onScanNetwork={handleScanNetwork}
          isScanning={isScanningNetwork}
          onToggleTrust={handleToggleTrust}
        />
      )}

      {currentTab === 'ports' && (
        <LocalPortsView
          ports={systemPorts}
          onKillProcess={handleKillProcess}
          onRefresh={handleRefreshPorts}
          isLoading={isLoadingPorts}
        />
      )}

      {currentTab === 'runner' && (
        <DevRunnerView
          projects={projects}
          systemPorts={systemPorts}
          aiSettings={aiSettings}
          onUpdateAISettings={handleUpdateAISettings}
          onStartService={handleStartService}
          onStopService={handleStopService}
          onRestartService={handleRestartService}
          onStartAllProjectServices={handleStartAllProjectServices}
          onStopAllProjectServices={handleStopAllProjectServices}
          onAddProject={handleAddProject}
          onClearLogs={handleClearLogs}
          onUpdateProjectVercel={handleUpdateProjectVercel}
        />
      )}

      {currentTab === 'vpn' && (
        <VpnGatewayView hostIp="192.168.1.105" />
      )}

      {currentTab === 'drop' && (
        <LANDropView hostIp="192.168.1.105" />
      )}

      {currentTab === 'sniffer' && (
        <APISnifferView />
      )}

      {currentTab === 'ai' && (
        <AISwitchboardView />
      )}

      {currentTab === 'watchdog' && (
        <DomainWatchdogView />
      )}

      {currentTab === 'system' && (
        <SystemMonitorView />
      )}
    </AppLayout>
  );
};

export default App;
