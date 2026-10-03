import React, { useState, useRef, useEffect } from "react";
import { 
  Heart, MessageSquare, Send, Bookmark, Play, Pause, 
  Volume2, VolumeX, Maximize2, MoreVertical, Sparkles, Check, ChevronRight
} from "lucide-react";
import { motion } from "motion/react";

export type BinistaFrameStyle = 
  | "standard_chamfer"     // Photo Frame (Square/Profile Type) - 4:3 or 1:1 in futuristic chamfered border
  | "short_video_portrait" // Short Video (Portrait) Frame - 9:16 vertical with right action column
  | "long_video_portrait"  // Long Video (Portrait) Frame - 9:16 with center play icon & full seek bar
  | "story_type"           // Story Frame - 9:16 with top progress segments & bottom message input
  | "landscape_video"      // Long Video (Landscape) Frame - 16:9 video inside chamfered border
  | "decorated"            // Photo Frame (Decorated) - cyan border + centered glowing title below
  | "title_video"          // Long Video (With Title) - 9:16 video with category tag, title & caption overlay
  | "caption_overlay";     // Photo Frame (With Caption Overlay) - 9:16 photo with bottom gradient caption

interface BinistaFrameProps {
  style?: BinistaFrameStyle;
  mediaUrl: string;
  isVideo?: boolean;
  authorId?: string;
  authorName?: string;
  authorUsername?: string;
  authorPhotoURL?: string;
  onAuthorClick?: (authorId: string) => void;
  timeAgo?: string;
  caption?: string;
  title?: string;
  categoryTag?: string;
  badgeText?: string;
  badgeType?: "gallery" | "video";
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  onToggleLike?: () => void;
  onToggleBookmark?: () => void;
  onOpenComments?: () => void;
  onShare?: () => void;
  videoDurationText?: string;
}

/**
 * Custom Video Control Bar matching Reference Image IMG_২০২৬১০০৩_০৬৫৭১১_855.png
 * - Play/Pause White Triangle Icon (Left)
 * - Translucent Track + Glowing Cyan Seek Bar (Center)
 * - Mute/Unmute Speaker Icon (Right)
 */
export const BinistaVideoControlOverlay: React.FC<{
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
}> = ({ videoRef, isPlaying, isMuted, onTogglePlay, onToggleMute }) => {
  const [progress, setProgress] = useState<number>(35);
  const [isDragging, setIsDragging] = useState(false);
  const [currentTimeText, setCurrentTimeText] = useState("0:00");
  const [durationText, setDurationText] = useState("0:00");

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  useEffect(() => {
    const videoEl = videoRef?.current;
    if (!videoEl) return;

    const handleTimeUpdate = () => {
      if (!isDragging && videoEl.duration) {
        const pct = (videoEl.currentTime / videoEl.duration) * 100;
        setProgress(pct);
        setCurrentTimeText(formatTime(videoEl.currentTime));
        setDurationText(formatTime(videoEl.duration));
      }
    };

    const handleLoadedMetadata = () => {
      if (videoEl.duration) {
        setDurationText(formatTime(videoEl.duration));
      }
    };

    if (videoEl.duration) {
      setDurationText(formatTime(videoEl.duration));
      setCurrentTimeText(formatTime(videoEl.currentTime));
      setProgress((videoEl.currentTime / videoEl.duration) * 100);
    }

    videoEl.addEventListener("timeupdate", handleTimeUpdate);
    videoEl.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      videoEl.removeEventListener("timeupdate", handleTimeUpdate);
      videoEl.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [videoRef, isDragging]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    const videoEl = videoRef?.current;
    if (videoEl && videoEl.duration) {
      const targetTime = (val / 100) * videoEl.duration;
      videoEl.currentTime = targetTime;
      setCurrentTimeText(formatTime(targetTime));
    }
  };

  return (
    <div className="absolute bottom-3 inset-x-3 z-30 flex items-center justify-between gap-2.5 bg-[#0a0f16]/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 shadow-2xl select-none">
      {/* 1. Play / Pause Button (Left) */}
      <button 
        type="button"
        onClick={onTogglePlay} 
        className="text-white hover:text-teal-300 transition-transform active:scale-90 shrink-0 cursor-pointer p-0.5"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-white text-white" />
        ) : (
          <Play className="w-4 h-4 fill-white text-white ml-0.5" />
        )}
      </button>

      {/* Current Time Display */}
      <span className="text-[10px] font-mono text-teal-300 font-bold shrink-0 select-none min-w-[26px]">
        {currentTimeText}
      </span>

      {/* 2. Drag-Scrubbable Cyan Video Seek Bar (Center) matching reference photo */}
      <div className="relative flex-1 h-2 flex items-center cursor-pointer select-none">
        {/* Track background */}
        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative">
          {/* Cyan filled progress bar */}
          <div 
            className="h-full bg-teal-400 rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(45,212,191,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Draggable Circle Knob (Thumb) */}
        <div 
          className="absolute w-3.5 h-3.5 bg-white border-2 border-teal-400 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.9)] transform -translate-x-1/2 pointer-events-none transition-all duration-75"
          style={{ left: `${progress}%` }}
        />

        {/* Native Range Slider Overlay for Touch & Mouse Drag Scrubbing */}
        <input 
          type="range" 
          min="0" 
          max="100" 
          step="0.1"
          value={progress} 
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label="Seek video position"
        />
      </div>

      {/* Total Duration Display */}
      <span className="text-[10px] font-mono text-slate-400 font-medium shrink-0 select-none min-w-[26px]">
        {durationText}
      </span>

      {/* 3. Mute / Unmute Sound Button (Right) matching reference photo */}
      <button 
        type="button"
        onClick={onToggleMute} 
        className="text-white hover:text-teal-300 transition-transform active:scale-90 shrink-0 cursor-pointer p-0.5"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 text-white" />
        ) : (
          <Volume2 className="w-4 h-4 text-white" />
        )}
      </button>
    </div>
  );
};

export const BinistaFuturisticFrame: React.FC<BinistaFrameProps> = ({
  style = "standard_chamfer",
  mediaUrl,
  isVideo = false,
  authorId,
  authorName = "Rafiul Hasan",
  authorUsername = "rajibul_islam",
  authorPhotoURL = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  onAuthorClick,
  timeAgo = "2 hours ago",
  caption = "আল্লাহর সৃষ্টি কতই না সুন্দর... 🌿",
  title = "Beautiful Place",
  categoryTag = "Nature",
  badgeText,
  badgeType = "gallery",
  likesCount = 248,
  commentsCount = 12,
  isLiked = false,
  isBookmarked = false,
  onToggleLike,
  onToggleBookmark,
  onOpenComments,
  onShare,
  videoDurationText = "0:32 / 3:45"
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likesCount);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [mediaAspect, setMediaAspect] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleMediaLoaded = (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
    const target = e.currentTarget;
    if ('naturalWidth' in target && target.naturalWidth && target.naturalHeight) {
      setMediaAspect(target.naturalWidth / target.naturalHeight);
    } else if ('videoWidth' in target && target.videoWidth && target.videoHeight) {
      setMediaAspect(target.videoWidth / target.videoHeight);
    }
  };

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikes(prev => Math.max(0, prev - 1));
    } else {
      setLiked(true);
      setLikes(prev => prev + 1);
    }
    onToggleLike?.();
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    onToggleBookmark?.();
  };

  // -------------------------------------------------------------
  // STYLE 1: Short Video (Portrait) Frame (শর্ট ভিডিও পোর্ট্রেট ফ্রেম)
  // -------------------------------------------------------------
  if (style === "short_video_portrait") {
    return (
      <div className="relative w-full max-w-sm mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-black border border-teal-500/40 shadow-[0_0_20px_rgba(45,212,191,0.15)] flex flex-col justify-between p-4 select-none">
        {/* Background Media */}
        {isVideo ? (
          <video ref={videoRef} src={mediaUrl} autoPlay loop muted={isMuted} playsInline className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <img src={mediaUrl} alt="Short Video" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        {/* Top Header Overlay */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={authorPhotoURL} alt={authorUsername} className="w-9 h-9 rounded-full object-cover border border-teal-400/60" />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-xs text-white tracking-wide">{authorUsername}</span>
                <span className="w-3.5 h-3.5 rounded-full bg-[#0095f6] text-white flex items-center justify-center text-[8px] font-black">✓</span>
              </div>
              <span className="text-[10px] text-slate-300">{timeAgo}</span>
            </div>
          </div>
          <button className="text-white/80 hover:text-white p-1">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Right Action Column */}
        <div className="relative z-10 self-end flex flex-col items-center gap-5 mb-12">
          <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
              <Heart className={`w-5 h-5 ${liked ? "fill-rose-500 text-rose-500" : "text-white"}`} />
            </div>
            <span className="text-[10px] font-bold text-white shadow-sm">{likes}</span>
          </button>

          <button onClick={onOpenComments} className="flex flex-col items-center gap-1 group">
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-bold text-white shadow-sm">{commentsCount}</span>
          </button>

          <button onClick={onShare} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 hover:scale-110 transition-transform">
            <Send className="w-4 h-4 text-white -rotate-12" />
          </button>

          <button onClick={handleBookmark} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 hover:scale-110 transition-transform">
            <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-amber-400 text-amber-400" : "text-white"}`} />
          </button>
        </div>

        {/* Bottom Video Control Bar matching Reference Image IMG_২০২৬১০০৩_০৬৫৭১১_855.png */}
        <BinistaVideoControlOverlay 
          videoRef={videoRef}
          isPlaying={isPlaying}
          isMuted={isMuted}
          onTogglePlay={togglePlay}
          onToggleMute={toggleMute}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // STYLE 2: Long Video (Portrait) Frame (লম্বা ভিডিও পোর্ট্রেট ফ্রেম)
  // -------------------------------------------------------------
  if (style === "long_video_portrait") {
    return (
      <div className="relative w-full max-w-sm mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-black border border-teal-500/40 shadow-[0_0_20px_rgba(45,212,191,0.15)] flex flex-col justify-between p-4 select-none">
        {/* Background Media */}
        {isVideo ? (
          <video ref={videoRef} src={mediaUrl} autoPlay loop muted={isMuted} playsInline className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <img src={mediaUrl} alt="Long Video Portrait" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
            ←
          </button>
          <button className="text-white/80 hover:text-white p-1">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Center Play Button Overlay */}
        <div className="relative z-10 self-center my-auto">
          <button 
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-xl"
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white ml-1" />}
          </button>
        </div>

        {/* Bottom Video Control Bar matching Reference Image IMG_২০২৬১০০৩_০৬৫৭১১_855.png */}
        <BinistaVideoControlOverlay 
          videoRef={videoRef}
          isPlaying={isPlaying}
          isMuted={isMuted}
          onTogglePlay={togglePlay}
          onToggleMute={toggleMute}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // STYLE 3: Story Frame (স্টোরি ফ্রেম)
  // -------------------------------------------------------------
  if (style === "story_type") {
    return (
      <div className="relative w-full max-w-sm mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-black border border-teal-500/40 shadow-xl flex flex-col justify-between p-4 select-none">
        {/* Background Image */}
        <img src={mediaUrl} alt="Story" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        {/* Top Header with Progress Line */}
        <div className="relative z-10 space-y-2">
          {/* Segmented Progress Bars */}
          <div className="flex gap-1.5 w-full">
            <div className="h-1 flex-1 bg-white rounded-full" />
            <div className="h-1 flex-1 bg-white/40 rounded-full" />
            <div className="h-1 flex-1 bg-white/40 rounded-full" />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <img src={authorPhotoURL} alt={authorUsername} className="w-8 h-8 rounded-full object-cover border border-white" />
              <span className="font-bold text-xs text-white">{authorUsername}</span>
              <span className="text-[10px] text-white/70">2h</span>
            </div>
            <MoreVertical className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Bottom Interaction Bar */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-xs text-slate-300">
            Send message...
          </div>
          <button onClick={handleLike} className="p-2 text-white hover:text-rose-400">
            <Heart className={`w-6 h-6 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
          <button onClick={onShare} className="p-2 text-white">
            <Send className="w-6 h-6 -rotate-12" />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STYLE 4: Photo Frame (Decorated) (ফটো ফ্রেম ডেকোরেটেড)
  // -------------------------------------------------------------
  if (style === "decorated") {
    return (
      <div className="relative w-full max-w-sm mx-auto bg-[#0b1017] border border-teal-500/30 rounded-3xl p-4 space-y-4 text-center">
        {/* Frame Outer */}
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-teal-400/60 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
          <img src={mediaUrl} alt={title} className="w-full h-full object-cover" />
        </div>

        {/* Decorated Title Center Accent */}
        <div className="flex items-center justify-center gap-3 py-1">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-teal-400" />
          <span className="font-serif italic text-base font-bold tracking-wide text-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]">
            {title || "Beautiful Place"}
          </span>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-teal-400" />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STYLE 5: Long Video (With Title) Frame (লম্বা ভিডিও টাইটেলসহ ফ্রেম)
  // -------------------------------------------------------------
  if (style === "title_video") {
    return (
      <div className="relative w-full max-w-sm mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-black border border-teal-500/40 shadow-2xl flex flex-col justify-between p-4 select-none">
        {/* Background Media */}
        {isVideo ? (
          <video ref={videoRef} src={mediaUrl} autoPlay loop muted={isMuted} playsInline className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <img src={mediaUrl} alt="Title Video" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90 pointer-events-none" />

        {/* Top Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <button className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center">←</button>
          <MoreVertical className="w-5 h-5 text-white" />
        </div>

        {/* Bottom Content with Tag & Title */}
        <div className="relative z-10 space-y-3 pb-12">
          {/* Category Tag Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/50 text-teal-300 text-xs font-bold backdrop-blur-md">
            <span>🌿</span>
            <span>{categoryTag || "Nature"}</span>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-lg text-white leading-tight">{title || "Peaceful Evening"}</h3>
            <p className="text-xs text-slate-300 font-light">{caption || "Nature always gives us the best moments. 🌿"}</p>
          </div>
        </div>

        {/* Video Control Bar matching Reference Image IMG_২০২৬১০০৩_০৬৫৭১১_855.png */}
        <BinistaVideoControlOverlay 
          videoRef={videoRef}
          isPlaying={isPlaying}
          isMuted={isMuted}
          onTogglePlay={togglePlay}
          onToggleMute={toggleMute}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // STYLE 6: Photo Frame (With Caption Overlay) (ফটো ফ্রেম ক্যাপশনসহ)
  // -------------------------------------------------------------
  if (style === "caption_overlay") {
    return (
      <div className="relative w-full max-w-sm mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-black border border-teal-500/40 shadow-2xl flex flex-col justify-end p-4 select-none">
        <img src={mediaUrl} alt="Caption Overlay" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-end justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <img src={authorPhotoURL} alt={authorUsername} className="w-8 h-8 rounded-full object-cover border border-teal-400" />
              <span className="font-bold text-xs text-white">{authorUsername}</span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#0095f6] text-white flex items-center justify-center text-[8px] font-black">✓</span>
            </div>
            <p className="text-xs text-slate-100 font-medium leading-relaxed max-w-[240px]">
              {caption || "সুন্দর এই পৃথিবী, আল্লাহর সৃষ্টির এক অপূর্ব নিদর্শন..."}
            </p>
          </div>

          <button onClick={handleLike} className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:scale-110 transition-transform">
            <Heart className={`w-6 h-6 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STYLE 7: Long Video (Landscape) Frame (লম্বা ভিডিও ল্যান্ডস্কেপ ফ্রেম)
  // -------------------------------------------------------------
  if (style === "landscape_video") {
    return (
      <div className="w-full bg-[#0b1017] border border-slate-800 rounded-3xl p-3.5 space-y-3">
        {/* Author Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={authorPhotoURL} alt={authorUsername} className="w-10 h-10 rounded-full object-cover border border-teal-500/40" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white">{authorUsername}</span>
                <span className="w-3.5 h-3.5 rounded-full bg-[#0095f6] text-white flex items-center justify-center text-[8px] font-black">✓</span>
              </div>
              <span className="text-[11px] text-slate-400">{timeAgo}</span>
            </div>
          </div>
          <MoreVertical className="w-5 h-5 text-slate-400" />
        </div>

        {/* Landscape Video Container inside Futuristic Chamfered Border */}
        <div 
          className="relative w-full overflow-hidden rounded-2xl bg-black transition-all duration-300"
          style={{
            aspectRatio: "16/9",
            maxHeight: "80vh"
          }}
        >
          {/* Chamfer Clip Path Container */}
          <div 
            className="w-full h-full relative overflow-hidden"
            style={{
              clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)"
            }}
          >
            {isVideo ? (
              <video 
                ref={videoRef}
                src={mediaUrl} 
                autoPlay 
                loop 
                muted={isMuted} 
                playsInline 
                onLoadedMetadata={handleMediaLoaded}
                className="w-full h-full object-cover" 
              />
            ) : (
              <img 
                src={mediaUrl} 
                alt="Landscape Video" 
                onLoad={handleMediaLoaded}
                className="w-full h-full object-cover" 
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* SVG Chamfer Outline */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
            <path d="M 6,0 L 100,0 L 100,94 L 94,100 L 0,100 L 0,6 Z" fill="none" stroke="#2dd4bf" strokeWidth="1.8" vectorEffect="non-scaling-stroke" className="drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
          </svg>

          {/* Video Control Bar matching Reference Image IMG_২০২৬১০০৩_০৬৫৭১১_855.png */}
          {isVideo && (
            <BinistaVideoControlOverlay 
              videoRef={videoRef}
              isPlaying={isPlaying}
              isMuted={isMuted}
              onTogglePlay={togglePlay}
              onToggleMute={toggleMute}
            />
          )}
        </div>

        {/* Caption */}
        <p className="text-xs text-slate-200 font-medium px-1">{caption}</p>

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-1 px-1">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="flex items-center gap-1.5 text-white">
              <Heart className={`w-5 h-5 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
              <span className="text-xs font-semibold">{likes}</span>
            </button>
            <button onClick={onOpenComments} className="flex items-center gap-1.5 text-white">
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs font-semibold">{commentsCount}</span>
            </button>
            <button onClick={onShare} className="text-white">
              <Send className="w-5 h-5 -rotate-12" />
            </button>
          </div>
          <button onClick={handleBookmark} className="text-white">
            <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DEFAULT / STYLE 8: Photo Frame (Square/Profile Type) (স্কয়ার / প্রোফাইল টাইপ)
  // -------------------------------------------------------------
  return (
    <article className="bg-[#0c1017] border border-slate-800/80 rounded-3xl p-3.5 space-y-3 shadow-xl relative">
      {/* Author Header */}
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => authorId && onAuthorClick?.(authorId)}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1e293b] ring-1 ring-teal-500/30">
            <img src={authorPhotoURL} alt={authorUsername} className="w-full h-full object-cover" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white">{authorName}</span>
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#0095f6] text-white text-[8px] font-black shrink-0">
                ✓
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo} • 🌐</p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-white p-1">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Main Media Container inside Futuristic Chamfered Border */}
      <div 
        className="relative w-full rounded-2xl bg-black overflow-hidden select-none transition-all duration-300"
        style={{
          aspectRatio: "1/1",
          maxHeight: "80vh"
        }}
      >
        {/* Chamfer Clip Path Container */}
        <div 
          className="w-full h-full relative overflow-hidden"
          style={{
            clipPath: "polygon(22px 0, 100% 0, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0 100%, 0 22px)"
          }}
        >
          {isVideo ? (
            <video 
              ref={videoRef}
              src={mediaUrl} 
              autoPlay 
              loop 
              muted={isMuted} 
              playsInline 
              onLoadedMetadata={handleMediaLoaded}
              className="w-full h-full object-cover bg-black" 
            />
          ) : (
            <img 
              src={mediaUrl} 
              alt="Post" 
              onLoad={handleMediaLoaded}
              className="w-full h-full object-cover bg-black" 
            />
          )}
        </div>

        {/* Video Control Bar matching Reference Image IMG_২০২৬১০০৩_০৬৫৭১১_855.png */}
        {isVideo && (
          <BinistaVideoControlOverlay 
            videoRef={videoRef}
            isPlaying={isPlaying}
            isMuted={isMuted}
            onTogglePlay={togglePlay}
            onToggleMute={toggleMute}
          />
        )}

        {/* Futuristic Glowing Cyan Border SVG */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
          <path d="M 6,0 L 100,0 L 100,94 L 94,100 L 0,100 L 0,6 Z" fill="none" stroke="#2dd4bf" strokeWidth="1.8" vectorEffect="non-scaling-stroke" className="drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
          <path d="M 9,3 L 97,3 L 97,91 L 91,97 L 3,97 L 3,9 Z" fill="none" stroke="#06b6d4" strokeWidth="0.75" strokeDasharray="4 2" vectorEffect="non-scaling-stroke" className="opacity-40" />
        </svg>

        {/* Top-Right Badge */}
        {badgeText && (
          <div className="absolute top-3 right-3 z-30 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-teal-500/40 text-[11px] font-bold text-teal-300 flex items-center gap-1.5 shadow-lg">
            {badgeType === "gallery" ? (
              <svg className="w-3.5 h-3.5 stroke-teal-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 fill-teal-300 stroke-none" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
            <span>{badgeText}</span>
          </div>
        )}
      </div>

      {/* Caption Text Directly Under Media Frame */}
      <div className="text-xs text-slate-200 font-medium leading-relaxed pt-1">
        <span>{caption}</span>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="flex items-center gap-1.5 text-white cursor-pointer group">
            <Heart className={`w-5.5 h-5.5 ${liked ? "fill-rose-500 text-rose-500" : "stroke-[1.8] group-hover:text-rose-400"}`} />
            <span className="text-xs font-bold text-slate-200">{likes}</span>
          </button>

          <button onClick={onOpenComments} className="flex items-center gap-1.5 text-white cursor-pointer group">
            <MessageSquare className="w-5.5 h-5.5 stroke-[1.8] group-hover:text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">{commentsCount}</span>
          </button>

          <button onClick={onShare} className="text-white hover:text-cyan-400 transition-colors cursor-pointer">
            <Send className="w-5 h-5 stroke-[1.8] -rotate-12" />
          </button>
        </div>

        <button onClick={handleBookmark} className="text-white hover:text-amber-400 transition-colors cursor-pointer">
          <Bookmark className={`w-5.5 h-5.5 ${bookmarked ? "fill-amber-400 text-amber-400" : "stroke-[1.8]"}`} />
        </button>
      </div>
    </article>
  );
};
