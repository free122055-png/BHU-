import React, { useState, useEffect } from "react";
import { 
  Heart, Send, MoreVertical, MessageSquare, 
  Bookmark, Volume2, VolumeX, Music, ChevronRight, ChevronLeft,
  Share2, Sparkles, Trash2, Copy, Check, Search, Bell, MessageCircle, SlidersHorizontal,
  LayoutGrid, Star, Image as ImageIcon, Play, BookOpen, UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InstagramPost, InstagramStory } from "../../types/instagram";
import { InstagramStoriesTray } from "./InstagramStoriesTray";
import { BinistaFuturisticFrame, BinistaFrameStyle } from "./BinistaFuturisticFrame";
import { loadLocalStore } from "../../lib/socialPersistence";
import { INITIAL_BINISTA_NOTIFICATIONS, BinistaNotification } from "../../lib/notificationService";

interface InstagramFeedProps {
  posts: InstagramPost[];
  stories: InstagramStory[];
  currentUserPhoto?: string;
  currentUserId?: string;
  onOpenStory: (storyId: string) => void;
  onCreatePostOrStory: () => void;
  onOpenMessages: () => void;
  onOpenComments: (postId: string) => void;
  onSharePost: (post: InstagramPost) => void;
  onToggleLikePost: (postId: string) => void;
  onToggleBookmarkPost: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
}

const isVideoUrl = (url: string) => {
  if (!url) return false;
  return url.startsWith('data:video') || url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('gtv-videos-bucket');
};

// Demo posts removed.
export const InstagramFeed: React.FC<InstagramFeedProps> = ({
  posts,
  stories,
  currentUserPhoto,
  currentUserId = "current_user",
  onOpenStory,
  onCreatePostOrStory,
  onOpenMessages,
  onOpenComments,
  onSharePost,
  onToggleLikePost,
  onToggleBookmarkPost,
  onDeletePost
}) => {
  const [selectedFrameFilter, setSelectedFrameFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);

  useEffect(() => {
    const checkUnread = async () => {
      try {
        const stored = await loadLocalStore<BinistaNotification>("notifications");
        const list = stored && stored.length > 0 ? stored : INITIAL_BINISTA_NOTIFICATIONS;
        const count = list.filter(n => !n.read).length;
        setUnreadNotifsCount(count);
      } catch (e) {}
    };
    checkUnread();
  }, []);

  const displayPosts = posts;

  const filteredPosts = displayPosts.filter(post => {
    const fStyle = (post as any).frameStyle || "standard_chamfer";
    if (selectedFrameFilter === "all") return true;
    return fStyle === selectedFrameFilter;
  });

  return (
    <div className="h-screen flex flex-col bg-[#080d15] text-slate-100 max-w-lg mx-auto md:max-w-xl font-sans select-none">
      {/* 1. Top Header Bar matching Reference Image */}
      <header className="sticky top-0 z-40 bg-[#080d15]/95 backdrop-blur-xl px-4 py-3.5 flex items-center justify-between border-b border-white/10 shadow-lg shrink-0">
        <h1 className="font-black text-xl tracking-widest text-white uppercase font-sans">
          BINISTA
        </h1>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.location.href = "/chat"}
            className="text-white hover:text-cyan-300 transition-colors cursor-pointer"
            aria-label="Search"
            title="Search"
          >
            <Search className="w-5 h-5 stroke-[2]" />
          </button>

          <button 
            onClick={() => window.location.href = "/notifications"}
            className="text-white hover:text-cyan-300 transition-colors cursor-pointer relative"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-5 h-5 stroke-[2]" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-teal-400 text-black text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-[#080d15] animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          <button 
            onClick={onOpenMessages}
            className="text-white hover:text-cyan-300 transition-colors cursor-pointer relative"
            aria-label="Messages"
            title="Messages"
          >
            <Send className="w-5 h-5 stroke-[2] -rotate-12" />
          </button>
        </div>
      </header>

      {/* Stories and Feed - Scrollable Area */}
      <div className="flex-1 overflow-y-auto pb-28">
        {/* 2. Stories Tray Carousel matching Reference Photo */}
        <InstagramStoriesTray
          stories={stories}
          currentUserPhoto={currentUserPhoto}
          onOpenStory={onOpenStory}
          onCreateStory={onCreatePostOrStory}
        />

        {/* 4. Feed Posts Container */}
        <div className="p-3 space-y-5">
          {filteredPosts.map(post => {
            const fStyle = (post as any).frameStyle || "standard_chamfer";
            const isOwner = post.authorId === currentUserId || post.authorId === "current_user";
            const currentMedia = post.mediaUrls?.[0] || "";

            return (
              <BinistaFuturisticFrame
                key={post.id}
                style={fStyle}
                mediaUrl={currentMedia}
                isVideo={post.mediaType === "video" || isVideoUrl(currentMedia)}
                authorId={post.authorId}
                authorName={post.authorName || post.authorUsername}
                authorUsername={post.authorUsername}
                authorPhotoURL={post.authorPhotoURL}
                onAuthorClick={(id) => window.location.href = `/profile/${id}`}
                caption={post.caption}
                title={(post as any).customTitle || "Beautiful Place"}
                categoryTag={(post as any).categoryTag || "Nature"}
                badgeText={(post as any).badgeText}
                badgeType={(post as any).badgeType || "gallery"}
                likesCount={post.likesCount}
                commentsCount={post.commentsCount}
                isLiked={post.isLiked}
                isBookmarked={post.isBookmarked}
                onToggleLike={() => onToggleLikePost(post.id)}
                onToggleBookmark={() => onToggleBookmarkPost(post.id)}
                onOpenComments={() => onOpenComments(post.id)}
                onShare={() => onSharePost(post)}
                videoDurationText={(post as any).videoDurationText}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
