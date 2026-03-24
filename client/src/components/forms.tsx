import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Activity, Client, PrintJob, Survey } from "@/lib/types";
import { useEffect } from "react";
import { useUsers, useClients, useCreateClient, useUpdateClient, useCreateActivity, useUpdateActivity, useCreatePrintJob, useUpdatePrintJob, useCreateSurvey, useUpdateSurvey } from "@/lib/queries";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client;
}

export function ClientForm({ open, onOpenChange, client }: ClientFormProps) {
  const { data: users = [] } = useUsers();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const { register, handleSubmit, reset, setValue } = useForm<Partial<Client>>();
  const managers = users.filter(u => u.role === 'Manager' || u.role === 'Admin');

  useEffect(() => {
    if (client) {
      reset(client);
    } else {
      reset({
        name: '',
        code: `CLT-${Math.floor(Math.random() * 10000)}`,
        status: 'Onboarding',
        state: 'TX',
        utilityType: 'Water',
        provider: 'DDSY'
      });
    }
  }, [client, open, reset]);

  const onSubmit = (data: Partial<Client>) => {
    const payload = {
      ...data,
      id: client ? client.id : `c-${Date.now()}`,
      lastActivityDate: data.lastActivityDate || format(new Date(), 'yyyy-MM-dd'),
      contractStartDate: data.contractStartDate || format(new Date(), 'yyyy-MM-dd'),
      tags: data.tags || [],
    } as Client;

    if (client) {
      updateClient.mutate({ id: client.id, data: payload }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createClient.mutate(payload, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {client ? 'Update client details.' : 'Onboard a new utility client.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" className="col-span-3" {...register('name')} required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">Code</Label>
            <Input id="code" className="col-span-3" {...register('code')} required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <div className="col-span-3">
              <Select onValueChange={(val) => setValue('utilityType', val as any)} defaultValue={client?.utilityType || 'Water'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Water">Water</SelectItem>
                  <SelectItem value="Electric">Electric</SelectItem>
                  <SelectItem value="Gas">Gas</SelectItem>
                  <SelectItem value="Multi-Service">Multi-Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
             <div className="col-span-3">
              <Select onValueChange={(val) => setValue('status', val as any)} defaultValue={client?.status || 'Onboarding'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Onboarding">Onboarding</SelectItem>
                  <SelectItem value="At-Risk">At-Risk</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="manager" className="text-right">Manager</Label>
             <div className="col-span-3">
                <Select onValueChange={(val) => setValue('assignedManager', val)} defaultValue={client?.assignedManager}>
                   <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                   <SelectContent>
                      {managers.map(m => (
                         <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
             </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-brand-navy text-white">Save Client</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity;
  defaultClientId?: string;
}

export function ActivityForm({ open, onOpenChange, activity, defaultClientId }: ActivityFormProps) {
  const { data: clients = [] } = useClients();
  const { data: users = [] } = useUsers();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const { register, handleSubmit, reset, setValue, watch } = useForm<Partial<Activity>>();

  useEffect(() => {
    if (activity) {
      reset(activity);
    } else if (users && users.length > 0) {
      reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'Open',
        type: 'Call Center',
        valueScore: 3,
        clientId: defaultClientId,
        ownerId: users[0].id
      });
    }
  }, [activity, open, reset, defaultClientId, users]);

  const onSubmit = (data: Partial<Activity>) => {
    const payload = { 
       ...data,
       id: activity ? activity.id : `a-${Date.now()}`,
       effortHours: String(data.effortHours || 0),
       valueScore: Number(data.valueScore) || 3,
       attachmentCount: data.attachmentCount || 0
    } as Activity;

    if (activity) {
      updateActivity.mutate({ id: activity.id, data: payload }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createActivity.mutate(payload, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>{activity ? 'Edit Activity' : 'Log Activity'}</SheetTitle>
          <SheetDescription>Record interactions and tasks.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
           <div className="space-y-2">
              <Label>Client</Label>
              <Select onValueChange={(val) => setValue('clientId', val)} defaultValue={defaultClientId || activity?.clientId}>
                 <SelectTrigger disabled={!!defaultClientId}><SelectValue placeholder="Select Client" /></SelectTrigger>
                 <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                 </SelectContent>
              </Select>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label>Type</Label>
                 <Select onValueChange={(val) => setValue('type', val as any)} defaultValue={activity?.type || 'Call Center'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                       {['Call Center', 'Collections', 'Invoices', 'Issue', 'Support', 'Implementation'].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <Label>Date</Label>
                 <Input type="date" {...register('date')} />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label>Status</Label>
                  <Select onValueChange={(val) => setValue('status', val as any)} defaultValue={activity?.status || 'Open'}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                        <SelectItem value="Blocked">Blocked</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                  <Label>Effort (Hours)</Label>
                  <Input type="number" step="0.5" {...register('effortHours')} />
               </div>
           </div>

           <div className="space-y-2">
              <Label>Description / Notes</Label>
              <Textarea {...register('notes')} rows={4} />
           </div>

           <div className="space-y-2">
              <Label>Value Score (1-5)</Label>
              <Select onValueChange={(val) => setValue('valueScore', Number(val) as any)} defaultValue={String(activity?.valueScore || 3)}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} Stars</SelectItem>)}
                 </SelectContent>
              </Select>
           </div>
           
           <Button type="submit" className="bg-brand-navy text-white mt-4">Save Activity</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

interface PrintJobFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: PrintJob;
  defaultClientId?: string;
}

export function PrintJobForm({ open, onOpenChange, job, defaultClientId }: PrintJobFormProps) {
  const { data: clients = [] } = useClients();
  const createPrintJob = useCreatePrintJob();
  const updatePrintJob = useUpdatePrintJob();
  const { register, handleSubmit, reset, setValue } = useForm<Partial<PrintJob>>();

  useEffect(() => {
    if (job) {
      reset(job);
    } else {
      reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'Processing',
        provider: 'DDSY',
        clientId: defaultClientId
      });
    }
  }, [job, open, reset, defaultClientId]);

  const onSubmit = (data: Partial<PrintJob>) => {
    const payload = { 
       ...data,
       id: job ? job.id : `pj-${Date.now()}`,
       pieces: Number(data.pieces) || 0,
       pages: Number(data.pages) || 0,
       cost: String(Number(data.cost) || 0)
    } as PrintJob;
    
    if (job) {
      updatePrintJob.mutate({ id: job.id, data: payload }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createPrintJob.mutate(payload, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{job ? 'Edit Print Job' : 'Add Print Job'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label>Client</Label>
                 <Select onValueChange={(val) => setValue('clientId', val)} defaultValue={defaultClientId || job?.clientId}>
                    <SelectTrigger disabled={!!defaultClientId}><SelectValue placeholder="Select Client" /></SelectTrigger>
                    <SelectContent>
                       {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <Label>Provider</Label>
                 <Select onValueChange={(val) => setValue('provider', val as any)} defaultValue={job?.provider || 'DDSY'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="DDSY">DDSY</SelectItem>
                       <SelectItem value="DDS">DDS</SelectItem>
                       <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label>Date</Label>
                 <Input type="date" {...register('date')} />
              </div>
              <div className="space-y-2">
                 <Label>Status</Label>
                 <Select onValueChange={(val) => setValue('status', val as any)} defaultValue={job?.status || 'Processing'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="Processing">Processing</SelectItem>
                       <SelectItem value="Completed">Completed</SelectItem>
                       <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
           </div>

           <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                 <Label>Pieces</Label>
                 <Input type="number" {...register('pieces')} />
              </div>
              <div className="space-y-2">
                 <Label>Pages</Label>
                 <Input type="number" {...register('pages')} />
              </div>
              <div className="space-y-2">
                 <Label>Cost ($)</Label>
                 <Input type="number" step="0.01" {...register('cost')} />
              </div>
           </div>
           <DialogFooter>
              <Button type="submit" className="bg-brand-navy text-white">Save Job</Button>
           </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface SurveyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  survey?: Survey;
  defaultClientId?: string;
}

export function SurveyForm({ open, onOpenChange, survey, defaultClientId }: SurveyFormProps) {
  const { data: clients = [] } = useClients();
  const createSurvey = useCreateSurvey();
  const updateSurvey = useUpdateSurvey();
  const { register, handleSubmit, reset, setValue } = useForm<Partial<Survey>>();

  useEffect(() => {
    if (survey) {
      reset(survey);
    } else {
      reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'NPS',
        score: 10,
        clientId: defaultClientId
      });
    }
  }, [survey, open, reset, defaultClientId]);

  const onSubmit = (data: Partial<Survey>) => {
    const payload = {
      ...data,
      id: survey ? survey.id : `s-${Date.now()}`,
      score: Number(data.score) || 0
    } as Survey;

    if (survey) {
      updateSurvey.mutate({ id: survey.id, data: payload }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createSurvey.mutate(payload, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{survey ? 'Edit Survey' : 'Log Survey Response'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
           <div className="space-y-2">
              <Label>Client</Label>
              <Select onValueChange={(val) => setValue('clientId', val)} defaultValue={defaultClientId || survey?.clientId}>
                 <SelectTrigger disabled={!!defaultClientId}><SelectValue placeholder="Select Client" /></SelectTrigger>
                 <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                 </SelectContent>
              </Select>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label>Type</Label>
                 <Select onValueChange={(val) => setValue('type', val as any)} defaultValue={survey?.type || 'NPS'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="NPS">NPS</SelectItem>
                       <SelectItem value="CSAT">CSAT</SelectItem>
                       <SelectItem value="Onboarding">Onboarding</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <Label>Date</Label>
                 <Input type="date" {...register('date')} />
              </div>
           </div>

           <div className="space-y-2">
              <Label>Score (0-10)</Label>
              <Input type="number" min="0" max="10" {...register('score')} />
           </div>

           <div className="space-y-2">
              <Label>Comments</Label>
              <Textarea {...register('comments')} />
           </div>

           <DialogFooter>
              <Button type="submit" className="bg-brand-navy text-white">Save Survey</Button>
           </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

