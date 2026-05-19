import { useEffect, useCallback, useRef, useState } from "react";
import { AlertTriangle, LogOut } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { logout } from "~/services/authService";
import { useAuthStore } from "~/store/authStore";

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos
const VERSION_URL = "/version.json";

export function VersionUpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const modalShownRef = useRef(false);
  const logoutUser = useAuthStore((s) => s.logout);

  const checkVersion = useCallback(async () => {
    if (import.meta.env.DEV) return;
    const currentVersion =
      (typeof import.meta !== "undefined" && (import.meta.env?.VITE_APP_VERSION as string)) || "";
    try {
      const res = await fetch(`${VERSION_URL}?_=${Date.now()}`, {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });
      if (!res.ok) return;
      const data = await res.json();
      const deployedVersion = data?.version;
      if (
        deployedVersion &&
        currentVersion &&
        String(deployedVersion).trim() !== String(currentVersion).trim()
      ) {
        if (!modalShownRef.current) {
          modalShownRef.current = true;
          setUpdateAvailable(true);
        }
      }
    } catch {
      // Ignorar errores de red
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(checkVersion, 2000);
    const id = setInterval(checkVersion, VERSION_CHECK_INTERVAL);
    const onFocus = () => checkVersion();
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [checkVersion]);

  const handleAcceptAndLogout = async () => {
    try {
      await logout();
    } catch {
      // Continuar aunque falle el signOut remoto
    }
    logoutUser();
    window.location.replace(`/login?app_updated=${Date.now()}`);
  };

  return (
    <Dialog open={updateAvailable} onOpenChange={() => {}}>
      <DialogPortal>
        <DialogOverlay className="z-[9998] bg-black/85 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className={cn(
            "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "fixed top-[50%] left-[50%] z-[9999] grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-0 overflow-hidden rounded-xl border-2 border-amber-500 p-0 shadow-2xl duration-200 sm:max-w-lg"
          )}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
        <div className="bg-amber-500 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/20 p-2">
              <AlertTriangle className="h-7 w-7" aria-hidden />
            </div>
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-xl font-bold text-white">
                Nueva actualización disponible
              </DialogTitle>
              <p className="text-sm font-medium text-amber-50">
                Debes reiniciar la aplicación para continuar
              </p>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <DialogDescription asChild>
            <div className="space-y-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">
                Se publicó una nueva versión del sistema. Para ver los cambios y evitar errores:
              </p>
              <ol className="list-decimal space-y-2 pl-5 font-medium text-gray-800">
                <li>Cierra sesión (usa el botón de abajo).</li>
                <li>Cierra por completo esta pestaña o ventana del navegador.</li>
                <li>Vuelve a abrir el ERP e inicia sesión de nuevo.</li>
              </ol>
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                No basta con recargar la página: debes cerrar la ventana y abrirla otra vez.
              </p>
            </div>
          </DialogDescription>
        </div>

        <DialogFooter className="border-t bg-gray-50 px-6 py-4 sm:justify-center">
          <Button
            type="button"
            size="lg"
            className="w-full bg-amber-600 text-base font-semibold hover:bg-amber-700 sm:w-auto"
            onClick={handleAcceptAndLogout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Cerrar sesión y salir
          </Button>
        </DialogFooter>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
