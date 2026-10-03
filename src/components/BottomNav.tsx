import React from "react";
import { MessageSquare, Play, Heart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const isAdmin = location.pathname.startsWith("/admin") || location.pathname.startsWith("/super-admin");
  const isPixelEditor = location.pathname.startsWith("/pixel");

  if (isAdmin || isPixelEditor) return null;

  // Social Platform Tab Configuration for BINISTA
  const tabs = [
    {
      id: "chats",
      label: "মেসেজ",
      icon: MessageSquare,
      path: "/",
      isActive: location.pathname === "/" || location.pathname.startsWith("/chat/")
    },
    {
      id: "tilawat",
      label: "তিলাওয়াত",
      icon: Play,
      path: "/islamic-tilawat",
      isActive: location.pathname === "/islamic-tilawat" || location.pathname === "/tilawat"
    },
    {
      id: "matrimonial",
      label: "পাত্র-পাত্রী",
      icon: Heart,
      path: "/matrimonial",
      isActive: location.pathname === "/matrimonial" || location.pathname === "/biodata"
    },
    {
      id: "account",
      label: "প্রোফাইল",
      icon: User,
      path: "/account",
      isActive: location.pathname === "/account" || location.pathname.startsWith("/account-settings")
    }
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 w-full bg-[#0B0E14] border-t border-white/5 shadow-2xl transform-gpu will-change-transform pb-[env(safe-area-inset-bottom,0px)] select-none text-white"
      style={{ touchAction: "manipulation" }}
    >
      <div className="max-w-lg mx-auto px-4 py-1.5 flex justify-around items-center h-[66px]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={`flex flex-col items-center gap-1 relative min-w-[64px] active:scale-90 transition-all duration-100 cursor-pointer ${
                tab.isActive ? "text-[#10b981]" : "text-slate-400 hover:text-slate-200"
              }`}
              style={{ touchAction: "manipulation" }}
            >
              {tab.isActive && (
                <div className="absolute -top-1.5 w-7 h-1 bg-[#10b981] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              )}
              <Icon className={`w-5.5 h-5.5 ${tab.isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
export default BottomNav;
