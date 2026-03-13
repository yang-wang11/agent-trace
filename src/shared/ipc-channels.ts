export const IPC = {
  GET_SETTINGS: "app:get-settings",
  SAVE_SETTINGS: "app:save-settings",
  TOGGLE_LISTENING: "app:toggle-listening",
  GET_PROXY_STATUS: "app:get-proxy-status",
  LIST_SESSIONS: "app:list-sessions",
  GET_SESSION_REQUESTS: "app:get-session-requests",
  GET_REQUEST_DETAIL: "app:get-request-detail",
  CLEAR_DATA: "app:clear-data",
  SEARCH: "app:search",
  GET_UPDATE_STATE: "app:get-update-state",
  CHECK_FOR_UPDATES: "app:check-for-updates",
  DOWNLOAD_UPDATE: "app:download-update",
  QUIT_AND_INSTALL_UPDATE: "app:quit-and-install-update",
  // main → renderer push events
  CAPTURE_UPDATED: "proxy:capture-updated",
  PROXY_ERROR: "proxy:error",
  UPDATE_STATE_CHANGED: "app:update-state-changed",
} as const;
