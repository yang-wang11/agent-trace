import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ConnectionProfile } from "../../src/shared/contracts";
import { ProfileSetupPage } from "../../src/renderer/src/features/profiles/profile-setup-page";
import { useProfileStore } from "../../src/renderer/src/stores/profile-store";

let storedProfiles: ConnectionProfile[] = [];

const mockGetProfiles = vi.fn(async () => storedProfiles);
const mockSaveProfiles = vi.fn(async (profiles: ConnectionProfile[]) => {
  storedProfiles = profiles;
  return profiles;
});
const mockGetProfileStatuses = vi.fn(async () => ({
  "anthropic-dev": { isRunning: true, port: 8888 },
}));

vi.mock("../../src/renderer/src/lib/electron-api", () => ({
  getElectronAPI: () => ({
    getProfiles: mockGetProfiles,
    saveProfiles: mockSaveProfiles,
    getProfileStatuses: mockGetProfileStatuses,
    startProfile: vi.fn(async () => {}),
    stopProfile: vi.fn(async () => {}),
  }),
}));

describe("ProfileSetupPage", () => {
  beforeEach(() => {
    storedProfiles = [
      {
        id: "anthropic-dev",
        name: "anthropic-dev",
        providerId: "anthropic",
        upstreamBaseUrl: "https://api.anthropic.com",
        localPort: 8888,
        enabled: true,
        autoStart: false,
      },
    ];

    mockGetProfiles.mockClear();
    mockSaveProfiles.mockClear();
    mockGetProfileStatuses.mockClear();

    useProfileStore.setState({
      profiles: storedProfiles,
      statuses: { "anthropic-dev": { isRunning: true, port: 8888 } },
      initialized: true,
    });
  });

  it("shows existing profiles and renders the provider cards", async () => {
    render(<ProfileSetupPage />);

    expect(screen.getByText("Welcome to Agent Trace")).toBeInTheDocument();
    expect(screen.getByText("Claude Code")).toBeInTheDocument();
    expect(screen.getByText("Codex")).toBeInTheDocument();

    expect(await screen.findByText("anthropic-dev")).toBeInTheDocument();
  });

  it("lets the user add a new profile via manual setup", async () => {
    render(<ProfileSetupPage />);

    await screen.findByText("anthropic-dev");

    // Click the "Manual setup" link to reveal the form
    fireEvent.click(screen.getByText(/manual setup/i));

    fireEvent.change(screen.getByLabelText(/profile name/i), {
      target: { value: "codex-qa" },
    });
    fireEvent.change(screen.getByLabelText(/provider/i), {
      target: { value: "codex" },
    });
    fireEvent.change(screen.getByLabelText(/upstream base url/i), {
      target: { value: "https://chatgpt.com/backend-api/codex" },
    });
    fireEvent.change(screen.getByLabelText(/local port/i), {
      target: { value: "8899" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() => {
      expect(mockSaveProfiles).toHaveBeenCalledTimes(1);
    });
  });
});
