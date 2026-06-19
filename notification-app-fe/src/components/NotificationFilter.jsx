import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Log } from '../logger';

const filters = ['All', 'Placement', 'Result', 'Event'];

export function NotificationFilter({ value, onChange }) {
    const handleChange = (e, newValue) => {
        if (newValue !== null) {
            Log('frontend', 'info', 'component', `filter changed to ${newValue}`);
            onChange(newValue);
        }
    };

    return (
        <ToggleButtonGroup
            value={value}
            exclusive
            onChange={handleChange}
            size="small"
            sx={{ flexWrap: 'wrap', gap: 0.5 }}
        >
            {filters.map((type) => (
                <ToggleButton key={type} value={type} sx={{ textTransform: 'none', px: 2 }}>
                    {type}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
}