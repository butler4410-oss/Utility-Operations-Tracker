import { MatrixLayout } from "@/components/matrix/matrix-layout";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Phone, UserCog, FileText, Calendar, Clock, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { format, parseISO, differenceInBusinessDays } from "date-fns";
import { formatNumber } from "@/lib/utils";

interface ProductionRun {
  id: string;
  clientId: string;
  importBatchId: string;
  importDateTime: string;
  targetMailDate: string;
  actualMailDate: string | null;
  approvalStatus: string;
  approvedBy: string | null;
  approvedAt: string | null;
  isOnTime: number | null;
  exceptionReason: string | null;
  notes: string | null;
}

interface Job {
  id: string;
  jobNumber: string;
  linkedProductionRunId: string | null;
}

interface Client {
  id: string;
  name: string;
  code: string;
}

export default function RunDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const runId = params.id;

  const { data: run, isLoading: runLoading } = useQuery<ProductionRun>({
    queryKey: ['production-run', runId],
    queryFn: async () => {
      const res = await fetch(`/api/production-runs/${runId}`);
      if (!res.ok) throw new Error('Failed to fetch run');
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

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    },
  });

  const client = clients.find(c => c.id === run?.clientId);
  const linkedJob = jobs.find(j => j.linkedProductionRunId === runId);

  const calculateSLA = () => {
    if (!run) return null;
    const importDate = parseISO(run.importDateTime);
    const mailDate = run.actualMailDate ? parseISO(run.actualMailDate) : null;
    const targetDate = parseISO(run.targetMailDate);
    
    const businessDaysToTarget = differenceInBusinessDays(targetDate, importDate);
    const actualBusinessDays = mailDate ? differenceInBusinessDays(mailDate, importDate) : null;
    
    return {
      targetDays: businessDaysToTarget,
      actualDays: actualBusinessDays,
      variance: actualBusinessDays !== null ? actualBusinessDays - businessDaysToTarget : null,
    };
  };

  const sla = calculateSLA();

  if (runLoading) {
    return (
      <MatrixLayout>
        <div className="p-6">
          <div className="text-center py-8 text-gray-600">Loading run details...</div>
        </div>
      </MatrixLayout>
    );
  }

  if (!run) {
    return (
      <MatrixLayout>
        <div className="p-6">
          <div className="text-center py-8 text-red-600">Production run not found</div>
        </div>
      </MatrixLayout>
    );
  }

  return (
    <MatrixLayout>
      <div className="p-6 space-y-4">
        {/* Header with Navigation */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/data-file-status')}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Data File Status
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">Production Run Detail</h1>
            <p className="text-sm text-gray-600">
              Batch ID: <span className="font-mono font-semibold">{run.importBatchId}</span>
              {client && <span className="ml-2">• {client.name}</span>}
            </p>
          </div>
          
          {/* Primary Navigation Buttons */}
          <div className="flex gap-2">
            <Button
              className="bg-[#1e3a5f] hover:bg-[#2c5282]"
              onClick={() => navigate(`/call-center?runId=${run.id}&clientId=${run.clientId}${linkedJob ? `&jobId=${linkedJob.id}` : ''}`)}
              data-testid="button-view-related-calls"
            >
              <Phone className="h-4 w-4 mr-2" />
              View Related Calls
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/client-services?runId=${run.id}&clientId=${run.clientId}${linkedJob ? `&jobId=${linkedJob.id}` : ''}`)}
              data-testid="button-view-client-services"
            >
              <UserCog className="h-4 w-4 mr-2" />
              View Client Services Context
            </Button>
            {linkedJob && (
              <Button
                variant="outline"
                onClick={() => navigate(`/jobtax?jobId=${linkedJob.id}`)}
                data-testid="button-back-to-jobtax"
              >
                <FileText className="h-4 w-4 mr-2" />
                Back to JobTrax Job
              </Button>
            )}
          </div>
        </div>

        {/* SLA Overview - Always Visible */}
        <Card className="border-2 border-[#1e3a5f]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Import → Mail SLA Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500 uppercase">Import Date/Time</div>
                <div className="text-lg font-bold text-gray-900">
                  {format(parseISO(run.importDateTime), 'MM/dd/yyyy')}
                </div>
                <div className="text-xs text-gray-600">
                  {format(parseISO(run.importDateTime), 'HH:mm')}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500 uppercase">Target Mail Date</div>
                <div className="text-lg font-bold text-gray-900">
                  {format(parseISO(run.targetMailDate), 'MM/dd/yyyy')}
                </div>
                <div className="text-xs text-gray-600">
                  {sla?.targetDays} business days
                </div>
              </div>
              
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500 uppercase">Actual Mail Date</div>
                <div className="text-lg font-bold text-gray-900">
                  {run.actualMailDate ? format(parseISO(run.actualMailDate), 'MM/dd/yyyy') : 'Pending'}
                </div>
                {sla?.actualDays !== null && (
                  <div className="text-xs text-gray-600">
                    {sla.actualDays} business days
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500 uppercase">SLA Status</div>
                <div className="flex items-center gap-2 mt-1">
                  {run.isOnTime === 1 ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-brand-green" />
                      <span className="text-lg font-bold text-brand-green">On-Time</span>
                    </>
                  ) : run.isOnTime === 0 ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="text-lg font-bold text-red-600">Late</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5 text-amber-600" />
                      <span className="text-lg font-bold text-amber-600">In Progress</span>
                    </>
                  )}
                </div>
                {sla?.variance !== null && sla.variance > 0 && (
                  <div className="text-xs text-red-600">
                    +{sla.variance} days over SLA
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500 uppercase">Approval Status</div>
                <Badge className={
                  run.approvalStatus === 'Approved' ? 'bg-brand-green/20 text-brand-green' :
                  run.approvalStatus === 'Pending' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {run.approvalStatus}
                </Badge>
                {run.approvedAt && (
                  <div className="text-xs text-gray-600 mt-1">
                    {format(parseISO(run.approvedAt), 'MM/dd HH:mm')}
                  </div>
                )}
              </div>
            </div>

            {run.exceptionReason && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                <div className="text-xs text-red-600 uppercase font-semibold">Exception Reason</div>
                <div className="text-sm text-red-800">{run.exceptionReason}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Linked Job Section */}
        {linkedJob && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Linked JobTrax Job</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-[#1e3a5f]">{linkedJob.jobNumber}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/jobtax?jobId=${linkedJob.id}`)}
                >
                  View Job Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={() => navigate(`/call-center?runId=${run.id}&clientId=${run.clientId}${linkedJob ? `&jobId=${linkedJob.id}` : ''}`)}
              >
                <Phone className="h-4 w-4 mr-2" />
                View Related Calls
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/client-services?runId=${run.id}&clientId=${run.clientId}${linkedJob ? `&jobId=${linkedJob.id}` : ''}`)}
              >
                <UserCog className="h-4 w-4 mr-2" />
                Client Services Context
              </Button>
              {linkedJob && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/jobtax?jobId=${linkedJob.id}`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Back to JobTrax
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {run.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">{run.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MatrixLayout>
  );
}
