export interface AciusfyDesktopApi {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  onMaximizedChange: (cb: (maximized: boolean) => void) => () => void;
  platform: NodeJS.Platform;
  closeUpdateWindow?: () => void
}

declare global {
  interface Window {
    aciusfyDesktop?: AciusfyDesktopApi;
  }
}

export {};
