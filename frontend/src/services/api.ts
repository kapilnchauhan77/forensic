import axios from 'axios';
import type {
  User, Case, Exhibit, Fingerprint,
  CaseListResponse, PipelineConfig, PipelineVersion
} from '../types';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  register: async (data: { username: string; email: string; password: string; full_name?: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Cases
export const casesApi = {
  list: async (page = 1, pageSize = 20, search?: string, status?: string): Promise<CaseListResponse> => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.append('search', search);
    if (status) params.append('status_filter', status);
    const response = await api.get(`/cases?${params}`);
    return response.data;
  },
  get: async (id: string): Promise<Case> => {
    const response = await api.get(`/cases/${id}`);
    return response.data;
  },
  create: async (data: Partial<Case>): Promise<Case> => {
    const response = await api.post('/cases', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Case>): Promise<Case> => {
    const response = await api.patch(`/cases/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/cases/${id}`);
  },
};

// Exhibits
export const exhibitsApi = {
  listForCase: async (caseId: string): Promise<Exhibit[]> => {
    const response = await api.get(`/exhibits/case/${caseId}`);
    return response.data;
  },
  get: async (id: string): Promise<Exhibit> => {
    const response = await api.get(`/exhibits/${id}`);
    return response.data;
  },
  create: async (data: { case_id: string; exhibit_number: string; description?: string }): Promise<Exhibit> => {
    const response = await api.post('/exhibits', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Exhibit>): Promise<Exhibit> => {
    const response = await api.patch(`/exhibits/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/exhibits/${id}`);
  },
};

// Fingerprints
export const fingerprintsApi = {
  upload: async (exhibitId: string, file: File, printType = 'unknown'): Promise<Fingerprint> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('print_type', printType);
    const response = await api.post(`/fingerprints/upload/${exhibitId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  uploadBatch: async (exhibitId: string, files: File[], printType = 'unknown') => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('print_type', printType);
    const response = await api.post(`/fingerprints/upload-batch/${exhibitId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  get: async (id: string): Promise<Fingerprint> => {
    const response = await api.get(`/fingerprints/${id}`);
    return response.data;
  },
  process: async (id: string, preset = 'rolled_plain'): Promise<Fingerprint> => {
    const response = await api.post(`/fingerprints/${id}/process`, {
      enhancement_preset: preset,
      generate_variants: true,
    });
    return response.data;
  },
  reprocess: async (id: string, preset?: string, force = false): Promise<Fingerprint> => {
    const response = await api.post(`/fingerprints/${id}/reprocess`, {
      enhancement_preset: preset,
      force,
    });
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/fingerprints/${id}`);
  },
};

// Pipeline
export const pipelineApi = {
  listConfigs: async (): Promise<PipelineConfig[]> => {
    const response = await api.get('/pipeline/configs');
    return response.data;
  },
  getConfig: async (id: string): Promise<PipelineConfig> => {
    const response = await api.get(`/pipeline/configs/${id}`);
    return response.data;
  },
  getCurrentVersion: async (): Promise<PipelineVersion> => {
    const response = await api.get('/pipeline/versions/current');
    return response.data;
  },
};

// Export
export const exportApi = {
  downloadEvidencePack: async (caseId: string) => {
    const response = await api.get(`/export/case/${caseId}/evidence-pack`, {
      responseType: 'blob',
    });
    return response.data;
  },
  getFingerprintReport: async (fingerprintId: string) => {
    const response = await api.get(`/export/fingerprint/${fingerprintId}/report`);
    return response.data;
  },
};

export default api;
