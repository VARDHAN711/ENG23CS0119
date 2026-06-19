import { useState } from 'react';
import {
    Alert, Badge, Box, CircularProgress,
    Divider, Pagination, Stack, Typography
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Log } from '../logger';
import { NotificationCard } from '../components/NotificationCard';
import { NotificationFilter } from '../components/NotificationFilter';
import { useNotifications } from '../hooks/useNotifications';

export function NotificationsPage() {
    const [filter, setFilter] = useState('All');
    const [page, setPage] = useState(1);

    const { notifications, totalPages, loading, error } = useNotifications(filter, page);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleFilterChange = (newFilter) => {
        Log('frontend', 'info', 'page', `filter changed to ${newFilter}, resetting to page 1`);
        setFilter(newFilter);
        setPage(1);
    };

    const handlePageChange = (_, newPage) => {
        Log('frontend', 'info', 'page', `page changed to ${newPage}`);
        setPage(newPage);
    };

    return (
        <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, py: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                <Badge badgeContent={unreadCount} color="primary" max={99}>
                    <NotificationsIcon sx={{ fontSize: 28 }} />
                </Badge>
                <Typography variant="h5" fontWeight={700}>
                    Notifications
                </Typography>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ mb: 3 }}>
                <NotificationFilter value={filter} onChange={handleFilterChange} />
            </Box>

            {loading && (
                <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && error && (
                <Alert severity="error">Failed to load notifications: {error}</Alert>
            )}

            {!loading && !error && notifications.length === 0 && (
                <Alert severity="info">No notifications found</Alert>
            )}

            {!loading && !error && notifications.length > 0 && (
                <Stack spacing={1.5}>
                    {notifications.map((n) => (
                        <NotificationCard key={n.id} notification={n} />
                    ))}
                </Stack>
            )}

            {!loading && totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={4}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        shape="rounded"
                    />
                </Box>
            )}
        </Box>
    );
}