import { useAppStore } from '../../store';
import Sidebar from '../sidebar/Sidebar';
import ChatPanel from '../chat/ChatPanel';
import ConnectionIndicator from './ConnectionIndicator';
import { Menu, X } from 'lucide-react';

export default function MainLayout() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-slate-800 shadow-lg"
      >
        {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-40
          w-80 transform transition-transform duration-200 ease-in-out
          ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0'}
        `}
      >
        <Sidebar collapsed={sidebarCollapsed} />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="hidden lg:block p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Claude Code Remote
            </h1>
          </div>
          
          <ConnectionIndicator />
        </header>

        {/* Chat panel */}
        <div className="flex-1 overflow-hidden">
          <ChatPanel />
        </div>
      </main>

      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
