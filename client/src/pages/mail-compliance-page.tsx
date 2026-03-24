import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MatrixLayout } from "@/components/matrix/matrix-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, XCircle, AlertTriangle, Clock, TrendingUp, TrendingDown,
  Download, Filter, Calendar, ChevronLeft, ChevronRight, Search, Building2
} from "lucide-react";
import { format, parseISO, subDays, differenceInBusinessDays, isWithinInterval } from "date-fns";
import { useLocation } from "wouter";
import type { ProductionRun, Client } from "@shared/schema";

export default function MailCompliancePage() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const { data: stats } = useQuery<{ onTimePercent: number; avgBusinessDays: number; totalExceptions: number; unapprovedRuns: number }>({
    queryKey: ["/api/mail-compliance/stats"],
  });

  const { data: runs = [] } = useQuery<ProductionRun[]>({
    queryKey: ["/api/production-runs"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const clientMap = useMemo(() => {
    const map: Record<string, Client> = {};
    clients.forEach(c => { map[c.id] = c; });
    return map;
  }, [clients]);

  const filteredRuns = useMemo(() => {
    const cutoffDate = subDays(new Date(), parseInt(dateRange));
    
    return runs.filter(run => {
      const importDate = new Date(run.importDateTime);
      if (importDate < cutoffDate) return false;
      
      if (statusFilter !== "all") {
        if (statusFilter === "onTime" && run.isOnTime !== 1) return false;
        if (statusFilter === "late" && run.isOnTime !== 0) return false;
        if (statusFilter === "pending" && run.actualMailDate !== null) return false;
      }
      
      if (clientFilter !== "all" && run.clientId !== clientFilter) return false;
      
      if (searchTerm) {
        const client = clientMap[run.clientId];
        const searchLower = searchTerm.toLowerCase();
        if (!run.importBatchId.toLowerCase().includes(searchLower) &&
            !client?.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => new Date(b.importDateTime).getTime() - new Date(a.importDateTime).getTime());
  }, [runs, statusFilter, clientFilter, dateRange, searchTerm, clientMap]);

  const exceptionBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredRuns.filter(r => r.isOnTime === 0 && r.exceptionReason).forEach(run => {
      const reason = run.exceptionReason || 'Unknown';
      breakdown[reason] = (breakdown[reason] || 0) + 1;
    });
    return Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  }, [filteredRuns]);

  const complianceMetrics = useMemo(() => {
    const mailed = filteredRuns.filter(r => r.actualMailDate);
    const onTime = mailed.filter(r => r.isOnTime === 1).length;
    const late = mailed.filter(r => r.isOnTime === 0).length;
    const pending = filteredRuns.filter(r => !r.actualMailDate).length;
    
    let totalBusinessDays = 0;
    let countWithDays = 0;
    mailed.forEach(run => {
      if (run.actualMailDate) {
        const days = differenceInBusinessDays(parseISO(run.actualMailDate), new Date(run.importDateTime));
        if (days >= 0) {
          totalBusinessDays += days;
          countWithDays++;
        }
      }
    });
    
    return {
      total: filteredRuns.length,
      onTime,
      late,
      pending,
      onTimePercent: mailed.length > 0 ? ((onTime / mailed.length) * 100).toFixed(1) : '0.0',
      avgDays: countWithDays > 0 ? (totalBusinessDays / countWithDays).toFixed(1) : '0.0',
    };
  }, [filteredRuns]);

  const paginatedRuns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRuns.slice(start, start + pageSize);
  }, [filteredRuns, currentPage]);

  const totalPages = Math.ceil(filteredRuns.length / pageSize);

  const exportToCSV = () => {
    const headers = ['Batch ID', 'Client', 'Import Date', 'Target Mail Date', 'Actual Mail Date', 'On Time', 'Business Days', 'Exception Reason'];
    const csvData = filteredRuns.map(run => {
      const client = clientMap[run.clientId];
      const businessDays = run.actualMailDate 
        ? differenceInBusinessDays(parseISO(run.actualMailDate), new Date(run.importDateTime))
        : '';
      return [
        run.importBatchId,
        client?.name || '',
        format(new Date(run.importDateTime), 'yyyy-MM-dd'),
        run.targetMailDate,
        run.actualMailDate || '',
        run.isOnTime === 1 ? 'Yes' : run.isOnTime === 0 ? 'No' : 'Pending',
        businessDays,
        run.exceptionReason || ''
      ].join(',');
    });
    
    const csv = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mail-compliance-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  };

  const getStatusBadge = (run: ProductionRun) => {
    if (!run.actualMailDate) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200" data-testid={`status-pending-${run.id}`}>Pending</Badge>;
    }
    if (run.isOnTime === 1) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200" data-testid={`status-ontime-${run.id}`}>On Time</Badge>;
    }
    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200" data-testid={`status-late-${run.id}`}>Late</Badge>;
  };

  return (
    <MatrixLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]" data-testid="page-title">Mail Compliance</h1>
            <p className="text-sm text-gray-600">SLA tracking and exception management for production runs</p>
          </div>
          <Button onClick={exportToCSV} variant="outline" data-testid="btn-export-csv">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total Runs</span>
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-[#1e3a5f]" data-testid="metric-total-runs">{complianceMetrics.total}</div>
              <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">On-Time %</span>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-green-600" data-testid="metric-ontime-percent">{complianceMetrics.onTimePercent}%</div>
              <p className="text-xs text-muted-foreground">{complianceMetrics.onTime} of {complianceMetrics.onTime + complianceMetrics.late} mailed</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Late Runs</span>
                <XCircle className="h-4 w-4 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-red-600" data-testid="metric-late-runs">{complianceMetrics.late}</div>
              <p className="text-xs text-muted-foreground">Exceptions requiring review</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Pending</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-amber-600" data-testid="metric-pending">{complianceMetrics.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting mail date</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Avg Business Days</span>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-3xl font-bold text-purple-600" data-testid="metric-avg-days">{complianceMetrics.avgDays}</div>
              <p className="text-xs text-muted-foreground">Import to mail</p>
            </CardContent>
          </Card>
        </div>

        {exceptionBreakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-[#1e3a5f]">Exception Breakdown</CardTitle>
              <CardDescription>Reasons for late mail in selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {exceptionBreakdown.slice(0, 8).map(([reason, count]) => (
                  <div key={reason} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <span className="text-sm text-gray-700 truncate mr-2">{reason}</span>
                    <Badge variant="destructive" className="shrink-0">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-[#1e3a5f]">Production Runs</CardTitle>
            <CardDescription>Filterable list of all production runs with SLA status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search batch ID or client..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[150px]" data-testid="select-status">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="onTime">On Time</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={clientFilter} onValueChange={(v) => { setClientFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[200px]" data-testid="select-client">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.slice(0, 50).map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[150px]" data-testid="select-date-range">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="60">Last 60 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/80">
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Batch ID</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Client</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Import Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Target Mail</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Actual Mail</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Days</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Exception</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRuns.map((run) => {
                    const client = clientMap[run.clientId];
                    const businessDays = run.actualMailDate 
                      ? differenceInBusinessDays(parseISO(run.actualMailDate), new Date(run.importDateTime))
                      : null;
                    
                    return (
                      <tr 
                        key={run.id} 
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/production/${run.id}`)}
                        data-testid={`row-run-${run.id}`}
                      >
                        <td className="px-4 py-3 font-mono text-blue-600 hover:underline">{run.importBatchId}</td>
                        <td className="px-4 py-3">{client?.name || 'Unknown'}</td>
                        <td className="px-4 py-3">{format(new Date(run.importDateTime), 'MMM d, yyyy')}</td>
                        <td className="px-4 py-3">{run.targetMailDate}</td>
                        <td className="px-4 py-3">{run.actualMailDate || '—'}</td>
                        <td className="px-4 py-3">{getStatusBadge(run)}</td>
                        <td className="px-4 py-3">
                          {businessDays !== null ? (
                            <span className={businessDays > 3 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                              {businessDays}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                          {run.exceptionReason || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredRuns.length)} of {filteredRuns.length} runs
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    data-testid="btn-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    data-testid="btn-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MatrixLayout>
  );
}
