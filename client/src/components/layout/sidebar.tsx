import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Printer, 
  ClipboardList, 
  BarChart3, 
  Settings,
  LogOut,
  Headphones
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/tracking", label: "Tracking", icon: Activity },
  { href: "/call-center", label: "Call Center", icon: Headphones },
  { href: "/print-volume", label: "Print Volume", icon: Printer },
  { href: "/surveys", label: "Surveys", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin", label: "Admin", icon: Settings, roles: ['Admin', 'Manager'] },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-xl">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border bg-sidebar/50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-brand-green flex items-center justify-center font-bold text-white shadow-lg shadow-brand-green/20">
            UT
          </div>
          <span className="font-bold tracking-tight text-lg">Utilities<span className="text-brand-green">Tracker</span></span>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          if (item.roles && user && !item.roles.includes(user.role)) return null;
          
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-brand-green/10 translate-x-1" 
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white hover:translate-x-1"
              )}>
                <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-sidebar-foreground/60 group-hover:text-white")} />
                {item.label}
              </a>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border bg-sidebar/30">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-9 w-9 rounded-full bg-brand-navy border border-sidebar-border flex items-center justify-center text-white text-xs font-bold">
            {user?.fullName.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate text-white">{user?.fullName}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
