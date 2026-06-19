import { Box, Chip, Paper, Typography } from '@mui/material';
import { Log } from '../logger';

const typeColors = {
    placement: 'primary',
    event: 'success',
    result: 'warning'
};

export function NotificationCard({ notification }) {
    Log('frontend', 'debug', 'component', `rendering NotificationCard id=${notification.id}`);

    return (
        <Paper
            elevation={notification.isRead ? 0 : 2}
            sx={{
                p: 2,
                border: '1px solid',
                borderColor: notification.isRead ? 'grey.200' : 'primary.light',
                borderRadius: 2,
                opacity: notification.isRead ? 0.75 : 1
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography fontWeight={notification.isRead ? 400 : 700} fontSize={15}>
                    {notification.title}
                </Typography>
                <Chip
                    label={notification.type}
                    color={typeColors[notification.type] ?? 'default'}
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                />
            </Box>
            <Typography variant="body2" color="text.secondary">
                {notification.message}
            </Typography>
            <Typography variant="caption" color="text.disabled" mt={1} display="block">
                {new Date(notification.createdAt).toLocaleString()}
            </Typography>
        </Paper>
    );
}