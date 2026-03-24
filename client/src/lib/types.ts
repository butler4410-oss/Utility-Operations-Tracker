export type UserRole = 'Admin' | 'Manager' | 'Analyst' | 'ReadOnly';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
}

export type UtilityType = 'Water' | 'Electric' | 'Gas' | 'Multi-Service';
export type ClientStatus = 'Active' | 'Onboarding' | 'At-Risk' | 'Inactive';
export type Provider = 'DDSY' | 'DDS' | 'Other';

export interface Client {
  id: string;
  name: string;
  code: string;
  utilityType: UtilityType;
  state: string;
  status: ClientStatus;
  provider: Provider;
  assignedManager: string; // User ID
  lastActivityDate: string;
  contractStartDate: string;
  tags: string[];
  contactEmail?: string;
  contactPhone?: string;
}

export type ActivityType = 
  | 'Call Center' 
  | 'Collections' 
  | 'Invoices' 
  | 'Transcription' 
  | 'Payroll' 
  | 'Print Fulfillment' 
  | 'Implementation' 
  | 'Support' 
  | 'Issue';

export type ActivityStatus = 'Open' | 'In Progress' | 'Done' | 'Blocked';

export interface Activity {
  id: string;
  clientId: string;
  type: ActivityType;
  date: string;
  ownerId: string;
  status: ActivityStatus;
  effortHours: number;
  outcome?: string;
  valueScore: 1 | 2 | 3 | 4 | 5; // 1-5
  notes?: string;
  attachmentCount: number;
}

export interface PrintJob {
  id: string;
  date: string;
  clientId: string;
  provider: Provider;
  pieces: number;
  pages: number;
  cost: number;
  status: 'Completed' | 'Processing' | 'Failed';
}

export interface Survey {
  id: string;
  date: string;
  clientId: string;
  type: 'NPS' | 'CSAT' | 'Onboarding';
  score: number; // 0-10
  comments?: string;
  linkedActivityId?: string; // "We listened" tracker
}

export type ContactChannel = 'phone' | 'email' | 'chat';
export type CallReason = 'Billing' | 'Technical' | 'Payment' | 'General' | 'Service Request' | 'Complaint';
export type CallPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type CallStatus = 'Open' | 'In Progress' | 'Resolved' | 'Escalated' | 'Callback Scheduled';
export type CallDisposition = 'resolved' | 'escalated' | 'callback_scheduled' | 'billing_dispute' | 'payment_arrangement' | 'other';
export type ResolutionLevel = 'Tier 1' | 'Tier 2' | 'Tier 3';
export type EscalationTarget = 'Collections' | 'Billing' | 'Print' | 'Technical' | 'Implementation';

export interface CallRecord {
  id: string;
  clientId: string;
  callerName?: string;
  callerPhone?: string;
  callerEmail?: string;
  contactChannel: ContactChannel;
  callReason: CallReason;
  subcategory?: string;
  priority: CallPriority;
  status: CallStatus;
  summary: string;
  detailedNotes?: string;
  assignedTo?: string;
  startTime: string | Date;
  endTime?: string | Date;
  handleTime?: number; // seconds
  wrapUpTime?: number; // seconds
  disposition?: CallDisposition;
  resolutionCode?: string;
  resolutionLevel?: ResolutionLevel;
  firstContactResolution: number; // 0 or 1
  satisfactionScore?: number; // 1-5
  linkedActivityId?: string;
  escalatedTo?: EscalationTarget;
  callbackDate?: string | Date;
  callbackNotes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
