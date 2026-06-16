/**
 * Sonidos de notificación generados con la Web Audio API (sin archivos).
 * - "subtle": un tono suave para notificaciones de creación.
 * - "alert":  patrón insistente y FUERTE para los avisos (recordatorios).
 *
 * Para que el aviso suene lo más alto posible SIN distorsionar, toda la salida
 * pasa por un DynamicsCompressor que actúa como limitador: corta los picos que
 * pasarían de 0 dBFS (el clipping/distorsión) y deja subir la amplitud al tope.
 *
 * Nota: los navegadores solo permiten audio tras una interacción del usuario.
 * Si el contexto está suspendido, se intenta reanudar; si falla, no suena.
 */

let ctx: AudioContext | null = null;
let limiter: DynamicsCompressorNode | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      // Limitador: permite subir el volumen al máximo sin clipping (distorsión).
      limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -3; // empieza a limitar justo antes del tope
      limiter.knee.value = 0; // rodilla dura = limitador
      limiter.ratio.value = 20; // ratio alto = limita fuerte
      limiter.attack.value = 0.001;
      limiter.release.value = 0.12;
      limiter.connect(ctx.destination);
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
  gain.connect(limiter ?? audio.destination);
  const t0 = audio.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

export function playNotificationSound(kind: "subtle" | "alert") {
  const audio = getCtx();
  if (!audio) return;
  try {
    if (kind === "subtle") {
      // Un solo tono suave y corto (la de creación queda discreta).
      beep(audio, 880, 0, 0.14, 0.06, "sine");
    } else {
      // Alerta: patrón insistente de 4 tonos, onda sierra (más presente) y
      // amplitud al tope. El limitador evita la distorsión.
      beep(audio, 880, 0.0, 0.2, 0.95, "sawtooth");
      beep(audio, 1175, 0.24, 0.2, 0.95, "sawtooth");
      beep(audio, 880, 0.48, 0.2, 0.95, "sawtooth");
      beep(audio, 1319, 0.72, 0.36, 1.0, "sawtooth");
    }
  } catch {
    // ignorar: el audio puede estar bloqueado hasta que el usuario interactúe
  }
}
