import { MatrixLayout } from "@/components/matrix/matrix-layout";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, Download, Eye, ExternalLink, FileText, ArrowRight, X } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { format } from "date-fns";

interface Job {
  id: string;
  jobNumber: string;
  clientId: string;
  description: string;
  mailPieces: number;
  startedAt: string;
  completedAt: string | null;
  progressPercent: number;
  targetMailDate: string | null;
  actualMailDate: string | null;
  status: string;
  linkedProductionRunId: string | null;
  artifacts: string | string[];
  notes: string | null;
}

export default function JobTrax() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const initialJobId = urlParams.get('jobId');
  
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set(initialJobId ? [initialJobId] : []));
  const [searchTerm, setSearchTerm] = useState("");
  const [reportViewerOpen, setReportViewerOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<{name: string; jobId: string; jobNumber: string; linkedRunId: string | null} | null>(null);
  const [showGoldenOnly, setShowGoldenOnly] = useState(false);

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    },
  });

  // Auto-expand job from URL param
  useEffect(() => {
    if (initialJobId && jobs.length > 0) {
      setExpandedJobs(new Set([initialJobId]));
    }
  }, [initialJobId, jobs]);

  const toggleExpand = (jobId: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const getArtifacts = (job: Job): string[] => {
    if (typeof job.artifacts === 'string') {
      try {
        return JSON.parse(job.artifacts);
      } catch {
        return [];
      }
    }
    return job.artifacts || [];
  };

  const openReportViewer = (reportName: string, job: Job) => {
    setSelectedReport({
      name: reportName,
      jobId: job.id,
      jobNumber: job.jobNumber,
      linkedRunId: job.linkedProductionRunId,
    });
    setReportViewerOpen(true);
  };

  const filteredJobs = jobs
    .filter(job => {
      if (showGoldenOnly && !job.linkedProductionRunId) return false;
      return job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      // Golden path jobs first
      if (a.linkedProductionRunId && !b.linkedProductionRunId) return -1;
      if (!a.linkedProductionRunId && b.linkedProductionRunId) return 1;
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-brand-green';
      case 'Mailstream': return 'text-blue-600';
      case 'Inserting': return 'text-amber-600';
      case 'Imaging': return 'text-purple-600';
      case 'Queued': return 'text-gray-500';
      case 'Exception': return 'text-red-600';
      default: return 'text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <MatrixLayout>
        <div className="p-6">
          <div className="text-center py-8 text-gray-600">Loading jobs...</div>
        </div>
      </MatrixLayout>
    );
  }

  return (
    <MatrixLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">JobTrax</h1>
            <p className="text-sm text-gray-600">Production job tracking and monitoring</p>
          </div>
          <Button className="bg-[#1e3a5f] hover:bg-[#2c5282]" data-testid="button-new-job">
            <ExternalLink className="h-4 w-4 mr-2" />
            New Job
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex gap-4 items-center flex-wrap">
            <Input
              placeholder="Search by job number or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
              data-testid="input-search-jobs"
            />
            <Button
              variant={showGoldenOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGoldenOnly(!showGoldenOnly)}
              className={showGoldenOnly ? "bg-amber-600 hover:bg-amber-700" : ""}
              data-testid="filter-golden-jobs"
            >
              ★ Demo Jobs Only
            </Button>
            <div className="text-sm text-gray-600">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
              {showGoldenOnly && ' (with linked runs)'}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-700 w-12"></th>
                <th className="text-left p-3 font-semibold text-gray-700">Job Number</th>
                <th className="text-left p-3 font-semibold text-gray-700">Description</th>
                <th className="text-left p-3 font-semibold text-gray-700">Mail Pieces</th>
                <th className="text-left p-3 font-semibold text-gray-700">Started</th>
                <th className="text-left p-3 font-semibold text-gray-700">Progress</th>
                <th className="text-left p-3 font-semibold text-gray-700">Mail Date</th>
                <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                <th className="text-left p-3 font-semibold text-gray-700">Linked Run</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job, idx) => (
                <>
                  <tr
                    key={job.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${job.linkedProductionRunId ? 'border-l-4 border-l-amber-400' : ''}`}
                    onClick={() => toggleExpand(job.id)}
                    data-testid={`row-job-${job.id}`}
                  >
                    <td className="p-3">
                      {expandedJobs.has(job.id) ? (
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-[#1e3a5f] font-mono font-semibold" data-testid={`text-job-${job.id}`}>
                        {job.jobNumber}
                      </span>
                      {job.linkedProductionRunId && (
                        <Badge className="ml-2 bg-amber-100 text-amber-800 text-[10px]">★ DEMO</Badge>
                      )}
                    </td>
                    <td className="p-3 text-gray-700">{job.description}</td>
                    <td className="p-3 text-gray-700">{formatNumber(job.mailPieces)}</td>
                    <td className="p-3 text-gray-600 text-xs">{format(new Date(job.startedAt), 'MM/dd/yyyy HH:mm')}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-brand-green h-2 rounded-full"
                            style={{ width: `${job.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-10">{job.progressPercent}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-700 text-xs">
                      {job.actualMailDate || job.targetMailDate || 'TBD'}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-semibold ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {job.linkedProductionRunId && (
                        <Link href={`/runs/${job.linkedProductionRunId}`}>
                          <a 
                            className="text-xs text-[#1e3a5f] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`link-run-${job.linkedProductionRunId}`}
                          >
                            {job.linkedProductionRunId.slice(0, 8)}...
                          </a>
                        </Link>
                      )}
                    </td>
                  </tr>

                  {expandedJobs.has(job.id) && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={9} className="p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Mailing Groups */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-700 uppercase">Detailed Status by Mailing Group</h4>
                            <div className="space-y-1">
                              {['1A', '1B', '1C'].map(group => {
                                const pieces = Math.floor(job.mailPieces / 3);
                                const imagingProgress = job.progressPercent >= 30 ? 100 : (job.progressPercent / 30) * 100;
                                const insertingProgress = job.progressPercent >= 60 ? 100 : Math.max(0, (job.progressPercent - 30) / 30 * 100);
                                const mailstreamProgress = job.progressPercent >= 100 ? 100 : Math.max(0, (job.progressPercent - 60) / 40 * 100);

                                return (
                                  <div key={group} className="bg-white border border-gray-200 rounded p-2 text-xs">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="font-semibold text-gray-700">Group {group}</span>
                                      <span className="text-gray-600">{formatNumber(pieces)} pieces</span>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-600 w-20">Imaging:</span>
                                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                          <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${imagingProgress}%` }} />
                                        </div>
                                        <span className="text-gray-600 w-10">{Math.round(imagingProgress)}%</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-600 w-20">Inserting:</span>
                                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${insertingProgress}%` }} />
                                        </div>
                                        <span className="text-gray-600 w-10">{Math.round(insertingProgress)}%</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-600 w-20">Mailstream:</span>
                                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${mailstreamProgress}%` }} />
                                        </div>
                                        <span className="text-gray-600 w-10">{Math.round(mailstreamProgress)}%</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Reports & Inserts */}
                          <div className="space-y-2">
                            <div className="bg-white border border-gray-200 rounded p-3">
                              <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Reports</h4>
                              <div className="space-y-1">
                                {getArtifacts(job).map((report, rIdx) => (
                                  <div key={rIdx} className="flex items-center justify-between text-xs hover:bg-gray-50 p-1 rounded">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-3 w-3 text-gray-500" />
                                      <span className="font-mono text-gray-700">{report}</span>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 px-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openReportViewer(report, job);
                                        }}
                                        data-testid={`button-view-report-${rIdx}`}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-6 px-2" data-testid={`button-download-${rIdx}`}>
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                                {getArtifacts(job).length === 0 && (
                                  <p className="text-gray-500 text-xs">No reports available</p>
                                )}
                              </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded p-3">
                              <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Inserts</h4>
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center justify-between hover:bg-gray-50 p-1 rounded">
                                  <span className="text-gray-700">BRE (Business Reply Envelope)</span>
                                  <span className="text-brand-green text-[10px] font-semibold">✓ Included</span>
                                </div>
                                <div className="flex items-center justify-between hover:bg-gray-50 p-1 rounded">
                                  <span className="text-gray-700">Convenience Guide</span>
                                  <span className="text-brand-green text-[10px] font-semibold">✓ Included</span>
                                </div>
                              </div>
                            </div>

                            {job.linkedProductionRunId && (
                              <Button
                                className="w-full bg-[#1e3a5f] hover:bg-[#2c5282]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/runs/${job.linkedProductionRunId}`);
                                }}
                                data-testid="button-view-linked-run"
                              >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                View Linked Production Run
                              </Button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {filteredJobs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No jobs found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Report Viewer Modal */}
      <Dialog open={reportViewerOpen} onOpenChange={setReportViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedReport?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-100 border border-gray-300 rounded p-4 font-mono text-xs whitespace-pre overflow-auto max-h-[400px]">
{`================================================================================
                     PROCESSING DESCRIPTION REPORT (DPSYS)
================================================================================
Job Number: ${selectedReport?.jobNumber}
Report: ${selectedReport?.name}
Generated: ${format(new Date(), 'MM/dd/yyyy HH:mm:ss')}
--------------------------------------------------------------------------------

MAILING GROUP SUMMARY
---------------------
Group 1A: 4,521 pieces    Presort: MACHINABLE AUTO    Postage: $1,582.35
Group 1B: 3,892 pieces    Presort: MACHINABLE AUTO    Postage: $1,362.20
Group 1C: 2,156 pieces    Presort: NON-AUTO 5-DIGIT   Postage: $  862.40
                                                       ----------------
                                            TOTAL:     $3,806.95

INSERTS INCLUDED
----------------
[X] BRE - Business Reply Envelope (Standard #9)
[X] Convenience Guide - 4-page fold
[ ] Water Conservation Flyer - N/A this run

POSTAGE BREAKDOWN
-----------------
First-Class Presort Letters ........ 10,569 pcs @ $0.36 avg = $3,804.84
Certified Mail ..................... 0 pcs                  = $    0.00
IMB Discount Applied ...............                        = ($  12.89)
                                                             ----------
NET POSTAGE: $3,806.95

WARNINGS/NOTES
--------------
* No address hygiene issues detected
* All barcodes validated successfully
* Postal documentation complete

================================================================================
                              END OF REPORT
================================================================================`}
            </div>

            <div className="flex gap-3 justify-between items-center">
              <Button variant="outline" onClick={() => setReportViewerOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" data-testid="button-download-report">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                
                {selectedReport?.linkedRunId && (
                  <Button
                    className="bg-[#1e3a5f] hover:bg-[#2c5282]"
                    onClick={() => {
                      setReportViewerOpen(false);
                      navigate(`/runs/${selectedReport.linkedRunId}`);
                    }}
                    data-testid="button-view-linked-run-from-report"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    View Linked Production Run
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MatrixLayout>
  );
}
