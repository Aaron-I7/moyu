import { ref } from 'vue';

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useVersionCheck() {
  const currentVersion = ref<number | null>(null);
  const hasNewVersion = ref(false);
  let timer: ReturnType<typeof setInterval> | null = null;

  const checkVersion = async () => {
    // Skip in development if needed, or keep it to test
    if (import.meta.env.DEV) return;

    try {
      const response = await fetch('/version.json?t=' + Date.now());
      if (!response.ok) return;
      
      const data = await response.json();
      if (currentVersion.value === null) {
        currentVersion.value = data.version;
      } else if (currentVersion.value !== data.version) {
        hasNewVersion.value = true;
      }
    } catch (error) {
      console.error('Failed to check version:', error);
    }
  };

  const startChecking = () => {
    checkVersion();
    timer = setInterval(checkVersion, CHECK_INTERVAL);
    
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    });
  };

  const stopChecking = () => {
    if (timer) clearInterval(timer);
  };
  
  const refresh = () => {
    window.location.reload();
  };

  return {
    hasNewVersion,
    startChecking,
    stopChecking,
    refresh
  };
}
