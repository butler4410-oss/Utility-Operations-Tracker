import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Client, Activity, PrintJob, Survey, User } from './types';
import { generateClients, generateActivities, generatePrintJobs, generateSurveys, USERS } from './seed';

interface AppState {
  users: User[];
  clients: Client[];
  activities: Activity[];
  printJobs: PrintJob[];
  surveys: Survey[];
  
  // Actions
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;

  addPrintJob: (job: PrintJob) => void;
  updatePrintJob: (id: string, updates: Partial<PrintJob>) => void;
  deletePrintJob: (id: string) => void;

  addSurvey: (survey: Survey) => void;
  updateSurvey: (id: string, updates: Partial<Survey>) => void;
  deleteSurvey: (id: string) => void;
  
  // Reset
  resetData: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      users: USERS,
      clients: [], 
      activities: [],
      printJobs: [],
      surveys: [],

      addClient: (client) => set((state) => ({ clients: [client, ...state.clients] })),
      updateClient: (id, updates) => set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      })),
      deleteClient: (id) => set((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
        activities: state.activities.filter((a) => a.clientId !== id),
        printJobs: state.printJobs.filter((p) => p.clientId !== id),
        surveys: state.surveys.filter((s) => s.clientId !== id),
      })),

      addActivity: (activity) => set((state) => {
         // Update client last activity date automatically
         const clients = state.clients.map(c => 
            c.id === activity.clientId 
               ? { ...c, lastActivityDate: activity.date > c.lastActivityDate ? activity.date : c.lastActivityDate } 
               : c
         );
         return { activities: [activity, ...state.activities], clients };
      }),
      updateActivity: (id, updates) => set((state) => ({
        activities: state.activities.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      })),
      deleteActivity: (id) => set((state) => ({
        activities: state.activities.filter((a) => a.id !== id)
      })),

      addPrintJob: (job) => set((state) => ({ printJobs: [job, ...state.printJobs] })),
      updatePrintJob: (id, updates) => set((state) => ({
        printJobs: state.printJobs.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      })),
      deletePrintJob: (id) => set((state) => ({
        printJobs: state.printJobs.filter((p) => p.id !== id)
      })),

      addSurvey: (survey) => set((state) => ({ surveys: [survey, ...state.surveys] })),
      updateSurvey: (id, updates) => set((state) => ({
        surveys: state.surveys.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      })),
      deleteSurvey: (id) => set((state) => ({
        surveys: state.surveys.filter((s) => s.id !== id)
      })),

      resetData: () => {
        const clients = generateClients();
        set({
          clients,
          activities: generateActivities(clients),
          printJobs: generatePrintJobs(clients),
          surveys: generateSurveys(clients),
          users: USERS
        });
      },
    }),
    {
      name: 'utilities-tracker-storage',
      onRehydrateStorage: () => (state) => {
        if (state && state.clients.length === 0) {
          state.resetData();
        }
      }
    }
  )
);
