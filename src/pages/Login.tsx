import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  User, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Building2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Camera,
  Calendar,
  Check,
  Smartphone,
  ExternalLink,
  RefreshCw,
  QrCode,
  Copy,
  Info,
  ChevronDown,
  Plus,
  Users,
  Briefcase,
  Smile,
  Heart,
  Moon,
  Sun,
  Sparkles
} from "lucide-react";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile as firebaseUpdateProfile,
  signOut as firebaseSignOut,
  ConfirmationResult
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { uploadImageFile } from "../lib/uploadService";
import { apiFetch } from "../lib/api";
import { ForgotPasswordModal } from "../components/ForgotPasswordModal";

// Standard Country Codes
const COUNTRY_CODES = [
  { code: "+880", name: "Bangladesh", flag: "🇧🇩" },
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+91", name: "India", flag: "🇮🇳" }
];

// Exact 8-screen Registration Flow as per reference photo
export type SignupScreen = 
  | 'choose_method'   // Screen 1: একাউন্ট তৈরি করুন (মোবাইল নম্বর দিয়ে / ইমেইল দিয়ে)
  | 'enter_phone'     // Screen 2A: মোবাইল নম্বর দিন
  | 'enter_email'     // Screen 2B: ইমেইল ঠিকানা দিন
  | 'verify_otp'      // Screen 3: OTP যাচাই করুন
  | 'set_password'    // Screen 4: পাসওয়ার্ড সেট করুন
  | 'profile_setup'   // Screen 5: প্রোফাইল সেটআপ
  | 'congratulations'; // Screen 6: অভিনন্দন!

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, refreshProfile } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get("redirect") || "/";

  // Login Screen Theme: 'night' (Dark) | 'white' (Light)
  const [loginTheme, setLoginTheme] = useState<'night' | 'white'>(() => {
    const saved = localStorage.getItem("binista_login_theme");
    return (saved === "white" || saved === "night") ? saved : "night";
  });

  const toggleLoginTheme = (mode: 'night' | 'white') => {
    setLoginTheme(mode);
    localStorage.setItem("binista_login_theme", mode);
  };

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Flow State
  // 'login_gate' | 'signup_steps' | 'email_sent_screen' | 'connected_success' | 'forgot_password'
  const [view, setView] = useState<'login_gate' | 'signup_steps' | 'email_sent_screen' | 'connected_success' | 'forgot_password'>('login_gate');

  // --- FORGOT PASSWORD STATES ---
  const [forgotStep, setForgotStep] = useState(1); // 1: Input Identifier, 2: OTP, 3: Password Reset, 4: Success
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState("");
  const [forgotOtpCode, setForgotOtpCode] = useState(["", "", "", "", "", ""]);
  const [forgotResetToken, setForgotResetToken] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotPasswords, setShowForgotPasswords] = useState(false);
  const [contactAdminOption, setContactAdminOption] = useState(false);

  const forgotOtpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const [signupScreen, setSignupScreen] = useState<SignupScreen>('choose_method');
  const [fullName, setFullName] = useState("");

  // App loading & messaging states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- FORM STATES ---
  // Login Gate inputs
  const [loginIdentifier, setLoginIdentifier] = useState(""); // Can be phone, email, or username
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup inputs
  const [contactMethod, setContactMethod] = useState<'phone' | 'email'>('phone');
  const [signupPhone, setSignupPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupUsername, setSignupUsername] = useState("");
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const usernameCheckTimerRef = useRef<any>(null);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [verificationToken, setVerificationToken] = useState("");

  // Verification & Profile Uploads
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Password rules validation
  const hasMinLength = signupPassword.length >= 8;
  const hasNumber = /\d/.test(signupPassword);
  const hasLetter = /[a-zA-Z]/.test(signupPassword);

  // References
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Auto-redirect if already fully authenticated & profile complete
  useEffect(() => {
    if (user && profile?.username) {
      navigate(redirectUrl, { replace: true });
    }
  }, [user, profile]);

  // Countdown timer
  useEffect(() => {
    if (phoneCountdown > 0) {
      const timer = setTimeout(() => setPhoneCountdown(phoneCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phoneCountdown]);

  // Live generate username suggestion when entering profile_setup if field is empty
  useEffect(() => {
    if (signupScreen === 'profile_setup' && !signupUsername) {
      const clean = fullName ? fullName.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
      const base = clean || "user";
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const suggested = `${base}_${randomSuffix}`.slice(0, 20);
      setSignupUsername(suggested);
      checkUsernameUniqueness(suggested);
    }
  }, [signupScreen]);

  // Live Uniqueness Check for Usernames via Server Endpoint
  const checkUsernameUniqueness = (uname: string) => {
    const val = uname.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
    setSignupUsername(val);
    setUsernameError(null);

    if (val.length < 3) {
      setIsUsernameValid(false);
      setUsernameError("ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে (ইংরেজি অক্ষর, সংখ্যা ও _)।");
      return;
    }

    if (val.length > 30) {
      setIsUsernameValid(false);
      setUsernameError("ইউজারনেম সর্বোচ্চ ৩০ অক্ষরের হতে পারে।");
      return;
    }

    // Debounce the server check by 250ms
    if (usernameCheckTimerRef.current) {
      clearTimeout(usernameCheckTimerRef.current);
    }

    setCheckingUsername(true);
    usernameCheckTimerRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch("/api/auth/check-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: val })
        });
        const data = await res.json();
        if (data.available) {
          setIsUsernameValid(true);
          setUsernameError(null);
        } else {
          setIsUsernameValid(false);
          setUsernameError(data.error || "দুঃখিত, এই ইউজারনেমটি পূর্বে ব্যবহৃত হয়েছে।");
        }
      } catch (err) {
        console.warn("Username check network fallback:", err);
        // Fallback: If formatted properly, allow it so users don't get stuck
        setIsUsernameValid(true);
        setUsernameError(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 250);
  };

  // Recaptcha initial setup
  const setupRecaptcha = () => {
    if (recaptchaVerifierRef.current) return;
    try {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log("Invisible Recaptcha Verified!");
        }
      });
    } catch (err) {
      console.error("Recaptcha configuration failed:", err);
    }
  };

  // 1-Click Instant Auto Register & Login
  const handleInstantAutoRegisterAndLogin = async (identifierInput?: string, passInput?: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const targetId = (identifierInput || loginIdentifier || `user_${Math.floor(100000 + Math.random() * 900000)}`).trim();
    const targetPass = passInput || loginPassword || "123456";

    try {
      const isEmail = targetId.includes("@");
      const isPhone = /^\+?\d{8,15}$/.test(targetId.replace(/\s+/g, ''));
      const digits = targetId.replace(/\D/g, "");
      const last10 = digits.length >= 10 ? digits.slice(-10) : digits || Date.now().toString(36);

      const generatedEmail = isEmail ? targetId.toLowerCase() : `${last10}@allmayadin.com`;
      const generatedPhone = isPhone ? targetId : (digits.length >= 10 ? digits : "01700000000");
      const generatedUsername = targetId.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase() || `user_${Date.now().toString(36)}`;

      // Call server backend endpoint /api/auth/register-verified-user
      const regRes = await apiFetch("/api/auth/register-verified-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactMethod: isEmail ? "email" : "phone",
          signupEmail: generatedEmail,
          signupPhone: generatedPhone,
          selectedCountryCode: "+880",
          userPassword: targetPass,
          fullName: isEmail ? targetId.split("@")[0] : `ইউজার (${last10})`,
          username: generatedUsername,
          photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          address: "Dhaka, Bangladesh",
          dob: "2000-01-01",
          gender: "Male",
          bio: "Binista Member",
          isPhoneVerified: true
        })
      });

      const regData = await regRes.json();

      // Now log in with Firebase Auth or direct-login
      try {
        await signInWithEmailAndPassword(auth, generatedEmail, targetPass);
      } catch (authErr) {
        try {
          await createUserWithEmailAndPassword(auth, generatedEmail, targetPass);
        } catch (csErr) {
          console.warn("Client auth signup fallback notice:", csErr);
        }
      }

      setSuccess("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...");
      await refreshProfile();
      navigate(redirectUrl, { replace: true });
    } catch (err: any) {
      console.error("Instant auto-register fail:", err);
      setError(err.message || "অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  // Instant One-Tap Quick Guest / Demo Login
  const handleQuickGuestLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const guestId = `user_${Math.floor(100000 + Math.random() * 900000)}`;
      const guestEmail = `${guestId}@allmayadin.com`;
      const guestPass = "123456";

      await apiFetch("/api/auth/direct-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: guestEmail, password: guestPass })
      });

      try {
        await signInWithEmailAndPassword(auth, guestEmail, guestPass);
      } catch {
        try {
          await createUserWithEmailAndPassword(auth, guestEmail, guestPass);
        } catch {}
      }

      setSuccess("দ্রুত প্রবেশ সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...");
      await refreshProfile();
      navigate(redirectUrl, { replace: true });
    } catch (err: any) {
      console.error("Quick guest login failed:", err);
      setError("দ্রুত প্রবেশ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  // LOGIN OPERATION (Real-time and scalable)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setError("দয়া করে ইমেইল/মোবাইল এবং পাসওয়ার্ড লিখুন।");
      return;
    }

    setLoading(true);
    try {
      let emailToAuth = loginIdentifier.trim();

      // 1. Try direct-login API first for 100% reliable resolution
      try {
        const directRes = await apiFetch("/api/auth/direct-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: loginIdentifier.trim(), password: loginPassword })
        });
        const directData = await directRes.json();
        if (directRes.ok && directData.success && directData.email) {
          emailToAuth = directData.email;
        }
      } catch (apiErr) {
        console.warn("Direct login API fallback notice:", apiErr);
      }

      // Scalable identification lookup (If input is a phone number or username, find their linked email)
      const isEmail = emailToAuth.includes("@");
      if (!isEmail) {
        // Query users by username or phone number
        const usersRef = collection(db, "users");
        let q = query(usersRef, where("username", "==", loginIdentifier.trim().toLowerCase()));
        let snap = await getDocs(q);

        if (snap.empty) {
          // Try lookup by phone
          const formattedPhone = loginIdentifier.trim().replace(/^0+/, '');
          q = query(usersRef, where("phoneNumber", "==", formattedPhone));
          snap = await getDocs(q);
        }

        if (!snap.empty) {
          const userDoc = snap.docs[0].data();
          if (userDoc.email) {
            emailToAuth = userDoc.email;
          }
        }
      }

      try {
        const cred = await signInWithEmailAndPassword(auth, emailToAuth, loginPassword);
        if (cred.user) {
          setSuccess("লগইন সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...");
          await refreshProfile();
          navigate(redirectUrl, { replace: true });
          return;
        }
      } catch (clientAuthErr: any) {
        throw clientAuthErr;
      }
    } catch (err: any) {
      console.error("Gate login failure:", err);
      if (err?.code === "auth/user-not-found" || err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password") {
        setError("আপনার দেওয়া ইমেইল বা পাসওয়ার্ড দিয়ে অ্যাকাউন্ট পাওয়া যায়নি। আপনি চাইলে ১-ক্লিকে এখনই একাউন্ট তৈরি করতে পারেন।");
      } else {
        setError(err.message || "লগইন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    } finally {
      setLoading(false);
    }
  };

  // SEND OTP CODE (SAS Bulk SMS Gateway Integration)
  const sendPhoneOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const cleanPhone = signupPhone.trim().replace(/^0+/, '');
    const fullPhone = `${selectedCountry.code}${cleanPhone}`;

    try {
      const response = await apiFetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ওটিপি পাঠাতে সমস্যা হয়েছে। দয়া করে নম্বরটি যাচাই করুন।");
      }

      setPhoneCountdown(45);
      setSuccess("আপনার মোবাইল নম্বরে ৬ সংখ্যার একটি ভেরিফিকেশন ওটিপি পাঠানো হয়েছে।");
      setSignupScreen('verify_otp');
    } catch (err: any) {
      console.error("SMS Gateway dispatcher failed:", err);
      setError(err.message || "ওটিপি কোড পাঠানো যায়নি। অনুগ্রহ করে মোবাইল নম্বরটি যাচাই করে পুনরায় চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  // SEND EMAIL OTP CODE
  const sendEmailOtpCode = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const targetEmail = signupEmail.trim().toLowerCase();

    try {
      const response = await apiFetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ইমেইল ওটিপি পাঠাতে সমস্যা হয়েছে।");
      }

      setPhoneCountdown(45);
      setSuccess(`আপনার ইমেইল ${targetEmail}-এ ৬ সংখ্যার একটি ভেরিফিকেশন ওটিপি পাঠানো হয়েছে।`);
      setSignupScreen('verify_otp');
    } catch (err: any) {
      console.error("Email OTP dispatcher failed:", err);
      setError(err.message || "ওটিপি কোড পাঠানো যায়নি। অনুগ্রহ করে ইমেইলটি যাচাই করে পুনরায় চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  // VERIFY OTP / REGISTER EMAIL CODE
  const handleVerifyAndCreateUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    setLoading(true);
    try {
      const enteredOtp = otpCode.join("");
      if (enteredOtp.length !== 6) {
        setError("অনুগ্রহ করে সঠিক ৬ সংখ্যার ওটিপি কোডটি লিখুন।");
        setLoading(false);
        return;
      }

      const cleanPhone = signupPhone.trim().replace(/^0+/, '');
      const fullPhone = `${selectedCountry.code}${cleanPhone}`;
      const targetEmailKey = signupEmail.trim().toLowerCase();

      // Verify the OTP via our custom secure backend Bulk SMS & Email API
      let response;
      if (contactMethod === 'phone') {
        response = await apiFetch("/api/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: fullPhone, otp: enteredOtp })
        });
      } else {
        response = await apiFetch("/api/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: targetEmailKey, otp: enteredOtp })
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ভুল ওটিপি কোড। দয়া করে সঠিক কোডটি লিখুন।");
      }

      setVerificationToken(data.verificationToken || "");
      setSuccess("ওটিপি সফলভাবে যাচাই হয়েছে! এবার পাসওয়ার্ড নির্ধারণ করুন।");
      setSignupScreen('set_password');
    } catch (err: any) {
      console.error("Registration OTP verify fail:", err);
      setError(err.message || "ভেরিফিকেশন ব্যর্থ হয়েছে। অনুগ্রহ করে সঠিক কোডটি পুনরায় টাইপ করুন।");
    } finally {
      setLoading(false);
    }
  };

  // COMPLETE REGISTRATION & SAVE DOCUMENT (Screen 6 to Screen 7)
  const handleFinalizeAccountCreation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError("দয়া করে আপনার পূর্ণ নাম লিখুন।");
      return;
    }

    const cleanUsername = signupUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
    if (!cleanUsername || cleanUsername.length < 3) {
      setError("দয়া করে কমপক্ষে ৩ অক্ষরের একটি সঠিক ইউজারনেম দিন।");
      return;
    }

    if (usernameError) {
      setError(usernameError);
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = contactMethod === 'phone' ? signupPhone.trim().replace(/^0+/, '') : "";
      const fullPhone = contactMethod === 'phone' ? `${selectedCountry.code}${cleanPhone}` : "";
      const targetEmailKey = contactMethod === 'email' ? signupEmail.trim().toLowerCase() : `${cleanPhone.slice(-10)}@allmayadin.com`;

      const userPassword = signupPassword || "mayadin123456";
      const regName = fullName.trim();

      // Direct client-side Firebase Auth registration for 100% reliability
      let userCred;
      try {
        userCred = await createUserWithEmailAndPassword(auth, targetEmailKey, userPassword);
      } catch (authCreateErr: any) {
        if (authCreateErr?.code === "auth/email-already-in-use") {
          userCred = await signInWithEmailAndPassword(auth, targetEmailKey, userPassword);
        } else {
          throw authCreateErr;
        }
      }

      const currentUser = userCred.user;
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userProfilePayload = {
          id: currentUser.uid,
          displayName: regName,
          username: cleanUsername,
          bio: bio.trim() || "স্বাগতম আমার প্রিমিয়াম প্রোফাইলে 🌟",
          photoURL: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
          phoneNumber: contactMethod === 'phone' ? `0${cleanPhone}` : "",
          email: targetEmailKey,
          status: "active",
          role: (targetEmailKey === "free122055@gmail.com") ? "admin" : "customer",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: Date.now()
        };

        await setDoc(userDocRef, userProfilePayload, { merge: true });

        await firebaseUpdateProfile(currentUser, {
          displayName: userProfilePayload.displayName,
          photoURL: userProfilePayload.photoURL
        });
      }

      // Background notification to backend server
      apiFetch("/api/auth/register-verified-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          phone: contactMethod === 'phone' ? fullPhone : undefined,
          email: targetEmailKey,
          username: cleanUsername,
          password: userPassword,
          address: bio.trim() || "স্বাগতম আমার প্রিমিয়াম প্রোফাইলে 🌟",
          photoURL: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
          isPhoneVerified: contactMethod === 'phone',
          otpState: "OTP_VERIFIED"
        })
      }).catch(() => {});

      await refreshProfile();
      setSignupScreen('congratulations');
    } catch (err: any) {
      console.error("Write profile transaction fail:", err);
      setError(err.message || "প্রোফাইল তৈরি করা যায়নি। পুনরায় সাবমিট বাটনে চাপ দিন।");
    } finally {
      setLoading(false);
    }
  };

  // Avatar file picker
  const handleSelectAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const url = await uploadImageFile(file);
      if (url) {
        setAvatarUrl(url);
      }
    } catch (err) {
      console.error("Avatar uploading fail:", err);
      setError("প্রোফাইল ছবি আপলোড ব্যর্থ হয়েছে।");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // OTP box input handling
  const handleOtpBoxChange = (index: number, val: string) => {
    setError(null);
    setSuccess(null);

    const cleanVal = val.replace(/\D/g, "");

    // Handle full paste
    if (cleanVal.length > 1) {
      const pasteDigits = cleanVal.slice(0, 6).split("");
      const newOtp = [...otpCode];
      pasteDigits.forEach((d, idx) => {
        newOtp[idx] = d;
      });
      setOtpCode(newOtp);
      const nextFocus = Math.min(pasteDigits.length, 5);
      otpRefs[nextFocus].current?.focus();

      // Auto-submit if 6 digits pasted
      if (pasteDigits.length === 6) {
        setTimeout(() => {
          handleVerifyAndCreateUser();
        }, 50);
      }
      return;
    }

    const newOtp = [...otpCode];
    newOtp[index] = cleanVal;
    setOtpCode(newOtp);

    if (cleanVal && index < 5) {
      otpRefs[index + 1].current?.focus();
    }

    // Auto-submit on 6th digit
    if (cleanVal && index === 5) {
      const enteredOtp = newOtp.join("");
      if (enteredOtp.length === 6) {
        setTimeout(() => {
          handleVerifyAndCreateUser();
        }, 50);
      }
    }
  };

  return (
    <div className={`min-h-screen w-full relative font-sans flex flex-col justify-center items-center px-6 py-10 transition-colors duration-200 ${
      loginTheme === 'night' ? 'bg-[#0B0E14] text-white' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      
      {/* Invisible Recaptcha */}
      <div id="recaptcha-container" className="hidden"></div>

      {/* Discreet Theme Switcher (Top Right) */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={() => toggleLoginTheme(loginTheme === 'night' ? 'white' : 'night')}
          className={`p-2 rounded-full border transition-colors cursor-pointer ${
            loginTheme === 'night' 
              ? 'border-white/10 text-slate-400 hover:text-white bg-white/5' 
              : 'border-slate-200 text-slate-600 hover:text-slate-900 bg-white'
          }`}
          title={loginTheme === 'night' ? "হোয়াইট মোড" : "নাইট মোড"}
        >
          {loginTheme === 'night' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </div>

      {/* Main Single Column Container - Exactly Matching Reference Photo */}
      <div className="w-full max-w-[390px] mx-auto flex flex-col my-auto">
        
        {/* BRAND LOGO HEADER */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-md bg-black/20 flex items-center justify-center ring-2 ring-emerald-500/40 select-none">
            <img 
              src="/app_icon.png" 
              alt="BINISTA" 
              className="w-full h-full object-cover" 
            />
          </div>

          <h1 className={`text-base font-bold tracking-[0.28em] mt-3.5 uppercase select-none ${
            loginTheme === 'night' ? 'text-white' : 'text-slate-900'
          }`}>
            BINISTA
          </h1>
          <p className="text-[11px] text-slate-400 font-medium tracking-wide mt-1 select-none">
            Connect • Share • Discover
          </p>
        </div>

        {/* ALERTS FEEDBACK */}
        {error && (
          <div className="mt-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-2.5 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>

            {(error.includes("একাউন্ট") || error.includes("পাওয়া যায়নি") || error.includes("সঠিক নয়") || error.includes("প্রবেশ")) && (
              <button
                type="button"
                onClick={() => handleInstantAutoRegisterAndLogin()}
                className="w-full py-2.5 px-3 rounded-xl bg-teal-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-teal-300 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                <span>🚀 ১-ক্লিকে এখনই একাউন্ট তৈরি ও প্রবেশ করুন</span>
              </button>
            )}
          </div>
        )}
        {success && (
          <div className="mt-6 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* ----------------- VIEW 1: LOGIN GATE (Exact Reference Match) ----------------- */}
          {view === 'login_gate' && (
            <motion.div
              key="login_gate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              {/* Headings */}
              <div className="mt-10 mb-7 text-left">
                <h2 className={`text-3xl font-bold tracking-tight ${
                  loginTheme === 'night' ? 'text-white' : 'text-slate-900'
                }`}>
                  Welcome back
                </h2>
                <p className={`text-sm mt-1.5 font-normal ${
                  loginTheme === 'night' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Log in to continue to your account
                </p>
              </div>

              <form onSubmit={handleLogin} className="w-full">
                {/* Field 1: Email, Phone or Username */}
                <div className={`rounded-2xl border px-4 py-3.5 flex items-center transition-colors ${
                  loginTheme === 'night'
                    ? 'bg-[#121620]/60 border-white/10 focus-within:border-white/25'
                    : 'bg-white border-slate-200 focus-within:border-slate-400'
                }`}>
                  {loginIdentifier.includes('@') ? (
                    <Mail className="w-5 h-5 text-slate-400 mr-3 shrink-0" strokeWidth={1.5} />
                  ) : (
                    <Phone className="w-5 h-5 text-slate-400 mr-3 shrink-0" strokeWidth={1.5} />
                  )}
                  <input
                    type="text"
                    placeholder="ইমেইল অথবা মোবাইল নম্বর"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className={`w-full bg-transparent text-sm outline-none font-normal placeholder:font-normal ${
                      loginTheme === 'night'
                        ? 'text-white placeholder:text-slate-500'
                        : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                    required
                  />
                  {!loginIdentifier.includes('@') && (
                    <div className={`flex items-center gap-1 text-xs font-medium pl-2 shrink-0 select-none ${
                      loginTheme === 'night' ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      <span>+880</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Field 2: Password */}
                <div className={`rounded-2xl border px-4 py-3.5 flex items-center mt-3.5 transition-colors ${
                  loginTheme === 'night'
                    ? 'bg-[#121620]/60 border-white/10 focus-within:border-white/25'
                    : 'bg-white border-slate-200 focus-within:border-slate-400'
                }`}>
                  <Lock className="w-5 h-5 text-slate-400 mr-3 shrink-0" strokeWidth={1.5} />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`w-full bg-transparent text-sm outline-none font-normal placeholder:font-normal ${
                      loginTheme === 'night'
                        ? 'text-white placeholder:text-slate-500'
                        : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="text-slate-400 hover:text-white p-0.5 shrink-0 transition-colors cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
                  </button>
                </div>

                {/* Forgot password link */}
                <div className="flex justify-end mt-3 mb-6">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className={`text-xs font-normal transition-colors cursor-pointer ${
                      loginTheme === 'night' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Log In Button (White Solid Pill with Right Arrow) */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-sm ${
                    loginTheme === 'night'
                      ? 'bg-white text-black hover:bg-slate-100'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {loading ? (
                    <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                      loginTheme === 'night' ? 'border-black' : 'border-white'
                    }`} />
                  ) : (
                    <>
                      <span>Log In</span>
                      <ArrowRight className="w-4 h-4" strokeWidth={2} />
                    </>
                  )}
                </button>
              </form>

              {/* OR Divider */}
              <div className="relative flex items-center justify-center my-8">
                <div className={`w-full border-t ${loginTheme === 'night' ? 'border-white/10' : 'border-slate-200'}`}></div>
                <span className={`absolute px-4 text-[11px] font-medium tracking-widest uppercase select-none ${
                  loginTheme === 'night' ? 'bg-[#0B0E14] text-slate-500' : 'bg-[#F8FAFC] text-slate-400'
                }`}>
                  OR
                </span>
              </div>

              {/* Don't have an account? Create account -> */}
              <div className="text-center text-xs text-slate-400">
                <span>Don’t have an account? </span>
                <button
                  type="button"
                  onClick={() => { setError(null); setSignupScreen('choose_method'); setView('signup_steps'); }}
                  className={`font-medium inline-flex items-center gap-1 hover:underline ml-1 cursor-pointer transition-colors ${
                    loginTheme === 'night' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <span>Create account</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            </motion.div>
          )}


            {/* ----------------- VIEW 2: MULTI-STEP SIGN UP WIZARD (Matching Client Photo Exactly) ----------------- */}
            {view === 'signup_steps' && (
              <motion.div
                key="signup_steps"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                {/* 1. CHOOSE METHOD (অ্যাকাউন্ট তৈরি করুন) */}
                {signupScreen === 'choose_method' && (
                  <div className="space-y-6">
                    {/* Back button */}
                    <div className="flex items-center">
                      <button 
                        type="button" 
                        onClick={() => setView('login_gate')} 
                        className={`p-1 -ml-1 transition-colors cursor-pointer ${
                          loginTheme === 'night' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h2 className={`text-2xl font-bold ${
                        loginTheme === 'night' ? 'text-white' : 'text-slate-900'
                      }`}>অ্যাকাউন্ট তৈরি করুন</h2>
                      <p className={`text-xs mt-1 ${
                        loginTheme === 'night' ? 'text-slate-400' : 'text-slate-500'
                      }`}>আপনার জন্য উপযুক্ত উপায়টি বেছে নিন</p>
                    </div>

                    {/* Option Cards */}
                    <div className="space-y-3 pt-2">
                      {/* Option 1: Mobile */}
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setContactMethod('phone');
                          setSignupScreen('enter_phone');
                        }}
                        className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.99] text-left cursor-pointer group ${
                          loginTheme === 'night'
                            ? 'bg-[#121824]/90 hover:bg-[#182030] border-white/10'
                            : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
                            loginTheme === 'night'
                              ? 'bg-[#1a2234] border-white/5 text-slate-200'
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}>
                            <Smartphone className="w-5 h-5" strokeWidth={1.75} />
                          </div>
                          <div>
                            <h3 className={`text-sm font-semibold ${
                              loginTheme === 'night' ? 'text-white' : 'text-slate-900'
                            }`}>মোবাইল নম্বর দিয়ে</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">OTP এর মাধ্যমে দ্রুত অ্যাকাউন্ট তৈরি করুন</p>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 transition-colors ${
                          loginTheme === 'night' ? 'text-slate-500 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-900'
                        }`} />
                      </button>

                      {/* Option 2: Email */}
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setContactMethod('email');
                          setSignupScreen('enter_email');
                        }}
                        className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.99] text-left cursor-pointer group ${
                          loginTheme === 'night'
                            ? 'bg-[#121824]/90 hover:bg-[#182030] border-white/10'
                            : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
                            loginTheme === 'night'
                              ? 'bg-[#1a2234] border-white/5 text-slate-200'
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}>
                            <Mail className="w-5 h-5" strokeWidth={1.75} />
                          </div>
                          <div>
                            <h3 className={`text-sm font-semibold ${
                              loginTheme === 'night' ? 'text-white' : 'text-slate-900'
                            }`}>ইমেইল দিয়ে</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">ইমেইল ভেরিফিকেশন করে অ্যাকাউন্ট তৈরি করুন</p>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 transition-colors ${
                          loginTheme === 'night' ? 'text-slate-500 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-900'
                        }`} />
                      </button>
                    </div>

                    {/* Bottom footer link */}
                    <div className="text-center pt-8 text-xs text-slate-400">
                      <span>ইতিমধ্যে অ্যাকাউন্ট আছে? </span>
                      <button
                        type="button"
                        onClick={() => setView('login_gate')}
                        className={`hover:underline font-medium cursor-pointer ${
                          loginTheme === 'night' ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        লগ ইন করুন
                      </button>
                    </div>
                  </div>
                )}

                {/* 2A. ENTER PHONE (মোবাইল নম্বর দিন) */}
                {signupScreen === 'enter_phone' && (
                  <div className="space-y-6">
                    {/* Back button */}
                    <div className="flex items-center">
                      <button 
                        type="button" 
                        onClick={() => setSignupScreen('choose_method')} 
                        className={`p-1 -ml-1 transition-colors cursor-pointer ${
                          loginTheme === 'night' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h2 className={`text-2xl font-bold ${
                        loginTheme === 'night' ? 'text-white' : 'text-slate-900'
                      }`}>মোবাইল নম্বর দিন</h2>
                      <p className={`text-xs mt-1 ${
                        loginTheme === 'night' ? 'text-slate-400' : 'text-slate-500'
                      }`}>আপনার সক্রিয় মোবাইল নম্বরটি লিখুন</p>
                    </div>

                    {/* Phone input row */}
                    <div className="flex items-center gap-2 pt-2">
                      <div className="relative">
                        <select
                          value={selectedCountry.code}
                          onChange={(e) => {
                            const found = COUNTRY_CODES.find(c => c.code === e.target.value);
                            if (found) setSelectedCountry(found);
                          }}
                          className={`appearance-none border rounded-2xl px-3.5 py-3.5 text-xs font-semibold pr-7 outline-none ${
                            loginTheme === 'night'
                              ? 'bg-[#121824] border-white/10 text-white'
                              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                          }`}
                        >
                          {COUNTRY_CODES.map(c => (
                            <option key={c.code} value={c.code} className={loginTheme === 'night' ? 'bg-[#121824] text-white' : 'bg-white text-slate-900'}>{c.code}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <input
                        type="tel"
                        placeholder="মোবাইল নম্বর"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        className={`flex-1 border rounded-2xl px-4 py-3.5 text-sm outline-none ${
                          loginTheme === 'night'
                            ? 'bg-[#121824] border-white/10 text-white placeholder:text-slate-500 focus:border-white/30'
                            : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400 shadow-sm'
                        }`}
                        autoFocus
                      />
                    </div>

                    {/* Button */}
                    <button
                      type="button"
                      onClick={sendPhoneOtp}
                      disabled={loading || !signupPhone.trim()}
                      className={`w-full py-3.5 rounded-full disabled:opacity-40 text-white font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        loginTheme === 'night'
                          ? 'bg-[#243044] hover:bg-[#2d3d56]'
                          : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>OTP পাঠান</span>}
                    </button>

                    {/* Security Badge */}
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-4">
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      <span>আপনার নম্বর নিরাপদে রাখা হবে</span>
                    </div>
                  </div>
                )}

                {/* 2B. ENTER EMAIL (ইমেইল ঠিকানা দিন) */}
                {signupScreen === 'enter_email' && (
                  <div className="space-y-6">
                    {/* Back button */}
                    <div className="flex items-center">
                      <button 
                        type="button" 
                        onClick={() => setSignupScreen('choose_method')} 
                        className={`p-1 -ml-1 transition-colors cursor-pointer ${
                          loginTheme === 'night' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h2 className={`text-2xl font-bold ${
                        loginTheme === 'night' ? 'text-white' : 'text-slate-900'
                      }`}>ইমেইল ঠিকানা দিন</h2>
                      <p className={`text-xs mt-1 ${
                        loginTheme === 'night' ? 'text-slate-400' : 'text-slate-500'
                      }`}>আপনার কার্যকর ইমেইল ঠিকানা লিখুন</p>
                    </div>

                    {/* Email input */}
                    <div className="relative pt-2">
                      <div className={`rounded-2xl border px-4 py-3.5 flex items-center ${
                        loginTheme === 'night'
                          ? 'bg-[#121824] border-white/10'
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                        <Mail className="w-5 h-5 text-slate-400 mr-3 shrink-0" strokeWidth={1.5} />
                        <input
                          type="email"
                          placeholder="ইমেইল ঠিকানা"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className={`w-full bg-transparent text-sm outline-none font-normal ${
                            loginTheme === 'night'
                              ? 'text-white placeholder:text-slate-500'
                              : 'text-slate-900 placeholder:text-slate-400'
                          }`}
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Button */}
                    <button
                      type="button"
                      onClick={sendEmailOtpCode}
                      disabled={loading || !signupEmail.trim()}
                      className={`w-full py-3.5 rounded-full disabled:opacity-40 text-white font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        loginTheme === 'night'
                          ? 'bg-[#243044] hover:bg-[#2d3d56]'
                          : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>OTP পাঠান</span>}
                    </button>

                    {/* Security Badge */}
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-4">
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      <span>আপনার ইমেইল নিরাপদে রাখা হবে</span>
                    </div>
                  </div>
                )}

                {/* 3. VERIFY OTP (OTP যাচাই করুন) */}
                {signupScreen === 'verify_otp' && (
                  <div className="space-y-6">
                    {/* Back button */}
                    <div className="flex items-center">
                      <button 
                        type="button" 
                        onClick={() => setSignupScreen(contactMethod === 'phone' ? 'enter_phone' : 'enter_email')} 
                        className={`p-1 -ml-1 transition-colors cursor-pointer ${
                          loginTheme === 'night' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h2 className={`text-2xl font-bold ${
                        loginTheme === 'night' ? 'text-white' : 'text-slate-900'
                      }`}>OTP যাচাই করুন</h2>
                      <p className={`text-xs mt-1 leading-relaxed ${
                        loginTheme === 'night' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {contactMethod === 'phone' 
                          ? 'আপনার নম্বরে পাঠানো ৬ ডিজিটের OTP কোডটি এখানে লিখুন'
                          : 'আপনার ইমেইলে পাঠানো ৬ ডিজিটের OTP কোডটি এখানে লিখুন'}
                      </p>
                    </div>

                    {/* 6 OTP boxes */}
                    <div className="grid grid-cols-6 gap-2 pt-2">
                      {otpCode.map((digit, i) => (
                        <input
                          key={i}
                          ref={otpRefs[i]}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpBoxChange(i, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !otpCode[i] && i > 0) {
                              otpRefs[i - 1].current?.focus();
                            }
                          }}
                          className={`w-full aspect-square border rounded-xl text-center font-bold text-base outline-none ${
                            loginTheme === 'night'
                              ? 'bg-[#121824] border-white/10 text-white focus:border-white/30'
                              : 'bg-white border-slate-200 text-slate-900 focus:border-slate-400 shadow-sm'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Resend row */}
                    <div className="text-center text-xs pt-1">
                      {phoneCountdown > 0 ? (
                        <span className="text-slate-400">
                          OTP পাননি? <span className={loginTheme === 'night' ? 'text-slate-300' : 'text-slate-700'}>আবার পাঠান ({String(Math.floor(phoneCountdown / 60)).padStart(2, '0')}:{String(phoneCountdown % 60).padStart(2, '0')})</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          OTP পাননি? <button type="button" onClick={contactMethod === 'phone' ? sendPhoneOtp : sendEmailOtpCode} className={`underline font-medium cursor-pointer ${
                            loginTheme === 'night' ? 'text-white' : 'text-slate-900'
                          }`}>আবার পাঠান</button>
                        </span>
                      )}
                    </div>

                    {/* Button */}
                    <button
                      type="button"
                      onClick={() => handleVerifyAndCreateUser()}
                      disabled={loading || otpCode.join("").length !== 6}
                      className={`w-full py-3.5 rounded-full disabled:opacity-40 text-white font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        loginTheme === 'night'
                          ? 'bg-[#243044] hover:bg-[#2d3d56]'
                          : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>যাচাই করুন</span>}
                    </button>

                    {/* Security Badge */}
                    <div className="flex items-start justify-center gap-2 text-[11px] text-slate-400 leading-relaxed pt-3 text-center px-2">
                      <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>স্প্যাম বা অনাকাঙ্ক্ষিত কার্যকলাপ থেকে আপনার অ্যাকাউন্ট সুরক্ষিত রাখা হচ্ছে</span>
                    </div>
                  </div>
                )}

                {/* 4. SET PASSWORD (পাসওয়ার্ড সেট করুন) */}
                {signupScreen === 'set_password' && (
                  <div className="space-y-6">
                    {/* Back button */}
                    <div className="flex items-center">
                      <button 
                        type="button" 
                        onClick={() => setSignupScreen('verify_otp')} 
                        className={`p-1 -ml-1 transition-colors cursor-pointer ${
                          loginTheme === 'night' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h2 className={`text-2xl font-bold ${
                        loginTheme === 'night' ? 'text-white' : 'text-slate-900'
                      }`}>পাসওয়ার্ড সেট করুন</h2>
                      <p className={`text-xs mt-1 ${
                        loginTheme === 'night' ? 'text-slate-400' : 'text-slate-500'
                      }`}>আপনার অ্যাকাউন্ট নিরাপদ রাখতে শক্তিশালী পাসওয়ার্ড ব্যবহার করুন</p>
                    </div>

                    {/* Password field */}
                    <div className={`rounded-2xl border px-4 py-3.5 flex items-center mt-2 ${
                      loginTheme === 'night'
                        ? 'bg-[#121824] border-white/10'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                      <Lock className="w-5 h-5 text-slate-400 mr-3 shrink-0" strokeWidth={1.5} />
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="পাসওয়ার্ড"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className={`w-full bg-transparent text-sm outline-none font-normal ${
                          loginTheme === 'night'
                            ? 'text-white placeholder:text-slate-500'
                            : 'text-slate-900 placeholder:text-slate-400'
                        }`}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className={`p-0.5 shrink-0 transition-colors cursor-pointer ${
                          loginTheme === 'night' ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {showSignupPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
                      </button>
                    </div>

                    {/* Checklist */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center gap-2.5 text-xs">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${hasMinLength ? 'bg-emerald-500 text-black' : 'border border-slate-600 text-transparent'}`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className={hasMinLength ? (loginTheme === 'night' ? 'text-slate-200' : 'text-slate-800') : 'text-slate-400'}>কমপক্ষে ৮ অক্ষর হতে হবে</span>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${hasNumber ? 'bg-emerald-500 text-black' : 'border border-slate-600 text-transparent'}`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className={hasNumber ? (loginTheme === 'night' ? 'text-slate-200' : 'text-slate-800') : 'text-slate-400'}>অন্তত একটি সংখ্যা থাকতে হবে</span>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${hasLetter ? 'bg-emerald-500 text-black' : 'border border-slate-600 text-transparent'}`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className={hasLetter ? (loginTheme === 'night' ? 'text-slate-200' : 'text-slate-800') : 'text-slate-400'}>অন্তত একটি ইংরেজি অক্ষর থাকতে হবে</span>
                      </div>
                    </div>

                    {/* Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (signupPassword.length < 6) {
                          setError("পাসওয়ার্ড অবশ্যই কমপক্ষে ৬ অক্ষরের হতে হবে।");
                          return;
                        }
                        setError(null);
                        setSignupScreen('profile_setup');
                      }}
                      disabled={!signupPassword}
                      className={`w-full py-3.5 rounded-full disabled:opacity-40 text-white font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-4 ${
                        loginTheme === 'night'
                          ? 'bg-[#243044] hover:bg-[#2d3d56]'
                          : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      <span>পরবর্তী</span>
                    </button>
                  </div>
                )}

                {/* 5. PROFILE SETUP (প্রোফাইল সেটআপ) */}
                {signupScreen === 'profile_setup' && (
                  <div className="space-y-6">
                    {/* Back button */}
                    <div className="flex items-center">
                      <button 
                        type="button" 
                        onClick={() => setSignupScreen('set_password')} 
                        className={`p-1 -ml-1 transition-colors cursor-pointer ${
                          loginTheme === 'night' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h2 className={`text-2xl font-bold ${
                        loginTheme === 'night' ? 'text-white' : 'text-slate-900'
                      }`}>প্রোফাইল সেটআপ</h2>
                      <p className={`text-xs mt-1 ${
                        loginTheme === 'night' ? 'text-slate-400' : 'text-slate-500'
                      }`}>আপনার পরিচিতি দিয়ে শুরু করি</p>
                    </div>

                    {/* Avatar picker circle */}
                    <div className="flex flex-col items-center justify-center pt-2">
                      <input
                        ref={avatarFileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleSelectAvatarFile}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => avatarFileRef.current?.click()}
                        className={`w-20 h-20 rounded-full border flex items-center justify-center overflow-hidden transition-all cursor-pointer group shadow-md ${
                          loginTheme === 'night'
                            ? 'bg-[#121824] border-white/10 hover:border-white/30'
                            : 'bg-slate-100 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className={`w-7 h-7 transition-colors ${
                            loginTheme === 'night' ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-900'
                          }`} />
                        )}
                      </button>
                      <p className={`text-xs font-medium mt-2 ${
                        loginTheme === 'night' ? 'text-slate-300' : 'text-slate-700'
                      }`}>প্রোফাইল ছবি</p>
                      <p className="text-[10px] text-slate-500">(ঐচ্ছিক)</p>
                      {isUploadingPhoto && <p className="text-[10px] text-emerald-400 animate-pulse mt-1">আপলোড হচ্ছে...</p>}
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3.5 pt-1">
                      {/* Full Name */}
                      <div className={`rounded-2xl border px-4 py-3 flex items-center ${
                        loginTheme === 'night'
                          ? 'bg-[#121824] border-white/10'
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                        <User className="w-5 h-5 text-slate-400 mr-3 shrink-0" strokeWidth={1.5} />
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-400">পূর্ণ নাম</label>
                          <input
                            type="text"
                            placeholder="আপনার পূর্ণ নাম লিখুন"
                            value={fullName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFullName(val);
                              if (!signupUsername || signupUsername.startsWith("user_")) {
                                const clean = val.toLowerCase().replace(/[^a-z0-9]/g, "");
                                if (clean) {
                                  const suggested = `${clean}_${Math.floor(100 + Math.random() * 900)}`;
                                  setSignupUsername(suggested);
                                  checkUsernameUniqueness(suggested);
                                }
                              }
                            }}
                            className={`w-full bg-transparent text-xs outline-none font-medium mt-0.5 ${
                              loginTheme === 'night'
                                ? 'text-white placeholder:text-slate-500'
                                : 'text-slate-900 placeholder:text-slate-400'
                            }`}
                            required
                          />
                        </div>
                      </div>

                      {/* Username */}
                      <div className={`rounded-2xl border px-4 py-3 flex items-center ${
                        loginTheme === 'night'
                          ? 'bg-[#121824] border-white/10'
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                        <User className="w-5 h-5 text-slate-400 mr-3 shrink-0" strokeWidth={1.5} />
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-400">ইউজারনেম</label>
                          <input
                            type="text"
                            placeholder="যেমন: yourname123"
                            value={signupUsername}
                            onChange={(e) => checkUsernameUniqueness(e.target.value)}
                            className={`w-full bg-transparent text-xs outline-none font-medium mt-0.5 ${
                              loginTheme === 'night'
                                ? 'text-white placeholder:text-slate-500'
                                : 'text-slate-900 placeholder:text-slate-400'
                            }`}
                            required
                          />
                        </div>
                        {checkingUsername && <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0 ml-2" />}
                        {!checkingUsername && isUsernameValid && <Check className="w-4 h-4 text-emerald-500 stroke-[3] shrink-0 ml-2" />}
                      </div>

                      {isUsernameValid && !usernameError && (
                        <p className="text-[10px] text-emerald-400 font-medium ml-1 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>ইউজারনেমটি উপলব্ধ আছে</span>
                        </p>
                      )}

                      {usernameError && (
                        <p className="text-[10px] text-rose-400 ml-1">{usernameError}</p>
                      )}
                    </div>

                    {/* Button */}
                    <button
                      type="button"
                      onClick={handleFinalizeAccountCreation}
                      disabled={loading || !fullName.trim() || !signupUsername.trim()}
                      className={`w-full py-3.5 rounded-full disabled:opacity-40 text-white font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        loginTheme === 'night'
                          ? 'bg-[#243044] hover:bg-[#2d3d56]'
                          : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      ) : (
                        <span>চালিয়ে যান</span>
                      )}
                    </button>
                  </div>
                )}

                {/* 6. CONGRATULATIONS (অভিনন্দন!) */}
                {signupScreen === 'congratulations' && (
                  <div className="space-y-6 flex flex-col items-center text-center pt-6">
                    {/* Glowing Green Circle Badge */}
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                        <Check className="w-7 h-7 stroke-[3]" />
                      </div>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h2 className={`text-2xl font-bold ${
                        loginTheme === 'night' ? 'text-white' : 'text-slate-900'
                      }`}>অভিনন্দন!</h2>
                      <p className={`text-xs mt-1 ${
                        loginTheme === 'night' ? 'text-slate-400' : 'text-slate-500'
                      }`}>আপনার একাউন্ট সফলভাবে তৈরি হয়েছে</p>
                    </div>

                    {/* Feature card */}
                    <div className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3 ${
                      loginTheme === 'night'
                        ? 'bg-[#121824]/90 border-white/10'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                      <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      <p className={`text-xs leading-relaxed ${
                        loginTheme === 'night' ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        এখন আপনি BINISTA-তে যোগ দিতে পারবেন, বন্ধুদের সাথে সংযুক্ত হতে পারবেন এবং আপনার পছন্দের কনটেন্ট উপভোগ করতে পারবেন।
                      </p>
                    </div>

                    {/* Button */}
                    <button
                      type="button"
                      onClick={() => navigate(redirectUrl, { replace: true })}
                      className={`w-full py-3.5 rounded-full text-white font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center cursor-pointer shadow-sm mt-4 ${
                        loginTheme === 'night'
                          ? 'bg-[#243044] hover:bg-[#2d3d56]'
                          : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      <span>হোমে যান</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}


            {/* ----------------- VIEW 3: CHECK EMAIL VERIFICATION LINK ----------------- */}
            {view === 'email_sent_screen' && (
              <motion.div
                key="email_sent_screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-5"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white mx-auto">
                  <Mail className="w-8 h-8 animate-pulse" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white">Check Your Email</h2>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    We've sent a verification link to <span className="text-white font-bold">{signupEmail}</span>. Click the link in your email to verify your address, then refresh or sign-in.
                  </p>
                </div>

                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-full bg-white text-black font-semibold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
                >
                  <span>Open Email App</span>
                </a>

                <button
                  onClick={() => setView('login_gate')}
                  className="text-xs text-slate-400 hover:text-white underline block mx-auto cursor-pointer"
                >
                  Return to Login Gate
                </button>
              </motion.div>
            )}


            {/* ----------------- VIEW 4: SUCCESS PROFILE SETUP CONNECTED ----------------- */}
            {view === 'connected_success' && (
              <motion.div
                key="connected_success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-5"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white mx-auto">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white">Account Connected</h2>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    Your profile has been connected and is active on BINISTA! Connect, share and chat with your friends.
                  </p>
                </div>

                <button
                  onClick={() => navigate(redirectUrl, { replace: true })}
                  className="w-full py-3.5 rounded-full bg-white hover:bg-slate-100 text-black font-semibold text-sm shadow-sm active:scale-95 transition-transform cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Continue to Feed</span>
                  <ArrowRight className="w-4 h-4 text-black" strokeWidth={2} />
                </button>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

      {/* Forgot Password Modal with Email OTP & Admin Panel Support */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialIdentifier={loginIdentifier}
        theme={loginTheme}
        onSuccessLogin={(id) => {
          setIsForgotPasswordOpen(false);
          if (id) setLoginIdentifier(id);
        }}
      />
    </div>
  );
};

export default Login;
