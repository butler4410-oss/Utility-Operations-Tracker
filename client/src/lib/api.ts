import { Client, Activity, PrintJob, Survey, User, CallRecord } from './types';

const API_BASE = '/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'API request failed');
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// Users
export const usersAPI = {
  getAll: () => fetchAPI<User[]>('/users'),
};

// Clients
export const clientsAPI = {
  getAll: () => fetchAPI<Client[]>('/clients'),
  getOne: (id: string) => fetchAPI<Client>(`/clients/${id}`),
  create: (data: Partial<Client>) => fetchAPI<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<Client>) => fetchAPI<Client>(`/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<void>(`/clients/${id}`, { method: 'DELETE' }),
};

// Activities
export const activitiesAPI = {
  getAll: () => fetchAPI<Activity[]>('/activities'),
  getByClient: (clientId: string) => fetchAPI<Activity[]>(`/activities/client/${clientId}`),
  create: (data: Partial<Activity>) => fetchAPI<Activity>('/activities', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<Activity>) => fetchAPI<Activity>(`/activities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<void>(`/activities/${id}`, { method: 'DELETE' }),
};

// Print Jobs
export const printJobsAPI = {
  getAll: () => fetchAPI<PrintJob[]>('/print-jobs'),
  getByClient: (clientId: string) => fetchAPI<PrintJob[]>(`/print-jobs/client/${clientId}`),
  create: (data: Partial<PrintJob>) => fetchAPI<PrintJob>('/print-jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<PrintJob>) => fetchAPI<PrintJob>(`/print-jobs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<void>(`/print-jobs/${id}`, { method: 'DELETE' }),
};

// Surveys
export const surveysAPI = {
  getAll: () => fetchAPI<Survey[]>('/surveys'),
  getByClient: (clientId: string) => fetchAPI<Survey[]>(`/surveys/client/${clientId}`),
  create: (data: Partial<Survey>) => fetchAPI<Survey>('/surveys', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<Survey>) => fetchAPI<Survey>(`/surveys/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<void>(`/surveys/${id}`, { method: 'DELETE' }),
};

// Call Records
export const callRecordsAPI = {
  getAll: (params?: { status?: string; assignedTo?: string; clientId?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.assignedTo) query.append('assignedTo', params.assignedTo);
    if (params?.clientId) query.append('clientId', params.clientId);
    const queryString = query.toString();
    return fetchAPI<CallRecord[]>(`/call-records${queryString ? `?${queryString}` : ''}`);
  },
  getOne: (id: string) => fetchAPI<CallRecord>(`/call-records/${id}`),
  create: (data: Partial<CallRecord>) => fetchAPI<CallRecord>('/call-records', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<CallRecord>) => fetchAPI<CallRecord>(`/call-records/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<void>(`/call-records/${id}`, { method: 'DELETE' }),
};

// Mail Compliance
export const mailComplianceAPI = {
  getStats: () => fetchAPI<{ onTimePercent: number; avgBusinessDays: number; totalExceptions: number; unapprovedRuns: number }>('/mail-compliance/stats'),
};

// Admin
export const adminAPI = {
  getStatus: () => fetchAPI<{ users: number; clients: number; activities: number; printJobs: number; surveys: number; callRecords: number; lastReset: string }>('/admin/status'),
  resetData: () => fetchAPI<{ message: string }>('/admin/reset', { method: 'POST' }),
};
