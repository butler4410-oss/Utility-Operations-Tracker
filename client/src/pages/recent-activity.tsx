import { MatrixLayout } from "@/components/matrix/matrix-layout";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "wouter";
import { Activity, AlertCircle, CheckCircle, Clock, Upload, FileText, Mail } from "lucide-react";

interface RecentActivityEvent {
  id: string;
  timestamp: string;
  eventType: string;
  description: string;
  userId: string | null;
  clientId: string | null;
  productionRunId: string | null;
  jobId: string | null;
  metadata: Record<string, any>;
}

export default function RecentActivity() {
  const { data: events = [], isLoading } = useQuery<RecentActivityEvent[]>({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const res = await fetch('/api/recent-activity?limit=200');
      if (!res.ok) throw new Error('Failed to fetch events');
      return res.json();
    },
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'import': return <Upload className="h-4 w-4 text-blue-600" />;
      case 'approval': return <CheckCircle className="h-4 w-4 text-brand-green" />;
      case 'exception': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'mail': return <Mail className="h-4 w-4 text-purple-600" />;
      case 'print': return <FileText className="h-4 w-4 text-amber-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <MatrixLayout>
        <div className="p-6">
          <div className="text-center py-8 text-gray-600">Loading activity...</div>
        </div>
      </MatrixLayout>
    );
  }

  return (
    <MatrixLayout>
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Recent Activity</h1>
          <p className="text-sm text-gray-600">System-wide event log and audit trail</p>
        </div>

        <div className="bg-white border border-gray-200 rounded divide-y divide-gray-200">
          {events.map(event => (
            <div
              key={event.id}
              className="p-4 hover:bg-gray-50 flex gap-3 items-start"
              data-testid={`event-${event.id}`}
            >
              <div className="mt-1">{getEventIcon(event.eventType)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-700">{event.description}</p>
                  <time className="text-xs text-gray-500 whitespace-nowrap">
                    {format(new Date(event.timestamp), 'MM/dd/yy HH:mm')}
                  </time>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                  {event.productionRunId && (
                    <Link href={`/production-runs/${event.productionRunId}`}>
                      <a className="text-[#1e3a5f] hover:underline" data-testid={`link-run-${event.productionRunId}`}>
                        View Run →
                      </a>
                    </Link>
                  )}
                  {event.jobId && (
                    <Link href={`/jobs/${event.jobId}`}>
                      <a className="text-[#1e3a5f] hover:underline" data-testid={`link-job-${event.jobId}`}>
                        View Job →
                      </a>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No recent activity to display</p>
            </div>
          )}
        </div>
      </div>
    </MatrixLayout>
  );
}
