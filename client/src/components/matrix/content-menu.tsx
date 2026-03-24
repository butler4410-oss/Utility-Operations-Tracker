import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Users,
  Settings,
  Truck,
  FileText,
  CheckSquare,
  Wrench,
  Home,
  Activity,
  FileCheck,
  AlertCircle,
  Phone,
  BarChart3,
  Briefcase,
  MessageSquare,
  Mail,
  Upload as UploadIcon,
  UserCog,
} from "lucide-react";

interface MenuGroup {
  title: string;
  items: {
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const menuGroups: MenuGroup[] = [
  {
    title: "Operations",
    items: [
      { label: "Dashboard", path: "/", icon: Home },
      { label: "Recent Activity", path: "/recent-activity", icon: Activity },
      { label: "Data File Status", path: "/data-file-status", icon: FileText },
      { label: "Upload", path: "/upload", icon: UploadIcon },
    ],
  },
  {
    title: "Production",
    items: [
      { label: "Import Reports", path: "/import-reports", icon: FileCheck },
      { label: "QA Proofs", path: "/qa-proofs", icon: CheckSquare },
      { label: "Confirmation Holds", path: "/confirmation-holds", icon: AlertCircle },
      { label: "Mail Compliance", path: "/mail-compliance", icon: BarChart3 },
      { label: "JobTrax", path: "/jobtax", icon: Briefcase },
    ],
  },
  {
    title: "Requests",
    items: [
      { label: "Call Center", path: "/call-center", icon: Phone },
      { label: "Client Services", path: "/client-services", icon: UserCog },
      { label: "Bill Messages", path: "/bill-messages", icon: MessageSquare },
      { label: "eBill", path: "/ebill", icon: Mail },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "Print Volume", path: "/print-volume", icon: Truck },
      { label: "Clients", path: "/clients", icon: Users },
      { label: "Admin", path: "/admin", icon: Settings },
    ],
  },
];

export function ContentMenu() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="p-3">
        <div className="mb-4 pb-2 border-b border-gray-300">
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            Content Menu
          </h2>
        </div>

        {menuGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              {group.title}
            </h3>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <a
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors",
                        isActive
                          ? "bg-[#1e3a5f] text-white font-medium"
                          : "text-gray-700 hover:bg-gray-200"
                      )}
                      data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </a>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
