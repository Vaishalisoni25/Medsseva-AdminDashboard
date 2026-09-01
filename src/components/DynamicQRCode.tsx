import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface DynamicQRCodeProps {
  value: string;
  size?: number;
  label?: string;
  className?: string;
}

export const DynamicQRCode: React.FC<DynamicQRCodeProps> = ({
  value,
  size = 50,
  label = 'SCAN TO VERIFY',
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (!value) return;

    QRCode.toDataURL(value, {
      margin: 1,
      width: Math.max(120, size * 2.5),
      color: {
        dark: '#004d4f',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.error('[DynamicQRCode] Generation error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '3px',
      }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="Verification QR Code"
          width={size}
          height={size}
          style={{
            display: 'block',
            borderRadius: '3px',
            border: '1px solid #e2e8f0',
            width: `${size}px`,
            height: `${size}px`,
          }}
        />
      ) : (
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '3px',
          }}
        />
      )}
      {label && (
        <div
          style={{
            fontSize: '7px',
            color: '#64748b',
            fontWeight: 700,
            textAlign: 'center',
            letterSpacing: '0.3px',
            lineHeight: '1.1',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

export default DynamicQRCode;
