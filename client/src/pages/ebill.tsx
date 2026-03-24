import { MatrixLayout } from "@/components/matrix/matrix-layout";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Search,
  DollarSign,
  Users,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatNumber } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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

interface Client {
  id: number;
  name: string;
  code: string;
}

const COST_SAVED_PER_EBILL = 0.85;
const PRINT_COST_PER_PIECE = 1.05;
const EBILL_COST_PER_PIECE = 0.20;

const PIE_COLORS = {
  Delivered: "#22c55e",
  Bounced: "#ef4444",
  Pending: "#f59e0b",
};

export default function EBill() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: sends = [] } = useQuery<EBillSend[]>({
    queryKey: ["ebill-sends"],
    queryFn: async () => {
      const res = await fetch("/api/ebill-sends", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch sends");
      return res.json();
    },
  });

  const { data: stats } = useQuery<EBillStats>({
    queryKey: ["ebill-stats"],
    queryFn: async () => {
      const res = await fetch("/api/ebill-stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
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

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((c) => {
      map[String(c.id)] = c.name;
    });
    return map;
  }, [clients]);

  const exceptions = sends.filter((s) => s.deliveryStatus === "Bounced");
  const filteredSends = sends.filter(
    (send) =>
      send.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      send.accountNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Computed KPIs
  const deliveredCount = stats?.delivered || 0;
  const bouncedCount = stats?.bounced || 0;
  const pendingCount = stats?.pending || 0;
  const deliveryRate =
    deliveredCount + bouncedCount > 0
      ? ((deliveredCount / (deliveredCount + bouncedCount)) * 100).toFixed(1)
      : "0.0";

  const openedSends = sends.filter((s) => s.openedAt !== null);
  const openRate =
    deliveredCount > 0
      ? ((openedSends.length / deliveredCount) * 100).toFixed(1)
      : "0.0";

  const totalSavings = deliveredCount * COST_SAVED_PER_EBILL;

  // Pie chart data
  const pieData = [
    { name: "Delivered", value: deliveredCount },
    { name: "Bounced", value: bouncedCount },
    { name: "Pending", value: pendingCount },
  ].filter((d) => d.value > 0);

  // Monthly volume trend
  const monthlyData = useMemo(() => {
    const monthMap: Record<string, number> = {};
    sends.forEach((send) => {
      try {
        const month = format(parseISO(send.sendDate), "yyyy-MM");
        monthMap[month] = (monthMap[month] || 0) + 1;
      } catch {
        // skip invalid dates
      }
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month: format(parseISO(month + "-01"), "MMM yyyy"),
        sends: count,
      }));
  }, [sends]);

  // Digital adoption by client
  const clientAdoption = useMemo(() => {
    const clientData: Record<
      string,
      { sends: number; delivered: number; bounced: number; opened: number }
    > = {};
    sends.forEach((send) => {
      const cid = send.clientId;
      if (!clientData[cid]) {
        clientData[cid] = { sends: 0, delivered: 0, bounced: 0, opened: 0 };
      }
      clientData[cid].sends++;
      if (send.deliveryStatus === "Delivered") clientData[cid].delivered++;
      if (send.deliveryStatus === "Bounced") clientData[cid].bounced++;
      if (send.openedAt) clientData[cid].opened++;
    });
    return Object.entries(clientData)
      .sort(([, a], [, b]) => b.sends - a.sends)
      .slice(0, 20)
      .map(([clientId, data]) => ({
        clientId,
        clientName: clientMap[clientId] || `Client ${clientId}`,
        ...data,
        openRate:
          data.delivered > 0
            ? ((data.opened / data.delivered) * 100).toFixed(1)
            : "0.0",
        estSavings: (data.delivered * COST_SAVED_PER_EBILL).toFixed(2),
      }));
  }, [sends, clientMap]);

  return (
    <MatrixLayout>
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">eBill</h1>
          <p className="text-sm text-gray-600">
            Electronic billing delivery and tracking
          </p>
        </div>

        <Tabs defaultValue="statistics" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100">
            <TabsTrigger value="statistics" data-testid="tab-statistics">
              Statistics
            </TabsTrigger>
            <TabsTrigger value="jobs" data-testid="tab-jobs">
              Jobs
            </TabsTrigger>
            <TabsTrigger value="exceptions" data-testid="tab-exceptions">
              Exceptions
              {exceptions.length > 0 && (
                <Badge className="ml-2 bg-red-600 text-white">
                  {exceptions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="search" data-testid="tab-search">
              Search
            </TabsTrigger>
          </TabsList>

          {/* ========== STATISTICS TAB - Rich Dashboard ========== */}
          <TabsContent value="statistics" className="space-y-6">
            {/* Top KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-gray-200">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +2.4%
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {stats?.adoptionPercent.toFixed(1)}%
                    </span>
                    <p className="text-sm text-gray-500 mt-1">Adoption Rate</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatNumber(stats?.enrolled || 0)}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      Total Enrolled
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <span className="text-xs font-medium text-emerald-600">
                      {deliveryRate}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatNumber(deliveredCount)}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">Delivery Rate</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="p-2 bg-violet-50 rounded-lg">
                      <Eye className="h-5 w-5 text-violet-600" />
                    </div>
                    <span className="text-xs font-medium text-violet-600">
                      {openRate}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatNumber(openedSends.length)}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">Open Rate</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cost Savings Card */}
            <Card className="border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Estimated Cost Savings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Total Savings (eBill vs Print)
                    </p>
                    <p className="text-4xl font-bold text-green-700">
                      ${formatNumber(Math.round(totalSavings))}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Based on {formatNumber(deliveredCount)} delivered eBills x
                      ${COST_SAVED_PER_EBILL}/piece
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500">
                          Print Cost / Piece
                        </p>
                        <p className="text-lg font-semibold text-red-600">
                          ${PRINT_COST_PER_PIECE.toFixed(2)}
                        </p>
                      </div>
                      <TrendingDown className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500">
                          eBill Cost / Piece
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          ${EBILL_COST_PER_PIECE.toFixed(2)}
                        </p>
                      </div>
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">
                      Savings per Piece
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      ${COST_SAVED_PER_EBILL.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {((COST_SAVED_PER_EBILL / PRINT_COST_PER_PIECE) * 100).toFixed(0)}% reduction
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Delivery Status Pie Chart */}
              <Card className="border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-900">
                    Delivery Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <div className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {pieData.map((entry) => (
                              <Cell
                                key={entry.name}
                                fill={
                                  PIE_COLORS[
                                    entry.name as keyof typeof PIE_COLORS
                                  ] || "#8884d8"
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatNumber(value)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-gray-400">
                      No delivery data available
                    </div>
                  )}
                  <div className="flex justify-center gap-6 mt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-gray-600">Delivered</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-gray-600">Bounced</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-gray-600">Pending</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Volume Trend */}
              <Card className="border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-900">
                    Monthly eBill Volume Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={monthlyData}>
                        <defs>
                          <linearGradient
                            id="colorSends"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#1e3a5f"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#1e3a5f"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e5e7eb"
                        />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12 }}
                          stroke="#9ca3af"
                        />
                        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <Tooltip
                          formatter={(value: number) => [
                            formatNumber(value),
                            "eBill Sends",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="sends"
                          stroke="#1e3a5f"
                          strokeWidth={2}
                          fill="url(#colorSends)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      No volume data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Digital Adoption by Client Table */}
            <Card className="border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-900">
                  Digital Adoption by Client
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Client Name
                        </th>
                        <th className="text-right p-3 font-semibold text-gray-700">
                          eBill Sends
                        </th>
                        <th className="text-right p-3 font-semibold text-gray-700">
                          Delivered
                        </th>
                        <th className="text-right p-3 font-semibold text-gray-700">
                          Bounced
                        </th>
                        <th className="text-right p-3 font-semibold text-gray-700">
                          Open Rate
                        </th>
                        <th className="text-right p-3 font-semibold text-gray-700">
                          Est. Savings
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientAdoption.map((row, idx) => (
                        <tr
                          key={row.clientId}
                          className={
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }
                        >
                          <td className="p-3 font-medium text-gray-900">
                            {row.clientName}
                          </td>
                          <td className="p-3 text-right text-gray-700">
                            {formatNumber(row.sends)}
                          </td>
                          <td className="p-3 text-right text-green-700">
                            {formatNumber(row.delivered)}
                          </td>
                          <td className="p-3 text-right text-red-600">
                            {formatNumber(row.bounced)}
                          </td>
                          <td className="p-3 text-right">
                            <span
                              className={
                                parseFloat(row.openRate) > 50
                                  ? "text-green-700"
                                  : "text-amber-600"
                              }
                            >
                              {row.openRate}%
                            </span>
                          </td>
                          <td className="p-3 text-right font-medium text-green-700">
                            ${formatNumber(parseFloat(row.estSavings))}
                          </td>
                        </tr>
                      ))}
                      {clientAdoption.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-6 text-center text-gray-400"
                          >
                            No client data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== JOBS TAB ========== */}
          <TabsContent value="jobs" className="space-y-4">
            <div className="bg-white border border-gray-200 rounded p-6">
              <p className="text-gray-600 text-center">
                eBill job batches and processing history
              </p>
            </div>
          </TabsContent>

          {/* ========== EXCEPTIONS TAB ========== */}
          <TabsContent value="exceptions" className="space-y-4">
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-red-50">
                <h3 className="font-semibold text-red-900">
                  Bounced Deliveries - Action Needed
                </h3>
                <p className="text-sm text-red-700">
                  {exceptions.length} email
                  {exceptions.length !== 1 ? "s" : ""} bounced
                </p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Account
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Bill Date
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Send Date
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exceptions.map((send, idx) => (
                    <tr
                      key={send.id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                      data-testid={`row-exception-${send.id}`}
                    >
                      <td className="p-3 text-gray-700">
                        {send.recipientEmail}
                      </td>
                      <td className="p-3 text-gray-600">
                        {send.accountNumber}
                      </td>
                      <td className="p-3 text-xs text-gray-600">
                        {format(new Date(send.billDate), "MM/dd/yyyy")}
                      </td>
                      <td className="p-3 text-xs text-gray-600">
                        {format(new Date(send.sendDate), "MM/dd/yyyy")}
                      </td>
                      <td className="p-3 text-gray-700">
                        ${send.billAmount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ========== SEARCH TAB ========== */}
          <TabsContent value="search" className="space-y-4">
            <div className="bg-white border border-gray-200 rounded p-4">
              <Input
                placeholder="Search by email or account number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
                data-testid="input-search-ebill"
              />
            </div>
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Account
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Bill Date
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Send Date
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Opened
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSends.slice(0, 50).map((send, idx) => (
                    <tr
                      key={send.id}
                      className={`border-b border-gray-100 ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="p-3 text-gray-700">
                        {send.recipientEmail}
                      </td>
                      <td className="p-3 text-gray-600">
                        {send.accountNumber}
                      </td>
                      <td className="p-3 text-xs text-gray-600">
                        {format(new Date(send.billDate), "MM/dd/yyyy")}
                      </td>
                      <td className="p-3 text-xs text-gray-600">
                        {format(new Date(send.sendDate), "MM/dd/yyyy")}
                      </td>
                      <td className="p-3">
                        <Badge
                          className={
                            send.deliveryStatus === "Delivered"
                              ? "bg-brand-green/20 text-brand-green"
                              : send.deliveryStatus === "Bounced"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {send.deliveryStatus}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-gray-600">
                        {send.openedAt
                          ? format(new Date(send.openedAt), "MM/dd HH:mm")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MatrixLayout>
  );
}
