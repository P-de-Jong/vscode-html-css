'use strict';

// (c) 2016 Ecmel Ercan
// (c) 2017 Pim de Jong

import * as vscode from 'vscode';
import { ClassProvider, DefinitionProvider } from './providers';
import { ConfigurationManager, StylesheetManager } from './managers';


export function activate(context: vscode.ExtensionContext): void {
    let configurationManager = new ConfigurationManager(context);
    let stylesheetManager = new StylesheetManager();

    let classProvider = new ClassProvider(context, configurationManager, stylesheetManager);
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(['html', 'laravel-blade', 'razor', 'vue', 'blade', 'typescript'], classProvider));

    let definitionProvider = new DefinitionProvider(stylesheetManager);
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(['html', 'laravel-blade', 'razor', 'vue', 'blade', 'typescript'], definitionProvider));
}

export function deactivate(): void {
}
