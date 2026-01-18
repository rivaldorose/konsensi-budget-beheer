import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Notification, User } from '@/api/entities';
import { createPageUrl } from '@/utils';

export default function NotificationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotification();
    }, [id]);

    const loadNotification = async () => {
        try {
            const user = await User.me();
            const notifications = await Notification.filter({ user_id: user.id });
            const found = notifications.find(n => n.id === id);

            if (found) {
                setNotification(found);
                // Mark as read if not already
                if (!found.is_read) {
                    await Notification.update(found.id, { is_read: true });
                    setNotification(prev => ({ ...prev, is_read: true }));
                }
            }
        } catch (error) {
            console.error('Error loading notification:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteNotification = async () => {
        try {
            await Notification.delete(notification.id);
            navigate('/Notifications');
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

    const getTypeLabel = (type) => {
        switch (type) {
            case 'payment_reminder':
                return 'Betalingsherinnering';
            case 'budget_alert':
                return 'Budget Alert';
            case 'achievement':
                return 'Prestatie';
            case 'debt_update':
                return 'Schuld Update';
            case 'income_added':
                return 'Inkomen';
            case 'system':
                return 'Systeem';
            default:
                return 'Notificatie';
        }
    };

    const formatFullDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('nl-NL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
            </div>
        );
    }

    if (!notification) {
        return (
            <main className="flex-1 flex justify-center w-full px-4 py-8 bg-[#F8F8F8] dark:bg-[#0a0a0a] min-h-screen">
                <div className="w-full max-w-[600px] flex flex-col items-center justify-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-4xl">search_off</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Notificatie niet gevonden</p>
                    <Link
                        to="/Notifications"
                        className="text-[#3D6456] dark:text-konsensi-primary hover:underline"
                    >
                        Terug naar notificaties
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 flex justify-center w-full px-4 py-8 bg-[#F8F8F8] dark:bg-[#0a0a0a] min-h-screen">
            <div className="w-full max-w-[600px] flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link
                        to="/Notifications"
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                    >
                        <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">arrow_back</span>
                    </Link>
                    <h1 className="text-[#1F2937] dark:text-white text-xl font-extrabold tracking-tight">
                        Notificatie Details
                    </h1>
                </div>

                {/* Notification Card */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-card dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
                    {/* Type Badge & Icon */}
                    <div className="p-6 border-b border-gray-100 dark:border-[#2a2a2a]">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                                <span className="material-symbols-outlined text-2xl">
                                    {getNotificationIcon(notification.type)}
                                </span>
                            </div>
                            <div>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getNotificationColor(notification.type)}`}>
                                    {getTypeLabel(notification.type)}
                                </span>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {formatFullDate(notification.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Title & Message */}
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                            {notification.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {notification.message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="p-6 bg-gray-50 dark:bg-[#0f0f0f] border-t border-gray-100 dark:border-[#2a2a2a]">
                        <div className="flex flex-wrap gap-3">
                            {notification.type === 'achievement' && (
                                <Link
                                    to={createPageUrl('GamificationSettings')}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#b4ff7a] dark:bg-konsensi-primary text-[#3D6456] dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity"
                                >
                                    <span className="material-symbols-outlined text-lg">emoji_events</span>
                                    Bekijk Prestaties
                                </Link>
                            )}
                            {notification.type === 'payment_reminder' && (
                                <Link
                                    to={createPageUrl('Debts')}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#b4ff7a] dark:bg-konsensi-primary text-[#3D6456] dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity"
                                >
                                    <span className="material-symbols-outlined text-lg">payments</span>
                                    Bekijk Schulden
                                </Link>
                            )}
                            {notification.type === 'budget_alert' && (
                                <Link
                                    to={createPageUrl('BudgetPlan')}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#b4ff7a] dark:bg-konsensi-primary text-[#3D6456] dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity"
                                >
                                    <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                                    Bekijk Budget
                                </Link>
                            )}
                            {notification.type === 'income_added' && (
                                <Link
                                    to={createPageUrl('Income')}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#b4ff7a] dark:bg-konsensi-primary text-[#3D6456] dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity"
                                >
                                    <span className="material-symbols-outlined text-lg">attach_money</span>
                                    Bekijk Inkomen
                                </Link>
                            )}
                            {notification.type === 'debt_update' && (
                                <Link
                                    to={createPageUrl('Debts')}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#b4ff7a] dark:bg-konsensi-primary text-[#3D6456] dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity"
                                >
                                    <span className="material-symbols-outlined text-lg">trending_down</span>
                                    Bekijk Schulden
                                </Link>
                            )}
                            <button
                                onClick={deleteNotification}
                                className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg font-medium transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                                Verwijderen
                            </button>
                        </div>
                    </div>
                </div>

                {/* Back Link */}
                <div className="text-center">
                    <Link
                        to="/Notifications"
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#3D6456] dark:hover:text-konsensi-primary transition-colors"
                    >
                        ← Terug naar alle notificaties
                    </Link>
                </div>
            </div>
        </main>
    );
}
