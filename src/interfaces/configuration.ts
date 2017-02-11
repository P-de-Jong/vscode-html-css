import * as vscode from 'vscode';

export interface IConfiguration extends vscode.WorkspaceConfiguration {
    isAngularProject?: boolean;

    globalStyles?: Array<string>;
}
