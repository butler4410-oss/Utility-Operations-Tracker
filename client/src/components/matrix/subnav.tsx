import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Recent Activity", path: "/recent-activity" },
  { label: "Data File Status", path: "/data-file-status" },
  { label: "Import Reports", path: "/import-reports" },
  { label: "QA Proofs", path: "/qa-proofs" },
  { label: "Confirmation Holds", path: "/confirmation-holds" },
  { label: "Mail Compliance", path: "/mail-compliance" },
  { label: "Onboarding", path: "/onboarding" },
  { label: "Digital Presentment", path: "/digital-presentment" },
  { label: "Admin", path: "/admin" },
];

export function MatrixSubNav() {
  const [location] = useLocation();

  return (
    <div className="bg-[#335D8E] border-b border-[#002D72] overflow-x-auto">
      <nav className="flex items-center h-10 px-4 gap-1 min-w-max">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <a
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-t transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-white text-[#002D72] shadow-sm font-semibold"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
