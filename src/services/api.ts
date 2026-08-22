import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medsseva_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminUserService = {
  getAdminUsers: () => api.get('/admin-users').then(r => r.data),
  createAdminUser: (data: any) => api.post('/admin-users', data).then(r => r.data),
  updateAdminUser: (id: string, data: any) => api.put(`/admin-users/${id}`, data).then(r => r.data),
  deleteAdminUser: (id: string) => api.delete(`/admin-users/${id}`).then(r => r.data),
};

export const doctorService = {
  getDoctors: (params?: { branchId?: string; cityId?: string; partnerId?: string; search?: string }) =>
    api.get('/doctors', { params }).then(r => r.data),
  getDoctorById: (id: string) => api.get(`/doctors/${id}`).then(r => r.data),
  createDoctor: (data: any) => api.post('/doctors', data).then(r => r.data),
  updateDoctor: (id: string, data: any) => api.put(`/doctors/${id}`, data).then(r => r.data),
  deleteDoctor: (id: string) => api.delete(`/doctors/${id}`).then(r => r.data),
};

export const rbacService = {

  getRoles: () => api.get('/roles').then(r => r.data),
  getRoleById: (id: string) => api.get(`/roles/${id}`).then(r => r.data),
  createRole: (data: any) => api.post('/roles', data).then(r => r.data),
  updateRole: (id: string, data: any) => api.put(`/roles/${id}`, data).then(r => r.data),
  deleteRole: (id: string) => api.delete(`/roles/${id}`).then(r => r.data),
  cloneRole: (id: string) => api.post(`/roles/${id}/clone`).then(r => r.data),
  getAllPermissions: () => api.get('/roles/permissions').then(r => r.data),
  getAuditLogs: () => api.get('/roles/audit-logs').then(r => r.data),
  assignAdminRole: (data: any) => api.post('/roles/admin-users', data).then(r => r.data),
};

export const packageService = {
  getAllPackages: async () => {
    const response = await api.get('/packages');
    return response.data;
  },
  createPackage: async (data: any) => {
    const response = await api.post('/packages', data);
    return response.data;
  },
};

export const testService = {
  getBookings: async () => {
    const response = await api.get('/bookings');
    return response.data;
  },
  updateBookingStatus: async (id: string, status: string) => {
    const response = await api.patch(`/bookings/${id}/status`, { status });
    return response.data;
  },
  getAllTests: async () => {
    const response = await api.get('/tests');
    return response.data;
  },
createTest: async (data: any) => {
    const response = await api.post('/tests', data);
    return response.data;
  },
  updateTest: async (id: string, data: any) => {
    const response = await api.put(`/tests/${id}`, data);
    return response.data;
  },
  addTestParameter: async (testId: string, data: any) => {
    const response = await api.post(`/tests/${testId}/parameters`, data);
    return response.data;
  },
  getTestParameters: async (testId: string) => {
    const response = await api.get(`/tests/${testId}/parameters`);
    return response.data;
  },
  createReport: async (data: any) => {
    const response = await api.post('/reports', data);
    return response.data;
  },
  verifyReport: async (id: string) => {
    const response = await api.patch(`/reports/${id}/verify`);
    return response.data;
  },
 getRegisteredUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },
  updatePaymentStatus: async (id: string, paymentStatus: string, paymentMode?: string) => {
    const response = await api.patch(`/bookings/${id}/payment`, { paymentStatus, paymentMode });
    return response.data;
  },
  assignExecutive: async (id: string, executiveId: string) => {
    const response = await api.patch(`/bookings/${id}/assign-executive`, { executiveId });
    return response.data;
  },
getExecutives: async () => {
    const response = await api.get('/auth/users?role=EXECUTIVE');
    return response.data;
  },
  assignPartner: async (bookingId: string, partnerId: string) => {
    const response = await api.patch(`/bookings/${bookingId}/assign-partner`, { partnerId });
    return response.data;
  },
updateLabStatus: async (id: string, status: string) => {
    const response = await api.patch(`/bookings/${id}/update-lab-status`, { status });
    return response.data;
  },
initiateRazorpayCheckout: async (id: string) => {
    const response = await api.post(`/bookings/${id}/payment-link`);
    return response.data;
  },
  checkPaymentStatus: async (id: string) => {
    const response = await api.get(`/bookings/${id}/payment-link/status`);
    return response.data;
  },
  acceptLabBooking: async (id: string) => {
    const response = await api.patch(`/bookings/${id}/accept-lab`);
    return response.data;
  },
rejectLabBooking: async (id: string, reason: string) => {
    const response = await api.patch(`/bookings/${id}/reject-lab`, { reason });
    return response.data;
  },
  sendInvoice: async (id: string) => {
    const response = await api.post(`/bookings/${id}/send-invoice`);
    return response.data;
  },
  getAvailablePartners: async () => {
    const response = await api.get('/auth/partners/available');
    return response.data;
  },
  getPartners: async (status?: string) => {
    const url = status ? `/auth/partners?status=${status}` : '/auth/partners';
    const response = await api.get(url);
    return response.data;
  },
updatePartnerApproval: async (id: string, approvalStatus: string, rejectionReason?: string) => {
    const response = await api.patch(`/auth/partners/${id}/approval`, { approvalStatus, rejectionReason });
    return response.data;
  },
  getPartnerRatings: async (partnerId: string) => {
    const response = await api.get(`/partner/${partnerId}/ratings`);
    return response.data;
  },
};
export const sampleService = {
  getQueue: () => api.get('/samples/queue').then(r => r.data),
  receiveSample: (data: {
    bookingId: string;
    sampleType: string;
    condition: string;
    notes?: string;
    rejectionReason?: string;
  }) => api.post('/samples/receive', data).then(r => r.data),
  startProcessing: (bookingId: string) =>
    api.patch(`/samples/${bookingId}/process`).then(r => r.data),
};

export const authService = {
  getMe: () => api.get('/auth/me').then(r => r.data),
};

export const couponService = {
  getAll: () => api.get('/coupons').then(r => r.data),
  getById: (id: string) => api.get(`/coupons/${id}`).then(r => r.data),
  create: (data: any) => api.post('/coupons', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/coupons/${id}`, data).then(r => r.data),
  toggleStatus: (id: string, isActive: boolean) => api.patch(`/coupons/${id}/status`, { isActive }).then(r => r.data),
  delete: (id: string) => api.delete(`/coupons/${id}`).then(r => r.data),
  getAnalytics: () => api.get('/coupons/analytics').then(r => r.data),
};

export const financeService = {
  getSummary: () => api.get('/finance/payment-summary').then(r => r.data),
  getPayments: (params?: { page?: number; limit?: number; status?: string; from?: string; to?: string }) =>
    api.get('/finance/payments', { params }).then(r => r.data),
  getPaymentById: (id: string) => api.get(`/finance/payments/${id}`).then(r => r.data),
getConfig: () => api.get('/payments/config').then(r => r.data),
  createOrder: (bookingId: string) => api.post('/payments/create-order', { bookingId }).then(r => r.data),
  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    bookingId: string;
  }) => api.post('/payments/verify', data).then(r => r.data),
  getInvoice: (bookingId: string) => api.get(`/payments/invoice/${bookingId}`).then(r => r.data),
  regenerateInvoice: (bookingId: string) => api.post(`/payments/invoice/${bookingId}/regenerate`).then(r => r.data),
  getRefunds: (status?: string) => api.get('/finance/refunds', { params: status ? { status } : {} }).then(r => r.data),
  requestRefund: (data: { paymentId: string; amount: number; reason: string; approvalNotes?: string }) =>
    api.post('/finance/refunds', data).then(r => r.data),
approveRefund: (id: string) => api.post(`/finance/refunds/${id}/approve`).then(r => r.data),
  executeRefund: (paymentId: string, data: { refundType: 'FULL' | 'PARTIAL'; amount?: number; reason: string }) =>
    api.post(`/finance/payments/${paymentId}/refund`, data).then(r => r.data),
  rejectRefund: (id: string, reason: string) => api.post(`/finance/refunds/${id}/reject`, { reason }).then(r => r.data),
  getSettlements: (status?: string) => api.get('/finance/settlements', { params: status ? { status } : {} }).then(r => r.data),
  generateSettlement: (data: { periodStart: string; periodEnd: string; franchiseName: string; franchiseId?: string; commissionRate?: number }) =>
    api.post('/finance/settlements/generate', data).then(r => r.data),
  processSettlement: (id: string) => api.post(`/finance/settlements/${id}/process`).then(r => r.data),
};
export const analyticsService = {
  getDashboard: (params?: Record<string, string>) => api.get('/analytics/dashboard', { params }).then(r => r.data),
  exportCSV: (params?: Record<string, string>) => api.get('/analytics/export-csv', { params, responseType: 'blob' }).then(r => r.data),
};

export const auditService = {
  getAuditLogs: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    module?: string;
    severity?: string;
    status?: string;
    userId?: string;
    branchId?: string;
    from?: string;
    to?: string;
  }) => api.get('/admin/audit-logs', { params }).then(r => r.data),

  getAuditLogById: (id: string) =>
    api.get(`/admin/audit-logs/${id}`).then(r => r.data),

  getAuditModules: () =>
    api.get('/admin/audit-logs/modules').then(r => r.data),

  exportAuditLogs: (params?: { from?: string; to?: string; module?: string; severity?: string }) =>
    api.get('/admin/audit-logs/export', { params, responseType: 'blob' }).then(r => r.data),

  getApiRequestLogs: (params?: {
    page?: number;
    limit?: number;
    method?: string;
    status?: string;
    search?: string;
    from?: string;
    to?: string;
  }) => api.get('/admin/audit-logs/api-requests', { params }).then(r => r.data),
};

export const cmsService = {
  getBanners: () => api.get('/cms/banners').then(r => r.data),
  createBanner: (data: any) => api.post('/cms/banners', data).then(r => r.data),
  updateBanner: (id: string, data: any) => api.put(`/cms/banners/${id}`, data).then(r => r.data),
  deleteBanner: (id: string) => api.delete(`/cms/banners/${id}`).then(r => r.data),
  uploadBannerImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/cms/banners/upload-image', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  getConfig: () => api.get('/cms/config').then(r => r.data),
  updateConfig: (data: any) => api.put('/cms/config', data).then(r => r.data),
  getAlerts: () => api.get('/cms/alerts').then(r => r.data),
  upsertAlert: (data: any) => api.post('/cms/alerts', data).then(r => r.data),
  deleteAlert: (id: string) => api.delete(`/cms/alerts/${id}`).then(r => r.data),
  getPages: () => api.get('/cms/pages').then(r => r.data),
  updatePage: (slug: string, data: any) => api.put(`/cms/pages/${slug}`, data).then(r => r.data),
  getAuditLogs: () => api.get('/cms/audit-logs').then(r => r.data),
};
export const settingsService = {
  getSettings: () => api.get('/settings').then(r => r.data),
  updateSettings: (data: SettingsUpdateDTO) => api.put('/settings', data).then(r => r.data),
  getVersion: () => api.get('/settings/version').then(r => r.data),
};

export type ReportDeliveryMode = 'AUTO_PUSH' | 'MANUAL_DISPATCH';

export interface SystemSettings {
  id: string;
  minimumHomeCollectionAmount: number;
  homeCollectionCharge: number;
  defaultPartnerCommission: number;
  labOpenTime: string;
  labCloseTime: string;
  reportDeliveryMode: ReportDeliveryMode;
  currency: string;
  timezone: string;
  platformVersion: string;
  maintenanceMode: boolean;
  allowBookings: boolean;
  allowPartnerRegistration: boolean;
  updatedBy: string | null;
  updatedAt: string;
  createdAt: string;
}

export type SettingsUpdateDTO = Partial<Omit<SystemSettings, 'id' | 'updatedBy' | 'updatedAt' | 'createdAt'>>;

export default api;
