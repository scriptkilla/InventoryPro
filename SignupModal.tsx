import React, { useState } from 'react';
import { User } from './types';
import { UserRoundPlus, X } from 'lucide-react';

interface SignupModalProps {
  onSignup: (user: User) => void;
  onClose: () => void;
  onShowToast: (toast: { message: string, type: 'success' | 'error' | 'info' }) => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ onSignup, onClose, onShowToast }) => {
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
      onShowToast({ message: 'All fields are required', type: 'error' });
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      onShowToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }
    if (signupPassword.length < 6) {
      onShowToast({ message: 'Password must be at least 6 characters long', type: 'error' });
      return;
    }

    const colors = ['bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: signupName,
      email: signupEmail,
      role: 'viewer', // Default role for new signups
      avatarColor: colors[Math.floor(Math.random() * colors.length)]
    };
    onSignup(newUser);
    onClose();
    onShowToast({ message: `Account created for ${signupName}! You are now logged in.`, type: 'success' });
    // Reset form fields
    setSignupName('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm sm:max-w-md p-4 sm:p-6 lg:p-8 border dark:border-slate-800 space-y-6 animate-in zoom-in-95">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black flex items-center gap-2">
            <UserRoundPlus size={24} className="text-blue-600" /> Create New Account
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X/></button>
        </div>
        <form onSubmit={handleSignupSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="signupName" className="text-[10px] font-black uppercase text-slate-400">Full Name</label>
            <input 
              id="signupName"
              type="text" 
              className="w-full px-4 py-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold" 
              placeholder="e.g. Jane Doe"
              value={signupName}
              onChange={e => setSignupName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="signupEmail" className="text-[10px] font-black uppercase text-slate-400">Email Address</label>
            <input 
              id="signupEmail"
              type="email"
              className="w-full px-4 py-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold" 
              placeholder="jane.doe@example.com"
              value={signupEmail}
              onChange={e => setSignupEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="signupPassword" className="text-[10px] font-black uppercase text-slate-400">Password</label>
            <input 
              id="signupPassword"
              type="password"
              className="w-full px-4 py-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold" 
              placeholder="••••••••"
              value={signupPassword}
              onChange={e => setSignupPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="signupConfirmPassword" className="text-[10px] font-black uppercase text-slate-400">Confirm Password</label>
            <input 
              id="signupConfirmPassword"
              type="password"
              className="w-full px-4 py-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold" 
              placeholder="••••••••"
              value={signupConfirmPassword}
              onChange={e => setSignupConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupModal;