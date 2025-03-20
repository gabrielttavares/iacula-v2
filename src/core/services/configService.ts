import { readTextFile, writeTextFile, exists, createDir, BaseDirectory } from '@tauri-apps/api/fs';
import path from 'path';

export interface Config {
    autoStart: boolean;
    showInTaskbar: boolean;
    popupDuration: number;
    notificationInterval: number;
}

export class ConfigService {
    private configPath: string;
    private defaultConfig: Config = {
        autoStart: false,
        showInTaskbar: true,
        popupDuration: 10,
        notificationInterval: 20
    };

    constructor(configPath: string) {
        this.configPath = configPath;
    }

    async loadConfig(): Promise<Config> {
        try {
            // Check if config file exists
            const fileExists = await exists(this.configPath, { dir: BaseDirectory.AppConfig });
            if (!fileExists) {
                // Create directory if it doesn't exist
                const dir = path.dirname(this.configPath);
                await createDir(dir, { dir: BaseDirectory.AppConfig, recursive: true });
                // Create default config
                await this.saveConfig(this.defaultConfig);
                return this.defaultConfig;
            }

            // Read and parse config file
            const configData = await readTextFile(this.configPath, { dir: BaseDirectory.AppConfig });
            return JSON.parse(configData);
        } catch (error) {
            console.error('Error loading config:', error);
            return this.defaultConfig;
        }
    }

    async saveConfig(config: Config): Promise<void> {
        try {
            // Ensure directory exists
            const dir = path.dirname(this.configPath);
            await createDir(dir, { dir: BaseDirectory.AppConfig, recursive: true });

            // Write config file
            await writeTextFile(this.configPath, JSON.stringify(config, null, 2), { dir: BaseDirectory.AppConfig });
        } catch (error) {
            console.error('Error saving config:', error);
            throw error;
        }
    }

    async getConfig(): Promise<Config> {
        return await this.loadConfig();
    }
} 