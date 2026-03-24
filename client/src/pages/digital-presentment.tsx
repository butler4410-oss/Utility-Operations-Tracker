import { MatrixLayout } from "@/components/matrix/matrix-layout";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Leaf, FileText, DollarSign, TreePine, TrendingUp, Target } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { Client, PrintJob } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { format, subMonths, startOfMonth, isAfter, isBefore } from "date-fns";

interface EBillSend {
  id: string;
  clientId: string;
  accountNumber: string;
  recipientEmail: string;
  billDate: string;
  sendDate: string;
  deliveryStatus: string;
  openedAt: string | null;
  billAmount: string;
}

interface EBillStats {
  adoptionPercent: number;
  enrolled: number;
  delivered: number;
  bounced: number;
  pending: number;
}

export default function DigitalPresentment() {
  const { data: sends = [] } = useQuery<EBillSend[]>({
    queryKey: ["ebill-sends"],
    queryFn: async () => {
      const res = await fetch("/api/ebill-sends", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch eBill sends");
      return res.json();
    },
  });

  const { data: stats } = useQuery<EBillStats>({
    queryKey: ["ebill-stats"],
    queryFn: async () => {
      const res = await fetch("/api/ebill-stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch eBill stats");
      return res.json();
    },
  });

  const { data: printJobs = [] } = useQuery<PrintJob[]>({
    queryKey: ["print-jobs"],
    queryFn: async () => {
      const res = await fetch("/api/print-jobs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch print jobs");
      return res.json();
    },
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const totalSends = sends.length;
  const co2Saved = (totalSends * 0.004).toFixed(1);
  const costSaved = totalSends * 0.85;
  const treesSaved = (totalSends * 0.00006).toFixed(2);

  // Month-over-month growth
  const now = useMemo(() => new Date(), []);
  const momGrowth = useMemo(() => {
    const thisMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));
    const thisMonthSends = sends.filter(
      (s) => new Date(s.sendDate) >= thisMonth
    ).length;
    const lastMonthSends = sends.filter((s) => {
      const d = new Date(s.sendDate);
      return d >= lastMonth && d < thisMonth;
    }).length;
    if (lastMonthSends === 0) return 0;
    return Math.round(((thisMonthSends - lastMonthSends) / lastMonthSends) * 100);
  }, [sends, now]);

  // Top 15 clients by eBill volume
  const clientBarData = useMemo(() => {
    const counts: Record<string, number> = {};
    sends.forEach((s) => {
      counts[s.clientId] = (counts[s.clientId] || 0) + 1;
    });
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    return sorted.map(([clientId, count]) => {
      const client = clients.find((c) => c.id === clientId);
      return {
        name: client ? client.code : clientId,
        volume: count,
      };
    });
  }, [sends, clients]);

  // Paper vs Digital trend (last 12 months)
  const trendData = useMemo(() => {
    const months: { month: string; digital: number; paper: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = startOfMonth(subMonths(now, i - 1));
      const label = format(monthStart, "MMM yyyy");

      const digital = sends.filter((s) => {
        const d = new Date(s.sendDate);
        return d >= monthStart && d < monthEnd;
      }).length;

      const paper = printJobs
        .filter((j) => {
          const d = new Date(j.date);
          return d >= monthStart && d < monthEnd;
        })
        .reduce((sum, j) => sum + j.pieces, 0);

      months.push({ month: label, digital, paper });
    }
    return months;
  }, [sends, printJobs, now]);

  return (
    <MatrixLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Digital Presentment</h1>
          <p className="text-sm text-gray-600">
            Paper-to-digital conversion impact and environmental savings
          </p>
        </div>

        {/* Hero KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">
                {formatNumber(totalSends)}
              </span>
            </div>
            <p className="text-sm text-gray-600">Paper Statements Eliminated</p>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <Leaf className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">{co2Saved} kg</span>
            </div>
            <p className="text-sm text-gray-600">CO2 Saved</p>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <span className="text-2xl font-bold text-gray-900">
                ${formatNumber(Math.round(costSaved))}
              </span>
            </div>
            <p className="text-sm text-gray-600">Cost Saved (Print)</p>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <TreePine className="h-5 w-5 text-green-700" />
              <span className="text-2xl font-bold text-gray-900">{treesSaved}</span>
            </div>
            <p className="text-sm text-gray-600">Trees Saved</p>
          </div>
        </div>

        {/* Conversion Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">
                {stats?.adoptionPercent?.toFixed(1) ?? "0"}%
              </span>
            </div>
            <p className="text-sm text-gray-600">Digital Adoption Rate</p>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp
                className={`h-5 w-5 ${momGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
              />
              <span
                className={`text-2xl font-bold ${
                  momGrowth >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {momGrowth >= 0 ? "+" : ""}
                {momGrowth}%
              </span>
            </div>
            <p className="text-sm text-gray-600">Month-over-Month Growth</p>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">50%</span>
            </div>
            <p className="text-sm text-gray-600">Target Adoption by EOY</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((stats?.adoptionPercent ?? 0) / 50 * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Client Digital Maturity Chart */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="font-semibold text-gray-900 mb-4">
            Client Digital Maturity - Top 15 by eBill Volume
          </h2>
          {clientBarData.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No eBill data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={clientBarData} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="volume" fill="#2c5282" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Paper vs Digital Trend */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="font-semibold text-gray-900 mb-4">
            Paper vs Digital Trend (Last 12 Months)
          </h2>
          {trendData.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No trend data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="digital"
                  stackId="1"
                  stroke="#2c5282"
                  fill="#2c5282"
                  fillOpacity={0.6}
                  name="Digital (eBill)"
                />
                <Area
                  type="monotone"
                  dataKey="paper"
                  stackId="2"
                  stroke="#e53e3e"
                  fill="#e53e3e"
                  fillOpacity={0.3}
                  name="Paper (Print)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </MatrixLayout>
  );
}
