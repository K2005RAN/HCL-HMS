import { useState } from 'react';
import { Bell, Search, Menu, User as UserIcon, Shield, Mail, LogOut, X, CheckCircle2, Phone, Building, Pencil, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function TopNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name || user?.username || user?.email?.split('@')[0] || 'Logged In User';
  const displayEmail = user?.email || 'N/A';
  const displayRole = (user?.role || 'User').toUpperCase();
  const customId = user?.doctorId || user?.patientId || user?.staffId || user?.employeeId || user?.adminId || user?._id || user?.id || 'N/A';
  const department = user?.department || user?.specialization || 'General';
  const phone = user?.phone || user?.emergencyContact || 'N/A';

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-4 z-40 flex h-16 shrink-0 items-center gap-x-4 glass rounded-2xl mx-4 sm:mx-6 lg:mx-8 mb-6 px-4 shadow-sm sm:gap-x-6 sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 glass border-r-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-8 pr-0 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm bg-transparent"
            placeholder="Search everywhere..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Button variant="ghost" size="icon" className="relative hover:bg-primary/10">
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent animate-pulse" />
            <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </Button>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

          {/* Profile Icon Button - Directly opens User Details Modal */}
          <Button 
            variant="ghost" 
            onClick={() => setIsProfileModalOpen(true)}
            className="relative h-10 px-3 rounded-full ring-2 ring-border hover:ring-primary hover:bg-primary/5 transition-all flex items-center gap-2.5 cursor-pointer"
            title="Click to view User Details"
          >
            <Avatar className="h-8 w-8 ring-1 ring-primary/20">
              <AvatarImage src="" alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col text-left text-xs">
              <span className="font-bold leading-tight text-slate-900 dark:text-white">{displayName}</span>
              <span className="text-[10px] font-semibold text-primary capitalize">{user?.role || 'User'}</span>
            </div>
          </Button>

          {/* User Details Modal Overlay */}
          {isProfileModalOpen && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsProfileModalOpen(false)}
            >
              <div 
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden relative text-slate-900 dark:text-white"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors z-10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Top Header Banner */}
                <div className="h-28 bg-gradient-to-r from-primary/90 via-primary to-accent relative flex items-center justify-center" />

                {/* Profile Card Body */}
                <div className="px-6 pb-6 relative">
                  <div className="flex flex-col items-center text-center -mt-14 mb-4">
                    <Avatar className="h-24 w-24 ring-4 ring-white dark:ring-slate-900 shadow-xl bg-white mb-2">
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-2xl font-extrabold tracking-tight">{displayName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                        {displayRole}
                      </span>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Active
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1 justify-center">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {displayEmail}
                    </p>
                  </div>

                  {/* Info Grid */}
                  <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-xs font-medium border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400">Full Name</span>
                      <span className="font-bold text-slate-900 dark:text-white">{displayName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400">Email Address</span>
                      <span className="font-bold text-slate-900 dark:text-white">{displayEmail}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400">System Role</span>
                      <span className="font-bold text-slate-900 dark:text-white">{displayRole}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400">Account ID</span>
                      <span className="font-mono bg-slate-200/70 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200 font-bold">{customId}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400">Department</span>
                      <span className="font-bold text-slate-900 dark:text-white">{department}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Contact Phone</span>
                      <span className="font-bold text-slate-900 dark:text-white">{phone}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-4">
                    <Button
                      onClick={() => {
                        setIsProfileModalOpen(false);
                        navigate('/profile?tab=edit');
                      }}
                      className="font-bold h-9 bg-primary hover:bg-primary/90 text-xs"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Edit Profile
                    </Button>

                    <Button
                      onClick={() => {
                        setIsProfileModalOpen(false);
                        navigate('/profile?tab=security');
                      }}
                      className="font-bold h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                    >
                      <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                      Change Password
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsProfileModalOpen(false);
                        navigate('/profile');
                      }}
                      className="font-bold h-9 text-xs border-slate-200"
                    >
                      <Shield className="w-3.5 h-3.5 mr-1.5" />
                      Full Details
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="h-9 text-destructive border-destructive/20 hover:bg-destructive/10 font-bold text-xs"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-1.5" />
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
