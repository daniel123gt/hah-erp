/**
 * Sonidos de notificación generados con la Web Audio API (sin archivos).
 * - "subtle": un tono suave para notificaciones de creación.
 * - "alert":  patrón de 3 tonos más fuerte para los avisos (recordatorios).
 *
 * Nota: los navegadores solo permiten audio tras una interacción del usuario.
 * Si el contexto está suspendido, se intenta reanudar; si falla, no suena
 * (no rompe nada). El sonido de creación dispara justo tras un clic, así que
 * siempre suena; el de aviso suena si el usuario ya interactuó con la página.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function beep(
  audio: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  peakGain: number,
  type: OscillatorType = "sine"
) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audio.destination);
  const t0 = audio.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

export function playNotificationSound(kind: "subtle" | "alert") {
  const audio = getCtx();
  if (!audio) return;
  try {
    if (kind === "subtle") {
      // Un solo tono suave y corto.
      beep(audio, 880, 0, 0.14, 0.05, "sine");
    } else {
      // Alerta: 3 tonos, más fuertes y con timbre más marcado.
      beep(audio, 784, 0.0, 0.18, 0.16, "triangle");
      beep(audio, 784, 0.22, 0.18, 0.16, "triangle");
      beep(audio, 1047, 0.44, 0.3, 0.18, "triangle");
    }
  } catch {
    // ignorar: el audio puede estar bloqueado hasta que el usuario interactúe
  }
}
