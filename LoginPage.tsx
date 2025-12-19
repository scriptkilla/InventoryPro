import React, { useState } from 'react';
import { Package, Mail, Lock, LogIn, Chrome } from 'lucide-react';
import { User } from './types';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onShowToast: (toast: { message: string, type: 'success' | 'error' | 'info' }) => void;
  onOpenSignupModal: () => void; // New prop to open signup modal
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onShowToast, onOpenSignupModal }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailPasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy authentication logic
    if (email === 'admin@inventorypro.com' && password === 'password') {
      const dummyUser: User = {
        id: 'user-admin-1',
        name: 'Admin User',
        email: 'admin@inventorypro.com',
        role: 'admin',
        avatarColor: 'bg-purple-500'
      };
      onLogin(dummyUser);
    } else {
      onShowToast({ message: 'Invalid credentials. Try admin@inventorypro.com / password', type: 'error' });
    }
  };

  const handleGoogleLogin = () => {
    // In a real app, this would initiate the Google OAuth flow.
    // For this demo, we'll simulate a successful Google login.
    console.log('Simulating Google login...');
    const googleUser: User = {
      id: 'user-google-1',
      name: 'Google User',
      email: 'google.user@example.com',
      role: 'editor',
      avatarColor: 'bg-emerald-500'
    };
    onLogin(googleUser);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border dark:border-slate-800 space-y-8 animate-in zoom-in-95">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4">
            <Package className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tight">InventoryPro</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Manage your assets with intelligence</p>
        </div>

        <form onSubmit={handleEmailPasswordLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                placeholder="admin@inventorypro.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase tracking-widest text-sm"
          >
            <LogIn size={20} /> Login
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-x-0 h-px bg-slate-200 dark:bg-slate-700" />
          <span className="relative z-10 px-4 text-xs font-black uppercase text-slate-400 bg-white dark:bg-slate-900">OR</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border dark:border-slate-700"
        >
          <Chrome size={20} className="text-red-500" /> Sign in with Google
        </button>

        <div className="text-center text-sm space-y-2 pt-4">
          <a href="#" className="text-blue-600 hover:underline">Forgot Password?</a>
          <p className="text-slate-500 dark:text-slate-400">
            Don't have an account? <button onClick={onOpenSignupModal} className="text-blue-600 hover:underline font-medium">Sign Up</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;