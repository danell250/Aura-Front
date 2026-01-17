type SoundKey = 'notification' | 'message';

class SoundService {
  private audios: Partial<Record<SoundKey, HTMLAudioElement>> = {};
  private initialized = false;

  private ensureSupport() {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      return false;
    }
    return true;
  }

  private ensureLoaded() {
    if (this.initialized) return;
    if (!this.ensureSupport()) return;
    this.audios.notification = new Audio('/sounds/positive-notification-alert-351299.mp3');
    this.audios.message = new Audio('/sounds/happy-message-ping-351298.mp3');
    this.initialized = true;
  }

  private play(key: SoundKey) {
    if (!this.ensureSupport()) return;
    this.ensureLoaded();
    const audio = this.audios[key];
    if (!audio) return;
    try {
      audio.currentTime = 0;
      const result = audio.play();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {});
      }
    } catch {
    }
  }

  playNotification() {
    this.play('notification');
  }

  playMessage() {
    this.play('message');
  }
}

export const soundService = new SoundService();
