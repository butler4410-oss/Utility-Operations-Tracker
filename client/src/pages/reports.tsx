import { Shell } from "@/components/layout/shell";
import { useActivities, useClients, usePrintJobs, useSurveys } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useDateRange } from "@/components/layout/header";
import { subDays, isAfter, parseISO } from "date-fns";
import { format } from "date-fns";

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const { data: activities = [] } = useActivities();
  const { data: clients = [] } = useClients();
  const { data: printJobs = [] } = usePrintJobs();
  const { data: surveys = [] } = useSurveys();
  const { range } = useDateRange();

  // Date Filtering Logic
  const days = range === 'custom' ? 90 : parseInt(range);
  const startDate = subDays(new Date(), days);

  const filterByDate = (dateStr: string) => isAfter(parseISO(dateStr), startDate);

  const reports = [
    { id: 'A', title: 'Client Activity Summary', desc: 'Detailed log of all activities by client and type.' },
    { id: 'B', title: 'Print Spend & Volume', desc: 'Monthly breakdown of print pieces, pages, and costs.' },
    { id: 'C', title: 'Collections Performance', desc: 'Recovery rates and escalation metrics (Simulated).' },
    { id: 'D', title: 'Call Center Metrics', desc: 'Inbound volume, handle times, and resolution rates (Simulated).' },
  ];

  const exportCSV = (data: any[], filename: string) => {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(',')).join('\n');
      const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Report Renderers
  const renderReport = () => {
     switch(selectedReport) {
        case 'A': {
           const data = activities.filter(a => filterByDate(a.date)).map(a => ({
              Date: a.date,
              Client: clients.find(c => c.id === a.clientId)?.name,
              Type: a.type,
              Owner: a.ownerId, // In real app, lookup name
              Status: a.status,
              Effort: a.effortHours
           }));
           
           const columns: ColumnDef<any>[] = [
              { accessorKey: "Date", header: "Date" },
              { accessorKey: "Client", header: "Client" },
              { accessorKey: "Type", header: "Type" },
              { accessorKey: "Status", header: "Status" },
              { accessorKey: "Effort", header: "Effort (Hrs)" },
           ];
           return { title: 'Client Activity Summary', data, columns };
        }
        case 'B': {
           const data = printJobs.filter(j => filterByDate(j.date)).map(j => ({
              Date: j.date,
              Client: clients.find(c => c.id === j.clientId)?.name,
              Provider: j.provider,
              Pieces: j.pieces,
              Cost: j.cost
           }));
           const columns: ColumnDef<any>[] = [
              { accessorKey: "Date", header: "Date" },
              { accessorKey: "Client", header: "Client" },
              { accessorKey: "Provider", header: "Provider" },
              { accessorKey: "Pieces", header: "Pieces" },
              { accessorKey: "Cost", header: "Cost ($)" },
           ];
           return { title: 'Print Spend & Volume', data, columns };
        }
        // ... C and D would be similar, skipping for brevity in prototype unless specifically requested deeper
        default: return null;
     }
  };

  const currentReport = renderReport();

  if (selectedReport && currentReport) {
     return (
        <Shell title={`Report: ${currentReport.title}`}>
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
        </Shell>
     );
  }

  return (
    <Shell title="Reports & Analytics">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card 
             key={report.id} 
             className="hover:border-brand-navy/50 transition-colors cursor-pointer group"
             onClick={() => setSelectedReport(report.id)}
          >
            <CardHeader>
               <CardTitle>{report.title}</CardTitle>
               <CardDescription>{report.desc}</CardDescription>
            </CardHeader>
            <CardContent>
               <Button variant="outline" className="w-full group-hover:bg-brand-navy group-hover:text-white transition-colors">
                  View Report
               </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
