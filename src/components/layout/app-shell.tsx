import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { useUiStore } from '@/stores/ui-store';

export function AppShell() {
  const theme = useUiStore((state) => state.theme);
  const isSidebarCollapsed = useUiStore((state) => state.isSidebarCollapsed);

  return (
    <div className={`relative min-h-screen overflow-hidden ${theme === 'light' ? 'bg-[#FBF9FB] text-[#2A2C31]' : 'bg-[#10051b] text-slate-100'}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`absolute right-[-10%] top-[-10%] h-[60vw] w-[60vw] rounded-full blur-[120px] ${theme === 'light' ? 'bg-purple-400/8' : 'bg-pink-900/32'}`} />
        <div className={`absolute bottom-[-10%] left-[-10%] h-[60vw] w-[60vw] rounded-full blur-[120px] ${theme === 'light' ? 'bg-emerald-400/6' : 'bg-orange-900/18'}`} />
        <div className={`absolute inset-0 bg-linear-to-b from-transparent ${theme === 'light' ? 'via-[#FBF9FB]/30 to-[#FBF9FB]' : 'via-[#140824]/44 to-[#10051b]'}`} />
      </div>

      <Sidebar />

      <main className={`relative min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-80'}`}>
        <div>
          <Navbar />
          <div className="px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
