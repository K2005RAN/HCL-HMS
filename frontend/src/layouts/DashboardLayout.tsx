import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/shared/Sidebar';
import { TopNavbar } from '@/components/shared/TopNavbar';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background print:bg-white print:h-auto print:overflow-visible print:block print:w-full print:m-0 print:p-0">
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-50 p-4 print:hidden">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 lg:pl-72 h-full print:pl-0 print:block print:w-full print:m-0 print:p-0">
        <div className="print:hidden">
          <TopNavbar />
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:p-0 print:m-0 print:overflow-visible print:block print:w-full">
          <div className="mx-auto max-w-7xl print:max-w-full print:w-full print:m-0 print:p-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

