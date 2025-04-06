// app/notification/page.tsx
"use client";

import { useUser } from "@/hook/useUser";
import Navigation from "@/components/ui/navigation";
import NotificationsList from "@/components/NotificationsList";

const NotificationPage = () => {
  const { user } = useUser();

  return (
    <>
      <Navigation />
      <div className="p-6">
        <h1 className="flex justify-center items-center text-3xl font-bold mb-4 text-center">
          {user?.firstName}'s Notifications
        </h1>
        <NotificationsList />
      </div>
    </>
  );
};

export default NotificationPage;
