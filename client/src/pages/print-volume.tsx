import React, { useState, useMemo } from "react";
import { usePrintJobs, useClients, useDeletePrintJob } from "@/lib/queries";
import { MatrixLayout } from "@/components/matrix/matrix-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Printer, FileText, DollarSign, TrendingUp, Search, Download, Filter, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { PrintJobForm } from "@/components/forms";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrintJob } from "@/lib/types";

export default function PrintVolume() {
  const { data: printJobs = [], isLoading } = usePrintJobs();
  const { data: clients = [] } = useClients();
  const deletePrintJob = useDeletePrintJob();
  const [, setLocation] = useLocation();
  const [multiplier, setMultiplier] = useState([1]);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<PrintJob | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Unknown';

  // Calculate KPI metrics
  const stats = useMemo(() => {
    const totalPieces = printJobs.reduce((sum, job) => sum + job.pieces, 0);
    const totalPages = printJobs.reduce((sum, job) => sum + job.pages, 0);
    const totalCost = printJobs.reduce((sum, job) => sum + (typeof job.cost === 'number' ? job.cost : parseFloat(job.cost) || 0), 0);
    const completedJobs = printJobs.filter(j => j.status === 'Completed').length;
    const processingJobs = printJobs.filter(j => j.status === 'Processing').length;
    const avgPagesPerJob = printJobs.length > 0 ? Math.round(totalPages / printJobs.length) : 0;
    
    return {
      totalPieces,
      totalPages,
      totalCost,
      totalJobs: printJobs.length,
      completedJobs,
      processingJobs,
      avgPagesPerJob
    };
  }, [printJobs]);

  // Aggregate data by month for chart
  const monthlyData = useMemo(() => {
    return printJobs.reduce((acc: any[], job) => {
      const month = job.date.substring(0, 7);
      const existing = acc.find(item => item.name === month);
      const costValue = typeof job.cost === 'number' ? job.cost : parseFloat(job.cost) || 0;
      if (existing) {
        existing.pieces += job.pieces;
        existing.pages += job.pages;
        existing.cost += costValue;
      } else {
        acc.push({ name: month, pieces: job.pieces, pages: job.pages, cost: costValue });
      }
      return acc;
    }, []).sort((a, b) => a.name.localeCompare(b.name)).slice(-12);
  }, [printJobs]);

  const projectedData = monthlyData.map(d => ({
    ...d,
    projected: Math.floor(d.pieces * multiplier[0])
  }));

  // Provider breakdown for pie chart
  const providerBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    printJobs.forEach(job => {
      breakdown[job.provider] = (breakdown[job.provider] || 0) + job.pieces;
    });
    return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  }, [printJobs]);

  const COLORS = ['#002D72', '#10b981', '#f59e0b', '#6366f1'];

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return printJobs.filter(job => {
      const matchesSearch = searchTerm === "" || 
        getClientName(job.clientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.provider.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const matchesProvider = providerFilter === "all" || job.provider === providerFilter;
      const matchesClient = clientFilter === "all" || job.clientId === clientFilter;
      return matchesSearch && matchesStatus && matchesProvider && matchesClient;
    });
  }, [printJobs, searchTerm, statusFilter, providerFilter, clientFilter, clients]);

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Completed: 'bg-green-100 text-green-800 border-green-200',
      Processing: 'bg-blue-100 text-blue-800 border-blue-200',
      Failed: 'bg-red-100 text-red-800 border-red-200'
    };
    return <Badge variant="outline" className={styles[status] || ''}>{status}</Badge>;
  };

  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Client', 'Provider', 'Pieces', 'Pages', 'Cost', 'Status'];
    const rows = filteredJobs.map(job => [
      escapeCSV(job.date),
      escapeCSV(getClientName(job.clientId)),
      escapeCSV(job.provider),
      job.pieces.toString(),
      job.pages.toString(),
      `$${job.cost}`,
      escapeCSV(job.status)
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `print-volume-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <MatrixLayout>
        <div className="p-6 text-center py-8 text-muted-foreground">Loading print volume data...</div>
      </MatrixLayout>
    );
  }

  return (
    <MatrixLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Print Volume</h1>
          <p className="text-muted-foreground">Track print production metrics, capacity planning, and cost analysis</p>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <FileText className="h-4 w-4" />
                Total Pieces
              </div>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-total-pieces">
                {stats.totalPieces.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Printer className="h-4 w-4" />
                Total Pages
              </div>
              <div className="text-2xl font-bold text-green-600" data-testid="text-total-pages">
                {stats.totalPages.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                Total Cost
              </div>
              <div className="text-2xl font-bold text-amber-600" data-testid="text-total-cost">
                ${stats.totalCost.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                Avg Pages/Job
              </div>
              <div className="text-2xl font-bold text-purple-600" data-testid="text-avg-pages">
                {stats.avgPagesPerJob.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                Completed
              </div>
              <div className="text-2xl font-bold text-emerald-600" data-testid="text-completed-jobs">
                {stats.completedJobs}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                Processing
              </div>
              <div className="text-2xl font-bold text-cyan-600" data-testid="text-processing-jobs">
                {stats.processingJobs}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Historical Volume vs. Projection</CardTitle>
              <CardDescription>Monthly print volume with growth projection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectedData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => value.toLocaleString()} />
                    <Legend />
                    <Bar dataKey="pieces" name="Actual Volume" fill="#002D72" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="projected" name="Projected Volume" fill="#10b981" radius={[4, 4, 0, 0]} fillOpacity={0.6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-green-500">
            <CardHeader>
              <CardTitle>Volume Simulator</CardTitle>
              <CardDescription>Adjust growth multiplier to test capacity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Growth Factor</span>
                  <span className="text-2xl font-bold text-green-600">{multiplier[0]}x</span>
                </div>
                <Slider 
                  value={multiplier} 
                  onValueChange={setMultiplier} 
                  min={1} 
                  max={5} 
                  step={0.5} 
                  className="py-4"
                  data-testid="slider-growth"
                />
                <p className="text-sm text-muted-foreground">
                  Projecting {multiplier[0]}x volume for capacity planning.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Est. Annual Pieces</span>
                  <span className="font-bold">{(stats.totalPieces * multiplier[0] * 12).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Est. Annual Cost</span>
                  <span className="font-bold">${(stats.totalCost * multiplier[0] * 12).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Provider Breakdown */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Volume by Provider</CardTitle>
              <CardDescription>Distribution across print providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={providerBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                      {providerBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Cost Trend</CardTitle>
              <CardDescription>Print costs over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Print Job Registry</CardTitle>
                <CardDescription>All print jobs with filtering and export</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToCSV} data-testid="button-export-csv">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button onClick={() => { setEditingJob(undefined); setShowForm(true); }} data-testid="button-add-job">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Print Job
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client or provider..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px]" data-testid="select-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={providerFilter} onValueChange={(v) => { setProviderFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px]" data-testid="select-provider">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="DDSY">DDSY</SelectItem>
                  <SelectItem value="DDS">DDS</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={clientFilter} onValueChange={(v) => { setClientFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[180px]" data-testid="select-client">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Pieces</TableHead>
                    <TableHead className="text-right">Pages</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No print jobs found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedJobs.map((job) => (
                      <TableRow key={job.id} className="hover:bg-slate-50">
                        <TableCell className="font-mono text-sm">{job.date}</TableCell>
                        <TableCell>
                          <Button 
                            variant="link" 
                            className="p-0 h-auto font-medium text-blue-600" 
                            onClick={() => setLocation(`/clients/${job.clientId}`)}
                            data-testid={`link-client-${job.id}`}
                          >
                            {getClientName(job.clientId)}
                          </Button>
                        </TableCell>
                        <TableCell>{job.provider}</TableCell>
                        <TableCell className="text-right font-mono">{job.pieces.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{job.pages.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">${job.cost.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setEditingJob(job); setShowForm(true); }}
                              data-testid={`button-edit-${job.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { 
                                if(confirm('Delete this print job?')) deletePrintJob.mutate(job.id);
                              }}
                              data-testid={`button-delete-${job.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredJobs.length)} of {filteredJobs.length} jobs
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PrintJobForm 
        open={showForm} 
        onOpenChange={setShowForm} 
        job={editingJob} 
      />
    </MatrixLayout>
  );
}
