const { Log } = require('../../logging-middleware/logger');

// using in-memory store for now
let notifications = [
    {
        id: '1',
        type: 'placement',
        title: 'Google On-Campus Drive',
        message: 'Google is visiting campus on July 5th. Register before June 30.',
        isRead: false,
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        type: 'event',
        title: 'Tech Fest 2025',
        message: 'Annual tech fest starts August 10th. Submit projects by August 1.',
        isRead: false,
        createdAt: new Date().toISOString()
    },
    {
        id: '3',
        type: 'result',
        title: 'Semester 4 Results Declared',
        message: 'Sem 4 results are out. Check the portal now.',
        isRead: true,
        createdAt: new Date().toISOString()
    }
];

let idCounter = 4;
let sseClients = [];

function getAll(filters) {
    Log('backend', 'debug', 'db', `getAll called with filters: ${JSON.stringify(filters)}`);
    let result = [...notifications];

    if (filters.type) {
        result = result.filter(n => n.type === filters.type.toLowerCase());
    }
    if (filters.isRead !== undefined) {
        result = result.filter(n => n.isRead === (filters.isRead === 'true'));
    }

    Log('backend', 'debug', 'db', `returning ${result.length} notifications`);
    return result;
}

function getById(id) {
    Log('backend', 'debug', 'db', `looking up notification id=${id}`);
    const notif = notifications.find(n => n.id === id);
    if (!notif) {
        Log('backend', 'warn', 'db', `notification not found id=${id}`);
    }
    return notif || null;
}

function create(data) {
    const newNotif = {
        id: String(idCounter++),
        type: data.type,
        title: data.title,
        message: data.message,
        isRead: false,
        createdAt: new Date().toISOString()
    };
    notifications.push(newNotif);
    Log('backend', 'info', 'db', `notification created id=${newNotif.id} type=${newNotif.type}`);
    return newNotif;
}

function markRead(id) {
    const notif = notifications.find(n => n.id === id);
    if (!notif) {
        Log('backend', 'warn', 'db', `markRead - not found id=${id}`);
        return null;
    }
    notif.isRead = true;
    Log('backend', 'info', 'db', `notification id=${id} marked as read`);
    return notif;
}

function markAllRead() {
    notifications.forEach(n => n.isRead = true);
    Log('backend', 'info', 'db', 'all notifications marked as read');
    return notifications;
}

function remove(id) {
    const idx = notifications.findIndex(n => n.id === id);
    if (idx === -1) {
        Log('backend', 'warn', 'db', `remove - not found id=${id}`);
        return false;
    }
    notifications.splice(idx, 1);
    Log('backend', 'info', 'db', `notification id=${id} deleted`);
    return true;
}

function addSSEClient(res) {
    sseClients.push(res);
    Log('backend', 'info', 'db', `SSE client added, total=${sseClients.length}`);
}

function removeSSEClient(res) {
    sseClients = sseClients.filter(c => c !== res);
    Log('backend', 'info', 'db', `SSE client removed, total=${sseClients.length}`);
}

function broadcastToClients(notification) {
    Log('backend', 'info', 'db', `broadcasting to ${sseClients.length} SSE clients`);
    sseClients.forEach(client => {
        client.write(`data: ${JSON.stringify(notification)}\n\n`);
    });
}

module.exports = { getAll, getById, create, markRead, markAllRead, remove, addSSEClient, removeSSEClient, broadcastToClients };