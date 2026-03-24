import { ReactNode } from "react";
import { MatrixMasthead } from "./masthead";
import { MatrixSubNav } from "./subnav";
import { ContentMenu } from "./content-menu";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

interface MatrixLayoutProps {
  children: ReactNode;
}

export function MatrixLayout({ children }: MatrixLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-white">
      <MatrixMasthead />
      <MatrixSubNav />

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden fixed bottom-4 right-4 z-50 bg-[#1e3a5f] text-white hover:bg-[#2c5282] shadow-lg"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="button-mobile-menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <ContentMenu />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="fixed left-0 top-24 bottom-0 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <ContentMenu />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}
