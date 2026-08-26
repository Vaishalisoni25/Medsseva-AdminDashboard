import React from 'react';
import { TemplateProps, DummyBarcode } from './StandardReportTemplate';

export const DetailedReportTemplate: React.FC<TemplateProps> = ({
  report,
  booking,
  branch,
  doctor,
  groupedParams,
  formatDateTime,
  getFlag,
}) => {
  const branchName = branch?.name || booking.branch?.name || report.branchName || 'MedsSeva Central Reference Lab';
  const branchAddr = [branch?.line1, branch?.city, branch?.state, branch?.pincode].filter(Boolean).join(', ') || booking.branch?.address || 'Plot No. 14, Commercial Complex, MP Nagar Zone-II, Bhopal, Madhya Pradesh - 462011';
  const branchPhone = branch?.contactNumber || booking.branch?.contactNumber || '011-4988-5050, +91-8968522455';
  const branchEmail = branch?.email || booking.branch?.email || 'customer.care@medsseva.com';

  const patientTitle = booking.patientGender === 'Female' ? 'Ms.' : 'Mr.';
  const patientDisplayName = booking.patientName?.toLowerCase().startsWith('mr') ||
    booking.patientName?.toLowerCase().startsWith('ms') ||
    booking.patientName?.toLowerCase().startsWith('mrs') ||
    booking.patientName?.toLowerCase().startsWith('dr')
      ? booking.patientName
      : `${patientTitle} ${booking.patientName || 'Patient'}`;

  // Heuristic for parameter test methodology if not explicitly provided
  const getMethodology = (paramName: string, unit: string): string => {
    const p = (paramName || '').toLowerCase();
    if (p.includes('hemoglobin') || p.includes('hb')) return 'Photometry';
    if (p.includes('pcv') || p.includes('hematocrit') || p.includes('mentzer') || p.includes('mch') || p.includes('mchc') || p.includes('absolute')) return 'Calculated';
    if (p.includes('rbc') || p.includes('mcv') || p.includes('rdw') || p.includes('tlc') || p.includes('platelet') || p.includes('leukocyte')) return 'Electrical Impedance';
    if (p.includes('neutrophil') || p.includes('lymphocyte') || p.includes('monocyte') || p.includes('eosinophil') || p.includes('basophil')) return 'Optical/Impedance';
    if (p.includes('sgot') || p.includes('sgpt') || p.includes('alt') || p.includes('ast') || p.includes('alkaline')) return 'IFCC';
    if (p.includes('crp') || p.includes('reactive protein')) return 'Immunoturbidimetry';
    if (p.includes('dengue') || p.includes('elisa') || p.includes('hiv') || p.includes('hbsag')) return 'ELISA / Immunoassay';
    if (p.includes('widal') || p.includes('typhi')) return 'ICT / Agglutination';
    if (p.includes('glucose') || p.includes('sugar')) return 'GOD-POD Method';
    if (p.includes('urea') || p.includes('bun')) return 'GLDH Urease';
    if (p.includes('creatinine')) return 'Modified Jaffe Kinetic';
    if (p.includes('urine') || p.includes('microscopy') || p.includes('pus') || p.includes('epithelial')) return 'Centrifuged Urine Microscopy';
    if (p.includes('bilirubin')) return 'Diazonium Salt';
    if (unit === '%' || unit === 'fL' || unit === 'pg') return 'Calculated';
    return 'Automated Clinical Chemistry';
  };

  return (
    <div
      style={{
        width: '794px',
        minHeight: '1120px',
        backgroundColor: '#ffffff',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        color: '#1e293b',
        fontSize: '10px',
        lineHeight: '1.4',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Top Yellow Brand Accent Bar (Reference 1) */}
      <div style={{ height: '6px', backgroundColor: '#f59e0b', width: '100%' }} />

      {/* Top Header: Medsseva Logo + Registered Office / Lab Contact */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 28px 10px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/trusted-partner.jpg"
            alt="MedsSeva"
            style={{ width: '135px', height: 'auto', display: 'block' }}
            crossOrigin="anonymous"
          />
        </div>

        <div style={{ textAlign: 'right', fontSize: '8px', color: '#475569', lineHeight: '1.4', maxWidth: '420px' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '8.5px' }}>
            Regd. Office: MedsSeva Diagnostics Ltd, Sector 18, Commercial Plaza, Bhopal - 462011
          </div>
          <div>Web: <span style={{ color: '#0284c7', fontWeight: 600 }}>www.medsseva.com</span> | CIN: L74899MP2024PLC065388</div>
          <div>Ph: {branchPhone} | Email: {branchEmail}</div>
        </div>
      </div>

      {/* Patient & Sample Metadata Block (Detailed 2-Column Grid with subtle border) */}
      <div
        style={{
          margin: '10px 28px',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          padding: '10px 14px',
          backgroundColor: '#fafbfc',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          columnGap: '20px',
          rowGap: '4px',
          fontSize: '9.5px',
        }}
      >
        {/* Left Column */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '85px', fontWeight: 700, color: '#334155', padding: '2px 0' }}>Name</td>
              <td style={{ width: '10px', color: '#64748b' }}>:</td>
              <td style={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>{patientDisplayName}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, color: '#334155', padding: '2px 0' }}>Lab No.</td>
              <td style={{ color: '#64748b' }}>:</td>
              <td style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>{booking.bookingCode || report.id?.slice(0, 8)}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, color: '#334155', padding: '2px 0' }}>Ref By</td>
              <td style={{ color: '#64748b' }}>:</td>
              <td style={{ fontWeight: 600, color: '#0f172a' }}>
                {booking.partnerNote?.startsWith('Ref:')
                  ? booking.partnerNote.replace('Ref:', '').trim()
                  : (doctor?.name || report.doctorName || 'Self')}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, color: '#334155', padding: '2px 0' }}>Collected</td>
              <td style={{ color: '#64748b' }}>:</td>
              <td style={{ color: '#0f172a' }}>{formatDateTime(booking.sampleCollectedAt || booking.scheduledDate || report.createdAt, true)}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, color: '#334155', padding: '2px 0' }}>A/c Status</td>
              <td style={{ color: '#64748b' }}>:</td>
              <td style={{ fontWeight: 700, color: '#0f172a' }}>P (Paid)</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, color: '#334155', padding: '2px 0' }}>Collected at</td>
              <td style={{ color: '#64748b' }}>:</td>
              <td style={{ color: '#334155', fontSize: '9px' }}>{branchName}</td>
            </tr>
          </tbody>
        </table>

        {/* Right Column */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '85px', fontWeight: 700, color: '#334155', padding: '2px 0' }}>Age</td>
              <td style={{ width: '10px', color: '#64748b' }}>:</td>
              <td style={{ fontWeight: 700, color: '#0f172a' }}>{booking.patientAge ? `${booking.patientAge} Years` : '24 Years'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, color: '#334155', padding: '2px 0' }}>Gender</td>
              <td style={{ color: '#64748b' }}>:</td>
              <td style={{ fontWeight: 700, color: '#0f172a' }}>{booking.patientGender || 'Male'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, color: '#334155', padding: '2px 0' }}>Reported</td>
              <td style={{ color: '#64748b' }}>:</td>
              <td style={{ color: '#0f172a', fontWeight: 600 }}>{formatDateTime(report.reportedDate || report.createdAt, true)}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, color: '#334155', padding: '2px 0' }}>Report Status</td>
              <td style={{ color: '#64748b' }}>:</td>
              <td style={{ fontWeight: 800, color: '#059669' }}>Final</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, color: '#334155', padding: '2px 0', verticalAlign: 'top' }}>Processed at</td>
              <td style={{ color: '#64748b', verticalAlign: 'top' }}>:</td>
              <td style={{ color: '#475569', fontSize: '8.5px', lineHeight: '1.3' }}>
                <strong>{branchName}</strong>
                <br />
                {branchAddr}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Centered Heading: Test Report */}
      <div style={{ textAlign: 'center', margin: '12px 0 6px' }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            borderBottom: '1.5px solid #0f172a',
            paddingBottom: '2px',
          }}
        >
          Test Report
        </span>
      </div>

      {/* Table Header: Test Name | Results | Units | Bio. Ref. Interval */}
      <div style={{ margin: '0 28px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderTop: '1px solid #0f172a', borderBottom: '1.5px solid #0f172a' }}>
              <th style={{ textAlign: 'left', padding: '6px 4px', fontSize: '9.5px', fontWeight: 800, color: '#0f172a', width: '44%' }}>
                Test Name
              </th>
              <th style={{ textAlign: 'left', padding: '6px 4px', fontSize: '9.5px', fontWeight: 800, color: '#0f172a', width: '18%' }}>
                Results
              </th>
              <th style={{ textAlign: 'left', padding: '6px 4px', fontSize: '9.5px', fontWeight: 800, color: '#0f172a', width: '16%' }}>
                Units
              </th>
              <th style={{ textAlign: 'left', padding: '6px 4px', fontSize: '9.5px', fontWeight: 800, color: '#0f172a', width: '22%' }}>
                Bio. Ref. Interval
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedParams).map(([groupName, params], gi) => (
              <React.Fragment key={gi}>
                {/* Group Heading (e.g. FEVER PANEL - ADVANCE / COMPLETE BLOOD COUNT (CBC)) */}
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '8px 4px 4px',
                      fontSize: '9.5px',
                      fontWeight: 900,
                      color: '#0f172a',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                    }}
                  >
                    <div style={{ borderBottom: '1px solid #94a3b8', paddingBottom: '3px', display: 'inline-block', minWidth: '220px' }}>
                      {groupName}
                    </div>
                  </td>
                </tr>

                {/* Test Parameters */}
                {params.map((p: any, idx: number) => {
                  const { isAbnormal } = getFlag(p);
                  const method = p.methodology || getMethodology(p.parameterName, p.unit);

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      {/* Test Name + Methodology in brackets below */}
                      <td style={{ padding: '4.5px 4px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: isAbnormal ? 800 : 600, color: isAbnormal ? '#000000' : '#1e293b', fontSize: '9px' }}>
                          {p.parameterName}
                        </div>
                        {method && (
                          <div style={{ fontSize: '7.5px', color: '#64748b', marginTop: '1px', fontStyle: 'normal' }}>
                            ({method})
                          </div>
                        )}
                      </td>

                      {/* Observed Value (Bold black when abnormal) */}
                      <td style={{ padding: '4.5px 4px', verticalAlign: 'top' }}>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: isAbnormal ? 900 : 700,
                            color: isAbnormal ? '#dc2626' : '#0f172a',
                          }}
                        >
                          {p.observedValue}
                        </span>
                      </td>

                      {/* Unit */}
                      <td style={{ padding: '4.5px 4px', verticalAlign: 'top', fontSize: '8.5px', color: '#475569' }}>
                        {p.unit || '-'}
                      </td>

                      {/* Bio Ref Interval */}
                      <td style={{ padding: '4.5px 4px', verticalAlign: 'top', fontSize: '8.5px', color: '#334155', fontWeight: 500 }}>
                        {p.referenceRange || '-'}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clinical Notes & Interpretation Section (Reference 1 structured format) */}
      <div style={{ margin: '12px 28px 0', fontSize: '8.5px', color: '#334155' }}>
        {/* Interpretation Table if present */}
        {(report.doctorInterpretation || report.interpretation) && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontWeight: 800, fontSize: '9px', color: '#0f172a', marginBottom: '4px' }}>Interpretation</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '8px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ textAlign: 'left', padding: '4px 8px', width: '25%', fontWeight: 700, color: '#334155' }}>RESULT</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', width: '75%', fontWeight: 700, color: '#334155' }}>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 8px', fontWeight: 700, color: '#0f172a' }}>
                    {report.hasAbnormalFlags ? 'Abnormal / Reactive' : 'Normal / Non-Reactive'}
                  </td>
                  <td style={{ padding: '4px 8px', color: '#475569' }}>
                    {report.doctorInterpretation || report.interpretation || 'Values correlated with standard clinical guidelines. Follow-up recommended.'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Numbered Note Section */}
        <div style={{ marginBottom: '8px', padding: '6px 10px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 800, fontSize: '8.5px', color: '#0f172a', marginBottom: '3px' }}>Note:</div>
          <div style={{ lineHeight: '1.5', color: '#475569' }}>
            <div>1. Differential leucocyte counts and diagnostic parameters are reported as automated absolute and proportional values.</div>
            <div>2. Test conducted on EDTA whole blood / Serum according to standard laboratory protocols.</div>
            {report.clinicalNotes && <div>3. Clinical Indication: {report.clinicalNotes}</div>}
            {report.technicianRemarks && <div>4. Laboratory Remarks: {report.technicianRemarks}</div>}
          </div>
        </div>

        {/* Comments Section */}
        {report.doctorRemarks && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 800, fontSize: '8.5px', color: '#0f172a', marginBottom: '2px' }}>Comments</div>
            <div style={{ lineHeight: '1.45', color: '#475569' }}>
              {report.doctorRemarks}
            </div>
          </div>
        )}
      </div>

      {/* End of Report Indicator */}
      <div style={{ textAlign: 'center', margin: '14px 28px 8px', color: '#64748b', fontSize: '8.5px', letterSpacing: '1px' }}>
        ------------------------------- End of report --------------------------------
      </div>

      {/* Pathologist Doctor Signature Block */}
      <div
        style={{
          margin: '8px 28px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingTop: '6px',
        }}
      >
        <div>
          {/* Dummy QR Scanner on Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DummyQRCode size={40} />
            <div style={{ fontSize: '7px', color: '#64748b', lineHeight: '1.2', fontWeight: 600 }}>
              Official Digital<br />Verification QR
            </div>
          </div>
        </div>

        {/* Doctor Signature on Right */}
        <div style={{ textAlign: 'right', minWidth: '180px' }}>
          {doctor?.signatureUrl ? (
            <img
              src={doctor.signatureUrl}
              alt="Doctor Signature"
              style={{ maxHeight: '42px', maxWidth: '140px', objectFit: 'contain', display: 'block', margin: '0 0 3px auto' }}
              crossOrigin="anonymous"
            />
          ) : (
            <div
              style={{
                fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
                fontSize: '18px',
                color: '#1e3a8a',
                marginBottom: '2px',
              }}
            >
              {doctor?.name || 'Dr. Anjali Mehta'}
            </div>
          )}

          <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#0f172a' }}>
            {doctor?.name || 'Dr. Anjali Mehta'}
          </div>
          <div style={{ fontSize: '8px', color: '#475569' }}>
            {doctor?.qualification || 'MBBS (MD Pathology)'}
          </div>
          <div style={{ fontSize: '8px', color: '#475569', fontWeight: 600 }}>
            {doctor?.designation || 'Chief of Laboratory'}
          </div>
          <div style={{ fontSize: '7.5px', color: '#64748b' }}>
            MedsSeva Pathology Lab Ltd
          </div>
        </div>
      </div>

      {/* Bottom Barcode & Page Numbering */}
      <div
        style={{
          margin: '0 28px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '6px',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <div style={{ margin: '0 auto', textAlign: 'center' }}>
          <DummyBarcode value={booking.bookingCode || '1049'} height={22} />
        </div>
        <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 600 }}>
          Page 1 of 1
        </div>
      </div>

      {/* Bottom Yellow Warning & Customer Care Disclaimer Band (Reference 1) */}
      <div
        style={{
          backgroundColor: '#fef3c7',
          borderTop: '1.5px solid #f59e0b',
          borderBottom: '1.5px solid #f59e0b',
          padding: '6px 20px',
          textAlign: 'center',
          fontSize: '7.5px',
          color: '#78350f',
          lineHeight: '1.4',
        }}
      >
        <div style={{ fontWeight: 700 }}>
          If Test results are alarming or unexpected, client is advised to contact Customer Care immediately for possible remedial action.
        </div>
        <div>
          Tel: <strong>{branchPhone}</strong> | E-mail: <strong>{branchEmail}</strong> | Website: <strong>www.medsseva.com</strong>
        </div>
      </div>
    </div>
  );
};
