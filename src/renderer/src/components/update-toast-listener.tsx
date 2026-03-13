import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAppStore } from "../stores/app-store";

export function UpdateToastListener() {
  const { updateState, downloadUpdate, quitAndInstallUpdate } = useAppStore();
  const lastSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    const signature = [
      updateState.status,
      updateState.availableVersion,
      updateState.message,
      updateState.downloadPercent,
    ].join(":");

    if (signature === lastSignatureRef.current) {
      return;
    }
    lastSignatureRef.current = signature;

    if (updateState.status === "available" && updateState.availableVersion) {
      toast.info(`Version ${updateState.availableVersion} is ready to download.`, {
        action: {
          label: "Download",
          onClick: () => void downloadUpdate(),
        },
      });
      return;
    }

    if (updateState.status === "downloaded" && updateState.availableVersion) {
      toast.success(`Version ${updateState.availableVersion} is ready to install.`, {
        action: {
          label: "Install",
          onClick: () => void quitAndInstallUpdate(),
        },
      });
      return;
    }

    if (updateState.status === "error" && updateState.message) {
      toast.error(updateState.message);
    }
  }, [downloadUpdate, quitAndInstallUpdate, updateState]);

  return null;
}
