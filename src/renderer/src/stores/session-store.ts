import { create } from "zustand";
import type { SessionListItemVM } from "../../../shared/contracts";
import { getElectronAPI } from "../lib/electron-api";
import { useTraceStore } from "./trace-store";

interface SessionState {
  sessions: SessionListItemVM[];
  selectedSessionId: string | null;
  searchQuery: string;
  providerFilter: string | null;

  loadSessions: () => Promise<void>;
  selectSession: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setProviderFilter: (filter: string | null) => void;
  clearHistory: () => Promise<void>;
  upsertSession: (session: SessionListItemVM) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  selectedSessionId: null,
  searchQuery: "",
  providerFilter: null,

  loadSessions: async () => {
    const api = getElectronAPI();
    const sessions = await api.listSessions();
    set({ sessions });
  },

  selectSession: (id) => {
    set({ selectedSessionId: id });
    if (!id) {
      useTraceStore.getState().clear();
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setProviderFilter: (filter) => set({ providerFilter: filter }),

  clearHistory: async () => {
    const api = getElectronAPI();
    await api.clearHistory();
    useTraceStore.getState().clear();
    set({ sessions: [], selectedSessionId: null });
  },

  upsertSession: (session) =>
    set((state) => ({
      sessions: [
        session,
        ...state.sessions.filter((s) => s.sessionId !== session.sessionId),
      ],
    })),
  reset: () => {
    useTraceStore.getState().clear();
    set({ sessions: [], selectedSessionId: null });
  },
}));
