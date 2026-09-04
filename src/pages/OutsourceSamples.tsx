import React, { useEffect, useState } from 'react';
import {
  Truck, Plus, Search, Filter, RefreshCw, Calendar,
  Building2, CheckCircle2, Clock, FileText, AlertCircle,
  ExternalLink, Trash2, Edit2, X, Check, ArrowRight,
  ShieldCheck, UploadCloud, ChevronRight, User, FlaskConical,
  CreditCard, Loader2, Link2, MapPin, Phone, Mail,
  Printer, Download, Upload, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { outsourceService } from '../services/api';
import { customFormatService } from '../services/customFormat.service';
import { CustomReportTemplate } from '../types/customFormat';
import { LiveReportPreview, SampleTestData } from '../components/customFormats/LiveReportPreview';
import { sanitizeClonedDocForPdf } from '@/utils/exportInvoicePdf';

interface ReferenceLab {
  id: string;
  name: string;
  code: string;
  contactPerson?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface OutsourceSample {
  id: string;
  bookingId?: string | null;
  patientName: string;
  patientAge?: string | null;
  patientGender?: string | null;
  patientMobile?: string | null;
  sampleBarcode: string;
  sampleType: string;
  testNames: string;
  referenceLabId: string;
  dispatchDate: string;
  expectedReportDate?: string | null;
  status: string;
  courierTrackingNo?: string | null;
  courierPartner?: string | null;
  outsourceCost: number;
  paymentStatus: string;
  resultNotes?: string | null;
  reportFileUrl?: string | null;
  reportReceivedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  referenceLab?: ReferenceLab;
}

interface OutsourceSummary {
  totalOutsourced: number;
  pendingCount: number;
  dispatchedCount: number;
  receivedByLabCount: number;
  reportReceivedCount: number;
  completedCount: number;
  totalCost: number;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  PENDING: { label: 'Pending Dispatch', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', icon: Clock },
  DISPATCHED: { label: 'Dispatched to Lab', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', icon: Truck },
  RECEIVED_BY_LAB: { label: 'Received by Lab', bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', icon: FlaskConical },
  REPORT_RECEIVED: { label: 'Report Received', bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800', icon: FileText },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800', icon: AlertCircle },
};

const SAMPLE_VIAL_TYPES = [
  'EDTA Whole Blood (Purple Top)',
  'Serum / SST (Yellow / Red Top)',
  'Fluoride Plasma (Grey Top)',
  'Sodium Citrate (Blue Top)',
  'Sterile Urine Container',
  'Biopsy / Formalin Container',
  'Stool Container',
  'Swab / Viral Transport Media (VTM)',
];

export const OutsourceSamplesPage: React.FC = () => {
  const [activeView, setActiveView] = useState<'SAMPLES' | 'LABS'>('SAMPLES');
  const [samples, setSamples] = useState<OutsourceSample[]>([]);
  const [labs, setLabs] = useState<ReferenceLab[]>([]);
  const [summary, setSummary] = useState<OutsourceSummary>({
    totalOutsourced: 0,
    pendingCount: 0,
    dispatchedCount: 0,
    receivedByLabCount: 0,
    reportReceivedCount: 0,
    completedCount: 0,
    totalCost: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedLabId, setSelectedLabId] = useState('ALL');

  // Outsource Sample Modal State
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [savingSample, setSavingSample] = useState(false);
  const [formPatientName, setFormPatientName] = useState('');
  const [formPatientAge, setFormPatientAge] = useState('');
  const [formPatientGender, setFormPatientGender] = useState('MALE');
  const [formPatientMobile, setFormPatientMobile] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formSampleType, setFormSampleType] = useState(SAMPLE_VIAL_TYPES[0]);
  const [formTestNames, setFormTestNames] = useState('');
  const [formLabId, setFormLabId] = useState('');
  const [formDispatchDate, setFormDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [formExpectedDate, setFormExpectedDate] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formCourierPartner, setFormCourierPartner] = useState('');
  const [formCourierTracking, setFormCourierTracking] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Status & Report Update Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetSample, setTargetSample] = useState<OutsourceSample | null>(null);
  const [newStatus, setNewStatus] = useState<string>('DISPATCHED');
  const [newCourierPartner, setNewCourierPartner] = useState('');
  const [newCourierTracking, setNewCourierTracking] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('UNPAID');
  const [newReportUrl, setNewReportUrl] = useState('');
  const [newResultNotes, setNewResultNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Report PDF Preview State
  const [previewReportSample, setPreviewReportSample] = useState<OutsourceSample | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [customReportTemplates, setCustomReportTemplates] = useState<CustomReportTemplate[]>([]);
  const [selectedCustomTemplateId, setSelectedCustomTemplateId] = useState<string>('');

  // Lab Modal State
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<ReferenceLab | null>(null);
  const [labName, setLabName] = useState('');
  const [labCode, setLabCode] = useState('');
  const [labContact, setLabContact] = useState('');
  const [labPhone, setLabPhone] = useState('');
  const [labEmail, setLabEmail] = useState('');
  const [labAddress, setLabAddress] = useState('');
  const [labCity, setLabCity] = useState('');
  const [savingLab, setSavingLab] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [samplesRes, summaryRes, labsRes, templatesRes] = await Promise.all([
        outsourceService.getOutsourcedSamples({
          search: search || undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          referenceLabId: selectedLabId !== 'ALL' ? selectedLabId : undefined,
        }),
        outsourceService.getOutsourceSummary(),
        outsourceService.getLabs(),
        customFormatService.getReportTemplates().catch(() => []),
      ]);

      if (samplesRes?.samples) setSamples(samplesRes.samples);
      if (summaryRes) setSummary(summaryRes);
      if (labsRes) {
        setLabs(labsRes);
        if (labsRes.length > 0 && !formLabId) setFormLabId(labsRes[0].id);
      }
      if (templatesRes && templatesRes.length > 0) {
        setCustomReportTemplates(templatesRes);
        if (!selectedCustomTemplateId) {
          const def = templatesRes.find((t: any) => t.isDefault) || templatesRes[0];
          if (def) setSelectedCustomTemplateId(def.id);
        }
      }
    } catch (err) {
      console.error('Failed to load outsource data:', err);
      toast.error('Failed to load outsourced samples.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus, selectedLabId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreateSampleModal = () => {
    const randomBarcode = `SMP-OUT-${Math.floor(100000 + Math.random() * 900000)}`;
    setFormPatientName('');
    setFormPatientAge('');
    setFormPatientGender('MALE');
    setFormPatientMobile('');
    setFormBarcode(randomBarcode);
    setFormSampleType(SAMPLE_VIAL_TYPES[0]);
    setFormTestNames('');
    if (labs.length > 0) setFormLabId(labs[0].id);
    setFormDispatchDate(new Date().toISOString().split('T')[0]);
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 3);
    setFormExpectedDate(expDate.toISOString().split('T')[0]);
    setFormCost('');
    setFormCourierPartner('DTDC Express');
    setFormCourierTracking('');
    setFormNotes('');
    setSampleModalOpen(true);
  };

  const handleSaveOutsourceSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientName.trim() || !formBarcode.trim() || !formTestNames.trim() || !formLabId) {
      toast.error('Please enter patient name, barcode, tests, and select reference lab.');
      return;
    }

    setSavingSample(true);
    try {
      await outsourceService.createOutsourceSample({
        patientName: formPatientName.trim(),
        patientAge: formPatientAge ? String(formPatientAge) : undefined,
        patientGender: formPatientGender,
        patientMobile: formPatientMobile.trim() || undefined,
        sampleBarcode: formBarcode.trim(),
        sampleType: formSampleType,
        testNames: formTestNames.trim(),
        referenceLabId: formLabId,
        dispatchDate: formDispatchDate,
        expectedReportDate: formExpectedDate || undefined,
        status: formCourierTracking ? 'DISPATCHED' : 'PENDING',
        courierPartner: formCourierPartner.trim() || undefined,
        courierTrackingNo: formCourierTracking.trim() || undefined,
        outsourceCost: parseFloat(formCost) || 0,
        notes: formNotes.trim() || undefined,
      });

      toast.success('Sample outsourced successfully');
      setSampleModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Failed to outsource sample:', err);
      toast.error(err?.response?.data?.error || 'Failed to outsource sample.');
    } finally {
      setSavingSample(false);
    }
  };

  const openStatusUpdateModal = (sample: OutsourceSample) => {
    setTargetSample(sample);
    setNewStatus(sample.status);
    setNewCourierPartner(sample.courierPartner || '');
    setNewCourierTracking(sample.courierTrackingNo || '');
    setNewCost(sample.outsourceCost ? sample.outsourceCost.toString() : '');
    setNewPaymentStatus(sample.paymentStatus || 'UNPAID');
    setNewReportUrl(sample.reportFileUrl || '');
    setNewResultNotes(sample.resultNotes || '');
    setStatusModalOpen(true);
  };

  const handleSaveStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSample) return;

    setUpdatingStatus(true);
    try {
      await outsourceService.updateSampleStatus(targetSample.id, {
        status: newStatus,
        courierPartner: newCourierPartner.trim() || undefined,
        courierTrackingNo: newCourierTracking.trim() || undefined,
        outsourceCost: parseFloat(newCost) || 0,
        paymentStatus: newPaymentStatus,
        reportFileUrl: newReportUrl.trim() || undefined,
        resultNotes: newResultNotes.trim() || undefined,
      });

      toast.success('Outsource status & report updated successfully');
      setStatusModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Failed to update status:', err);
      toast.error(err?.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openCreateLabModal = () => {
    setEditingLab(null);
    setLabName('');
    setLabCode(`REF-${Math.floor(100 + Math.random() * 900)}`);
    setLabContact('');
    setLabPhone('');
    setLabEmail('');
    setLabAddress('');
    setLabCity('');
    setLabModalOpen(true);
  };

  const openEditLabModal = (lab: ReferenceLab) => {
    setEditingLab(lab);
    setLabName(lab.name);
    setLabCode(lab.code);
    setLabContact(lab.contactPerson || '');
    setLabPhone(lab.phone);
    setLabEmail(lab.email || '');
    setLabAddress(lab.address || '');
    setLabCity(lab.city || '');
    setLabModalOpen(true);
  };

  const handleSaveLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labName.trim() || !labCode.trim() || !labPhone.trim()) {
      toast.error('Please enter Lab Name, Code, and Phone.');
      return;
    }

    setSavingLab(true);
    try {
      const payload = {
        name: labName.trim(),
        code: labCode.trim(),
        contactPerson: labContact.trim() || undefined,
        phone: labPhone.trim(),
        email: labEmail.trim() || undefined,
        address: labAddress.trim() || undefined,
        city: labCity.trim() || undefined,
      };

      if (editingLab) {
        await outsourceService.updateLab(editingLab.id, payload);
        toast.success('Reference lab updated successfully');
      } else {
        await outsourceService.createLab(payload);
        toast.success('Reference lab added successfully');
      }

      setLabModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Failed to save lab:', err);
      toast.error(err?.response?.data?.error || 'Failed to save reference lab.');
    } finally {
      setSavingLab(false);
    }
  };

  const handleDownloadOutsourcePdf = async (sample: OutsourceSample) => {
    setDownloadingPdf(true);
    try {
      const [html2canvas, jsPDFModule] = await Promise.all([
        import('html2canvas').then(m => m.default),
        import('jspdf').then(m => m.default),
      ]);

      const el = document.getElementById('pdf-outsource-export-document') || document.getElementById('outsource-report-sheet');
      if (!el) throw new Error('Outsource report document not found.');

      const pageElements = Array.from(el.querySelectorAll('.a4-page-sheet'));
      const targets = pageElements.length > 0 ? pageElements : [el];

      const pdf = new jsPDFModule({ orientation: 'portrait', unit: 'px', format: [794, 1123] });

      for (let i = 0; i < targets.length; i++) {
        const pageEl = targets[i] as HTMLElement;
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 794,
          windowHeight: 1123,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc) => {
            sanitizeClonedDocForPdf(clonedDoc);

            const overrideStyle = clonedDoc.createElement('style');
            overrideStyle.innerHTML = `
              *, *::before, *::after {
                --primary: #006d6f !important;
                --secondary: #0a7c7c !important;
                --background: #ffffff !important;
                --foreground: #0f172a !important;
                --muted: #f1f5f9 !important;
                --muted-foreground: #64748b !important;
                --border: #e2e8f0 !important;
                --card: #ffffff !important;
                --card-foreground: #0f172a !important;
                letter-spacing: normal !important;
                word-spacing: normal !important;
                font-kerning: normal !important;
                transform: none !important;
                zoom: 1 !important;
                -webkit-font-smoothing: antialiased !important;
                text-rendering: geometricPrecision !important;
              }
              .a4-page-sheet {
                width: 794px !important;
                min-height: 1123px !important;
                transform: none !important;
                margin: 0 !important;
                box-sizing: border-box !important;
              }
            `;
            clonedDoc.head.appendChild(overrideStyle);
          },
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage([794, 1123], 'portrait');
        pdf.addImage(imgData, 'JPEG', 0, 0, 794, 1123);
      }

      const pName = sample.patientName?.replace(/\s+/g, '_') || 'Patient';
      pdf.save(`MedsSeva_Outsource_Report_${pName}_${sample.sampleBarcode}.pdf`);
      toast.success('Outsource report PDF downloaded successfully.');
    } catch (err: any) {
      console.error('Outsource PDF error:', err);
      toast.error('Failed to generate PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getOutsourceReportData = (sample: OutsourceSample) => {
    const activeTemplate = customReportTemplates.find(t => t.id === selectedCustomTemplateId) || customReportTemplates[0] || {};
    
    // Merge template with reference lab information
    const mergedTemplate: Partial<CustomReportTemplate> = {
      ...activeTemplate,
      labDetails: {
        name: sample.referenceLab?.name || activeTemplate.labDetails?.name || 'Medsseva Diagnostics & Research Center',
        tagline: activeTemplate.labDetails?.tagline || 'External Reference Laboratory Diagnostic Network',
        address: sample.referenceLab?.address ? `${sample.referenceLab.address}, ${sample.referenceLab.city}` : activeTemplate.labDetails?.address || 'Plot 44, Industrial Area, Noida, Uttar Pradesh',
        phone: sample.referenceLab?.phone || activeTemplate.labDetails?.phone || '+91 8448009366',
        email: sample.referenceLab?.email || activeTemplate.labDetails?.email || 'reports@medsseva.com',
        branch: sample.referenceLab?.name ? `External Ref Lab: ${sample.referenceLab.name}` : activeTemplate.labDetails?.branch || 'Central Reference Lab',
        regNo: sample.referenceLab?.code ? `Lab Code: ${sample.referenceLab.code}` : activeTemplate.labDetails?.regNo || 'REG-MED-2026',
        logoUrl: activeTemplate.labDetails?.logoUrl || '',
        gstPan: activeTemplate.labDetails?.gstPan || '',
      },
    };

    const patientData = {
      patientName: sample.patientName,
      patientAge: sample.patientAge || '30',
      patientGender: sample.patientGender || 'Male',
      patientMobile: sample.patientMobile || '',
      patientAddress: sample.referenceLab?.city || 'N/A',
      sampleId: sample.sampleBarcode,
      bookingCode: sample.bookingId?.slice(0, 8) || sample.sampleBarcode,
      collectionDate: new Date(sample.dispatchDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      reportDate: sample.expectedReportDate
        ? new Date(sample.expectedReportDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      refDoctor: sample.referenceLab?.name || 'External Reference Lab',
    };

    const tests: SampleTestData[] = sample.testNames.split(',').map((tName, idx) => {
      const cleanName = tName.trim();
      const isHemat = sample.sampleType?.toLowerCase().includes('blood') || cleanName.toLowerCase().includes('cbc');
      const isUrine = sample.sampleType?.toLowerCase().includes('urine') || cleanName.toLowerCase().includes('urine');
      const isBio = cleanName.toLowerCase().includes('sugar') || cleanName.toLowerCase().includes('lipid') || cleanName.toLowerCase().includes('lft') || cleanName.toLowerCase().includes('kft');

      let category = 'CLINICAL PATHOLOGY & SPECIAL INVESTIGATIONS';
      if (isHemat) category = 'DEPARTMENT OF HAEMATOLOGY';
      else if (isUrine) category = 'CLINICAL PATHOLOGY & URINALYSIS';
      else if (isBio) category = 'CLINICAL BIOCHEMISTRY & IMMUNOASSAY';

      return {
        testName: cleanName,
        testCode: `${sample.sampleBarcode}-${idx + 1}`,
        category,
        parameters: [
          {
            name: `${cleanName} (Quantitative Assay / Investigation)`,
            value: sample.status === 'REPORT_RECEIVED' || sample.status === 'COMPLETED' ? 'Documented & Certified' : 'Under Processing',
            unit: 'Ref Lab Standard',
            referenceRange: 'Accredited Lab Standard Interval',
            isAbnormal: false,
            flag: 'NORMAL' as const,
          },
        ],
        remarks: sample.resultNotes || 'Sample accessioned and processed at accredited external reference laboratory.',
        interpretation: sample.resultNotes
          ? `External Reference Laboratory Clinical Findings / Impression:\n${sample.resultNotes}`
          : 'Clinical correlation recommended. Outsource report certified under Medsseva Diagnostic Network protocol.',
      };
    });

    return { mergedTemplate, patientData, tests };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-600" /> Outsource Sample Management
          </h1>
          <p className="text-xs text-muted-foreground">Dispatch rare/specialized tests to external reference laboratories, track transit stages & attach lab reports.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border text-xs font-bold">
            <button
              onClick={() => setActiveView('SAMPLES')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'SAMPLES' ? 'bg-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Outsourced Samples
            </button>
            <button
              onClick={() => setActiveView('LABS')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'LABS' ? 'bg-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Reference Labs ({labs.length})
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {activeView === 'SAMPLES' ? (
            <button
              onClick={openCreateSampleModal}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Outsource New Sample
            </button>
          ) : (
            <button
              onClick={openCreateLabModal}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Reference Lab
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: OUTSOURCED SAMPLES TRACKER */}
      {activeView === 'SAMPLES' ? (
        <div className="space-y-6">
          {/* 5 PIPELINE STAGE KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-amber-600 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-foreground font-mono">{summary.pendingCount}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Awaiting Dispatch</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-blue-600 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">In Transit</span>
                <Truck className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-blue-600 font-mono">{summary.dispatchedCount}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Courier Dispatched</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-purple-600 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Received by Lab</span>
                <FlaskConical className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-purple-600 font-mono">{summary.receivedByLabCount}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Under Investigation</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-teal-600 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Report Received</span>
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-teal-600 font-mono">{summary.reportReceivedCount}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Report Attached</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-emerald-600 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-emerald-600 font-mono">{summary.completedCount}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Delivered to Patient</div>
            </div>
          </div>

          {/* SEARCH & FILTERS */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by patient, barcode, test, courier..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-xs outline-none focus:border-teal-500"
                />
              </div>

              <select
                value={selectedLabId}
                onChange={(e) => setSelectedLabId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-foreground outline-none focus:border-teal-500"
              >
                <option value="ALL">All Reference Labs</option>
                {labs.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                ))}
              </select>
            </div>

            {/* Pipeline Stage Buttons */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border text-xs font-bold overflow-x-auto">
              {['ALL', 'PENDING', 'DISPATCHED', 'RECEIVED_BY_LAB', 'REPORT_RECEIVED', 'COMPLETED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                    selectedStatus === st
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st === 'ALL' ? 'All' : STATUS_CONFIG[st]?.label || st}
                </button>
              ))}
            </div>
          </div>

          {/* SAMPLES TABLE */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Patient & Barcode</th>
                    <th className="py-3.5 px-4 font-bold">Outsourced Tests</th>
                    <th className="py-3.5 px-4 font-bold">Reference Lab</th>
                    <th className="py-3.5 px-4 font-bold">Dispatch & ETA</th>
                    <th className="py-3.5 px-4 font-bold text-center">Status</th>
                    <th className="py-3.5 px-4 font-bold">Courier / Attached Report</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-teal-600" /> Loading outsourced samples...
                      </td>
                    </tr>
                  ) : samples.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground space-y-2">
                        <Truck className="w-8 h-8 mx-auto text-muted-foreground/40" />
                        <div>No outsourced samples found matching your criteria.</div>
                      </td>
                    </tr>
                  ) : (
                    samples.map((s) => {
                      const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.PENDING;
                      const StatusIcon = cfg.icon;
                      return (
                        <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-foreground">{s.patientName}</div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5">
                              <span className="text-teal-600 font-bold">{s.sampleBarcode}</span>
                              <span>•</span>
                              <span>{s.sampleType}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-foreground max-w-xs">{s.testNames}</div>
                            {s.resultNotes && (
                              <div className="text-[10px] text-muted-foreground italic truncate max-w-xs mt-0.5">
                                Notes: {s.resultNotes}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-foreground">{s.referenceLab?.name || 'External Lab'}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              Code: {s.referenceLab?.code || 'REF'} {s.referenceLab?.city ? `(${s.referenceLab.city})` : ''}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-[11px]">
                            <div className="text-foreground">
                              Dispatched: <strong>{new Date(s.dispatchDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</strong>
                            </div>
                            {s.expectedReportDate && (
                              <div className="text-[10px] text-muted-foreground">
                                Expected: {new Date(s.expectedReportDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                              <StatusIcon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => setPreviewReportSample(s)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 text-teal-700 dark:text-teal-300 font-bold hover:bg-teal-100 transition-colors text-xs cursor-pointer shadow-sm"
                            >
                              <FileText className="w-3.5 h-3.5 text-teal-600" /> View Report PDF
                            </button>
                            {s.courierTrackingNo && !s.reportFileUrl && (
                              <div className="text-[10px] font-mono text-muted-foreground mt-1">
                                {s.courierPartner}: <strong className="text-foreground">{s.courierTrackingNo}</strong>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openStatusUpdateModal(s)}
                                className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-teal-700 dark:text-teal-300 border border-teal-200 text-xs font-bold transition-colors cursor-pointer"
                              >
                                Update Status
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: REFERENCE LABS DIRECTORY */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {labs.map((lab) => (
              <div key={lab.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-teal-600 uppercase tracking-wider font-mono">
                      {lab.code}
                    </div>
                    <h3 className="font-bold text-sm text-foreground mt-0.5">{lab.name}</h3>
                    {lab.city && <div className="text-xs text-muted-foreground">{lab.city}</div>}
                  </div>
                  <button
                    onClick={() => openEditLabModal(lab)}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground"
                    title="Edit Lab"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
                  {lab.contactPerson && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-teal-600" />
                      <span>{lab.contactPerson}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    <span>{lab.phone}</span>
                  </div>
                  {lab.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-teal-600" />
                      <span className="font-mono">{lab.email}</span>
                    </div>
                  )}
                  {lab.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span className="truncate">{lab.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OUTSOURCE NEW SAMPLE MODAL */}
      {sampleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-600" />
                Dispatch Sample to Reference Lab
              </h2>
              <button onClick={() => setSampleModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOutsourceSample} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Patient Full Name *</label>
                  <input
                    type="text"
                    value={formPatientName}
                    onChange={(e) => setFormPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar Verma"
                    required
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Age</label>
                    <input
                      type="text"
                      value={formPatientAge}
                      onChange={(e) => setFormPatientAge(e.target.value)}
                      placeholder="e.g. 45"
                      className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gender</label>
                    <select
                      value={formPatientGender}
                      onChange={(e) => setFormPatientGender(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground outline-none focus:border-teal-500"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sample Barcode *</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-mono font-bold text-teal-600 outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sample / Vial Type</label>
                  <select
                    value={formSampleType}
                    onChange={(e) => setFormSampleType(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground outline-none focus:border-teal-500"
                  >
                    {SAMPLE_VIAL_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Investigated Tests / Panel *</label>
                <input
                  type="text"
                  value={formTestNames}
                  onChange={(e) => setFormTestNames(e.target.value)}
                  placeholder="e.g. Histopathology Large Biopsy, Karyotyping, LC-MS Steroid Panel"
                  required
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Destination Reference Lab *</label>
                <select
                  value={formLabId}
                  onChange={(e) => setFormLabId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground outline-none focus:border-teal-500"
                >
                  {labs.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.code}) — {l.city || 'Central Lab'}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dispatch Date</label>
                  <input
                    type="date"
                    value={formDispatchDate}
                    onChange={(e) => setFormDispatchDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expected Report Date</label>
                  <input
                    type="date"
                    value={formExpectedDate}
                    onChange={(e) => setFormExpectedDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Courier / Logistics Partner</label>
                  <input
                    type="text"
                    value={formCourierPartner}
                    onChange={(e) => setFormCourierPartner(e.target.value)}
                    placeholder="e.g. DTDC, Blue Dart, Lab Runner"
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Courier Tracking AWB No</label>
                  <input
                    type="text"
                    value={formCourierTracking}
                    onChange={(e) => setFormCourierTracking(e.target.value)}
                    placeholder="e.g. D99812443"
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-mono text-foreground outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Outsource Lab Cost (₹)</label>
                <input
                  type="number"
                  value={formCost}
                  onChange={(e) => setFormCost(e.target.value)}
                  placeholder="e.g. 1800"
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-mono text-foreground outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSampleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSample}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-md shadow-teal-600/20"
                >
                  {savingSample ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Outsource Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS & ATTACH REPORT MODAL */}
      {statusModalOpen && targetSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground">Update Status & Attach Report</h2>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Sample: <strong className="text-teal-600 font-mono">{targetSample.sampleBarcode}</strong> ({targetSample.patientName})
                </div>
              </div>
              <button onClick={() => setStatusModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatusUpdate} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Pipeline Stage *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground outline-none focus:border-teal-500"
                >
                  {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
                    <option key={k} value={k}>{cfg.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Courier Partner</label>
                  <input
                    type="text"
                    value={newCourierPartner}
                    onChange={(e) => setNewCourierPartner(e.target.value)}
                    placeholder="e.g. DTDC, Blue Dart"
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tracking / AWB Number</label>
                  <input
                    type="text"
                    value={newCourierTracking}
                    onChange={(e) => setNewCourierTracking(e.target.value)}
                    placeholder="e.g. 98214432"
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-mono text-foreground outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">External Lab Report PDF (Upload File or Enter URL)</label>
                <div className="space-y-2">
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={newReportUrl?.startsWith('data:') ? 'Attached Local PDF / Image File' : newReportUrl}
                      onChange={(e) => {
                        setNewReportUrl(e.target.value);
                        if (e.target.value && newStatus === 'PENDING') {
                          setNewStatus('REPORT_RECEIVED');
                        }
                      }}
                      placeholder="https://res.cloudinary.com/.../report.pdf"
                      className="w-full pl-9 pr-3.5 py-2 bg-background border border-input rounded-xl text-xs font-mono text-foreground outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-bold border border-border transition-colors">
                      <Upload className="w-3.5 h-3.5 text-teal-600" /> Choose PDF / Image File
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (reader.result) {
                                setNewReportUrl(reader.result as string);
                                if (newStatus === 'PENDING' || newStatus === 'DISPATCHED') {
                                  setNewStatus('REPORT_RECEIVED');
                                }
                                toast.success('Report file attached successfully.');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {newReportUrl && (
                      <span className="text-[11px] text-teal-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> File Ready
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Clinical Result Findings / Notes</label>
                <textarea
                  rows={3}
                  value={newResultNotes}
                  onChange={(e) => setNewResultNotes(e.target.value)}
                  placeholder="Summary of external lab findings, impression, or pathologist remarks..."
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-md shadow-teal-600/20"
                >
                  {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT REFERENCE LAB MODAL */}
      {labModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                {editingLab ? 'Edit Reference Laboratory' : 'Add External Reference Lab'}
              </h2>
              <button onClick={() => setLabModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLab} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Laboratory Name *</label>
                  <input
                    type="text"
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    placeholder="e.g. SRL Diagnostics Central Lab"
                    required
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lab Code *</label>
                  <input
                    type="text"
                    value={labCode}
                    onChange={(e) => setLabCode(e.target.value)}
                    placeholder="e.g. REF-SRL"
                    required
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-mono font-bold text-teal-600 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact Person</label>
                  <input
                    type="text"
                    value={labContact}
                    onChange={(e) => setLabContact(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number *</label>
                  <input
                    type="text"
                    value={labPhone}
                    onChange={(e) => setLabPhone(e.target.value)}
                    placeholder="e.g. +91 98200 11223"
                    required
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-mono text-foreground outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={labEmail}
                    onChange={(e) => setLabEmail(e.target.value)}
                    placeholder="e.g. referrals@srl.in"
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    value={labCity}
                    onChange={(e) => setLabCity(e.target.value)}
                    placeholder="e.g. Mumbai, Delhi"
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Facility Address</label>
                <textarea
                  rows={2}
                  value={labAddress}
                  onChange={(e) => setLabAddress(e.target.value)}
                  placeholder="e.g. Plot 44, Industrial Area, Goregaon West"
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setLabModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLab}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-md shadow-teal-600/20"
                >
                  {savingLab ? <Loader2 className="w-4 h-4 animate-spin" /> : editingLab ? 'Update Reference Lab' : 'Save Reference Lab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OUTSOURCE REPORT PREVIEW / PDF MODAL */}
      {previewReportSample && (() => {
        const { mergedTemplate, patientData, tests } = getOutsourceReportData(previewReportSample);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto">
              {/* Modal Header Toolbar */}
              <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-border bg-slate-900 text-white shrink-0 gap-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                      Outsource Diagnostic Report Viewer
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                        {previewReportSample.sampleBarcode}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-300">
                      Patient: <strong>{previewReportSample.patientName}</strong> • Lab: <strong>{previewReportSample.referenceLab?.name || 'Reference Laboratory'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  {/* Template Switcher */}
                  {customReportTemplates.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <select
                        value={selectedCustomTemplateId}
                        onChange={(e) => setSelectedCustomTemplateId(e.target.value)}
                        className="bg-transparent text-xs font-bold text-teal-300 outline-none cursor-pointer max-w-[210px] truncate"
                      >
                        {customReportTemplates.map(t => (
                          <option key={t.id} value={t.id} className="text-slate-900 bg-white">
                            {t.name} ({t.type}){t.isDefault ? ' ★' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    disabled={downloadingPdf}
                    onClick={() => handleDownloadOutsourcePdf(previewReportSample)}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {downloadingPdf ? 'Generating...' : 'Download PDF'}
                  </button>

                  {previewReportSample.reportFileUrl && (
                    <a
                      href={previewReportSample.reportFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Attached PDF
                    </a>
                  )}

                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>

                  <button
                    onClick={() => setPreviewReportSample(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body / Scrollable A4 Custom Format Report Sheet */}
              <div className="overflow-x-auto overflow-y-auto p-2 sm:p-6 bg-slate-950/60 flex justify-center items-start max-h-[85vh] custom-scrollbar">
                <div id="outsource-report-sheet" className="shadow-2xl rounded-xl bg-white border border-slate-200">
                  <LiveReportPreview
                    template={mergedTemplate}
                    patientData={patientData}
                    tests={tests}
                    scale={typeof window !== 'undefined' && window.innerWidth < 640 ? 0.45 : 0.82}
                  />
                </div>
              </div>

              {/* Dedicated Unscaled Offscreen Container for PDF Export */}
              <div
                style={{
                  position: 'fixed',
                  left: '-99999px',
                  top: 0,
                  width: '794px',
                  pointerEvents: 'none',
                  zIndex: -9999,
                  opacity: 0,
                }}
              >
                <div id="pdf-outsource-export-document">
                  <LiveReportPreview
                    template={mergedTemplate}
                    patientData={patientData}
                    tests={tests}
                    scale={1}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default OutsourceSamplesPage;
