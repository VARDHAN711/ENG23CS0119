import { useState, useEffect } from 'react';
import { fetchNotifications } from '../api/notifications';
import { Log } from '../logger';

export function useNotifications(filter, page) {
  const [notifications, setNotifications] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        Log('frontend', 'info', 'hook', `loading notifications filter=${filter} page=${page}`);

        const data = await fetchNotifications(filter, page);
        setNotifications(data.data ?? []);
        // backend doesnt paginate yet so defaulting to 1
        setTotalPages(data.totalPages ?? 1);

        Log('frontend', 'info', 'hook', `notifications loaded count=${data.count}`);
      } catch (err) {
        Log('frontend', 'error', 'hook', `failed to load notifications: ${err.message}`);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filter, page]); // only re-run when filter or page changes

  return { notifications, totalPages, loading, error };
}