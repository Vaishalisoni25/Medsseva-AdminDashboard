import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  CustomInvoiceTemplate,
  CustomTemplateType,
  InvoiceBrandingSettings,
  InvoiceDesignSettings,
  InvoiceFieldSettings,
  InvoiceQRSettings,
  InvoiceFooterSettings,
} from '../../types/customFormat';
import { customFormatService } from '../../services/customFormat.service';
import { LiveInvoicePreview } from './LiveInvoicePreview';
import { useToast } from '../Toast';
import {
  Save,
  RotateCcw,
  Eye,
  Check,
  Upload,
  Trash2,
  Lock,
  Palette,
  QrCode,
  Sliders,
  FileText,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Building2,
  Receipt,
  CreditCard,
  Loader2,
  Copy,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const COLOR_PRESETS = [
  { name: 'Emerald Teal', primary: '#005C55', secondary: '#0D9488' },
  { name: 'Corporate Blue', primary: '#1E40AF', secondary: '#3B82F6' },
  { name: 'Clinical Navy', primary: '#0F2A3F', secondary: '#1E4A6D' },
  { name: 'Charcoal Minimal', primary: '#18181B', secondary: '#71717A' },
  { name: 'Medical Green', primary: '#15803D', secondary: '#22C55E' },
];

const FONT_PRESETS = [
  { name: 'Modern Sans (Segoe UI / Roboto)', value: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
  { name: 'Clean Document (Inter)', value: "'Inter', sans-serif" },
  { name: 'Standard (Arial)', value: "Arial, Helvetica, sans-serif" },
];

export const InvoiceTemplateBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const templateTypeParam = (searchParams.get('type') || 'STANDARD').toUpperCase() as CustomTemplateType;
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'design' | 'fields' | 'bank' | 'qr' | 'footer'>('branding');
  const [zoomLevel, setZoomLevel] = useState(0.8);
  const [showFullPreview, setShowFullPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Invoice Template State
  const [template, setTemplate] = useState<Partial<CustomInvoiceTemplate>>({
    name: '',
    type: templateTypeParam,
    logoUrl: '/trusted-partner.jpg',
    isDefault: false,
    isActive: true,
    branding: {
      labName: 'MEDSSEVA GLOBAL HEALTHCARE PVT LTD',
      branchName: 'Central Processing Diagnostic Laboratory',
      tagline: 'Smart Diagnostics. Better Care.',
      address: 'G-130 Basement Office No 01, Sector 63, Noida, Uttar Pradesh - 201301',
      phone: '+91 84480 30936',
      email: 'billing@medsseva.com',
      website: 'www.medsseva.com',
      gstin: '09AATCM6853F1ZU',
      pan: 'AAFCO021L',
      cin: 'U85110MH2021PTC362145',
      headerAlignment: 'split',
      logoPosition: 'left',
    },
    designSettings: {
      primaryColor: templateTypeParam === 'DETAILED' ? '#005C55' : '#0F766E',
      secondaryColor: '#0D9488',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      fontSize: 'standard',
      headingSize: 'medium',
      tableStyle: 'striped',
      borderStyle: 'solid',
    },
    fieldSettings: {
      showPatientDetails: true,
      showBillingDetails: true,
      showPaymentMethod: true,
      showTransactionId: true,
      showTaxBreakdown: true,
      showDiscountBreakdown: true,
      showCouponDetails: true,
      showAmountInWords: true,
      showBankDetails: true,
      showTerms: true,
      showSignature: true,
      showStamp: true,
    },
    qrSettings: {
      enabled: true,
      position: 'header_right',
      size: 48,
      alignment: 'right',
      label: 'Scan to verify invoice',
    },
    footerSettings: {
      customFooterText: 'Thank you for choosing MedsSeva Diagnostics for your healthcare needs.',
      termsAndConditions: '1. This is a computer-generated tax invoice and does not require a physical signature.\n2. Lab reports will be delivered within standard turnaround time (24-48 hours).\n3. Any discrepancy must be reported within 48 hours of billing.',
      bankName: 'HDFC Bank Ltd.',
      accountNumber: '50200088192341',
      ifscCode: 'HDFC0001234',
      accountHolder: 'MEDSSEVA GLOBAL HEALTHCARE PVT LTD',
      upiId: 'medsseva@hdfcbank',
      registeredOffice: 'G-130 Basement Office No 01, Sector 63, Noida, Uttar Pradesh - 201301',
    },
  });

  useEffect(() => {
    if (id && id !== 'new') {
      setLoading(true);
      customFormatService.getInvoiceTemplateById(id)
        .then((data) => {
          setTemplate(data);
        })
        .catch(() => {
          toast.error('Error', 'Failed to load invoice template.');
          navigate('/custom-formats/invoices');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', 'Logo file size must be less than 5MB.');
      return;
    }

    setUploadingLogo(true);
    try {
      const res = await customFormatService.uploadLogo(file);
      setTemplate(prev => ({
        ...prev,
        logoUrl: res.url,
      }));
      toast.success('Logo uploaded', 'Invoice lab logo updated.');
    } catch (err: any) {
      toast.error('Upload failed', err.response?.data?.error || 'Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (saveAsNew = false) => {
    if (!template.name || !template.name.trim()) {
      toast.error('Validation Error', 'Please enter a name for this invoice template.');
      return;
    }

    setSaving(true);
    try {
      if (id && id !== 'new' && !saveAsNew) {
        await customFormatService.updateInvoiceTemplate(id, template);
        toast.success('Template Saved', 'Invoice template updated successfully.');
      } else {
        const payload = {
          ...template,
          name: saveAsNew ? `${template.name} (Copy)` : template.name,
        };
        const created = await customFormatService.createInvoiceTemplate(payload);
        toast.success('Template Created', 'New invoice template saved to database.');
        navigate(`/custom-formats/invoices/${created.id}/edit`, { replace: true });
      }
    } catch (err: any) {
      toast.error('Save failed', err.response?.data?.error || 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all modifications to default invoice preset values?')) {
      setTemplate(prev => ({
        ...prev,
        designSettings: {
          primaryColor: prev.type === 'DETAILED' ? '#005C55' : '#0F766E',
          secondaryColor: '#0D9488',
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontSize: 'standard',
          headingSize: 'medium',
          tableStyle: 'striped',
          borderStyle: 'solid',
        },
      }));
      toast.success('Reset Complete', 'Template reset to standard defaults.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Loading invoice template...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border p-3 sm:p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => navigate('/custom-formats/invoices')}
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={template.name || ''}
                onChange={(e) => setTemplate(t => ({ ...t, name: e.target.value }))}
                placeholder="e.g. Standard Clinical Invoice Template"
                className="text-base sm:text-lg font-black text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-0.5 max-w-[180px] sm:max-w-xs"
              />
              <span className={cn(
                "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0",
                template.type === 'DETAILED'
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-teal-50 text-teal-700 border-teal-200"
              )}>
                {template.type} INVOICE
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
              Customize diagnostic invoice layout, taxes, bank details, and branding
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={handleReset}
            className="flex-1 sm:flex-initial justify-center px-3 py-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>

          {id && id !== 'new' && (
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex-1 sm:flex-initial justify-center px-3 py-2 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" /> Save as New
            </button>
          )}

          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex-1 sm:flex-initial justify-center px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black shadow-md shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Template'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-2xl border border-border overflow-x-auto custom-scrollbar">
            {[
              { id: 'branding', label: 'Branding', icon: Building2 },
              { id: 'design', label: 'Theme & Style', icon: Palette },
              { id: 'fields', label: 'Fields', icon: Sliders },
              { id: 'bank', label: 'Bank Info', icon: CreditCard },
              { id: 'qr', label: 'QR Code', icon: QrCode },
              { id: 'footer', label: 'Legal & Terms', icon: FileText },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-card text-foreground shadow-sm border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: BRANDING */}
          {activeTab === 'branding' && (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Invoice Header & Lab Details</span>
              </h3>

              {/* Logo Box */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">Invoice Logo</label>
                <div className="flex items-center gap-4 p-4 border border-border rounded-xl bg-muted/20">
                  <div className="w-24 h-16 bg-white border rounded-lg flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-xs">
                    {template.logoUrl ? (
                      <img src={template.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground text-center">No Logo</span>
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-xs disabled:opacity-60"
                      >
                        {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>{template.logoUrl ? 'Replace' : 'Upload'}</span>
                      </button>
                      {template.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setTemplate(t => ({ ...t, logoUrl: null }))}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Company / Laboratory Name</label>
                <input
                  type="text"
                  value={template.branding?.labName || ''}
                  onChange={(e) => setTemplate(t => ({ ...t, branding: { ...t.branding, labName: e.target.value } }))}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Billing Office Address</label>
                <textarea
                  rows={2}
                  value={template.branding?.address || ''}
                  onChange={(e) => setTemplate(t => ({ ...t, branding: { ...t.branding, address: e.target.value } }))}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={template.branding?.gstin || ''}
                    onChange={(e) => setTemplate(t => ({ ...t, branding: { ...t.branding, gstin: e.target.value } }))}
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={template.branding?.pan || ''}
                    onChange={(e) => setTemplate(t => ({ ...t, branding: { ...t.branding, pan: e.target.value } }))}
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DESIGN & COLORS */}
          {activeTab === 'design' && (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-5">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <span>Invoice Theme & Colors</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {COLOR_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTemplate(t => ({
                      ...t,
                      designSettings: {
                        ...t.designSettings,
                        primaryColor: p.primary,
                        secondaryColor: p.secondary,
                      },
                    }))}
                    className={cn(
                      "p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all",
                      template.designSettings?.primaryColor?.toLowerCase() === p.primary.toLowerCase()
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:bg-muted/40"
                    )}
                  >
                    <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: p.primary }} />
                    <span className="text-xs font-bold text-foreground truncate">{p.name}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={template.designSettings?.primaryColor || '#005C55'}
                      onChange={(e) => setTemplate(t => ({
                        ...t,
                        designSettings: { ...t.designSettings, primaryColor: e.target.value }
                      }))}
                      className="w-9 h-9 rounded-lg border border-border cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={template.designSettings?.primaryColor || '#005C55'}
                      onChange={(e) => setTemplate(t => ({
                        ...t,
                        designSettings: { ...t.designSettings, primaryColor: e.target.value }
                      }))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono border border-border rounded-lg uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FIELDS */}
          {activeTab === 'fields' && (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <span>Invoice Sections & Field Visibility</span>
              </h3>

              <div className="space-y-2.5 pt-2">
                {[
                  { key: 'showPatientDetails', label: 'Patient Information Section', desc: 'Display patient name, ID, contact details' },
                  { key: 'showBillingDetails', label: 'Billing & Transaction Section', desc: 'Display booking code, method, transaction ID' },
                  { key: 'showPaymentMethod', label: 'Payment Method Indicator', desc: 'Show Cash / Online / UPI badge' },
                  { key: 'showTaxBreakdown', label: 'Detailed Tax Breakdown (CGST & SGST)', desc: 'Show itemized GST percentages and values' },
                  { key: 'showDiscountBreakdown', label: 'Discount & Coupon Savings', desc: 'Highlight discounts in bold red indicator' },
                  { key: 'showAmountInWords', label: 'Total Amount in Words', desc: 'Display formatted currency text banner' },
                  { key: 'showBankDetails', label: 'Bank Account & UPI Box', desc: 'Display bank transfer details for payments' },
                  { key: 'showTerms', label: 'Terms & Conditions Clause', desc: 'Display billing policy and jurisdiction terms' },
                  { key: 'showSignature', label: 'Authorized Signatory Line', desc: 'Show digital signature disclaimer block' },
                ].map((f) => {
                  const isChecked = (template.fieldSettings as any)?.[f.key] ?? true;
                  return (
                    <label
                      key={f.key}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                        isChecked ? "bg-primary/5 border-primary/30" : "bg-muted/10 border-border hover:bg-muted/30"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setTemplate(t => ({
                          ...t,
                          fieldSettings: {
                            ...t.fieldSettings,
                            [f.key]: e.target.checked,
                          }
                        }))}
                        className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <div>
                        <div className="text-xs font-bold text-foreground">{f.label}</div>
                        <div className="text-[10px] text-muted-foreground">{f.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: BANK DETAILS */}
          {activeTab === 'bank' && (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Bank Account & UPI Information</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Bank Name</label>
                <input
                  type="text"
                  value={template.footerSettings?.bankName || ''}
                  onChange={(e) => setTemplate(t => ({
                    ...t,
                    footerSettings: { ...t.footerSettings, bankName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background"
                  placeholder="e.g. HDFC Bank Ltd."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Account Number</label>
                <input
                  type="text"
                  value={template.footerSettings?.accountNumber || ''}
                  onChange={(e) => setTemplate(t => ({
                    ...t,
                    footerSettings: { ...t.footerSettings, accountNumber: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background font-mono"
                  placeholder="50200088192341"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={template.footerSettings?.ifscCode || ''}
                    onChange={(e) => setTemplate(t => ({
                      ...t,
                      footerSettings: { ...t.footerSettings, ifscCode: e.target.value }
                    }))}
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background font-mono uppercase"
                    placeholder="HDFC0001234"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">UPI ID / VPA</label>
                  <input
                    type="text"
                    value={template.footerSettings?.upiId || ''}
                    onChange={(e) => setTemplate(t => ({
                      ...t,
                      footerSettings: { ...t.footerSettings, upiId: e.target.value }
                    }))}
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background font-mono"
                    placeholder="medsseva@hdfcbank"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: QR */}
          {activeTab === 'qr' && (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <QrCode className="w-4 h-4 text-primary" />
                <span>Invoice QR Verification</span>
              </h3>

              <label className="flex items-center justify-between p-3.5 border border-border rounded-xl bg-muted/20 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-foreground">Enable Dynamic Invoice QR Code</div>
                  <div className="text-[10px] text-muted-foreground">Points to secure /verify-invoice verification page</div>
                </div>
                <input
                  type="checkbox"
                  checked={template.qrSettings?.enabled ?? true}
                  onChange={(e) => setTemplate(t => ({
                    ...t,
                    qrSettings: { ...t.qrSettings, enabled: e.target.checked }
                  }))}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
              </label>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">QR Label Text</label>
                <input
                  type="text"
                  value={template.qrSettings?.label || ''}
                  onChange={(e) => setTemplate(t => ({
                    ...t,
                    qrSettings: { ...t.qrSettings, label: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background"
                  placeholder="Scan to verify invoice"
                />
              </div>
            </div>
          )}

          {/* TAB 6: FOOTER & TERMS */}
          {activeTab === 'footer' && (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Terms & Platform Branding</span>
              </h3>

              <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-1 border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Protected Platform Requirement
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Every generated invoice includes <strong className="text-white font-extrabold">“Powered by Medsseva”</strong> in the footer.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Terms & Conditions</label>
                <textarea
                  rows={4}
                  value={template.footerSettings?.termsAndConditions || ''}
                  onChange={(e) => setTemplate(t => ({
                    ...t,
                    footerSettings: { ...t.footerSettings, termsAndConditions: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background resize-none"
                />
              </div>

              <div className="pt-2 border-t border-border">
                <label className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.isDefault || false}
                    onChange={(e) => setTemplate(t => ({ ...t, isDefault: e.target.checked }))}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <div>
                    <div className="text-xs font-bold text-foreground">Set as Default {template.type} Invoice Template</div>
                    <div className="text-[10px] text-muted-foreground">Applied to all newly generated invoices</div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live A4 Invoice Preview (7 Cols) */}
        <div className="lg:col-span-7 sticky top-4 space-y-3">
          <div className="flex items-center justify-between bg-card border border-border px-4 py-2.5 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-foreground">Live A4 Invoice Preview</span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoomLevel(z => Math.max(0.4, z - 0.1))}
                className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-bold w-10 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(z => Math.min(1.2, z + 0.1))}
                className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowFullPreview(true)}
                className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground ml-1"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-slate-200/80 rounded-2xl border border-border/80 p-3 sm:p-6 overflow-x-auto max-h-[800px] overflow-y-auto flex justify-center shadow-inner custom-scrollbar">
            <LiveInvoicePreview
              template={template}
              scale={zoomLevel}
            />
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {showFullPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center p-6 overflow-y-auto">
          <div className="w-full max-w-5xl flex items-center justify-between mb-4 text-white">
            <div className="font-bold text-sm">Full Screen Invoice Preview</div>
            <button
              onClick={() => setShowFullPreview(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[90vh] pb-12">
            <LiveInvoicePreview
              template={template}
              scale={1}
            />
          </div>
        </div>
      )}
    </div>
  );
};
