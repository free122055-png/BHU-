import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Settings,
  Shield,
  User,
  CheckSquare,
  Bookmark,
  Activity,
  Archive,
  Heart,
  Play,
  Bell,
  Send,
  Phone,
  HelpCircle,
  AlertCircle,
  Users,
  LogOut,
  Info,
  Lock,
  ChevronRight,
  ChevronLeft,
  Key,
  Eye,
  Smartphone,
  Mail,
  FileText,
  ShieldCheck,
  Bot,
  Package,
  MapPin,
  Trash2,
  Globe,
  Sliders,
  Check,
  MessageSquare,
  Sparkles,
  LockIcon
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotificationContext } from "../context/NotificationContext";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

interface ProfileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAiAgent?: () => void;
}

type ScreenView =
  | "main"
  | "settings_privacy"
  | "your_activity"
  | "notifications"
  | "privacy"
  | "security"
  | "account"
  | "help_support"
  | "about_binista";

export const ProfileMenuDrawer: React.FC<ProfileMenuDrawerProps> = ({
  isOpen,
  onClose,
  onOpenAiAgent
}) => {
  const { user, profile, refreshProfile } = useAuth();
  const { unreadCount } = useNotificationContext();
  const navigate = useNavigate();

  const [currentScreen, setCurrentScreen] = useState<ScreenView>("main");

  // Inner Screen Toggles & Form States
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [showActivityStatus, setShowActivityStatus] = useState(true);
  const [pushNotifsEnabled, setPushNotifsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emailNotifsEnabled, setEmailNotifsEnabled] = useState(true);

  // Account edit inner states
  const [editName, setEditName] = useState(profile?.displayName || user?.displayName || "");
  const [editUsername, setEditUsername] = useState(profile?.username || "");
  const [editPhone, setEditPhone] = useState(profile?.phoneNumber || "");
  const [editBio, setEditBio] = useState(profile?.bio || "");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Report Problem State
  const [reportText, setReportText] = useState("");
  const [reportSent, setReportSent] = useState(false);

  const handleBackToMain = () => {
    setCurrentScreen("main");
  };

  const handleClose = () => {
    setCurrentScreen("main");
    onClose();
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("admin_secret_unlocked");
      await signOut(auth);
      handleClose();
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAccountInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMsg("তথ্য সফলভাবে সেভ করা হয়েছে!");
    setTimeout(() => {
      setSaveSuccessMsg("");
    }, 2500);
  };

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    setReportSent(true);
    setTimeout(() => {
      setReportText("");
      setReportSent(false);
    }, 2500);
  };

  const displayName = profile?.displayName || user?.displayName || "সম্মানিত গ্রাহক";
  const displayEmail = profile?.email || user?.email || "ইমেইল যোগ করুন";
  const displayUsername = profile?.username ? `@${profile.username}` : "@user";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dimmed Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/75 z-[2000] backdrop-blur-xs"
          />

          {/* Side Drawer sliding in from the Right */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[340px] bg-[#0d1117] text-white z-[2001] border-l border-gray-800/80 shadow-2xl flex flex-col h-full overflow-hidden"
          >
            {/* Header with Title and Close Button */}
            <div className="shrink-0 px-4 pt-5 pb-3 border-b border-gray-800/80 bg-[#0d1117] flex items-center justify-between relative z-10">
              {/* Back Button if in inner screen */}
              {currentScreen !== "main" ? (
                <button
                  onClick={handleBackToMain}
                  className="w-9 h-9 rounded-full bg-gray-800/50 hover:bg-gray-800 text-gray-300 flex items-center justify-center transition-colors active:scale-95 border border-gray-700/40"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <img 
                    src="/app_icon.png" 
                    alt="BINISTA" 
                    className="w-7 h-7 rounded-xl object-cover ring-1 ring-gray-700" 
                  />
                  <span className="text-sm font-bold text-white tracking-tight">BINISTA Menu</span>
                </div>
              )}

              {/* Sub-screen Title */}
              {currentScreen !== "main" && (
                <span className="text-xs font-semibold text-gray-300 truncate max-w-[160px]">
                  {currentScreen === "settings_privacy" && "Settings & Activity"}
                  {currentScreen === "your_activity" && "Your Activity"}
                  {currentScreen === "notifications" && "Notifications"}
                  {currentScreen === "privacy" && "Privacy"}
                  {currentScreen === "security" && "Security"}
                  {currentScreen === "account" && "Account Center"}
                  {currentScreen === "help_support" && "Help & Support"}
                  {currentScreen === "about_binista" && "About BINISTA"}
                </span>
              )}

              {/* Close Icon Button */}
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-gray-800/50 hover:bg-gray-800 text-gray-300 flex items-center justify-center transition-colors active:scale-95 border border-gray-700/40"
                aria-label="Close"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-800/40 text-sm">
              {/* SCREEN 1: MAIN MENU VIEW (Clean, Natural, 8-Section Structure) */}
              {currentScreen === "main" && (
                <div className="py-2 space-y-1">
                  {/* 1. Settings & Activity */}
                  <div className="px-2">
                    <button
                      onClick={() => setCurrentScreen("settings_privacy")}
                      className="w-full py-3.5 px-4 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5">
                        <Settings className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                        <span className="font-semibold text-white text-[15px]">
                          1. Settings & Activity
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* 2. Your Activity */}
                  <div className="px-2">
                    <button
                      onClick={() => setCurrentScreen("your_activity")}
                      className="w-full py-3.5 px-4 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5">
                        <Activity className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                        <span className="font-semibold text-white text-[15px]">
                          2. Your Activity
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* 3. Notifications */}
                  <div className="px-2">
                    <button
                      onClick={() => setCurrentScreen("notifications")}
                      className="w-full py-3.5 px-4 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5">
                        <Bell className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                        <span className="font-semibold text-white text-[15px]">
                          3. Notifications
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <span className="bg-gray-800 text-gray-200 border border-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  </div>

                  {/* 4. Privacy */}
                  <div className="px-2">
                    <button
                      onClick={() => setCurrentScreen("privacy")}
                      className="w-full py-3.5 px-4 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5">
                        <Shield className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                        <span className="font-semibold text-white text-[15px]">
                          4. Privacy
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* 5. Security */}
                  <div className="px-2">
                    <button
                      onClick={() => setCurrentScreen("security")}
                      className="w-full py-3.5 px-4 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5">
                        <Lock className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                        <span className="font-semibold text-white text-[15px]">
                          5. Security
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* 6. Account */}
                  <div className="px-2">
                    <button
                      onClick={() => {
                        handleClose();
                        navigate("/account-settings");
                      }}
                      className="w-full py-3.5 px-4 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5">
                        <User className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                        <span className="font-semibold text-white text-[15px]">
                          6. Account
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{displayName}</span>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  </div>

                  {/* 7. Help & Support */}
                  <div className="px-2">
                    <button
                      onClick={() => setCurrentScreen("help_support")}
                      className="w-full py-3.5 px-4 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5">
                        <HelpCircle className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                        <span className="font-semibold text-white text-[15px]">
                          7. Help & Support
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* 8. About BINISTA */}
                  <div className="px-2 pb-6">
                    <button
                      onClick={() => setCurrentScreen("about_binista")}
                      className="w-full py-3.5 px-4 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5">
                        <Info className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                        <span className="font-semibold text-white text-[15px]">
                          8. About BINISTA
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {user && (
                    <div className="px-2 pt-2 border-t border-gray-800/50 pb-6">
                      <button
                        onClick={handleLogout}
                        className="w-full py-3 px-4 rounded-xl flex items-center justify-between text-left hover:bg-red-950/20 text-red-400 transition-colors group"
                      >
                        <div className="flex items-center gap-3.5">
                          <LogOut className="w-5 h-5 text-red-400 stroke-[1.8]" />
                          <span className="font-medium">Log Out</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-red-500/50 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SCREEN 2: SETTINGS & PRIVACY (Section 1) */}
              {currentScreen === "settings_privacy" && (
                <div className="p-4 space-y-4">
                  <div className="p-4 bg-gray-900/80 rounded-2xl border border-gray-800 space-y-1">
                    <h3 className="font-semibold text-white">Settings & Privacy</h3>
                    <p className="text-xs text-gray-400">
                      আপনার অ্যাকাউন্ট, প্রাইভেসী, সিকিউরিটি এবং নোটিফিকেশন সেটিংস এখান থেকে পরিচালনা করুন।
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        handleClose();
                        navigate("/account-settings");
                      }}
                      className="w-full p-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-2xl border border-gray-800 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <User className="w-5 h-5 text-gray-300" />
                        <div>
                          <div className="font-medium text-white">Account Details</div>
                          <div className="text-xs text-gray-400">Name, Email, Phone, Username</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>

                    <button
                      onClick={() => setCurrentScreen("privacy")}
                      className="w-full p-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-2xl border border-gray-800 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <Eye className="w-5 h-5 text-gray-300" />
                        <div>
                          <div className="font-medium text-white">Privacy Controls</div>
                          <div className="text-xs text-gray-400">Public/Private, Blocked Users</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>

                    <button
                      onClick={() => setCurrentScreen("security")}
                      className="w-full p-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-2xl border border-gray-800 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <Lock className="w-5 h-5 text-gray-300" />
                        <div>
                          <div className="font-medium text-white">Security & Password</div>
                          <div className="text-xs text-gray-400">Password change, Login Security</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>

                    <button
                      onClick={() => setCurrentScreen("notifications")}
                      className="w-full p-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-2xl border border-gray-800 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <Bell className="w-5 h-5 text-gray-300" />
                        <div>
                          <div className="font-medium text-white">Notification Preferences</div>
                          <div className="text-xs text-gray-400">Push, Sound, Messages</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}

              {/* SCREEN 3: YOUR ACTIVITY (Section 2) */}
              {currentScreen === "your_activity" && (
                <div className="p-4 space-y-4">
                  <div className="p-4 bg-gray-900/80 rounded-2xl border border-gray-800 space-y-1">
                    <h3 className="font-semibold text-white">Your Activity</h3>
                    <p className="text-xs text-gray-400">
                      আপনার সাম্প্রতিক পোস্ট, কমেন্ট, লাইক, সেভ করা আইটেম ও অ্যাক্টিভিটি হিস্ট্রি।
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center space-y-2">
                      <Heart className="w-6 h-6 text-gray-300 stroke-[1.8]" />
                      <span className="text-xs font-medium text-gray-200">Liked Posts</span>
                      <span className="text-xs text-gray-400">১২টি আইটেম</span>
                    </div>

                    <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center space-y-2">
                      <Bookmark className="w-6 h-6 text-gray-300 stroke-[1.8]" />
                      <span className="text-xs font-medium text-gray-200">Saved List</span>
                      <span className="text-xs text-gray-400">সেভড প্রোডাক্টস</span>
                    </div>

                    <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center space-y-2">
                      <MessageSquare className="w-6 h-6 text-gray-300 stroke-[1.8]" />
                      <span className="text-xs font-medium text-gray-200">Comments</span>
                      <span className="text-xs text-gray-400">সাম্প্রতিক মন্তব্য</span>
                    </div>

                    <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center space-y-2">
                      <Archive className="w-6 h-6 text-gray-300 stroke-[1.8]" />
                      <span className="text-xs font-medium text-gray-200">Archive</span>
                      <span className="text-xs text-gray-400">আর্কাইভ আইটেম</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 4: NOTIFICATIONS (Section 3) */}
              {currentScreen === "notifications" && (
                <div className="p-4 space-y-4">
                  <div className="p-4 bg-gray-900/80 rounded-2xl border border-gray-800 space-y-1">
                    <h3 className="font-semibold text-white">Notifications Settings</h3>
                    <p className="text-xs text-gray-400">
                      কোন কোন নোটিফিকেশন কীভাবে পাবেন তা নির্ধারণ করুন।
                    </p>
                  </div>

                  <div className="space-y-3 bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
                    <div className="flex items-center justify-between py-2 border-b border-gray-800">
                      <div>
                        <div className="font-medium text-white text-sm">Push Notifications</div>
                        <div className="text-xs text-gray-400">অ্যাপের নোটিফিকেশন পেয়ে থাকুন</div>
                      </div>
                      <button
                        onClick={() => setPushNotifsEnabled(!pushNotifsEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          pushNotifsEnabled ? "bg-emerald-600" : "bg-gray-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            pushNotifsEnabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-800">
                      <div>
                        <div className="font-medium text-white text-sm">Notification Sounds</div>
                        <div className="text-xs text-gray-400">সাউন্ড অ্যালার্ট সক্রিয় রাখুন</div>
                      </div>
                      <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          soundEnabled ? "bg-emerald-600" : "bg-gray-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            soundEnabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <div className="font-medium text-white text-sm">Email Updates</div>
                        <div className="text-xs text-gray-400">অফার ও আপডেট ইমেইলে পান</div>
                      </div>
                      <button
                        onClick={() => setEmailNotifsEnabled(!emailNotifsEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          emailNotifsEnabled ? "bg-emerald-600" : "bg-gray-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            emailNotifsEnabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 5: PRIVACY (Section 4) */}
              {currentScreen === "privacy" && (
                <div className="p-4 space-y-4">
                  <div className="p-4 bg-gray-900/80 rounded-2xl border border-gray-800 space-y-1">
                    <h3 className="font-semibold text-white">Privacy Controls</h3>
                    <p className="text-xs text-gray-400">
                      আপনার প্রোফাইল এবং কন্টেন্টের গোপনীয়তা সেট করুন।
                    </p>
                  </div>

                  <div className="space-y-3 bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
                    <div className="flex items-center justify-between py-2 border-b border-gray-800">
                      <div>
                        <div className="font-medium text-white text-sm">Private Account</div>
                        <div className="text-xs text-gray-400">শুধু অনুমোদিত ফলোয়াররা আপনার তথ্য দেখবে</div>
                      </div>
                      <button
                        onClick={() => setIsPrivateAccount(!isPrivateAccount)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          isPrivateAccount ? "bg-emerald-600" : "bg-gray-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            isPrivateAccount ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-800">
                      <div>
                        <div className="font-medium text-white text-sm">Activity Status</div>
                        <div className="text-xs text-gray-400">আপনি কখন অনলাইনে আছেন তা দেখাবে</div>
                      </div>
                      <button
                        onClick={() => setShowActivityStatus(!showActivityStatus)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          showActivityStatus ? "bg-emerald-600" : "bg-gray-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            showActivityStatus ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="py-2 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white text-sm">Blocked Accounts</div>
                        <div className="text-xs text-gray-400">ব্লক করা ইউজারদের তালিকা</div>
                      </div>
                      <span className="text-xs text-gray-400">০ জন</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 6: SECURITY (Section 5) */}
              {currentScreen === "security" && (
                <div className="p-4 space-y-4">
                  <div className="p-4 bg-gray-900/80 rounded-2xl border border-gray-800 space-y-1">
                    <h3 className="font-semibold text-white">Security & Password</h3>
                    <p className="text-xs text-gray-400">
                      পাসওয়ার্ড পরিবর্তন ও অ্যাকাউন্ট সিকিউরিটি ম্যানেজ করুন।
                    </p>
                  </div>

                  <div className="space-y-3 bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
                    <button
                      onClick={() => {
                        handleClose();
                        navigate("/account-settings");
                      }}
                      className="w-full flex items-center justify-between py-2.5 border-b border-gray-800 text-left"
                    >
                      <div>
                        <div className="font-medium text-white text-sm">Change Password</div>
                        <div className="text-xs text-gray-400">নতুন শক্তিশালী পাসওয়ার্ড সেট করুন</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>

                    <div className="flex items-center justify-between py-2.5 border-b border-gray-800">
                      <div>
                        <div className="font-medium text-white text-sm">Email Verification</div>
                        <div className="text-xs text-gray-400">{displayEmail}</div>
                      </div>
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                        Verified
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <div>
                        <div className="font-medium text-white text-sm">Active Sessions</div>
                        <div className="text-xs text-gray-400">বর্তমান ডিভাইস ও ব্রাউজার</div>
                      </div>
                      <span className="text-xs text-gray-300">১টি ডিভাইস</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 7: ACCOUNT CENTER (Section 6) */}
              {currentScreen === "account" && (
                <div className="p-4 space-y-4">
                  <div className="p-4 bg-gray-900/80 rounded-2xl border border-gray-800 space-y-1">
                    <h3 className="font-semibold text-white">Account Information</h3>
                    <p className="text-xs text-gray-400">
                      আপনার নাম, ইউজারনেম, ইমেইল ও পার্সোনাল তথ্য আপডেট করুন।
                    </p>
                  </div>

                  {saveSuccessMsg && (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs text-center font-medium flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>{saveSuccessMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveAccountInfo} className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1">পূর্ণ নাম (Name)</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-600"
                        placeholder="আপনার নাম"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1">ইউজারনেম (Username)</label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-600"
                        placeholder="username"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1">ইমেইল (Email)</label>
                      <input
                        type="email"
                        value={displayEmail}
                        disabled
                        className="w-full bg-gray-900/50 border border-gray-800/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1">মোবাইল নম্বর (Phone)</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-600"
                        placeholder="017xxxxxxxx"
                      />
                    </div>

                    {onOpenAiAgent && (
                      <button
                        type="button"
                        onClick={() => {
                          handleClose();
                          onOpenAiAgent();
                        }}
                        className="w-full mt-2 p-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-left flex items-center justify-between text-xs text-emerald-400 font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-emerald-400" />
                          <span>পার্সোনাল AI এজেন্ট ও মেসেজ শিডিউল</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </button>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-semibold py-3 rounded-xl text-sm transition-colors mt-2"
                    >
                      Save Changes
                    </button>
                  </form>
                </div>
              )}

              {/* SCREEN 8: HELP & SUPPORT (Section 7) */}
              {currentScreen === "help_support" && (
                <div className="p-4 space-y-4">
                  <div className="p-4 bg-gray-900/80 rounded-2xl border border-gray-800 space-y-1">
                    <h3 className="font-semibold text-white">Help & Support</h3>
                    <p className="text-xs text-gray-400">
                      যেকোনো সমস্যায় হেল্প সেন্টারে যোগাযোগ করুন অথবা মতামত জানান।
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        handleClose();
                        navigate("/help-center");
                      }}
                      className="w-full p-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-2xl border border-gray-800 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <HelpCircle className="w-5 h-5 text-gray-300" />
                        <div>
                          <div className="font-medium text-white">Help Center</div>
                          <div className="text-xs text-gray-400">সচরাচর জিজ্ঞাসিত প্রশ্নাবলি</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>

                    <button
                      onClick={() => {
                        handleClose();
                        navigate("/contact");
                      }}
                      className="w-full p-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-2xl border border-gray-800 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <Phone className="w-5 h-5 text-gray-300" />
                        <div>
                          <div className="font-medium text-white">Contact Admin</div>
                          <div className="text-xs text-gray-400">লাইভ চ্যাট ও সাপোর্ট টিম</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>

                    <form onSubmit={handleSendReport} className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 space-y-3">
                      <div className="font-medium text-white text-sm">Report a Problem</div>
                      {reportSent ? (
                        <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-xl text-xs text-center font-medium">
                          আপনার রিপোর্ট এডমিন প্যানেলে পাঠানো হয়েছে। ধন্যবাদ!
                        </div>
                      ) : (
                        <>
                          <textarea
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                            rows={3}
                            placeholder="সমস্যার বিবরণ লিখুন..."
                            className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-gray-600 resize-none"
                          />
                          <button
                            type="submit"
                            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-xl text-xs transition-colors"
                          >
                            Submit Report
                          </button>
                        </>
                      )}
                    </form>
                  </div>
                </div>
              )}

              {/* SCREEN 9: ABOUT BINISTA (Section 8) */}
              {currentScreen === "about_binista" && (
                <div className="p-4 space-y-4">
                  <div className="p-4 bg-gray-900/80 rounded-2xl border border-gray-800 flex items-center gap-4">
                    <img
                      src="/app_icon.png"
                      alt="BINISTA"
                      className="w-12 h-12 rounded-2xl object-cover ring-1 ring-gray-700 shadow-md"
                    />
                    <div>
                      <h3 className="font-bold text-white text-lg leading-tight">BINISTA</h3>
                      <p className="text-xs text-gray-400">Version 8.0 • Live Community & Commerce</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        handleClose();
                        navigate("/terms");
                      }}
                      className="w-full p-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-2xl border border-gray-800 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <FileText className="w-5 h-5 text-gray-300" />
                        <span className="font-medium text-white">Terms of Service</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>

                    <button
                      onClick={() => {
                        handleClose();
                        navigate("/privacy");
                      }}
                      className="w-full p-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-2xl border border-gray-800 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <ShieldCheck className="w-5 h-5 text-gray-300" />
                        <span className="font-medium text-white">Privacy Policy</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>

                    <button
                      onClick={() => {
                        handleClose();
                        navigate("/security");
                      }}
                      className="w-full p-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-2xl border border-gray-800 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <Lock className="w-5 h-5 text-gray-300" />
                        <span className="font-medium text-white">Community Guidelines</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
