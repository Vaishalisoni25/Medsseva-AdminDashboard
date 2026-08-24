import React from 'react';

const T = {
  teal: '#006d6f',
  tealLight: '#e6f7f7',
  white: '#ffffff',
  navy: '#0f2a3f',
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  blue: '#1d4ed8',
  criticalRed: '#dc2626',
  border: '#e2e8f0',
};

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
    return { flag: 'NORMAL', isAbnormal: false, color: T.blue };
  }
  const strVal = String(p.observedValue).trim().toLowerCase();
  if (['negative', 'nil', 'clear', 'pale yellow', 'yellow', 'normal', 'not seen', 'absent', '0', '0.0', '-'].includes(strVal)) {
    return { flag: 'NORMAL', isAbnormal: false, color: T.blue };
  }
  const val = parseFloat(p.observedValue);
  if (isNaN(val)) {
    return { flag: 'NORMAL', isAbnormal: false, color: T.blue };
  }

  const parts = p.referenceRange.split('-').map((s: string) => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    const [lo, hi] = parts;
    if (val < lo) {
      return { flag: '↓ LOW', isAbnormal: true, color: T.criticalRed };
    }
    if (val > hi) {
      return { flag: '↑ HIGH', isAbnormal: true, color: T.criticalRed };
    }
  }
  return { flag: 'NORMAL', isAbnormal: false, color: T.blue };
}

// Dummy QR Code SVG Component for Scanner
const DummyQRCode: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', borderRadius: '3px' }}>
    <rect width="100" height="100" fill="#ffffff" stroke={T.border} strokeWidth="2" rx="4" />
    {/* Finder 1 Top Left */}
    <rect x="8" y="8" width="26" height="26" fill="#006d6f" rx="3" />
    <rect x="13" y="13" width="16" height="16" fill="#ffffff" rx="1" />
    <rect x="17" y="17" width="8" height="8" fill="#006d6f" rx="1" />
    {/* Finder 2 Top Right */}
    <rect x="66" y="8" width="26" height="26" fill="#006d6f" rx="3" />
    <rect x="71" y="13" width="16" height="16" fill="#ffffff" rx="1" />
    <rect x="75" y="17" width="8" height="8" fill="#006d6f" rx="1" />
    {/* Finder 3 Bottom Left */}
    <rect x="8" y="66" width="26" height="26" fill="#006d6f" rx="3" />
    <rect x="13" y="71" width="16" height="16" fill="#ffffff" rx="1" />
    <rect x="17" y="75" width="8" height="8" fill="#006d6f" rx="1" />
    {/* Data modules */}
    <rect x="40" y="10" width="5" height="5" fill="#0f2a3f" />
    <rect x="50" y="10" width="6" height="6" fill="#006d6f" />
    <rect x="40" y="22" width="6" height="6" fill="#0f2a3f" />
    <rect x="52" y="24" width="5" height="5" fill="#0f2a3f" />
    <rect x="10" y="42" width="6" height="6" fill="#0f2a3f" />
    <rect x="22" y="42" width="5" height="5" fill="#006d6f" />
    <rect x="42" y="42" width="8" height="8" fill="#006d6f" rx="1" />
    <rect x="56" y="42" width="6" height="6" fill="#0f2a3f" />
    <rect x="68" y="42" width="5" height="5" fill="#0f2a3f" />
    <rect x="80" y="46" width="6" height="6" fill="#006d6f" />
    <rect x="40" y="56" width="6" height="6" fill="#0f2a3f" />
    <rect x="52" y="56" width="6" height="6" fill="#006d6f" />
    <rect x="68" y="56" width="8" height="8" fill="#0f2a3f" />
    <rect x="40" y="68" width="6" height="6" fill="#0f2a3f" />
    <rect x="52" y="70" width="5" height="5" fill="#006d6f" />
    <rect x="68" y="70" width="6" height="6" fill="#0f2a3f" />
    <rect x="80" y="74" width="6" height="6" fill="#006d6f" />
    <rect x="40" y="82" width="6" height="6" fill="#006d6f" />
    <rect x="52" y="84" width="6" height="6" fill="#0f2a3f" />
    <rect x="68" y="82" width="6" height="6" fill="#0f2a3f" />
    <rect x="80" y="84" width="6" height="6" fill="#006d6f" />
  </svg>
);

// Barcode Component for Patient Details section
const DummyBarcode: React.FC<{ value?: string; height?: number }> = ({ value = '1049', height = 20 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <svg width="105" height={height} viewBox="0 0 105 24" fill="#000000">
      <rect x="0" y="0" width="2" height="24" />
      <rect x="3" y="0" width="1" height="24" />
      <rect x="6" y="0" width="3" height="24" />
      <rect x="11" y="0" width="2" height="24" />
      <rect x="15" y="0" width="1" height="24" />
      <rect x="18" y="0" width="4" height="24" />
      <rect x="24" y="0" width="2" height="24" />
      <rect x="28" y="0" width="1" height="24" />
      <rect x="31" y="0" width="3" height="24" />
      <rect x="36" y="0" width="1" height="24" />
      <rect x="39" y="0" width="2" height="24" />
      <rect x="43" y="0" width="4" height="24" />
      <rect x="49" y="0" width="1" height="24" />
      <rect x="52" y="0" width="3" height="24" />
      <rect x="57" y="0" width="2" height="24" />
      <rect x="61" y="0" width="1" height="24" />
      <rect x="64" y="0" width="4" height="24" />
      <rect x="70" y="0" width="2" height="24" />
      <rect x="74" y="0" width="1" height="24" />
      <rect x="77" y="0" width="3" height="24" />
      <rect x="82" y="0" width="2" height="24" />
      <rect x="86" y="0" width="1" height="24" />
      <rect x="89" y="0" width="3" height="24" />
      <rect x="94" y="0" width="2" height="24" />
      <rect x="98" y="0" width="4" height="24" />
      <rect x="103" y="0" width="2" height="24" />
    </svg>
    <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: 'monospace', color: '#1e293b' }}>{value}</span>
  </div>
);

export interface DoctorDetails {
  name: string;
  qualification: string;
  regNo: string;
  designation: string;
  verifiedAt: string;
  signatureUrl?: string;
}

export interface ReportPDFDocumentProps {
  report?: any;
  branch?: any;
  doctor?: DoctorDetails;
  containerId?: string;
}

export const ReportPDFDocument: React.FC<ReportPDFDocumentProps> = ({
  report: rawReport,
  branch: rawBranch,
  doctor: rawDoctor,
  containerId = 'clinical-report-document',
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

  const formatDateTime = (dt: string | null | undefined, includeTime = true) => {
    if (!dt) return '-';
    const d = new Date(dt);
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

  const branchName  = rawBranch?.name || booking.branch?.name || report.branchName || 'Bhopal branch';
  const branchAddr  = [rawBranch?.line1, rawBranch?.city, rawBranch?.state, rawBranch?.pincode].filter(Boolean).join(', ') || booking.branch?.address || 'General Post Office, Bhopal, Madhya Pradesh - 462001';
  const branchPhone = rawBranch?.contactNumber || booking.branch?.contactNumber || '9998886661';
  const branchEmail = rawBranch?.email || booking.branch?.email || 'bhopal@gmail.com';
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

  const testNameLower = (report.testName || Object.keys(groupedParams)[0] || '').toLowerCase();
  const specimenType = report.specimenType || (testNameLower.includes('urine') ? 'Urine (Spot/Midstream)' : (testNameLower.includes('stool') ? 'Stool' : 'Blood (EDTA/Serum)'));

  return (
    <div
      id={containerId}
      style={{
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        width: '794px',
        minHeight: '1120px',
        backgroundColor: T.white,
        color: T.slate900,
        fontSize: '10px',
        lineHeight: '1.35',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Header Section: Logo + Branch Details on Left; Scanner under Logo */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '14px 24px 12px',
        borderBottom: `2.5px solid ${T.teal}`,
      }}>
        {/* Left: Logo + Scanner directly below Logo */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div>
            <img
              src="/trusted-partner.jpg"
              alt="MedsSeva"
              style={{ width: '115px', height: 'auto', display: 'block', marginBottom: '6px' }}
              crossOrigin="anonymous"
            />
            {/* Scanner / QR Code placed right below Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <DummyQRCode size={42} />
              <div style={{ fontSize: '7.5px', color: T.slate500, lineHeight: '1.2', fontWeight: 700 }}>
                SCAN TO<br />VERIFY
              </div>
            </div>
          </div>

          {/* Branch Details */}
          <div style={{ paddingTop: '2px' }}>
            <div style={{ fontSize: '13px', color: T.teal, fontWeight: 900, marginBottom: '2px' }}>
              {branchName}
            </div>
            {branchAddr && (
              <div style={{ fontSize: '9px', color: T.slate600, lineHeight: '1.4', maxWidth: '300px' }}>
                {branchAddr}
              </div>
            )}
            {branchPhone && (
              <div style={{ fontSize: '9px', color: T.slate600, marginTop: '2px', fontWeight: 600 }}>Ph: {branchPhone}</div>
            )}
            {branchEmail && (
              <div style={{ fontSize: '9px', color: T.slate600 }}>{branchEmail}</div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Details Section - Sequential Clinical Format */}
      <div style={{
        margin: '8px 24px 10px',
        borderTop: `1px solid ${T.teal}`,
        borderBottom: `1px solid ${T.border}`,
        paddingTop: '6px',
        paddingBottom: '8px',
        display: 'grid',
        gridTemplateColumns: '1.25fr 1fr',
        gap: '0',
      }}>
        {/* Left Column: Patient Info & Registration Sequence */}
        <div style={{ paddingRight: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            {booking.patientName?.toLowerCase().startsWith('mr') || booking.patientName?.toLowerCase().startsWith('ms') || booking.patientName?.toLowerCase().startsWith('mrs') || booking.patientName?.toLowerCase().startsWith('dr')
              ? booking.patientName
              : `${booking.patientGender === 'Female' ? 'Ms.' : 'Mr.'} ${booking.patientName || 'Patient'}`}
          </div>
          <table style={{ borderCollapse: 'collapse', fontSize: '9.5px', lineHeight: '1.65', width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ color: T.slate700, width: '80px', padding: '1.5px 0', fontWeight: 500 }}>Age / Sex</td>
                <td style={{ color: T.slate700, width: '12px', padding: '1.5px 2px' }}>:</td>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>
                  {booking.patientAge ? `${booking.patientAge} YRS` : '22 YRS'} / {booking.patientGender === 'Female' ? 'F' : 'M'}
                </td>
              </tr>
              <tr>
                <td style={{ color: T.slate700, padding: '1.5px 0', fontWeight: 500 }}>Referred by</td>
                <td style={{ color: T.slate700, padding: '1.5px 2px' }}>:</td>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>
                  {doctor?.name || report.doctorName || 'Self'}
                </td>
              </tr>
              <tr>
                <td style={{ color: T.slate700, padding: '1.5px 0', fontWeight: 500 }}>Reg. no.</td>
                <td style={{ color: T.slate700, padding: '1.5px 2px' }}>:</td>
                <td style={{ fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
                  {booking.bookingCode || '1049'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right Column: Barcode & Sequential Timestamps */}
        <div style={{
          paddingLeft: '16px',
          borderLeft: `1px solid #cbd5e1`,
        }}>
          {/* Barcode on top */}
          <div style={{ marginBottom: '6px' }}>
            <DummyBarcode value={booking.bookingCode || '1049'} height={20} />
          </div>
          <table style={{ borderCollapse: 'collapse', fontSize: '9.5px', lineHeight: '1.65', width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ color: T.slate700, width: '90px', padding: '1.5px 0', fontWeight: 500 }}>Registered on</td>
                <td style={{ color: T.slate700, width: '12px', padding: '1.5px 2px' }}>:</td>
                <td style={{ color: '#0f172a', fontWeight: 500 }}>
                  {formatDateTime(booking.createdAt || booking.sampleCollectedAt || report.createdAt)}
                </td>
              </tr>
              <tr>
                <td style={{ color: T.slate700, padding: '1.5px 0', fontWeight: 500 }}>Collected on</td>
                <td style={{ color: T.slate700, padding: '1.5px 2px' }}>:</td>
                <td style={{ color: '#0f172a', fontWeight: 500 }}>
                  {formatDateTime(booking.sampleCollectedAt || booking.scheduledDate || report.createdAt, false)}
                </td>
              </tr>
              <tr>
                <td style={{ color: T.slate700, padding: '1.5px 0', fontWeight: 500 }}>Received on</td>
                <td style={{ color: T.slate700, padding: '1.5px 2px' }}>:</td>
                <td style={{ color: '#0f172a', fontWeight: 500 }}>
                  {formatDateTime(booking.sampleReceivedAt || booking.sampleCollectedAt || report.createdAt, false)}
                </td>
              </tr>
              <tr>
                <td style={{ color: T.slate700, padding: '1.5px 0', fontWeight: 500 }}>Reported on</td>
                <td style={{ color: T.slate700, padding: '1.5px 2px' }}>:</td>
                <td style={{ color: '#0f172a', fontWeight: 600 }}>
                  {formatDateTime(report.reportedDate || report.createdAt)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Center-Aligned "LABORATORY REPORT" Banner */}
      <div style={{
        margin: '0 24px',
        background: T.navy,
        color: T.white,
        textAlign: 'center',
        padding: '6px 12px',
        borderRadius: '4px 4px 0 0',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '2.5px' }}>
          LABORATORY REPORT
        </div>
      </div>

      {/* Test Parameters Tables */}
      <div style={{ margin: '0 24px' }}>
        {Object.entries(groupedParams).map(([groupName, params], gi) => (
          <div key={gi}>
            {/* Center-Aligned Test Name Header */}
            <div style={{
              fontSize: '9.5px',
              fontWeight: 900,
              color: T.teal,
              padding: '6px 12px',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              textAlign: 'center',
              background: T.tealLight,
              borderLeft: `3px solid ${T.teal}`,
              borderRight: `3px solid ${T.teal}`,
              marginTop: gi === 0 ? '0' : '4px',
            }}>
              {groupName}
            </div>

            {/* Table without Status Column */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${T.border}`, borderTop: 'none' }}>
              <thead>
                <tr style={{ background: T.slate100, borderBottom: `1px solid ${T.border}` }}>
                  {['Parameter', 'Result', 'Unit', 'Reference Range', 'Flag'].map((h, i) => (
                    <th key={h} style={{
                      padding: '5px 8px',
                      fontSize: '8.5px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      color: T.slate700,
                      textAlign: i === 0 ? 'left' : 'center',
                      width: ['38%', '16%', '14%', '20%', '12%'][i],
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {params.map((p: any, idx: number) => {
                  const { flag, isAbnormal, color } = getFlag(p);
                  // Highlight abnormal rows subtly; parameters/result bold black on abnormal
                  const rowBg = isAbnormal ? '#fffaf8' : (idx % 2 === 1 ? T.slate50 : T.white);
                  return (
                    <tr key={idx} style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: rowBg }}>
                      <td style={{ padding: '5px 8px', fontSize: '9.5px' }}>
                        <span style={{
                          fontWeight: isAbnormal ? 800 : 500,
                          color: isAbnormal ? '#000000' : T.slate800,
                        }}>
                          {p.parameterName}
                        </span>
                      </td>
                      <td style={{ padding: '5px 8px', fontSize: '9.5px', textAlign: 'center' }}>
                        <span style={{
                          fontWeight: isAbnormal ? 900 : 600,
                          color: isAbnormal ? '#000000' : T.slate900,
                        }}>
                          {p.observedValue}
                        </span>
                      </td>
                      <td style={{ padding: '5px 8px', fontSize: '9px', textAlign: 'center' }}>
                        <span style={{ color: T.slate500 }}>{p.unit || '-'}</span>
                      </td>
                      <td style={{ padding: '5px 8px', fontSize: '9px', textAlign: 'center' }}>
                        <span style={{ fontFamily: 'monospace', color: T.slate600 }}>{p.referenceRange || '-'}</span>
                      </td>
                      <td style={{ padding: '5px 8px', fontSize: '9px', textAlign: 'center' }}>
                        {/* Red text for LOW/HIGH; Blue text for NORMAL */}
                        <span style={{
                          fontWeight: 800,
                          color: isAbnormal ? T.criticalRed : T.blue,
                          fontSize: '8.5px',
                        }}>
                          {flag}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Clinical Notes & Remarks Section */}
      {(report.doctorInterpretation || report.clinicalNotes || report.technicianRemarks || report.doctorRemarks) && (
        <div style={{ margin: '8px 24px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {report.clinicalNotes && (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '4px', padding: '6px 8px', background: T.slate50 }}>
              <div style={{ fontSize: '7.5px', fontWeight: 900, color: T.teal, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>Clinical Notes</div>
              <div style={{ fontSize: '8.5px', lineHeight: '1.4', fontStyle: 'italic', color: T.slate600 }}>{report.clinicalNotes}</div>
            </div>
          )}
          {report.technicianRemarks && (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '4px', padding: '6px 8px', background: T.slate50 }}>
              <div style={{ fontSize: '7.5px', fontWeight: 900, color: T.teal, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>Technician Remarks</div>
              <div style={{ fontSize: '8.5px', lineHeight: '1.4', color: T.slate600 }}>{report.technicianRemarks}</div>
            </div>
          )}
          {report.doctorRemarks && (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '4px', padding: '6px 8px', background: T.slate50, gridColumn: report.clinicalNotes && report.technicianRemarks ? '1 / -1' : 'auto' }}>
              <div style={{ fontSize: '7.5px', fontWeight: 900, color: T.teal, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>Doctor Remarks</div>
              <div style={{ fontSize: '8.5px', lineHeight: '1.4', color: T.slate700 }}>{report.doctorRemarks}</div>
            </div>
          )}
          {report.doctorInterpretation && (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '4px', padding: '6px 8px', background: T.slate50, gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '7.5px', fontWeight: 900, color: T.teal, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>Doctor Interpretation</div>
              <div style={{ fontSize: '8.5px', lineHeight: '1.4', color: T.slate700 }}>{report.doctorInterpretation}</div>
            </div>
          )}
        </div>
      )}

      {/* Signature Section: Supports both Uploaded Signature Image and Digital Text Signature */}
      {doctor?.name && (
        <div style={{ margin: '10px 24px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right', minWidth: '160px' }}>
            {/* If uploaded signature image exists, display it; else display digital verification badge */}
            {doctor.signatureUrl ? (
              <img
                src={doctor.signatureUrl}
                alt="Doctor Signature"
                style={{ maxHeight: '38px', maxWidth: '140px', objectFit: 'contain', display: 'block', margin: '0 0 2px auto' }}
                crossOrigin="anonymous"
              />
            ) : (
              <div style={{
                display: 'inline-block',
                border: `1px solid ${T.border}`,
                borderRadius: '3px',
                padding: '2px 6px',
                fontSize: '7px',
                color: T.slate600,
                marginBottom: '4px',
                background: T.slate50,
                letterSpacing: '0.8px',
                fontWeight: 700,
              }}>
                DIGITALLY SIGNED ✓
              </div>
            )}
            <div style={{ fontSize: '11.5px', fontWeight: 900, color: T.teal }}>{doctor.name}</div>
            {doctor.qualification && (
              <div style={{ fontSize: '7.5px', color: T.slate600, marginTop: '1px' }}>{doctor.qualification}</div>
            )}
            {doctor.regNo && (
              <div style={{ fontSize: '7.5px', color: T.slate600, marginTop: '1px' }}>Reg: {doctor.regNo}</div>
            )}
            {doctor.designation && (
              <div style={{ fontSize: '7.5px', color: T.slate500, fontWeight: 700, marginTop: '1px', textTransform: 'uppercase' }}>
                {doctor.designation}
              </div>
            )}
            {doctor.verifiedAt && (
              <div style={{ fontSize: '7px', color: T.slate400, marginTop: '1px' }}>Verified: {fmt(doctor.verifiedAt)}</div>
            )}
          </div>
        </div>
      )}

      {/* Compact A4-Fitting Footer */}
      <div style={{
        margin: '8px 24px 0',
        borderTop: `1px solid ${T.border}`,
        paddingTop: '6px',
        paddingBottom: '12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ fontSize: '8px', color: T.slate600 }}>
            <strong style={{ color: T.slate700 }}>Generated On:</strong> {generatedOn}
          </div>
          <div style={{ fontSize: '8px', color: T.slate600 }}>
            <strong style={{ color: T.slate700 }}>Website:</strong> www.medsseva.com
          </div>
        </div>

        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '7.5px', fontWeight: 700, color: T.slate700, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            DISCLAIMER
          </div>
          <div style={{ fontSize: '7.5px', color: T.slate500, lineHeight: '1.3' }}>
            This report is intended for interpretation by qualified medical professionals. Laboratory results should always be correlated with clinical findings. Test results may vary due to physiological conditions, medications, specimen quality, and laboratory methodology. MedsSeva shall not be held responsible for clinical decisions made solely on the basis of this report without appropriate consultation.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: '7.5px', color: T.slate600 }}>
            {branchPhone && <span>Support: {branchPhone} | </span>}
            {branchEmail && <span>{branchEmail}</span>}
          </div>
          <div style={{ fontSize: '7.5px', color: T.slate600 }}>
            © MedsSeva Diagnostics. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};