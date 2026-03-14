import { useState } from "react";
import { Check, Copy, Settings } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useProfileStore } from "../stores/profile-store";
import { useSessionStore } from "../stores/session-store";

interface StatusBarProps {
  onSettingsClick: () => void;
}

export function StatusBar({ onSettingsClick }: StatusBarProps) {
  const profiles = useProfileStore((state) => state.profiles);
  const statuses = useProfileStore((state) => state.statuses);
  const sessions = useSessionStore((state) => state.sessions);
  const [copied, setCopied] = useState(false);

  const runningProfiles = profiles.filter(
    (profile) => statuses[profile.id]?.isRunning,
  );
  const primaryAddress = runningProfiles[0]
    ? `127.0.0.1:${statuses[runningProfiles[0].id]?.port ?? runningProfiles[0].localPort}`
    : null;

  const handleCopy = () => {
    if (!primaryAddress) return;
    navigator.clipboard.writeText(primaryAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="drag-region flex h-12 items-center justify-between border-b px-4">
      <span className="pl-16 text-sm font-medium">Agent Trace</span>

      <div className="flex items-center gap-3">
        {profiles.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {profiles.length} profile{profiles.length === 1 ? "" : "s"}
          </Badge>
        )}
        {runningProfiles.length > 0 && primaryAddress && (
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="font-mono text-xs">
              {primaryAddress}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopy}
              title="Copy proxy address"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        )}
        <span className="text-xs text-muted-foreground">{sessions.length} sessions</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onSettingsClick}
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Badge variant="outline" className="text-xs text-muted-foreground">
          ⌘K
        </Badge>
      </div>
    </div>
  );
}
