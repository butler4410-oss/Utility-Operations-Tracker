import { MatrixLayout } from "@/components/matrix/matrix-layout";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, AlertTriangle, CalendarPlus, ArrowRight } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { formatNumber } from "@/lib/utils";
import { Client } from "@/lib/types";

interface User {
  id: string;
  fullName: string;
  role: string;
}

type OnboardingStage =
  | "Prospect"
  | "Contract Signed"
  | "Data Integration"
  | "Test Run"
  | "Recently Go Live"
  | "Active";

interface ClassifiedClient extends Client {
  stage: OnboardingStage;
  daysInOnboarding: number;
  isAtRisk: boolean;
}

function classifyClient(client: Client, now: Date): ClassifiedClient {
  const contractStart = new Date(client.contractStartDate);
  const daysSinceContract = differenceInDays(now, contractStart);
  let stage: OnboardingStage = "Active";
  let daysInOnboarding = 0;
  const isAtRisk = client.status === "At-Risk";

  if (client.status === "Onboarding") {
    daysInOnboarding = daysSinceContract;
    if (daysSinceContract <= 30) {
      stage = "Data Integration";
    } else {
      stage = "Test Run";
    }
  } else if (client.status === "Active") {
    if (daysSinceContract <= 90) {
      stage = "Recently Go Live";
    } else {
      stage = "Active";
    }
  } else if (client.status === "At-Risk") {
    daysInOnboarding = daysSinceContract;
    if (daysSinceContract <= 30) {
      stage = "Data Integration";
    } else if (daysSinceContract <= 60) {
      stage = "Test Run";
    } else {
      stage = "Active";
    }
  }

  return { ...client, stage, daysInOnboarding, isAtRisk };
}

const stageOrder: OnboardingStage[] = [
  "Prospect",
  "Contract Signed",
  "Data Integration",
  "Test Run",
  "Recently Go Live",
  "Active",
];

const stageColors: Record<OnboardingStage, string> = {
  Prospect: "bg-gray-200 text-gray-700",
  "Contract Signed": "bg-blue-100 text-blue-800",
  "Data Integration": "bg-yellow-100 text-yellow-800",
  "Test Run": "bg-orange-100 text-orange-800",
  "Recently Go Live": "bg-green-100 text-green-800",
  Active: "bg-emerald-100 text-emerald-800",
};

export default function Onboarding() {
  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const now = useMemo(() => new Date(), []);

  const classified = useMemo(
    () => clients.map((c) => classifyClient(c, now)),
    [clients, now]
  );

  const stageCounts = useMemo(() => {
    const counts: Record<OnboardingStage, number> = {
      Prospect: 0,
      "Contract Signed": 0,
      "Data Integration": 0,
      "Test Run": 0,
      "Recently Go Live": 0,
      Active: 0,
    };
    classified.forEach((c) => {
      counts[c.stage]++;
    });
    return counts;
  }, [classified]);

  const onboardingClients = useMemo(
    () => classified.filter((c) => c.stage === "Data Integration" || c.stage === "Test Run"),
    [classified]
  );

  const atRiskOnboarding = useMemo(
    () => classified.filter((c) => c.isAtRisk),
    [classified]
  );

  const avgDaysToGoLive = useMemo(() => {
    const goLive = classified.filter((c) => c.stage === "Recently Go Live" || c.stage === "Active");
    if (goLive.length === 0) return 0;
    const total = goLive.reduce((sum, c) => {
      return sum + differenceInDays(now, new Date(c.contractStartDate));
    }, 0);
    return Math.round(total / goLive.length);
  }, [classified, now]);

  const newThisQuarter = useMemo(() => {
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    return clients.filter((c) => new Date(c.contractStartDate) >= quarterStart).length;
  }, [clients, now]);

  const getManagerName = (managerId: string) => {
    const user = users.find((u) => u.id === managerId);
    return user ? user.fullName : "Unassigned";
  };

  return (
    <MatrixLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Client Onboarding Tracker</h1>
          <p className="text-sm text-gray-600">Pipeline view of client onboarding progress</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{onboardingClients.length}</span>
            </div>
            <p className="text-sm text-gray-600">In Onboarding Pipeline</p>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">{avgDaysToGoLive}d</span>
            </div>
            <p className="text-sm text-gray-600">Avg Days to Go-Live</p>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-gray-900">{atRiskOnboarding.length}</span>
            </div>
            <p className="text-sm text-gray-600">Clients At Risk</p>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <CalendarPlus className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">{newThisQuarter}</span>
            </div>
            <p className="text-sm text-gray-600">New Clients This Quarter</p>
          </div>
        </div>

        {/* Pipeline View */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Onboarding Pipeline</h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {stageOrder.map((stage, idx) => (
              <div key={stage} className="flex items-center gap-2">
                <div
                  className={`flex flex-col items-center justify-center min-w-[130px] rounded-lg px-4 py-3 ${stageColors[stage]}`}
                >
                  <span className="text-2xl font-bold">{stageCounts[stage]}</span>
                  <span className="text-xs font-medium text-center whitespace-nowrap">{stage}</span>
                </div>
                {idx < stageOrder.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Onboarding Timeline Table */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Onboarding Timeline</h2>
            <p className="text-sm text-gray-500">All clients currently in onboarding</p>
          </div>
          {clientsLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : onboardingClients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No clients currently in onboarding</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-700">Client Name</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Code</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Utility Type</th>
                  <th className="text-left p-3 font-semibold text-gray-700">State</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Contract Start</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Days in Onboarding</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Manager</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {onboardingClients.map((client, idx) => (
                  <tr
                    key={client.id}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="p-3 font-medium text-gray-900">{client.name}</td>
                    <td className="p-3 text-gray-600">{client.code}</td>
                    <td className="p-3 text-gray-600">{client.utilityType}</td>
                    <td className="p-3 text-gray-600">{client.state}</td>
                    <td className="p-3 text-xs text-gray-600">
                      {format(new Date(client.contractStartDate), "MM/dd/yyyy")}
                    </td>
                    <td className="p-3">
                      <span
                        className={
                          client.daysInOnboarding > 45
                            ? "text-red-600 font-semibold"
                            : "text-gray-700"
                        }
                      >
                        {client.daysInOnboarding}d
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{getManagerName(client.assignedManager)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Badge className={stageColors[client.stage]}>{client.stage}</Badge>
                        {client.isAtRisk && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            At Risk
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MatrixLayout>
  );
}
