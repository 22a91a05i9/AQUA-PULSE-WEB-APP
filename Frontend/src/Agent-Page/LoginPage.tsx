import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Headphones, KeyRound, LockKeyhole, Mail, Send } from 'lucide-react';
import { ApiError } from '../lib/api';
import { login, requestPasswordReset, resetPassword, type AuthSession } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import { isAllowedPassword, PASSWORD_POLICY_MESSAGE } from '../lib/passwordPolicy';

interface LoginPageProps {
  onLogin: (session: AuthSession) => void;
}

type AuthMode = 'login' | 'forgot' | 'reset';

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { lang, changeLanguage } = useTranslation();
  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    return window.location.pathname.includes('reset-password') ? 'reset' : 'login';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetTokenValue, setResetTokenValue] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetConfirmValue, setResetConfirmValue] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetLinkEmail = params.get('email');

    if (resetLinkEmail) {
      setResetEmail(resetLinkEmail);
    }
  }, []);

  const goToLogin = () => {
    setAuthMode('login');
    setResetMessage('');
    if (window.location.pathname.includes('reset-password') || window.location.search) {
      window.history.replaceState({}, '', '/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const session = await login({ email, password });
      onLogin(session);
    } catch (error) {
      const fallbackMessage = 'Login failed. Please check your details or backend connection.';
      const errorMessage = error instanceof ApiError || error instanceof Error ? error.message : fallbackMessage;
      setMessage(errorMessage === 'Password is invalid' ? 'Password is wrong' : errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const emailToUse = (resetEmail || email).trim();
    if (!emailToUse) {
      setResetMessage('Enter your registered email first.');
      return;
    }

    setResetLoading(true);
    setResetMessage('');
    try {
      const response = await requestPasswordReset(emailToUse);
      setResetEmail(emailToUse);
      setResetTokenValue('');
      setResetMessage(response.email_sent ? 'Reset code sent to your email.' : response.message);
      setAuthMode('reset');
    } catch (error) {
      setResetMessage(error instanceof Error ? error.message : 'Unable to request password reset.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTokenValue.trim() || !resetPasswordValue || !resetConfirmValue) {
      setResetMessage('Enter the reset code, new password, and confirm password.');
      return;
    }
    if (!/^\d{5}$/.test(resetTokenValue.trim())) {
      setResetMessage('Enter the 5-digit reset code from your email.');
      return;
    }
    if (!isAllowedPassword(resetPasswordValue)) {
      setResetMessage(PASSWORD_POLICY_MESSAGE);
      return;
    }
    if (resetPasswordValue !== resetConfirmValue) {
      setResetMessage('New password and confirm password do not match.');
      return;
    }

    setResetLoading(true);
    setResetMessage('');
    try {
      const response = await resetPassword(resetTokenValue.trim(), resetPasswordValue);
      setResetMessage(response.message);
      setPassword('');
      setResetPasswordValue('');
      setResetConfirmValue('');
      setTimeout(goToLogin, 1200);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to reset password.';
      setResetMessage(errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('expired') ? 'Reset code is wrong.' : errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh w-screen items-center justify-center overflow-x-hidden overflow-y-auto bg-[#020814] p-3 md:min-h-screen">
      <section className="relative min-h-[calc(100dvh-1.5rem)] w-full max-w-[27rem] overflow-hidden rounded-[18px] bg-black shadow-[0_28px_90px_rgba(0,0,0,0.58)] md:aspect-[16/10] md:min-h-0 md:max-w-none md:w-[min(1800px,calc(100vw-10px),calc((100vh-10px)*1.6))]">
        <video className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline preload="auto" aria-hidden="true">
          <source src="/videos/login-underwater.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,8,20,0.2),rgba(1,8,20,0.08)_45%,rgba(1,8,20,0.44)),radial-gradient(circle_at_72%_45%,rgba(6,182,212,0.16),transparent_32%)]" />
        <div className="absolute right-4 top-4 z-[5] flex rounded-lg border border-cyan-300/25 bg-[#06162b]/75 p-1 backdrop-blur-md" data-no-translate>
          {[
            { code: 'en', label: 'EN' },
            { code: 'hi', label: 'हिन्दी' },
            { code: 'te', label: 'తెలుగు' },
          ].map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => changeLanguage(item.code)}
              className={`h-8 rounded-md px-3 text-xs font-bold transition ${lang === item.code ? 'bg-cyan-400 text-slate-950' : 'text-cyan-100 hover:bg-cyan-300/10'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {authMode === 'login' && (
          <form
            onSubmit={handleSubmit}
            className="login-form absolute inset-x-5 top-1/2 z-[3] flex max-h-[calc(100dvh-4rem)] min-w-0 -translate-y-1/2 flex-col overflow-y-auto rounded-[15px] border border-slate-300/25 bg-[#06162b]/76 px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md md:bottom-auto md:left-auto md:right-[clamp(20px,7%,76px)] md:top-1/2 md:max-h-[calc(100%-40px)] md:w-[min(39%,25rem)] md:min-w-[18rem] md:animate-slide-in-right md:bg-[#06162b]/64 md:px-[clamp(18px,2.5%,38px)] md:py-[clamp(18px,2.35%,36px)]"
            aria-label="Aqua Pulse login form"
          >
            <div className="mb-[clamp(9px,1.2vw,18px)] shrink-0 text-center">
              <h1 className="text-[clamp(18px,1.8vw,27px)] font-extrabold leading-tight tracking-normal text-white">Welcome Back!</h1>
              <p className="mt-[clamp(4px,0.7vw,10px)] text-[clamp(11px,0.95vw,14px)] text-slate-300">Sign in to your account</p>
            </div>

            <label htmlFor="email" className="mb-[clamp(3px,0.4vw,8px)] text-[clamp(11px,0.9vw,14px)] font-semibold text-white">Email</label>
            <div className="group relative shrink-0">
              <Mail className="pointer-events-none absolute left-[4.2%] top-1/2 h-[clamp(14px,1.3vw,20px)] w-[clamp(14px,1.3vw,20px)] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-300" />
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="login-input h-[clamp(36px,3.65vw,50px)] w-full rounded-lg border border-slate-400/25 bg-[#041326]/62 pl-[12%] pr-4 text-[clamp(12px,1vw,15px)] font-medium text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-[#061a31]/80 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)]" placeholder="Enter your email" autoComplete="email" required />
            </div>

            <label htmlFor="password" className="mb-[clamp(3px,0.4vw,8px)] mt-[clamp(8px,1vw,16px)] text-[clamp(11px,0.9vw,14px)] font-semibold text-white">Password</label>
            <div className="group relative shrink-0">
              <LockKeyhole className="pointer-events-none absolute left-[4.2%] top-1/2 h-[clamp(14px,1.3vw,20px)] w-[clamp(14px,1.3vw,20px)] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-300" />
              <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="login-input h-[clamp(36px,3.65vw,50px)] w-full rounded-lg border border-slate-400/25 bg-[#041326]/62 pl-[12%] pr-[12%] text-[clamp(12px,1vw,15px)] font-medium text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-[#061a31]/80 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)]" placeholder="Enter your password" autoComplete="current-password" required />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-[2.4%] top-1/2 flex h-[clamp(24px,2.6vw,34px)] w-[clamp(24px,2.6vw,34px)] -translate-y-1/2 items-center justify-center rounded-md text-slate-300 transition hover:bg-cyan-300/10 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300/60" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="h-[58%] w-[58%]" /> : <Eye className="h-[58%] w-[58%]" />}
              </button>
            </div>

            <div className="mt-[clamp(10px,1.2vw,16px)] flex shrink-0 justify-end">
              <button type="button" onClick={() => { setResetEmail(email); setResetMessage(''); setAuthMode('forgot'); }} className="max-w-full whitespace-nowrap text-[clamp(11px,0.9vw,14px)] font-semibold text-cyan-300 transition hover:text-cyan-100">
                Forgot Password?
              </button>
            </div>

            <button type="submit" disabled={isLoading} className="relative mt-[clamp(11px,1.35vw,18px)] flex h-[clamp(40px,3.9vw,52px)] w-full shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-300 via-sky-500 to-blue-700 text-[clamp(13px,1.12vw,16px)] font-extrabold text-white shadow-[0_12px_30px_rgba(14,165,233,0.22)] transition hover:scale-[1.01] hover:shadow-[0_16px_40px_rgba(14,165,233,0.35)] focus:outline-none focus:ring-2 focus:ring-cyan-200/80 disabled:cursor-wait disabled:opacity-80">
              <span>{isLoading ? 'Logging in...' : 'Login'}</span>
              <ArrowRight className="absolute right-[5.5%] h-[48%] w-auto" />
            </button>

            {message && <p className="mt-4 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-center text-sm font-medium text-cyan-100">{message}</p>}
          </form>
        )}

        {authMode === 'forgot' && (
          <div className="absolute inset-0 z-[4] flex items-center justify-center bg-[#020814]/82 p-2 backdrop-blur-sm">
            <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[28rem] flex-col overflow-hidden rounded-lg border border-cyan-300/20 bg-[#06162b]/92 shadow-[0_24px_70px_rgba(0,0,0,0.48)]">
              <div className="flex-1 overflow-y-auto p-6">
                <button type="button" onClick={goToLogin} className="mb-6 flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-100"><ArrowLeft className="h-4 w-4" />Back to Login</button>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-300"><Mail className="h-9 w-9" /></div>
                <div className="mt-5 text-center">
                  <h2 className="text-2xl font-extrabold text-white">Forgot Password?</h2>
                  <p className="mx-auto mt-3 max-w-[19rem] text-sm leading-6 text-slate-300">No worries! Enter your registered email address and we'll send you a reset code.</p>
                </div>
                <div className="mt-7 space-y-3">
                  <label className="text-sm font-bold text-white">Email Address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} placeholder="Enter your email address" className="login-input h-12 w-full rounded-lg border border-slate-400/25 bg-[#041326]/80 pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-400 focus:border-cyan-300" />
                  </div>
                  <button type="button" onClick={handleForgotPassword} disabled={resetLoading} className="relative mt-3 flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-cyan-300 via-sky-500 to-blue-700 text-sm font-extrabold text-white disabled:cursor-wait disabled:opacity-70">
                    {resetLoading ? 'Sending...' : 'Send Reset Code'}
                    <Send className="absolute right-4 h-5 w-5" />
                  </button>
                  {resetMessage && <p className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-sm font-medium text-cyan-100">{resetMessage}</p>}
                </div>
                <div className="my-7 flex items-center gap-4 text-xs font-semibold text-slate-400"><span className="h-px flex-1 bg-slate-600/50" />OR<span className="h-px flex-1 bg-slate-600/50" /></div>
                <button type="button" onClick={goToLogin} className="mx-auto flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-100"><ArrowLeft className="h-4 w-4" />Back to Login</button>
              </div>
              <button type="button" className="flex items-center justify-between border-t border-cyan-300/10 bg-[#041326]/80 px-6 py-4 text-left">
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/30 text-cyan-300"><Headphones className="h-5 w-5" /></span>
                  <span><span className="block text-sm font-bold text-white">Need Help?</span><span className="block text-xs text-slate-300">Contact our support team</span></span>
                </span>
                <ArrowRight className="h-5 w-5 text-slate-300" />
              </button>
            </div>
          </div>
        )}

        {authMode === 'reset' && (
          <div className="absolute inset-0 z-[4] flex items-center justify-center bg-[#020814]/82 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border border-cyan-300/25 bg-[#06162b]/95 p-6 shadow-2xl">
              <button type="button" onClick={goToLogin} className="mb-5 flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-100"><ArrowLeft className="h-4 w-4" />Back to Login</button>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-300"><KeyRound className="h-8 w-8" /></div>
              <div className="mt-5 text-center">
                <h2 className="text-2xl font-extrabold text-white">Create New Password</h2>
                <p className="mt-2 text-sm text-slate-300">Enter the reset code from your email and create a new password.</p>
              </div>
              <div className="mt-6 space-y-3">
                <input type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} placeholder="Registered email" className="login-input h-11 w-full rounded-lg border border-slate-400/25 bg-[#041326]/80 px-3 text-sm text-white outline-none" />
                <button type="button" onClick={handleForgotPassword} disabled={resetLoading} className="h-10 w-full rounded-lg border border-cyan-300/40 text-sm font-bold text-cyan-100 disabled:cursor-wait disabled:opacity-70">{resetLoading ? 'Sending...' : 'Send New Reset Code'}</button>
                <input value={resetTokenValue} onChange={(event) => setResetTokenValue(event.target.value.replace(/\D/g, '').slice(0, 5))} inputMode="numeric" maxLength={5} placeholder="5-digit reset code" className="login-input h-11 w-full rounded-lg border border-slate-400/25 bg-[#041326]/80 px-3 text-sm text-white outline-none" />
                <input type="password" value={resetPasswordValue} onChange={(event) => setResetPasswordValue(event.target.value)} placeholder="New password" className="login-input h-11 w-full rounded-lg border border-slate-400/25 bg-[#041326]/80 px-3 text-sm text-white outline-none" />
                <input type="password" value={resetConfirmValue} onChange={(event) => setResetConfirmValue(event.target.value)} placeholder="Confirm password" className="login-input h-11 w-full rounded-lg border border-slate-400/25 bg-[#041326]/80 px-3 text-sm text-white outline-none" />
                <button type="button" onClick={handleResetPassword} disabled={resetLoading} className="h-11 w-full rounded-lg bg-gradient-to-r from-cyan-300 via-sky-500 to-blue-700 text-sm font-extrabold text-white disabled:cursor-wait disabled:opacity-70">{resetLoading ? 'Updating...' : 'Update Password'}</button>
                {resetMessage && <p className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-sm font-medium text-cyan-100">{resetMessage}</p>}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
