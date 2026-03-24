import { Client, Activity, PrintJob, Survey, User } from './types';
import { subDays, subMonths, format } from 'date-fns';

// Utilities
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Seed Data Generators
export const USERS: User[] = [
  { id: 'u1', username: 'admin', fullName: 'Sarah Admin', role: 'Admin', avatar: 'https://i.pravatar.cc/150?u=u1' },
  { id: 'u2', username: 'manager', fullName: 'Mike Manager', role: 'Manager', avatar: 'https://i.pravatar.cc/150?u=u2' },
  { id: 'u3', username: 'analyst', fullName: 'Alice Analyst', role: 'Analyst', avatar: 'https://i.pravatar.cc/150?u=u3' },
  { id: 'u4', username: 'readonly', fullName: 'Bob Viewer', role: 'ReadOnly', avatar: 'https://i.pravatar.cc/150?u=u4' },
];

const CLIENT_NAMES = [
  'Metro Water Dist', 'City of Springfield', 'Lakeside Power', 'Summit Gas', 'Valley Utilities',
  'Oak Creek Water', 'Pinnacle Electric', 'River City Utils', 'Highland Heights', 'Bay Area Power',
  'Cedar Grove', 'Maplewood Utilities', 'Pine Valley', 'Elm Street Water', 'Redwood Electric',
  'Sierra Gas', 'Cascade Water', 'Horizon Power', 'Vista Utilities', 'Canyon Creek',
  'Desert Springs', 'Ocean View', 'Mountain Utilities', 'Prairie Power', 'Forest Grove',
  'Sunset Valley', 'Golden Gate Utils', 'Silver Lake', 'Crystal Clear Water', 'Blue Sky Electric'
];

const STATES = ['TX', 'CA', 'FL', 'NY', 'AZ', 'UT', 'CO'];
const MANAGERS = ['u1', 'u2', 'u3'];

export function generateClients(): Client[] {
  return CLIENT_NAMES.map((name, i) => ({
    id: `c${i + 1}`,
    name,
    code: `CLT-${1000 + i}`,
    utilityType: randomItem(['Water', 'Electric', 'Gas', 'Multi-Service']),
    state: randomItem(STATES),
    status: randomItem(['Active', 'Active', 'Active', 'Onboarding', 'At-Risk']), // Weighted towards Active
    provider: randomItem(['DDSY', 'DDSY', 'DDS', 'Other']),
    assignedManager: randomItem(MANAGERS),
    lastActivityDate: format(subDays(new Date(), randomInt(0, 90)), 'yyyy-MM-dd'),
    contractStartDate: format(subMonths(new Date(), randomInt(12, 60)), 'yyyy-MM-dd'),
    tags: [randomItem(['Priority', 'Standard', 'Legacy']), randomItem(['Growth', 'Stable'])],
    contactEmail: `contact@${name.toLowerCase().replace(/\s/g, '')}.com`,
    contactPhone: `555-01${randomInt(10, 99)}`,
  }));
}

export function generateActivities(clients: Client[]): Activity[] {
  const activities: Activity[] = [];
  const types = ['Call Center', 'Collections', 'Invoices', 'Transcription', 'Payroll', 'Print Fulfillment', 'Implementation', 'Support', 'Issue'];
  const outcomes = ['Resolved', 'Pending Info', 'Escalated', 'Completed'];

  clients.forEach(client => {
    // Generate 5-15 activities per client over the last year
    const count = randomInt(5, 15);
    for (let i = 0; i < count; i++) {
      activities.push({
        id: `a-${client.id}-${i}`,
        clientId: client.id,
        type: randomItem(types) as any,
        date: format(randomDate(subDays(new Date(), 365), new Date()), 'yyyy-MM-dd'),
        ownerId: randomItem(MANAGERS),
        status: randomItem(['Open', 'In Progress', 'Done', 'Done', 'Done']) as any,
        effortHours: randomInt(1, 8),
        outcome: randomItem(outcomes),
        valueScore: randomItem([1, 2, 3, 4, 5]),
        notes: 'Automated activity log entry.',
        attachmentCount: randomInt(0, 3)
      });
    }
  });

  return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function generatePrintJobs(clients: Client[]): PrintJob[] {
  const jobs: PrintJob[] = [];
  
  // Generate 12 months of jobs
  for (let m = 0; m < 12; m++) {
    const monthDate = subMonths(new Date(), m);
    clients.forEach(client => {
      // Not every client prints every month, but most do
      if (Math.random() > 0.1) {
        // Seasonality: More printing in winter/summer
        const seasonality = [0, 11, 5, 6].includes(monthDate.getMonth()) ? 1.5 : 1.0;
        const pieces = Math.floor(randomInt(1000, 50000) * seasonality);
        
        jobs.push({
          id: `pj-${client.id}-${m}`,
          date: format(monthDate, 'yyyy-MM-dd'),
          clientId: client.id,
          provider: client.provider,
          pieces,
          pages: Math.floor(pieces * randomItem([1.5, 2, 3])),
          cost: pieces * 0.45, // approx 45 cents per piece
          status: randomItem(['Completed', 'Completed', 'Completed', 'Processing']) as any
        });
      }
    });
  }
  return jobs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function generateSurveys(clients: Client[]): Survey[] {
  const surveys: Survey[] = [];
  
  clients.forEach(client => {
    if (Math.random() > 0.3) { // 70% of clients have surveys
      const count = randomInt(1, 4);
      for (let i = 0; i < count; i++) {
        const score = randomInt(1, 10);
        surveys.push({
          id: `s-${client.id}-${i}`,
          date: format(randomDate(subDays(new Date(), 365), new Date()), 'yyyy-MM-dd'),
          clientId: client.id,
          type: randomItem(['NPS', 'CSAT']),
          score,
          comments: score < 7 ? 'Service was slow.' : 'Great experience!',
          linkedActivityId: score < 6 ? `a-${client.id}-0` : undefined
        });
      }
    }
  });
  
  return surveys.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
