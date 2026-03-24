import { Shell } from "@/components/layout/shell";
import { useActivities, useClients, useUsers, useDeleteActivity } from "@/lib/queries";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { ActivityForm } from "@/components/forms";
import { Activity } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";

export default function Tracking() {
  const { data: activities = [], isLoading } = useActivities();
  const { data: clients = [] } = useClients();
  const { data: users = [] } = useUsers();
  const deleteActivity = useDeleteActivity();
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>(undefined);
  
  // Local Filter States
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Unknown';
  const getOwnerName = (id: string) => users.find(u => u.id === id)?.fullName || 'Unknown';

  const filteredActivities = activities.filter(a => {
     if (typeFilter !== 'all' && a.type !== typeFilter) return false;
     if (statusFilter !== 'all' && a.status !== statusFilter) return false;
     return true;
  });

  if (isLoading) return <Shell title="Activity Tracking"><div className="text-center py-8 text-muted-foreground">Loading activities...</div></Shell>;

  const columns: ColumnDef<Activity>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <span className="font-mono text-xs">{format(parseISO(row.original.date), 'yyyy-MM-dd')}</span>
    },
    {
      accessorKey: "clientId",
      header: "Client",
      cell: ({ row }) => <span className="font-medium text-brand-navy">{getClientName(row.original.clientId)}</span>
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>
    },
    {
      accessorKey: "ownerId",
      header: "Owner",
      cell: ({ row }) => <span className="text-sm">{getOwnerName(row.original.ownerId)}</span>
    },
    {
       accessorKey: "notes",
       header: "Description",
       cell: ({ row }) => <span className="truncate max-w-[200px] block" title={row.original.notes}>{row.original.notes}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={
          row.original.status === 'Done' ? 'bg-green-100 text-green-800' :
          row.original.status === 'Blocked' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }>{row.original.status}</Badge>
      )
    },
    {
       accessorKey: "effortHours",
       header: "Effort",
       cell: ({ row }) => <span>{row.original.effortHours}h</span>
    },
    {
      id: "actions",
      cell: ({ row }) => (
         <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setEditingActivity(row.original); setShowForm(true); }}>
               <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { 
               if(confirm('Delete this activity?')) deleteActivity.mutate(row.original.id)
            }}>
               <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
         </div>
      ),
    },
  ];

  return (
    <Shell title="Activity Tracking">
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
          <div className="flex gap-4">
             <div className="w-[180px]">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                   <SelectTrigger><SelectValue placeholder="Filter Type" /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Call Center">Call Center</SelectItem>
                      <SelectItem value="Collections">Collections</SelectItem>
                      <SelectItem value="Issue">Issue</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                   </SelectContent>
                </Select>
             </div>
             <div className="w-[180px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                   <SelectTrigger><SelectValue placeholder="Filter Status" /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                      <SelectItem value="Blocked">Blocked</SelectItem>
                   </SelectContent>
                </Select>
             </div>
          </div>
          <Button onClick={() => { setEditingActivity(undefined); setShowForm(true); }} className="bg-brand-navy hover:bg-brand-navy/90 text-white">
            <Plus className="mr-2 h-4 w-4" /> Log Activity
          </Button>
      </div>

      <DataTable 
         columns={columns} 
         data={filteredActivities} 
         searchKey="clientId" // Note: This is searching on ID, ideally we search on Name. DataTable simple search might fail here if we don't transform.
         placeholder="Search..." // In a real app we'd make search smarter. For prototype, standard filter ok.
      />

      <ActivityForm 
         open={showForm} 
         onOpenChange={setShowForm} 
         activity={editingActivity} 
      />
    </Shell>
  );
}
