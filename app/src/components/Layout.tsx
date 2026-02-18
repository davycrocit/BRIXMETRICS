import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  BarChart3,
  TrendingUp,
  Users,
  Settings,
  Menu,
  LogOut,
  ChevronDown,
  Building2,
  DollarSign,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Daily Metrics', path: '/daily-metrics', icon: CalendarDays },
  { label: 'FTI Board', path: '/fti-board', icon: ClipboardList },
  { label: 'Pipeline', path: '/pipeline', icon: DollarSign },
  { label: 'Yearly Tracking', path: '/yearly-tracking', icon: BarChart3 },
  { label: 'Forecasting', path: '/forecasting', icon: TrendingUp },
];

const adminNavItems = [
  { label: 'User Management', path: '/users', icon: Users },
  { label: 'Team Management', path: '/teams', icon: Building2 },
];

export default function Layout() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = usePermissions();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const allNavItems = isAdmin() ? [...navItems, ...adminNavItems] : navItems;

  const NavContent = () => (
    <nav className="flex flex-col gap-1">
      {allNavItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-white/10 text-white border-l-4 border-[#c75b2a]' 
                : 'text-white/70 hover:bg-white/5 hover:text-white'
              }
            `}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''}`} />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#1e3a5f] fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#c75b2a] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Brix</h1>
              <p className="text-white/60 text-xs">Metrics Portal</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto p-4">
          <NavContent />
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center gap-3 justify-start text-white hover:bg-white/10">
                <Avatar className="h-8 w-8 bg-[#c75b2a]">
                  <AvatarFallback className="bg-[#c75b2a] text-white text-sm">
                    {user ? getInitials(user.first_name, user.last_name) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-white/60 capitalize">{user?.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-white/60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1e3a5f] border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#c75b2a] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">B</span>
            </div>
            <span className="text-white font-bold">Brix Metrics</span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-[#1e3a5f] border-white/10 p-0">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#c75b2a] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">B</span>
                  </div>
                  <div>
                    <h1 className="text-white font-bold text-lg">Brix</h1>
                    <p className="text-white/60 text-xs">Metrics Portal</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <NavContent />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                <Button
                  variant="ghost"
                  className="w-full flex items-center gap-3 justify-start text-white hover:bg-white/10"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen bg-gray-50">
        <div className="lg:pt-0 pt-16">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
