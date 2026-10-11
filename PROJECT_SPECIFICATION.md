# BINISTA - Project Technical Specification & Integration Guide

এই ডকুমেন্টটি নতুন ডেভলপারকে সফটওয়্যারের কাঠামো এবং সমস্ত ইন্টিগ্রেশন বুঝতে সাহায্য করবে।

## ১. কোর টেকনোলজি স্ট্যাক (Core Tech Stack)
*   **Frontend:** React (Vite) + TypeScript
*   **Styling:** Tailwind CSS + Framer Motion (এনিমেশনের জন্য)
*   **Backend:** Node.js (Express) - `server.ts` ফাইলটি মেইন এপিআই গেটওয়ে হিসেবে কাজ করে।
*   **Mobile:** Capacitor (Android এর জন্য)
*   **Database & Auth:** Firebase (Firestore & Authentication)

## ২. ইন্টিগ্রেশন ও এপিআই তথ্য (Integrations & APIs)

### ক. ওটিপি ও এসএমএস (OTP & SMS)
*   **Provider:** SAS Bulk SMS Gateway
*   **Endpoint:** `http://sms.sasbulksms.com:3040/sendtext`
*   **Method:** HTTP GET/POST via Backend
*   **Fail-safe:** সার্ভারে কোনো সমস্যা হলে বা ব্যালেন্স শেষ হলে ওটিপি ভেরিফিকেশন যেন আটকে না যায়, সেজন্য `123456` টেস্ট কোড হিসেবে রাখা হয়েছে।

### খ. ইমেইল সার্ভিস (Email Service)
*   **Primary:** Resend API (Primary Inbox delivery এর জন্য)
*   **Secondary:** Nodemailer SMTP (Gmail/Custom SMTP)
*   **Usage:** অ্যাকাউন্ট ভেরিফিকেশন, ওটিপি এবং কাস্টমার নোটিফিকেশন।

### গ. পুশ নোটিফিকেশন (Push Notifications)
*   **Provider:** OneSignal
*   **Logic:** ব্রডকাস্ট মেসেজ এবং চ্যাট নোটিফিকেশন পাঠানোর জন্য OneSignal এপিআই ব্যবহার করা হয়।

### ঘ. এআই ফিচার (AI Features - Gemini)
*   **Model:** Google Gemini API (`@google/genai`)
*   **Features:** অটোমেটিক ক্যাপশন জেনারেশন, চ্যাট অটো-রিপ্লাই, এবং পার্সোনাল এআই এজেন্ট।

### ঙ. ইমেজ ও ভিডিও স্টোরেজ (Media Storage & CDN)
*   **Public CDN:** ImgBB, FreeImage.host, tmpfiles.org
*   **Self-hosted:** সার্ভারের `/public/uploads` ফোল্ডারে ভিডিও এবং বড় ফাইল সেভ হয়।

### চ. কুরিয়ার ইন্টিগ্রেশন (Courier Integration)
*   **Provider:** Steadfast Courier API
*   **Feature:** অর্ডার ট্র্যাকিং এবং পার্সেল তৈরি।

## ৩. অথেন্টিকেশন ফ্লো (Authentication Flow)
১. ইউজার মোবাইল বা ইমেইল প্রদান করে।
২. সার্ভার ওটিপি জেনারেট করে সেশনে জমা রাখে এবং সেন্ড করে।
৩. ওটিপি ভেরিফাই হলে একটি `verificationToken` তৈরি হয়।
৪. শেষ ধাপে Firebase Auth এবং Firestore-এ ডাটা সেভ হয়।

## ৪. গুরুত্বপূর্ণ এনভায়রনমেন্ট ভেরিয়েবল (Env Vars)
ডেভলপারকে অবশ্যই এই কি (Keys) গুলো সেটআপ করতে হবে:
*   `VITE_FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`
*   `SMS_API_KEY`, `SMS_SECRET_KEY`
*   `RESEND_API_KEY`
*   `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`
*   `GEMINI_API_KEY`

## ৫. বিল্ড প্রসেস (Build Process)
*   **Web Build:** `npm run build`
*   **Android Build:** `npx cap sync android` এরপর Android Studio দিয়ে APK/AAB তৈরি করা।

---
**প্রয়োজনীয় ফাইল লোকেশন:**
*   সার্ভার লজিক: `/server.ts`
*   ক্লায়েন্ট এপিআই হেল্পার: `/src/lib/api.ts`
*   ওটিপি সার্ভিস: `/src/lib/otpService.ts`
*   লগইন পেজ: `/src/pages/Login.tsx`
