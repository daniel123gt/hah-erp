import { useState, useEffect, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { RefreshCw } from "lucide-react";

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos
const VERSION_URL = "/version.json";

export function VersionUpdateBanner() {
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const currentVersion = typeof import.meta !== "undefined" && import.meta.env?.VITE_APP_VERSION;

  const checkVersion = useCallback(async () => {
    if (import.meta.env.DEV || !currentVersion) return;
    try {
      const res = await fetch(`${VERSION_URL}?_=${Date.now()}`, {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });
      if (!res.ok) return;
      const data = await res.json();
      const deployedVersion = data?.version;
      if (deployedVersion && deployedVersion !== currentVersion) {
        setNewVersionAvailable(true);
      }
    } catch {
      // Ignorar errores de red
    }
  }, [currentVersion]);

  useEffect(() => {
    checkVersion();
    const id = setInterval(checkVersion, VERSION_CHECK_INTERVAL);
    const onFocus = () => checkVersion();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [checkVersion]);

  if (!newVersionAvailable) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-center gap-4 bg-primary-blue text-white px-4 py-3 shadow-lg"
      role="alert"
    >
      <span className="text-sm font-medium">
        Hay una nueva versión disponible. Recarga la página para actualizar.
      </span>
      <Button
        size="sm"
        variant="secondary"
        className="bg-white text-primary-blue hover:bg-gray-100 shrink-0"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="w-4 h-4 mr-1" />
        Recargar
      </Button>
    </div>
  );
}
