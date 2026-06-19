const { Log } = require('../../logging-middleware/logger');
const store = require('../db/notificationStore');

const validTypes = ['placement', 'event', 'result'];

exports.getAllNotifications = (req, res) => {
    try {
        Log('backend', 'info', 'controller', 'getAllNotifications called');
        const { type, isRead } = req.query;
        const data = store.getAll({ type, isRead });
        res.json({ success: true, count: data.length, data });
    } catch (err) {
        Log('backend', 'error', 'controller', `getAllNotifications error: ${err.message}`);
        res.status(500).json({ success: false, message: 'failed to fetch notifications' });
    }
};

exports.getNotificationById = (req, res) => {
    try {
        Log('backend', 'info', 'controller', `getNotificationById id=${req.params.id}`);
        const notif = store.getById(req.params.id);
        if (!notif) {
            Log('backend', 'warn', 'controller', `notification not found id=${req.params.id}`);
            return res.status(404).json({ success: false, message: 'notification not found' });
        }
        res.json({ success: true, data: notif });
    } catch (err) {
        Log('backend', 'error', 'controller', `getNotificationById error: ${err.message}`);
        res.status(500).json({ success: false, message: 'failed to fetch notification' });
    }
};

exports.createNotification = (req, res) => {
    try {
        Log('backend', 'info', 'controller', 'createNotification called');
        const { type, title, message } = req.body;

        if (!type || !title || !message) {
            Log('backend', 'warn', 'controller', 'createNotification - missing required fields');
            return res.status(400).json({ success: false, message: 'type, title and message are required' });
        }
        if (!validTypes.includes(type)) {
            Log('backend', 'warn', 'controller', `createNotification - invalid type: ${type}`);
            return res.status(400).json({ success: false, message: `type must be one of: ${validTypes.join(', ')}` });
        }

        const notif = store.create({ type, title, message });
        store.broadcastToClients(notif);
        Log('backend', 'info', 'controller', `notification created and broadcasted id=${notif.id}`);
        res.status(201).json({ success: true, data: notif });
    } catch (err) {
        Log('backend', 'error', 'controller', `createNotification error: ${err.message}`);
        res.status(500).json({ success: false, message: 'failed to create notification' });
    }
};

exports.markAsRead = (req, res) => {
    try {
        Log('backend', 'info', 'controller', `markAsRead id=${req.params.id}`);
        const notif = store.markRead(req.params.id);
        if (!notif) {
            return res.status(404).json({ success: false, message: 'notification not found' });
        }
        res.json({ success: true, data: notif });
    } catch (err) {
        Log('backend', 'error', 'controller', `markAsRead error: ${err.message}`);
        res.status(500).json({ success: false, message: 'failed to update notification' });
    }
};

exports.markAllAsRead = (req, res) => {
    try {
        Log('backend', 'info', 'controller', 'markAllAsRead called');
        const data = store.markAllRead();
        res.json({ success: true, count: data.length, data });
    } catch (err) {
        Log('backend', 'error', 'controller', `markAllAsRead error: ${err.message}`);
        res.status(500).json({ success: false, message: 'failed to update notifications' });
    }
};

exports.deleteNotification = (req, res) => {
    try {
        Log('backend', 'info', 'controller', `deleteNotification id=${req.params.id}`);
        const deleted = store.remove(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'notification not found' });
        }
        res.json({ success: true, message: `notification ${req.params.id} deleted` });
    } catch (err) {
        Log('backend', 'error', 'controller', `deleteNotification error: ${err.message}`);
        res.status(500).json({ success: false, message: 'failed to delete notification' });
    }
};

exports.sseStream = (req, res) => {
    Log('backend', 'info', 'controller', 'SSE stream connection opened');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    store.addSSEClient(res);

    const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
        Log('backend', 'debug', 'controller', 'SSE heartbeat sent');
    }, 30000);

    req.on('close', () => {
        clearInterval(heartbeat);
        store.removeSSEClient(res);
        Log('backend', 'info', 'controller', 'SSE client disconnected');
    });
};