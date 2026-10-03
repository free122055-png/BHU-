import React from 'react';
import { NotificationTester } from '../components/admin/NotificationTester';

export const NotificationTestPage: React.FC = () => {
  return (
    <div className="p-10 min-h-screen bg-black text-white">
      <h1 className="text-3xl font-bold mb-5">Notification Test Page</h1>
      <NotificationTester />
    </div>
  );
};
