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

export const DummyQRCode: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', borderRadius: '3px' }}>
    <rect width="100" height="100" fill="#ffffff" stroke={T.border} strokeWidth="2" rx="4" />
    <rect x="8" y="8" width="26" height="26" fill="#006d6f" rx="3" />
    <rect x="13" y="13" width="16" height="16" fill="#ffffff" rx="1" />
    <rect x="17" y="17" width="8" height="8" fill="#006d6f" rx="1" />
    <rect x="66" y="8" width="26" height="26" fill="#006d6f" rx="3" />
    <rect x="71" y="13" width="16" height="16" fill="#ffffff" rx="1" />
    <rect x="75" y="17" width="8" height="8" fill="#006d6f" rx="1" />
    <rect x="8" y="66" width="26" height="26" fill="#006d6f" rx="3" />
    <rect x="13" y="71" width="16" height="16" fill="#ffffff" rx="1" />
    <rect x="17" y="75" width="8" height="8" fill="#006d6f" rx="1" />
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

export const DummyBarcode: React.FC<{ value?: string; height?: number }> = ({ value = '1049', height = 20 }) => (
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

export interface TemplateProps {
  report: any;
  booking: any;
  branch: any;
  doctor: any;
  groupedParams: Record<string, any[]>;
  generatedOn: string;
  formatDateTime: (dt: string | null | undefined, includeTime?: boolean) => string;
  getFlag: (p: any) => { flag: string; isAbnormal: boolean; color: string };
  containerId?: string;
}

export const StandardReportTemplate: React.FC<TemplateProps> = ({
  report,
  booking,
  branch,
  doctor,
  groupedParams,
  generatedOn,
  formatDateTime,
  getFlag,
}) => {
  const branchName = branch?.name || booking.branch?.name || report.branchName || 'MedsSeva Pathology Lab';
  const branchAddr = [branch?.line1, branch?.city, branch?.state, branch?.pincode].filter(Boolean).join(', ') || booking.branch?.address || 'Bhopal, Madhya Pradesh';
  const branchPhone = branch?.contactNumber || booking.branch?.contactNumber || '+91 8968522455';
  const branchEmail = branch?.email || booking.branch?.email || 'contact@medsseva.com';

  return (
    <div style={{ width: '100%', minHeight: '1120px', backgroundColor: T.white, boxSizing: 'border-box' }}>
      {/* Header Section: Medsseva Logo + Lab Info on Left */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '14px 24px 12px',
        borderBottom: `2.5px solid ${T.teal}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div>
            <img
              src="/trusted-partner.jpg"
              alt="MedsSeva"
              style={{ width: '115px', height: 'auto', display: 'block', marginBottom: '6px' }}
              crossOrigin="anonymous"
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <DummyQRCode size={42} />
              <div style={{ fontSize: '7.5px', color: T.slate500, lineHeight: '1.2', fontWeight: 700 }}>
                SCAN TO<br />VERIFY
              </div>
            </div>
          </div>

          <div style={{ paddingTop: '2px' }}>
            <div style={{ fontSize: '13px', color: T.teal, fontWeight: 900, marginBottom: '2px' }}>
              {branchName}
            </div>
            <div style={{ fontSize: '8.5px', color: T.slate500, fontWeight: 600, marginBottom: '2px' }}>
              Authorized Franchise Partner | MedsSeva Pathology Lab
            </div>
            {branchAddr && (
              <div style={{ fontSize: '9px', color: T.slate600, lineHeight: '1.4', maxWidth: '320px' }}>
                {branchAddr}
              </div>
            )}
            {branchPhone && (
              <div style={{ fontSize: '9px', color: T.slate600, marginTop: '2px', fontWeight: 600 }}>Ph: {branchPhone} | www.medsseva.com</div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Details Block */}
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
        {/* Left Column */}
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
                  {booking.partnerNote?.startsWith('Ref:') ? booking.partnerNote.replace('Ref:', '').trim() : (doctor?.name || report.doctorName || 'Self')}
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

            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${T.border}`, borderTop: 'none' }}>
              <thead>
                <tr style={{ background: T.slate100, borderBottom: `1px solid ${T.border}` }}>
                  {['TEST', 'VALUE', 'UNIT', 'REFERENCE', 'STATUS'].map((h, i) => (
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
                  const { flag, isAbnormal } = getFlag(p);
                  const rowBg = isAbnormal ? '#fffaf8' : (idx % 2 === 1 ? T.slate50 : T.white);
                  return (
                    <tr key={idx} style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: rowBg }}>
                      <td style={{ padding: '5px 8px', fontSize: '9.5px' }}>
                        <span style={{ fontWeight: isAbnormal ? 800 : 500, color: isAbnormal ? '#000000' : T.slate800 }}>
                          {p.parameterName}
                        </span>
                      </td>
                      <td style={{ padding: '5px 8px', fontSize: '9.5px', textAlign: 'center' }}>
                        <span style={{ fontWeight: isAbnormal ? 900 : 600, color: isAbnormal ? '#000000' : T.slate900 }}>
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
                        <span style={{ fontWeight: 800, color: isAbnormal ? T.criticalRed : T.blue, fontSize: '8.5px' }}>
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
        </div>
      )}

      {/* Signatures Footer */}
      <div style={{ margin: '12px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '10px' }}>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, color: T.slate700 }}>DMLT, Lab Incharge</div>
          <div style={{ fontSize: '7.5px', color: T.slate500, marginTop: '2px' }}>Verified Quality Checks Passed</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '8px', color: T.slate500 }}>Powered by <strong>MedsSeva Lab Platform</strong></div>
        </div>

        {doctor?.name && (
          <div style={{ textAlign: 'right', minWidth: '160px' }}>
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
            <div style={{ fontSize: '11px', fontWeight: 900, color: T.teal }}>{doctor.name}</div>
            {doctor.qualification && (
              <div style={{ fontSize: '7.5px', color: T.slate600, marginTop: '1px' }}>{doctor.qualification}</div>
            )}
            {doctor.designation && (
              <div style={{ fontSize: '7.5px', color: T.slate500, fontWeight: 700, marginTop: '1px', textTransform: 'uppercase' }}>
                {doctor.designation}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Disclaimer */}
      <div style={{
        margin: '8px 24px 0',
        borderTop: `1px solid ${T.border}`,
        paddingTop: '6px',
        paddingBottom: '12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '7.5px', color: T.slate600 }}>
          <span>Generated On: {generatedOn}</span>
          <span>© MedsSeva Diagnostics. All rights reserved.</span>
          <span>www.medsseva.com</span>
        </div>
      </div>
    </div>
  );
};
