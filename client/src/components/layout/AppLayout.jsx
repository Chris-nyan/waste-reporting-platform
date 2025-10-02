import { useState } from 'react';
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  Users,
  LineChart,
  Menu,
  CircleUser,
  Package2, // Logo placeholder
  ChevronsLeft,
  ChevronsRight,
  Building,
} from 'lucide-react';
import useAuth from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const tenantNavLinks = [
  { to: '/app/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/app/clients', icon: Users, label: 'Clients' },
  { to: '/app/reports', icon: LineChart, label: 'Reports' },

];

const superAdminNavLinks = [
  { to: '/superadmin/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/superadmin/tenants', icon: Building, label: 'Tenants' },
];

const SidebarNavLink = ({ to, icon: Icon, children, isCollapsed }) => {
  const { pathname } = useLocation();
  const isActive = pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900',
        isActive && 'bg-gray-100 text-gray-900 font-semibold'
      )}
    >
      <Icon className="h-4 w-4" />
      <span className={cn('transition-opacity duration-200', isCollapsed ? 'opacity-0 h-0 w-0' : 'opacity-100')}>
        {children}
      </span>
    </Link>
  );
};

const AppLayout = () => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navLinks = user?.role === 'SUPER_ADMIN' ? superAdminNavLinks : tenantNavLinks;

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between h-16 border-b px-4 shrink-0">
        {!isCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6 text-emerald-600" />
            <span className="text-gray-800">Wongpanit </span>
          </Link>
        )}
        <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-gray-100 transition-colors hidden lg:block">
          {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navLinks.map((link) => (
          <SidebarNavLink key={link.to} to={link.to} icon={link.icon} isCollapsed={isCollapsed}>
            {link.label}
          </SidebarNavLink>
        ))}
      </nav>
      <div className="p-4 mt-auto border-t">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer w-full">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center ring-2 ring-emerald-200/50 shrink-0">
                  <span className="font-bold text-emerald-700">{user?.name?.charAt(0) || 'U'}</span>
                </div>
                {!isCollapsed && (
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="flex h-screen bg-gray-100/80 overflow-hidden">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className={cn('hidden lg:flex flex-col bg-white z-10 transition-all duration-300 border-r', isCollapsed ? 'w-20' : 'w-64')}>
        <SidebarContent />
      </aside>

      {/* --- MOBILE SIDEBAR (Sheet) --- */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetTrigger asChild>
           {/* The button is now in the header */}
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col">
        <header className="bg-white/80 backdrop-blur-lg border-b flex items-center justify-between px-4 sm:px-6 h-16 shrink-0">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 -ml-2 rounded-md lg:hidden hover:bg-gray-100">
            <Menu className="h-6 w-6 text-gray-600" />
            <span className="sr-only">Open sidebar</span>
          </button>
          
          <div className="ml-auto">
            {/* Other header items like notifications or a search bar can go here */}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-white">
          <Outlet /> {/* Pages will be rendered and will scroll here */}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

