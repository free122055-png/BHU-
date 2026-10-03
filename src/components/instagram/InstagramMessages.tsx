import React, { useState } from "react";
import { 
  Search, Bot, Edit3, Plus, Camera, Send, 
  ChevronDown, X, MessageCircle
} from "lucide-react";
import { InstagramNote } from "../../types/instagram";

export interface ChatThreadItem {
  id: string;
  targetUserId: string;
  displayName: string;
  username: string;
  photoURL?: string;
  lastMessage: string;
  lastMessageAt: any;
  unreadCount: number;
  isOnline?: boolean;
}

interface InstagramMessagesProps {
  threads: ChatThreadItem[];
  notes: InstagramNote[];
  currentUsername: string;
  currentUserPhoto?: string;
  onSelectThread: (thread: ChatThreadItem) => void;
  onOpenAiAgentModal: () => void;
  onOpenCreateNote: () => void;
  onStartNewChat: () => void;
}

export const InstagramMessages: React.FC<InstagramMessagesProps> = ({
  threads,
  notes,
  currentUsername,
  currentUserPhoto,
  onSelectThread,
  onOpenAiAgentModal,
  onOpenCreateNote,
  onStartNewChat
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'primary' | 'requests'>('all');
  const [searchQuery, setSearchQuery] = useState("");

  const filteredThreads = threads.filter(t => 
    t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0b1017] text-slate-100 pb-28 max-w-lg mx-auto md:max-w-xl font-sans">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0b1017]/95 backdrop-blur-xl px-4 py-3.5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <img 
            src="/app_icon.png" 
            alt="BINISTA" 
            className="w-8 h-8 rounded-xl object-cover ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20" 
          />
          <div className="flex items-center gap-1.5 cursor-pointer">
            <span className="font-bold text-base text-white">BINISTA</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenAiAgentModal}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="AI সহকারী সেটিংস"
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span className="text-xs">AI সহকারী</span>
          </button>

          <button 
            onClick={onStartNewChat}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors"
            title="নতুন চ্যাট"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Fast Search Bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="bg-[#131b26] rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 border border-white/5 focus-within:border-emerald-500/50 transition-colors">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম বা ইউজারনেম দিয়ে খুঁজুন..."
            className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Status Notes Tray - Designed matching user requested photo IMG_২০২৬১০০৩_১০২৫৫৫_223.png */}
      <div className="px-4 py-4 flex items-center gap-3.5 overflow-x-auto no-scrollbar border-b border-white/5 bg-[#090e16]/50">
        
        {/* Your Note Card */}
        <div 
          onClick={onOpenCreateNote}
          className="w-[96px] h-[138px] flex-shrink-0 flex flex-col items-center justify-between p-2.5 relative transition-all duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer group"
          style={{
            clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
            background: "linear-gradient(135deg, rgba(16, 24, 39, 0.7) 0%, rgba(31, 41, 55, 0.7) 100%)"
          }}
        >
          {/* Custom SVG border for Your Note Card */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            <path d="M 14,0 L 100,0 L 100,86 L 86,100 L 0,100 L 0,14 Z" fill="none" stroke="rgba(16, 185, 129, 0.35)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* User Avatar with Glowing Circular/Elliptical Frame */}
          <div className="relative mt-1">
            <div className="w-14 h-16 rounded-[1.8rem] p-[2px] border border-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.5)] overflow-hidden bg-slate-950 flex items-center justify-center">
              <div className="w-full h-full rounded-[1.6rem] overflow-hidden">
                <img 
                  src={currentUserPhoto || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80"} 
                  alt="You" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
            {/* Status dot / add sign */}
            <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-emerald-500 border border-[#0b1017] rounded-full flex items-center justify-center shadow-lg z-20">
              <Plus className="w-3 h-3 text-black stroke-[3.5]" />
            </div>
          </div>

          {/* User Name & Status Text */}
          <div className="text-center w-full z-20 pb-0.5">
            <p className="text-[10px] text-emerald-400 font-bold truncate max-w-[80px]">
              {notes.find(n => n.userId === "current_user")?.text || "স্ট্যাটাস দিন"}
            </p>
            <span className="text-[10px] font-medium text-slate-300 block truncate max-w-[80px] mt-0.5">আপনার নোট</span>
          </div>
        </div>

        {/* Friends' Notes Cards */}
        {notes.filter(n => n.userId !== "current_user").map((note, index) => {
          // Curated colors directly matching the user's reference photo neon hues
          const themes = [
            { border: "border-cyan-400", shadow: "shadow-[0_0_12px_rgba(34,211,238,0.65)]", dot: "bg-cyan-400", stroke: "rgba(34, 211, 238, 0.35)" },
            { border: "border-pink-400", shadow: "shadow-[0_0_12px_rgba(244,114,182,0.65)]", dot: "bg-pink-400", stroke: "rgba(244, 114, 182, 0.35)" },
            { border: "border-blue-400", shadow: "shadow-[0_0_12px_rgba(96,165,250,0.65)]", dot: "bg-blue-400", stroke: "rgba(96, 165, 250, 0.35)" },
            { border: "border-emerald-400", shadow: "shadow-[0_0_12px_rgba(52,211,153,0.65)]", dot: "bg-emerald-400", stroke: "rgba(52, 211, 153, 0.35)" },
            { border: "border-purple-400", shadow: "shadow-[0_0_12px_rgba(192,132,252,0.65)]", dot: "bg-purple-400", stroke: "rgba(192, 132, 252, 0.35)" }
          ];
          const currentTheme = themes[index % themes.length];

          return (
            <div 
              key={note.id}
              className="w-[96px] h-[138px] flex-shrink-0 flex flex-col items-center justify-between p-2.5 relative transition-all duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer group"
              style={{
                clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
                background: "linear-gradient(135deg, rgba(16, 24, 39, 0.7) 0%, rgba(31, 41, 55, 0.7) 100%)"
              }}
            >
              {/* Custom SVG border tracing chamfered corners */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
                <path d="M 14,0 L 100,0 L 100,86 L 86,100 L 0,100 L 0,14 Z" fill="none" stroke={currentTheme.stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </svg>

              {/* Glowing Oval Frame with Avatar */}
              <div className="relative mt-1">
                <div className={`w-14 h-16 rounded-[1.8rem] p-[2px] border ${currentTheme.border} ${currentTheme.shadow} overflow-hidden bg-slate-950 flex items-center justify-center`}>
                  <div className="w-full h-full rounded-[1.6rem] overflow-hidden">
                    <img 
                      src={note.userPhotoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"} 
                      alt={note.userName} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>
                {/* Online Indicator Badge */}
                <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${currentTheme.dot} border border-[#0b1017] rounded-full shadow-lg shadow-black/50 animate-pulse z-20`} />
              </div>

              {/* Status Note Text & Name */}
              <div className="text-center w-full z-20 pb-0.5">
                <p className="text-[10px] text-teal-300 font-bold truncate max-w-[80px] drop-shadow-md">
                  {note.text}
                </p>
                <span className="text-[10px] font-semibold text-slate-100 block truncate max-w-[80px] mt-0.5 leading-none">
                  {note.userName}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Filter Tabs */}
      <div className="px-4 py-2.5 flex items-center gap-2">
        {[
          { id: 'all', label: 'সকল চ্যাট' },
          { id: 'primary', label: 'মুখ্য' },
          { id: 'requests', label: 'মেসেজ রিকোয়েস্ট' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeFilter === tab.id 
                ? 'bg-emerald-500 text-black font-bold' 
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 5. Clean Conversation Threads */}
      <div className="px-2 divide-y divide-white/5">
        {filteredThreads.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs italic">
            কোনো মেসেজ পাওয়া যায়নি
          </div>
        ) : (
          filteredThreads.map(thread => (
            <div
              key={thread.id}
              onClick={() => onSelectThread(thread)}
              className="px-3 py-3 rounded-xl hover:bg-white/5 flex items-center justify-between gap-3 cursor-pointer transition-colors active:bg-white/10"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar with Online Dot */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#1e293b] flex-shrink-0">
                  <img 
                    src={thread.photoURL || `https://ui-avatars.com/api/?name=${thread.displayName}&background=1e293b&color=fff`} 
                    alt={thread.displayName} 
                    className="w-full h-full object-cover" 
                  />
                  {thread.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0b1017]" />
                  )}
                </div>

                {/* Name & Preview */}
                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-white truncate">
                      {thread.displayName}
                    </h4>
                  </div>
                  <p className={`text-xs truncate mt-1 ${
                    thread.unreadCount > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                  }`}>
                    {thread.lastMessage || "মেসেজ পাঠিয়েছেন"}
                  </p>
                </div>
              </div>

              {/* Unread Pill or Camera */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {thread.unreadCount > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center justify-center">
                    {thread.unreadCount}
                  </span>
                ) : (
                  <Camera className="w-4 h-4 text-slate-500" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating New Chat Button */}
      <button 
        onClick={onStartNewChat}
        className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg active:scale-95 transition-all z-40"
        title="নতুন চ্যাট শুরু করুন"
      >
        <Send className="w-5 h-5 -rotate-12 stroke-[2.2]" />
      </button>
    </div>
  );
};
