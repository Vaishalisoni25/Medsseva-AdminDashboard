export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TicketStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
export type TicketCategory = 'Booking Issue' | 'Report Delayed' | 'Refund Status' | 'Phlebotomist Complaint' | 'Technical Error';

export interface InternalNote {
  id: string;
  authorName: string;
  timestamp: string;
  text: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedAgentId?: string;
  assignedAgentName?: string;
  createdAt: string;
  lastUpdatedAt: string;
  description: string;
  internalNotes: InternalNote[];
}

export interface PatientCallbackRequest {
  id: string;
  patientName: string;
  patientPhone: string;
  preferredTimeSlot: string;
  requestedAt: string;
  status: 'Pending' | 'Called' | 'No Answer' | 'Cancelled';
  assignedAdminName?: string;
  outcomeNotes?: string;
}

export interface AppFeedback {
  id: string;
  patientName: string;
  rating: number; // 1-5
  comment?: string;
  source: 'Android App' | 'iOS App' | 'Web Portal';
  date: string;
  resolved: boolean;
}
