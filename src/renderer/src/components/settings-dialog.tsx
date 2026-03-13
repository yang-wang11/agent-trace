import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useAppStore } from "../stores/app-store";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const {
    settings,
    saveSettings,
    updateState,
    checkForUpdates,
    downloadUpdate,
    quitAndInstallUpdate,
  } = useAppStore();
  const [targetUrl, setTargetUrl] = useState(settings?.targetUrl ?? "");

  useEffect(() => {
    setTargetUrl(settings?.targetUrl ?? "");
  }, [settings?.targetUrl]);

  const handleSave = async () => {
    await saveSettings({ targetUrl: targetUrl.trim() });
    toast.success("Settings saved");
    onOpenChange(false);
  };

  const renderUpdateAction = () => {
    switch (updateState.status) {
      case "available":
        return (
          <Button onClick={() => void downloadUpdate()} className="w-full">
            Download update
          </Button>
        );
      case "downloaded":
        return (
          <Button onClick={() => void quitAndInstallUpdate()} className="w-full">
            Restart to install
          </Button>
        );
      case "downloading":
        return (
          <Button disabled className="w-full">
            Downloading {Math.round(updateState.downloadPercent ?? 0)}%
          </Button>
        );
      default:
        return (
          <Button onClick={() => void checkForUpdates()} className="w-full">
            Check for updates
          </Button>
        );
    }
  };

  const statusMessage = (() => {
    switch (updateState.status) {
      case "checking":
        return "Checking for updates...";
      case "available":
        return `Version ${updateState.availableVersion} is available to download.`;
      case "not-available":
        return "You are on the latest version.";
      case "downloading":
        return `Downloading version ${updateState.availableVersion}...`;
      case "downloaded":
        return `Version ${updateState.availableVersion} is ready to install.`;
      case "error":
        return updateState.message ?? "Update operation failed.";
      default:
        return updateState.message ?? "Automatic updates are ready.";
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-target-url">TARGET_URL</Label>
            <Input
              id="settings-target-url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://api.anthropic.com"
            />
          </div>
          <div className="space-y-3 rounded-lg border p-4">
            <div className="space-y-1">
              <div className="font-medium text-sm">Automatic updates</div>
              <div className="text-muted-foreground text-sm">
                {`Version ${updateState.currentVersion || "unknown"}`}
              </div>
              <p className="text-muted-foreground text-sm">{statusMessage}</p>
            </div>
            {renderUpdateAction()}
          </div>
          <Button onClick={handleSave} className="w-full">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
