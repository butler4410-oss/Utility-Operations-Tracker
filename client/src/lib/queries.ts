import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsAPI, activitiesAPI, printJobsAPI, surveysAPI, usersAPI, adminAPI, callRecordsAPI, mailComplianceAPI } from './api';
import { Client, Activity, PrintJob, Survey, CallRecord } from './types';
import { toast } from '@/hooks/use-toast';

// Query Keys
export const queryKeys = {
  users: ['users'] as const,
  clients: ['clients'] as const,
  client: (id: string) => ['clients', id] as const,
  activities: ['activities'] as const,
  activitiesByClient: (clientId: string) => ['activities', 'client', clientId] as const,
  printJobs: ['printJobs'] as const,
  printJobsByClient: (clientId: string) => ['printJobs', 'client', clientId] as const,
  surveys: ['surveys'] as const,
  surveysByClient: (clientId: string) => ['surveys', 'client', clientId] as const,
  callRecords: (params?: { status?: string; assignedTo?: string; clientId?: string }) => 
    params ? ['callRecords', params] as const : ['callRecords'] as const,
  callRecord: (id: string) => ['callRecords', id] as const,
  mailComplianceStats: ['mailCompliance', 'stats'] as const,
  adminStatus: ['admin', 'status'] as const,
};

// Users
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: usersAPI.getAll,
  });
}

// Clients
export function useClients() {
  return useQuery({
    queryKey: queryKeys.clients,
    queryFn: clientsAPI.getAll,
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: queryKeys.client(id),
    queryFn: () => clientsAPI.getOne(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      toast({ title: 'Client created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create client', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) =>
      clientsAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      queryClient.invalidateQueries({ queryKey: queryKeys.client(variables.id) });
      toast({ title: 'Client updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update client', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      toast({ title: 'Client deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete client', description: error.message, variant: 'destructive' });
    },
  });
}

// Activities
export function useActivities() {
  return useQuery({
    queryKey: queryKeys.activities,
    queryFn: activitiesAPI.getAll,
  });
}

export function useActivitiesByClient(clientId: string) {
  return useQuery({
    queryKey: queryKeys.activitiesByClient(clientId),
    queryFn: () => activitiesAPI.getByClient(clientId),
    enabled: !!clientId,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activitiesAPI.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities });
      queryClient.invalidateQueries({ queryKey: queryKeys.activitiesByClient(data.clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      toast({ title: 'Activity logged successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to log activity', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Activity> }) =>
      activitiesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities });
      toast({ title: 'Activity updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update activity', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activitiesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities });
      toast({ title: 'Activity deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete activity', description: error.message, variant: 'destructive' });
    },
  });
}

// Print Jobs
export function usePrintJobs() {
  return useQuery({
    queryKey: queryKeys.printJobs,
    queryFn: printJobsAPI.getAll,
  });
}

export function usePrintJobsByClient(clientId: string) {
  return useQuery({
    queryKey: queryKeys.printJobsByClient(clientId),
    queryFn: () => printJobsAPI.getByClient(clientId),
    enabled: !!clientId,
  });
}

export function useCreatePrintJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: printJobsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.printJobs });
      toast({ title: 'Print job created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create print job', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdatePrintJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PrintJob> }) =>
      printJobsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.printJobs });
      toast({ title: 'Print job updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update print job', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeletePrintJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: printJobsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.printJobs });
      toast({ title: 'Print job deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete print job', description: error.message, variant: 'destructive' });
    },
  });
}

// Surveys
export function useSurveys() {
  return useQuery({
    queryKey: queryKeys.surveys,
    queryFn: surveysAPI.getAll,
  });
}

export function useSurveysByClient(clientId: string) {
  return useQuery({
    queryKey: queryKeys.surveysByClient(clientId),
    queryFn: () => surveysAPI.getByClient(clientId),
    enabled: !!clientId,
  });
}

export function useCreateSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: surveysAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys });
      toast({ title: 'Survey recorded successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to record survey', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Survey> }) =>
      surveysAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys });
      toast({ title: 'Survey updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update survey', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: surveysAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys });
      toast({ title: 'Survey deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete survey', description: error.message, variant: 'destructive' });
    },
  });
}

// Call Records
export function useCallRecords(params?: { status?: string; assignedTo?: string; clientId?: string }) {
  return useQuery({
    queryKey: queryKeys.callRecords(params),
    queryFn: () => callRecordsAPI.getAll(params),
  });
}

export function useCallRecord(id: string) {
  return useQuery({
    queryKey: queryKeys.callRecord(id),
    queryFn: () => callRecordsAPI.getOne(id),
    enabled: !!id,
  });
}

export function useCreateCallRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: callRecordsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callRecords'] });
      toast({ title: 'Call record created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create call record', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCallRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CallRecord> }) =>
      callRecordsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callRecords'] });
      toast({ title: 'Call record updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update call record', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCallRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: callRecordsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callRecords'] });
      toast({ title: 'Call record deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete call record', description: error.message, variant: 'destructive' });
    },
  });
}

// Mail Compliance
export function useMailComplianceStats() {
  return useQuery({
    queryKey: queryKeys.mailComplianceStats,
    queryFn: mailComplianceAPI.getStats,
  });
}

// Admin
export function useAdminStatus() {
  return useQuery({
    queryKey: queryKeys.adminStatus,
    queryFn: adminAPI.getStatus,
  });
}

export function useResetData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminAPI.resetData,
    onSuccess: () => {
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
      toast({ title: 'Demo data reset successfully', description: 'All data has been reset to the original seed values.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to reset data', description: error.message, variant: 'destructive' });
    },
  });
}
