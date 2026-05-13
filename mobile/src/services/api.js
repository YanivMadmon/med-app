import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.103:3000'; // Local dev — change to production URL when deploying

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const sendOtp = (phone) => api.post('/auth/send-otp', { phone });
export const verifyOtp = (phone, code, name, role) =>
  api.post('/auth/verify-otp', { phone, code, name, role });
export const googleAuthApi = (idToken, role) =>
  api.post('/auth/google', { idToken, role });
export const getMe = () => api.get('/auth/me');
export const updateFcmToken = (fcmToken) =>
  api.post('/auth/update-fcm-token', { fcmToken });

// Medications
export const getTodayMedications = (patientId) =>
  api.get(`/medications/${patientId}/today`);
export const getMedications = (patientId) =>
  api.get(`/medications/${patientId}`);
export const createMedication = (data) => api.post('/medications', data);
export const updateMedication = (id, data) => api.put(`/medications/${id}`, data);
export const deleteMedication = (id) => api.delete(`/medications/${id}`);

// Doses
export const confirmDose = (scheduleId, scheduledAt) =>
  api.post('/doses/confirm', { scheduleId, scheduledAt });
export const snoozeDose = (scheduleId, scheduledAt) =>
  api.post('/doses/snooze', { scheduleId, scheduledAt });
export const getDoseHistory = (patientId, days = 7) =>
  api.get(`/doses/history/${patientId}?days=${days}`);
export const getMissedDoses = (patientId) =>
  api.get(`/doses/missed/${patientId}`);

// Caregivers
export const linkCaregiver = (patientPhone) =>
  api.post('/caregivers/link', { patientPhone });
export const getMyPatients = () => api.get('/caregivers/patients');
export const unlinkCaregiver = (patientId) =>
  api.delete(`/caregivers/link/${patientId}`);

export default api;
