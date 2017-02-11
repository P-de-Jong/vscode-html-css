import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { IConfiguration } from '../interfaces';

export class ConfigurationManager {
    private configuration: IConfiguration;


    constructor(private context: vscode.ExtensionContext) {
        this.getConfiguration();
    }


    public getConfiguration(): IConfiguration {
        if (this.configuration) {
            return this.configuration;
        }

        this.findOptionsJson();
        this.configuration = <IConfiguration>vscode.workspace.getConfiguration('htmlScss');
        return this.configuration;
    }

    public setConfigChangeListener(callback: () => void): void {
        let onConfigChange = vscode.workspace.onDidChangeConfiguration(() => {
            this.configuration = <IConfiguration>vscode.workspace.getConfiguration('htmlScss');
            callback();
        });

        this.context.subscriptions.push(onConfigChange);
    }


    private findOptionsJson(): void {
        let optionsJson = path.resolve(vscode.workspace.rootPath, 'scss-options.json');
        fs.readFile(optionsJson, 'utf8', (err: any, data: string) => {
            if (!err) {
                let messageItem: vscode.MessageItem = {
                    title: 'Open Settings',
                    isCloseAffordance: true
                };
                vscode.window.showInformationMessage('The scss-options.json file is now deprecated. Please use the new workspace settings :)', messageItem).then(btn => {
                    if (!btn) {
                        return;
                    }

                    vscode.commands.executeCommand('workbench.action.openWorkspaceSettings');
                });
            }
        });
    }
}
