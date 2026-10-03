import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Bell, ArrowLeft, Heart, MessageSquare, UserPlus, 
  Send, Share2, Settings, Lock, Check, ChevronRight, 
  MoreVertical, Search, Shield, ToggleLeft, ToggleRight, Sparkles, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SEO } from "../components/SEO";
import { 
  BinistaNotification, 
  BinistaNotificationSettings, 
  INITIAL_BINISTA_NOTIFICATIONS, 
  loadNotificationSettings, 
  saveNotificationSettings 
} from "../lib/notificationService";
import { loadLocalStore, saveLocalItem } from "../lib/socialPersistence";

export const Notifications: React.FC<{ defaultScreen?: "main" | "settings" | "lockscreen" }> = ({ 
  defaultScreen = "main" 
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const screenParam = searchParams.get("view");

  // Current Active Screen View
  const [currentScreen, setCurrentScreen] = useState<"main" | "detail" | "settings" | "lockscreen">(
    (screenParam as any) || defaultScreen
  );

  // Filter Tabs: 'all' | 'like' | 'comment' | 'follow' | 'message'
  const [mainFilter, setMainFilter] = useState<"all" | "like" | "comment" | "follow" | "message">("all");

  // Sub Filters for Likes, Comments, Follows, Messages
  const [subFilter, setSubFilter] = useState<string>("all");

  // Notifications State
  const [notifications, setNotifications] = useState<BinistaNotification[]>(INITIAL_BINISTA_NOTIFICATIONS);
  const [selectedNotif, setSelectedNotif] = useState<BinistaNotification | null>(INITIAL_BINISTA_NOTIFICATIONS[0]);

  // Settings State
  const [settings, setSettings] = useState<BinistaNotificationSettings>(loadNotificationSettings());

  // Load Saved Notifications on Mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const stored = await loadLocalStore<BinistaNotification>("notifications");
        if (stored && stored.length > 0) {
          setNotifications(stored);
        } else {
          // Initialize default notifications in local storage
          for (const item of INITIAL_BINISTA_NOTIFICATIONS) {
            await saveLocalItem("notifications", item);
          }
          setNotifications(INITIAL_BINISTA_NOTIFICATIONS);
        }
      } catch (e) {
        setNotifications(INITIAL_BINISTA_NOTIFICATIONS);
      }
    };
    fetchNotifications();
  }, []);

  // Unread Count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Toggle Settings Switch
  const handleToggleSetting = (key: keyof BinistaNotificationSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  // Mark Single Notification as Read
  const handleSelectNotification = async (notif: BinistaNotification) => {
    setSelectedNotif(notif);
    const updatedList = notifications.map(n => n.id === notif.id ? { ...n, read: true } : n);
    setNotifications(updatedList);
    
    // Save locally
    const updatedItem = { ...notif, read: true };
    await saveLocalItem("notifications", updatedItem);

    // Switch to Detail Screen or navigate
    if (notif.type === "message") {
      navigate("/chat");
    } else {
      setCurrentScreen("detail");
    }
  };

  // Mark All as Read
  const handleMarkAllRead = async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    for (const item of updated) {
      await saveLocalItem("notifications", item);
    }
  };

  // Filtered Notifications Logic
  const filteredNotifications = notifications.filter(n => {
    if (mainFilter === "all") return true;
    if (mainFilter === "like") return n.type === "like";
    if (mainFilter === "comment") return n.type === "comment" || n.type === "reply";
    if (mainFilter === "follow") return n.type === "follow" || n.type === "follow_request";
    if (mainFilter === "message") return n.type === "message";
    return true;
  }).filter(n => {
    if (subFilter === "all") return true;
    if (subFilter === "post") return n.contentType === "post" || !n.contentType;
    if (subFilter === "reel") return n.contentType === "reel" || n.contentType === "video";
    if (subFilter === "story") return n.contentType === "story";
    if (subFilter === "chat") return n.contentType === "chat";
    return true;
  });

  // Get Activity Icon Overlay for Avatars
  const getActivityBadge = (type: string) => {
    switch (type) {
      case "like":
        return (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] shadow-md ring-2 ring-[#080d15]">
            ❤️
          </div>
        );
      case "comment":
      case "reply":
        return (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center text-[9px] shadow-md ring-2 ring-[#080d15]">
            💬
          </div>
        );
      case "follow":
      case "follow_request":
        return (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shadow-md ring-2 ring-[#080d15]">
            👤
          </div>
        );
      case "share":
        return (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center text-[9px] shadow-md ring-2 ring-[#080d15]">
            ↗️
          </div>
        );
      default:
        return (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-teal-500 text-white flex items-center justify-center text-[9px] shadow-md ring-2 ring-[#080d15]">
            🔔
          </div>
        );
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 60000); // minutes
    if (diff < 1) return "এখনই";
    if (diff < 60) return `${diff}m আগে`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h আগে`;
    return `${Math.floor(hours / 24)}d আগে`;
  };

  return (
    <div className="min-h-screen bg-[#080d15] text-slate-100 max-w-lg mx-auto md:max-w-xl font-sans select-none pb-24">
      <SEO title="BINISTA - নোটিফিকেশন সেন্টার" description="আপনার সকল আপডেট ও নোটিফিকেশন পরিচালনা করুন।" />

      {/* ========================================================= */}
      {/* SCREEN 1: NOTIFICATION CENTER (MAIN LIST VIEW)            */}
      {/* ========================================================= */}
      {currentScreen === "main" && (
        <div>
          {/* Header Bar */}
          <header className="sticky top-0 z-40 bg-[#080d15]/95 backdrop-blur-xl px-4 py-3.5 flex items-center justify-between border-b border-white/10 shadow-md">
            <h1 className="font-black text-xl tracking-widest text-white uppercase">
              BINISTA
            </h1>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentScreen("lockscreen")}
                className="text-slate-300 hover:text-white p-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1 text-[11px] font-bold"
                title="লক স্ক্রিন পুশ নোটিফিকেশন টেস্ট"
              >
                <Lock className="w-3.5 h-3.5 text-teal-400" />
                <span>পুশ ডেমো</span>
              </button>

              <button 
                onClick={() => setCurrentScreen("settings")}
                className="text-slate-300 hover:text-white p-2 rounded-xl bg-white/5 border border-white/10"
                aria-label="Settings"
                title="নোটিফিকেশন সেটিংস"
              >
                <Settings className="w-5 h-5 stroke-[1.8]" />
              </button>

              <div className="relative">
                <button className="text-white p-1.5 relative">
                  <Bell className="w-5 h-5 stroke-[2]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-teal-400 text-black text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-[#080d15] animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Title & Mark Read Header */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-wide">নোটিফিকেশন</h2>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-teal-400 hover:underline cursor-pointer"
              >
                সব পঠিত চিহ্নিত করুন
              </button>
            )}
          </div>

          {/* Main Filter Pills: সব | লাইক | কমেন্ট | ফলো | মেসেজ */}
          <div className="px-3 py-2 bg-[#0b1018] border-y border-white/5 overflow-x-auto no-scrollbar flex items-center gap-2">
            {[
              { id: "all", label: "সব" },
              { id: "like", label: "লাইক" },
              { id: "comment", label: "কমেন্ট" },
              { id: "follow", label: "ফলো" },
              { id: "message", label: "মেসেজ" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setMainFilter(tab.id as any);
                  setSubFilter("all");
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  mainFilter === tab.id
                    ? "bg-teal-500 text-black shadow-[0_0_10px_rgba(45,212,191,0.5)] scale-105"
                    : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sub Filters based on selected main filter */}
          {mainFilter !== "all" && (
            <div className="px-4 py-2 bg-[#080d15] border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">ফিল্টার:</span>
              
              {mainFilter === "like" && ["all", "post", "reel", "story"].map(sf => (
                <button
                  key={sf}
                  onClick={() => setSubFilter(sf)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium ${subFilter === sf ? "bg-white/20 text-teal-300 font-bold" : "text-slate-400"}`}
                >
                  {sf === "all" ? "সব" : sf === "post" ? "পোস্ট" : sf === "reel" ? "রিলস" : "স্টোরি"}
                </button>
              ))}

              {mainFilter === "comment" && ["all", "post", "reel", "story"].map(sf => (
                <button
                  key={sf}
                  onClick={() => setSubFilter(sf)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium ${subFilter === sf ? "bg-white/20 text-teal-300 font-bold" : "text-slate-400"}`}
                >
                  {sf === "all" ? "সব" : sf === "post" ? "পোস্ট" : sf === "reel" ? "রিলস" : "স্টোরি"}
                </button>
              ))}

              {mainFilter === "follow" && ["all", "new", "requests"].map(sf => (
                <button
                  key={sf}
                  onClick={() => setSubFilter(sf)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium ${subFilter === sf ? "bg-white/20 text-teal-300 font-bold" : "text-slate-400"}`}
                >
                  {sf === "all" ? "সব" : sf === "new" ? "নতুন ফলোয়ার" : "রিকোয়েস্ট"}
                </button>
              ))}

              {mainFilter === "message" && ["all", "chat", "group"].map(sf => (
                <button
                  key={sf}
                  onClick={() => setSubFilter(sf)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium ${subFilter === sf ? "bg-white/20 text-teal-300 font-bold" : "text-slate-400"}`}
                >
                  {sf === "all" ? "সব" : sf === "chat" ? "চ্যাট" : "গ্রুপ"}
                </button>
              ))}
            </div>
          )}

          {/* Notifications List matching Reference Photo 1 */}
          <div className="divide-y divide-white/5">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                <Bell className="w-12 h-12 stroke-[1.2] mb-3 text-slate-600" />
                <p className="text-sm font-bold text-slate-300">কোনো নোটিফিকেশন পাওয়া যায়নি</p>
                <p className="text-xs text-slate-500 mt-1">নতুন কোনো অ্যাক্টিভিটি হলে এখানে আপডেট পাবেন।</p>
              </div>
            ) : (
              filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleSelectNotification(notif)}
                  className={`px-4 py-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer active:bg-white/5 ${
                    !notif.read ? "bg-teal-500/5 border-l-2 border-teal-400" : "hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Left: Avatar with Activity Badge */}
                  <div className="relative shrink-0">
                    <img 
                      src={notif.actorPhotoURL || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"} 
                      alt={notif.actorUsername} 
                      className="w-11 h-11 rounded-full object-cover border border-white/10"
                    />
                    {getActivityBadge(notif.type)}
                  </div>

                  {/* Center: Action Text */}
                  <div className="flex-1 min-w-0 leading-snug">
                    <p className="text-xs text-slate-200">
                      <span className="font-bold text-white mr-1">{notif.actorUsername}</span>
                      <span>{notif.message}</span>
                    </p>

                    {notif.commentText && (
                      <p className="text-xs italic text-teal-300 font-medium truncate mt-0.5">
                        "{notif.commentText}"
                      </p>
                    )}
                  </div>

                  {/* Right: Timestamp & Optional Thumbnail or Follow Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatTimeAgo(notif.createdAt)}
                    </span>

                    {notif.mediaThumbnail ? (
                      <img 
                        src={notif.mediaThumbnail} 
                        alt="Thumbnail" 
                        className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-xs"
                      />
                    ) : notif.type === "follow" ? (
                      <button className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold">
                        ফলো
                      </button>
                    ) : notif.type === "message" && !notif.read ? (
                      <span className="w-2.5 h-2.5 bg-teal-400 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.8)]"></span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SCREEN 2: NOTIFICATION DETAIL VIEW (নোটিফিকেশন ডিটেইল)    */}
      {/* ========================================================= */}
      {currentScreen === "detail" && selectedNotif && (
        <div className="min-h-screen bg-[#080d15] flex flex-col justify-between p-4">
          <div>
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <button 
                onClick={() => setCurrentScreen("main")}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <img src={selectedNotif.actorPhotoURL} alt={selectedNotif.actorUsername} className="w-7 h-7 rounded-full object-cover" />
                <span className="font-bold text-xs text-white">{selectedNotif.actorUsername}</span>
                <span className="text-[10px] text-slate-400">{formatTimeAgo(selectedNotif.createdAt)}</span>
              </div>

              <MoreVertical className="w-5 h-5 text-slate-400" />
            </div>

            {/* Action Header */}
            <div className="py-6 text-center space-y-1">
              <h3 className="font-bold text-base text-white">{selectedNotif.message}</h3>
              {selectedNotif.commentText && (
                <p className="text-sm font-semibold text-teal-300 italic">"{selectedNotif.commentText}"</p>
              )}
            </div>

            {/* Post Card Preview Card matching Reference Screen 2 */}
            <div className="bg-[#0b1017] border border-teal-500/30 rounded-3xl p-3.5 space-y-3 shadow-2xl max-w-sm mx-auto">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-teal-400/40">
                <img 
                  src={selectedNotif.mediaThumbnail || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&auto=format&fit=crop&q=80"} 
                  alt="Post Preview" 
                  className="w-full h-full object-cover" 
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <img src={selectedNotif.actorPhotoURL} alt="Author" className="w-6 h-6 rounded-full object-cover" />
                <span className="text-xs text-slate-300 font-medium">আপনার পোস্ট: সুন্দর একটি সন্ধ্যা 💚</span>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-slate-300 pt-1">
                <span className="flex items-center gap-1">❤️ 248</span>
                <span className="flex items-center gap-1">💬 12</span>
                <span>↗️ শেয়ার</span>
              </div>
            </div>
          </div>

          {/* Bottom Action Button */}
          <div className="pt-6 pb-4 max-w-sm mx-auto w-full">
            <button 
              onClick={() => navigate("/")}
              className="w-full py-3.5 rounded-2xl bg-teal-500 text-black font-bold text-sm shadow-[0_0_15px_rgba(45,212,191,0.4)] active:scale-95 transition-all cursor-pointer"
            >
              পোস্ট দেখুন
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SCREEN 3: NOTIFICATION SETTINGS (নোটিফিকেশন সেটিংস)      */}
      {/* ========================================================= */}
      {currentScreen === "settings" && (
        <div className="min-h-screen bg-[#080d15] p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <button 
              onClick={() => setCurrentScreen("main")}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-base text-white tracking-wide">নোটিফিকেশন সেটিংস</h2>
          </div>

          {/* Section 1: Event Toggles */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider">
              কোন ধরনের নোটিফিকেশন পাবেন
            </h3>

            <div className="bg-[#0c1017] border border-white/10 rounded-2xl divide-y divide-white/5">
              {[
                { key: "likes", label: "লাইক", desc: "আপনার পোস্ট লাইক হলে", icon: "❤️" },
                { key: "comments", label: "কমেন্ট", desc: "আপনার পোস্ট কমেন্ট হলে", icon: "💬" },
                { key: "follows", label: "ফলো", desc: "কেউ আপনাকে ফলো করলে", icon: "👤" },
                { key: "messages", label: "মেসেজ", desc: "নতুন মেসেজ এলে", icon: "📩" },
                { key: "replies", label: "রিপ্লাই", desc: "আপনার স্টোরি বা রিলসে রিপ্লাই এলে", icon: "↩️" },
                { key: "shares", label: "শেয়ার", desc: "আপনার পোস্ট কেউ শেয়ার করলে", icon: "↗️" },
                { key: "stories", label: "স্টোরি", desc: "কেউ আপনার স্টোরি দেখলে", icon: "📸" }
              ].map(item => {
                const isEnabled = settings[item.key as keyof BinistaNotificationSettings];
                return (
                  <div key={item.key} className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <div>
                        <h4 className="font-bold text-xs text-white">{item.label}</h4>
                        <p className="text-[11px] text-slate-400">{item.desc}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleToggleSetting(item.key as keyof BinistaNotificationSettings)}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                        isEnabled ? "bg-teal-500" : "bg-white/20"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        isEnabled ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Push Notification */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider">
              পুশ নোটিফিকেশন
            </h3>

            <div className="bg-[#0c1017] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-white">অ্যাপ বন্ধ থাকলেও নোটিফিকেশন পাবেন</h4>
                <p className="text-[11px] text-slate-400">ফোনের নোটিফিকেশন বারে দেখাবে</p>
              </div>

              <button 
                onClick={() => handleToggleSetting("push")}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  settings.push ? "bg-teal-500" : "bg-white/20"
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.push ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SCREEN 4: PUSH NOTIFICATION LOCK SCREEN SIMULATOR         */}
      {/* ========================================================= */}
      {currentScreen === "lockscreen" && (
        <div className="min-h-screen bg-black/90 backdrop-blur-2xl p-4 flex flex-col justify-between relative overflow-hidden select-none">
          {/* Top Bar Back Button */}
          <div className="relative z-20 flex items-center justify-between pt-2">
            <button 
              onClick={() => setCurrentScreen("main")}
              className="px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold flex items-center gap-1 backdrop-blur-md border border-white/20"
            >
              ← অ্যাপে ফিরে যান
            </button>
            <span className="text-[11px] font-mono text-slate-400">লক স্ক্রিন পুশ নোটিফিকেশন ডেমো</span>
          </div>

          {/* Lock Screen Clock matching Reference Screen 4 */}
          <div className="text-center pt-8 space-y-1 relative z-10">
            <div className="w-6 h-6 mx-auto text-white/80">🔒</div>
            <h1 className="text-6xl font-light text-white tracking-tighter">9:41</h1>
            <p className="text-xs font-medium text-slate-300">রবি, ৬ অক্টোবর</p>
          </div>

          {/* Push Notification Cards List */}
          <div className="space-y-3 my-auto max-w-sm mx-auto w-full relative z-10">
            {[
              { id: "p1", name: "rafiq_ahmed", msg: "আপনার পোস্টে লাইক দিয়েছেন", icon: "❤️", time: "2m আগে" },
              { id: "p2", name: "sadia_akter", msg: 'কমেন্ট করেছে: "দারুণ হয়েছে! 😊"', icon: "💬", time: "5m আগে" },
              { id: "p3", name: "tanzim_rahman", msg: "আপনাকে ফলো করেছে", icon: "👤", time: "12m আগে" },
              { id: "p4", name: "islamic_life", msg: "নতুন মেসেজ এসেছে", icon: "📩", time: "18m আগে" }
            ].map(push => (
              <div 
                key={push.id}
                onClick={() => setCurrentScreen("main")}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3.5 space-y-1 text-white shadow-2xl active:scale-95 transition-transform cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="w-4 h-4 rounded bg-teal-400 text-black flex items-center justify-center text-[9px] font-black">B</span>
                    <span>BINISTA</span>
                  </div>
                  <span className="text-slate-400">{push.time}</span>
                </div>

                <p className="text-xs font-medium pt-0.5">
                  <span className="font-bold mr-1">{push.name}</span>
                  <span>{push.msg}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Lockscreen Bottom Footer */}
          <div className="flex items-center justify-between px-8 pb-6 relative z-10 text-white/80">
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">🔦</div>
            <span className="text-[11px] text-slate-400 font-light">স্লাইড আপ করুন</span>
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">📷</div>
          </div>
        </div>
      )}
    </div>
  );
};
