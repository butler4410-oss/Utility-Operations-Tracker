import { Shell } from "@/components/layout/shell";
import { useUsers, useAdminStatus, useResetData } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, Database } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function Admin() {
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: status, isLoading: statusLoading } = useAdminStatus();
  const resetData = useResetData();

  if (usersLoading || statusLoading) {
    return <Shell title="System Administration"><div className="text-center py-8 text-muted-foreground">Loading...</div></Shell>;
  }

  const handleReset = () => {
    if (confirm('⚠️ This will delete ALL data and reset to original seed values. Are you sure?')) {
      resetData.mutate();
    }
  };

  return (
    <Shell title="System Administration">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Demo Data Status
            </CardTitle>
            <CardDescription>Current database statistics and last reset timestamp</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-navy">{status?.users || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-navy">{status?.clients || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Clients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-navy">{status?.activities || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Activities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-navy">{status?.printJobs || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Print Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-navy">{status?.surveys || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Surveys</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-navy">{status?.callRecords || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Call Records</div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-muted-foreground">
                Last Reset: <span className="font-mono">{status?.lastReset ? format(parseISO(status.lastReset), 'PPpp') : 'Never'}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage access and roles</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                {users.map(user => (
                   <div key={user.id} className="flex items-center justify-between border p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-brand-navy">
                            {user.username.charAt(0).toUpperCase()}
                         </div>
                         <div>
                            <p className="font-semibold">{user.fullName}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="px-3 py-1 bg-brand-navy/10 text-brand-navy rounded-full text-xs font-medium">{user.role}</span>
                         <Button variant="ghost" size="icon" disabled>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                         </Button>
                      </div>
                   </div>
                ))}
             </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-900">Developer Zone</CardTitle>
            <CardDescription className="text-red-700">Dangerous actions for prototype management</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground mb-4">
                Reset all data to original seed values. This creates 12 months of realistic demo data with proper relationships across all modules.
             </p>
             <Button 
               variant="destructive" 
               onClick={handleReset}
               disabled={resetData.isPending}
             >
                <RefreshCw className={`h-4 w-4 mr-2 ${resetData.isPending ? 'animate-spin' : ''}`} />
                {resetData.isPending ? 'Resetting...' : 'Reset / Seed Demo Data'}
             </Button>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
