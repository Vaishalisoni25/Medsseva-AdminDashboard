import React from 'react';
import { CustomInvoiceTemplate } from '../../types/customFormat';
import { DynamicQRCode } from '../DynamicQRCode';

export interface SampleInvoiceItem {
  id: string;
  name: string;
  code?: string;
  hsnSac?: string;
  category?: string;
  rate: number;
  quantity: number;
  discount: number;
  taxRate: number; // e.g. 5 for 5%
  total: number;
}

export interface LiveInvoicePreviewProps {
  template: Partial<CustomInvoiceTemplate>;
  invoiceData?: any;
  scale?: number;
}

const DEFAULT_SAMPLE_ITEMS: SampleInvoiceItem[] = [
  {
    id: '1',
    name: 'Complete Blood Count (CBC) Automated',
    code: 'HAEM-001',
    hsnSac: '999312',
    category: 'Diagnostic Lab Test',
    rate: 450,
    quantity: 1,
    discount: 50,
    taxRate: 5,
    total: 400,
  },
  {
    id: '2',
    name: 'Comprehensive Lipid Profile Screen',
    code: 'BIO-104',
    hsnSac: '999312',
    category: 'Diagnostic Lab Test',
    rate: 850,
    quantity: 1,
    discount: 150,
    taxRate: 5,
    total: 700,
  },
  {
    id: '3',
    name: 'Thyroid Stimulating Hormone (TSH Ultrasensitive)',
    code: 'IMM-301',
    hsnSac: '999312',
    category: 'Immunoassay',
    rate: 400,
    quantity: 1,
    discount: 50,
    taxRate: 5,
    total: 350,
  },
  {
    id: '4',
    name: 'Liver Function Test (LFT) 10 Parameters',
    code: 'BIO-202',
    hsnSac: '999312',
    category: 'Clinical Biochemistry',
    rate: 800,
    quantity: 1,
    discount: 100,
    taxRate: 5,
    total: 700,
  },
];

export const LiveInvoicePreview: React.FC<LiveInvoicePreviewProps> = ({
  template,
  invoiceData,
  scale = 1,
}) => {
  const isDetailed = template.type === 'DETAILED';
  const branding = template.branding || {};
  const design = template.designSettings || {};
  const fields = template.fieldSettings || {
    showPatientDetails: true,
    showBillingDetails: true,
    showPaymentMethod: true,
    showTransactionId: true,
    showTaxBreakdown: true,
    showDiscountBreakdown: true,
    showCouponDetails: true,
    showAmountInWords: true,
    showBankDetails: true,
    showTerms: true,
    showSignature: true,
    showStamp: true,
  };
  const qr = template.qrSettings || {
    enabled: true,
    position: 'header_right',
    size: 48,
    alignment: 'right',
    label: 'Scan to verify invoice',
  };
  const footer = template.footerSettings || {
    customFooterText: 'Thank you for choosing MedsSeva Diagnostics for your healthcare needs.',
    termsAndConditions: '1. This is a computer-generated tax invoice and does not require a physical signature.\n2. Lab reports will be delivered within standard turnaround time (24-48 hours).\n3. Any discrepancy must be reported within 48 hours of billing.',
    bankName: 'HDFC Bank Ltd.',
    accountNumber: '50200088192341',
    ifscCode: 'HDFC0001234',
    accountHolder: 'MEDSSEVA GLOBAL HEALTHCARE PVT LTD',
    upiId: 'medsseva@hdfcbank',
    registeredOffice: 'G-130 Basement Office No 01, Sector 63, Noida, Uttar Pradesh - 201301',
  };

  const primaryColor = design.primaryColor || (isDetailed ? '#005C55' : '#0F766E');
  const secondaryColor = design.secondaryColor || '#0D9488';
  const textColor = design.textColor || '#0f172a';
  const fontFamily = design.fontFamily || "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const lab = {
    name: branding.labName || 'MEDSSEVA GLOBAL HEALTHCARE PVT LTD',
    branch: branding.branchName || 'Central Processing Diagnostic Laboratory',
    tagline: branding.tagline || 'Smart Diagnostics. Better Care.',
    address: branding.address || 'G-130 Basement Office No 01, Sector 63, Noida, Uttar Pradesh - 201301',
    phone: branding.phone || '+91 84480 30936',
    email: branding.email || 'billing@medsseva.com',
    website: branding.website || 'www.medsseva.com',
    gstin: branding.gstin || '09AATCM6853F1ZU',
    pan: branding.pan || 'AAFCO021L',
    cin: branding.cin || 'U85110MH2021PTC362145',
    logoUrl: template.logoUrl || '/trusted-partner.jpg',
  };

  const invoice = {
    number: invoiceData?.invoiceNumber || 'INV-2026-004812',
    receiptNumber: invoiceData?.receiptNumber || 'REC-2026-004812',
    date: invoiceData?.date || '12/03/2026',
    dueDate: invoiceData?.dueDate || 'Immediate',
    status: invoiceData?.status || 'PAID',
    paymentMethod: invoiceData?.paymentMethod || 'Online (Razorpay / UPI)',
    transactionId: invoiceData?.transactionId || 'pay_P92kL109zM821a',
    bookingCode: invoiceData?.bookingCode || 'MEDS-88219',
    patientName: invoiceData?.patientName || 'Mr. Rajesh Kumar Verma',
    patientId: invoiceData?.patientId || 'UHID-2026-98124',
    patientAge: invoiceData?.patientAge || 42,
    patientGender: invoiceData?.patientGender || 'Male',
    patientMobile: invoiceData?.patientMobile || '+91 98765 43210',
    patientEmail: invoiceData?.patientEmail || 'rajesh.verma@example.com',
    patientAddress: invoiceData?.address || 'H.No 412, Sector 14, Urban Estate, Gurugram, Haryana - 122001',
    billTo: invoiceData?.billTo || 'Self / Patient',
  };

  const items = (invoiceData?.items as SampleInvoiceItem[]) || DEFAULT_SAMPLE_ITEMS;
  const subtotal = items.reduce((acc, item) => acc + item.rate * item.quantity, 0);
  const totalDiscount = items.reduce((acc, item) => acc + item.discount, 0);
  const taxableAmount = subtotal - totalDiscount;
  const cgst = Math.round((taxableAmount * 0.025) * 100) / 100;
  const sgst = Math.round((taxableAmount * 0.025) * 100) / 100;
  const totalTax = cgst + sgst;
  const grandTotal = taxableAmount + totalTax;

  const currentScale = scale || 1;
  const scaledWidth = Math.round(794 * currentScale);
  const scaledHeight = Math.round(1123 * currentScale);

  return (
    <div
      className="live-invoice-preview-wrapper inline-block mx-auto max-w-full select-none"
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        overflow: 'visible',
      }}
    >
      <div
        className="live-invoice-preview-container flex flex-col"
        style={{
          transform: currentScale !== 1 ? `scale(${currentScale})` : undefined,
          transformOrigin: 'top left',
          width: '794px',
          transition: 'transform 0.15s ease',
        }}
      >
        <div
          className="a4-page-sheet shadow-2xl relative bg-white border border-slate-300 print:border-0"
        style={{
          width: '794px',
          minHeight: '1123px',
          height: '1123px',
          boxSizing: 'border-box',
          margin: '0 auto 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily,
          color: textColor,
          padding: '28px 36px 20px',
        }}
      >
        {/* ============================================================ */}
        {/* 1. HEADER SECTION */}
        {/* ============================================================ */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingBottom: '12px',
              borderBottom: `2.5px solid ${primaryColor}`,
            }}
          >
            {/* Lab Branding & Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '340px' }}>
              {lab.logoUrl ? (
                <img
                  src={lab.logoUrl}
                  alt="Lab Logo"
                  style={{ maxHeight: '55px', maxWidth: '160px', objectFit: 'contain' }}
                  crossOrigin="anonymous"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    backgroundColor: primaryColor,
                    color: '#ffffff',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 900,
                    fontSize: '16px',
                  }}
                >
                  {lab.name.slice(0, 3).toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: primaryColor, lineHeight: '1.2' }}>
                  {lab.name}
                </div>
                <div style={{ fontSize: '8px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                  {lab.tagline}
                </div>
                <div style={{ fontSize: '7.5px', color: '#475569', marginTop: '3px', lineHeight: '1.3' }}>
                  {lab.address}
                </div>
              </div>
            </div>

            {/* Invoice Meta & QR Code */}
            <div style={{ textAlign: 'right', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: primaryColor, letterSpacing: '0.5px' }}>
                  {isDetailed ? 'TAX INVOICE' : 'LAB INVOICE'}
                </div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  Invoice No: <span style={{ fontFamily: 'monospace' }}>{invoice.number}</span>
                </div>
                <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '1px' }}>
                  Date: {invoice.date}
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    marginTop: '4px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                    fontSize: '8px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                  }}
                >
                  ● {invoice.status}
                </div>
              </div>

              {qr.enabled && qr.position === 'header_right' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <DynamicQRCode
                    value={`https://medsseva.com/verify-invoice/${invoice.bookingCode}`}
                    size={qr.size || 48}
                    label={qr.label || 'Scan to verify'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Company Meta Sub-Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 0',
              borderBottom: '1px solid #e2e8f0',
              fontSize: '8px',
              color: '#64748b',
            }}
          >
            <span><strong>GSTIN:</strong> {lab.gstin}</span>
            <span><strong>PAN:</strong> {lab.pan}</span>
            {isDetailed && <span><strong>CIN:</strong> {lab.cin}</span>}
            <span><strong>Phone:</strong> {lab.phone}</span>
            <span><strong>Email:</strong> {lab.email}</span>
          </div>

          {/* ============================================================ */}
          {/* 2. PATIENT & BILLING DETAILS */}
          {/* ============================================================ */}
          <div
            style={{
              margin: '12px 0 16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '10px 14px',
            }}
          >
            {/* Left: Patient Details */}
            {fields.showPatientDetails && (
              <div>
                <div style={{ fontSize: '9.5px', fontWeight: 900, color: primaryColor, textTransform: 'uppercase', marginBottom: '4px', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
                  Patient Information
                </div>
                <table style={{ borderCollapse: 'collapse', fontSize: '9px', lineHeight: '1.6', width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', width: '70px', fontWeight: 600 }}>Name</td>
                      <td style={{ width: '8px', color: '#64748b' }}>:</td>
                      <td style={{ fontWeight: 800, color: '#0f172a' }}>{invoice.patientName}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', fontWeight: 600 }}>Patient ID</td>
                      <td style={{ color: '#64748b' }}>:</td>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>{invoice.patientId}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', fontWeight: 600 }}>Age / Gender</td>
                      <td style={{ color: '#64748b' }}>:</td>
                      <td style={{ color: '#0f172a' }}>{invoice.patientAge} Yrs / {invoice.patientGender}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', fontWeight: 600 }}>Mobile</td>
                      <td style={{ color: '#64748b' }}>:</td>
                      <td style={{ color: '#0f172a' }}>{invoice.patientMobile}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Right: Booking & Billing Details */}
            {fields.showBillingDetails && (
              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '14px' }}>
                <div style={{ fontSize: '9.5px', fontWeight: 900, color: primaryColor, textTransform: 'uppercase', marginBottom: '4px', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
                  Billing & Payment Details
                </div>
                <table style={{ borderCollapse: 'collapse', fontSize: '9px', lineHeight: '1.6', width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', width: '90px', fontWeight: 600 }}>Booking Code</td>
                      <td style={{ width: '8px', color: '#64748b' }}>:</td>
                      <td style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>{invoice.bookingCode}</td>
                    </tr>
                    {fields.showPaymentMethod && (
                      <tr>
                        <td style={{ color: '#64748b', fontWeight: 600 }}>Payment Method</td>
                        <td style={{ color: '#64748b' }}>:</td>
                        <td style={{ color: '#0f172a', fontWeight: 700 }}>{invoice.paymentMethod}</td>
                      </tr>
                    )}
                    {fields.showTransactionId && (
                      <tr>
                        <td style={{ color: '#64748b', fontWeight: 600 }}>Transaction ID</td>
                        <td style={{ color: '#64748b' }}>:</td>
                        <td style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '8px' }}>{invoice.transactionId}</td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ color: '#64748b', fontWeight: 600 }}>Receipt Number</td>
                      <td style={{ color: '#64748b' }}>:</td>
                      <td style={{ color: '#0f172a', fontFamily: 'monospace' }}>{invoice.receiptNumber}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* 3. ITEMIZED TESTS / SERVICES TABLE */}
          {/* ============================================================ */}
          <div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #cbd5e1',
                fontSize: '9px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: primaryColor, color: '#ffffff' }}>
                  <th style={{ padding: '7px 8px', textAlign: 'center', width: '32px' }}>#</th>
                  <th style={{ padding: '7px 10px', textAlign: 'left', width: isDetailed ? '35%' : '45%' }}>INVESTIGATION / ITEM DESCRIPTION</th>
                  {isDetailed && <th style={{ padding: '7px 8px', textAlign: 'center', width: '12%' }}>HSN / SAC</th>}
                  <th style={{ padding: '7px 8px', textAlign: 'right', width: '15%' }}>RATE (₹)</th>
                  <th style={{ padding: '7px 8px', textAlign: 'center', width: '8%' }}>QTY</th>
                  <th style={{ padding: '7px 8px', textAlign: 'right', width: '15%' }}>DISC (₹)</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right', width: '15%' }}>AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                    }}
                  >
                    <td style={{ padding: '6px 8px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.name}</div>
                      {isDetailed && item.code && (
                        <div style={{ fontSize: '7.5px', color: '#64748b' }}>Code: {item.code}</div>
                      )}
                    </td>
                    {isDetailed && (
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'monospace', color: '#64748b' }}>
                        {item.hsnSac || '999312'}
                      </td>
                    )}
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {item.rate.toFixed(2)}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', color: '#64748b' }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#dc2626', fontFamily: 'monospace' }}>
                      {item.discount > 0 ? `- ₹${item.discount.toFixed(2)}` : '0.00'}
                    </td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                      ₹{item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============================================================ */}
          {/* 4. TOTALS & BREAKDOWN */}
          {/* ============================================================ */}
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'flex-start' }}>
            {/* Left: Bank Details & Amount in Words */}
            <div>
              {fields.showAmountInWords && (
                <div style={{ padding: '6px 10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '8px' }}>
                  <strong style={{ color: '#166534' }}>Amount in Words: </strong>
                  <span style={{ color: '#14532d', textTransform: 'capitalize' }}>
                    Rupees Two Thousand Two Hundred Fifty Only
                  </span>
                </div>
              )}

              {fields.showBankDetails && footer.bankName && (
                <div style={{ marginTop: '8px', padding: '8px 10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '8px' }}>
                  <div style={{ fontWeight: 800, color: primaryColor, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Bank & UPI Transfer Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', color: '#475569' }}>
                    <div><strong>Bank:</strong> {footer.bankName}</div>
                    <div><strong>A/C No:</strong> {footer.accountNumber}</div>
                    <div><strong>IFSC:</strong> {footer.ifscCode}</div>
                    <div><strong>UPI ID:</strong> {footer.upiId}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Calculations Box */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 14px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', lineHeight: '1.7' }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#64748b' }}>Item Gross Subtotal</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>₹{subtotal.toFixed(2)}</td>
                  </tr>
                  {fields.showDiscountBreakdown && totalDiscount > 0 && (
                    <tr>
                      <td style={{ color: '#dc2626' }}>Special Discount</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#dc2626', fontWeight: 600 }}>- ₹{totalDiscount.toFixed(2)}</td>
                    </tr>
                  )}
                  {fields.showTaxBreakdown && (
                    <>
                      <tr>
                        <td style={{ color: '#64748b' }}>CGST (2.5%)</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹{cgst.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b' }}>SGST (2.5%)</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹{sgst.toFixed(2)}</td>
                      </tr>
                    </>
                  )}
                  <tr style={{ borderTop: `2px solid ${primaryColor}`, paddingTop: '4px' }}>
                    <td style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a', paddingTop: '4px' }}>TOTAL PAID</td>
                    <td style={{ textAlign: 'right', fontSize: '13px', fontWeight: 900, color: primaryColor, fontFamily: 'monospace', paddingTop: '4px' }}>
                      ₹{grandTotal.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 5. TERMS & CONDITIONS */}
          {/* ============================================================ */}
          {fields.showTerms && footer.termsAndConditions && (
            <div style={{ marginTop: '12px', padding: '6px 10px', border: '1px dashed #cbd5e1', borderRadius: '4px', fontSize: '7.5px', color: '#64748b', lineHeight: '1.4' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '2px', textTransform: 'uppercase' }}>Terms & Conditions</div>
              <div style={{ whiteSpace: 'pre-line' }}>{footer.termsAndConditions}</div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 6. FOOTER & MANDATORY BRANDING */}
        {/* ============================================================ */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingTop: '8px',
              borderTop: '1px solid #e2e8f0',
              marginBottom: '8px',
            }}
          >
            {/* Left: Registered Office */}
            <div style={{ fontSize: '7.5px', color: '#64748b', maxWidth: '380px' }}>
              <div><strong>Registered Office:</strong> {footer.registeredOffice || lab.address}</div>
              <div>CIN: {lab.cin} • ISO 9001:2015 & NABL Compliant Facility</div>
            </div>

            {/* Right: Signature */}
            {fields.showSignature && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9px', fontStyle: 'italic', color: '#94a3b8', height: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                  [Digitally Generated Document]
                </div>
                <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#0f172a' }}>Authorized Billing Signatory</div>
                <div style={{ fontSize: '7px', color: '#64748b' }}>MedsSeva Global Healthcare Accounts</div>
              </div>
            )}
          </div>

          {/* Bottom Bar: Mandatory Powered by Medsseva */}
          <div
            style={{
              borderTop: `1.5px solid ${primaryColor}`,
              paddingTop: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '8px',
              color: '#64748b',
            }}
          >
            <div>
              {footer.customFooterText || 'Thank you for your business.'}
            </div>

            {/* MANDATORY POWERED BY MEDSSEVA */}
            <div style={{ fontWeight: 800, color: '#0f172a' }}>
              Powered by <span style={{ color: primaryColor }}>Medsseva</span>
            </div>

            <div>
              Page 1 of 1
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
