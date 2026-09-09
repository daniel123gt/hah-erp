/**
 * Señales de auth compartidas fuera de React.
 * `manualLogout` permite al SessionWatcher distinguir un cierre de sesión
 * iniciado por el usuario (no mostrar aviso de "sesión expirada") de una
 * expiración/refresh fallido (sí desloguear y avisar).
 */
export const authSignals = {
  manualLogout: false,
};
