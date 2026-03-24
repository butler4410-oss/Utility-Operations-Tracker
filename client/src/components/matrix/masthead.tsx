import { Button } from "@/components/ui/button";
import { HelpCircle, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function MatrixMasthead() {
  const { user, logout, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [user, isLoading, setLocation]);

  return (
    <div className="h-14 bg-gradient-to-r from-[#0a1929] to-[#1e3a5f] border-b border-gray-700 flex items-center justify-between px-4 shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="6" fill="white" />
            <path d="M6 24V12l6 8 6-8v12" stroke="#0a1929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <rect x="20" y="12" width="10" height="12" rx="2" stroke="#0a1929" strokeWidth="2" fill="none" />
            <line x1="22" y1="16" x2="28" y2="16" stroke="#0a1929" strokeWidth="1.5" />
            <line x1="22" y1="20" x2="28" y2="20" stroke="#0a1929" strokeWidth="1.5" />
          </svg>
          <div className="flex flex-col">
            <span className="text-white font-bold text-lg leading-tight tracking-tight">MATRIX</span>
            <span className="text-blue-200 text-xs leading-tight">Imaging | Operations</span>
          </div>
          <div className="hidden sm:block ml-2 pl-2 border-l border-white/20">
            <span className="text-blue-300/70 text-[10px] leading-tight">Transactional Mail &amp; E-Solutions</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10"
          data-testid="button-help"
        >
          <HelpCircle className="h-4 w-4 mr-1" />
          Help
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              data-testid="button-user-menu"
            >
              <User className="h-4 w-4 mr-1" />
              {user?.fullName || 'User'}
              {user?.role && (
                <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">{user.role}</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem data-testid="menu-profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="menu-logout" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
