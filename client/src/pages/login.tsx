import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Login() {
  const { login, user, isLoading, loginError, isLoginPending } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#002D72]">
      {/* Diagonal accent lines - Matrix brand element */}
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-[#00A3E0]"
            style={{
              width: '1px',
              height: '200%',
              transform: 'rotate(45deg)',
              left: `${i * 20}px`,
              bottom: 0,
            }}
          />
        ))}
      </div>

      <div className="mb-8 flex flex-col items-center">
        <img src="/matrix-logo-white.png" alt="Matrix Imaging Solutions" className="h-14 mb-3" />
        <p className="text-[#00A3E0] text-sm font-medium tracking-wide">Connecting people through reliable communications.</p>
      </div>

      <Card className="w-full max-w-md mx-4 shadow-2xl border-0 relative z-10 bg-white">
        <CardHeader className="space-y-1 text-center pb-4">
          <h2 className="text-xl font-bold tracking-tight">
            <span className="text-[#00A3E0]">Utilities</span>{' '}
            <span className="text-[#002D72]">Operations Portal</span>
          </h2>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {loginError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Demo: <span className="font-mono text-[#002D72]">admin / admin123</span>
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full bg-[#002D72] hover:bg-[#335D8E] text-white"
              disabled={isLoginPending}
            >
              {isLoginPending ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Matrix Imaging Solutions | 716.504.9700 | matriximaging.com
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
