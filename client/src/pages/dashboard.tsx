import { MatrixLayout } from "@/components/matrix/matrix-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useClients, usePrintJobs, useActivities, useSurveys, useCallRecords, useMailComplianceStats } from "@/lib/queries";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Line, LineChart, AreaChart, Area } from "recharts";
import { ArrowUpRight, ArrowDownRight, Users, Printer, DollarSign, Phone, Headphones, Clock, CheckCircle2, Calendar, AlertTriangle, Clock3 } from "lucide-react";
import { subDays, isAfter, parseISO } from "date-fns";
import { formatCurrency, formatNumber, formatDecimal } from "@/lib/utils";

function MatrixKpiTile({ title, value, subtext, trend, icon: Icon }: { title: string, value: string, subtext: string, trend?: 'up' | 'down' | 'neutral', icon: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</span>
        <Icon className="h-4 w-4 text-[#002D72]" />
      </div>
      <div className="text-2xl font-bold text-[#002D72] mb-1">{value}</div>
      <div className="flex items-center text-xs text-gray-500">
        {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-brand-green mr-1" />}
        {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />}
        <span className="truncate">{subtext}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: printJobs = [], isLoading: printJobsLoading } = usePrintJobs();
  const { data: activities = [], isLoading: activitiesLoading } = useActivities();
  const { data: surveys = [], isLoading: surveysLoading } = useSurveys();
  const { data: callRecords = [], isLoading: callsLoading } = useCallRecords();
  const { data: mailStats, isLoading: mailStatsLoading } = useMailComplianceStats();

  const isLoading = clientsLoading || printJobsLoading || activitiesLoading || surveysLoading || callsLoading || mailStatsLoading;
  if (isLoading) return <MatrixLayout><div className="text-center py-8 text-gray-600">Loading dashboard...</div></MatrixLayout>;
  
  // Filter Logic - default to last 30 days
  const days = 30;
  const startDate = subDays(new Date(), days);
  
  const activeClients = clients.filter(c => {
    const lastActivity = parseISO(c.lastActivityDate);
    return isAfter(lastActivity, subDays(new Date(), 90));
  }).length;
  
  const recentPrintVolume = printJobs
    .filter(j => isAfter(parseISO(j.date), startDate))
    .reduce((acc, curr) => acc + curr.pieces, 0);
  
  const recentSpend = printJobs
    .filter(j => isAfter(parseISO(j.date), startDate))
    .reduce((acc, curr) => acc + parseFloat(curr.cost), 0);

  // Calculate actual average survey score
  const allScores = surveys.map(s => s.score);
  const avgSurveyScore = allScores.length > 0 
    ? allScores.reduce((acc, score) => acc + score, 0) / allScores.length
    : 0;

  // Call center KPIs
  const recentCalls = callRecords.filter(c => {
    try {
      const t = typeof c.startTime === 'string' ? parseISO(c.startTime) : new Date(c.startTime);
      return isAfter(t, startDate);
    } catch { return false; }
  });
  const resolvedCalls = recentCalls.filter(c => c.status === 'Resolved');
  const openCalls = callRecords.filter(c => c.status === 'Open' || c.status === 'In Progress').length;
  const avgHandleTime = resolvedCalls.length > 0
    ? resolvedCalls.reduce((acc, c) => acc + ((c.handleTime || 0) / 60), 0) / resolvedCalls.length
    : 0;

  const atRiskClients = clients.filter(c => {
    const clientSurveys = surveys.filter(s => s.clientId === c.id);
    const avgScore = clientSurveys.length > 0
      ? clientSurveys.reduce((acc, curr) => acc + curr.score, 0) / clientSurveys.length
      : 10;
    const lastActivity = parseISO(c.lastActivityDate);
    const sixtyDaysAgo = subDays(new Date(), 60);
    const hasEscalations = callRecords.filter(cr => cr.clientId === c.id && cr.status === 'Escalated').length > 0;
    return c.status === 'At-Risk' || (avgScore < 6 && avgScore > 0) || !isAfter(lastActivity, sixtyDaysAgo) || hasEscalations;
  });

  // Chart Data Preparation
  const volumeData = printJobs
    .slice(0, 50) // Limit for demo
    .map(j => ({ name: j.date, volume: j.pieces, cost: j.cost }))
    .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

  return (
    <MatrixLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1"><span className="text-[#00A3E0]">Operations</span> <span className="text-[#002D72]">Dashboard</span></h1>
          <p className="text-sm text-[#231F20]/60">Real-time summary of key performance metrics</p>
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <MatrixKpiTile 
          title="Total Active Clients" 
          value={formatNumber(activeClients)} 
          subtext={`${formatNumber(clients.length)} enrolled`}
          trend="up"
          icon={Users}
        />
        <MatrixKpiTile 
          title="Calls Handled" 
          value={formatNumber(resolvedCalls.length)} 
          subtext={`Last ${days} days`}
          trend="up"
          icon={Headphones}
        />
        <MatrixKpiTile 
          title="Open Calls" 
          value={formatNumber(openCalls)} 
          subtext="Needs attention"
          trend={openCalls > 20 ? 'down' : 'neutral'}
          icon={Phone}
        />
        <MatrixKpiTile 
          title="Avg Handle Time" 
          value={avgHandleTime > 0 ? `${formatDecimal(avgHandleTime, 1)}m` : 'N/A'} 
          subtext={resolvedCalls.length > 0 ? `${resolvedCalls.length} calls` : 'No data'}
          trend={avgHandleTime < 8 ? 'up' : 'neutral'}
          icon={Clock}
        />
        <MatrixKpiTile 
          title="Print Volume" 
          value={formatNumber(recentPrintVolume)} 
          subtext={`Last ${days} days`}
          trend="up"
          icon={Printer}
        />
        <MatrixKpiTile 
          title="Print Spend" 
          value={formatCurrency(recentSpend, { abbreviated: true })} 
          subtext={`Last ${days} days`}
          trend="neutral"
          icon={DollarSign}
        />
      </div>

      {/* Mail Compliance KPIs */}
      <Card className="border-l-4 border-l-brand-green shadow-sm">
        <CardHeader>
          <CardTitle className="text-brand-navy">Mail Compliance & SLA Performance</CardTitle>
          <CardDescription>Municipal import-to-mail tracking and on-time delivery</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">On-Time %</span>
                <CheckCircle2 className="h-4 w-4 text-brand-green" />
              </div>
              <div className="text-3xl font-bold text-brand-navy">
                {mailStats?.onTimePercent.toFixed(1)}%
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {mailStats && mailStats.onTimePercent >= 95 ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 text-brand-green mr-1" />
                    <span>Above 95% target</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                    <span>Below 95% target</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Avg Business Days</span>
                <Calendar className="h-4 w-4 text-brand-navy" />
              </div>
              <div className="text-3xl font-bold text-brand-navy">
                {mailStats?.avgBusinessDays.toFixed(1)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {mailStats && mailStats.avgBusinessDays <= 3 ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 text-brand-green mr-1" />
                    <span>Within 3-day SLA</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                    <span>Above 3-day SLA</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Late Deliveries</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-brand-navy">
                {formatNumber(mailStats?.totalExceptions || 0)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>Exceptions tracked</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Pending Approval</span>
                <Clock3 className="h-4 w-4 text-brand-navy" />
              </div>
              <div className="text-3xl font-bold text-brand-navy">
                {formatNumber(mailStats?.unapprovedRuns || 0)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {mailStats && mailStats.unapprovedRuns > 5 ? (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-amber-500 mr-1" />
                    <span>Needs attention</span>
                  </>
                ) : (
                  <span>Normal flow</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Print Volume Trends</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#002D72" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#002D72" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="volume" stroke="#002D72" fillOpacity={1} fill="url(#colorVol)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle>At-Risk Clients</CardTitle>
            <CardDescription>Requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {atRiskClients.slice(0, 5).map(client => (
                <div key={client.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none text-brand-navy">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.utilityType} • {client.state}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-red-100 text-red-800">
                      Action Needed
                    </span>
                  </div>
                </div>
              ))}
              {atRiskClients.length === 0 && <p className="text-sm text-muted-foreground">No clients currently at risk.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Volume Outlook (36 Months)</CardTitle>
          <CardDescription>Projected growth based on current trajectory</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Array.from({ length: 36 }).map((_, i) => ({
                  month: i + 1,
                  volume: Math.round(recentPrintVolume * (1 + (i * 0.03)))
                }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={false} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatNumber(value)} labelFormatter={(label) => `Month ${label}`} />
                  <Bar dataKey="volume" fill="#002D72" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>
           <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono">
              <span>Now</span>
              <span>+12 Months</span>
              <span>+24 Months</span>
              <span>+36 Months</span>
           </div>
        </CardContent>
      </Card>
    </div>
    </MatrixLayout>
  );
}
