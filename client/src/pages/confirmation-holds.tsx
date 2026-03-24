import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MatrixLayout } from "@/components/matrix/matrix-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle, CheckCircle2, XCircle, Clock, Play, StopCircle, 
  Filter, Search, Building2, ChevronLeft, ChevronRight, Calendar,
  AlertOctagon, ArrowRight, User
} from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { useLocation } from "wouter";
import type { Client, User as UserType, ProductionRun } from "@shared/schema";

interface ConfirmationHold {
  id: string;
  holdType: string;
  status: string;
  priority: string;
  linkedEntityType: string;
  linkedEntityId: string;
  clientId: string;
  holdReason: string;
  holdDetails: string | null;
  requestedBy: string;
  assignedTo: string | null;
  holdStartedAt: string;
  dueDate: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolution: string | null;
  resolutionNotes: string | null;
  affectedRecords: number;
  affectedValue: string | null;
  escalationCount: number;
  autoReleaseAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface HoldsStats {
  active: number;
  released: number;
  rejected: number;
  expired: number;
  critical: number;
  overdue: number;
}

export default function ConfirmationHolds() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("Active");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedHold, setSelectedHold] = useState<ConfirmationHold | null>(null);
  const [actionType, setActionType] = useState<'release' | 'reject' | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const pageSize = 20;

  const { data: stats } = useQuery<HoldsStats>({
    queryKey: ["/api/confirmation-holds/stats"],
  });

  const { data: holds = [] } = useQuery<ConfirmationHold[]>({
    queryKey: ["/api/confirmation-holds"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: runs = [] } = useQuery<ProductionRun[]>({
    queryKey: ["/api/production-runs"],
  });

  const clientMap = useMemo(() => {
    const map: Record<string, Client> = {};
    clients.forEach(c => { map[c.id] = c; });
    return map;
  }, [clients]);

  const userMap = useMemo(() => {
    const map: Record<string, UserType> = {};
    users.forEach(u => { map[u.id] = u; });
    return map;
  }, [users]);

  const runMap = useMemo(() => {
    const map: Record<string, ProductionRun> = {};
    runs.forEach(r => { map[r.id] = r; });
    return map;
  }, [runs]);

  const releaseMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await fetch(`/api/confirmation-holds/${id}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolvedBy: 'u1', notes }),
      });
      if (!res.ok) throw new Error('Failed to release hold');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/confirmation-holds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/confirmation-holds/stats"] });
      setSelectedHold(null);
      setActionType(null);
      setResolutionNotes("");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await fetch(`/api/confirmation-holds/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolvedBy: 'u1', notes }),
      });
      if (!res.ok) throw new Error('Failed to reject hold');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/confirmation-holds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/confirmation-holds/stats"] });
      setSelectedHold(null);
      setActionType(null);
      setResolutionNotes("");
    },
  });

  const filteredHolds = useMemo(() => {
    return holds.filter(hold => {
      if (statusFilter !== "all" && hold.status !== statusFilter) return false;
      if (priorityFilter !== "all" && hold.priority !== priorityFilter) return false;
      if (typeFilter !== "all" && hold.holdType !== typeFilter) return false;
      
      if (searchTerm) {
        const client = clientMap[hold.clientId];
        const searchLower = searchTerm.toLowerCase();
        if (!hold.holdReason.toLowerCase().includes(searchLower) &&
            !client?.name.toLowerCase().includes(searchLower) &&
            !hold.id.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      const priorityOrder: Record<string, number> = { Critical: 0, High: 1, Normal: 2, Low: 3 };
      if (a.status === 'Active' && b.status === 'Active') {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
      }
      return new Date(b.holdStartedAt).getTime() - new Date(a.holdStartedAt).getTime();
    });
  }, [holds, statusFilter, priorityFilter, typeFilter, searchTerm, clientMap]);

  const paginatedHolds = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHolds.slice(start, start + pageSize);
  }, [filteredHolds, currentPage]);

  const totalPages = Math.ceil(filteredHolds.length / pageSize);

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      Critical: 'bg-red-100 text-red-800 border-red-200',
      High: 'bg-orange-100 text-orange-800 border-orange-200',
      Normal: 'bg-blue-100 text-blue-800 border-blue-200',
      Low: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return <Badge variant="outline" className={styles[priority] || styles.Normal}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { class: string; icon: React.ReactNode }> = {
      Active: { class: 'bg-amber-100 text-amber-800 border-amber-200', icon: <Clock className="h-3 w-3 mr-1" /> },
      Released: { class: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      Rejected: { class: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="h-3 w-3 mr-1" /> },
      Expired: { class: 'bg-gray-100 text-gray-800 border-gray-200', icon: <StopCircle className="h-3 w-3 mr-1" /> },
    };
    const style = styles[status] || styles.Active;
    return (
      <Badge variant="outline" className={`flex items-center ${style.class}`}>
        {style.icon}
        {status}
      </Badge>
    );
  };

  const handleAction = (hold: ConfirmationHold, action: 'release' | 'reject') => {
    setSelectedHold(hold);
    setActionType(action);
    setResolutionNotes("");
  };

  const confirmAction = () => {
    if (!selectedHold || !actionType) return;
    
    if (actionType === 'release') {
      releaseMutation.mutate({ id: selectedHold.id, notes: resolutionNotes });
    } else {
      rejectMutation.mutate({ id: selectedHold.id, notes: resolutionNotes });
    }
  };

  return (
    <MatrixLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]" data-testid="page-title">Confirmation Holds</h1>
            <p className="text-sm text-gray-600">Manage items pending confirmation before proceeding</p>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
          <Card className="border-l-4 border-l-amber-500 cursor-pointer hover:shadow-md" onClick={() => setStatusFilter('Active')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Active Holds</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-amber-600" data-testid="metric-active">{stats?.active || 0}</div>
              <p className="text-xs text-muted-foreground">Requiring action</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 cursor-pointer hover:shadow-md" onClick={() => { setStatusFilter('Active'); setPriorityFilter('Critical'); }}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Critical</span>
                <AlertOctagon className="h-4 w-4 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-red-600" data-testid="metric-critical">{stats?.critical || 0}</div>
              <p className="text-xs text-muted-foreground">Urgent attention</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Overdue</span>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-orange-600" data-testid="metric-overdue">{stats?.overdue || 0}</div>
              <p className="text-xs text-muted-foreground">Past due date</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-md" onClick={() => setStatusFilter('Released')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Released</span>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-green-600" data-testid="metric-released">{stats?.released || 0}</div>
              <p className="text-xs text-muted-foreground">Approved to proceed</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-400 cursor-pointer hover:shadow-md" onClick={() => setStatusFilter('Rejected')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Rejected</span>
                <XCircle className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-3xl font-bold text-red-500" data-testid="metric-rejected">{stats?.rejected || 0}</div>
              <p className="text-xs text-muted-foreground">Not approved</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gray-400 cursor-pointer hover:shadow-md" onClick={() => setStatusFilter('Expired')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Expired</span>
                <StopCircle className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-gray-500" data-testid="metric-expired">{stats?.expired || 0}</div>
              <p className="text-xs text-muted-foreground">Time limit reached</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-[#1e3a5f]">Hold Queue</CardTitle>
            <CardDescription>Manage and resolve confirmation holds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search hold ID, client, or reason..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px]" data-testid="select-status">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Released">Released</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px]" data-testid="select-priority">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[170px]" data-testid="select-type">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Hold Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="QA Review">QA Review</SelectItem>
                  <SelectItem value="Client Approval">Client Approval</SelectItem>
                  <SelectItem value="Payment Hold">Payment Hold</SelectItem>
                  <SelectItem value="Data Verification">Data Verification</SelectItem>
                  <SelectItem value="Manager Override">Manager Override</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/80">
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Hold ID</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Client</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Reason</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Priority</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Hold Age</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Due</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Records</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHolds.map((hold) => {
                    const client = clientMap[hold.clientId];
                    const isOverdue = hold.dueDate && isPast(new Date(hold.dueDate)) && hold.status === 'Active';
                    
                    return (
                      <tr 
                        key={hold.id} 
                        className={`border-b hover:bg-gray-50 ${hold.priority === 'Critical' ? 'bg-red-50/50' : isOverdue ? 'bg-orange-50/50' : ''}`}
                        data-testid={`row-hold-${hold.id}`}
                      >
                        <td className="px-4 py-3 font-mono text-blue-600">{hold.id}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="bg-gray-50">{hold.holdType}</Badge>
                        </td>
                        <td className="px-4 py-3">{client?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate" title={hold.holdReason}>
                          {hold.holdReason}
                        </td>
                        <td className="px-4 py-3">{getPriorityBadge(hold.priority)}</td>
                        <td className="px-4 py-3">{getStatusBadge(hold.status)}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDistanceToNow(new Date(hold.holdStartedAt), { addSuffix: true })}
                        </td>
                        <td className="px-4 py-3">
                          {hold.dueDate ? (
                            <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                              {format(new Date(hold.dueDate), 'MMM d')}
                              {isOverdue && ' (Overdue)'}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {hold.affectedRecords.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {hold.status === 'Active' && (
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => handleAction(hold, 'release')}
                                data-testid={`btn-release-${hold.id}`}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Release
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleAction(hold, 'reject')}
                                data-testid={`btn-reject-${hold.id}`}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {hold.status !== 'Active' && hold.linkedEntityType === 'ProductionRun' && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-blue-600"
                              onClick={() => navigate(`/production/${hold.linkedEntityId}`)}
                              data-testid={`btn-view-run-${hold.id}`}
                            >
                              <ArrowRight className="h-3 w-3 mr-1" />
                              View Run
                            </Button>
                          )}
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
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredHolds.length)} of {filteredHolds.length} holds
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

        <Dialog open={!!selectedHold && !!actionType} onOpenChange={() => { setSelectedHold(null); setActionType(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actionType === 'release' ? (
                  <>
                    <Play className="h-5 w-5 text-green-600" />
                    Release Hold
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    Reject Hold
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'release' 
                  ? 'This will release the hold and allow the linked item to proceed.'
                  : 'This will reject the hold request. The linked item will not proceed.'}
              </DialogDescription>
            </DialogHeader>
            
            {selectedHold && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hold ID:</span>
                    <span className="font-mono">{selectedHold.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span>{selectedHold.holdType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Client:</span>
                    <span>{clientMap[selectedHold.clientId]?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Affected Records:</span>
                    <span>{selectedHold.affectedRecords.toLocaleString()}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Resolution Notes {actionType === 'reject' && '(Required)'}
                  </label>
                  <Textarea
                    placeholder={actionType === 'release' 
                      ? 'Optional notes about the release...' 
                      : 'Please provide a reason for rejection...'}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={3}
                    data-testid="input-resolution-notes"
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => { setSelectedHold(null); setActionType(null); }}>
                Cancel
              </Button>
              <Button 
                onClick={confirmAction}
                className={actionType === 'release' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                disabled={(actionType === 'reject' && !resolutionNotes.trim()) || releaseMutation.isPending || rejectMutation.isPending}
                data-testid="btn-confirm-action"
              >
                {releaseMutation.isPending || rejectMutation.isPending ? 'Processing...' : actionType === 'release' ? 'Release Hold' : 'Reject Hold'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MatrixLayout>
  );
}
