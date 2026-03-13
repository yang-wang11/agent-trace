import { beforeEach, describe, expect, it, vi } from "vitest";
import { IPC } from "../../src/shared/ipc-channels";

const exposeInMainWorldMock = vi.fn();
const invokeMock = vi.fn();
const onMock = vi.fn();
const removeListenerMock = vi.fn();

vi.mock("electron", () => ({
  contextBridge: {
    exposeInMainWorld: exposeInMainWorldMock,
  },
  ipcRenderer: {
    invoke: invokeMock,
    on: onMock,
    removeListener: removeListenerMock,
  },
}));

describe("preload update api", () => {
  beforeEach(() => {
    exposeInMainWorldMock.mockReset();
    invokeMock.mockReset();
    onMock.mockReset();
    removeListenerMock.mockReset();
  });

  it("exposes update methods and subscriptions", async () => {
    const { electronAPI } = await import("../../src/preload/index");

    expect(exposeInMainWorldMock).toHaveBeenCalledWith(
      "electronAPI",
      electronAPI,
    );

    await electronAPI.getUpdateState();
    await electronAPI.checkForUpdates();
    await electronAPI.downloadUpdate();
    await electronAPI.quitAndInstallUpdate();

    expect(invokeMock).toHaveBeenNthCalledWith(1, IPC.GET_UPDATE_STATE);
    expect(invokeMock).toHaveBeenNthCalledWith(2, IPC.CHECK_FOR_UPDATES);
    expect(invokeMock).toHaveBeenNthCalledWith(3, IPC.DOWNLOAD_UPDATE);
    expect(invokeMock).toHaveBeenNthCalledWith(
      4,
      IPC.QUIT_AND_INSTALL_UPDATE,
    );

    const unsubscribe = electronAPI.onUpdateStateChanged(() => {});
    expect(onMock).toHaveBeenCalledWith(
      IPC.UPDATE_STATE_CHANGED,
      expect.any(Function),
    );

    unsubscribe();
    expect(removeListenerMock).toHaveBeenCalledWith(
      IPC.UPDATE_STATE_CHANGED,
      expect.any(Function),
    );
  });
});
