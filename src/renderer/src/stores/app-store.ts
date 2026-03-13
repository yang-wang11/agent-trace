import { create } from "zustand";
import type { AppSettings } from "../../../shared/types";
import { getElectronAPI } from "../lib/electron-api";
import {
  createDefaultUpdateState,
  type UpdateState,
} from "../../../shared/update";

let initializePromise: Promise<void> | null = null;
let unsubscribeUpdateState: (() => void) | null = null;

interface AppState {
  settings: AppSettings | null;
  isListening: boolean;
  proxyAddress: string | null;
  initialized: boolean;
  updateState: UpdateState;

  initialize: () => Promise<void>;
  saveSettings: (input: { targetUrl: string }) => Promise<void>;
  toggleListening: () => Promise<void>;
  setUpdateState: (updateState: UpdateState) => void;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  quitAndInstallUpdate: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: null,
  isListening: false,
  proxyAddress: null,
  initialized: false,
  updateState: createDefaultUpdateState(),

  initialize: async () => {
    if (get().initialized) {
      return;
    }
    if (initializePromise) {
      return initializePromise;
    }
    const api = getElectronAPI();
    initializePromise = (async () => {
      const [settings, status, updateState] = await Promise.all([
        api.getSettings(),
        api.getProxyStatus(),
        api.getUpdateState(),
      ]);
      unsubscribeUpdateState?.();
      unsubscribeUpdateState = api.onUpdateStateChanged((nextState) => {
        set({ updateState: nextState });
      });
      set({
        settings,
        isListening: status.isRunning,
        initialized: true,
        updateState,
      });
    })();
    try {
      await initializePromise;
    } finally {
      initializePromise = null;
    }
  },

  saveSettings: async (input) => {
    const api = getElectronAPI();
    const settings = await api.saveSettings(input);
    set({ settings });
  },

  toggleListening: async () => {
    const api = getElectronAPI();
    const current = get().isListening;
    const result = await api.toggleListening(!current);
    set({
      isListening: result.isRunning,
      proxyAddress: result.address,
    });
  },

  setUpdateState: (updateState) => {
    set({ updateState });
  },

  checkForUpdates: async () => {
    const api = getElectronAPI();
    const updateState = await api.checkForUpdates();
    set({ updateState });
  },

  downloadUpdate: async () => {
    const api = getElectronAPI();
    const updateState = await api.downloadUpdate();
    set({ updateState });
  },

  quitAndInstallUpdate: async () => {
    const api = getElectronAPI();
    await api.quitAndInstallUpdate();
  },
}));
