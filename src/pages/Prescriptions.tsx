import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  ExternalLink,
  FileText,
  FileImage,
  ChevronDown,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const API_BASE = import.meta.env.VITE_API_URL;

type PrescriptionStatus = 'PENDING' | 'UNDER_REVIEW' | 'REVIEWED' | 'COMPLETED';

interface PrescriptionUser {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  uhid?: string;
}

interface Prescription {
  id: string;
  originalFileName: string;
  fileUrl: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  notes?: string;
  status: PrescriptionStatus;
  bookingId?: string;
  createdAt: string;
  user: PrescriptionUser;
}

const STATUS_CONFIG: Record<PrescriptionStatus, { label: string; className: string; icon: React.ReactNode }> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Clock className="w-3 h-3" />,
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <AlertCircle className="w-3 h-3" />,
  },
  REVIEWED: {
    label: 'Reviewed',
    className: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: <ClipboardCheck className="w-3 h-3" />,
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) {
    return <FileImage className="w-4 h-4 text-teal-600" />;
  }
  return <FileText className="w-4 h-4 text-red-500" />;
}

interface PreviewModalProps {
  prescription: Prescription;
  onClose: () => void;
}

function PreviewModal({ prescription, onClose }: PreviewModalProps) {
  const isImage = prescription.mimeType.startsWith('image/');
  const isPdf = prescription.mimeType === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-border/50">
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <FileTypeIcon mimeType={prescription.mimeType} />
            <div>
              <p className="text-sm font-semibold text-foreground truncate max-w-xs">{prescription.originalFileName}</p>
              <p className="text-xs text-muted-foreground">{prescription.user.name} &bull; {formatFileSize(prescription.fileSize)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          {isImage && (
            <img
              src={prescription.fileUrl}
              alt={prescription.originalFileName}
              className="w-full h-auto max-h-[60vh] object-contain rounded-xl border border-border/40"
            />
          )}
          {isPdf && (
            <iframe
              src={prescription.fileUrl}
              title={prescription.originalFileName}
              className="w-full h-[60vh] rounded-xl border border-border/40"
            />
          )}
          {!isImage && !isPdf && (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
        <a>
              <FileText className="w-16 h-16 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
              
                href={prescription.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              
                <Download className="w-4 h-4" />
                Download File
              </a>
            </div>
          )}
        </div>
        {prescription.notes && (
          <div className="p-5 border-t border-border/50 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-foreground">{prescription.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PrescriptionStatus | 'ALL'>('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [previewItem, setPreviewItem] = useState<Prescription | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

const getAuthHeader = () => {
    const token = localStorage.getItem('medsseva_token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      params.set('sort', sortOrder);
      const res = await fetch(`${API_BASE}/prescriptions?${params.toString()}`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error('Failed to fetch prescriptions.');
      const json = await res.json();
      setPrescriptions(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(fetchPrescriptions, 300);
    return () => clearTimeout(timer);
  }, [fetchPrescriptions]);

  const handleStatusChange = async (id: string, newStatus: PrescriptionStatus) => {
    setUpdatingStatusId(id);
    try {
      const res = await fetch(`${API_BASE}/prescriptions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status.');
      setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    } catch {
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this prescription? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/prescriptions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error('Failed to delete.');
      setPrescriptions(prev => prev.filter(p => p.id !== id));
    } catch {
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prescription Uploads</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and manage patient-uploaded prescriptions</p>
        </div>
        <button
          onClick={fetchPrescriptions}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 hover:bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['ALL', 'PENDING', 'UNDER_REVIEW', 'REVIEWED', 'COMPLETED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold border transition-all',
              statusFilter === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground'
            )}
          >
            {s === 'ALL' ? 'All' : STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by patient name, mobile, UHID or booking ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/60 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <select
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
          className="px-4 py-2.5 rounded-xl border border-border/60 bg-card text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all cursor-pointer"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                {['Patient', 'Contact', 'Booking ID', 'Upload Date', 'File', 'Notes', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-muted rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-muted-foreground text-sm">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    No prescriptions found.
                  </td>
                </tr>
              ) : (
                prescriptions.map(p => {
                  const statusCfg = STATUS_CONFIG[p.status];
                  return (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-foreground">{p.user.name}</p>
                          {p.user.uhid && <p className="text-xs text-muted-foreground mt-0.5">UHID: {p.user.uhid}</p>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-foreground">{p.user.mobile}</p>
                        {p.user.email && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[160px]">{p.user.email}</p>}
                      </td>
                      <td className="px-5 py-4">
                        {p.bookingId ? (
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded-md text-foreground">{p.bookingId.slice(0, 8)}...</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <FileTypeIcon mimeType={p.mimeType} />
                          <div>
                            <p className="text-xs font-medium text-foreground truncate max-w-[120px]">{p.originalFileName}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(p.fileSize)} &bull; {p.fileType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-[160px]">
                        {p.notes ? (
                          <p className="text-xs text-muted-foreground truncate" title={p.notes}>{p.notes}</p>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="relative">
                          <select
                            value={p.status}
                            onChange={e => handleStatusChange(p.id, e.target.value as PrescriptionStatus)}
                            disabled={updatingStatusId === p.id}
                            className={cn(
                              'appearance-none pl-7 pr-7 py-1.5 rounded-full border text-xs font-semibold cursor-pointer focus:outline-none transition-all',
                              statusCfg.className,
                              updatingStatusId === p.id && 'opacity-60 cursor-not-allowed'
                            )}
                          >
                            {(Object.keys(STATUS_CONFIG) as PrescriptionStatus[]).map(s => (
                              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                            ))}
                          </select>
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            {statusCfg.icon}
                          </span>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewItem(p)}
                            title="Preview"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={p.fileUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Download"
                            className="p-1.5 rounded-lg hover:bg-teal-50 text-teal-600 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <a
                            href={p.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open in Cloudinary"
                            className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-600 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deletingId === p.id}
                            title="Delete"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {previewItem && (
        <PreviewModal prescription={previewItem} onClose={() => setPreviewItem(null)} />
      )}
    </div>
  );
}   