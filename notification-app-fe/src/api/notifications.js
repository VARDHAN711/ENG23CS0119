import { Log } from '../logger';

const BASE_URL = 'http://localhost:3000/api';

export async function fetchNotifications(filter, page) {
    try {
        Log('frontend', 'info', 'api', `fetchNotifications called filter=${filter} page=${page}`);

        const params = new URLSearchParams();
        if (filter && filter !== 'All') params.append('type', filter.toLowerCase());
        if (page) params.append('page', page);

        const res = await fetch(`${BASE_URL}/notifications?${params.toString()}`);

        if (!res.ok) {
            Log('frontend', 'error', 'api', `fetchNotifications failed with status ${res.status}`);
            throw new Error(`server returned ${res.status}`);
        }

        const data = await res.json();
        Log('frontend', 'info', 'api', `fetchNotifications success, got ${data.count} notifications`);
        return data;
    } catch (err) {
        Log('frontend', 'error', 'api', `fetchNotifications exception: ${err.message}`);
        throw err;
    }
}

export async function markNotificationRead(id) {
    try {
        Log('frontend', 'info', 'api', `markNotificationRead called id=${id}`);
        const res = await fetch(`${BASE_URL}/notifications/${id}/read`, { method: 'PATCH' });
        if (!res.ok) throw new Error(`server returned ${res.status}`);
        Log('frontend', 'info', 'api', `markNotificationRead success id=${id}`);
        return await res.json();
    } catch (err) {
        Log('frontend', 'error', 'api', `markNotificationRead failed: ${err.message}`);
        throw err;
    }
}

export async function markAllRead() {
    try {
        Log('frontend', 'info', 'api', 'markAllRead called');
        const res = await fetch(`${BASE_URL}/notifications/read-all`, { method: 'PATCH' });
        if (!res.ok) throw new Error(`server returned ${res.status}`);
        Log('frontend', 'info', 'api', 'markAllRead success');
        return await res.json();
    } catch (err) {
        Log('frontend', 'error', 'api', `markAllRead failed: ${err.message}`);
        throw err;
    }
}