import { Shell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityForm, PrintJobForm, SurveyForm } from "@/components/forms";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Activity, PrintJob, Survey, Client } from "@/lib/types";
import { useRoute, Link, useLocation } from "wouter";
import { useState } from "react";
import { useClient, useActivitiesByClient, usePrintJobsByClient, useSurveysByClient, useUsers, useDeleteActivity, useDeletePrintJob, useDeleteSurvey } from "@/lib/queries";
import { 
  ArrowLeft, 
  Plus, 
  MapPin, 
  Building2, 
  Calendar, 
  User, 
  Activity as ActivityIcon, 
  Printer, 
  MessageSquare,
  Edit
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ClientForm } from "@/components/forms";

export default function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const [, setLocation] = useLocation();
  const id = params?.id;

  const { data: client, isLoading: clientLoading } = useClient(id!);
  const { data: clientActivities = [] } = useActivitiesByClient(id!);
  const { data: clientPrintJobs = [] } = usePrintJobsByClient(id!);
  const { data: clientSurveys = [] } = useSurveysByClient(id!);
  const { data: users = [] } = useUsers();
  const manager = users.find(u => u.id === client?.assignedManager);

  // Modal States
  const [showClientForm, setShowClientForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showPrintJobForm, setShowPrintJobForm] = useState(false);
  const [showSurveyForm, setShowSurveyForm] = useState(false);

  // Edit States
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>(undefined);
  const [editingPrintJob, setEditingPrintJob] = useState<PrintJob | undefined>(undefined);
  const [editingSurvey, setEditingSurvey] = useState<Survey | undefined>(undefined);

  const deleteActivity = useDeleteActivity();
  const deletePrintJob = useDeletePrintJob();
  const deleteSurvey = useDeleteSurvey();

  if (clientLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold">Client Not Found</h1>
        <Link href="/clients"><Button>Back to Clients</Button></Link>
      </div>
    );
  }

  // --- Column Definitions ---
  const activityColumns: ColumnDef<Activity>[] = [
    {
       accessorKey: "date",
       header: "Date",
       cell: ({ row }) => <span className="font-mono text-xs">{row.original.date}</span>
    },
    {
       accessorKey: "type",
       header: "Type",
       cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>
    },
    {
       accessorKey: "status",
       header: "Status",
       cell: ({ row }) => (
          <Badge className={
             row.original.status === 'Done' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
             row.original.status === 'Blocked' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
             'bg-blue-100 text-blue-800 hover:bg-blue-200'
          }>{row.original.status}</Badge>
       )
    },
    {
       accessorKey: "notes",
       header: "Notes",
       cell: ({ row }) => <span className="truncate max-w-[300px] block" title={row.original.notes}>{row.original.notes}</span>
    },
    {
       id: "actions",
       cell: ({ row }) => (
          <Button variant="ghost" size="sm" onClick={() => { setEditingActivity(row.original); setShowActivityForm(true); }}>
             <Edit className="h-4 w-4" />
          </Button>
       )
    }
  ];

  const printColumns: ColumnDef<PrintJob>[] = [
     { accessorKey: "date", header: "Date" },
     { accessorKey: "provider", header: "Provider" },
     { accessorKey: "pieces", header: "Pieces", cell: ({ row }) => row.original.pieces.toLocaleString() },
     { accessorKey: "cost", header: "Cost", cell: ({ row }) => `$${row.original.cost.toLocaleString()}` },
     { 
        accessorKey: "status", 
        header: "Status",
        cell: ({ row }) => <Badge variant={row.original.status === 'Completed' ? 'default' : 'secondary'}>{row.original.status}</Badge>
     },
     {
        id: "actions",
        cell: ({ row }) => (
           <Button variant="ghost" size="sm" onClick={() => { setEditingPrintJob(row.original); setShowPrintJobForm(true); }}>
              <Edit className="h-4 w-4" />
           </Button>
        )
     }
  ];

  const surveyColumns: ColumnDef<Survey>[] = [
     { accessorKey: "date", header: "Date" },
     { accessorKey: "type", header: "Type" },
     { 
        accessorKey: "score", 
        header: "Score",
        cell: ({ row }) => (
           <div className={`font-bold ${row.original.score >= 9 ? 'text-green-600' : row.original.score <= 6 ? 'text-red-600' : 'text-yellow-600'}`}>
              {row.original.score}
           </div>
        )
     },
     { accessorKey: "comments", header: "Comments", cell: ({ row }) => <span className="italic">"{row.original.comments}"</span> },
     {
        id: "actions",
        cell: ({ row }) => (
           <Button variant="ghost" size="sm" onClick={() => { setEditingSurvey(row.original); setShowSurveyForm(true); }}>
              <Edit className="h-4 w-4" />
           </Button>
        )
     }
  ];

  return (
    <Shell title="Client Detail">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-brand-navy flex items-center gap-3">
             {client.name}
             <Badge className={
                client.status === 'Active' ? 'bg-brand-green' : 
                client.status === 'At-Risk' ? 'bg-red-500' : 'bg-gray-500'
             }>{client.status}</Badge>
          </h1>
          <p className="text-sm text-muted-foreground font-mono">{client.code}</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => setShowClientForm(true)}>Edit Client</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Sidebar / Info */}
         <Card className="md:col-span-1 h-fit">
            <CardHeader>
               <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> State</div>
                  <div className="font-medium text-right">{client.state}</div>

                  <div className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-4 w-4" /> Type</div>
                  <div className="font-medium text-right">{client.utilityType}</div>

                  <div className="flex items-center gap-2 text-muted-foreground"><Printer className="h-4 w-4" /> Provider</div>
                  <div className="font-medium text-right">{client.provider}</div>

                  <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /> Manager</div>
                  <div className="font-medium text-right">{manager?.fullName || 'Unassigned'}</div>

                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Started</div>
                  <div className="font-medium text-right">{client.contractStartDate}</div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground"><ActivityIcon className="h-4 w-4" /> Last Active</div>
                  <div className="font-medium text-right">{client.lastActivityDate}</div>
               </div>
               
               <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                     {client.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                     <Button variant="ghost" size="sm" className="h-5 text-xs px-1 text-muted-foreground">+ Add</Button>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Main Content Tabs */}
         <div className="md:col-span-2">
            <Tabs defaultValue="activities" className="w-full">
               <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-4 space-x-6">
                  <TabsTrigger value="activities" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-navy data-[state=active]:bg-transparent px-0 py-2">Activities</TabsTrigger>
                  <TabsTrigger value="print" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-navy data-[state=active]:bg-transparent px-0 py-2">Print Volume</TabsTrigger>
                  <TabsTrigger value="surveys" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-navy data-[state=active]:bg-transparent px-0 py-2">Surveys</TabsTrigger>
               </TabsList>
               
               <TabsContent value="activities" className="space-y-4">
                  <div className="flex justify-between items-center">
                     <h3 className="font-semibold">Activity Log</h3>
                     <Button size="sm" onClick={() => { setEditingActivity(undefined); setShowActivityForm(true); }}>
                        <Plus className="h-4 w-4 mr-2" /> Log Activity
                     </Button>
                  </div>
                  <DataTable columns={activityColumns} data={clientActivities} />
               </TabsContent>

               <TabsContent value="print" className="space-y-4">
                  <div className="flex justify-between items-center">
                     <h3 className="font-semibold">Print Jobs</h3>
                     <Button size="sm" onClick={() => { setEditingPrintJob(undefined); setShowPrintJobForm(true); }}>
                        <Plus className="h-4 w-4 mr-2" /> Add Print Job
                     </Button>
                  </div>
                  <DataTable columns={printColumns} data={clientPrintJobs} />
               </TabsContent>

               <TabsContent value="surveys" className="space-y-4">
                  <div className="flex justify-between items-center">
                     <h3 className="font-semibold">Survey Responses</h3>
                     <Button size="sm" onClick={() => { setEditingSurvey(undefined); setShowSurveyForm(true); }}>
                        <Plus className="h-4 w-4 mr-2" /> Record Survey
                     </Button>
                  </div>
                  <DataTable columns={surveyColumns} data={clientSurveys} />
               </TabsContent>
            </Tabs>
         </div>
      </div>

      {/* Forms */}
      <ClientForm open={showClientForm} onOpenChange={setShowClientForm} client={client} />
      
      <ActivityForm 
         open={showActivityForm} 
         onOpenChange={setShowActivityForm} 
         defaultClientId={client.id}
         activity={editingActivity}
      />
      
      <PrintJobForm 
         open={showPrintJobForm} 
         onOpenChange={setShowPrintJobForm} 
         defaultClientId={client.id}
         job={editingPrintJob}
      />
      
      <SurveyForm 
         open={showSurveyForm} 
         onOpenChange={setShowSurveyForm} 
         defaultClientId={client.id}
         survey={editingSurvey}
      />
    </Shell>
  );
}
