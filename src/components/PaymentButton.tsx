import React, { useState } from 'react';
import { processPayment } from '../utils/PaymentModule';
import toast from 'react-hot-toast';
import { CreditCard, Loader2 } from 'lucide-react';

interface PaymentButtonProps {
  bookingId: string;
  amount: number;
  bookingCode?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  label?: string;
  className?: string;
  onSuccess?: (response: any) => void;
  onFailure?: (error: any) => void;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  bookingId,
  amount,
  bookingCode,
  customerName,
  customerPhone,
  customerEmail,
  label,
  className,
  onSuccess,
  onFailure,
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await processPayment({
      bookingId,
      amount,
      bookingCode,
      customerName,
      customerPhone,
      customerEmail,
      description: `MedSeva Booking ${bookingCode || ''}`,
      onSuccess: (response) => {
        setLoading(false);
        toast.success('Payment successful!');
        onSuccess?.(response);
      },
      onFailure: (error) => {
        setLoading(false);
        onFailure?.(error);
      },
    });
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={
        className ||
        'px-4 py-2 bg-[#006d6f] text-white text-xs font-bold rounded-lg hover:bg-[#00595b] disabled:opacity-50 transition-colors flex items-center gap-2'
      }
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CreditCard className="h-3.5 w-3.5" />
      )}
      {loading ? 'Opening Checkout...' : (label || `Collect Payment ₹${amount}`)}
    </button>
  );
};