import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, User, Phone, Mail, Camera, Shield, Bell, Lock, 
  Check, ChevronRight, LogOut, Moon, Globe, 
  Smartphone, Eye, EyeOff, Save, Trash2, KeyRound, 
  X, AlertCircle, CheckCircle2, RotateCw, Sparkles, ChevronLeft, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../lib/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { SEO } from "../components/SEO";
import { getApiUrl } from "../lib/api";
import { DeleteAccountModal } from "../components/DeleteAccountModal";
import { uploadImageFile } from "../lib/uploadService";

export const AccountSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Profile fields
  const [name, setName] = useState(user?.displayName || "গ্রাহক");
  const [phone, setPhone] = useState(profile?.phoneNumber || "01700000000");
  const [email, setEmail] = useState(user?.email || "user@allmayadin.com");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Update Credential Modal State
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateType, setUpdateType] = useState<"phone" | "email" | "password">("phone");
  const [updateScreen, setUpdateScreen] = useState<"input" | "verify" | "success">("input");
  const [newVal, setNewVal] = useState("");
  const [updateOtp, setUpdateOtp] = useState(["", "", "", "", "", ""]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null);

  // Change Password Specific fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const updateOtpRefs = [
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null)
  ];

  useEffect(() => {
    if (user) {
      if (user.displayName) setName(user.displayName);
      if (user.email) setEmail(user.email);
      if (user.photoURL) setPhotoURL(user.photoURL);
    }
    if (profile?.phoneNumber) {
      setPhone(profile.phoneNumber);
    }
  }, [user, profile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsSavingProfile(true);
      try {
        const publicUrl = await uploadImageFile(file);
        if (publicUrl) {
          setPhotoURL(publicUrl);
          if (user) {
            await updateProfile(user, { photoURL: publicUrl });
            await setDoc(doc(db, "users", user.uid), { photoURL: publicUrl }, { merge: true });
            await refreshProfile();
          }
          setProfileMsg("প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে!");
          setTimeout(() => setProfileMsg(""), 3000);
        }
      } catch (err) {
        console.error("Photo upload error:", err);
      } finally {
        setIsSavingProfile(false);
      }
    }
  };

  const handleSaveNameOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg("");

    try {
      if (user) {
        await updateProfile(user, { displayName: name.trim() });
        await setDoc(doc(db, "users", user.uid), {
          displayName: name.trim(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        await refreshProfile();
        setProfileMsg("নাম সফলভাবে পরিবর্তন করা হয়েছে!");
        setTimeout(() => setProfileMsg(""), 3000);
      }
    } catch (err) {
      setProfileMsg("নাম পরিবর্তনে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOpenUpdateModal = (type: "phone" | "email" | "password") => {
    setUpdateType(type);
    setUpdateScreen("input");
    setNewVal("");
    setNewPassword("");
    setConfirmPassword("");
    setUpdateOtp(["", "", "", "", "", ""]);
    setUpdateError(null);
    setUpdateSuccessMsg(null);
    setIsUpdateModalOpen(true);
  };

  const handleSendUpdateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVal.trim()) {
      setUpdateError("দয়া করে সঠিক তথ্য টাইপ করুন।");
      return;
    }

    setUpdateLoading(true);
    setUpdateError(null);

    try {
      const cleanVal = newVal.trim();
      let body: any = {};
      if (updateType === "phone") {
        const digits = cleanVal.replace(/\D/g, "");
        if (digits.length < 10) {
          throw new Error("দয়া করে সঠিক ১১ সংখ্যার মোবাইল নম্বর টাইপ করুন।");
        }
        const last10 = digits.slice(-10);
        body = { phone: `+880${last10}` };
      } else {
        if (!cleanVal.includes("@")) {
          throw new Error("দয়া করে সঠিক ইমেইল এড্রেস টাইপ করুন।");
        }
        body = { email: cleanVal.toLowerCase() };
      }

      const res = await fetch(getApiUrl("/api/otp/send"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ওটিপি পাঠাতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
      }

      setUpdateSuccessMsg(`আপনার নতুন ${updateType === 'phone' ? 'মোবাইলে' : 'ইমেইলে'} ওটিপি কোড পাঠানো হয়েছে।`);
      setUpdateScreen("verify");
    } catch (err: any) {
      setUpdateError(err.message || "সার্ভার এরর, ওটিপি পাঠানো যায়নি।");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleVerifyAndSaveCredential = async () => {
    const enteredOtp = updateOtp.join("");
    if (enteredOtp.length !== 6) {
      setUpdateError("অনুগ্রহ করে সঠিক ৬ সংখ্যার ওটিপি কোড লিখুন।");
      return;
    }

    setUpdateLoading(true);
    setUpdateError(null);

    try {
      const cleanVal = newVal.trim();
      let verifyBody: any = {};
      if (updateType === "phone") {
        const digits = cleanVal.replace(/\D/g, "");
        const last10 = digits.slice(-10);
        verifyBody = { phone: `+880${last10}`, otp: enteredOtp };
      } else {
        verifyBody = { email: cleanVal.toLowerCase(), otp: enteredOtp };
      }

      // 1. Verify OTP first
      const verifyRes = await fetch(getApiUrl("/api/otp/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifyBody)
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "ভুল ওটিপি কোড। অনুগ্রহ করে সঠিক কোড দিন।");
      }

      // 2. Call server endpoint to update credential in Firebase Auth & Firestore
      if (!user) {
        throw new Error("ইউজার সেশন পাওয়া যায়নি। দয়া করে আবার লগইন করুন।");
      }

      const updateRes = await fetch(getApiUrl("/api/auth/update-credential"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          type: updateType,
          value: cleanVal
        })
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) {
        throw new Error(updateData.error || "তথ্য আপডেট করতে সমস্যা হয়েছে।");
      }

      // Success
      await refreshProfile();
      setUpdateScreen("success");
    } catch (err: any) {
      setUpdateError(err.message || "ওটিপি ভেরিফিকেশন বা আপডেট ব্যর্থ হয়েছে।");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleSavePasswordChangeDirectly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setUpdateError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }
    if (newPassword !== confirmPassword) {
      setUpdateError("উভয় পাসওয়ার্ড হুবহু একই হতে হবে।");
      return;
    }

    setUpdateLoading(true);
    setUpdateError(null);

    try {
      if (!user) throw new Error("ইউজার লগইন সেশন পাওয়া যায়নি।");

      const updateRes = await fetch(getApiUrl("/api/admin/users/update"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          password: newPassword
        })
      });
      const data = await updateRes.json();
      if (!updateRes.ok || !data.success) {
        throw new Error(data.error || "পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে।");
      }

      setUpdateScreen("success");
    } catch (err: any) {
      setUpdateError(err.message || "পাসওয়ার্ড আপডেট ব্যর্থ হয়েছে।");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleOtpBoxChangeLocal = (index: number, val: string) => {
    setUpdateError(null);
    const cleanVal = val.replace(/\D/g, "");

    // Handle full paste
    if (cleanVal.length > 1) {
      const pasteDigits = cleanVal.slice(0, 6).split("");
      const newOtp = [...updateOtp];
      pasteDigits.forEach((d, idx) => {
        newOtp[idx] = d;
      });
      setUpdateOtp(newOtp);
      const nextFocus = Math.min(pasteDigits.length, 5);
      updateOtpRefs[nextFocus].current?.focus();

      if (pasteDigits.length === 6) {
        setTimeout(() => {
          handleVerifyAndSaveCredential();
        }, 50);
      }
      return;
    }

    const newOtp = [...updateOtp];
    newOtp[index] = cleanVal;
    setUpdateOtp(newOtp);

    if (cleanVal && index < 5) {
      updateOtpRefs[index + 1].current?.focus();
    }

    if (cleanVal && index === 5) {
      const enteredOtp = newOtp.join("");
      if (enteredOtp.length === 6) {
        setTimeout(() => {
          handleVerifyAndSaveCredential();
        }, 50);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col items-center px-6 py-10 font-sans relative overflow-hidden select-none">
      <SEO title="অ্যাকাউন্ট সেটিংস (Account Settings)" description="আপনার অল মায়াদিন বাজার অ্যাকাউন্ট সেটিংস ও নিরাপত্তা" />

      {/* Top Background Glows matching Forgot Password */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Navigation Header */}
      <div className="w-full max-w-[390px] flex items-center justify-between z-10 mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-full flex items-center justify-center border border-white/5 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold tracking-widest text-slate-300 uppercase">SETTINGS</span>
        <div className="w-10 h-10" /> {/* Balance spacer */}
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[390px] flex flex-col z-10">
        
        {/* BRAND LOGO HEADER */}
        <div className="flex flex-col items-center text-center">
          <div className="w-15 h-15 rounded-3xl overflow-hidden shadow-lg bg-black/40 flex items-center justify-center ring-2 ring-emerald-500/30">
            <img 
              src="/app_icon.png" 
              alt="BINISTA" 
              className="w-full h-full object-cover" 
            />
          </div>
          <h1 className="text-sm font-black tracking-[0.25em] mt-3.5 uppercase text-white">BINISTA PROFILE</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">রিয়েল-টাইম ডাটা ও ওটিপি প্যানেল</p>
        </div>

        {/* FEEDBACK MSG */}
        {profileMsg && (
          <div className="mt-6 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5 leading-relaxed">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{profileMsg}</span>
          </div>
        )}

        {/* PROFILE PHOTO AVATAR BOX */}
        <div className="mt-8 rounded-[28px] border border-white/5 bg-[#121620]/60 p-5 flex items-center gap-4 relative overflow-hidden backdrop-blur-md">
          <div className="relative w-16 h-16 rounded-2xl bg-[#1a2130] text-white flex items-center justify-center shrink-0 overflow-hidden border border-white/10 group shadow-inner">
            {photoURL ? (
              <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-slate-400" />
            )}
            <label className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Camera className="w-4.5 h-4.5 text-slate-300" />
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-white text-[15px] truncate">{name}</h4>
            <p className="text-slate-400 text-[11px] truncate mt-0.5">{email}</p>
          </div>
        </div>

        {/* SETTINGS CARD SECTION */}
        <div className="mt-6 space-y-3.5">
          
          {/* Item 1: Name Update Form */}
          <form onSubmit={handleSaveNameOnly} className="space-y-1">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">পূর্ণ নাম (Full Name)</label>
            <div className="rounded-2xl border border-white/5 px-4 py-3.5 bg-[#121620]/60 focus-within:border-emerald-500/40 flex items-center transition-colors">
              <User className="w-5 h-5 text-slate-500 mr-3 shrink-0" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none font-semibold"
                placeholder="আপনার নাম"
              />
              <button
                type="submit"
                disabled={isSavingProfile}
                className="ml-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {isSavingProfile ? "..." : "Save"}
              </button>
            </div>
          </form>

          {/* Item 2: Mobile Update (with OTP modal click) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">মোবাইল নাম্বার (Mobile)</label>
            <div className="rounded-2xl border border-white/5 px-4 py-3.5 bg-[#121620]/60 flex items-center justify-between transition-colors">
              <div className="flex items-center">
                <Smartphone className="w-5 h-5 text-slate-500 mr-3 shrink-0" />
                <span className="text-sm font-semibold text-slate-300">{phone || "নম্বর নেই"}</span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenUpdateModal("phone")}
                className="text-xs font-bold text-[#10b981] hover:text-emerald-400 hover:underline transition-all cursor-pointer"
              >
                পরিবর্তন করুন
              </button>
            </div>
          </div>

          {/* Item 3: Email Update (with OTP modal click) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">ইমেইল এড্রেস (Email)</label>
            <div className="rounded-2xl border border-white/5 px-4 py-3.5 bg-[#121620]/60 flex items-center justify-between transition-colors">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-slate-500 mr-3 shrink-0" />
                <span className="text-sm font-semibold text-slate-300 truncate max-w-[200px]">{email}</span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenUpdateModal("email")}
                className="text-xs font-bold text-[#10b981] hover:text-emerald-400 hover:underline transition-all cursor-pointer"
              >
                পরিবর্তন করুন
              </button>
            </div>
          </div>

          {/* Item 4: Password Update */}
          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">পাসওয়ার্ড (Password)</label>
            <div className="rounded-2xl border border-white/5 px-4 py-3.5 bg-[#121620]/60 flex items-center justify-between transition-colors">
              <div className="flex items-center">
                <Lock className="w-5 h-5 text-slate-500 mr-3 shrink-0" />
                <span className="text-sm font-semibold text-slate-300">••••••••</span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenUpdateModal("password")}
                className="text-xs font-bold text-[#10b981] hover:text-emerald-400 hover:underline transition-all cursor-pointer"
              >
                পরিবর্তন করুন
              </button>
            </div>
          </div>

        </div>

        {/* LOG OUT BUTTON & PERMANENT DELETE SECTION */}
        <div className="mt-8 space-y-3.5">
          <button
            onClick={handleLogout}
            className="w-full py-3.5 rounded-full font-bold text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>অ্যাকাউন্ট থেকে লগআউট করুন</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-3 rounded-full font-bold text-[10px] bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/5 flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>স্থায়ীভাবে অ্যাকাউন্ট মুছে ফেলুন (Delete Account)</span>
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* UPDATE MODAL PANEL - MATCHING FORGOT PASSWORD MODAL DESIGN IN EVERY PIXEL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isUpdateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-[390px] bg-[#0B0E14] border border-white/10 rounded-[32px] p-6 text-white shadow-2xl select-none"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 border border-white/5 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              {/* Status Header */}
              <div className="text-center mt-3">
                <div className="w-14 h-14 rounded-full bg-[#121824] border border-white/10 flex items-center justify-center m-auto text-slate-300 mb-4 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                  {updateType === 'phone' ? <Smartphone className="w-6 h-6" /> : updateType === 'email' ? <Mail className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  {updateType === 'phone' && 'Change Phone Number'}
                  {updateType === 'email' && 'Change Email Address'}
                  {updateType === 'password' && 'Change Password'}
                </h3>
                <p className="text-xs text-slate-400 mt-2 px-4 leading-relaxed">
                  {updateType === 'phone' && "আমরা আপনার নতুন মোবাইল নাম্বারে ৬ সংখ্যার একটি ওটিপি কোড পাঠাবো।"}
                  {updateType === 'email' && "আমরা আপনার নতুন ইমেইল এড্রেসে ৬ সংখ্যার একটি ওটিপি কোড পাঠাবো।"}
                  {updateType === 'password' && "আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে শক্তিশালী পাসওয়ার্ড ব্যবহার করুন।"}
                </p>
              </div>

              {/* Errors & Success Feedback */}
              {updateError && (
                <div className="mt-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{updateError}</span>
                </div>
              )}
              {updateSuccessMsg && (
                <div className="mt-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{updateSuccessMsg}</span>
                </div>
              )}

              {/* Screens Flow */}
              <div className="mt-6">
                
                {/* SCREEN 1: INPUT SENDER VIEW */}
                {updateScreen === 'input' && (
                  updateType === 'password' ? (
                    <form onSubmit={handleSavePasswordChangeDirectly} className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">New Password</label>
                        <div className="rounded-2xl border border-white/10 px-4 py-3.5 bg-[#121824] flex items-center focus-within:border-emerald-500/40">
                          <Lock className="w-5 h-5 text-slate-500 mr-3 shrink-0" />
                          <input
                            type={showNewPassword ? "text" : "password"}
                            required
                            placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-transparent text-sm text-white outline-none font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="text-slate-400 hover:text-white p-0.5"
                          >
                            {showNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Confirm Password</label>
                        <div className="rounded-2xl border border-white/10 px-4 py-3.5 bg-[#121824] flex items-center focus-within:border-emerald-500/40">
                          <Lock className="w-5 h-5 text-slate-500 mr-3 shrink-0" />
                          <input
                            type={showNewPassword ? "text" : "password"}
                            required
                            placeholder="হুবহু একই পাসওয়ার্ড লিখুন"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-transparent text-sm text-white outline-none font-semibold"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={updateLoading}
                        className="w-full py-3.5 rounded-full bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.35)] mt-2"
                      >
                        {updateLoading ? (
                          <RotateCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>পাসওয়ার্ড পরিবর্তন করুন</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSendUpdateOtp} className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                          {updateType === 'phone' ? 'মোবাইল নাম্বার দিন' : 'ইমেইল এড্রেস দিন'}
                        </label>
                        <div className="rounded-2xl border border-white/10 px-4 py-3.5 bg-[#121824] flex items-center focus-within:border-emerald-500/40 transition-colors">
                          {updateType === 'phone' ? (
                            <>
                              <Phone className="w-5 h-5 text-slate-500 mr-3 shrink-0" />
                              <span className="text-sm font-bold text-slate-300 mr-2 select-none">+880</span>
                              <input
                                type="tel"
                                required
                                placeholder="1XXXXXXXXX"
                                value={newVal}
                                onChange={(e) => setNewVal(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                className="w-full bg-transparent text-sm text-white outline-none font-semibold"
                              />
                            </>
                          ) : (
                            <>
                              <Mail className="w-5 h-5 text-slate-500 mr-3 shrink-0" />
                              <input
                                type="email"
                                required
                                placeholder="example@gmail.com"
                                value={newVal}
                                onChange={(e) => setNewVal(e.target.value)}
                                className="w-full bg-transparent text-sm text-white outline-none font-semibold"
                              />
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={updateLoading}
                        className="w-full py-3.5 rounded-full bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.35)] mt-2"
                      >
                        {updateLoading ? (
                          <RotateCw className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <>
                            <span>ওটিপি পাঠান (Send OTP)</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )
                )}

                {/* SCREEN 2: OTP VERIFICATION BOX VIEW */}
                {updateScreen === 'verify' && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="block text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                        ভেরিফিকেশন কোড লিখুন
                      </label>
                      <div className="flex justify-between gap-2 max-w-[280px] mx-auto">
                        {updateOtp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={updateOtpRefs[idx]}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpBoxChangeLocal(idx, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace" && !digit && idx > 0) {
                                updateOtpRefs[idx - 1].current?.focus();
                              }
                            }}
                            className="w-10 h-12 bg-[#121824] border border-white/10 rounded-xl text-center text-lg font-black text-white outline-none focus:border-[#10b981] transition-colors"
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyAndSaveCredential}
                      disabled={updateLoading}
                      className="w-full py-3.5 rounded-full bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.35)]"
                    >
                      {updateLoading ? (
                        <RotateCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>ওটিপি যাচাই করুন (Verify & Save)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* SCREEN 3: SUCCESS GLOW CARD */}
                {updateScreen === 'success' && (
                  <div className="text-center space-y-5 py-4">
                    <div className="relative w-15 h-15 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center m-auto text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.35)] animate-bounce">
                      <Check className="w-7 h-7 stroke-[3]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-base">সফলভাবে পরিবর্তন করা হয়েছে!</h4>
                      <p className="text-xs text-slate-400 mt-1.5 px-4 leading-relaxed">
                        আপনার নতুন তথ্য সফলভাবে যুক্ত করা হয়েছে। পরবর্তী সময়ে এটি দিয়ে সহজেই লগইন করা যাবে।
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsUpdateModalOpen(false)}
                      className="w-full py-3.5 rounded-full bg-white text-black font-extrabold text-sm hover:bg-slate-100 shadow-sm cursor-pointer active:scale-95 transition-all"
                    >
                      বন্ধ করুন (Close)
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
export default AccountSettings;
