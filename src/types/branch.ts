export interface CityContext {
  id: string;
  name: string;
  state: string;
  isActive: boolean;
}

export interface Franchise {
  id: string;
  name: string;
  code: string;
  owner: string;
  location: string;
  commissionRate: number;
  monthlyBusiness: number;
  totalTests: number;
  status: 'Active' | 'Pending' | 'Suspended';
}


export interface BranchContext {
  id: string;
  name: string;
  cityId: string;
  address: string;
  phlebotomistCount: number;
  technicianCount: number;
  status: 'active' | 'inactive';
  contactPerson: string;
  phone: string;
}

export interface FranchisePayout {
  id: string;
  franchiseId: string;
  franchiseName: string;
  period: string; // e.g., 'May 1-15, 2026'
  totalRevenue: number;
  commissionRate: number; // e.g., 15
  commissionAmount: number;
  tdsRate: number; // e.g., 10% TDS
  tdsDeducted: number;
  netPayout: number;
  gstAmount: number;
  invoiceNumber: string;
  status: 'Pending' | 'Approved' | 'Disbursed';
  processedDate?: string;
}
