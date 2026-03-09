import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';

export function AppShell() {
  return (
    <div className="relative min-h-screen bg-[#f8f9fc]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[32rem] w-[32rem] rounded-full bg-pink-300/25 blur-[100px]" />
        <div className="absolute bottom-[-8%] right-[-8%] h-[26rem] w-[26rem] rounded-full bg-orange-300/25 blur-[100px]" />
      </div>

      <Sidebar />

      <main className="relative min-h-screen lg:pl-72">
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
