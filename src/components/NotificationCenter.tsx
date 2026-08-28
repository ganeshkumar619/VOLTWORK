import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Zap, Info, Trash2 } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { formatDateTime } from '../lib/formatters.ts';
import type { NotificationItem } from '../types/index.ts';
import { useAuth } from '../lib/auth.tsx';
import { useToast } from './ToastNotification.tsx';
import { PermanentDeleteModal } from './PermanentDeleteModal.tsx';

interface NotificationCenterProps {
  onSelectJob?: (jobId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onSelectJob }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [notifToDelete, setNotifToDelete] = useState<NotificationItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const fetchNotifications = async () => {
    try {
      const data = await apiRequest('/api/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await apiRequest('/api/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      // ignore
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (e) {
      // ignore
    }
  };

  const handlePermanentDelete = async (notif: NotificationItem) => {
    try {
      await apiRequest(`/api/messages/${notif.id}`, {
        method: 'DELETE',
      });
      toast.success('messages permanently deleted');
      setNotifToDelete(null);
      fetchNotifications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete message');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="btn-notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition focus:outline-none focus:ring-1 focus:ring-cyan-500"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-zinc-950 text-[10px] font-extrabold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl z-50 overflow-hidden text-zinc-200">
          <div className="p-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Live Alerts</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-zinc-700 opacity-50" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                return (
                  <div
                    key={n.id}
                    className={`p-3.5 hover:bg-zinc-800/60 transition flex items-start gap-3 justify-between ${
                      !n.isRead ? 'bg-cyan-950/20' : ''
                    }`}
                  >
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.jobId && onSelectJob) {
                          onSelectJob(n.jobId);
                          setIsOpen(false);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            !n.isRead ? 'bg-cyan-400 ring-2 ring-cyan-400/30' : 'bg-zinc-700'
                          }`}
                        />
                        <p className="text-xs font-semibold text-zinc-100 truncate">{n.title}</p>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-zinc-500">
                        <span>{formatDateTime(n.createdAt)}</span>
                        {n.jobId && <span className="font-mono text-cyan-400/80">{n.jobId}</span>}
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotifToDelete(n);
                        }}
                        className="p-1 rounded-lg bg-rose-500/15 hover:bg-rose-600 border border-rose-500/30 text-rose-400 hover:text-white transition shrink-0 mt-0.5"
                        title="Permanently delete"
                        aria-label="Permanently delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Delete Notification Modal */}
      {notifToDelete && (
        <PermanentDeleteModal
          isOpen={Boolean(notifToDelete)}
          onClose={() => setNotifToDelete(null)}
          onConfirm={() => handlePermanentDelete(notifToDelete)}
          itemType="message"
          itemName={notifToDelete.title}
          itemDetails={
            <div className="space-y-1.5">
              <div className="text-white font-semibold">{notifToDelete.title}</div>
              <div className="text-zinc-400 text-xs">{notifToDelete.message}</div>
              <div className="text-zinc-500 font-mono text-[10px]">{formatDateTime(notifToDelete.createdAt)}</div>
            </div>
          }
        />
      )}
    </div>
  );
};
