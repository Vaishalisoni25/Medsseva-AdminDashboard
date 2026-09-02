import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customFormatService } from '../services/customFormat.service';
import { CustomReportTemplate, CustomInvoiceTemplate } from '../types/customFormat';
import {
  FileText,
  Receipt,
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Sliders,
  QrCode,
  ShieldCheck,
  Palette,
  LayoutTemplate,
  Loader2,
  Building2,
  Lock,
} from 'lucide-react';
import { cn } from '../utils/cn';

export const CustomFormatPage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [reportTemplates, setReportTemplates] = useState<CustomReportTemplate[]>([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState<CustomInvoiceTemplate[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const [reports, invoices] = await Promise.all([
          customFormatService.getReportTemplates(),
          customFormatService.getInvoiceTemplates(),
        ]);
        setReportTemplates(reports);
        setInvoiceTemplates(invoices);
      } catch (err) {
        console.error('Failed to load custom format counts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const standardReportsCount = reportTemplates.filter(t => t.type === 'STANDARD').length;
  const detailedReportsCount = reportTemplates.filter(t => t.type === 'DETAILED').length;
  const standardInvoicesCount = invoiceTemplates.filter(t => t.type === 'STANDARD').length;
  const detailedInvoicesCount = invoiceTemplates.filter(t => t.type === 'DETAILED').length;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden border border-teal-700/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Format Studio & Template Engine</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Custom Format & Branding Module
          </h1>

          <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
            Personalize your diagnostic lab reports and billing invoices with bespoke logos, custom color palettes, verified QR codes, and multi-test pagination.
          </p>

          <div className="pt-2 flex items-center gap-3 sm:gap-4 text-xs font-bold text-teal-200/80 flex-wrap">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> 1 Test = 1 Page Architecture
            </span>
            <span className="flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-teal-400 shrink-0" /> Dynamic Verification QR Codes
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" /> Real Database Persistence
            </span>
          </div>
        </div>
      </div>

      {/* Main Two Primary Sections / Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* ============================================================ */}
        {/* CARD 1: CUSTOM REPORT */}
        {/* ============================================================ */}
        <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
          <div className="space-y-5 sm:space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600">
                <FileText className="w-6 h-6 sm:w-7 h-7" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-foreground text-xs font-bold border border-border">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : `${reportTemplates.length} Saved Templates`}
              </span>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-black text-foreground group-hover:text-primary transition-colors">
                Custom Diagnostic Reports
              </h2>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Design Standard and Detailed pathological test reports. Configure laboratory letterhead, pathologist signatures, reference intervals, abnormal flags, and individual test page splits.
              </p>
            </div>

            {/* Sub-Types Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40">
                <div className="text-[11px] font-extrabold text-teal-800 dark:text-teal-300 uppercase tracking-wide">
                  Standard Report
                </div>
                <div className="text-lg font-black text-foreground mt-1">
                  {loading ? '...' : `${standardReportsCount} Formats`}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Compact routine layout
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40">
                <div className="text-[11px] font-extrabold text-sky-800 dark:text-sky-300 uppercase tracking-wide">
                  Detailed Report
                </div>
                <div className="text-lg font-black text-foreground mt-1">
                  {loading ? '...' : `${detailedReportsCount} Formats`}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Clinical interpretations
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-2 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                <span>Multi-test pagination: 1 Test = Exactly 1 Page with full header</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                <span>Custom lab logo, contact, and accreditation header</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                <span>QR verification linking to <code className="font-mono text-[10px]">/verify-report/:id</code></span>
              </div>
            </div>
          </div>

          <div className="pt-5 sm:pt-6 border-t border-border mt-5 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <button
              onClick={() => navigate('/custom-formats/reports/new?type=STANDARD')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Report Format
            </button>

            <button
              onClick={() => navigate('/custom-formats/reports')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>View Report Templates</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CARD 2: CUSTOM INVOICE */}
        {/* ============================================================ */}
        <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
          <div className="space-y-5 sm:space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600">
                <Receipt className="w-6 h-6 sm:w-7 h-7" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-foreground text-xs font-bold border border-border">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : `${invoiceTemplates.length} Saved Templates`}
              </span>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-black text-foreground group-hover:text-purple-600 transition-colors">
                Custom Lab Invoices
              </h2>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Create Standard and Detailed lab billing invoices. Configure GST tax rates, HSN/SAC codes, discount breakdowns, bank transfer info, and payment verification QR codes.
              </p>
            </div>

            {/* Sub-Types Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40">
                <div className="text-[11px] font-extrabold text-teal-800 dark:text-teal-300 uppercase tracking-wide">
                  Standard Invoice
                </div>
                <div className="text-lg font-black text-foreground mt-1">
                  {loading ? '...' : `${standardInvoicesCount} Formats`}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Walk-in & quick bill
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                <div className="text-[11px] font-extrabold text-purple-800 dark:text-purple-300 uppercase tracking-wide">
                  Detailed Invoice
                </div>
                <div className="text-lg font-black text-foreground mt-1">
                  {loading ? '...' : `${detailedInvoicesCount} Formats`}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Corporate tax invoice
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-2 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                <span>Automated CGST/SGST and itemized diagnostic pricing breakdown</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                <span>Direct Bank Account, IFSC, and UPI payment details</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                <span>QR verification linking to <code className="font-mono text-[10px]">/verify-invoice/:id</code></span>
              </div>
            </div>
          </div>

          <div className="pt-5 sm:pt-6 border-t border-border mt-5 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <button
              onClick={() => navigate('/custom-formats/invoices/new?type=STANDARD')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Invoice Format
            </button>

            <button
              onClick={() => navigate('/custom-formats/invoices')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black shadow-md shadow-purple-700/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>View Invoice Templates</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
