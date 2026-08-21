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
  amberBg: '#fffbeb',
  criticalBg: '#fff1f2',
  green: '#15803d',
  greenBadge: '#dcfce7',
  blue: '#1d4ed8',
  criticalRed: '#dc2626',
  amber: '#b45309',
  border: '#e2e8f0',
};

const FLAG_STYLE: Record<string, { color: string; bg: string }> = {
  HIGH:     { color: '#b45309', bg: '#fef3c7' },
  LOW:      { color: '#1d4ed8', bg: '#eff6ff' },
  CRITICAL: { color: '#dc2626', bg: '#fff1f2' },
  NORMAL:   { color: '#15803d', bg: '#dcfce7' },
};

function getFlag(p: any): { flag: string; status: string; color: string; bg: string } {
  if (!p.observedValue || !p.referenceRange)
    return { flag: '-', status: 'NORMAL', color: T.green, bg: T.greenBadge };
  const val = parseFloat(p.observedValue);
  if (isNaN(val)) return { flag: '-', status: 'NORMAL', color: T.green, bg: T.greenBadge };
  const parts = p.referenceRange.split('-').map((s: string) => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    const [lo, hi] = parts;
    const range = hi - lo || 1;
    if (val < lo) {
      const severity = (lo - val) / range;
      if (severity > 0.5) return { flag: '↓ LOW', status: 'CRITICAL', ...FLAG_STYLE.CRITICAL };
      return { flag: '↓ LOW', status: 'LOW', ...FLAG_STYLE.LOW };
    }
    if (val > hi) {
      const severity = (val - hi) / range;
      if (severity > 0.5) return { flag: '!! CRITICAL', status: 'CRITICAL', ...FLAG_STYLE.CRITICAL };
      return { flag: '↑ HIGH', status: 'HIGH', ...FLAG_STYLE.HIGH };
    }
  }
  return { flag: '-', status: 'NORMAL', color: T.green, bg: T.greenBadge };
}

export interface DoctorDetails {
  name: string;
  qualification: string;
  regNo: string;
  designation: string;
  verifiedAt: string;
}

export interface ReportPDFDocumentProps {
  report: any;
  branch?: any;
  doctor?: DoctorDetails;
  containerId?: string;
}

export const ReportPDFDocument: React.FC<ReportPDFDocumentProps> = ({
  report,
  branch,
  doctor,
  containerId = 'clinical-report-document',
}) => {
  const booking = report.booking || {};

  const fmt = (dt: string | null | undefined) =>
    dt ? new Date(dt).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }) : '-';

  const branchName  = branch?.name || booking.branch?.name || '';
  const branchAddr  = [branch?.line1, branch?.city, branch?.state, branch?.pincode].filter(Boolean).join(', ') || booking.branch?.address || '';
  const branchPhone = branch?.contactNumber || booking.branch?.contactNumber || '';
  const branchEmail = branch?.email || booking.branch?.email || '';
  const branchRegNo = branch?.labRegNo || '';

  const groupedParams: Record<string, any[]> = {};
  (report.parameters || []).forEach((p: any) => {
    const key = p.testGroupName || report.testName || 'General';
    if (!groupedParams[key]) groupedParams[key] = [];
    groupedParams[key].push(p);
  });
  if (Object.keys(groupedParams).length === 0)
    groupedParams[report.testName || 'General'] = report.parameters || [];

  const generatedOn = fmt(new Date().toISOString());

  const hasBranch = branchName || branchAddr || branchPhone || branchEmail;

  return (
<div
      id={containerId}
      style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        width: '794px',
        backgroundColor: T.white,
        color: T.slate900,
        fontSize: '11px',
        lineHeight: '1.4',
      }}
    >
     
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '14px 28px 12px',
        borderBottom: `3px solid ${T.teal}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <img
            src="/trusted-partner.jpg"
            alt="MedsSeva"
          style={{ width: '108px', height: 'auto', display: 'block' }}
            crossOrigin="anonymous"
          />
          {hasBranch && (
            <div style={{ paddingTop: '2px' }}>
              {branchName && (
                <div style={{ fontSize: '11px', color: T.teal, fontWeight: 700, marginBottom: '3px' }}>{branchName}</div>
              )}
              {branchAddr && (
                <div style={{ fontSize: '9px', color: T.slate600, lineHeight: '1.5', maxWidth: '300px' }}>{branchAddr}</div>
              )}
              {branchPhone && (
                <div style={{ fontSize: '9px', color: T.slate600, marginTop: '2px' }}>Ph: {branchPhone}</div>
              )}
              {branchEmail && (
                <div style={{ fontSize: '9px', color: T.slate600 }}>{branchEmail}</div>
              )}
            </div>
          )}
        </div>

{(report.status === 'APPROVED' || report.status === 'RELEASED') && (
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{
              backgroundColor: T.teal,
              color: T.white,
              fontSize: '9px',
              fontWeight: 900,
              letterSpacing: '2px',
              padding: '4px 14px',
              borderRadius: '3px',
              whiteSpace: 'nowrap',
            }}>
              {report.status === 'RELEASED' ? 'RELEASED' : 'APPROVED'}
            </div>
            <div style={{
              width: '38px',
              height: '38px',
              border: `1px solid ${T.border}`,
              borderRadius: '6px',
              background: T.slate50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: T.teal,
                opacity: 0.15,
                position: 'absolute',
              }} />
              <div style={{
                width: '14px',
                height: '8px',
                borderLeft: '2px solid ' + T.teal,
                borderBottom: '2px solid ' + T.teal,
                transform: 'rotate(-45deg)',
                marginTop: '-3px',
              }} />
            </div>
          </div>
        )}
      </div>


     
      <div style={{ margin: '10px 28px', border: `1px solid ${T.border}`, borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '8px 14px', borderBottom: `1px solid ${T.border}`, gap: '12px' }}>
          <div>
            <div style={{ fontSize: '8px', color: T.slate500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patient Name</div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: T.slate900, marginTop: '1px' }}>{booking.patientName || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '8px', color: T.slate500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>UHID</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: T.slate800, marginTop: '1px', fontFamily: 'monospace' }}>{booking.bookingCode || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '8px', color: T.slate500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Age / Gender</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: T.slate800, marginTop: '1px' }}>
              {booking.patientAge ? `${booking.patientAge} Y` : '-'} / {booking.patientGender || '-'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '7px 14px', borderBottom: `1px solid ${T.border}`, gap: '12px', background: T.slate50 }}>
          <div>
            <div style={{ fontSize: '8px', color: T.slate500, fontWeight: 600, textTransform: 'uppercase' }}>Mobile</div>
            <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '1px' }}>{booking.patientMobile || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '8px', color: T.slate500, fontWeight: 600, textTransform: 'uppercase' }}>Email</div>
            <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '1px' }}>{booking.patientEmail || booking.user?.email || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '8px', color: T.slate500, fontWeight: 600, textTransform: 'uppercase' }}>Address</div>
            <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '1px' }}>{booking.address || booking.branch?.address || '-'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '7px 14px', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '8px', color: T.slate500, fontWeight: 600, textTransform: 'uppercase' }}>Booking Code</div>
            <div style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', marginTop: '1px' }}>{booking.bookingCode || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '8px', color: T.slate500, fontWeight: 600, textTransform: 'uppercase' }}>Sample ID</div>
            <div style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', marginTop: '1px' }}>
              {report.sampleId || booking.sampleId || 'SID-' + (booking.bookingCode || '0000').slice(-4)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '8px', color: T.slate500, fontWeight: 600, textTransform: 'uppercase' }}>Collection Type</div>
            <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '1px' }}>
              {booking.collectionMode === 'HOME' ? 'Home Collection' : booking.collectionMode || '-'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '8px', color: T.slate500, fontWeight: 600, textTransform: 'uppercase' }}>Specimen Type</div>
            <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '1px' }}>{report.specimenType || 'Blood (EDTA/Serum)'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '7px 14px', gap: '12px', background: T.slate50, borderTop: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize: '8px', color: T.slate500, fontWeight: 600 }}>Collected:</div>
            <div style={{ fontSize: '9px', fontWeight: 700, marginTop: '1px' }}>{fmt(booking.sampleCollectedAt || booking.scheduledDate)}</div>
          </div>
          <div>
            <div style={{ fontSize: '8px', color: T.slate500, fontWeight: 600 }}>Received:</div>
            <div style={{ fontSize: '9px', fontWeight: 700, marginTop: '1px' }}>{fmt(booking.sampleReceivedAt || booking.updatedAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: '8px', color: T.slate500, fontWeight: 600 }}>Reported:</div>
            <div style={{ fontSize: '9px', fontWeight: 700, marginTop: '1px' }}>{fmt(report.reportedDate)}</div>
          </div>
          <div>
            <div style={{ fontSize: '8px', color: T.slate500, fontWeight: 600 }}>Ref By:</div>
            <div style={{ fontSize: '9px', fontWeight: 700, marginTop: '1px' }}>{doctor?.name || report.doctorName || report.verifiedBy?.name || '-'}</div>
          </div>
        </div>
      </div>

    
      <div style={{
        margin: '0 28px',
        background: T.navy,
        color: T.white,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '7px 14px',
        borderRadius: '4px 4px 0 0',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '2px' }}>LABORATORY REPORT</div>
        <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '1.5px', color: '#94a3b8' }}>CONFIDENTIAL DOCUMENT</div>
      </div>

   
      <div style={{ margin: '0 28px' }}>
        {Object.entries(groupedParams).map(([groupName, params], gi) => (
          <div key={gi}>
            <div style={{
              fontSize: '10px',
              fontWeight: 900,
              color: T.teal,
              padding: '7px 14px 5px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              borderLeft: `3px solid ${T.teal}`,
              marginTop: gi === 0 ? '0' : '6px',
              background: T.tealLight,
            }}>
              {groupName}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${T.border}`, borderTop: 'none' }}>
              <thead>
                <tr style={{ background: T.slate100, borderBottom: `1px solid ${T.border}` }}>
                  {['Parameter', 'Result', 'Unit', 'Reference Range', 'Flag', 'Status'].map((h, i) => (
                    <th key={h} style={{
                      padding: '6px 10px',
                      fontSize: '9px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      color: T.slate700,
                      textAlign: i === 0 ? 'left' : 'center',
                      width: ['35%', '13%', '11%', '20%', '11%', '10%'][i],
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {params.map((p: any, idx: number) => {
                  const { flag, status, color, bg } = getFlag(p);
                  const rowBg = status === 'HIGH' ? T.amberBg : status === 'CRITICAL' ? T.criticalBg : T.white;
                  return (
                    <tr key={idx} style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: rowBg }}>
                      <td style={{ padding: '7px 10px', fontSize: '10px' }}>
                        <span style={{ fontWeight: 600, color: T.slate800 }}>{p.parameterName}</span>
                      </td>
                      <td style={{ padding: '7px 10px', fontSize: '10px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 900, color: status !== 'NORMAL' ? color : T.slate900 }}>{p.observedValue}</span>
                      </td>
                      <td style={{ padding: '7px 10px', fontSize: '10px', textAlign: 'center' }}>
                        <span style={{ color: T.slate500 }}>{p.unit || '-'}</span>
                      </td>
                      <td style={{ padding: '7px 10px', fontSize: '10px', textAlign: 'center' }}>
                        <span style={{ fontFamily: 'monospace', color: T.slate600 }}>{p.referenceRange || '-'}</span>
                      </td>
                      <td style={{ padding: '7px 10px', fontSize: '10px', textAlign: 'center' }}>
                        {status !== 'NORMAL'
                          ? <span style={{ fontWeight: 900, color, fontSize: '9px' }}>{flag}</span>
                          : <span style={{ color: T.slate400 }}>-</span>}
                      </td>
                      <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '8px',
                          fontWeight: 900,
                          backgroundColor: bg,
                          color,
                        }}>
                          {status}
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


      {(report.doctorInterpretation || report.clinicalNotes || report.technicianRemarks || report.doctorRemarks) && (
        <div style={{ margin: '10px 28px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {report.clinicalNotes && (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '5px', padding: '8px 10px', background: T.slate50 }}>
              <div style={{ fontSize: '8px', fontWeight: 900, color: T.teal, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>≡ Clinical Notes</div>
              <div style={{ fontSize: '9px', lineHeight: '1.6', fontStyle: 'italic', color: T.slate600 }}>{report.clinicalNotes}</div>
            </div>
          )}
          {report.technicianRemarks && (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '5px', padding: '8px 10px', background: T.slate50 }}>
              <div style={{ fontSize: '8px', fontWeight: 900, color: T.teal, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Technician Remarks</div>
              <div style={{ fontSize: '9px', lineHeight: '1.6', color: T.slate600 }}>{report.technicianRemarks}</div>
            </div>
          )}
          {report.doctorRemarks && (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '5px', padding: '8px 10px', background: T.slate50, gridColumn: report.clinicalNotes && report.technicianRemarks ? '1 / -1' : 'auto' }}>
              <div style={{ fontSize: '8px', fontWeight: 900, color: T.teal, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Doctor Remarks</div>
              <div style={{ fontSize: '9px', lineHeight: '1.6', color: T.slate700 }}>{report.doctorRemarks}</div>
            </div>
          )}
          {report.doctorInterpretation && (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '5px', padding: '8px 10px', background: T.slate50, gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '8px', fontWeight: 900, color: T.teal, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Doctor Interpretation</div>
              <div style={{ fontSize: '9px', lineHeight: '1.6', color: T.slate700 }}>{report.doctorInterpretation}</div>
            </div>
          )}
        </div>
      )}

      
      {doctor?.name && (
        <div style={{ margin: '14px 28px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-block',
              border: `1px solid ${T.border}`,
              borderRadius: '3px',
              padding: '2px 8px',
              fontSize: '7px',
              color: T.slate600,
              marginBottom: '6px',
              background: T.slate50,
              letterSpacing: '1px',
            }}>
              DIGITALLY SIGNED ✓
            </div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: T.teal }}>{doctor.name}</div>
            {doctor.qualification && (
              <div style={{ fontSize: '8px', color: T.slate600, marginTop: '1px' }}>{doctor.qualification}</div>
            )}
            {doctor.regNo && (
              <div style={{ fontSize: '8px', color: T.slate600, marginTop: '1px' }}>Reg: {doctor.regNo}</div>
            )}
            {doctor.designation && (
              <div style={{ fontSize: '8px', color: T.slate500, fontWeight: 700, marginTop: '1px', textTransform: 'uppercase' }}>{doctor.designation}</div>
            )}
            {doctor.verifiedAt && (
              <div style={{ fontSize: '7px', color: T.slate400, marginTop: '1px' }}>Verified on: {fmt(doctor.verifiedAt)}</div>
            )}
          </div>
        </div>
      )}


      <div style={{
        margin: '14px 28px 0',
        borderTop: `1px solid ${T.border}`,
        paddingTop: '10px',
        paddingBottom: '20px',
      }}>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: T.slate700, marginBottom: '1px' }}>Generated On:</div>
          <div style={{ fontSize: '9px', color: T.slate600 }}>{generatedOn}</div>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: T.slate700, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Disclaimer</div>
          <div style={{ fontSize: '8.5px', color: T.slate600, lineHeight: '1.6' }}>
            This report is intended for interpretation by qualified medical professionals. Laboratory results should always be correlated with the patient's clinical findings. Test results may vary due to physiological conditions, medications, specimen quality, and laboratory methodology. MedsSeva shall not be held responsible for clinical decisions made solely on the basis of this report without appropriate medical consultation.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '10px', paddingTop: '8px', borderTop: `1px solid ${T.border}` }}>
          <div>
            {(branchPhone || branchEmail) && (
              <>
                <div style={{ fontSize: '8px', fontWeight: 700, color: T.slate700, marginBottom: '1px' }}>Support:</div>
                {branchPhone && <div style={{ fontSize: '8px', color: T.slate600 }}>{branchPhone}</div>}
                {branchEmail && <div style={{ fontSize: '8px', color: T.slate600, marginTop: '1px' }}>{branchEmail}</div>}
              </>
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '8px', fontWeight: 700, color: T.slate700, marginBottom: '1px' }}>Website:</div>
            <div style={{ fontSize: '8px', color: T.slate600 }}>www.medsseva.com</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '8px', fontWeight: 700, color: T.slate700 }}>© MedsSeva Diagnostics</div>
            <div style={{ fontSize: '8px', color: T.slate500, marginTop: '1px' }}>All rights reserved.</div>
          </div>
        </div>
      </div>
</div>
  );
};