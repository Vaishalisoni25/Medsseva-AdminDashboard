export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface ReagentItem {
  id: string;
  code: string;
  name: string;
  category: 'Biochemistry' | 'Hematology' | 'Immunology' | 'General';
  currentStock: number;
  minThreshold: number; // Triggers Low Stock alerts
  unit: string; // e.g. 'Kits', 'Liters', 'Packs'
  pricePerUnit: number;
  expiryDate: string;
  status: StockStatus;
  lastRestockedAt: string;
  supplierName: string;
}

export interface ConsumableItem {
  id: string;
  code: string;
  name: string;
  type: 'Vial' | 'Needle' | 'Swab' | 'Gloves' | 'General';
  currentStock: number;
  minThreshold: number;
  unit: string;
  status: StockStatus;
  lastRestockedAt: string;
}

export interface StockTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'Inward' | 'Outward';
  quantity: number;
  performedBy: string; // User ID or 'System Automatic'
  date: string;
  reference: string; // e.g. 'Report #10293' or 'Purchase Order #453'
  notes?: string;
}
