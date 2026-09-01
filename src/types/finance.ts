export interface Transaction {
  id: string;
  bookingId: string;
  bookingCode: string;
  patientName: string;
  amount: number;
  method: 'Online' | 'Cash' | 'Card' | 'UPI';
  status: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  date: string;
}

export interface Settlement {
  id: string;
  franchiseId: string;
  franchiseName: string;
  period: string;
  totalBusiness: number;
  commissionAmount: number;
  status: 'Paid' | 'Pending' | 'Processing';
  processedAt?: string;
}

export interface Refund {
  id: string;
  bookingCode: string;
  amount: number;
  reason: string;
  status: 'Initiated' | 'Processed' | 'Failed';
  date: string;
}
