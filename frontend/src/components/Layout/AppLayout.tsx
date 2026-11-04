import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Network, 
  Terminal, 
  Wifi, 
  Search, 
  ChevronDown,
  Shield, 
  UploadCloud, 
  Activity, 
  Cpu, 
  Lock,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

type TabType = 'radar' | 'ports' | 'runner' | 'vpn' | 'drop' | 'sniffer' | 'system' | 'ai' | 'watchdog';

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  dot?: boolean;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

interface AppLayoutProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onlineDevicesCount: number;
  openPortsCount: number;
  activeTasksCount: number;
  localIp?: string;
  subnetCidr?: string;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onTabChange,
  onlineDevicesCount,
  openPortsCount,
  activeTasksCount,
  localIp,
  subnetCidr,
  children
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const isElectron = typeof window !== 'undefined' && Boolean((window as any).netgui?.isElectron || (window as any).netpulse?.isElectron);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);

  const navSections: NavSection[] = [
    {
      section: 'Network & Security',
      items: [
        { id: 'radar', label: 'Network Hosts', icon: <Radio className="w-4 h-4 text-blue-500 dark:text-sky-400" />, badge: onlineDevicesCount },
        { id: 'ports', label: 'Port Forwarding', icon: <Network className="w-4 h-4 text-blue-500 dark:text-sky-400" />, badge: openPortsCount },
        { id: 'vpn', label: 'VPN & AdSinkhole', icon: <Shield className="w-4 h-4 text-blue-500 dark:text-sky-400" />, badge: ':53' },
        { id: 'drop', label: 'LAN File Drop', icon: <UploadCloud className="w-4 h-4 text-blue-500 dark:text-sky-400" />, badge: 'P2P' }
      ]
    },
    {
      section: 'Developer Engine',
      items: [
        { id: 'runner', label: 'Dev Servers', icon: <Terminal className="w-4 h-4 text-blue-500 dark:text-sky-400" />, dot: activeTasksCount > 0 },
        { id: 'ai', label: 'AI & VRAM', icon: <Cpu className="w-4 h-4 text-blue-500 dark:text-sky-400" />, badge: 'OLLAMA' },
        { id: 'sniffer', label: 'API Sniffer', icon: <Radio className="w-4 h-4 text-blue-500 dark:text-sky-400" />, badge: 'LIVE' },
        { id: 'watchdog', label: 'Domain Watchdog', icon: <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />, badge: 'SSL' },
        { id: 'system', label: 'System Aura', icon: <Activity className="w-4 h-4 text-blue-500 dark:text-sky-400" />, badge: '24%' }
      ]
    }
  ];

  const allItems: NavItem[] = navSections.flatMap(sec => sec.items);
  const currentTabItem = allItems.find(i => i.id === currentTab);

  return (
    <div className="min-h-screen bg-[#f6f7f9] dark:bg-[#090b10] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Fixed macOS Window Titlebar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/95 dark:bg-[#0c0e14]/95 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08] px-3.5 sm:px-4 md:px-6 flex items-center justify-between select-none z-40 transition-colors duration-200">
        {/* Left: Mobile Drawer Trigger + macOS Traffic Lights & Title */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Mobile Drawer Hamburger Button */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex md:hidden p-2 -ml-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Open Navigation Menu"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* macOS Traffic Lights (Desktop app only) */}
          {isElectron && (
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 group mr-1">
              <button
                onClick={() => ((window as any).netgui || (window as any).netpulse)?.close?.()}
                className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] inline-flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                aria-label="Close"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[#800000] leading-none select-none">×</span>
              </button>
              <button
                onClick={() => ((window as any).netgui || (window as any).netpulse)?.minimize?.()}
                className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24] inline-flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                aria-label="Minimize"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[#7d5600] leading-none select-none">−</span>
              </button>
              <button
                onClick={() => ((window as any).netgui || (window as any).netpulse)?.maximize?.()}
                className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] inline-flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                aria-label="Maximize"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[#085e13] leading-none select-none">+</span>
              </button>
            </div>
          )}

          <div className={`flex items-center gap-2.5 sm:gap-3 ${isElectron ? 'pl-2 sm:pl-3 border-l border-black/[0.08] dark:border-white/[0.1]' : ''}`}>
            <div className="flex items-center gap-2.5">
              <svg className="w-8 h-8 shrink-0 drop-shadow-[0_0_8px_rgba(46,230,166,0.35)]" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#0E1420" stroke="rgba(255,255,255,0.12)" strokeWidth="6" d="M80 36H176A44 44 0 0 1 220 80V176A44 44 0 0 1 176 220H80A44 44 0 0 1 36 176V80A44 44 0 0 1 80 36Z"/>
                <path fill="#2EE6A6" d="M96 84A12 12 0 0 0 84 96V148A12 12 0 0 0 96 160H108V172A12 12 0 0 0 120 184H136A12 12 0 0 0 148 172V160H160A12 12 0 0 0 172 148V96A12 12 0 0 0 160 84Z"/>
              </svg>
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                Net GUI
              </span>
            </div>
            {/* Active view indicator badge on mobile */}
            <span className="md:hidden text-[11px] font-mono text-slate-400 dark:text-slate-400 font-medium truncate max-w-[120px]">
              / {currentTabItem?.label}
            </span>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-[11px] font-medium text-slate-700 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2EE6A6] shadow-[0_0_5px_rgba(46,230,166,0.8)]" />
              <span>Subnet {subnetCidr || 'LAN Active'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Center: Global Omnibar / Search */}
        <div className="flex-1 max-w-md mx-6 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              readOnly
              placeholder="Search hosts, ports, services..."
              className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.07] dark:border-white/[0.08] focus:border-blue-500 dark:focus:border-blue-400 rounded-lg pl-9 pr-12 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none cursor-pointer transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/[0.08]">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right: Theme Toggle & System Status */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            title={`Toggle Theme (Current: ${theme})`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-[11px] font-medium">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline text-[11px] font-medium">Dark</span>
              </>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-700 dark:text-slate-300 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] px-3 py-1.5 rounded-lg">
            <Wifi className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span className="text-[11px]">en0</span>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay Backdrop (< md) */}
      <div 
        className={`fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          isMobileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Drawer Aside (< md) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] z-50 bg-white dark:bg-[#0c0e14] border-r border-black/[0.08] dark:border-white/[0.08] shadow-2xl flex flex-col justify-between p-3.5 transition-transform duration-300 ease-in-out md:hidden select-none ${
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {/* Drawer Header with Title and Close Button */}
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.07]">
            <div className="flex items-center gap-2.5">
              <svg className="w-8 h-8 shrink-0 drop-shadow-[0_0_8px_rgba(46,230,166,0.35)]" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#0E1420" stroke="rgba(255,255,255,0.12)" strokeWidth="6" d="M80 36H176A44 44 0 0 1 220 80V176A44 44 0 0 1 176 220H80A44 44 0 0 1 36 176V80A44 44 0 0 1 80 36Z"/>
                <path fill="#2EE6A6" d="M96 84A12 12 0 0 0 84 96V148A12 12 0 0 0 96 160H108V172A12 12 0 0 0 120 184H136A12 12 0 0 0 148 172V160H160A12 12 0 0 0 172 148V96A12 12 0 0 0 160 84Z"/>
              </svg>
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Net GUI Navigation</span>
            </div>
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.06] transition-colors"
              aria-label="Close Navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Sections */}
          <div className="space-y-5">
            {navSections.map((sec, secIdx) => (
              <div key={secIdx}>
                <p className="px-3 pt-1 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                  {sec.section}
                </p>
                <nav className="space-y-1 mt-1">
                  {sec.items.map(item => {
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTabChange(item.id);
                          setIsMobileDrawerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors duration-150 ${
                          isActive
                            ? 'bg-black/[0.05] dark:bg-white/[0.08] text-slate-900 dark:text-white font-medium border border-black/[0.05] dark:border-white/[0.07]'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        {item.dot && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                        {item.badge !== undefined && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium ${
                            isActive 
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300' 
                              : 'bg-black/[0.04] dark:bg-white/[0.06] text-slate-500 dark:text-slate-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}

            {/* Quick Stats Block inside Drawer */}
            <div>
              <p className="px-3 pt-1 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                Network Quick Stats
              </p>
              <div 
                onClick={() => {
                  onTabChange('system');
                  setIsMobileDrawerOpen(false);
                }}
                className="p-3 space-y-1.5 text-xs font-mono text-slate-700 dark:text-slate-300 bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Local Mac:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{localIp || '10.152.27.29'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">DNS Sinkhole:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">:53 Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">VPN Proxy:</span>
                  <span className="text-blue-600 dark:text-sky-400 font-medium">Active (7890)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.07]">
          <div className="px-2 py-1 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2EE6A6] shadow-[0_0_5px_rgba(46,230,166,0.8)]" />
              <span>Net GUI</span>
            </span>
            <span className="font-mono">macOS Sequoia</span>
          </div>
        </div>
      </aside>

      {/* Fixed Desktop Left Sidebar (>= md) */}
      <aside className="hidden md:flex fixed top-14 left-0 bottom-0 w-60 z-30 bg-white dark:bg-[#0c0e14] border-r border-black/[0.08] dark:border-white/[0.08] p-3 flex-col justify-between overflow-y-auto select-none transition-colors duration-200">
        <div className="space-y-5">
          {navSections.map((sec, secIdx) => (
            <div key={secIdx}>
              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                {sec.section}
              </p>
              <nav className="space-y-1 mt-1">
                {sec.items.map(item => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors duration-150 ${
                        isActive
                          ? 'bg-black/[0.05] dark:bg-white/[0.08] text-slate-900 dark:text-white font-medium border border-black/[0.05] dark:border-white/[0.07]'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {item.dot && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                      {item.badge !== undefined && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium ${
                          isActive 
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300' 
                            : 'bg-black/[0.04] dark:bg-white/[0.06] text-slate-500 dark:text-slate-400'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}

          {/* Quick Stats Block */}
          <div>
            <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-400">
              Network Quick Stats
            </p>
            <div 
              onClick={() => onTabChange('system')}
              className="p-3 space-y-1.5 text-xs font-mono text-slate-700 dark:text-slate-300 bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Local Mac:</span>
                <span className="text-slate-900 dark:text-white font-medium">{localIp || '10.152.27.29'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">DNS Sinkhole:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">:53 Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">VPN Proxy:</span>
                <span className="text-blue-600 dark:text-sky-400 font-medium">Active (7890)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Card */}
        <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.07]">
          <div className="px-2 py-1 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2EE6A6] shadow-[0_0_5px_rgba(46,230,166,0.8)]" />
              <span>Net GUI</span>
            </span>
            <span className="font-mono">macOS Sequoia</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 pt-14 md:pl-60 min-h-screen flex flex-col w-full">
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
