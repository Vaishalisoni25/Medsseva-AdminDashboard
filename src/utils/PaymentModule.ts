import { loadRazorpayScript } from './razorpay';
import toast from 'react-hot-toast';
import api from '../services/api';

export interface PaymentOptions {
  bookingId: string;
  amount: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  bookingCode?: string;
  description?: string;
  onSuccess: (response: any) => void;
  onFailure?: (error: any) => void;
}

export const processPayment = async (options: PaymentOptions): Promise<void> => {
  const {
    bookingId,
    customerName = '',
    customerPhone = '',
    customerEmail = '',
    bookingCode = '',
    description = 'MedSeva Diagnostic Payment',
    onSuccess,
    onFailure,
  } = options;

  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    toast.error('Payment gateway failed to load. Please check your internet connection.');
    onFailure?.({ message: 'Razorpay SDK failed to load' });
    return;
  }

let orderData: { razorpayOrderId: string; amount: number; currency: string };
  let keyId: string;
try {
    const [configRes, orderRes] = await Promise.all([
      api.get('/payments/config'),
      api.post('/payments/create-order', { bookingId }),
    ]);
    keyId = configRes.data.keyId;
    orderData = orderRes.data;
  } catch (err: any) {
    toast.error(err?.response?.data?.error || 'Failed to create payment order. Please try again.');
    onFailure?.(err);
    return;
  }

  const rzpOptions = {
    key: keyId,
    amount: Math.round(orderData.amount * 100),
    currency: orderData.currency || 'INR',
    name: 'MedSeva',
    description: description,
    order_id: orderData.razorpayOrderId,
    prefill: {
      name: customerName,
      contact: customerPhone,
      email: customerEmail,
    },
    notes: {
      booking_id: bookingId,
      booking_code: bookingCode,
    },
    theme: {
      color: '#006D6F',
    },
    handler: async (response: any) => {
      try {
await api.post('/payments/verify', {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          bookingId,
        });
        onSuccess(response);
      } catch (verifyErr: any) {
        toast.error('Payment verification failed. Please contact support with your payment ID.');
        onFailure?.(verifyErr);
      }
    },
  };

  const rzp = new window.Razorpay(rzpOptions);

  rzp.on('payment.failed', (response: any) => {
    if (onFailure) {
      onFailure(response);
    } else {
      toast.error(response?.error?.description || 'Payment failed. Please try again.');
    }
  });

  rzp.open();
};