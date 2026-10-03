import React, { useState } from 'react';
import { notificationService } from '../../lib/notifications';
import { auth } from '../../lib/firebase';

export const NotificationTester: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const triggerTest = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please login first to test notifications.");
      return;
    }
    
    setLoading(true);
    try {
      console.log("Triggering test social notification for:", user.uid);
      await notificationService.sendSocialNotification(
        user.uid,
        "System Test",
        "like",
        "Test Post"
      );
      alert("Test notification triggered! Check your device.");
    } catch (error) {
      console.error("Test failed:", error);
      alert("Test failed: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-slate-900 rounded-lg border border-teal-500/30 my-4">
      <h3 className="text-white font-bold mb-2">Notification Tester</h3>
      <button 
        onClick={triggerTest}
        disabled={loading}
        className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:bg-slate-700"
      >
        {loading ? "Sending..." : "Send Test Like Notification"}
      </button>
    </div>
  );
};
