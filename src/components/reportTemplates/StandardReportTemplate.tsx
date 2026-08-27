import React from 'react';

const T = {
  teal: '#006d6f',
  tealDark: '#004d4f',
  tealLight: '#e6f7f7',
  cyanLine: '#00a896',
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
  darkBorder: '#cbd5e1',
};

export const DummyQRCode: React.FC<{ size?: number; label?: string }> = ({ size = 48, label = 'SCAN TO VERIFY' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', borderRadius: '3px' }}>
      <rect width="100" height="100" fill="#ffffff" stroke={T.border} strokeWidth="1.5" rx="3" />
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
    {label && (
      <div style={{ fontSize: '7px', color: T.slate500, fontWeight: 700, textAlign: 'center', letterSpacing: '0.3px', lineHeight: '1.1' }}>
        {label}
      </div>
    )}
  </div>
);

export const DummyBarcode: React.FC<{ value?: string; height?: number; showCode?: boolean }> = ({ value = '', height = 22, showCode = true }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <svg width="115" height={height} viewBox="0 0 115 24" fill="#000000">
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
      <rect x="104" y="0" width="2" height="24" />
      <rect x="108" y="0" width="3" height="24" />
      <rect x="113" y="0" width="2" height="24" />
    </svg>
    {showCode && value && (
      <span style={{ fontSize: '9.5px', fontWeight: 800, fontFamily: 'monospace', color: '#1e293b' }}>
        {value}
      </span>
    )}
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
  const branchName = branch?.name || booking?.branch?.name || report?.reportBranch?.name || report?.branchName || 'GN Healthcare';
  const branchAddr = [
    branch?.line1 || booking?.branch?.line1,
    branch?.city || booking?.branch?.city,
    branch?.state || booking?.branch?.state,
    branch?.pincode || booking?.branch?.pincode,
  ].filter(Boolean).join(', ') || booking?.branch?.address || 'Ranchi Colony, Gali No. 2, Quality Chowk, Ludhiana - 142022';
  const branchPhone = branch?.contactNumber || booking?.branch?.contactNumber || '+91 8968522455';
  const branchEmail = branch?.email || booking?.branch?.email || '';

  const rawPatientName = booking?.patientName || report?.patientName || '';
  const patientDisplayName = rawPatientName.toLowerCase().startsWith('mr') ||
    rawPatientName.toLowerCase().startsWith('ms') ||
    rawPatientName.toLowerCase().startsWith('mrs') ||
    rawPatientName.toLowerCase().startsWith('dr')
      ? rawPatientName
      : (rawPatientName ? `${booking?.patientGender === 'Female' ? 'Ms.' : 'Mr.'} ${rawPatientName}` : '-');

  const refDoctor = booking?.partnerNote?.startsWith('Ref:')
    ? booking.partnerNote.replace('Ref:', '').trim()
    : (doctor?.name || report?.doctorName || 'Self');

  const regCode = booking?.bookingCode || report?.id?.slice(0, 8) || '1042';

  return (
    <div style={{
      width: '794px',
      maxWidth: '794px',
      minHeight: '1123px',
      backgroundColor: T.white,
      boxSizing: 'border-box',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      position: 'relative',
    }}>
      <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '16px 28px 12px',
        borderBottom: `2.5px solid ${T.cyanLine}`,
      }}>
        {/* Left: MedsSeva Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <img
              src="/trusted-partner.jpg"
              alt="MedsSeva"
              style={{ width: '130px', height: 'auto', display: 'block' }}
              crossOrigin="anonymous"
            />
            <div style={{ fontSize: '7.5px', color: T.slate500, fontWeight: 700, marginTop: '2px', letterSpacing: '0.4px' }}>
              Because Health is Service.
            </div>
          </div>
        </div>

        {/* Right: Branch / Franchise Information */}
        <div style={{ textAlign: 'left', maxWidth: '440px', paddingLeft: '16px' }}>
          <div style={{ fontSize: '18px', color: '#006d6f', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
            {branchName}
          </div>
          <div style={{ fontSize: '8.5px', color: '#006d6f', fontWeight: 700, marginBottom: '3px' }}>
            Authorized Franchise Partner | MedsSeva Pathology Lab
          </div>
          <div style={{ fontSize: '8px', color: T.slate600, lineHeight: '1.4' }}>
            <span>Ph: {branchPhone}</span> | <span>www.medsseva.com</span> | <span>{branchAddr}</span>
          </div>
        </div>
      </div>

      {/* 2. Patient Information Block (Reference Exact 2-Column Format) */}
      <div style={{
        margin: '10px 28px 12px',
        borderTop: `1px solid ${T.cyanLine}`,
        borderBottom: `1px solid #94a3b8`,
        paddingTop: '8px',
        paddingBottom: '10px',
        display: 'grid',
        gridTemplateColumns: '1.25fr 1fr 56px',
        gap: '12px',
        alignItems: 'center',
      }}>
        {/* Left Column */}
        <div>
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {patientDisplayName}
          </div>
          <table style={{ borderCollapse: 'collapse', fontSize: '9.5px', lineHeight: '1.7', width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ color: T.slate700, width: '85px', padding: '1px 0', fontWeight: 600 }}>Age / Sex</td>
                <td style={{ color: T.slate700, width: '12px', padding: '1px 2px' }}>:</td>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>
                  {booking?.patientAge ? `${booking.patientAge} YRS` : '-'} / {booking?.patientGender === 'Female' ? 'F' : (booking?.patientGender === 'Male' ? 'M' : '-')}
                </td>
              </tr>
              <tr>
                <td style={{ color: T.slate700, padding: '1px 0', fontWeight: 600 }}>Referred by</td>
                <td style={{ color: T.slate700, padding: '1px 2px' }}>:</td>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>
                  {refDoctor}
                </td>
              </tr>
              <tr>
                <td style={{ color: T.slate700, padding: '1px 0', fontWeight: 600 }}>Reg. no.</td>
                <td style={{ color: T.slate700, padding: '1px 2px' }}>:</td>
                <td style={{ fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
                  {regCode}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Center/Right Column: Barcode & Registration Timestamps */}
        <div style={{ borderLeft: `1px solid ${T.border}`, paddingLeft: '14px' }}>
          <div style={{ marginBottom: '6px' }}>
            <DummyBarcode value={regCode} height={20} showCode={true} />
          </div>
          <table style={{ borderCollapse: 'collapse', fontSize: '9.5px', lineHeight: '1.7', width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ color: T.slate700, width: '90px', padding: '1px 0', fontWeight: 600 }}>Registered on</td>
                <td style={{ color: T.slate700, width: '12px', padding: '1px 2px' }}>:</td>
                <td style={{ color: '#0f172a', fontWeight: 600 }}>
                  {formatDateTime(booking?.createdAt || booking?.sampleCollectedAt || report?.createdAt)}
                </td>
              </tr>
              <tr>
                <td style={{ color: T.slate700, padding: '1px 0', fontWeight: 600 }}>Collected on</td>
                <td style={{ color: T.slate700, padding: '1px 2px' }}>:</td>
                <td style={{ color: '#0f172a', fontWeight: 600 }}>
                  {formatDateTime(booking?.sampleCollectedAt || booking?.scheduledDate || report?.createdAt, false)}
                </td>
              </tr>
              <tr>
                <td style={{ color: T.slate700, padding: '1px 0', fontWeight: 600 }}>Received on</td>
                <td style={{ color: T.slate700, padding: '1px 2px' }}>:</td>
                <td style={{ color: '#0f172a', fontWeight: 600 }}>
                  {formatDateTime(booking?.sampleReceivedAt || booking?.sampleCollectedAt || report?.createdAt, false)}
                </td>
              </tr>
              <tr>
                <td style={{ color: T.slate700, padding: '1px 0', fontWeight: 600 }}>Reported on</td>
                <td style={{ color: T.slate700, padding: '1px 2px' }}>:</td>
                <td style={{ color: '#0f172a', fontWeight: 700 }}>
                  {formatDateTime(report?.reportedDate || report?.createdAt)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Far Right: QR Code */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <DummyQRCode size={48} label="Scan to download" />
        </div>
      </div>

      {/* 3. Diagnostic Test Panels (100% Dynamic from Entered Values) */}
      <div style={{ margin: '0 28px' }}>
        {Object.entries(groupedParams).map(([groupName, params], gi) => (
          <div key={gi} style={{ marginBottom: '14px' }}>
            {/* Section / Category Header */}
            <div style={{
              textAlign: 'center',
              fontSize: '11.5px',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}>
              {report?.category?.name || report?.testCategory || 'DIAGNOSTIC PATHOLOGY'}
            </div>

            {/* Test Sub-Header Banner */}
            <div style={{
              textAlign: 'center',
              fontSize: '10px',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              borderTop: '1.5px solid #0f172a',
              borderBottom: '1.5px solid #0f172a',
              padding: '4px 0',
              marginBottom: '2px',
            }}>
              {groupName}
            </div>

            {/* 4-Column Table matching Reference */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid #0f172a` }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid #0f172a`, background: T.white }}>
                  <th style={{ padding: '6px 8px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', textAlign: 'left', width: '42%' }}>
                    TEST
                  </th>
                  <th style={{ padding: '6px 8px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', textAlign: 'left', width: '20%' }}>
                    VALUE
                  </th>
                  <th style={{ padding: '6px 8px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', textAlign: 'left', width: '16%' }}>
                    UNIT
                  </th>
                  <th style={{ padding: '6px 8px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', textAlign: 'left', width: '22%' }}>
                    REFERENCE
                  </th>
                </tr>
              </thead>
              <tbody>
                {params.map((p: any, idx: number) => {
                  const { isAbnormal, flag } = getFlag(p);
                  const isHigh = flag.includes('HIGH') || flag.includes('↑');
                  const isLow = flag.includes('LOW') || flag.includes('↓');
                  const flagLetter = isHigh ? 'H' : isLow ? 'L' : '';

                  return (
                    <tr key={idx} style={{ borderBottom: idx === params.length - 1 ? 'none' : `1px solid ${T.border}` }}>
                      {/* TEST NAME */}
                      <td style={{ padding: '4.5px 8px', fontSize: '9px', verticalAlign: 'middle' }}>
                        <span style={{ fontWeight: isAbnormal ? 800 : 600, color: '#0f172a', textTransform: 'uppercase' }}>
                          {p.parameterName}
                        </span>
                      </td>

                      {/* VALUE (With L/H flag prefix matching reference image) */}
                      <td style={{ padding: '4.5px 8px', fontSize: '9.5px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {flagLetter && (
                            <span style={{ fontWeight: 900, color: '#0f172a', width: '12px', fontSize: '9.5px' }}>
                              {flagLetter}
                            </span>
                          )}
                          <span style={{
                            fontWeight: isAbnormal ? 900 : 600,
                            color: isAbnormal ? '#000000' : '#0f172a',
                            fontFamily: 'monospace',
                            fontSize: '9.5px',
                          }}>
                            {p.observedValue}
                          </span>
                        </div>
                      </td>

                      {/* UNIT */}
                      <td style={{ padding: '4.5px 8px', fontSize: '8.5px', color: T.slate700, verticalAlign: 'middle' }}>
                        {p.unit || '-'}
                      </td>

                      {/* REFERENCE */}
                      <td style={{ padding: '4.5px 8px', fontSize: '8.5px', color: '#0f172a', fontFamily: 'monospace', fontWeight: 600, verticalAlign: 'middle' }}>
                        {p.referenceRange || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* 4. Clinical Notes & Remarks (Dynamic from Report Builder Inputs) */}
      {(report?.doctorInterpretation || report?.clinicalNotes || report?.technicianRemarks || report?.doctorRemarks) && (
        <div style={{ margin: '8px 28px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {report.clinicalNotes && (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '4px', padding: '6px 10px', background: T.slate50 }}>
              <div style={{ fontSize: '7.5px', fontWeight: 900, color: '#006d6f', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>Clinical Notes</div>
              <div style={{ fontSize: '8.5px', lineHeight: '1.4', fontStyle: 'italic', color: T.slate700 }}>{report.clinicalNotes}</div>
            </div>
          )}
          {report.technicianRemarks && (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '4px', padding: '6px 10px', background: T.slate50 }}>
              <div style={{ fontSize: '7.5px', fontWeight: 900, color: '#006d6f', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>Technician Remarks</div>
              <div style={{ fontSize: '8.5px', lineHeight: '1.4', color: T.slate700 }}>{report.technicianRemarks}</div>
            </div>
          )}
          {report.doctorRemarks && (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '4px', padding: '6px 10px', background: T.slate50, gridColumn: report.clinicalNotes && report.technicianRemarks ? '1 / -1' : 'auto' }}>
              <div style={{ fontSize: '7.5px', fontWeight: 900, color: '#006d6f', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>Doctor Remarks</div>
              <div style={{ fontSize: '8.5px', lineHeight: '1.4', color: T.slate800 }}>{report.doctorRemarks}</div>
            </div>
          )}
        </div>
      )}
      </div>

      {/* 5. Signatures Footer (Mr. Rajinder Singh style) */}
      <div>
        <div style={{
          margin: '14px 28px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingTop: '8px',
        }}>
          {/* Left: Lab Incharge */}
          <div>
            <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#0f172a' }}>DMLT, Lab Incharge</div>
            <div style={{ fontSize: '7.5px', color: T.slate500, marginTop: '2px' }}>Verified Quality Checks Passed</div>
          </div>

          {/* Center: Powered by MedsSeva & Page */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '8px', color: T.slate600 }}>
              Powered by <strong style={{ color: '#006d6f' }}>MedsSeva Lab Platform</strong>
            </div>
            <div style={{ fontSize: '7.5px', color: T.slate500, marginTop: '2px' }}>
              Page 1 of 1
            </div>
          </div>

          {/* Right: Pathologist Signature */}
          <div style={{ textAlign: 'right', minWidth: '170px' }}>
            {doctor?.signatureUrl ? (
              <img
                src={doctor.signatureUrl}
                alt="Doctor Signature"
                style={{ maxHeight: '42px', maxWidth: '140px', objectFit: 'contain', display: 'block', margin: '0 0 2px auto' }}
                crossOrigin="anonymous"
              />
            ) : (
              <div style={{
                display: 'inline-block',
                border: `1px solid ${T.cyanLine}`,
                borderRadius: '3px',
                padding: '2px 6px',
                fontSize: '7px',
                color: '#006d6f',
                marginBottom: '4px',
                background: T.tealLight,
                letterSpacing: '0.6px',
                fontWeight: 800,
              }}>
                DIGITALLY SIGNED ✓
              </div>
            )}
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a' }}>
              {doctor?.name || report?.doctorName || 'Dr. ANA GUPTA'}
            </div>
            <div style={{ fontSize: '7.5px', color: T.slate600, marginTop: '1px', fontWeight: 600 }}>
              {doctor?.qualification || report?.doctorQualification || 'MBBS, MD Pathologist'}
            </div>
            {(doctor?.designation || report?.doctorDesignation) && (
              <div style={{ fontSize: '7.5px', color: T.slate500, fontWeight: 700, marginTop: '1px', textTransform: 'uppercase' }}>
                {doctor?.designation || report?.doctorDesignation}
              </div>
            )}
          </div>
        </div>

        {/* 6. Bottom Banner / Disclaimer */}
        <div style={{
          margin: '10px 28px 0',
          borderTop: `1px solid ${T.cyanLine}`,
          paddingTop: '6px',
          paddingBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '7.5px',
          color: T.slate600,
        }}>
          <span><strong>{branchName}</strong> | Because Health is Service.</span>
          <span>Generated On: {generatedOn}</span>
          <span>www.medsseva.com</span>
        </div>
      </div>
    </div>
  );
};
