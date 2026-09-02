export type CustomTemplateType = 'STANDARD' | 'DETAILED';

export interface ReportBrandingSettings {
  labName?: string;
  branchName?: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  registrationNo?: string;
  gstPan?: string;
  licenseInfo?: string;
  headerAlignment?: 'left' | 'center' | 'right' | 'split';
  logoPosition?: 'left' | 'right' | 'center';
  headerText?: string;
  headerSpacing?: number;
}

export interface ReportDesignSettings {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  textColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: 'compact' | 'standard' | 'comfortable';
  headingSize?: 'small' | 'medium' | 'large';
  tableStyle?: 'clean' | 'striped' | 'bordered' | 'modern';
  borderStyle?: 'solid' | 'dashed' | 'minimal' | 'none';
  borderThickness?: number;
  tableHeaderStyle?: 'primary' | 'secondary' | 'dark' | 'light' | 'outline';
  sectionSpacing?: number;
  pageMargins?: number;
}

export interface ReportFieldSettings {
  showPatientId?: boolean;
  showAgeGender?: boolean;
  showMobile?: boolean;
  showEmail?: boolean;
  showAddress?: boolean;
  showReferredBy?: boolean;
  showSampleId?: boolean;
  showCollectionDate?: boolean;
  showCollectionTime?: boolean;
  showReportDate?: boolean;
  showReportTime?: boolean;
  showBarcode?: boolean;
  showTestCode?: boolean;
  showInterpretation?: boolean;
  showRemarks?: boolean;
  showSignature?: boolean;
  showStamp?: boolean;
  showDoctorDetails?: boolean;
  showTechnicianDetails?: boolean;
  showAbnormalFlags?: boolean;
}

export interface ReportQRSettings {
  enabled?: boolean;
  position?: 'header_right' | 'footer_left' | 'footer_right' | 'footer_center';
  size?: number;
  alignment?: 'left' | 'center' | 'right';
  label?: string;
}

export interface ReportFooterSettings {
  customFooterText?: string;
  footerAlignment?: 'left' | 'center' | 'right';
  footerSpacing?: number;
  showPageNumbers?: boolean;
  termsAndConditions?: string;
}

export interface CustomReportTemplate {
  id: string;
  partnerId?: string | null;
  branchId?: string | null;
  name: string;
  type: CustomTemplateType;
  logoUrl?: string | null;
  branding: ReportBrandingSettings;
  designSettings: ReportDesignSettings;
  fieldSettings: ReportFieldSettings;
  qrSettings: ReportQRSettings;
  footerSettings: ReportFooterSettings;
  isDefault: boolean;
  isActive: boolean;
  createdById?: string | null;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
  branch?: { id: string; name: string; code: string } | null;
  partner?: { id: string; labName: string } | null;
}

// ----------------------------------------------------
// INVOICE TEMPLATE TYPES
// ----------------------------------------------------

export interface InvoiceBrandingSettings {
  labName?: string;
  branchName?: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  headerAlignment?: 'left' | 'center' | 'right' | 'split';
  logoPosition?: 'left' | 'right' | 'center';
}

export interface InvoiceDesignSettings {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: 'compact' | 'standard' | 'comfortable';
  headingSize?: 'small' | 'medium' | 'large';
  tableStyle?: 'clean' | 'striped' | 'bordered';
  borderStyle?: 'solid' | 'dashed' | 'minimal';
}

export interface InvoiceFieldSettings {
  showPatientDetails?: boolean;
  showBillingDetails?: boolean;
  showPaymentMethod?: boolean;
  showTransactionId?: boolean;
  showTaxBreakdown?: boolean;
  showDiscountBreakdown?: boolean;
  showCouponDetails?: boolean;
  showAmountInWords?: boolean;
  showBankDetails?: boolean;
  showTerms?: boolean;
  showSignature?: boolean;
  showStamp?: boolean;
}

export interface InvoiceQRSettings {
  enabled?: boolean;
  position?: 'header_right' | 'footer_left' | 'footer_right' | 'summary_box';
  size?: number;
  alignment?: 'left' | 'center' | 'right';
  label?: string;
}

export interface InvoiceFooterSettings {
  customFooterText?: string;
  termsAndConditions?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolder?: string;
  upiId?: string;
  registeredOffice?: string;
}

export interface CustomInvoiceTemplate {
  id: string;
  partnerId?: string | null;
  branchId?: string | null;
  name: string;
  type: CustomTemplateType;
  logoUrl?: string | null;
  branding: InvoiceBrandingSettings;
  designSettings: InvoiceDesignSettings;
  fieldSettings: InvoiceFieldSettings;
  qrSettings: InvoiceQRSettings;
  footerSettings: InvoiceFooterSettings;
  isDefault: boolean;
  isActive: boolean;
  createdById?: string | null;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
  branch?: { id: string; name: string; code: string } | null;
  partner?: { id: string; labName: string } | null;
}
