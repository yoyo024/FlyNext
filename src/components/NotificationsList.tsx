// app/components/NotificationsList.tsx
import { useEffect, useState } from "react";

interface Notification {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationsList = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      setNotifications(data);
    };
    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PUT",
    });

    setNotifications((prevNotifications) =>
      prevNotifications.map((noti) =>
        noti.id === id ? { ...noti, isRead: true } : noti
      )
    );
  };

  return (
    <div className="space-y-4 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto">
      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications available.</p>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`relative p-4 rounded-md shadow-md mb-4 ${notification.isRead ? "bg-gray-200" : "bg-blue-100"}`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm">{notification.message}</span>
                <span className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>

              {!notification.isRead && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="mt-2 bg-blue-500 text-white text-xs px-3 py-1 rounded-md hover:bg-blue-600 transition-colors"
                >
                  Mark as read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsList;
