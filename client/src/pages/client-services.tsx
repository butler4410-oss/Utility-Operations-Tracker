import { useState, useEffect, useMemo } from "react";
import { MatrixLayout } from "@/components/matrix/matrix-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, AlertCircle, Clock, FileText, X, ArrowRight, Phone, CheckCircle, XCircle } from "lucide-react";
import { useSearch, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";

interface Job {
  id: string;
  jobNumber: string;
  linkedProductionRunId: string | null;
}

interface ProductionRun {
  id: string;
  importBatchId: string;
  clientId: string;
  approvalStatus: string;
  exceptionReason: string | null;
}

interface Client {
  id: string;
  name: string;
  code: string;
}

interface ServiceItem {
  id: string;
  type: 'Approval' | 'Exception' | 'Ticket' | 'Hold' | 'QA Proof' | 'Message Approval';
  clientId: string;
  linkedRunId: string | null;
  linkedJobId: string | null;
  status: string;
  owner: string | null;
  summary: string;
  details: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export default function ClientServices() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  
  const filterRunId = urlParams.get('runId');
  const filterJobId = urlParams.get('jobId');
  const filterClientId = urlParams.get('clientId');
  const hasFilters = Boolean(filterRunId || filterJobId || filterClientId);
  
  const [activeTab, setActiveTab] = useState(hasFilters ? 'approvals' : 'tickets');

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    },
  });

  const { data: productionRuns = [] } = useQuery<ProductionRun[]>({
    queryKey: ['production-runs'],
    queryFn: async () => {
      const res = await fetch('/api/production-runs');
      if (!res.ok) throw new Error('Failed to fetch runs');
      return res.json();
    },
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Failed to fetch clients');
      return res.json();
    },
  });

  const linkedJob = jobs.find(j => j.id === filterJobId);
  const linkedRun = productionRuns.find(r => r.id === filterRunId);
  const linkedClient = clients.find(c => c.id === filterClientId);

  const clearFilters = () => {
    navigate('/client-services');
  };

  // Generate service items from production runs
  const serviceItems = useMemo((): ServiceItem[] => {
    const items: ServiceItem[] = [];
    
    productionRuns.forEach((run, idx) => {
      const client = clients.find(c => c.id === run.clientId);
      const job = jobs.find(j => j.linkedProductionRunId === run.id);
      
      // Create approval items for pending runs
      if (run.approvalStatus === 'Pending') {
        items.push({
          id: `approval-${run.id}`,
          type: 'Approval',
          clientId: run.clientId,
          linkedRunId: run.id,
          linkedJobId: job?.id || null,
          status: 'Pending',
          owner: 'Client Services Team',
          summary: `QA Proof Review - Batch ${run.importBatchId}`,
          details: `${client?.name || 'Unknown Client'} - Awaiting QA proof approval before mail`,
          createdAt: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
          resolvedAt: null,
        });
      }
      
      // Create exception items for late runs
      if (run.exceptionReason) {
        items.push({
          id: `exception-${run.id}`,
          type: 'Exception',
          clientId: run.clientId,
          linkedRunId: run.id,
          linkedJobId: job?.id || null,
          status: run.approvalStatus === 'Approved' ? 'Resolved' : 'Open',
          owner: 'Operations Team',
          summary: `SLA Exception - ${run.exceptionReason}`,
          details: `Batch ${run.importBatchId} - ${client?.name || 'Unknown'}: ${run.exceptionReason}`,
          createdAt: new Date(Date.now() - Math.random() * 86400000 * 5).toISOString(),
          resolvedAt: run.approvalStatus === 'Approved' ? new Date().toISOString() : null,
        });
      }
    });

    // Add some ticket items
    for (let i = 0; i < 5; i++) {
      const run = productionRuns[i % productionRuns.length];
      const client = clients.find(c => c.id === run?.clientId);
      const job = jobs.find(j => j.linkedProductionRunId === run?.id);
      
      items.push({
        id: `ticket-${i + 1}`,
        type: 'Ticket',
        clientId: run?.clientId || clients[0]?.id || '',
        linkedRunId: run?.id || null,
        linkedJobId: job?.id || null,
        status: i < 2 ? 'Open' : 'Resolved',
        owner: ['Sarah Chen', 'Mike Johnson', 'Lisa Park'][i % 3],
        summary: ['Data format clarification needed', 'Address hygiene question', 'Insert specification update', 'Postage account inquiry', 'Bill message approval'][i],
        details: `Service ticket for ${client?.name || 'Unknown Client'}`,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        resolvedAt: i >= 2 ? new Date().toISOString() : null,
      });
    }
    
    return items;
  }, [productionRuns, clients, jobs]);

  // Filter items by context
  const filteredItems = useMemo(() => {
    if (!hasFilters) return serviceItems;
    return serviceItems.filter(item => {
      if (filterRunId && item.linkedRunId !== filterRunId) return false;
      if (filterClientId && item.clientId !== filterClientId) return false;
      if (filterJobId && item.linkedJobId !== filterJobId) return false;
      return true;
    });
  }, [serviceItems, filterRunId, filterClientId, filterJobId, hasFilters]);

  const approvals = filteredItems.filter(i => i.type === 'Approval' || i.type === 'QA Proof' || i.type === 'Message Approval');
  const exceptions = filteredItems.filter(i => i.type === 'Exception' || i.type === 'Hold');
  const tickets = filteredItems.filter(i => i.type === 'Ticket');
  const pendingApprovals = approvals.filter(a => a.status === 'Pending');
  const openExceptions = exceptions.filter(e => e.status === 'Open');

  const getStatusIcon = (status: string) => {
    if (status === 'Resolved' || status === 'Approved') return <CheckCircle className="h-4 w-4 text-brand-green" />;
    if (status === 'Open' || status === 'Pending') return <Clock className="h-4 w-4 text-amber-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <MatrixLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">Client Services</h1>
            <p className="text-sm text-gray-600">Service tickets, approvals, and client exceptions</p>
          </div>
          <Button className="bg-[#1e3a5f] hover:bg-[#2c5282]" data-testid="button-new-ticket">
            <Plus className="h-4 w-4 mr-2" />
            New Service Ticket
          </Button>
        </div>

        {/* Filter Banner */}
        {hasFilters && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-semibold text-purple-900">Filtered View - Context from Production Run</div>
                  <div className="text-sm text-purple-700 flex items-center gap-2">
                    {linkedRun && (
                      <Badge className="bg-purple-100 text-purple-800">Batch: {linkedRun.importBatchId}</Badge>
                    )}
                    {linkedJob && (
                      <Badge className="bg-blue-100 text-blue-800">Job: {linkedJob.jobNumber}</Badge>
                    )}
                    {linkedClient && (
                      <Badge className="bg-green-100 text-green-800">Client: {linkedClient.name}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {filterRunId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/runs/${filterRunId}`)}
                    data-testid="button-back-to-run"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Back to Production Run
                  </Button>
                )}
                {filterJobId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/jobtax?jobId=${filterJobId}`)}
                    data-testid="button-back-to-job"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Back to JobTrax
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/call-center?runId=${filterRunId}&clientId=${filterClientId}${filterJobId ? `&jobId=${filterJobId}` : ''}`)}
                  data-testid="button-to-call-center"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  View Calls
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearFilters}
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100">
            <TabsTrigger value="tickets" data-testid="tab-tickets">Service Tickets</TabsTrigger>
            <TabsTrigger value="approvals" data-testid="tab-approvals">
              Approvals
              {pendingApprovals.length > 0 && (
                <Badge className="ml-2 bg-amber-600 text-white">{pendingApprovals.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="exceptions" data-testid="tab-exceptions">
              Exceptions
              {openExceptions.length > 0 && (
                <Badge className="ml-2 bg-red-600 text-white">{openExceptions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages">Client Messages</TabsTrigger>
            <TabsTrigger value="sla-watch" data-testid="tab-sla-watch">SLA Watch</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            <Card>
              <CardHeader className="pb-2 border-b border-gray-200 bg-gray-50">
                <CardTitle className="text-lg">Open Service Tickets</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {tickets.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No tickets found</div>
                  ) : (
                    tickets.map(item => (
                      <div key={item.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(item.status)}
                              <span className="font-semibold text-gray-900">{item.id.toUpperCase()}</span>
                              <Badge variant={item.status === 'Open' ? 'default' : 'secondary'}>{item.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-700">{item.summary}</p>
                            <p className="text-xs text-gray-500">
                              Client: {clients.find(c => c.id === item.clientId)?.name || 'Unknown'} • 
                              Owner: {item.owner}
                              {item.createdAt && ` • Created: ${format(parseISO(item.createdAt), 'MMM d, yyyy')}`}
                            </p>
                            {item.linkedRunId && (
                              <Button
                                size="sm"
                                variant="link"
                                className="h-auto p-0 text-xs text-blue-600"
                                onClick={() => navigate(`/runs/${item.linkedRunId}`)}
                              >
                                View Production Run →
                              </Button>
                            )}
                          </div>
                          <Button size="sm" variant="outline" data-testid={`button-view-${item.id}`}>View</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approvals" className="space-y-4">
            <Card>
              <CardHeader className="pb-2 border-b border-amber-200 bg-amber-50">
                <CardTitle className="text-lg text-amber-900">Pending Approvals</CardTitle>
                <p className="text-sm text-amber-700">{pendingApprovals.length} items awaiting client services approval</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {approvals.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      {hasFilters ? 'No approvals found for this context' : 'No pending approvals'}
                    </div>
                  ) : (
                    approvals.map(item => (
                      <div key={item.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                              <p className="font-semibold text-gray-900">{item.summary}</p>
                              <p className="text-sm text-gray-700">{item.details}</p>
                              <p className="text-xs text-gray-500">
                                {item.createdAt && `Submitted ${format(parseISO(item.createdAt), 'MMM d, h:mm a')}`}
                              </p>
                              {item.linkedRunId && (
                                <Button
                                  size="sm"
                                  variant="link"
                                  className="h-auto p-0 text-xs text-blue-600"
                                  onClick={() => navigate(`/runs/${item.linkedRunId}`)}
                                >
                                  View Production Run →
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-brand-green hover:bg-brand-green/90" data-testid={`button-approve-${item.id}`}>Approve</Button>
                            <Button size="sm" variant="destructive" data-testid={`button-reject-${item.id}`}>Reject</Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exceptions" className="space-y-4">
            <Card>
              <CardHeader className="pb-2 border-b border-red-200 bg-red-50">
                <CardTitle className="text-lg text-red-900">Active Exceptions</CardTitle>
                <p className="text-sm text-red-700">{openExceptions.length} exceptions requiring attention</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {exceptions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      {hasFilters ? 'No exceptions found for this context' : 'No active exceptions'}
                    </div>
                  ) : (
                    exceptions.map(item => (
                      <div key={item.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <AlertCircle className={`h-5 w-5 mt-0.5 ${item.status === 'Open' ? 'text-red-600' : 'text-gray-400'}`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">{item.summary}</p>
                                <Badge variant={item.status === 'Open' ? 'destructive' : 'secondary'}>{item.status}</Badge>
                              </div>
                              <p className="text-sm text-gray-700">{item.details}</p>
                              <p className="text-xs text-gray-500">
                                Owner: {item.owner}
                                {item.createdAt && ` • Reported ${format(parseISO(item.createdAt), 'MMM d')}`}
                              </p>
                              {item.linkedRunId && (
                                <Button
                                  size="sm"
                                  variant="link"
                                  className="h-auto p-0 text-xs text-blue-600"
                                  onClick={() => navigate(`/runs/${item.linkedRunId}`)}
                                >
                                  View Production Run →
                                </Button>
                              )}
                            </div>
                          </div>
                          {item.status === 'Open' && (
                            <Button size="sm" variant="outline" data-testid={`button-resolve-${item.id}`}>Mark Resolved</Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader className="pb-2 border-b border-gray-200 bg-gray-50">
                <CardTitle className="text-lg">Client Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Client messages will appear here when available
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sla-watch" className="space-y-4">
            <Card>
              <CardHeader className="pb-2 border-b border-gray-200 bg-gray-50">
                <CardTitle className="text-lg">SLA Watch</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  SLA monitoring dashboard will appear here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MatrixLayout>
  );
}
