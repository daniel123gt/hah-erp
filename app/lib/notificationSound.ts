/**
 * Sonidos de notificación a partir de archivos MP3 en /public:
 * - "subtle": /notificacion.mp3  (notificaciones de creación)
 * - "alert":  /alerta.mp3        (avisos/recordatorios, más potente)
 *
 * Se reproducen a volumen máximo (1.0); el carácter/volumen real lo define el
 * propio archivo. Nota: los navegadores solo permiten audio tras una
 * interacción del usuario; si está bloqueado, play() falla en silencio.
 */

type SoundKind = "subtle" | "alert";

const SOUND_SRC: Record<SoundKind, string> = {
  subtle: "/notificacion.mp3",
  alert: "/alerta.mp3",
};

const cache: Partial<Record<SoundKind, HTMLAudioElement>> = {};

function getAudio(kind: SoundKind): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  let audio = cache[kind];
  if (!audio) {
    audio = new Audio(SOUND_SRC[kind]);
    audio.preload = "auto";
    audio.volume = 1.0; // máximo; el volumen real lo define el MP3
    cache[kind] = audio;
  }
  return audio;
}

export function playNotificationSound(kind: SoundKind) {
  const audio = getAudio(kind);
  if (!audio) return;
  try {
    audio.currentTime = 0; // reinicia para poder repetir el sonido
    void audio.play().catch(() => {
      // el audio puede estar bloqueado hasta que el usuario interactúe
    });
  } catch {
    // ignorar
  }
}
