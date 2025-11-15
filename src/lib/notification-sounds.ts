export const playNotificationSound = (type: 'success' | 'warning' | 'info' = 'info') => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  const frequencies = {
    success: [523.25, 659.25, 783.99],
    warning: [440, 493.88],
    info: [523.25, 659.25]
  };

  const freqs = frequencies[type];
  const duration = 0.1;

  freqs.forEach((freq, index) => {
    setTimeout(() => {
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      if (index === 0) {
        oscillator.start(audioContext.currentTime);
      }
      
      if (index === freqs.length - 1) {
        oscillator.stop(audioContext.currentTime + duration);
      }
    }, index * duration * 1000);
  });
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }
  return null;
};
