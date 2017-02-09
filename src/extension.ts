'use strict';

// (c) 2016 Ecmel Ercan
// (c) 2017 Pim de Jong

import * as vsc from 'vscode';
import { ClassServer } from './class-server';


export function activate(context: vsc.ExtensionContext) {
    let classServer = new ClassServer(context);
    context.subscriptions.push(vsc.languages.registerCompletionItemProvider('html', classServer));
}

export function deactivate() {
}



