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
    <div className="h-14 bg-[#002D72] border-b border-[#002D72] flex items-center justify-between px-4 shadow-md">
      <div className="flex items-center gap-4">
        <img
          src="/matrix-logo-white.png"
          alt="Matrix Imaging Solutions"
          className="h-9"
        />
        <div className="hidden sm:flex items-center gap-2 ml-1 pl-3 border-l border-white/20">
          <span className="text-[#00A3E0] font-semibold text-sm">Utilities</span>
          <span className="text-white/60 text-sm">|</span>
          <span className="text-white/80 text-sm">Operations Portal</span>
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
                <span className="ml-2 text-xs bg-[#00A3E0]/30 text-[#00A3E0] px-2 py-0.5 rounded-full">{user.role}</span>
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
