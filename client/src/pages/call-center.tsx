import { useState, useEffect, useMemo } from 'react';
import { MatrixLayout } from '@/components/matrix/matrix-layout';
import { useCallRecords, useCreateCallRecord, useUpdateCallRecord, useClients, useUsers } from '@/lib/queries';
import { CallRecord } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MessageSquare, Plus, Clock, AlertCircle, CheckCircle2, PhoneForwarded, X, ArrowRight, FileText, UserCog } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useSearch, useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface Job {
  id: string;
  jobNumber: string;
  linkedProductionRunId: string | null;
}

interface ProductionRun {
  id: string;
  importBatchId: string;
  clientId: string;
}

export default function CallCenter() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  
  // Get filter params from URL
  const filterRunId = urlParams.get('runId');
  const filterJobId = urlParams.get('jobId');
  const filterClientId = urlParams.get('clientId');
  const hasFilters = Boolean(filterRunId || filterJobId || filterClientId);
  
  const [activeTab, setActiveTab] = useState(hasFilters ? 'filtered' : 'my-queue');
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  
  const { data: allRecords = [] } = useCallRecords();
  const { data: clients = [] } = useClients();
  const { data: users = [] } = useUsers();
  const createRecord = useCreateCallRecord();
  const updateRecord = useUpdateCallRecord();

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

  // Get linked job info for display
  const linkedJob = jobs.find(j => j.id === filterJobId);
  const linkedRun = productionRuns.find(r => r.id === filterRunId);
  const linkedClient = clients.find(c => c.id === filterClientId);

  // Apply filters when coming from Production Run Detail
  const filteredByContext = useMemo(() => {
    if (!hasFilters) return [];
    return allRecords.filter(r => {
      if (filterRunId && (r as any).linkedProductionRunId !== filterRunId) return false;
      if (filterClientId && r.clientId !== filterClientId) return false;
      return true;
    });
  }, [allRecords, filterRunId, filterClientId, hasFilters]);

  const clearFilters = () => {
    navigate('/call-center');
    setActiveTab('my-queue');
  };

  // Switch to filtered tab when filters are present
  useEffect(() => {
    if (hasFilters) {
      setActiveTab('filtered');
    }
  }, [hasFilters]);

  const myQueue = allRecords.filter(r => r.assignedTo === user?.id && r.status !== 'Resolved');
  const unassigned = allRecords.filter(r => !r.assignedTo && r.status === 'Open');
  const callbacks = allRecords.filter(r => r.callbackDate && r.status === 'Callback Scheduled');
  const escalations = allRecords.filter(r => r.escalatedTo && r.status === 'Escalated');
  const recentlyResolved = allRecords.filter(r => r.status === 'Resolved').slice(0, 20);

  const getRecordsForTab = (tab: string) => {
    switch (tab) {
      case 'my-queue': return myQueue;
      case 'all': return allRecords;
      case 'unassigned': return unassigned;
      case 'callbacks': return callbacks;
      case 'escalations': return escalations;
      case 'resolved': return recentlyResolved;
      case 'filtered': return filteredByContext;
      default: return [];
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      default: return <Phone className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Open': 'default',
      'In Progress': 'secondary',
      'Callback Scheduled': 'outline',
      'Escalated': 'destructive',
      'Resolved': 'secondary'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      'Urgent': 'bg-red-100 text-red-800 border-red-200',
      'High': 'bg-orange-100 text-orange-800 border-orange-200',
      'Medium': 'bg-blue-100 text-blue-800 border-blue-200',
      'Low': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return <Badge variant="outline" className={colors[priority]}>{priority}</Badge>;
  };

  const handleQuickEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createRecord.mutate({
      clientId: formData.get('clientId') as string,
      contactChannel: formData.get('contactChannel') as any,
      callerName: formData.get('callerName') as string,
      callerPhone: (formData.get('callerPhone') as string) || undefined,
      callerEmail: (formData.get('callerEmail') as string) || undefined,
      callReason: formData.get('callReason') as any,
      priority: formData.get('priority') as any,
      status: 'Open',
      assignedTo: user?.id || undefined,
      summary: formData.get('summary') as string,
      detailedNotes: (formData.get('description') as string) || undefined,
      startTime: new Date(),
      firstContactResolution: 0,
    }, {
      onSuccess: () => {
        setIsEntryDialogOpen(false);
        e.currentTarget.reset();
      }
    });
  };

  const handleAssignToMe = (recordId: string) => {
    updateRecord.mutate({ 
      id: recordId, 
      data: { assignedTo: user?.id, status: 'In Progress' } 
    });
  };

  const handleResolve = (recordId: string) => {
    updateRecord.mutate({ 
      id: recordId, 
      data: { status: 'Resolved', endTime: new Date() } 
    });
  };

  return (
    <MatrixLayout>
      <div className="p-6 space-y-6">
        {/* Filter Banner */}
        {hasFilters && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-blue-900">Filtered View</div>
                  <div className="text-sm text-blue-700 flex items-center gap-2">
                    {linkedRun && (
                      <Badge className="bg-blue-100 text-blue-800">Batch: {linkedRun.importBatchId}</Badge>
                    )}
                    {linkedJob && (
                      <Badge className="bg-purple-100 text-purple-800">Job: {linkedJob.jobNumber}</Badge>
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
                  onClick={() => navigate(`/client-services?runId=${filterRunId}&clientId=${filterClientId}${filterJobId ? `&jobId=${filterJobId}` : ''}`)}
                  data-testid="button-to-client-services"
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Client Services
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

        <div className="flex justify-between items-center">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-brand-navy">{myQueue.length}</div>
              <div className="text-xs text-muted-foreground">My Queue</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">{unassigned.length}</div>
              <div className="text-xs text-muted-foreground">Unassigned</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">{callbacks.length}</div>
              <div className="text-xs text-muted-foreground">Callbacks</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-red-600">{escalations.length}</div>
              <div className="text-xs text-muted-foreground">Escalations</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">{recentlyResolved.length}</div>
              <div className="text-xs text-muted-foreground">Resolved (24h)</div>
            </Card>
          </div>
          
          <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-call" className="bg-brand-green hover:bg-brand-green/90">
                <Plus className="h-4 w-4 mr-2" />
                New Call/Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Quick Call/Ticket Entry</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleQuickEntry} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactChannel">Channel</Label>
                    <Select name="contactChannel" required>
                      <SelectTrigger data-testid="select-channel">
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="chat">Chat</SelectItem>
                        <SelectItem value="walk-in">Walk-in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="clientId">Client</Label>
                    <Select name="clientId" defaultValue={filterClientId || undefined} required>
                      <SelectTrigger data-testid="select-client">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="callerName">Caller Name</Label>
                    <Input data-testid="input-caller-name" name="callerName" required />
                  </div>
                  <div>
                    <Label htmlFor="callerPhone">Phone</Label>
                    <Input data-testid="input-caller-phone" name="callerPhone" type="tel" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="callerEmail">Email</Label>
                    <Input data-testid="input-caller-email" name="callerEmail" type="email" />
                  </div>
                  <div>
                    <Label htmlFor="callReason">Reason</Label>
                    <Select name="callReason" required>
                      <SelectTrigger data-testid="select-reason">
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Billing">Billing Question</SelectItem>
                        <SelectItem value="Technical">Technical Issue</SelectItem>
                        <SelectItem value="Payment">Payment</SelectItem>
                        <SelectItem value="General">General Inquiry</SelectItem>
                        <SelectItem value="Mail Delay">Mail Delay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue="Medium" required>
                      <SelectTrigger data-testid="select-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="summary">Summary</Label>
                    <Input data-testid="input-summary" name="summary" required />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea data-testid="textarea-description" name="description" rows={3} />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEntryDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button data-testid="button-submit-call" type="submit" className="bg-brand-navy hover:bg-brand-navy/90">
                    Create Record
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${hasFilters ? 'grid-cols-7' : 'grid-cols-6'}`}>
            {hasFilters && (
              <TabsTrigger value="filtered" data-testid="tab-filtered">
                Filtered
                <Badge className="ml-2 bg-blue-600 text-white">{filteredByContext.length}</Badge>
              </TabsTrigger>
            )}
            <TabsTrigger value="my-queue" data-testid="tab-my-queue">
              My Queue
              {myQueue.length > 0 && <Badge className="ml-2" variant="secondary">{myQueue.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
            <TabsTrigger value="unassigned" data-testid="tab-unassigned">
              Unassigned
              {unassigned.length > 0 && <Badge className="ml-2" variant="destructive">{unassigned.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="callbacks" data-testid="tab-callbacks">
              Callbacks
              {callbacks.length > 0 && <Badge className="ml-2" variant="outline">{callbacks.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="escalations" data-testid="tab-escalations">
              Escalations
              {escalations.length > 0 && <Badge className="ml-2" variant="destructive">{escalations.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="resolved" data-testid="tab-resolved">Recently Resolved</TabsTrigger>
          </TabsList>

          {['filtered', 'my-queue', 'all', 'unassigned', 'callbacks', 'escalations', 'resolved'].map(tab => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {tab === 'filtered' && `Calls Related to ${linkedRun?.importBatchId || 'Selected Run'}`}
                    {tab === 'my-queue' && 'My Active Queue'}
                    {tab === 'all' && 'All Call Records'}
                    {tab === 'unassigned' && 'Unassigned Calls'}
                    {tab === 'callbacks' && 'Scheduled Callbacks'}
                    {tab === 'escalations' && 'Escalated Issues'}
                    {tab === 'resolved' && 'Recently Resolved'}
                  </CardTitle>
                  <CardDescription>
                    {getRecordsForTab(tab).length} {getRecordsForTab(tab).length === 1 ? 'record' : 'records'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {getRecordsForTab(tab).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {tab === 'filtered' ? 'No calls found for this production run' : 'No records found'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getRecordsForTab(tab).map(record => (
                        <Card key={record.id} className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                {getChannelIcon(record.contactChannel)}
                                <span className="font-semibold" data-testid={`text-caller-${record.id}`}>{record.callerName}</span>
                                {getPriorityBadge(record.priority)}
                                {getStatusBadge(record.status)}
                                {record.firstContactResolution === 1 && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    FCR
                                  </Badge>
                                )}
                                {(record as any).linkedProductionRunId && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    Linked Run
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="text-sm font-medium" data-testid={`text-summary-${record.id}`}>
                                {record.summary}
                              </div>
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                <span data-testid={`text-reason-${record.id}`}>{record.callReason}</span>
                                <span>•</span>
                                <span>{clients.find(c => c.id === record.clientId)?.name || 'Unknown'}</span>
                                {record.assignedTo && (
                                  <>
                                    <span>•</span>
                                    <span>Assigned to: {users.find(u => u.id === record.assignedTo)?.fullName || 'Unknown'}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{format(parseISO(record.createdAt || new Date().toISOString()), 'MMM d, h:mm a')}</span>
                              </div>

                              {/* Deep links to related items */}
                              <div className="flex items-center gap-2 text-xs">
                                {(record as any).linkedProductionRunId && (
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="h-auto p-0 text-xs text-blue-600"
                                    onClick={() => navigate(`/runs/${(record as any).linkedProductionRunId}`)}
                                  >
                                    View Production Run →
                                  </Button>
                                )}
                              </div>

                              {record.callbackDate && (
                                <div className="flex items-center gap-2 text-xs text-blue-600">
                                  <Clock className="h-3 w-3" />
                                  Callback: {format(new Date(record.callbackDate), 'MMM d, h:mm a')}
                                </div>
                              )}

                              {record.escalatedTo && (
                                <div className="flex items-center gap-2 text-xs text-red-600">
                                  <PhoneForwarded className="h-3 w-3" />
                                  Escalated to: {record.escalatedTo}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              {!record.assignedTo && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  data-testid={`button-assign-${record.id}`}
                                  onClick={() => handleAssignToMe(record.id)}
                                >
                                  Assign to Me
                                </Button>
                              )}
                              {record.assignedTo === user?.id && record.status !== 'Resolved' && (
                                <Button 
                                  size="sm"
                                  data-testid={`button-resolve-${record.id}`}
                                  onClick={() => handleResolve(record.id)}
                                  className="bg-brand-green hover:bg-brand-green/90"
                                >
                                  Mark Resolved
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MatrixLayout>
  );
}
