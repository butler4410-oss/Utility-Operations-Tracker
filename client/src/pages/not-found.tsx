import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-50 text-brand-navy">
      <div className="text-center space-y-4">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="pt-6">
          <Link href="/">
            <Button className="bg-brand-navy text-white hover:bg-brand-navy/90">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
