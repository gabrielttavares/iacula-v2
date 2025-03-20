declare module '@tauri-apps/api/tauri' {
    export function invoke(cmd: string, args?: Record<string, unknown>): Promise<unknown>;
}

declare module '@tauri-apps/api/window' {
    export class Window {
        static getCurrent(): Promise<Window>;
        static getByLabel(label: string): Promise<Window | null>;
        static getAll(): Promise<Window[]>;
        listen(event: string, handler: (event: { payload: unknown }) => void): Promise<void>;
        emit(event: string, payload?: unknown): Promise<void>;
        show(): Promise<void>;
        hide(): Promise<void>;
        close(): Promise<void>;
        setFocus(): Promise<void>;
        setSkipTaskbar(skip: boolean): Promise<void>;
    }

    export class WebviewWindow extends Window {
        constructor(label: string, options: {
            url: string;
            width?: number;
            height?: number;
            x?: number;
            y?: number;
            decorations?: boolean;
            resizable?: boolean;
            alwaysOnTop?: boolean;
            transparent?: boolean;
            visible?: boolean;
            title?: string;
            center?: boolean;
        });
    }

    export function getAll(): Promise<Window[]>;
}

declare module '@tauri-apps/api/path' {
    export function appDataDir(): Promise<string>;
    export function join(...paths: string[]): Promise<string>;
}

declare module '@tauri-apps/api/notification' {
    export function isPermissionGranted(): Promise<boolean>;
    export function requestPermission(): Promise<boolean>;
    export function sendNotification(title: string, body?: string): Promise<void>;
}

declare module '@tauri-apps/api/app' {
    export const app: {
        isPackaged(): Promise<boolean>;
        exit(): Promise<void>;
    };
}

declare module '@tauri-apps/api/os' {
    export function platform(): Promise<string>;
} 