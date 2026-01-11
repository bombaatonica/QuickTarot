import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: string;
  email: string;
  name?: string;
  balance: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface TarotQuestion {
  question: string;
}

export interface TarotCard {
  name: string;
  suit?: string;
  meaning: string;
  is_major: boolean;
}

export interface TarotResponse {
  cards: TarotCard[];
  interpretation: string;
  question: string;
  balance: number;
}

export const authApi = {
  login: async (data: LoginData) => {
    const response = await api.post('/api/auth/login', data);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  register: async (data: RegisterData) => {
    const response = await api.post('/api/auth/register', data);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  getMe: async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export const paymentApi = {
  getBalance: async (): Promise<number> => {
    const response = await api.get('/api/payment/balance');
    return response.data.balance;
  },
  
  addCredit: async (amount: number): Promise<number> => {
    const response = await api.post('/api/payment/add-credit', { amount });
    return response.data.balance;
  },
};

export const chatApi = {
  askTarotQuestion: async (question: string): Promise<TarotResponse> => {
    const response = await api.post('/api/chat/tarot-question', { question });
    // Atualiza saldo no localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      user.balance = response.data.balance;
      localStorage.setItem('user', JSON.stringify(user));
    }
    return response.data;
  },
};

export default api;
