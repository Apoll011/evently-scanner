import axios from 'axios';
import { storage } from '../storage';

export const api = axios.create();

api.interceptors.request.use((config) => {
  const serverUrl = storage.getServerUrl();
  const session = storage.getSession();

  if (serverUrl) {
    config.baseURL = serverUrl;
  }

  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (maybe logout)
      // storage.logout();
      // window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
