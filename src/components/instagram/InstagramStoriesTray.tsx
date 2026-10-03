import React from "react";
import { Plus, ArrowRight } from "lucide-react";
import { InstagramStory } from "../../types/instagram";

interface InstagramStoriesTrayProps {
  stories: InstagramStory[];
  currentUserPhoto?: string;
  onOpenStory: (storyId: string) => void;
  onCreateStory: () => void;
}

export const InstagramStoriesTray: React.FC<InstagramStoriesTrayProps> = ({
  stories = [],
  currentUserPhoto,
  onOpenStory,
  onCreateStory
}) => {
  // Map dynamic stories if provided
  const storyList = stories.map((s, idx) => ({
    id: s.id,
    authorName: s.authorName || s.authorUsername,
    authorUsername: s.authorUsername,
    timeAgo: "2h",
    authorPhotoURL: s.authorPhotoURL || currentUserPhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    mediaUrl: s.mediaUrl,
    borderColor: idx % 3 === 0 ? "border-emerald-400/80" : idx % 3 === 1 ? "border-cyan-400/80" : "border-pink-400/80",
    glowColor: idx % 3 === 0 ? "shadow-[0_0_15px_rgba(52,211,153,0.35)]" : idx % 3 === 1 ? "shadow-[0_0_15px_rgba(34,211,238,0.35)]" : "shadow-[0_0_15px_rgba(244,114,182,0.35)]",
    dotColor: idx % 3 === 0 ? "bg-emerald-400" : idx % 3 === 1 ? "bg-cyan-400" : "bg-pink-400"
  }));

  return (
    <div className="relative pt-3 pb-4 px-3 bg-[#050b14] overflow-hidden border-b border-white/10 select-none">
      {/* Background Subtle Arc Light Glow */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-20 bg-gradient-to-r from-blue-600/15 via-teal-500/20 to-purple-600/15 blur-2xl pointer-events-none" />

      {/* 3D Glass Cards Carousel Container matching Reference Image file_00000000aaa0820891ddda4083326a34.png */}
      <div 
        className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 relative z-10"
        style={{
          perspective: "1200px"
        }}
      >
        {/* 1. "Create Story" Card (Far Left) matching reference photo */}
        <div 
          onClick={onCreateStory}
          className="relative w-28 h-40 sm:w-32 sm:h-44 rounded-2xl bg-gradient-to-b from-[#0c1a2e]/95 via-[#07111c]/85 to-[#050b14] border-2 border-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex flex-col items-center justify-center p-3 cursor-pointer group hover:scale-105 active:scale-95 transition-all duration-300 shrink-0 select-none overflow-hidden"
          style={{
            transform: "rotateY(-4deg) rotateX(2deg)",
            transformStyle: "preserve-3d"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-blue-500/20 pointer-events-none" />

          {/* Plus Circle Button */}
          <div className="w-11 h-11 rounded-full bg-cyan-500/15 border border-cyan-400/90 flex items-center justify-center text-cyan-300 group-hover:scale-110 group-hover:bg-cyan-500/25 transition-all shadow-[0_0_15px_rgba(6,182,212,0.5)] mb-3">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>

          <span className="text-xs font-bold text-white tracking-wide text-center leading-tight drop-shadow-md">
            Create<br />Story
          </span>
        </div>

        {/* 2. Friends' 3D Glass Story Cards matching reference photo */}
        {storyList.map((story, index) => {
          const tiltAngle = (index % 5 - 2) * 1.5;

          return (
            <div 
              key={story.id}
              onClick={() => onOpenStory(story.id)}
              className={`relative w-28 h-40 sm:w-32 sm:h-44 rounded-2xl overflow-hidden border-2 ${story.borderColor} ${story.glowColor} flex flex-col justify-end p-2.5 cursor-pointer group hover:scale-105 active:scale-95 transition-all duration-300 shrink-0 select-none bg-[#09111e]/80 backdrop-blur-md`}
              style={{
                transform: `rotateY(${tiltAngle}deg)`,
                transformStyle: "preserve-3d"
              }}
            >
              {/* Background Story Image */}
              <img 
                src={story.mediaUrl} 
                alt={story.authorName} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />

              {/* Bottom Dark Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

              {/* Author Row matching reference photo */}
              <div className="relative z-10 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="relative shrink-0">
                    <img 
                      src={story.authorPhotoURL} 
                      alt={story.authorName} 
                      className="w-6 h-6 rounded-full object-cover border border-white/90 shadow-md"
                    />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${story.dotColor} ring-1 ring-black`} />
                  </div>
                  <span className="font-bold text-xs text-white drop-shadow-md truncate">
                    {story.authorName}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-medium pl-7 -mt-1">
                  {story.timeAgo}
                </p>
              </div>
            </div>
          );
        })}

        {/* 3. "View More (+24)" Card (Far Right) matching reference photo */}
        <div 
          onClick={onCreateStory}
          className="relative w-28 h-40 sm:w-32 sm:h-44 rounded-2xl bg-[#09121f]/90 backdrop-blur-xl border-2 border-indigo-500/50 shadow-[0_0_18px_rgba(99,102,241,0.25)] flex flex-col items-center justify-center p-3 cursor-pointer group hover:scale-105 active:scale-95 transition-all duration-300 shrink-0 select-none overflow-hidden"
          style={{
            transform: "rotateY(4deg) rotateX(2deg)",
            transformStyle: "preserve-3d"
          }}
        >
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-400/80 flex items-center justify-center text-indigo-300 group-hover:scale-110 transition-transform mb-2 shadow-[0_0_12px_rgba(99,102,241,0.4)]">
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </div>

          <span className="text-xs font-bold text-white text-center leading-tight">
            View More
          </span>
          <span className="text-xs font-black text-indigo-400 mt-0.5">
            +24
          </span>
        </div>
      </div>
    </div>
  );
};
