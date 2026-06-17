/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Sparkles, AlertTriangle } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar login.');
      }
      
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = (role: 'admin' | 'operator') => {
    if (role === 'admin') {
      onLoginSuccess({
        id: '1',
        name: 'Ana Claudia (Admin)',
        email: 'admin@loja.com',
        role: 'admin'
      });
    } else {
      onLoginSuccess({
        id: '2',
        name: 'Carla Souza (Operadora)',
        email: 'operador@loja.com',
        role: 'operator'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center py-12 px-6 lg:px-8 font-sans" id="login_container">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-16 w-16 bg-[#1A1A1A] rounded-full flex items-center justify-center text-white font-bold text-2xl" id="logo_badge">
          CI
        </div>
        <h2 className="mt-6 text-3xl font-semibold text-[#1A1A1A] tracking-tight" id="login_title">
          Closet Admin
        </h2>
        <p className="mt-2 text-xs text-[#8C8C88] uppercase tracking-widest font-semibold">
          Controle de Estoque • PDV • Malas Consignadas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md" id="login_card">
        <div className="bg-white py-8 px-6 shadow-sm rounded-3xl border border-[#E5E5E1]">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-md" id="login_error_box">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-rose-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="email">
                E-mail Administrativo
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e11d48] focus:border-transparent text-sm transition-all shadow-sm"
                  placeholder="admin@loja.com ou operador@loja.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="password">
                Senha de Acesso
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e11d48] focus:border-transparent text-sm transition-all shadow-sm"
                  placeholder="Ex: admin ou 123"
                />
              </div>
            </div>

            <div>
              <button
                id="btn_submit_login"
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 duration-150 transition-colors disabled:opacity-50"
              >
                {loading ? 'Acessando...' : 'Entrar no Sistema'}
              </button>
            </div>
          </form>

          <div className="relative my-6" id="divider_container">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-slate-400 font-medium">Acesso Rápido de Testes</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3" id="demo_access_grid">
            <button
              id="btn_demo_admin"
              onClick={() => handleDemoAccess('admin')}
              className="flex items-center justify-center py-3 px-3 rounded-xl text-xs font-semibold text-white bg-[#1A1A1A] hover:bg-[#333333] transition-all focus:outline-none h-[44px]"
            >
              <ShieldCheck className="h-4 w-4 mr-1 text-[#A68B7C]" />
              Entrar como Admin
            </button>
            <button
              id="btn_demo_operator"
              onClick={() => handleDemoAccess('operator')}
              className="flex items-center justify-center py-3 px-3 rounded-xl text-xs font-semibold text-[#1A1A1A] bg-[#F1F0EC] hover:bg-[#E5E5E1] border border-[#E5E5E1] transition-all focus:outline-none h-[44px]"
            >
              Entrar como Operador
            </button>
          </div>

          <div className="mt-4 text-center">
            <span className="text-[11px] text-slate-400 font-mono">
              Admin: admin@loja.com / admin | Operador: operador@loja.com / 123
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
