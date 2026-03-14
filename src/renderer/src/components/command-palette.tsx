import { useEffect, useMemo, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { useSessionStore } from "../stores/session-store";
import { useProfileStore } from "../stores/profile-store";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const sessions = useSessionStore((state) => state.sessions);
  const selectSession = useSessionStore((state) => state.selectSession);
  const clearHistory = useSessionStore((state) => state.clearHistory);
  const profiles = useProfileStore((state) => state.profiles);
  const statuses = useProfileStore((state) => state.statuses);
  const startProfile = useProfileStore((state) => state.startProfile);
  const stopProfile = useProfileStore((state) => state.stopProfile);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const matchingSessions = useMemo(() => {
    if (!normalizedQuery) {
      return sessions.slice(0, 8);
    }
    return sessions.filter((session) =>
      [session.title, session.providerLabel, session.model]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery)),
    );
  }, [normalizedQuery, sessions]);

  const matchingProfiles = useMemo(() => {
    if (!normalizedQuery) {
      return profiles;
    }
    return profiles.filter((profile) =>
      [profile.name, profile.providerId, profile.upstreamBaseUrl]
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [normalizedQuery, profiles]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search sessions, profiles, or actions..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {matchingSessions.length > 0 && (
          <CommandGroup heading="Sessions">
            {matchingSessions.map((session) => (
              <CommandItem
                key={session.sessionId}
                onSelect={() => {
                  selectSession(session.sessionId);
                  setOpen(false);
                }}
              >
                <span className="truncate">{session.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {session.providerLabel}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {matchingProfiles.length > 0 && (
          <CommandGroup heading="Profiles">
            {matchingProfiles.map((profile) => {
              const isRunning = statuses[profile.id]?.isRunning ?? false;
              return (
                <CommandItem
                  key={profile.id}
                  onSelect={() => {
                    void (isRunning
                      ? stopProfile(profile.id)
                      : startProfile(profile.id));
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{profile.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {isRunning ? "Stop" : "Start"}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              void clearHistory();
              setOpen(false);
            }}
          >
            Clear history
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
