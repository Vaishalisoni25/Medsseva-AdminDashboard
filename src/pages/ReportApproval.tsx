import React, { useState, useRef, useCallback } from 'react';
import { useReportsQuery, useBookingsForReportQuery } from '@/hooks/useAdminQueries';
import ReactDOM from 'react-dom';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import {
  fetchAllReports,
  fetchBookingsForReport,
  finalizeReportThunk,
  sendReportThunk,
  savePdfUrlThunk,
} from '../redux/slices/reportSlice';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Printer,
  CheckSquare,
  ChevronRight,
  Clock,
  FileText,
  X,
  Send,
  Users,
  FlaskConical,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { ReportPDFDocument, DoctorDetails } from '../components/ReportPDFDocument';
import { useToast } from '../components/Toast';

export const ReportApprovalPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { reports, bookingsForReport, loading } = useAppSelector(state => state.reports);

  const [selectedReport, setSelectedReport] = useState<any>(null);
 const [generatingPDF, setGeneratingPDF] = useState(false);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [portalReport, setPortalReport] = useState<any>(null);
  const [portalBranch, setPortalBranch] = useState<any>(null);
  const [portalDoctor, setPortalDoctor] = useState<DoctorDetails | undefined>(undefined);

const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showResendConfirm, setShowResendConfirm] = useState(false);
  const [sendRecipientType, setSendRecipientType] = useState<'USER' | 'PARTNER'>('USER');
  const [sendSearch, setSendSearch] = useState('');
  const toast = useToast();
  const [finalizing, setFinalizing] = useState(false);
  const [sending, setSending] = useState(false);

useReportsQuery();
  useBookingsForReportQuery();

const buildBranchAndDoctor = useCallback(() => {
    const rb = selectedReport?.reportBranch || null;
    const branch = rb ? {
      ...rb,
      name: rb.name || '',
      line1: rb.line1 || rb.address || '',
      city: rb.city || '',
      state: rb.state || '',
      pincode: rb.pincode || '',
      contactNumber: rb.contactNumber || rb.phone || '',
      email: rb.email || '',
      labRegNo: rb.labRegNo || '',
    } : null;
    const doctor: DoctorDetails | undefined = selectedReport?.doctorName
      ? {
          name: selectedReport.doctorName,
          qualification: selectedReport.doctorQualification || '',
          regNo: selectedReport.doctorRegNo || '',
          designation: selectedReport.doctorDesignation || '',
          verifiedAt: selectedReport.doctorVerifiedAt || new Date().toISOString(),
        }
      : undefined;
    return { branch, doctor };
  }, [selectedReport]);

  const generateAndUploadPDF = useCallback(async (reportData: any): Promise<{ pdfUrl: string; pdfPublicId: string } | null> => {
    const { branch, doctor } = buildBranchAndDoctor();
    setPortalReport({ ...reportData, status: 'RELEASED' });
    setPortalBranch(branch);
    setPortalDoctor(doctor);

    await new Promise(r => setTimeout(r, 800));

    try {
      const [html2canvas, jsPDFModule] = await Promise.all([
        import('html2canvas').then(m => m.default),
        import('jspdf').then(m => m.default),
      ]);

      const el = document.getElementById('clinical-report-document');
      if (!el) throw new Error('Report element not found');

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const A4_W_PX = 794;
      const A4_H_PX = 1123;
      const SCALE = A4_W_PX / canvas.width;
      const contentHeightPx = canvas.height * SCALE;
      const totalPages = Math.ceil(contentHeightPx / A4_H_PX);
      const pageH = totalPages === 1 ? contentHeightPx : A4_H_PX;
      const pdf = new jsPDFModule({ orientation: 'portrait', unit: 'px', format: [A4_W_PX, pageH] });

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage([A4_W_PX, pageH], 'portrait');
        pdf.addImage(imgData, 'JPEG', 0, -(page * pageH), A4_W_PX, contentHeightPx);
      }

      const pdfBlob = pdf.output('blob');

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      const patientName = reportData.booking?.patientName?.replace(/\s+/g, '_') || 'Report';
      const bookingCode = reportData.booking?.bookingCode || reportData.id.slice(0, 8);
      const fileName = `MedsSeva_Report_${patientName}_${bookingCode}_${Date.now()}`;

      const formData = new FormData();
      formData.append('file', pdfBlob, `${fileName}.pdf`);
      formData.append('upload_preset', uploadPreset);
      formData.append('public_id', fileName);
      formData.append('resource_type', 'raw');

 const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
        { method: 'POST', body: formData }
      );

      if (!uploadRes.ok) throw new Error('Cloudinary upload failed');

     const uploadData = await uploadRes.json();
      return { pdfUrl: uploadData.secure_url, pdfPublicId: uploadData.public_id };
    } finally {
      setPortalReport(null);
      setPortalBranch(null);
      setPortalDoctor(undefined);
    }
  }, [selectedReport, buildBranchAndDoctor]);

  const handlePrintPDF = useCallback(async () => {
    if (!selectedReport) return;

    if (selectedReport.pdfUrl) {
      const link = document.createElement('a');
   link.href = selectedReport.pdfUrl;
      link.download = `MedsSeva_Report_${selectedReport.booking?.patientName?.replace(/\s+/g, '_') || 'Report'}_${selectedReport.booking?.bookingCode || ''}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Downloading PDF', 'The finalized report is being downloaded.');
      return;
    }

    setGeneratingPDF(true);
    try {
      const result = await generateAndUploadPDF(selectedReport);
      if (!result) throw new Error('Upload failed');

      const updated = await dispatch(savePdfUrlThunk({
        id: selectedReport.id,
        pdfUrl: result.pdfUrl,
        pdfPublicId: result.pdfPublicId,
      })).unwrap();

      setSelectedReport(updated);
      await dispatch(fetchAllReports());

    const link = document.createElement('a');
      link.href = result.pdfUrl;
      link.download = `MedsSeva_Report_${selectedReport.booking?.patientName?.replace(/\s+/g, '_') || 'Report'}_${selectedReport.booking?.bookingCode || ''}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('PDF downloaded', 'Report has been saved to your downloads folder.');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('PDF failed', 'Could not generate the PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  }, [selectedReport, generateAndUploadPDF, dispatch]);
  const draftReports = reports.filter((r: any) => r.status === 'DRAFT' || r.status === 'UNDER_REVIEW');
  const approvedReports = reports.filter((r: any) => r.status === 'APPROVED' || r.status === 'RELEASED');

const handleFinalize = async () => {
    if (!selectedReport) return;
    setFinalizing(true);
    try {
      const finalized = await dispatch(finalizeReportThunk(selectedReport.id)).unwrap();
      setSelectedReport(finalized);
      setShowFinalizeConfirm(false);
      await dispatch(fetchAllReports());
      toast.success('Report finalized', 'Generating and uploading the official PDF...');

      setUploadingPDF(true);
      try {
        const result = await generateAndUploadPDF(finalized);
        if (!result) throw new Error('Upload failed');
        const updated = await dispatch(savePdfUrlThunk({
          id: finalized.id,
          pdfUrl: result.pdfUrl,
          pdfPublicId: result.pdfPublicId,
        })).unwrap();
        setSelectedReport(updated);
        await dispatch(fetchAllReports());
        toast.success('PDF ready', 'The official report PDF has been uploaded and is ready to send.');
      } catch {
        toast.error('PDF upload failed', 'Report is finalized but PDF upload failed. Try downloading to retry.');
      } finally {
        setUploadingPDF(false);
      }
    } catch (e: any) {
      toast.error('Finalize failed', typeof e === 'string' ? e : 'Failed to finalize the report.');
    } finally {
      setFinalizing(false);
    }
  };
 const handleSend = async (recipientId: string) => {
    if (!selectedReport) return;
    setSending(true);
    try {
      let reportToSend = selectedReport;

      if (!reportToSend.pdfUrl) {
        toast.success('Generating PDF', 'No PDF found, generating now before sending...');
        try {
          const result = await generateAndUploadPDF(reportToSend);
          if (!result) throw new Error('PDF generation failed');
          const updated = await dispatch(savePdfUrlThunk({
            id: reportToSend.id,
            pdfUrl: result.pdfUrl,
            pdfPublicId: result.pdfPublicId,
          })).unwrap();
          reportToSend = updated;
          setSelectedReport(updated);
          await dispatch(fetchAllReports());
        } catch {
          toast.error('PDF failed', 'Could not generate PDF. Please use Generate & Download first, then try sending again.');
          setSending(false);
          return;
        }
      }

      const result = await dispatch(sendReportThunk({
        id: reportToSend.id,
        recipientType: sendRecipientType,
        recipientId,
      })).unwrap();
      setSelectedReport(result);
      setShowSendModal(false);
      await dispatch(fetchAllReports());
      toast.success('Report sent', 'The report has been delivered to the recipient.');
    } catch (e: any) {
      toast.error('Send failed', typeof e === 'string' ? e : 'Failed to send the report.');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      DRAFT: { label: 'Draft', className: 'bg-slate-100 text-slate-600 border-slate-200' },
      UNDER_REVIEW: { label: 'Under Review', className: 'bg-amber-50 text-amber-700 border-amber-100' },
      APPROVED: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
      RELEASED: { label: 'Released', className: 'bg-blue-50 text-blue-700 border-blue-100' },
    };
    const s = map[status] || { label: status, className: 'bg-muted text-muted-foreground' };
    return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border uppercase", s.className)}>{s.label}</span>;
  };

  const selectedBooking = selectedReport
    ? bookingsForReport.find((b: any) => b.id === selectedReport.bookingId)
    : null;

  const users = selectedBooking
    ? [{ id: selectedBooking.userId, name: selectedBooking.patientName, mobile: selectedBooking.patientMobile || selectedBooking.user?.mobile }]
    : [];

  const partners = selectedBooking?.assignedPartnerId
    ? [{
        id: selectedBooking.assignedPartnerId,
        name: selectedBooking.assignedPartner?.user?.name,
        labName: selectedBooking.assignedPartner?.labName,
        mobile: selectedBooking.assignedPartner?.user?.mobile,
      }]
    : [];

  const sendList = (sendRecipientType === 'USER' ? users : partners).filter((item: any) => {
    const q = sendSearch.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.mobile?.includes(q) ||
      item.labName?.toLowerCase().includes(q)
    );
  });

  const uniqueSendList = Array.from(new Map(sendList.map((i: any) => [i.id, i])).values());

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Report Approval</h1>
          <p className="text-sm text-muted-foreground">Review draft reports, finalize them, and send to patients or partners.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-xs tracking-wider uppercase text-amber-600 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Pending ({draftReports.length})
            </h3>
           <div className="space-y-2">
              {loading ? (
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-full p-4 border border-border rounded-xl bg-card animate-pulse flex justify-between items-center">
                      <div className="space-y-2 flex-1">
                        <div className="h-3.5 bg-muted rounded w-32" />
                        <div className="h-2.5 bg-muted rounded w-20" />
                        <div className="h-4 bg-muted rounded w-16 mt-2" />
                      </div>
                      <div className="h-4 w-4 bg-muted rounded" />
                    </div>
                  ))}
                </>
              ) : draftReports.map((report: any) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={cn(
                    "w-full text-left p-4 border rounded-xl shadow-sm bg-card transition-all hover:border-primary flex justify-between items-center",
                    selectedReport?.id === report.id ? "ring-2 ring-primary border-primary" : "border-border"
                  )}
                >
                  <div>
                    <div className="font-bold text-sm text-foreground">{report.booking?.patientName}</div>
                    <div className="text-xs font-mono text-muted-foreground mt-0.5">{report.booking?.bookingCode}</div>
                    <div className="mt-2">{getStatusBadge(report.status)}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
              {!loading && draftReports.length === 0 && (
                <div className="bg-muted/40 border border-dashed border-border rounded-xl p-6 text-center text-xs text-muted-foreground">
                  No pending reports.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="font-bold text-xs tracking-wider uppercase text-emerald-600 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Finalized ({approvedReports.length})
            </h3>
            <div className="space-y-2">
              {approvedReports.map((report: any) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={cn(
                    "w-full text-left p-3 border rounded-xl bg-muted/30 border-border transition-all hover:bg-card hover:border-primary/50 flex justify-between items-center",
                    selectedReport?.id === report.id ? "ring-2 ring-primary border-primary" : ""
                  )}
                >
                  <div>
                    <div className="font-bold text-xs text-foreground">{report.booking?.patientName}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{report.booking?.bookingCode}</div>
                  </div>
                  {getStatusBadge(report.status)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedReport ? (
              <motion.div
                key={selectedReport.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-4 bg-muted/50 border-b border-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm text-foreground">Report Preview</span>
                    {getStatusBadge(selectedReport.status)}
                  </div>
                  <div className="flex items-center gap-2">
                  <button
                      onClick={handlePrintPDF}
                      disabled={generatingPDF || uploadingPDF}
                      className="px-2.5 py-1.5 border border-border hover:bg-background rounded text-[11px] font-bold flex items-center gap-1 bg-card shadow-sm disabled:opacity-60"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      {generatingPDF ? 'Generating...' : uploadingPDF ? 'Uploading PDF...' : selectedReport?.pdfUrl ? 'Download PDF' : 'Generate & Download'}
                    </button>
                    {(selectedReport.status === 'DRAFT' || selectedReport.status === 'UNDER_REVIEW') && (
                      <button
                        onClick={() => setShowFinalizeConfirm(true)}
                        className="px-3 py-1.5 bg-primary text-white hover:bg-primary/90 rounded text-[11px] font-bold flex items-center gap-1 shadow-sm"
                      >
                        <CheckSquare className="h-3.5 w-3.5" /> Finalize Report
                      </button>
                    )}
               {selectedReport.status === 'APPROVED' && (
                      <button
                        onClick={() => setShowSendModal(true)}
                        disabled={sending}
                        className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded text-[11px] font-bold flex items-center gap-1 shadow-sm disabled:opacity-60"
                      >
                        <Send className="h-3.5 w-3.5" /> {sending ? 'Publishing Report...' : 'Send Report'}
                      </button>
                    )}
                    {selectedReport.status === 'RELEASED' && (
                      <button
                        onClick={() => setShowResendConfirm(true)}
                        className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 px-2 py-1 rounded transition-colors"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />Sent to Recipient
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto bg-white text-slate-900">
                  <div className="grid grid-cols-2 gap-4 border border-slate-200 p-4 text-xs bg-slate-50 rounded-lg">
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><span className="text-slate-500">Patient:</span><span className="font-bold">{selectedReport.booking?.patientName}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Age:</span><span className="font-bold">{selectedReport.booking?.patientAge ? `${selectedReport.booking.patientAge} yrs` : '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Gender:</span><span className="font-bold">{selectedReport.booking?.patientGender || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Mobile:</span><span className="font-bold">{selectedReport.booking?.patientMobile || '-'}</span></div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><span className="text-slate-500">Booking Code:</span><span className="font-mono font-bold">{selectedReport.booking?.bookingCode}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Report Date:</span><span className="font-bold">{new Date(selectedReport.reportedDate).toLocaleDateString('en-IN')}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Branch:</span><span className="font-bold">{selectedReport.reportBranch?.name || selectedReport.booking?.branch?.name || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Collection:</span><span className="font-bold">{selectedReport.booking?.collectionMode || '-'}</span></div>
                    </div>
                  </div>

                  {selectedReport.doctorName && (
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-xs space-y-1">
                      <div className="font-bold text-slate-700 uppercase mb-2">Verifier Details</div>
                      <div className="flex justify-between"><span className="text-slate-500">Doctor:</span><span className="font-bold">{selectedReport.doctorName}</span></div>
                      {selectedReport.doctorQualification && <div className="flex justify-between"><span className="text-slate-500">Qualification:</span><span className="font-bold">{selectedReport.doctorQualification}</span></div>}
                      {selectedReport.doctorRegNo && <div className="flex justify-between"><span className="text-slate-500">Reg. No.:</span><span className="font-bold">{selectedReport.doctorRegNo}</span></div>}
                      {selectedReport.doctorDesignation && <div className="flex justify-between"><span className="text-slate-500">Designation:</span><span className="font-bold">{selectedReport.doctorDesignation}</span></div>}
                      {selectedReport.doctorVerifiedAt && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Verified At:</span>
                          <span className="font-bold">{new Date(selectedReport.doctorVerifiedAt).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedReport.hasAbnormalFlags && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-bold">
                      <AlertTriangle className="h-4 w-4" /> This report contains abnormal values. Review carefully before finalizing.
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="text-xs font-extrabold bg-slate-100 px-3 py-2 tracking-wider uppercase text-slate-700 border-l-4 border-primary">
                      {selectedReport.testName}
                    </div>
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] text-slate-500 uppercase font-bold">
                          <th className="py-2 w-1/2">Parameter</th>
                          <th className="py-2 text-center">Result</th>
                          <th className="py-2 text-center">Reference</th>
                          <th className="py-2 text-center">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(selectedReport.parameters || []).map((p: any) => (
                          <tr key={p.id}>
                            <td className="py-2.5 font-semibold text-slate-800">{p.parameterName}</td>
                            <td className="py-2.5 text-center">
                              <span className={cn(
                                "font-bold px-2 py-0.5 rounded",
                                p.isAbnormal ? "bg-amber-100 text-amber-800" : "text-slate-900"
                              )}>
                                {p.observedValue}
                              </span>
                            </td>
                            <td className="py-2.5 text-center font-mono text-slate-500">{p.referenceRange || '-'}</td>
                            <td className="py-2.5 text-center text-slate-500">{p.unit || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedReport.clinicalNotes && (
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-[11px]">
                      <div className="font-bold text-slate-700 mb-1 uppercase">Clinical Notes</div>
                      <p className="text-slate-600 italic leading-relaxed">{selectedReport.clinicalNotes}</p>
                    </div>
                  )}

                  {selectedReport.auditLogs?.length > 0 && (
                    <div className="border border-slate-200 rounded-lg p-4 text-[11px]">
                      <div className="font-bold text-slate-700 mb-2 uppercase">Audit Trail</div>
                      <div className="space-y-1.5">
                        {selectedReport.auditLogs.map((log: any) => (
                          <div key={log.id} className="flex items-start gap-2 text-slate-600">
                            <span className="text-slate-400 font-mono shrink-0">{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                            <span className="font-bold text-slate-700">{log.action}</span>
                            {log.details && <span className="text-slate-500">- {log.details}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedReport.verifiedBy && (
                    <div className="border-t border-slate-200 pt-4 text-xs text-right">
                      <div className="font-bold text-slate-700">Verified by: {selectedReport.verifiedBy.name}</div>
                      {selectedReport.verifiedAt && (
                        <div className="text-slate-500">{new Date(selectedReport.verifiedAt).toLocaleString('en-IN')}</div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
        ) : loading ? (
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="p-4 bg-muted/50 border-b border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-28" />
                    <div className="h-4 bg-muted rounded-full w-16" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-7 bg-muted rounded w-28" />
                    <div className="h-7 bg-muted rounded w-28" />
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4 border border-slate-200 p-4 bg-slate-50 rounded-lg">
                    {[1, 2].map(col => (
                      <div key={col} className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="flex justify-between gap-4">
                            <div className="h-3 bg-muted rounded w-16" />
                            <div className="h-3 bg-muted rounded w-24" />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="h-8 bg-muted rounded w-full" />
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          {[1, 2, 3, 4].map(i => (
                            <th key={i} className="py-2">
                              <div className="h-2.5 bg-muted rounded w-16 mx-auto" />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[1, 2, 3, 4, 5].map(i => (
                          <tr key={i}>
                            <td className="py-2.5"><div className="h-3 bg-muted rounded w-32" /></td>
                            <td className="py-2.5 text-center"><div className="h-3 bg-muted rounded w-12 mx-auto" /></td>
                            <td className="py-2.5 text-center"><div className="h-3 bg-muted rounded w-16 mx-auto" /></td>
                            <td className="py-2.5 text-center"><div className="h-3 bg-muted rounded w-10 mx-auto" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-dashed border-border rounded-2xl h-[450px] flex flex-col items-center justify-center text-center p-8 shadow-inner">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Select a report to review</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Choose a report from the left panel to review parameters, finalize, and send to the patient or partner.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showFinalizeConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-50" onClick={() => setShowFinalizeConfirm(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border border-border rounded-2xl z-[60] shadow-2xl p-6"
            >
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" /> Finalize Report
                </h3>
                <button onClick={() => setShowFinalizeConfirm(false)} className="p-1 hover:bg-muted rounded-lg"><X className="h-4 w-4" /></button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                This will lock the report and mark it as <span className="font-bold text-foreground">Approved</span>. No further edits will be allowed. You can then send it to the patient or partner.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowFinalizeConfirm(false)} className="px-4 py-2 rounded text-xs font-bold border border-border">Cancel</button>
                <button
                  onClick={handleFinalize}
                  disabled={finalizing}
                  className="px-6 py-2 rounded text-xs font-black bg-primary text-white hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-60"
                >
                  <CheckSquare className="h-4 w-4" /> {finalizing ? 'Finalizing...' : 'Confirm & Finalize'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSendModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-50" onClick={() => setShowSendModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background border border-border rounded-2xl z-[60] shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-foreground flex items-center gap-2"><Send className="h-4 w-4 text-primary" /> Send Report</h3>
                <button onClick={() => setShowSendModal(false)} className="p-1 hover:bg-muted rounded-lg"><X className="h-4 w-4" /></button>
              </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm text-foreground">Send to Patient</span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={sendSearch}
                  onChange={e => setSendSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-input rounded-lg outline-none focus:border-primary bg-card"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2">
                {uniqueSendList.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">No recipients found</div>
                ) : uniqueSendList.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => handleSend(item.id)}
                    disabled={sending}
                    className="w-full text-left p-3 border border-border rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all disabled:opacity-60"
                  >
                    <div className="font-bold text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.labName || item.mobile}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

     <AnimatePresence>
        {showResendConfirm && selectedReport && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-50" onClick={() => setShowResendConfirm(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border border-border rounded-2xl z-[60] shadow-2xl p-6"
            >
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" /> Send Report Again?
                </h3>
                <button onClick={() => setShowResendConfirm(false)} className="p-1 hover:bg-muted rounded-lg"><X className="h-4 w-4" /></button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                This report has already been published for the patient. Do you want to publish it again?
              </p>
              <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-2 text-xs mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patient Name</span>
                  <span className="font-bold text-foreground">{selectedReport.booking?.patientName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mobile Number</span>
                  <span className="font-bold text-foreground">{selectedReport.booking?.patientMobile || selectedReport.booking?.user?.mobile || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking Code</span>
                  <span className="font-mono font-bold text-foreground">{selectedReport.booking?.bookingCode || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Report Date</span>
                  <span className="font-bold text-foreground">{new Date(selectedReport.reportedDate).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Published</span>
                  <span className="font-bold text-foreground">
                    {selectedReport.auditLogs?.slice().reverse().find((l: any) => l.action === 'REPORT_SENT')
                      ? new Date(selectedReport.auditLogs.slice().reverse().find((l: any) => l.action === 'REPORT_SENT').createdAt).toLocaleString('en-IN')
                      : '-'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowResendConfirm(false)} className="px-4 py-2 rounded text-xs font-bold border border-border hover:bg-muted">Cancel</button>
                <button
                  onClick={async () => {
                    setShowResendConfirm(false);
                    const recipientId = selectedReport.recipientId || selectedReport.booking?.userId;
                    const recipientType = selectedReport.recipientType || 'USER';
                    if (!recipientId) { toast.error('Error', 'Recipient not found.'); return; }
                    setSending(true);
                    try {
                      const result = await dispatch(sendReportThunk({ id: selectedReport.id, recipientType, recipientId })).unwrap();
                      setSelectedReport(result);
                      await dispatch(fetchAllReports());
                      toast.success('Report published', 'The report has been published successfully.');
                    } catch (e: any) {
                      toast.error('Send failed', typeof e === 'string' ? e : 'Failed to publish the report.');
                    } finally {
                      setSending(false);
                    }
                  }}
                  disabled={sending}
                  className="px-6 py-2 rounded text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" /> {sending ? 'Publishing...' : 'Send Again'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {portalReport && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: '-9999px', width: '794px', zIndex: -9999, backgroundColor: '#ffffff', pointerEvents: 'none' }}>
          <ReportPDFDocument report={portalReport} branch={portalBranch} doctor={portalDoctor} />
        </div>,
        document.body
      )}
    </div>
  );
};