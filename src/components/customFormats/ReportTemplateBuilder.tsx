import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  CustomReportTemplate,
  CustomTemplateType,
  ReportBrandingSettings,
  ReportDesignSettings,
  ReportFieldSettings,
  ReportQRSettings,
  ReportFooterSettings,
} from '../../types/customFormat';
import { customFormatService } from '../../services/customFormat.service';
import { LiveReportPreview } from './LiveReportPreview';
import { useToast } from '../Toast';
import {
  Save,
  RotateCcw,
  Eye,
  Check,
  Upload,
  Trash2,
  Lock,
  Sparkles,
  Layers,
  Palette,
  QrCode,
  Sliders,
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Building2,
  AlertCircle,
  Loader2,
  Copy,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const COLOR_PRESETS = [
  { name: 'MedsSeva Teal', primary: '#006D6F', secondary: '#0A7C7C' },
  { name: 'Dr. Lal Blue', primary: '#0D5C75', secondary: '#1A7A99' },
  { name: 'Clinical Navy', primary: '#0F2A3F', secondary: '#1E4A6D' },
  { name: 'Emerald Diagnostic', primary: '#059669', secondary: '#10B981' },
  { name: 'Royal Indigo', primary: '#4338CA', secondary: '#6366F1' },
  { name: 'Crimson Health', primary: '#B91C1C', secondary: '#EF4444' },
  { name: 'Dark Slate', primary: '#1E293B', secondary: '#475569' },
];

const FONT_PRESETS = [
  { name: 'Modern Sans (Segoe UI / Roboto)', value: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
  { name: 'Clinical Clean (Inter)', value: "'Inter', sans-serif" },
  { name: 'Standard Document (Arial)', value: "Arial, Helvetica, sans-serif" },
  { name: 'Professional Serif (Georgia)', value: "Georgia, 'Times New Roman', serif" },
];

export const ReportTemplateBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const templateTypeParam = (searchParams.get('type') || 'STANDARD').toUpperCase() as CustomTemplateType;
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'design' | 'fields' | 'qr' | 'footer'>('branding');
  const [zoomLevel, setZoomLevel] = useState(0.8);
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [showFullPreview, setShowFullPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template State
  const [template, setTemplate] = useState<Partial<CustomReportTemplate>>({
    name: '',
    type: templateTypeParam,
    logoUrl: '/trusted-partner.jpg',
    isDefault: false,
    isActive: true,
    branding: {
      labName: 'MedsSeva Diagnostic & Research Center',
      branchName: 'Central Reference Laboratory (Apex City)',
      tagline: 'Excellence in Pathology & Advanced Molecular Diagnostics',
      address: 'G-130 Basement Office No 01, Sector 63, Noida, UP - 201301',
      phone: '+91 84480 30936 / +91 98765 43210',
      email: 'reports@medsseva.com',
      website: 'www.medsseva.com',
      registrationNo: 'NABL / ISO-15189:2022 ACCR-8841',
      gstPan: 'GSTIN: 09AATCM6853F1ZU | PAN: AAFCO021L',
      headerAlignment: 'split',
      logoPosition: 'left',
    },
    designSettings: {
      primaryColor: templateTypeParam === 'DETAILED' ? '#0d5c75' : '#006d6f',
      secondaryColor: '#0a7c7c',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      fontSize: 'standard',
      headingSize: 'medium',
      tableStyle: 'striped',
      borderStyle: 'solid',
      borderThickness: 1,
    },
    fieldSettings: {
      showPatientId: true,
      showAgeGender: true,
      showMobile: true,
      showEmail: true,
      showAddress: true,
      showReferredBy: true,
      showSampleId: true,
      showCollectionDate: true,
      showCollectionTime: true,
      showReportDate: true,
      showReportTime: true,
      showBarcode: true,
      showTestCode: true,
      showInterpretation: true,
      showRemarks: true,
      showSignature: true,
      showStamp: true,
      showDoctorDetails: true,
      showTechnicianDetails: true,
      showAbnormalFlags: true,
    },
    qrSettings: {
      enabled: true,
      position: 'header_right',
      size: 48,
      alignment: 'right',
      label: 'Scan to verify',
    },
    footerSettings: {
      customFooterText: 'Clinical diagnostic report certified by accredited pathologist.',
      footerAlignment: 'center',
      showPageNumbers: true,
    },
  });

  // Load existing template if editing
  useEffect(() => {
    if (id && id !== 'new') {
      setLoading(true);
      customFormatService.getReportTemplateById(id)
        .then((data) => {
          setTemplate(data);
        })
        .catch((err) => {
          toast.error('Error', 'Failed to load report template.');
          navigate('/custom-formats/reports');
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
      toast.success('Logo uploaded', 'Lab logo has been updated.');
    } catch (err: any) {
      toast.error('Upload failed', err.response?.data?.error || 'Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (saveAsNew = false) => {
    if (!template.name || !template.name.trim()) {
      toast.error('Validation Error', 'Please enter a name for this template.');
      return;
    }

    setSaving(true);
    try {
      if (id && id !== 'new' && !saveAsNew) {
        await customFormatService.updateReportTemplate(id, template);
        toast.success('Template Saved', 'Report template updated successfully.');
      } else {
        const payload = {
          ...template,
          name: saveAsNew ? `${template.name} (Copy)` : template.name,
        };
        const created = await customFormatService.createReportTemplate(payload);
        toast.success('Template Created', 'New report template saved to database.');
        navigate(`/custom-formats/reports/${created.id}/edit`, { replace: true });
      }
    } catch (err: any) {
      toast.error('Save failed', err.response?.data?.error || 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all modifications to default preset values?')) {
      setTemplate(prev => ({
        ...prev,
        branding: {
          labName: 'MedsSeva Diagnostic & Research Center',
          branchName: 'Central Reference Laboratory (Apex City)',
          tagline: 'Excellence in Pathology & Advanced Molecular Diagnostics',
          address: 'G-130 Basement Office No 01, Sector 63, Noida, UP - 201301',
          phone: '+91 84480 30936 / +91 98765 43210',
          email: 'reports@medsseva.com',
          website: 'www.medsseva.com',
          registrationNo: 'NABL / ISO-15189:2022 ACCR-8841',
          gstPan: 'GSTIN: 09AATCM6853F1ZU | PAN: AAFCO021L',
          headerAlignment: 'split',
          logoPosition: 'left',
        },
        designSettings: {
          primaryColor: prev.type === 'DETAILED' ? '#0d5c75' : '#006d6f',
          secondaryColor: '#0a7c7c',
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontSize: 'standard',
          headingSize: 'medium',
          tableStyle: 'striped',
          borderStyle: 'solid',
          borderThickness: 1,
        },
      }));
      toast.success('Reset Complete', 'Template reset to standard defaults.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Loading report template...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border p-3 sm:p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => navigate('/custom-formats/reports')}
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
                placeholder="e.g. Standard Blue Header Template"
                className="text-base sm:text-lg font-black text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-0.5 max-w-[180px] sm:max-w-xs"
              />
              <span className={cn(
                "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0",
                template.type === 'DETAILED'
                  ? "bg-sky-50 text-sky-700 border-sky-200"
                  : "bg-teal-50 text-teal-700 border-teal-200"
              )}>
                {template.type} REPORT
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
              Live interactive builder • Changes reflect synchronously on A4 preview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={handleReset}
            className="flex-1 sm:flex-initial justify-center px-3 py-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Reset to default settings"
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

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Settings (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Tabs Navigation */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-2xl border border-border overflow-x-auto custom-scrollbar">
            {[
              { id: 'branding', label: 'Branding', icon: Building2 },
              { id: 'design', label: 'Colors & Style', icon: Palette },
              { id: 'fields', label: 'Fields', icon: Sliders },
              { id: 'qr', label: 'QR Verification', icon: QrCode },
              { id: 'footer', label: 'Footer & Legal', icon: FileText },
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
                <span>Laboratory Branding & Identification</span>
              </h3>

              {/* Logo Upload Box */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">Laboratory Logo</label>
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
                        <span>{template.logoUrl ? 'Replace Logo' : 'Upload Logo'}</span>
                      </button>
                      {template.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setTemplate(t => ({ ...t, logoUrl: null }))}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                          title="Remove logo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Recommended: High-res PNG with transparent background (Max 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Lab Name */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Laboratory / Clinic Full Name</label>
                <input
                  type="text"
                  value={template.branding?.labName || ''}
                  onChange={(e) => setTemplate(t => ({ ...t, branding: { ...t.branding, labName: e.target.value } }))}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  placeholder="e.g. Apex Diagnostics & Research Institute"
                />
              </div>

              {/* Branch */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Branch Name / Sub-header</label>
                <input
                  type="text"
                  value={template.branding?.branchName || ''}
                  onChange={(e) => setTemplate(t => ({ ...t, branding: { ...t.branding, branchName: e.target.value } }))}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="e.g. South Extension Branch"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Tagline / Motto</label>
                <input
                  type="text"
                  value={template.branding?.tagline || ''}
                  onChange={(e) => setTemplate(t => ({ ...t, branding: { ...t.branding, tagline: e.target.value } }))}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="e.g. Accuracy in Every Test"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Complete Address</label>
                <textarea
                  rows={2}
                  value={template.branding?.address || ''}
                  onChange={(e) => setTemplate(t => ({ ...t, branding: { ...t.branding, address: e.target.value } }))}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                  placeholder="Enter full lab address..."
                />
              </div>

              {/* Contact & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Phone Number(s)</label>
                  <input
                    type="text"
                    value={template.branding?.phone || ''}
                    onChange={(e) => setTemplate(t => ({ ...t, branding: { ...t.branding, phone: e.target.value } }))}
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="+91 84480 30936"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Email Address</label>
                  <input
                    type="text"
                    value={template.branding?.email || ''}
                    onChange={(e) => setTemplate(t => ({ ...t, branding: { ...t.branding, email: e.target.value } }))}
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="reports@lab.com"
                  />
                </div>
              </div>

              {/* Registration & GST */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">NABL / Lab Reg No</label>
                  <input
                    type="text"
                    value={template.branding?.registrationNo || ''}
                    onChange={(e) => setTemplate(t => ({ ...t, branding: { ...t.branding, registrationNo: e.target.value } }))}
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="NABL-15189 / 2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">GSTIN / PAN</label>
                  <input
                    type="text"
                    value={template.branding?.gstPan || ''}
                    onChange={(e) => setTemplate(t => ({ ...t, branding: { ...t.branding, gstPan: e.target.value } }))}
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="GSTIN: 09AATCM6853F1ZU"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COLORS & STYLE */}
          {activeTab === 'design' && (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-5">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <span>Color Palette & Visual Styling</span>
              </h3>

              {/* Curated Color Themes */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">Curated Diagnostic Color Schemes</label>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_PRESETS.map((preset, idx) => {
                    const isSelected = template.designSettings?.primaryColor?.toLowerCase() === preset.primary.toLowerCase();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTemplate(t => ({
                          ...t,
                          designSettings: {
                            ...t.designSettings,
                            primaryColor: preset.primary,
                            secondaryColor: preset.secondary,
                          },
                        }))}
                        className={cn(
                          "p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all",
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:bg-muted/40"
                        )}
                      >
                        <div className="flex gap-1 shrink-0">
                          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                        </div>
                        <span className="text-xs font-bold text-foreground truncate">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Primary Theme Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={template.designSettings?.primaryColor || '#006d6f'}
                      onChange={(e) => setTemplate(t => ({
                        ...t,
                        designSettings: { ...t.designSettings, primaryColor: e.target.value }
                      }))}
                      className="w-9 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
                    />
                    <input
                      type="text"
                      value={template.designSettings?.primaryColor || '#006d6f'}
                      onChange={(e) => setTemplate(t => ({
                        ...t,
                        designSettings: { ...t.designSettings, primaryColor: e.target.value }
                      }))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono border border-border rounded-lg uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Secondary Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={template.designSettings?.secondaryColor || '#0a7c7c'}
                      onChange={(e) => setTemplate(t => ({
                        ...t,
                        designSettings: { ...t.designSettings, secondaryColor: e.target.value }
                      }))}
                      className="w-9 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
                    />
                    <input
                      type="text"
                      value={template.designSettings?.secondaryColor || '#0a7c7c'}
                      onChange={(e) => setTemplate(t => ({
                        ...t,
                        designSettings: { ...t.designSettings, secondaryColor: e.target.value }
                      }))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono border border-border rounded-lg uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div className="pt-2 border-t border-border">
                <label className="block text-xs font-bold text-foreground mb-2">Typography & Font Family</label>
                <select
                  value={template.designSettings?.fontFamily || FONT_PRESETS[0].value}
                  onChange={(e) => setTemplate(t => ({
                    ...t,
                    designSettings: { ...t.designSettings, fontFamily: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {FONT_PRESETS.map((f, i) => (
                    <option key={i} value={f.value}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Border Thickness */}
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-foreground">Table Border Thickness</label>
                  <span className="text-xs font-mono text-muted-foreground">{template.designSettings?.borderThickness || 1}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.5"
                  value={template.designSettings?.borderThickness || 1}
                  onChange={(e) => setTemplate(t => ({
                    ...t,
                    designSettings: { ...t.designSettings, borderThickness: parseFloat(e.target.value) }
                  }))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          )}

          {/* TAB 3: FIELD SETTINGS */}
          {activeTab === 'fields' && (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <span>Field Visibility & Medical Layout Toggles</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Control which dynamic fields appear on each test page. (Medical result data is loaded dynamically from database).
              </p>

              <div className="space-y-2.5 pt-2">
                {[
                  { key: 'showPatientId', label: 'Patient Unique UHID / ID', desc: 'Display patient ID on the top banner' },
                  { key: 'showAgeGender', label: 'Age & Gender', desc: 'Display calculated age and gender badge' },
                  { key: 'showMobile', label: 'Patient Contact Number', desc: 'Show masked patient phone number' },
                  { key: 'showAddress', label: 'Patient Address', desc: 'Display patient residential address' },
                  { key: 'showReferredBy', label: 'Referred By Doctor', desc: 'Display referring practitioner details' },
                  { key: 'showSampleId', label: 'Sample Barcode / ID', desc: 'Display laboratory sample identification' },
                  { key: 'showCollectionDate', label: 'Sample Collection Timestamp', desc: 'Show when specimen was collected' },
                  { key: 'showReportDate', label: 'Report Release Timestamp', desc: 'Show exact validation date and time' },
                  { key: 'showTestCode', label: 'Investigation Test Code', desc: 'Show internal test codes (e.g. HAEM-001)' },
                  { key: 'showRemarks', label: 'Methodology & Sample Remarks', desc: 'Show test instrument & sample condition notes' },
                  { key: 'showInterpretation', label: 'Clinical Interpretation', desc: 'Show in-depth pathological interpretation box' },
                  { key: 'showAbnormalFlags', label: 'Abnormal High/Low Highlight Badges', desc: 'Highlight out-of-range values in bold color' },
                  { key: 'showDoctorDetails', label: 'Pathologist Signature & Qualifications', desc: 'Show validating doctor digital signature' },
                  { key: 'showTechnicianDetails', label: 'Lab Technologist Verification', desc: 'Show verifying DMLT/BMLT signature' },
                  { key: 'showStamp', label: 'Official Laboratory Stamp / Seal', desc: 'Render circular MedsSeva verification seal' },
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

          {/* TAB 4: QR CODE SETTINGS */}
          {activeTab === 'qr' && (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <QrCode className="w-4 h-4 text-primary" />
                <span>Dynamic QR Verification Settings</span>
              </h3>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-teal-600" />
                  <span>Secure Non-Sensitive QR System</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  The QR code embeds a secure token pointing to <code className="font-mono bg-teal-100 px-1 py-0.5 rounded">/verify-report/:id</code>.
                  No passwords or raw internal credentials are ever placed inside the QR image.
                </p>
              </div>

              {/* QR Toggle */}
              <label className="flex items-center justify-between p-3.5 border border-border rounded-xl bg-muted/20 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-foreground">Enable Dynamic Report QR Code</div>
                  <div className="text-[10px] text-muted-foreground">Appears on every page of the generated PDF</div>
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

              {template.qrSettings?.enabled && (
                <>
                  {/* Position */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">QR Code Placement</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'header_right', label: 'Top Header Right' },
                        { id: 'footer_left', label: 'Bottom Footer Left' },
                        { id: 'footer_right', label: 'Bottom Footer Right' },
                      ].map(pos => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setTemplate(t => ({
                            ...t,
                            qrSettings: { ...t.qrSettings, position: pos.id as any }
                          }))}
                          className={cn(
                            "py-2 px-3 rounded-lg border text-xs font-bold transition-all text-left",
                            template.qrSettings?.position === pos.id
                              ? "bg-primary/5 border-primary text-primary"
                              : "border-border text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-foreground">QR Code Dimensions</label>
                      <span className="text-xs font-mono text-muted-foreground">{template.qrSettings?.size || 48}px</span>
                    </div>
                    <input
                      type="range"
                      min="36"
                      max="72"
                      step="4"
                      value={template.qrSettings?.size || 48}
                      onChange={(e) => setTemplate(t => ({
                        ...t,
                        qrSettings: { ...t.qrSettings, size: parseInt(e.target.value) }
                      }))}
                      className="w-full accent-primary"
                    />
                  </div>

                  {/* QR Label */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">QR Label Text</label>
                    <input
                      type="text"
                      value={template.qrSettings?.label || ''}
                      onChange={(e) => setTemplate(t => ({
                        ...t,
                        qrSettings: { ...t.qrSettings, label: e.target.value }
                      }))}
                      className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder="Scan to verify"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 5: FOOTER & LEGAL */}
          {activeTab === 'footer' && (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Footer & Mandatory Platform Branding</span>
              </h3>

              {/* Mandatory Powered by Medsseva Alert */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-1.5 border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Platform Requirement
                  </span>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded border border-teal-500/30">
                    Mandatory
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every report page includes <strong className="text-white font-extrabold">“Powered by Medsseva”</strong> and dynamic page numbering <strong className="text-white font-mono">“Page X of Y”</strong>. This text is protected and permanently embedded.
                </p>
              </div>

              {/* Custom Footer Notes */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Custom Certification / Disclaimer Note</label>
                <textarea
                  rows={3}
                  value={template.footerSettings?.customFooterText || ''}
                  onChange={(e) => setTemplate(t => ({
                    ...t,
                    footerSettings: { ...t.footerSettings, customFooterText: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                  placeholder="e.g. This report is certified by accredited pathologists. Partial reproduction not allowed."
                />
              </div>

              {/* Set as Default Option */}
              <div className="pt-2 border-t border-border">
                <label className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.isDefault || false}
                    onChange={(e) => setTemplate(t => ({ ...t, isDefault: e.target.checked }))}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <div>
                    <div className="text-xs font-bold text-foreground">Set as Default {template.type} Template</div>
                    <div className="text-[10px] text-muted-foreground">Automatically applied to newly generated {template.type.toLowerCase()} reports</div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live A4 Preview (7 Cols) */}
        <div className="lg:col-span-7 sticky top-4 space-y-3">
          <div className="flex items-center justify-between bg-card border border-border px-4 py-2.5 rounded-2xl shadow-sm">
            {/* Page Navigation for Multi-Test */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Preview Test Page:</span>
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border">
                {[1, 2, 3, 4].map(pg => (
                  <button
                    key={pg}
                    onClick={() => setPreviewPage(pg)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-bold rounded transition-all",
                      previewPage === pg
                        ? "bg-primary text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Test {pg}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoomLevel(z => Math.max(0.4, z - 0.1))}
                className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-bold w-10 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(z => Math.min(1.2, z + 0.1))}
                className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowFullPreview(true)}
                className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground ml-1"
                title="Full Screen Preview"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div className="bg-slate-200/80 rounded-2xl border border-border/80 p-3 sm:p-6 overflow-x-auto max-h-[800px] overflow-y-auto flex justify-center shadow-inner custom-scrollbar">
            <LiveReportPreview
              template={template}
              previewPageNumber={previewPage}
              scale={zoomLevel}
            />
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {showFullPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center p-6 overflow-y-auto">
          <div className="w-full max-w-5xl flex items-center justify-between mb-4 text-white">
            <div className="font-bold text-sm">Full Screen A4 Report Preview (1 Test = 1 Page)</div>
            <button
              onClick={() => setShowFullPreview(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[90vh] pb-12">
            <LiveReportPreview
              template={template}
              scale={1}
            />
          </div>
        </div>
      )}
    </div>
  );
};
