import { MatrixLayout } from "@/components/matrix/matrix-layout";
import { useActivities, useClients, usePrintJobs, useCallRecords } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, ArrowLeft, BarChart3, Printer, Mail, Phone, Users, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useDateRange } from "@/components/layout/header";
import { subDays, isAfter, parseISO, format } from "date-fns";

interface CostComparisonRow {
  clientId: string;
  clientName: string;
  printPieces: number;
  printCost: number;
  eBillSends: number;
  estEBillCost: number;
  estPrintEquivCost: number;
  savings: number;
  savingsPercent: number;
}

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const { data: activities = [] } = useActivities();
  const { data: clients = [] } = useClients();
  const { data: printJobs = [] } = usePrintJobs();
  const { data: callRecords = [] } = useCallRecords();
  const { range } = useDateRange();

  const [costComparison, setCostComparison] = useState<CostComparisonRow[]>([]);
  const [productionRuns, setProductionRuns] = useState<any[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  // Date Filtering Logic
  const days = range === 'custom' ? 90 : parseInt(range);
  const startDate = subDays(new Date(), days);
  const filterByDate = (dateStr: string) => isAfter(parseISO(dateStr), startDate);

  // Fetch additional data when specific reports are selected
  useEffect(() => {
    if (selectedReport === 'D') {
      setLoadingExtra(true);
      fetch('/api/cost-comparison', { credentials: 'include' })
        .then(r => r.json())
        .then(data => setCostComparison(data))
        .catch(() => setCostComparison([]))
        .finally(() => setLoadingExtra(false));
    }
    if (selectedReport === 'C') {
      setLoadingExtra(true);
      fetch('/api/production-runs', { credentials: 'include' })
        .then(r => r.json())
        .then(data => setProductionRuns(data))
        .catch(() => setProductionRuns([]))
        .finally(() => setLoadingExtra(false));
    }
  }, [selectedReport]);

  const reports = [
    { id: 'A', title: 'Client Activity Summary', desc: 'Detailed log of all activities by client and type.', icon: BarChart3 },
    { id: 'B', title: 'Print Spend & Volume', desc: 'Monthly breakdown of print pieces, pages, and costs.', icon: Printer },
    { id: 'C', title: 'Mail SLA Compliance Report', desc: 'On-time %, avg business days, and exceptions by client.', icon: Mail },
    { id: 'D', title: 'eBill vs Print Cost Analysis', desc: 'Per-client comparison of eBill savings vs print costs.', icon: Clock },
    { id: 'E', title: 'Call Center Performance', desc: 'FCR rates, avg handle time, and calls by reason.', icon: Phone },
    { id: 'F', title: 'Client Onboarding Status', desc: 'Clients by status (Active, Onboarding, At-Risk) with timeline.', icon: Users },
  ];

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Report Renderers
  const renderReport = (): { title: string; data: any[]; columns: ColumnDef<any>[] } | null => {
    switch (selectedReport) {
      case 'A': {
        const data = activities.filter(a => filterByDate(a.date)).map(a => ({
          Date: a.date,
          Client: clients.find(c => c.id === a.clientId)?.name ?? 'Unknown',
          Type: a.type,
          Owner: a.ownerId,
          Status: a.status,
          Effort: a.effortHours,
        }));
        const columns: ColumnDef<any>[] = [
          { accessorKey: 'Date', header: 'Date' },
          { accessorKey: 'Client', header: 'Client' },
          { accessorKey: 'Type', header: 'Type' },
          { accessorKey: 'Status', header: 'Status' },
          { accessorKey: 'Effort', header: 'Effort (Hrs)' },
        ];
        return { title: 'Client Activity Summary', data, columns };
      }
      case 'B': {
        const data = printJobs.filter(j => filterByDate(j.date)).map(j => ({
          Date: j.date,
          Client: clients.find(c => c.id === j.clientId)?.name ?? 'Unknown',
          Provider: j.provider,
          Pieces: j.pieces,
          Cost: j.cost,
        }));
        const columns: ColumnDef<any>[] = [
          { accessorKey: 'Date', header: 'Date' },
          { accessorKey: 'Client', header: 'Client' },
          { accessorKey: 'Provider', header: 'Provider' },
          { accessorKey: 'Pieces', header: 'Pieces' },
          { accessorKey: 'Cost', header: 'Cost ($)' },
        ];
        return { title: 'Print Spend & Volume', data, columns };
      }
      case 'C': {
        // Mail SLA Compliance Report
        const clientMap = new Map(clients.map(c => [c.id, c.name]));
        const grouped: Record<string, { total: number; onTime: number; late: number; totalBizDays: number; exceptions: number }> = {};

        for (const run of productionRuns) {
          const clientName = clientMap.get(run.clientId) ?? 'Unknown';
          if (!grouped[clientName]) {
            grouped[clientName] = { total: 0, onTime: 0, late: 0, totalBizDays: 0, exceptions: 0 };
          }
          grouped[clientName].total += 1;
          if (run.isOnTime === 1) grouped[clientName].onTime += 1;
          if (run.isOnTime === 0) grouped[clientName].late += 1;
          if (run.exceptionReason) grouped[clientName].exceptions += 1;

          // Calculate business days between import and actual mail date
          if (run.importDateTime && run.actualMailDate) {
            const importDt = new Date(run.importDateTime);
            const mailDt = new Date(run.actualMailDate);
            const diffMs = mailDt.getTime() - importDt.getTime();
            const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
            grouped[clientName].totalBizDays += diffDays;
          }
        }

        const data = Object.entries(grouped).map(([clientName, stats]) => ({
          'Client Name': clientName,
          'Total Runs': stats.total,
          'On-Time Runs': stats.onTime,
          'Late Runs': stats.late,
          'On-Time %': stats.total > 0 ? `${Math.round((stats.onTime / stats.total) * 100)}%` : 'N/A',
          'Avg Business Days': stats.total > 0 ? (stats.totalBizDays / stats.total).toFixed(1) : 'N/A',
          'Exceptions': stats.exceptions,
        }));

        const columns: ColumnDef<any>[] = [
          { accessorKey: 'Client Name', header: 'Client Name' },
          { accessorKey: 'Total Runs', header: 'Total Runs' },
          { accessorKey: 'On-Time Runs', header: 'On-Time Runs' },
          { accessorKey: 'Late Runs', header: 'Late Runs' },
          { accessorKey: 'On-Time %', header: 'On-Time %' },
          { accessorKey: 'Avg Business Days', header: 'Avg Business Days' },
          { accessorKey: 'Exceptions', header: 'Exceptions' },
        ];
        return { title: 'Mail SLA Compliance Report', data, columns };
      }
      case 'D': {
        // eBill vs Print Cost Analysis
        const data = costComparison.map(row => ({
          'Client Name': row.clientName,
          'Print Pieces (30d)': row.printPieces,
          'Print Cost (30d)': `$${row.printCost.toFixed(2)}`,
          'eBill Sends (30d)': row.eBillSends,
          'Est. eBill Cost': `$${row.estEBillCost.toFixed(2)}`,
          'Est. Print Cost': `$${row.estPrintEquivCost.toFixed(2)}`,
          'Savings': `$${row.savings.toFixed(2)}`,
          'Savings %': `${row.savingsPercent.toFixed(1)}%`,
        }));

        const columns: ColumnDef<any>[] = [
          { accessorKey: 'Client Name', header: 'Client Name' },
          { accessorKey: 'Print Pieces (30d)', header: 'Print Pieces (30d)' },
          { accessorKey: 'Print Cost (30d)', header: 'Print Cost (30d)' },
          { accessorKey: 'eBill Sends (30d)', header: 'eBill Sends (30d)' },
          { accessorKey: 'Est. eBill Cost', header: 'Est. eBill Cost ($0.15/send)' },
          { accessorKey: 'Est. Print Cost', header: 'Est. Print Cost ($0.85/piece)' },
          { accessorKey: 'Savings', header: 'Savings' },
          { accessorKey: 'Savings %', header: 'Savings %' },
        ];
        return { title: 'eBill vs Print Cost Analysis', data, columns };
      }
      case 'E': {
        // Call Center Performance
        const clientMap = new Map(clients.map(c => [c.id, c.name]));
        const grouped: Record<string, { total: number; fcrSum: number; handleTimeSum: number; handleTimeCount: number; reasons: Record<string, number> }> = {};

        for (const record of callRecords) {
          const clientName = clientMap.get(record.clientId) ?? 'Unknown';
          if (!grouped[clientName]) {
            grouped[clientName] = { total: 0, fcrSum: 0, handleTimeSum: 0, handleTimeCount: 0, reasons: {} };
          }
          grouped[clientName].total += 1;
          grouped[clientName].fcrSum += record.firstContactResolution ?? 0;
          if (record.handleTime) {
            grouped[clientName].handleTimeSum += record.handleTime;
            grouped[clientName].handleTimeCount += 1;
          }
          const reason = record.callReason || 'Other';
          grouped[clientName].reasons[reason] = (grouped[clientName].reasons[reason] || 0) + 1;
        }

        const data = Object.entries(grouped).map(([clientName, stats]) => {
          const topReason = Object.entries(stats.reasons).sort((a, b) => b[1] - a[1])[0];
          return {
            'Client Name': clientName,
            'Total Calls': stats.total,
            'FCR Rate': stats.total > 0 ? `${Math.round((stats.fcrSum / stats.total) * 100)}%` : 'N/A',
            'Avg Handle Time': stats.handleTimeCount > 0 ? `${Math.round(stats.handleTimeSum / stats.handleTimeCount)}s` : 'N/A',
            'Top Reason': topReason ? `${topReason[0]} (${topReason[1]})` : 'N/A',
          };
        });

        const columns: ColumnDef<any>[] = [
          { accessorKey: 'Client Name', header: 'Client Name' },
          { accessorKey: 'Total Calls', header: 'Total Calls' },
          { accessorKey: 'FCR Rate', header: 'FCR Rate' },
          { accessorKey: 'Avg Handle Time', header: 'Avg Handle Time' },
          { accessorKey: 'Top Reason', header: 'Top Call Reason' },
        ];
        return { title: 'Call Center Performance', data, columns };
      }
      case 'F': {
        // Client Onboarding Status
        const data = clients.map(c => ({
          'Client Name': c.name,
          'Code': c.code,
          'Status': c.status,
          'Utility Type': c.utilityType,
          'State': c.state,
          'Provider': c.provider,
          'Contract Start': c.contractStartDate,
          'Last Activity': c.lastActivityDate,
        }));

        const columns: ColumnDef<any>[] = [
          { accessorKey: 'Client Name', header: 'Client Name' },
          { accessorKey: 'Code', header: 'Code' },
          { accessorKey: 'Status', header: 'Status' },
          { accessorKey: 'Utility Type', header: 'Utility Type' },
          { accessorKey: 'State', header: 'State' },
          { accessorKey: 'Provider', header: 'Provider' },
          { accessorKey: 'Contract Start', header: 'Contract Start' },
          { accessorKey: 'Last Activity', header: 'Last Activity' },
        ];
        return { title: 'Client Onboarding Status', data, columns };
      }
      default:
        return null;
    }
  };

  const currentReport = renderReport();

  if (selectedReport && loadingExtra) {
    return (
      <MatrixLayout>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Loading report data...
            </CardContent>
          </Card>
        </div>
      </MatrixLayout>
    );
  }

  if (selectedReport && currentReport) {
    return (
      <MatrixLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[#1e3a5f] mb-4">Report: {currentReport.title}</h1>
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports
            </Button>
            <Button onClick={() => exportCSV(currentReport.data, `report-${selectedReport}-${format(new Date(), 'yyyy-MM-dd')}`)}>
              <FileDown className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <DataTable columns={currentReport.columns} data={currentReport.data} />
            </CardContent>
          </Card>
        </div>
      </MatrixLayout>
    );
  }

  return (
    <MatrixLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2">Reports & Analytics</h1>
        <p className="text-gray-600 mb-6">Select a report to view detailed data and export to CSV.</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className="hover:border-[#1e3a5f]/50 transition-colors cursor-pointer group"
                onClick={() => setSelectedReport(report.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded bg-[#1e3a5f]/10">
                      <Icon className="h-5 w-5 text-[#1e3a5f]" />
                    </div>
                    <CardTitle className="text-base">{report.title}</CardTitle>
                  </div>
                  <CardDescription>{report.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full group-hover:bg-[#1e3a5f] group-hover:text-white transition-colors">
                    View Report
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MatrixLayout>
  );
}
