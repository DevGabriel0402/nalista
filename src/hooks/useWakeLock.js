import { useEffect, useRef } from 'react';

export default function useWakeLock(enabled) {
  const wakeLockRef = useRef(null);

  useEffect(() => {
    let active = true;

    const requestWakeLock = async () => {
      if (!enabled || !('wakeLock' in navigator)) return;

      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch {
        wakeLockRef.current = null;
      }
    };

    const releaseWakeLock = async () => {
      if (!wakeLockRef.current) return;
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    };

    const handleVisibilityChange = () => {
      if (active && document.visibilityState === 'visible') requestWakeLock();
    };

    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [enabled]);
}
