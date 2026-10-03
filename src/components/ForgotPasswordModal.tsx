import React, { useState, useEffect, useRef } from "react";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Check, 
  Headphones, 
  AlertCircle, 
  CheckCircle2, 
  RotateCw, 
  MessageSquare, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "../lib/api";

export type ForgotPasswordScreen = 
  | 'method_select'    // Screen 1: Forgot Password? (Reset via Email OTP / Contact Admin Panel)
  | 'enter_email'      // Screen 2: Enter your email address
  | 'email_sent'       // Screen 7: Email Sent (ra*******@gmail.com)
  | 'verify_email'     // Screen 3: Verify your email (6 OTP boxes)
  | 'create_password'  // Screen 4: Create new password (3 requirement checks)
  | 'reset_success'    // Screen 5: Password Reset Successfully (Glowing green checkmark)
  | 'contact_admin'    // Screen 6: Contact Admin Panel
  | 'brand_splash';    // Screen 8: BINISTA (Secure • Connect • Grow)

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (identifier: string) => void;
  initialPhone?: string;
  initialIdentifier?: string;
  theme?: "night" | "white";
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
  initialPhone = "",
  initialIdentifier = "",
  theme = "night"
}) => {
  // Navigation / active screen matching the 8 screens in reference photo
  const [screen, setScreen] = useState<ForgotPasswordScreen>('method_select');

  // Form Fields
  const [emailInput, setEmailInput] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Timers
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // 6 OTP Box Refs
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Password validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword) || /[a-zA-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);

  const WHATSAPP_INTL = "8801618599077";

  // Pre-fill initial identifier
  useEffect(() => {
    if (isOpen) {
      const init = initialIdentifier || initialPhone || "";
      if (init && init.includes("@")) {
        setEmailInput(init);
      }
      setScreen('method_select');
      setError(null);
      setSuccessMsg(null);
      setOtp(["", "", "", "", "", ""]);
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen, initialIdentifier, initialPhone]);

  // Resend Cooldown Countdown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  if (!isOpen) return null;

  const isNight = theme === "night";

  // Customized WhatsApp Link
  const getWhatsAppLink = () => {
    const target = emailInput.trim() || initialIdentifier || "আমার অ্যাকাউন্ট";
    const message = `আসসালামু আলাইকুম, আমি BINISTA অ্যাপে আমার অ্যাকাউন্টের পাসওয়ার্ড ভুলে গেছি।\n\nআমার একাউন্ট ইমেইল/আইডি: ${target}\n\nঅনুগ্রহ করে আমার পরিচয় নিশ্চিত করে পাসওয়ার্ড পুনরুদ্ধার করতে সহায়তা করুন। ধন্যবাদ!`;
    return `https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent(message)}`;
  };

  // SEND OTP HANDLER (Screen 2 -> Screen 7)
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(getApiUrl("/api/auth/forgot-password/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, phone: cleanEmail })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 429) {
          setCooldown(data.remainingSeconds || 60);
          setError(data.error || "Please wait a moment before requesting another code.");
          return;
        }
        setError(data.error || "Could not find an account with this email address.");
        return;
      }

      // Success -> Transition to Screen 7 (Email Sent Confirmation)
      setMaskedEmail(data.maskedEmail || cleanEmail);
      setTargetEmail(data.email || cleanEmail);
      setCooldown(data.cooldown || 45);
      setScreen('email_sent');
    } catch (err: any) {
      console.error("[ForgotPasswordModal] Send OTP Error:", err);
      setError("Unable to connect to the server. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Box Change
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      const digits = val.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      otpRefs[nextIdx].current?.focus();
      return;
    }

    const cleanChar = val.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = cleanChar;
    setOtp(newOtp);

    if (cleanChar && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  // VERIFY OTP (Screen 3 -> Screen 4)
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredOtp = otp.join("").trim();
    if (enteredOtp.length !== 6) {
      setError("Please enter the complete 6-digit code sent to your email.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(getApiUrl("/api/auth/forgot-password/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: targetEmail || emailInput.trim(),
          otp: enteredOtp
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.resetToken) {
        setError(data.error || "Invalid verification code. Please check and try again.");
        return;
      }

      setResetToken(data.resetToken);
      setScreen('create_password');
    } catch (err: any) {
      console.error("[ForgotPasswordModal] Verify OTP Error:", err);
      setError("Verification failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // RESET PASSWORD (Screen 4 -> Screen 5)
  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(getApiUrl("/api/auth/forgot-password/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: targetEmail || emailInput.trim(),
          resetToken,
          newPassword,
          confirmPassword
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to update password. Please try again.");
        return;
      }

      setScreen('reset_success');
    } catch (err: any) {
      console.error("[ForgotPasswordModal] Reset Password Error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 w-full min-h-screen overflow-y-auto ${
        isNight ? 'bg-[#0B0E14] text-white' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-between p-5 sm:p-7">
        <div className="w-full space-y-4">
          {/* TOP ALERT NOTIFICATIONS */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
          
          {/* ========================================================= */}
          {/* 1. SCREEN 1: METHOD SELECTION (Forgot Password?)          */}
          {/* ========================================================= */}
          {screen === 'method_select' && (
            <motion.div
              key="method_select"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Back Button */}
              <div className="flex items-center">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className={`p-1 -ml-1 transition-colors cursor-pointer ${
                    isNight ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>

              {/* Brand Logo Header */}
              <div className="flex flex-col items-center text-center -mt-2">
                <div className="w-14 h-14 rounded-3xl overflow-hidden shadow-md bg-black/20 flex items-center justify-center ring-2 ring-emerald-500/40 select-none mx-auto">
                  <img 
                    src="/app_icon.png" 
                    alt="BINISTA" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <h1 className={`text-sm font-bold tracking-[0.25em] uppercase mt-2.5 ${
                  isNight ? 'text-white' : 'text-slate-900'
                }`}>
                  BINISTA
                </h1>
              </div>

              {/* Lock Circle Emblem & Headings */}
              <div className="flex flex-col items-center text-center pt-1">
                <div className={`w-14 h-14 rounded-full border flex items-center justify-center mb-3.5 ${
                  isNight ? 'bg-[#121824] border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700 shadow-sm'
                }`}>
                  <Lock className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <h2 className={`text-xl font-bold tracking-tight ${
                  isNight ? 'text-white' : 'text-slate-900'
                }`}>
                  Forgot Password?
                </h2>
                <p className={`text-xs mt-1.5 leading-relaxed px-4 ${
                  isNight ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  No worries! We'll help you reset your password using your email address.
                </p>
              </div>

              {/* Option Cards */}
              <div className="space-y-3 pt-1">
                {/* Option 1: Reset via Email OTP */}
                <button
                  type="button"
                  onClick={() => { setError(null); setScreen('enter_email'); }}
                  className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.99] text-left cursor-pointer group ${
                    isNight
                      ? 'bg-[#121824]/90 hover:bg-[#182030] border-white/10'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
                      isNight ? 'bg-[#1a2234] border-white/5 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      <Mail className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-semibold ${
                        isNight ? 'text-white' : 'text-slate-900'
                      }`}>
                        Reset via Email OTP
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                        We'll send a verification code to your email address.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-colors shrink-0 ml-2 ${
                    isNight ? 'text-slate-500 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-900'
                  }`} />
                </button>

                {/* Option 2: Contact Admin Panel */}
                <button
                  type="button"
                  onClick={() => { setError(null); setScreen('contact_admin'); }}
                  className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.99] text-left cursor-pointer group ${
                    isNight
                      ? 'bg-[#121824]/90 hover:bg-[#182030] border-white/10'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
                      isNight ? 'bg-[#1a2234] border-white/5 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      <Headphones className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-semibold ${
                        isNight ? 'text-white' : 'text-slate-900'
                      }`}>
                        Contact Admin Panel
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                        Get help from our admin team.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-colors shrink-0 ml-2 ${
                    isNight ? 'text-slate-500 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-900'
                  }`} />
                </button>
              </div>

              {/* Back to Login Footer */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors ${
                    isNight ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Login</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 2. SCREEN 2: ENTER YOUR EMAIL ADDRESS                    */}
          {/* ========================================================= */}
          {screen === 'enter_email' && (
            <motion.div
              key="enter_email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Back Button */}
              <div className="flex items-center">
                <button 
                  type="button" 
                  onClick={() => setScreen('method_select')} 
                  className={`p-1 -ml-1 transition-colors cursor-pointer ${
                    isNight ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>

              {/* Center Icon & Headings */}
              <div className="flex flex-col items-center text-center">
                <div className={`w-14 h-14 rounded-full border flex items-center justify-center mb-3.5 ${
                  isNight ? 'bg-[#121824] border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700 shadow-sm'
                }`}>
                  <Mail className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <h2 className={`text-xl font-bold tracking-tight ${
                  isNight ? 'text-white' : 'text-slate-900'
                }`}>
                  Enter your email address
                </h2>
                <p className={`text-xs mt-1.5 leading-relaxed px-4 ${
                  isNight ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  We'll send a 6-digit verification code to your email address.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSendOtp} className="space-y-4 pt-1">
                <div>
                  <label className={`block text-xs font-medium mb-2 ${
                    isNight ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Email address
                  </label>
                  <div className={`rounded-2xl border px-4 py-3.5 flex items-center transition-colors ${
                    isNight
                      ? 'bg-[#121824] border-white/10 focus-within:border-emerald-500/50'
                      : 'bg-white border-slate-200 focus-within:border-emerald-500 shadow-sm'
                  }`}>
                    <Mail className="w-5 h-5 text-slate-400 mr-3 shrink-0" strokeWidth={1.5} />
                    <input
                      type="email"
                      placeholder="you@exemple.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className={`w-full bg-transparent text-sm outline-none font-normal ${
                        isNight ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
                      }`}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {/* Send OTP Button (Emerald Pill with Right Arrow) */}
                <button
                  type="submit"
                  disabled={loading || !emailInput.trim()}
                  className="w-full py-3.5 rounded-full bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.35)] mt-2"
                >
                  {loading ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-4 h-4" strokeWidth={2} />
                    </>
                  )}
                </button>
              </form>

              {/* Footer Helper Note */}
              <p className="text-[11px] text-center text-slate-400 pt-1">
                Make sure your email is active and accessible.
              </p>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 3. SCREEN 7: EMAIL SENT CONFIRMATION                     */}
          {/* ========================================================= */}
          {screen === 'email_sent' && (
            <motion.div
              key="email_sent"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Back Button */}
              <div className="flex items-center">
                <button 
                  type="button" 
                  onClick={() => setScreen('enter_email')} 
                  className={`p-1 -ml-1 transition-colors cursor-pointer ${
                    isNight ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>

              {/* Mail Icon with Checkmark Badge */}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className={`w-15 h-15 rounded-full border flex items-center justify-center mb-3.5 ${
                    isNight ? 'bg-[#121824] border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700 shadow-sm'
                  }`}>
                    <Mail className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0B0E14] flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>

                <h2 className={`text-xl font-bold tracking-tight mt-1 ${
                  isNight ? 'text-white' : 'text-slate-900'
                }`}>
                  Email Sent
                </h2>
                <p className={`text-xs mt-1.5 leading-relaxed px-4 ${
                  isNight ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  We've sent a 6-digit verification code to your email address.
                </p>
              </div>

              {/* Masked Email Card */}
              <div className={`rounded-2xl border px-4 py-3.5 flex items-center gap-3 ${
                isNight ? 'bg-[#121824] border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
              }`}>
                <Mail className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={1.5} />
                <span className="text-xs font-mono font-medium tracking-wide">
                  {maskedEmail || emailInput}
                </span>
              </div>

              {/* Continue Button */}
              <button
                type="button"
                onClick={() => {
                  setScreen('verify_email');
                  setTimeout(() => otpRefs[0].current?.focus(), 200);
                }}
                className="w-full py-3.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.35)]"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>

              {/* Change Email Link */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setScreen('enter_email')}
                  className={`text-xs font-medium hover:underline cursor-pointer ${
                    isNight ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Change email
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 4. SCREEN 3: VERIFY YOUR EMAIL (OTP)                     */}
          {/* ========================================================= */}
          {screen === 'verify_email' && (
            <motion.div
              key="verify_email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Back Button */}
              <div className="flex items-center">
                <button 
                  type="button" 
                  onClick={() => setScreen('email_sent')} 
                  className={`p-1 -ml-1 transition-colors cursor-pointer ${
                    isNight ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>

              {/* Center Icon & Headings */}
              <div className="flex flex-col items-center text-center">
                <div className={`w-14 h-14 rounded-full border flex items-center justify-center mb-3.5 ${
                  isNight ? 'bg-[#121824] border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700 shadow-sm'
                }`}>
                  <Mail className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <h2 className={`text-xl font-bold tracking-tight ${
                  isNight ? 'text-white' : 'text-slate-900'
                }`}>
                  Verify your email
                </h2>
                <p className={`text-xs mt-1.5 leading-relaxed px-4 ${
                  isNight ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Enter the 6-digit code sent to your email address.
                </p>
              </div>

              {/* 6 OTP Input Boxes */}
              <div className="grid grid-cols-6 gap-2 pt-1">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-full aspect-square border rounded-xl text-center font-bold text-base outline-none transition-all ${
                      digit 
                        ? 'border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]' 
                        : (isNight ? 'bg-[#121824] border-white/10 text-white focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500 shadow-sm')
                    } ${isNight ? 'bg-[#121824]' : 'bg-white'}`}
                  />
                ))}
              </div>

              {/* Resend Link with Cooldown */}
              <div className="text-center text-xs text-slate-400 pt-0.5">
                {cooldown > 0 ? (
                  <span>
                    Didn't receive the code? <span className="text-emerald-400 font-medium">Resend ({String(Math.floor(cooldown / 60)).padStart(2, '0')}:{String(cooldown % 60).padStart(2, '0')})</span>
                  </span>
                ) : (
                  <span>
                    Didn't receive the code? <button type="button" onClick={handleSendOtp} className="text-emerald-400 hover:underline font-medium cursor-pointer">Resend</button>
                  </span>
                )}
              </div>

              {/* Verify Action Button */}
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || otp.join("").length !== 6}
                className="w-full py-3.5 rounded-full bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.35)]"
              >
                {loading ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify</span>
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 5. SCREEN 4: CREATE NEW PASSWORD                         */}
          {/* ========================================================= */}
          {screen === 'create_password' && (
            <motion.div
              key="create_password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Back Button */}
              <div className="flex items-center">
                <button 
                  type="button" 
                  onClick={() => setScreen('verify_email')} 
                  className={`p-1 -ml-1 transition-colors cursor-pointer ${
                    isNight ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>

              {/* Center Icon & Headings */}
              <div className="flex flex-col items-center text-center">
                <div className={`w-14 h-14 rounded-full border flex items-center justify-center mb-3 ${
                  isNight ? 'bg-[#121824] border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700 shadow-sm'
                }`}>
                  <Lock className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <h2 className={`text-xl font-bold tracking-tight ${
                  isNight ? 'text-white' : 'text-slate-900'
                }`}>
                  Create new password
                </h2>
                <p className={`text-xs mt-1 leading-relaxed px-4 ${
                  isNight ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Your new password must be different from your previous password.
                </p>
              </div>

              {/* Inputs */}
              <form onSubmit={handleResetPassword} className="space-y-3 pt-1">
                {/* Field 1: New password */}
                <div className={`rounded-2xl border px-4 py-3 flex items-center ${
                  isNight ? 'bg-[#121824] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <Lock className="w-5 h-5 text-slate-400 mr-3 shrink-0" strokeWidth={1.5} />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full bg-transparent text-sm outline-none ${
                      isNight ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-slate-400 hover:text-white p-0.5 shrink-0 transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
                  </button>
                </div>

                {/* Field 2: Confirm new password */}
                <div className={`rounded-2xl border px-4 py-3 flex items-center ${
                  isNight ? 'bg-[#121824] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <Lock className="w-5 h-5 text-slate-400 mr-3 shrink-0" strokeWidth={1.5} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-transparent text-sm outline-none ${
                      isNight ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-white p-0.5 shrink-0 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
                  </button>
                </div>

                {/* 3 Requirement Checklists */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2.5 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                      hasMinLength ? 'bg-emerald-500 text-black' : 'border border-slate-600 text-transparent'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className={hasMinLength ? (isNight ? 'text-slate-200' : 'text-slate-800') : 'text-slate-400'}>
                      At least 8 characters
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                      hasUppercase ? 'bg-emerald-500 text-black' : 'border border-slate-600 text-transparent'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className={hasUppercase ? (isNight ? 'text-slate-200' : 'text-slate-800') : 'text-slate-400'}>
                      One uppercase letter
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                      hasNumber ? 'bg-emerald-500 text-black' : 'border border-slate-600 text-transparent'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className={hasNumber ? (isNight ? 'text-slate-200' : 'text-slate-800') : 'text-slate-400'}>
                      One number
                    </span>
                  </div>
                </div>

                {/* Reset Password Action Button */}
                <button
                  type="submit"
                  disabled={loading || !hasMinLength || !confirmPassword || (newPassword !== confirmPassword)}
                  className="w-full py-3.5 rounded-full bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.35)] mt-3"
                >
                  {loading ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ArrowRight className="w-4 h-4" strokeWidth={2} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 6. SCREEN 5: PASSWORD RESET SUCCESSFULLY                 */}
          {/* ========================================================= */}
          {screen === 'reset_success' && (
            <motion.div
              key="reset_success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 flex flex-col items-center text-center pt-4"
            >
              {/* Back Button */}
              <div className="w-full flex items-center justify-start">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className={`p-1 -ml-1 transition-colors cursor-pointer ${
                    isNight ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>

              {/* Glowing Green Circle Badge */}
              <div className="w-22 h-22 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.35)]">
                <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-md">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
              </div>

              {/* Headings */}
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${
                  isNight ? 'text-white' : 'text-slate-900'
                }`}>
                  Password Reset Successfully
                </h2>
                <p className={`text-xs mt-1.5 leading-relaxed px-4 ${
                  isNight ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Your password has been reset. You can now log in with your new password.
                </p>
              </div>

              {/* Log In Button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onSuccessLogin) {
                    onSuccessLogin(targetEmail || emailInput);
                  }
                }}
                className="w-full py-3.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.35)] mt-2"
              >
                <span>Log In</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 7. SCREEN 6: CONTACT ADMIN PANEL                         */}
          {/* ========================================================= */}
          {screen === 'contact_admin' && (
            <motion.div
              key="contact_admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Back Button */}
              <div className="flex items-center">
                <button 
                  type="button" 
                  onClick={() => setScreen('method_select')} 
                  className={`p-1 -ml-1 transition-colors cursor-pointer ${
                    isNight ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>

              {/* Center Headphone Icon & Headings */}
              <div className="flex flex-col items-center text-center">
                <div className={`w-14 h-14 rounded-full border flex items-center justify-center mb-3.5 ${
                  isNight ? 'bg-[#121824] border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700 shadow-sm'
                }`}>
                  <Headphones className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <h2 className={`text-xl font-bold tracking-tight ${
                  isNight ? 'text-white' : 'text-slate-900'
                }`}>
                  Contact Admin Panel
                </h2>
                <p className={`text-xs mt-1.5 leading-relaxed px-4 ${
                  isNight ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Need help? Our admin team is here to assist you. Please send us a message and we'll get back to you soon.
                </p>
              </div>

              {/* Support Cards */}
              <div className="space-y-3 pt-1">
                {/* Email Support Card */}
                <a
                  href="mailto:support@binista.app?subject=Password%20Reset%20Help"
                  className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.99] text-left cursor-pointer group block ${
                    isNight
                      ? 'bg-[#121824]/90 hover:bg-[#182030] border-white/10'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
                      isNight ? 'bg-[#1a2234] border-white/5 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      <Mail className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-semibold ${
                        isNight ? 'text-white' : 'text-slate-900'
                      }`}>
                        Email Support
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        support@binista.app
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-colors shrink-0 ml-2 ${
                    isNight ? 'text-slate-500 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-900'
                  }`} />
                </a>

                {/* WhatsApp Support Card */}
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.99] text-left cursor-pointer group block ${
                    isNight
                      ? 'bg-[#121824]/90 hover:bg-[#182030] border-white/10'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <MessageSquare className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-semibold ${
                        isNight ? 'text-white' : 'text-slate-900'
                      }`}>
                        WhatsApp Live Support
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        +880 1618-599077
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-colors shrink-0 ml-2 ${
                    isNight ? 'text-slate-500 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-900'
                  }`} />
                </a>
              </div>

              {/* Go to Help Center Button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.location.href = "/help-center";
                }}
                className={`w-full py-3.5 rounded-full border text-sm font-semibold transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${
                  isNight
                    ? 'bg-[#121824] border-white/15 text-white hover:bg-[#182030]'
                    : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-100 shadow-sm'
                }`}
              >
                <span>Go to Help Center</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 8. SCREEN 8: BRAND / SECURE SPLASH                      */}
          {/* ========================================================= */}
          {screen === 'brand_splash' && (
            <motion.div
              key="brand_splash"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 flex flex-col items-center text-center pt-6 pb-2"
            >
              {/* Brand Logo Header */}
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center select-none shadow-md ${
                  isNight ? 'bg-white text-black' : 'bg-black text-white'
                }`}>
                  <span className="font-black text-3xl leading-none">B</span>
                </div>
                <h1 className={`text-base font-bold tracking-[0.28em] uppercase mt-3.5 ${
                  isNight ? 'text-white' : 'text-slate-900'
                }`}>
                  BINISTA
                </h1>
                <p className="text-xs text-slate-400 font-medium tracking-wide mt-1">
                  Secure • Connect • Grow
                </p>
              </div>

              {/* Description */}
              <p className={`text-xs max-w-[260px] leading-relaxed ${
                isNight ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Your account is safe. Log in and continue your journey.
              </p>

              {/* Log In Action Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.35)] mt-2"
              >
                <span>Log In</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>

              {/* Back to Home Link */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.href = "/";
                  }}
                  className={`text-xs font-medium hover:underline cursor-pointer ${
                    isNight ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Back to Home
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
