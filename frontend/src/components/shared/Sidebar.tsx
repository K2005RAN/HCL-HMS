import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  Calendar, 
  Pill, 
  TestTube, 
  Settings, 
  LogOut,
  Activity,
  IndianRupee,
  ShieldAlert,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { name: 'My Health Dashboard', href: '/patient-dashboard', icon: LayoutDashboard, roles: ['patient'] },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { name: 'Appointments', href: '/appointments', icon: Calendar, roles: ['admin', 'staff'] },
  { name: 'Doctor Portal', href: '/doctor-dashboard', icon: Stethoscope, roles: ['admin', 'doctor'] },
  { name: 'Patient History', href: '/doctor-history', icon: History, roles: ['admin', 'doctor'] },
  { name: 'Employees', href: '/employees', icon: Users, roles: ['admin'] },
  { name: 'Attendance', href: '/attendance', icon: Activity, roles: ['admin', 'staff', 'doctor', 'pharmacy', 'lab'] },
  { name: 'Pharmacy', href: '/pharmacy', icon: Pill, roles: ['admin', 'pharmacy'] },
  { name: 'Laboratory', href: '/lab', icon: TestTube, roles: ['admin', 'lab'] },
  { name: 'Billing', href: '/billing', icon: IndianRupee, roles: ['admin'] },
  { name: 'User Management', href: '/user-management', icon: Users, roles: ['admin'] },
  { name: 'Audit Logs', href: '/audit-logs', icon: ShieldAlert, roles: ['admin'] },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="flex h-full w-full flex-col glass text-card-foreground transition-all duration-300 rounded-2xl shadow-xl border border-border/50 overflow-hidden">
      <div className="flex h-20 shrink-0 items-center px-6 border-b border-border/50 bg-card/40">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 mr-3">
          <Stethoscope className="h-6 w-6 text-primary-foreground drop-shadow-md" />
        </div>
        <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          HCL-HMS
        </span>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-4 custom-scrollbar">
        <nav className="flex-1 space-y-2 px-4">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02] ring-1 ring-primary/50'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:scale-[1.01]',
                  'group flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ease-out'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary',
                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-300'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="shrink-0 p-4 border-t border-border/50 bg-card/40">
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-300 font-semibold group">
          <LogOut className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
          Logout
        </Button>
      </div>
    </div>
  );
}
