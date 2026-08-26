import React from 'react';
import { StandardReportTemplate, DummyQRCode, DummyBarcode, TemplateProps } from './reportTemplates/StandardReportTemplate';
import { DetailedReportTemplate } from './reportTemplates/DetailedReportTemplate';

export { DummyQRCode, DummyBarcode };

// Fallback Structured Mock Data JSON
export const MOCK_REPORT_JSON = {
  testName: 'COMPLETE BLOOD COUNT (CBC), ESR (WESTERGREN METHOD)',
  status: 'RELEASED',
  specimenType: 'Blood (EDTA/Serum)',
  sampleId: 'SID-MSF7E3A3',
  reportedDate: new Date().toISOString(),
  booking: {
    patientName: 'Veshu Soni',
    bookingCode: 'MSF7E3A3',
    patientAge: 22,
    patientGender: 'Female',
    patientMobile: '9990000000',
    patientEmail: 'vaishalisoni02004@gmail.com',
    address: 'Thane, Maharashtra',
    collectionMode: 'Home Collection',
    sampleCollectedAt: new Date().toISOString(),
    sampleReceivedAt: new Date().toISOString(),
    branch: {
      name: 'MedsSeva - Thane West',
      address: '2nd Floor, Viviana Mall Road, Thane West, Thane, Maharashtra, 400601',
      contactNumber: '9876500002',
      email: 'thane@MedsSeva.in',
      labRegNo: 'LAB-THN-2026',
    },
  },
  doctor: {
    name: 'Dr. Anjali Mehta',
    qualification: 'MBBS, MD (Pathology)',
    regNo: '21232444',
    designation: 'Senior Pathologist',
    verifiedAt: new Date().toISOString(),
    signatureUrl: '',
  },
  parameters: [
    { parameterName: 'Hemoglobin', observedValue: '11.2', unit: 'g/dL', referenceRange: '12 - 16' },
    { parameterName: 'RBC Count', observedValue: '4.5', unit: 'mill/µL', referenceRange: '4 - 5.2' },
    { parameterName: 'WBC Count', observedValue: '7.8', unit: '10³/µL', referenceRange: '4 - 11' },
    { parameterName: 'Platelet Count', observedValue: '250', unit: '10³/µL', referenceRange: '150 - 400' },
    { parameterName: 'Hematocrit (PCV)', observedValue: '34.0', unit: '%', referenceRange: '36 - 48' },
    { parameterName: 'MCV', observedValue: '88.5', unit: 'fL', referenceRange: '80 - 100' },
    { parameterName: 'MCH', observedValue: '29.0', unit: 'pg', referenceRange: '27 - 33' },
    { parameterName: 'MCHC', observedValue: '33.2', unit: 'g/dL', referenceRange: '31.5 - 36' },
    { parameterName: 'Neutrophils', observedValue: '58', unit: '%', referenceRange: '40 - 75' },
    { parameterName: 'Lymphocytes', observedValue: '32', unit: '%', referenceRange: '20 - 45' },
    { parameterName: 'Monocytes', observedValue: '5', unit: '%', referenceRange: '2 - 10' },
    { parameterName: 'Eosinophils', observedValue: '3', unit: '%', referenceRange: '1 - 6' },
    { parameterName: 'Basophils', observedValue: '0.5', unit: '%', referenceRange: '0 - 1' },
    { parameterName: 'RDW-CV', observedValue: '13.1', unit: '%', referenceRange: '11.5 - 14.5' },
    { parameterName: 'ESR', observedValue: '12', unit: 'mm/hr', referenceRange: '0 - 20' },
  ],
  clinicalNotes: 'Routine health checkup evaluation.',
  technicianRemarks: 'Sample processed on automated 5-part hematology analyzer. Quality check passed.',
  doctorRemarks: 'Microcytic hypochromic picture suggested. Clinical correlation advised.',
};

// Evaluate Flag and Range
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
  // Merge incoming report with structured fallback data
  const report = rawReport || MOCK_REPORT_JSON;
  const rawBooking = report.booking || {};
  const booking = {
    ...MOCK_REPORT_JSON.booking,
    ...rawBooking,
    patientName: rawBooking.patientName || report.patientName || rawBooking.user?.name || 'Naina',
    bookingCode: rawBooking.bookingCode || report.bookingCode || report.id?.slice(0, 8) || 'MSG958RX',
    patientAge: rawBooking.patientAge || report.patientAge || '23',
    patientGender: rawBooking.patientGender || report.patientGender || 'Female',
    patientMobile: rawBooking.patientMobile || report.patientMobile || rawBooking.user?.mobile || '0987654321',
    patientEmail: rawBooking.patientEmail || report.patientEmail || rawBooking.user?.email || 'patient@medsseva.com',
    address: rawBooking.address || report.address || rawBooking.user?.address || rawBooking.branch?.address || 'Bhopal, Madhya Pradesh',
    collectionMode: rawBooking.collectionMode || report.collectionMode || 'Home Collection',
    sampleCollectedAt: rawBooking.sampleCollectedAt || report.sampleCollectedAt || report.reportedDate || new Date().toISOString(),
    sampleReceivedAt: rawBooking.sampleReceivedAt || report.sampleReceivedAt || report.reportedDate || new Date().toISOString(),
    branch: rawBranch || rawBooking.branch || MOCK_REPORT_JSON.booking.branch,
  };

  const doctor = rawDoctor || (report.doctorName ? {
    name: report.doctorName,
    qualification: report.doctorQualification || 'MBBS, MD (Pathology)',
    regNo: report.doctorRegNo || 'MCI-8898',
    designation: report.doctorDesignation || 'Senior Consultant Pathologist',
    verifiedAt: report.doctorVerifiedAt || report.reportedDate || new Date().toISOString(),
    signatureUrl: report.doctorSignatureUrl || report.signatureUrl || '',
  } : MOCK_REPORT_JSON.doctor);

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

  const rawParameters = (report.parameters && report.parameters.length > 0) ? report.parameters : MOCK_REPORT_JSON.parameters;
  const groupedParams: Record<string, any[]> = {};
  rawParameters.forEach((p: any) => {
    const key = p.testGroupName || report.testName || MOCK_REPORT_JSON.testName;
    if (!groupedParams[key]) groupedParams[key] = [];
    groupedParams[key].push(p);
  });
  if (Object.keys(groupedParams).length === 0) {
    groupedParams[report.testName || MOCK_REPORT_JSON.testName] = rawParameters;
  }

  // Resolve template type
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