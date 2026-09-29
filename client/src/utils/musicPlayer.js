// You will need to place an audio file named 'bg-music.mp3' inside the client/public/ folder.
const audio = new Audio("/bg_music2.mp3");
audio.loop = true;
audio.volume = 0.85; // Soothing, low volume

export const musicPlayer = {
  toggle: () => {
    if (audio.paused) {
      audio.play().catch((err) => console.warn("Audio play blocked:", err));
    } else {
      audio.pause();
    }
    return !audio.paused;
  },
  playCalmingLowVolume: () => {
    audio.volume = 0.25; // Gentle, comforting low volume
    if (audio.paused) {
      audio.play().catch((err) => console.warn("Audio play blocked:", err));
    }
    return true;
  },
  setVolume: (vol) => {
    audio.volume = Math.max(0, Math.min(1, vol));
  },
  isPlaying: () => !audio.paused
};