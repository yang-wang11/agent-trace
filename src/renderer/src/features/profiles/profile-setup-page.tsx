import { useState } from "react";
import { Button } from "../../components/ui/button";
import { useProfileStore } from "../../stores/profile-store";
import type { ProviderId } from "../../../../shared/contracts";
import { DEFAULT_PROFILE_PORT_START } from "../../../../shared/defaults";
import { ProfileForm } from "./profile-form";
import { cn } from "../../lib/utils";

const PROVIDER_CARDS: Array<{
  id: ProviderId;
  label: string;
  emoji: string;
  protocol: string;
  defaultPort: number;
  defaultUrl: string;
}> = [
  {
    id: "anthropic",
    label: "Claude Code",
    emoji: "🟠",
    protocol: "Anthropic Messages API",
    defaultPort: DEFAULT_PROFILE_PORT_START,
    defaultUrl: "https://api.anthropic.com",
  },
  {
    id: "codex",
    label: "Codex",
    emoji: "🟢",
    protocol: "OpenAI Responses API",
    defaultPort: DEFAULT_PROFILE_PORT_START + 1,
    defaultUrl: "https://chatgpt.com/backend-api/codex",
  },
];

export function ProfileSetupPage() {
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>("anthropic");
  const [showManualForm, setShowManualForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const upsertProfile = useProfileStore((s) => s.upsertProfile);
  const startProfile = useProfileStore((s) => s.startProfile);
  const profiles = useProfileStore((s) => s.profiles);
  const statuses = useProfileStore((s) => s.statuses);

  const handleQuickStart = async () => {
    const card = PROVIDER_CARDS.find((c) => c.id === selectedProvider);
    if (!card) return;

    setIsCreating(true);
    try {
      const profile = {
        id: crypto.randomUUID(),
        name: `${card.label} Dev`,
        providerId: card.id,
        upstreamBaseUrl: card.defaultUrl,
        localPort: card.defaultPort,
        enabled: true,
        autoStart: true,
      };
      await upsertProfile(profile);
      await startProfile(profile.id);
    } finally {
      setIsCreating(false);
    }
  };

  if (showManualForm) {
    // Show the existing ProfileForm with a back button
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-md">
          <button
            className="text-xs text-muted-foreground hover:text-foreground mb-4"
            onClick={() => setShowManualForm(false)}
          >
            ← Back
          </button>
          <ProfileForm
            onSubmit={async (profile) => {
              await upsertProfile(profile);
              await startProfile(profile.id);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="text-center max-w-lg">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-3xl mb-6 shadow-lg shadow-violet-500/20">
          🔍
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome to Agent Trace</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Select your agent to start capturing traffic.
        </p>

        {/* Provider Cards */}
        <div className="flex gap-3 justify-center mb-8">
          {PROVIDER_CARDS.map((card) => (
            <button
              key={card.id}
              onClick={() => setSelectedProvider(card.id)}
              className={cn(
                "w-44 p-4 rounded-lg border text-left transition-all",
                selectedProvider === card.id
                  ? "border-violet-500 bg-violet-500/5 shadow-sm shadow-violet-500/10"
                  : "border-border hover:border-muted-foreground/30",
              )}
            >
              <div className="text-2xl mb-2">{card.emoji}</div>
              <div className="text-sm font-semibold">{card.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {card.protocol}
                <br />
                <code className="text-[10px]">:{card.defaultPort}</code>
              </div>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={handleQuickStart} disabled={isCreating}>
            {isCreating ? "Starting\u2026" : "Start Listening"}
          </Button>
          <button
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            onClick={() => setShowManualForm(true)}
          >
            Manual setup
          </button>
        </div>

        {/* Existing profiles (if any from previous use) */}
        {profiles.length > 0 && (
          <div className="mt-10 text-left max-w-sm mx-auto">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Existing Profiles
            </div>
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-xs py-1.5">
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    statuses[p.id]?.isRunning
                      ? "bg-emerald-500"
                      : "bg-muted-foreground/30",
                  )}
                />
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground ml-auto">:{p.localPort}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
