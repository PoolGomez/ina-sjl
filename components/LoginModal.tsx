'use client';

import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import { Lock, Mail, LogIn, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginModalProps {
  embeddedInModal?: boolean;
  onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ embeddedInModal = false, onSuccess }) => {
  const { signIn, isFirebaseConnected } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Por favor ingresa correo y contraseña.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);

    if (res.success) {
      onSuccess?.();
    } else if (res.error) {
      if (res.error.includes('auth/invalid-credential') || res.error.includes('wrong-password')) {
        setError('Correo o contraseña incorrectos.');
      } else if (res.error.includes('auth/email-already-in-use')) {
        setError('Este correo ya está registrado.');
      } else {
        setError(res.error);
      }
    }
  };

  const innerContent = (
    <>
        {/* Header with App Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            IGLESIA NUEVA APOSTÓLICA
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Gestión de Comunidad, Asistencia & Eventos INA
          </p>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isFirebaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            ></span>
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              {isFirebaseConnected ? 'Firebase Auth & Cloud Firestore' : 'Sin conexión a Base de Datos'}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Info notice */}
        <div className="mb-5 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <span>El registro de nuevos usuarios es gestionado por el <strong>Super Administrador</strong>.</span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@eventosina.com"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full" />
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Ingresar al Sistema
              </>
            )}
          </button>
        </form>
    </>
  );

  if (embeddedInModal) {
    return <div>{innerContent}</div>;
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        {innerContent}
      </div>
    </div>
  );
};
