import React from 'react';
import { StandardReportTemplate, DummyQRCode, DummyBarcode, TemplateProps } from './reportTemplates/StandardReportTemplate';
import { DetailedReportTemplate } from './reportTemplates/DetailedReportTemplate';

export { DummyQRCode, DummyBarcode };

// Evaluate Flag and Range based on patient observed value and reference range logic
function getFlag(p: any): { flag: string; isAbnormal: boolean; color: string } {
  if (!p.observedValue || !p.referenceRange) {
    return { flag: 'NORMAL', isAbnormal: false, color: '#1d4ed8' };
  }
  const strVal = String(p.observedValue).trim().toLowerCase();
  if (['negative', 'nil', 'clear', 'pale yellow', 'yellow', 'normal', 'not seen', 'absent', '0', '0.0', '-'].includes(strVal)) {
    return { flag: 'NORMAL', isAbnormal: false, color: '#1d4ed8' };
  }
  const val = parseFloat(p.observedValue);
  if (isNaN(val)) {
    return { flag: 'NORMAL', isAbnormal: false, color: '#1d4ed8' };
  }

  const parts = p.referenceRange.split('-').map((s: string) => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    const [lo, hi] = parts;
    if (val < lo) {
      return { flag: '↓ LOW', isAbnormal: true, color: '#dc2626' };
    }
    if (val > hi) {
      return { flag: '↑ HIGH', isAbnormal: true, color: '#dc2626' };
    }
  }
  return { flag: 'NORMAL', isAbnormal: false, color: '#1d4ed8' };
}

export interface DoctorDetails {
  name: string;
  qualification: string;
  regNo: string;
  designation: string;
  verifiedAt: string;
  signatureUrl?: string;
}

export type ReportTemplateType = 'STANDARD' | 'DETAILED';

export interface ReportPDFDocumentProps {
  report?: any;
  branch?: any;
  doctor?: DoctorDetails;
  containerId?: string;
  templateType?: ReportTemplateType;
}

export const ReportPDFDocument: React.FC<ReportPDFDocumentProps> = ({
  report: rawReport,
  branch: rawBranch,
  doctor: rawDoctor,
  containerId = 'clinical-report-document',
  templateType,
}) => {
  const report = rawReport || {};
  const rawBooking = report.booking || {};
  const booking = {
    ...rawBooking,
    patientName: rawBooking.patientName || report.patientName || rawBooking.user?.name || '',
    bookingCode: rawBooking.bookingCode || report.bookingCode || report.id?.slice(0, 8) || '',
    patientAge: rawBooking.patientAge !== undefined ? rawBooking.patientAge : report.patientAge,
    patientGender: rawBooking.patientGender || report.patientGender || '',
    patientMobile: rawBooking.patientMobile || report.patientMobile || rawBooking.user?.mobile || '',
    patientEmail: rawBooking.patientEmail || report.patientEmail || rawBooking.user?.email || '',
    address: rawBooking.address || report.address || rawBooking.user?.address || rawBooking.branch?.address || '',
    collectionMode: rawBooking.collectionMode || report.collectionMode || 'LAB',
    sampleCollectedAt: rawBooking.sampleCollectedAt || report.sampleCollectedAt || report.reportedDate || null,
    sampleReceivedAt: rawBooking.sampleReceivedAt || report.sampleReceivedAt || report.reportedDate || null,
    branch: rawBranch || rawBooking.branch || report.reportBranch || null,
  };

  const doctor = rawDoctor || (report.doctorName ? {
    name: report.doctorName,
    qualification: report.doctorQualification || '',
    regNo: report.doctorRegNo || '',
    designation: report.doctorDesignation || '',
    verifiedAt: report.doctorVerifiedAt || report.reportedDate || null,
    signatureUrl: report.doctorSignatureUrl || report.signatureUrl || '',
  } : undefined);

  const fmt = (dt: string | null | undefined) =>
    dt ? new Date(dt).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }) : '-';

  const formatDateTime = (dateStr: string | null | undefined, includeTime: boolean = true) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    if (!includeTime) return `${dd}/${mm}/${yyyy}`;
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hh = String(hours).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${minutes} ${ampm}`;
  };

  const generatedOn = fmt(report.reportedDate || report.createdAt || new Date().toISOString());

  const rawParameters = (report.parameters && report.parameters.length > 0) ? report.parameters : [];
  const groupedParams: Record<string, any[]> = {};
  rawParameters.forEach((p: any) => {
    const key = p.testGroupName || report.testName || 'Diagnostic Test';
    if (!groupedParams[key]) groupedParams[key] = [];
    groupedParams[key].push(p);
  });
  if (Object.keys(groupedParams).length === 0 && rawParameters.length > 0) {
    groupedParams[report.testName || 'Diagnostic Test'] = rawParameters;
  }

  // Resolve template type from explicit prop, report data, or internal tag
  const resolvedTemplate: ReportTemplateType =
    templateType ||
    report.templateType ||
    (report.internalNotes?.includes('[TEMPLATE:DETAILED]') ? 'DETAILED' : 'STANDARD');

  const templateProps: TemplateProps = {
    report,
    booking,
    branch: rawBranch || booking.branch,
    doctor,
    groupedParams,
    generatedOn,
    formatDateTime,
    getFlag,
    containerId,
  };

  return (
    <div
      id={containerId}
      style={{
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        width: '794px',
        minHeight: '1120px',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        fontSize: '10px',
        lineHeight: '1.35',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {resolvedTemplate === 'DETAILED' ? (
        <DetailedReportTemplate {...templateProps} />
      ) : (
        <StandardReportTemplate {...templateProps} />
      )}
    </div>
  );
};