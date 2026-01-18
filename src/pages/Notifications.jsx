import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Notification, User } from '@/api/entities';
import { createPageUrl } from '@/utils';

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const user = await User.me();
            const data = await Notification.filter({ user_id: user.id }, '-created_at');
            setNotifications(data || []);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await Notification.update(notificationId, { is_read: true });
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.is_read);
            await Promise.all(
                unreadNotifications.map(n => Notification.update(n.id, { is_read: true }))
            );
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await Notification.delete(notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'payment_reminder':
                return 'payments';
            case 'budget_alert':
                return 'account_balance_wallet';
            case 'achievement':
                return 'emoji_events';
            case 'debt_update':
                return 'trending_down';
            case 'income_added':
                return 'attach_money';
            case 'system':
                return 'info';
            default:
                return 'notifications';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'payment_reminder':
                return 'text-orange-500 bg-orange-100 dark:bg-orange-500/20';
            case 'budget_alert':
                return 'text-red-500 bg-red-100 dark:bg-red-500/20';
            case 'achievement':
                return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-500/20';
            case 'debt_update':
                return 'text-blue-500 bg-blue-100 dark:bg-blue-500/20';
            case 'income_added':
                return 'text-green-500 bg-green-100 dark:bg-green-500/20';
            default:
                return 'text-gray-500 bg-gray-100 dark:bg-gray-500/20';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Zojuist';
        if (diffMins < 60) return `${diffMins} min geleden`;
        if (diffHours < 24) return `${diffHours} uur geleden`;
        if (diffDays < 7) return `${diffDays} dagen geleden`;
        return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.is_read;
        if (filter === 'read') return n.is_read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
            </div>
        );
    }

    return (
        <main className="flex-1 flex justify-center w-full px-4 py-8 bg-[#F8F8F8] dark:bg-[#0a0a0a] min-h-screen">
            <div className="w-full max-w-[800px] flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            to={createPageUrl('Dashboard')}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                        >
                            <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">arrow_back</span>
                        </Link>
                        <div>
                            <h1 className="text-[#1F2937] dark:text-white text-2xl font-extrabold tracking-tight">Notificaties</h1>
                            {unreadCount > 0 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">{unreadCount} ongelezen</p>
                            )}
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-sm font-medium text-[#3D6456] dark:text-konsensi-primary hover:underline"
                        >
                            Alles als gelezen markeren
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 bg-white dark:bg-[#1a1a1a] p-1 rounded-full w-fit">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            filter === 'all'
                                ? 'bg-[#b4ff7a] dark:bg-konsensi-primary text-[#3D6456] dark:text-black'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                        }`}
                    >
                        Alle ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            filter === 'unread'
                                ? 'bg-[#b4ff7a] dark:bg-konsensi-primary text-[#3D6456] dark:text-black'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                        }`}
                    >
                        Ongelezen ({unreadCount})
                    </button>
                    <button
                        onClick={() => setFilter('read')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            filter === 'read'
                                ? 'bg-[#b4ff7a] dark:bg-konsensi-primary text-[#3D6456] dark:text-black'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                        }`}
                    >
                        Gelezen ({notifications.length - unreadCount})
                    </button>
                </div>

                {/* Notifications List */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-card dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
                    {filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-4xl">notifications_off</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                {filter === 'unread' ? 'Geen ongelezen notificaties' :
                                 filter === 'read' ? 'Geen gelezen notificaties' :
                                 'Geen notificaties'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer relative ${
                                        !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''
                                    }`}
                                    onClick={() => navigate(`/NotificationDetail/${notification.id}`)}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Unread indicator */}
                                        {!notification.is_read && (
                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500"></div>
                                        )}

                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                                            <span className="material-symbols-outlined text-xl">
                                                {getNotificationIcon(notification.type)}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className={`font-medium text-[#1F2937] dark:text-white ${!notification.is_read ? 'font-bold' : ''}`}>
                                                        {notification.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                                        {formatDate(notification.created_at)}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                    {!notification.is_read && (
                                                        <button
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors"
                                                            title="Markeer als gelezen"
                                                        >
                                                            <span className="material-symbols-outlined text-gray-400 text-lg">done</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteNotification(notification.id)}
                                                        className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                        title="Verwijderen"
                                                    >
                                                        <span className="material-symbols-outlined text-gray-400 hover:text-red-500 text-lg">delete</span>
                                                    </button>
                                                    <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-lg ml-1">
                                                        chevron_right
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Settings Link */}
                <div className="text-center">
                    <Link
                        to={createPageUrl('NotificationSettings')}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#3D6456] dark:hover:text-konsensi-primary transition-colors"
                    >
                        Notificatie-instellingen beheren →
                    </Link>
                </div>
            </div>
        </main>
    );
}
