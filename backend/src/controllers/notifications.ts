import { prisma } from '../lib/prisma';

export const getMyNotifications = async (req: any, res: any) => {
    try {
        const { page = '1', limit = '20', unreadOnly = 'false' } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Check if notification model exists first. If not, just return empty list.
        if (!(prisma as any).notification) {
            return res.json({
                notifications: [],
                unreadCount: 0,
                pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 }
            });
        }

        const where: any = {
            userId: req.user!.id
        };

        if (unreadOnly === 'true') {
            where.isRead = false;
        }

        const [notifications, total, unreadCount] = await Promise.all([
            (prisma as any).notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            (prisma as any).notification.count({ where }),
            (prisma as any).notification.count({
                where: {
                    userId: req.user!.id,
                    isRead: false
                }
            })
        ]);

        res.json({
            notifications,
            unreadCount,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
};

export const markNotificationAsRead = async (req: any, res: any) => {
    try {
        const { id } = req.params;

        if (!(prisma as any).notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        const notification = await (prisma as any).notification.findUnique({
            where: { id }
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.userId !== req.user!.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updated = await (prisma as any).notification.update({
            where: { id },
            data: { isRead: true }
        });

        res.json(updated);
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ message: 'Failed to mark notification as read' });
    }
};

export const markAllNotificationsAsRead = async (req: any, res: any) => {
    try {
        if ((prisma as any).notification) {
            await (prisma as any).notification.updateMany({
                where: {
                    userId: req.user!.id,
                    isRead: false
                },
                data: { isRead: true }
            });
        }

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ message: 'Failed to mark notifications as read' });
    }
};

export const deleteNotification = async (req: any, res: any) => {
    try {
        const { id } = req.params;

        if (!(prisma as any).notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        const notification = await (prisma as any).notification.findUnique({
            where: { id }
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.userId !== req.user!.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await (prisma as any).notification.delete({
            where: { id }
        });

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'Failed to delete notification' });
    }
};

export const getUnreadCount = async (req: any, res: any) => {
    try {
        let count = 0;
        if ((prisma as any).notification) {
            count = await (prisma as any).notification.count({
                where: {
                    userId: req.user!.id,
                    isRead: false
                }
            });
        }

        res.json({ count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ message: 'Failed to get unread count' });
    }
};
