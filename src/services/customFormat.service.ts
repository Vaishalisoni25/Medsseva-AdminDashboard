import axios from 'axios';
import { API_URL } from './api';
import {
  CustomReportTemplate,
  CustomInvoiceTemplate,
  CustomTemplateType,
} from '../types/customFormat';

const getAuthHeaders = () => {
  const token =
    localStorage.getItem('partner_token') ||
    localStorage.getItem('doctor_token') ||
    localStorage.getItem('medsseva_token') ||
    localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const customFormatService = {
  // Logo Upload
  uploadLogo: async (file: File): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await axios.post(`${API_URL}/custom-formats/upload-logo`, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // ----------------------------------------------------
  // REPORT TEMPLATES
  // ----------------------------------------------------
  getReportTemplates: async (type?: CustomTemplateType): Promise<CustomReportTemplate[]> => {
    const res = await axios.get(`${API_URL}/custom-formats/reports`, {
      params: type ? { type } : undefined,
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  getReportTemplateById: async (id: string): Promise<CustomReportTemplate> => {
    const res = await axios.get(`${API_URL}/custom-formats/reports/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  createReportTemplate: async (data: Partial<CustomReportTemplate>): Promise<CustomReportTemplate> => {
    const res = await axios.post(`${API_URL}/custom-formats/reports`, data, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  updateReportTemplate: async (id: string, data: Partial<CustomReportTemplate>): Promise<CustomReportTemplate> => {
    const res = await axios.put(`${API_URL}/custom-formats/reports/${id}`, data, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  deleteReportTemplate: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await axios.delete(`${API_URL}/custom-formats/reports/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  setDefaultReportTemplate: async (id: string): Promise<{ success: boolean; template: CustomReportTemplate }> => {
    const res = await axios.post(`${API_URL}/custom-formats/reports/${id}/default`, {}, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  duplicateReportTemplate: async (id: string): Promise<CustomReportTemplate> => {
    const res = await axios.post(`${API_URL}/custom-formats/reports/${id}/duplicate`, {}, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  toggleActiveReportTemplate: async (id: string): Promise<CustomReportTemplate> => {
    const res = await axios.patch(`${API_URL}/custom-formats/reports/${id}/toggle-active`, {}, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  // ----------------------------------------------------
  // INVOICE TEMPLATES
  // ----------------------------------------------------
  getInvoiceTemplates: async (type?: CustomTemplateType): Promise<CustomInvoiceTemplate[]> => {
    const res = await axios.get(`${API_URL}/custom-formats/invoices`, {
      params: type ? { type } : undefined,
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  getInvoiceTemplateById: async (id: string): Promise<CustomInvoiceTemplate> => {
    const res = await axios.get(`${API_URL}/custom-formats/invoices/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  createInvoiceTemplate: async (data: Partial<CustomInvoiceTemplate>): Promise<CustomInvoiceTemplate> => {
    const res = await axios.post(`${API_URL}/custom-formats/invoices`, data, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  updateInvoiceTemplate: async (id: string, data: Partial<CustomInvoiceTemplate>): Promise<CustomInvoiceTemplate> => {
    const res = await axios.put(`${API_URL}/custom-formats/invoices/${id}`, data, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  deleteInvoiceTemplate: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await axios.delete(`${API_URL}/custom-formats/invoices/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  setDefaultInvoiceTemplate: async (id: string): Promise<{ success: boolean; template: CustomInvoiceTemplate }> => {
    const res = await axios.post(`${API_URL}/custom-formats/invoices/${id}/default`, {}, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  duplicateInvoiceTemplate: async (id: string): Promise<CustomInvoiceTemplate> => {
    const res = await axios.post(`${API_URL}/custom-formats/invoices/${id}/duplicate`, {}, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  toggleActiveInvoiceTemplate: async (id: string): Promise<CustomInvoiceTemplate> => {
    const res = await axios.patch(`${API_URL}/custom-formats/invoices/${id}/toggle-active`, {}, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },
};
