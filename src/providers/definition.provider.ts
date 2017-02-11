import * as vscode from 'vscode';
import * as lst from 'vscode-languageserver-types';
import * as css from 'vscode-css-languageservice';

import { StylesheetManager } from '../managers';


export class DefinitionProvider implements vscode.DefinitionProvider {
    private cssLanguageService = css.getSCSSLanguageService();


    constructor(private stylesheetManager: StylesheetManager, ) {
    }


    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Location> {
        return new Promise((resolve, reject) => {
            let currentRange = document.getWordRangeAtPosition(position);
            let property = document.getText(currentRange);

            let styleSheetPath: string = this.stylesheetManager.findInMap(this.stylesheetManager.localMap, property);
            if (!styleSheetPath) {
                styleSheetPath = this.stylesheetManager.findInMap(this.stylesheetManager.globalMap, property);
            }

            if (!styleSheetPath) {
                resolve();
                return;
            }

            let uri = vscode.Uri.file(styleSheetPath);
            vscode.workspace.openTextDocument(uri).then(doc => {
                let parsedDoc = this.cssLanguageService.parseStylesheet(<any>doc as lst.TextDocument);
                let symbols = this.cssLanguageService.findDocumentSymbols(<any>doc as lst.TextDocument, parsedDoc);

                for (let i = 0; i < symbols.length; i++) {
                    let symbol = symbols[i];

                    let shouldResolve: boolean;
                    if (symbol.name.charAt(0) === '.' || symbol.name.charAt(0) === '#') {
                        if (symbol.name.substring(1) === property) {
                            shouldResolve = true;
                        }
                        else {
                            let split = symbol.name.split(/[ ]+/);
                            for (let i = 0; i < split.length; i++) {
                                if (split[i].substring(1) === property) {
                                    shouldResolve = true;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        let splitPoint = symbol.name.split('.');
                        shouldResolve = this.stylesheetManager.compareSplit(splitPoint, property);

                        if (!shouldResolve) {
                            let splitHash = symbol.name.split('#');
                            shouldResolve = this.stylesheetManager.compareSplit(splitHash, property);
                        }

                        if (shouldResolve) {
                            let position = new vscode.Position(symbol.location.range.start.line, symbol.location.range.start.character);
                            let location = new vscode.Location(uri, position);
                            resolve(location);
                            break;
                        }
                    }

                    if (shouldResolve) {
                        let position = new vscode.Position(symbol.location.range.start.line, symbol.location.range.start.character);
                        let location = new vscode.Location(uri, position);
                        resolve(location);
                        break;
                    }
                }
                resolve();
            });
        });
    }
}