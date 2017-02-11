'use strict';

// (c) 2016 Ecmel Ercan
// (c) 2017 Pim de Jong

import * as vsc from 'vscode';
import { ClassServer } from './server';
import { ConfigurationManager } from './utils';


export function activate(context: vsc.ExtensionContext): void {
    let configurationManager = new ConfigurationManager(context);
    let classServer = new ClassServer(context, configurationManager);
    context.subscriptions.push(vsc.languages.registerCompletionItemProvider('html', classServer));
}

export function deactivate(): void {
}



