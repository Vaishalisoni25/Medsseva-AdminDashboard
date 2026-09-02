import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomReportTemplate, CustomTemplateType } from '../types/customFormat';
import { customFormatService } from '../services/customFormat.service';
import { LiveReportPreview } from '../components/customFormats/LiveReportPreview';
import { useToast } from '../components/Toast';
import {
  FileText,
  Plus,
  Eye,
  Edit3,
  Copy,
  Trash2,
  CheckCircle2,
  Star,
  ChevronRight,
  Loader2,
  X,
  AlertTriangle,
  Building2,
  Calendar,
  Sparkles,
  Search,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { cn } from '../utils/cn';

export const CustomReportTemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [templates, setTemplates] = useState<CustomReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<CustomReportTemplate | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(typeof window !== 'undefined' && window.innerWidth < 640 ? 0.45 : 0.88);
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState<CustomReportTemplate | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleOpenPreview = (t: CustomReportTemplate) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    setPreviewZoom(isMobile ? 0.45 : 0.88);
    setPreviewTemplate(t);
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await customFormatService.getReportTemplates();
      setTemplates(data);
    } catch (err: any) {
      toast.error('Error', err.response?.data?.error || 'Failed to load report templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSetDefault = async (t: CustomReportTemplate) => {
    setActionLoading(t.id);
    try {
      await customFormatService.setDefaultReportTemplate(t.id);
      toast.success('Default Updated', `“${t.name}” is now the default ${t.type.toLowerCase()} report template.`);
      await fetchTemplates();
    } catch (err: any) {
      toast.error('Action Failed', err.response?.data?.error || 'Could not set as default.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (t: CustomReportTemplate) => {
    setActionLoading(t.id);
    try {
      const copy = await customFormatService.duplicateReportTemplate(t.id);
      toast.success('Template Duplicated', `Created “${copy.name}”.`);
      await fetchTemplates();
    } catch (err: any) {
      toast.error('Action Failed', err.response?.data?.error || 'Could not duplicate template.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (t: CustomReportTemplate) => {
    setActionLoading(t.id);
    try {
      await customFormatService.toggleActiveReportTemplate(t.id);
      toast.success('Status Updated', `Template is now ${!t.isActive ? 'Active' : 'Inactive'}.`);
      await fetchTemplates();
    } catch (err: any) {
      toast.error('Action Failed', err.response?.data?.error || 'Could not update status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmTemplate) return;
    setActionLoading(deleteConfirmTemplate.id);
    try {
      await customFormatService.deleteReportTemplate(deleteConfirmTemplate.id);
      toast.success('Template Deleted', 'Report template removed.');
      setDeleteConfirmTemplate(null);
      await fetchTemplates();
    } catch (err: any) {
      toast.error('Delete Failed', err.response?.data?.error || 'Could not delete template.');
    } finally {
      setActionLoading(null);
    }
  };

  const standardTemplates = templates.filter(t => t.type === 'STANDARD' && (
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.branding?.labName || '').toLowerCase().includes(searchQuery.toLowerCase())
  ));

  const detailedTemplates = templates.filter(t => t.type === 'DETAILED' && (
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.branding?.labName || '').toLowerCase().includes(searchQuery.toLowerCase())
  ));

  const renderTemplateCard = (t: CustomReportTemplate) => {
    const isBusy = actionLoading === t.id;
    const primaryColor = t.designSettings?.primaryColor || (t.type === 'DETAILED' ? '#0d5c75' : '#006d6f');

    return (
      <div
        key={t.id}
        className={cn(
          "bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group",
          t.isDefault ? "border-primary/60 ring-1 ring-primary/20 bg-primary/[0.02]" : "border-border"
        )}
      >
        {/* Top Header & Badges */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: primaryColor }}
              />
              <h4 className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {t.name}
              </h4>
            </div>

            {t.isDefault && (
              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Default
              </span>
            )}
          </div>

          {/* Meta Info */}
          <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{t.branding?.labName || 'MedsSeva Central Lab'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <span>Updated: {new Date(t.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Mini Preview Box */}
          <div
            onClick={() => handleOpenPreview(t)}
            className="w-full h-24 bg-slate-50 border border-slate-200/80 rounded-xl mb-4 flex flex-col items-center justify-center p-3 cursor-pointer group-hover:border-primary/40 transition-colors overflow-hidden relative"
          >
            <div
              className="w-full h-1.5 rounded-full mb-1.5"
              style={{ backgroundColor: primaryColor }}
            />
            <div className="w-3/4 h-1 bg-slate-200 rounded mb-1" />
            <div className="w-1/2 h-1 bg-slate-200 rounded mb-2" />
            <div className="w-full grid grid-cols-3 gap-1">
              <div className="h-4 bg-slate-100 border border-slate-200 rounded" />
              <div className="h-4 bg-slate-100 border border-slate-200 rounded" />
              <div className="h-4 bg-slate-100 border border-slate-200 rounded" />
            </div>

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-colors">
              <span className="opacity-0 group-hover:opacity-100 bg-white/90 shadow-md text-foreground text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-opacity">
                <Eye className="w-3 h-3 text-primary" /> Live Preview
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-border/80 flex items-center justify-between gap-2">
          {/* Active Switch */}
          <button
            onClick={() => handleToggleActive(t)}
            disabled={isBusy || t.isDefault}
            className={cn(
              "text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all",
              t.isActive
                ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                : "text-muted-foreground bg-muted hover:bg-muted/80 border border-border"
            )}
            title={t.isDefault ? "Default template is always active" : "Toggle active status"}
          >
            ● {t.isActive ? 'Active' : 'Inactive'}
          </button>

          <div className="flex items-center gap-1">
            {!t.isDefault && (
              <button
                onClick={() => handleSetDefault(t)}
                disabled={isBusy}
                className="p-1.5 rounded-lg border border-border hover:border-amber-400 hover:bg-amber-50 text-muted-foreground hover:text-amber-600 transition-colors"
                title="Set as Default Template"
              >
                <Star className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => handleDuplicate(t)}
              disabled={isBusy}
              className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Duplicate Template"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => navigate(`/custom-formats/reports/${t.id}/edit`)}
              className="px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1 transition-colors"
              title="Edit in Template Builder"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>

            <button
              onClick={() => setDeleteConfirmTemplate(t)}
              disabled={isBusy}
              className="p-1.5 rounded-lg border border-border hover:border-rose-300 hover:bg-rose-50 text-muted-foreground hover:text-rose-600 transition-colors"
              title="Delete Template"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Top Banner & Search */}
      <div className="bg-card border border-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/custom-formats')}
              className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                <span>Custom Diagnostic Report Templates</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage Standard and Detailed medical report formats • Real database persistence & dynamic test pagination
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground">Loading report templates from database...</p>
        </div>
      ) : (
        <div className="space-y-8 sm:space-y-10">
          {/* ============================================================ */}
          {/* 1. STANDARD REPORT SECTION */}
          {/* ============================================================ */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" />
                  <h2 className="text-base sm:text-lg font-black text-foreground uppercase tracking-wide">Standard Report</h2>
                  <span className="text-xs bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded-md border border-border">
                    {standardTemplates.length} Saved
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Clean, compact laboratory format optimized for routine diagnostic test panels
                </p>
              </div>

              <button
                onClick={() => navigate('/custom-formats/reports/new?type=STANDARD')}
                className="w-full sm:w-auto justify-center px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-primary/10 transition-all active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" /> Add New Standard Template
              </button>
            </div>

            {standardTemplates.length === 0 ? (
              <div className="p-6 sm:p-8 border border-dashed border-border rounded-2xl text-center bg-muted/10 space-y-3">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">No Standard Report Templates Found</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Create your first standard report template with custom branding</p>
                </div>
                <button
                  onClick={() => navigate('/custom-formats/reports/new?type=STANDARD')}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Create Standard Template
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {standardTemplates.map(renderTemplateCard)}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* 2. DETAILED REPORT SECTION */}
          {/* ============================================================ */}
          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0" />
                  <h2 className="text-base sm:text-lg font-black text-foreground uppercase tracking-wide">Detailed Report</h2>
                  <span className="text-xs bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded-md border border-border">
                    {detailedTemplates.length} Saved
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Information-rich layout featuring detailed clinical interpretations, patient address, and doctor remarks
                </p>
              </div>

              <button
                onClick={() => navigate('/custom-formats/reports/new?type=DETAILED')}
                className="w-full sm:w-auto justify-center px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-sky-700/10 transition-all active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" /> Add New Detailed Template
              </button>
            </div>

            {detailedTemplates.length === 0 ? (
              <div className="p-6 sm:p-8 border border-dashed border-border rounded-2xl text-center bg-muted/10 space-y-3">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">No Detailed Report Templates Found</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Create your first detailed report template with advanced clinical sections</p>
                </div>
                <button
                  onClick={() => navigate('/custom-formats/reports/new?type=DETAILED')}
                  className="px-4 py-2 rounded-xl bg-sky-700 text-white text-xs font-bold hover:bg-sky-800 inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Create Detailed Template
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {detailedTemplates.map(renderTemplateCard)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">Confirm Template Deletion</h3>
                <p className="text-xs text-muted-foreground">This action will delete the template record from the database.</p>
              </div>
            </div>

            <div className="p-3.5 bg-muted/30 border border-border rounded-xl text-xs space-y-1">
              <div><strong>Template Name:</strong> {deleteConfirmTemplate.name}</div>
              <div><strong>Type:</strong> {deleteConfirmTemplate.type} Report</div>
              {deleteConfirmTemplate.isDefault && (
                <div className="text-amber-600 font-bold mt-1">
                  ⚠️ This template is currently marked as default. Deleting it will reassign the default to another active template.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmTemplate(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === deleteConfirmTemplate.id}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                {actionLoading === deleteConfirmTemplate.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Template</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center p-2 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-5xl flex items-center justify-between mb-3 text-white gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-xs sm:text-sm truncate">Previewing: {previewTemplate.name}</span>
              <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-0.5 rounded font-mono uppercase shrink-0">{previewTemplate.type}</span>
            </div>

            {/* Zoom Controls & Close */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setPreviewZoom(z => Math.max(0.3, Number((z - 0.1).toFixed(2))))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewZoom(typeof window !== 'undefined' && window.innerWidth < 640 ? 0.45 : 0.88)}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] font-bold"
                title="Fit to Screen"
              >
                {Math.round(previewZoom * 100)}%
              </button>
              <button
                onClick={() => setPreviewZoom(z => Math.min(1.2, Number((z + 0.1).toFixed(2))))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white ml-1"
                title="Close Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[85vh] pb-12 w-full flex justify-center custom-scrollbar">
            <LiveReportPreview
              template={previewTemplate}
              scale={previewZoom}
            />
          </div>
        </div>
      )}
    </div>
  );
};
