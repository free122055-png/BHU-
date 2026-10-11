import { db } from "./firebase";
import { collection, addDoc, doc, setDoc, updateDoc, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore";
import { saveLocalItem, loadLocalStore } from "./socialPersistence";

export interface BinistaNotification {
  id: string;
  userId: string; // Target user or "ALL" or "current_user"
  actorId: string;
  actorUsername: string;
  actorName?: string;
  actorPhotoURL?: string;
  type: "like" | "comment" | "reply" | "follow" | "follow_request" | "message" | "share" | "mention" | "story";
  contentType?: "post" | "reel" | "story" | "chat" | "video";
  targetId?: string; // postId, reelId, storyId, or chatRoomId
  mediaThumbnail?: string;
  title: string;
  message: string;
  commentText?: string;
  read: boolean;
  createdAt: number;
  link?: string;
}

export interface BinistaNotificationSettings {
  likes: boolean;
  comments: boolean;
  replies: boolean;
  follows: boolean;
  messages: boolean;
  mentions: boolean;
  shares: boolean;
  stories: boolean;
  push: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: BinistaNotificationSettings = {
  likes: true,
  comments: true,
  replies: true,
  follows: true,
  messages: true,
  mentions: true,
  shares: true,
  stories: true,
  push: true
};

/**
 * Load Notification Settings from LocalStorage / Defaults
 */
export const loadNotificationSettings = (): BinistaNotificationSettings => {
  try {
    const saved = localStorage.getItem("binista_notification_settings");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return DEFAULT_NOTIFICATION_SETTINGS;
};

/**
 * Save Notification Settings
 */
export const saveNotificationSettings = (settings: BinistaNotificationSettings): void => {
  try {
    localStorage.setItem("binista_notification_settings", JSON.stringify(settings));
  } catch (e) {}
};

/**
 * Default Seed Notifications matching Reference Image 1
 */
export const INITIAL_BINISTA_NOTIFICATIONS: BinistaNotification[] = [
  {
    id: "notif_1",
    userId: "current_user",
    actorId: "u_rafiq",
    actorUsername: "rafiq_ahmed",
    actorName: "Rafiq Ahmed",
    actorPhotoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    type: "like",
    contentType: "post",
    targetId: "post_rafiul",
    mediaThumbnail: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=300&auto=format&fit=crop&q=80",
    title: "rafiq_ahmed",
    message: "আপনার পোস্টে লাইক দিয়েছেন ❤️",
    read: false,
    createdAt: Date.now() - 120000, // 2m ago
    link: "/notifications/notif_1"
  },
  {
    id: "notif_2",
    userId: "current_user",
    actorId: "u_sadia",
    actorUsername: "sadia_akter",
    actorName: "Sadia Akter",
    actorPhotoURL: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    type: "comment",
    contentType: "video",
    targetId: "post_sadia",
    mediaThumbnail: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=300&auto=format&fit=crop&q=80",
    title: "sadia_akter",
    message: "আপনার ভিডিওতে কমেন্ট করেছে:",
    commentText: "দারুণ হয়েছে! 😊",
    read: false,
    createdAt: Date.now() - 300000, // 5m ago
    link: "/notifications/notif_2"
  },
  {
    id: "notif_3",
    userId: "current_user",
    actorId: "u_tanzim",
    actorUsername: "tanzim_rahman",
    actorName: "Tanzim Rahman",
    actorPhotoURL: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    type: "follow",
    targetId: "u_tanzim",
    title: "tanzim_rahman",
    message: "আপনাকে ফলো করেছে",
    read: true,
    createdAt: Date.now() - 720000, // 12m ago
    link: "/notifications/notif_3"
  },
  {
    id: "notif_4",
    userId: "current_user",
    actorId: "u_islamic",
    actorUsername: "islamic_life",
    actorName: "Islamic Life",
    actorPhotoURL: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=150&auto=format&fit=crop&q=80",
    type: "share",
    contentType: "post",
    targetId: "post_rafiul",
    mediaThumbnail: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=300&auto=format&fit=crop&q=80",
    title: "islamic_life",
    message: "একটি নতুন পোস্ট শেয়ার করেছে",
    read: true,
    createdAt: Date.now() - 1080000, // 18m ago
    link: "/notifications/notif_4"
  },
  {
    id: "notif_5",
    userId: "current_user",
    actorId: "u_story",
    actorUsername: "your_story",
    actorName: "Your Story",
    actorPhotoURL: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80",
    type: "reply",
    contentType: "story",
    targetId: "s_ayaan",
    title: "your_story",
    message: "এ কেউ রিপ্লাই দিয়েছে",
    read: true,
    createdAt: Date.now() - 1260000, // 21m ago
    link: "/notifications/notif_5"
  },
  {
    id: "notif_6",
    userId: "current_user",
    actorId: "u_nusrat",
    actorUsername: "nusrat_jahan",
    actorName: "Nusrat Jahan",
    actorPhotoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    type: "like",
    contentType: "reel",
    targetId: "post_sadia",
    mediaThumbnail: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=300&auto=format&fit=crop&q=80",
    title: "nusrat_jahan",
    message: "আপনার রিলসে লাইক দিয়েছে",
    read: true,
    createdAt: Date.now() - 1500000, // 25m ago
    link: "/notifications/notif_6"
  },
  {
    id: "notif_7",
    userId: "current_user",
    actorId: "u_ahad",
    actorUsername: "md_ahad",
    actorName: "MD Ahad",
    actorPhotoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    type: "message",
    contentType: "chat",
    targetId: "chat_ahad",
    title: "md_ahad",
    message: "আপনার মেসেজের রিপ্লাই দিয়েছে",
    read: true,
    createdAt: Date.now() - 1920000, // 32m ago
    link: "/chat"
  }
];

/**
 * Trigger & Persist a New Real-Time Notification
 */
export const createBinistaNotification = async (notifData: Omit<BinistaNotification, "id" | "createdAt" | "read">): Promise<void> => {
  const settings = loadNotificationSettings();

  // 1. Check Settings Permissions
  if (notifData.type === "like" && !settings.likes) return;
  if (notifData.type === "comment" && !settings.comments) return;
  if (notifData.type === "reply" && !settings.replies) return;
  if (notifData.type === "follow" && !settings.follows) return;
  if (notifData.type === "message" && !settings.messages) return;
  if (notifData.type === "mention" && !settings.mentions) return;
  if (notifData.type === "share" && !settings.shares) return;
  if (notifData.type === "story" && !settings.stories) return;

  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newNotif: BinistaNotification = {
    ...notifData,
    id: notifId,
    read: false,
    createdAt: Date.now(),
    link: notifData.link || `/notifications/${notifId}`
  };

  // 2. Local Persistence (IndexedDB & LocalStorage)
  try {
    const existing = await loadLocalStore<BinistaNotification>("notifications");
    
    // Prevent duplicates for same type & targetId within 5 minutes
    const isDuplicate = existing.some(item => 
      item.actorUsername === newNotif.actorUsername && 
      item.type === newNotif.type && 
      item.targetId === newNotif.targetId &&
      (Date.now() - item.createdAt) < 300000
    );

    if (!isDuplicate) {
      await saveLocalItem("notifications", newNotif);

      // Save to Firestore
      try {
        await addDoc(collection(db, "notifications"), {
          ...newNotif,
          createdAt: serverTimestamp()
        });
      } catch (fErr) {
        console.warn("[NotificationService] Firestore fallback notice:", fErr);
      }

      // 3. Trigger Browser Web Push Notification if permitted & push enabled
      if (settings.push && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(`BINISTA - ${newNotif.actorUsername}`, {
            body: `${newNotif.message} ${newNotif.commentText ? `"${newNotif.commentText}"` : ""}`,
            icon: newNotif.actorPhotoURL || "/app_icon.png"
          });
        } catch (e) {}
      }
    }
  } catch (err) {
    console.warn("[NotificationService] Notification error:", err);
  }
};
