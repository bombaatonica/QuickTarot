'use client';

import { useEffect, useState } from 'react';
import Chat from '@/components/Chat';
import { authApi, User } from '@/lib/api';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ email: '', password: '', name: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await authApi.getMe();
        setIsAuthenticated(true);
      } catch (error) {
        authApi.logout();
      }
    }
    setIsLoading(false);
    if (!token) {
      setShowLogin(true);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await authApi.login(loginData);
      setIsAuthenticated(true);
      setShowLogin(false);
    } catch (error: any) {
      setAuthError(error.response?.data?.detail || 'Erro ao fazer login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await authApi.register(registerData);
      setIsAuthenticated(true);
      setShowLogin(false);
    } catch (error: any) {
      setAuthError(error.response?.data?.detail || 'Erro ao registrar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    'w-full px-4 py-2.5 bg-bordeaux-950/70 text-gold-50 border border-gold-400/30 rounded-lg ' +
    'focus:outline-none focus:ring-2 focus:ring-gold-400/70 focus:border-gold-400/60 ' +
    'placeholder:text-gold-100/30 transition-colors';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-3 h-3 rounded-full bg-gold-400 animate-orb-pulse shadow-gold-glow" aria-label="Carregando" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="bg-bordeaux-900/80 backdrop-blur border border-gold-400/25 rounded-2xl shadow-gold-glow p-8 max-w-md w-full animate-fade-in">
          <div className="text-center mb-8">
            <div className="text-gold-400 text-xl mb-3 tracking-[0.5em]" aria-hidden="true">✦ ✦ ✦</div>
            <h1 className="font-display text-4xl font-bold text-gold-400 text-gold-glow mb-2">
              QuickTarot
            </h1>
            <p className="text-gold-100/60 italic">O oráculo responde às suas perguntas</p>
          </div>

          {!isRegister ? (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gold-200/80 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className={inputClasses}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gold-200/80 mb-1.5">Senha</label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className={inputClasses}
                    required
                  />
                </div>
                {authError && (
                  <p role="alert" className="text-sm text-red-300 bg-red-950/50 border border-red-400/30 rounded-lg px-3 py-2">
                    {authError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 bg-gold-400 text-bordeaux-950 rounded-lg hover:bg-gold-300 hover:shadow-gold-glow disabled:opacity-50 font-display font-semibold tracking-wide transition-all"
                >
                  {isSubmitting ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
              <p className="text-center text-sm text-gold-100/60 mt-6">
                Não tem conta?{' '}
                <button
                  onClick={() => { setIsRegister(true); setAuthError(null); }}
                  className="text-gold-300 hover:text-gold-200 hover:underline"
                >
                  Cadastre-se
                </button>
              </p>
            </>
          ) : (
            <>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gold-200/80 mb-1.5">Nome (opcional)</label>
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gold-200/80 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className={inputClasses}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gold-200/80 mb-1.5">Senha (mínimo 8 caracteres)</label>
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className={inputClasses}
                    minLength={8}
                    required
                  />
                </div>
                {authError && (
                  <p role="alert" className="text-sm text-red-300 bg-red-950/50 border border-red-400/30 rounded-lg px-3 py-2">
                    {authError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 bg-gold-400 text-bordeaux-950 rounded-lg hover:bg-gold-300 hover:shadow-gold-glow disabled:opacity-50 font-display font-semibold tracking-wide transition-all"
                >
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </form>
              <p className="text-center text-sm text-gold-100/60 mt-6">
                Já tem conta?{' '}
                <button
                  onClick={() => { setIsRegister(false); setAuthError(null); }}
                  className="text-gold-300 hover:text-gold-200 hover:underline"
                >
                  Faça login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return <Chat />;
}
