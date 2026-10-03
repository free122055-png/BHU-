import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  X, 
  Home, 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Lock, 
  HelpCircle, 
  Info, 
  Activity, 
  Bookmark, 
  Video, 
  MessageSquare, 
  LogOut, 
  LogIn, 
  ChevronRight,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useNotificationContext } from "../context/NotificationContext";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const { unreadCount } = useNotificationContext();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("admin_secret_unlocked");
      await signOut(auth);
      onClose();
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  const displayName = profile?.displayName || user?.displayName || "সম্মানিত সদস্য";
  const displayUsername = profile?.username ? `@${profile.username}` : user?.email ? user.email.split("@")[0] : "@user";
  const displayPhoto = profile?.photoURL || user?.photoURL || "";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background Dimmed Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={onClose}
            style={{ touchAction: "manipulation" }}
            className="fixed inset-0 bg-black/75 z-[999] backdrop-blur-xs"
          />

          {/* Slide-out Side Menu Drawer - Modern BINISTA Style */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ touchAction: "manipulation" }}
            className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[340px] bg-[#0d1117] text-white z-[1000] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header / Brand Profile Section */}
            <div className="pt-6 pb-4 px-5 border-b border-gray-800/80 bg-[#0d1117] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gray-800/80 border border-gray-700/60 overflow-hidden flex items-center justify-center shrink-0">
                  {displayPhoto ? (
                    <img src={displayPhoto} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-gray-300 stroke-[1.8]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-base font-bold text-white leading-tight truncate">
                    {displayName}
                  </div>
                  <div className="text-xs text-gray-400 font-medium truncate mt-0.5">
                    {displayUsername}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-800/50 hover:bg-gray-800 text-gray-300 flex items-center justify-center transition-colors active:scale-95 border border-gray-700/40"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>

            {/* Scrollable Menu Items */}
            <div className="flex-1 overflow-y-auto py-2 divide-y divide-gray-800/50 text-sm">
              {/* Quick Navigation Group */}
              <div className="py-2 px-2 space-y-0.5">
                <button
                  onClick={() => handleNavigate("/")}
                  className="w-full py-3 px-3.5 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <Home className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                    <span className="font-semibold text-white">হোম (Feed)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => handleNavigate("/account")}
                  className="w-full py-3 px-3.5 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <User className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                    <span className="font-semibold text-white">আমার প্রোফাইল</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => handleNavigate("/chat")}
                  className="w-full py-3 px-3.5 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <MessageSquare className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                    <span className="font-semibold text-white">মেসেজ ও চ্যাট</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => handleNavigate("/islamic-tilawat")}
                  className="w-full py-3 px-3.5 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <Video className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                    <span className="font-semibold text-white">রিলস / ভিডিও</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* 8 Standard BINISTA Profile Sections */}
              <div className="py-2 px-2 space-y-0.5">
                <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  BINISTA SECTIONS
                </div>

                {/* 1. Settings & Activity */}
                <button
                  onClick={() => handleNavigate("/account-settings")}
                  className="w-full py-3 px-3.5 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <Settings className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                    <span className="font-medium text-gray-100">1. Settings & Activity</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 2. Your Activity */}
                <button
                  onClick={() => handleNavigate("/account")}
                  className="w-full py-3 px-3.5 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <Activity className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                    <span className="font-medium text-gray-100">2. Your Activity</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 3. Notifications */}
                <button
                  onClick={() => handleNavigate("/notifications")}
                  className="w-full py-3 px-3.5 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <Bell className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                    <span className="font-medium text-gray-100">3. Notifications</span>
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

                {/* 4. Privacy */}
                <button
                  onClick={() => handleNavigate("/privacy")}
                  className="w-full py-3 px-3.5 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <Shield className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                    <span className="font-medium text-gray-100">4. Privacy</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 5. Security */}
                <button
                  onClick={() => handleNavigate("/security")}
                  className="w-full py-3 px-3.5 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <Lock className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                    <span className="font-medium text-gray-100">5. Security</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 6. Account */}
                <button
                  onClick={() => handleNavigate("/account-settings")}
                  className="w-full py-3 px-3.5 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <User className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                    <span className="font-medium text-gray-100">6. Account</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 7. Help & Support */}
                <button
                  onClick={() => handleNavigate("/contact")}
                  className="w-full py-3 px-3.5 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <HelpCircle className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                    <span className="font-medium text-gray-100">7. Help & Support</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 8. About BINISTA */}
                <button
                  onClick={() => handleNavigate("/terms")}
                  className="w-full py-3 px-3.5 rounded-xl flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <Info className="w-5 h-5 text-gray-300 stroke-[1.8]" />
                    <span className="font-medium text-gray-100">8. About BINISTA</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Account Logout / Login */}
              <div className="py-3 px-2">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 px-3.5 rounded-xl flex items-center justify-between text-left hover:bg-red-950/30 text-red-400 transition-colors group"
                  >
                    <div className="flex items-center gap-3.5">
                      <LogOut className="w-5 h-5 text-red-400 stroke-[1.8]" />
                      <span className="font-semibold">লগআউট করুন</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-red-500/50 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavigate("/login")}
                    className="w-full py-3 px-3.5 rounded-xl flex items-center justify-between text-left hover:bg-emerald-950/30 text-emerald-400 transition-colors group"
                  >
                    <div className="flex items-center gap-3.5">
                      <LogIn className="w-5 h-5 text-emerald-400 stroke-[1.8]" />
                      <span className="font-semibold">লগইন / সাইন আপ</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-500/50 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-gray-800/60 bg-[#0d1117] text-center text-xs text-gray-500 font-medium">
              BINISTA • Live Community & Commerce
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MenuDrawer;
