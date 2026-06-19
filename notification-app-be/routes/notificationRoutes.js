const express = require('express');
const router = express.Router();
const { Log } = require('../../logging-middleware/logger');
const controller = require('../controllers/notificationController');

Log('backend', 'debug', 'route', 'notification routes registered');

// SSE route must be before /:id otherwise express matches it as an id
router.get('/notifications/stream', controller.sseStream);
router.get('/notifications', controller.getAllNotifications);
router.get('/notifications/:id', controller.getNotificationById);
router.post('/notifications', controller.createNotification);
router.patch('/notifications/read-all', controller.markAllAsRead);
router.patch('/notifications/:id/read', controller.markAsRead);
router.delete('/notifications/:id', controller.deleteNotification);

module.exports = router;