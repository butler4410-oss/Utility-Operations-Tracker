import React, { useState, useMemo } from "react";
import { useClients, useUsers, useDeleteClient } from "@/lib/queries";
import { MatrixLayout } from "@/components/matrix/matrix-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Building2, Users, AlertTriangle, CheckCircle2, Clock, Edit, Trash2, Eye, ChevronLeft, ChevronRight, MapPin, Phone, Mail } from "lucide-react";
import { ClientForm } from "@/components/forms";
import { Client } from "@/lib/types";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Clients() {
  const { data: clients = [], isLoading } = useClients();
  const { data: users = [] } = useUsers();
  const deleteClient = useDeleteClient();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const getManagerName = (managerId: string) => {
    const manager = users.find(u => u.id === managerId);
    return manager ? manager.fullName : 'Unassigned';
  };

  // Calculate KPI metrics
  const stats = useMemo(() => {
    const active = clients.filter(c => c.status === 'Active').length;
    const atRisk = clients.filter(c => c.status === 'At-Risk').length;
    const onboarding = clients.filter(c => c.status === 'Onboarding').length;
    const inactive = clients.filter(c => c.status === 'Inactive').length;
    
    const byType: Record<string, number> = {};
    clients.forEach(c => {
      byType[c.utilityType] = (byType[c.utilityType] || 0) + 1;
    });
    
    const byState: Record<string, number> = {};
    clients.forEach(c => {
      byState[c.state] = (byState[c.state] || 0) + 1;
    });
    
    return { total: clients.length, active, atRisk, onboarding, inactive, byType, byState };
  }, [clients]);

  // Get unique states for filter
  const uniqueStates = useMemo(() => {
    return Array.from(new Set(clients.map(c => c.state))).sort();
  }, [clients]);

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = searchTerm === "" || 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.contactEmail && client.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      const matchesType = typeFilter === "all" || client.utilityType === typeFilter;
      const matchesProvider = providerFilter === "all" || client.provider === providerFilter;
      const matchesState = stateFilter === "all" || client.state === stateFilter;
      return matchesSearch && matchesStatus && matchesType && matchesProvider && matchesState;
    });
  }, [clients, searchTerm, statusFilter, typeFilter, providerFilter, stateFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { class: string; icon: React.ReactNode }> = {
      Active: { class: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      'At-Risk': { class: 'bg-red-100 text-red-800 border-red-200', icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
      Onboarding: { class: 'bg-blue-100 text-blue-800 border-blue-200', icon: <Clock className="h-3 w-3 mr-1" /> },
      Inactive: { class: 'bg-gray-100 text-gray-800 border-gray-200', icon: null }
    };
    const style = styles[status] || styles.Inactive;
    return (
      <Badge variant="outline" className={`${style.class} flex items-center`}>
        {style.icon}
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      Water: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      Electric: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Gas: 'bg-orange-100 text-orange-800 border-orange-200',
      'Multi-Service': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return <Badge variant="outline" className={colors[type] || 'bg-gray-100 text-gray-800'}>{type}</Badge>;
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this client? This will delete all associated data.')) {
      deleteClient.mutate(id);
    }
  };

  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return `"${value}"`;
  };

  const exportToCSV = () => {
    const headers = ['Code', 'Name', 'Status', 'Type', 'Provider', 'State', 'Manager', 'Contact Email', 'Contact Phone', 'Last Activity'];
    const rows = filteredClients.map(client => [
      escapeCSV(client.code),
      escapeCSV(client.name),
      escapeCSV(client.status),
      escapeCSV(client.utilityType),
      escapeCSV(client.provider),
      escapeCSV(client.state),
      escapeCSV(getManagerName(client.assignedManager)),
      escapeCSV(client.contactEmail || ''),
      escapeCSV(client.contactPhone || ''),
      escapeCSV(client.lastActivityDate)
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <MatrixLayout>
        <div className="p-6 text-center py-8 text-muted-foreground">Loading clients...</div>
      </MatrixLayout>
    );
  }

  return (
    <MatrixLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Management</h1>
          <p className="text-muted-foreground">Manage utility company clients, contracts, and service relationships</p>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Building2 className="h-4 w-4" />
                Total Clients
              </div>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-total-clients">
                {stats.total}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <CheckCircle2 className="h-4 w-4" />
                Active
              </div>
              <div className="text-2xl font-bold text-green-600" data-testid="text-active-clients">
                {stats.active}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <AlertTriangle className="h-4 w-4" />
                At-Risk
              </div>
              <div className="text-2xl font-bold text-red-600" data-testid="text-at-risk-clients">
                {stats.atRisk}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                Onboarding
              </div>
              <div className="text-2xl font-bold text-cyan-600" data-testid="text-onboarding-clients">
                {stats.onboarding}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gray-400">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                Inactive
              </div>
              <div className="text-2xl font-bold text-gray-600" data-testid="text-inactive-clients">
                {stats.inactive}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Client Directory</CardTitle>
                <CardDescription>All registered utility company clients</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToCSV} data-testid="button-export-csv">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button onClick={() => { setEditingClient(undefined); setShowForm(true); }} data-testid="button-add-client">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
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
                  placeholder="Search by name, code, or email..."
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
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="At-Risk">At-Risk</SelectItem>
                  <SelectItem value="Onboarding">Onboarding</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[150px]" data-testid="select-type">
                  <SelectValue placeholder="Utility Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Water">Water</SelectItem>
                  <SelectItem value="Electric">Electric</SelectItem>
                  <SelectItem value="Gas">Gas</SelectItem>
                  <SelectItem value="Multi-Service">Multi-Service</SelectItem>
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
              <Select value={stateFilter} onValueChange={(v) => { setStateFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[120px]" data-testid="select-state">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {uniqueStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Code</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No clients found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedClients.map((client) => (
                      <TableRow 
                        key={client.id} 
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => setLocation(`/clients/${client.id}`)}
                        data-testid={`row-client-${client.id}`}
                      >
                        <TableCell className="font-mono text-xs">{client.code}</TableCell>
                        <TableCell>
                          <span className="font-medium text-blue-600">{client.name}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(client.status)}</TableCell>
                        <TableCell>{getTypeBadge(client.utilityType)}</TableCell>
                        <TableCell>{client.provider}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {client.state}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{getManagerName(client.assignedManager)}</TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            {client.contactEmail && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[120px]">{client.contactEmail}</span>
                              </div>
                            )}
                            {client.contactPhone && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {client.contactPhone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{client.lastActivityDate}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setLocation(`/clients/${client.id}`)}
                              data-testid={`button-view-${client.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setEditingClient(client); setShowForm(true); }}
                              data-testid={`button-edit-${client.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(client.id)}
                              data-testid={`button-delete-${client.id}`}
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
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} clients
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

      <ClientForm 
        open={showForm} 
        onOpenChange={setShowForm} 
        client={editingClient} 
      />
    </MatrixLayout>
  );
}
