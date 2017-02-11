import * as vscode from 'vscode';
import * as lst from 'vscode-languageserver-types';
import * as css from 'vscode-css-languageservice';
import * as fs from 'fs';

import { StylesheetManager } from '../managers';
import { IStyleheetMap } from '../interfaces';


export class DefinitionProvider implements vscode.DefinitionProvider {
    private cssLanguageService = css.getSCSSLanguageService();


    constructor(private stylesheetManager: StylesheetManager, ) {
    }


    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Location> {
        return new Promise((resolve, reject) => {
            let currentRange = document.getWordRangeAtPosition(position);
            let property = document.getText(currentRange);

            let styleSheetPath: string = this.findInMap(this.stylesheetManager.localMap, property);
            if (!styleSheetPath) {
                styleSheetPath = this.findInMap(this.stylesheetManager.globalMap, property);
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

                    if (symbol.name.charAt(0) === '.' || symbol.name.charAt(0) === '#') {
                        let shouldResolve: boolean;
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

                        if (shouldResolve) {
                            let position = new vscode.Position(symbol.location.range.start.line, symbol.location.range.start.character);
                            let location = new vscode.Location(uri, position);
                            resolve(location);
                            break;
                        }
                    }
                    else {
                        let shouldResolve: boolean;
                        let splitPoint = symbol.name.split('.');
                        for (let i = 0; i < splitPoint.length; i++) {
                            if (splitPoint[i] === property) {
                                shouldResolve = true;
                                break;
                            }
                        }

                        if (!shouldResolve) {
                            let splitHash = symbol.name.split('#');
                            for (let i = 0; i < splitHash.length; i++) {
                                if (splitHash[i] === property) {
                                    shouldResolve = true;
                                    break;
                                }
                            }
                        }

                        if (shouldResolve) {
                            let position = new vscode.Position(symbol.location.range.start.line, symbol.location.range.start.character);
                            let location = new vscode.Location(uri, position);
                            resolve(location);
                            break;
                        }
                    }
                }
                resolve();
            });
        });
    }


    private findInMap(map: IStyleheetMap, property: string): string {
        let styleSheetPath: string;
        for (let key in map) {
            let found: boolean;
            for (let item of map[key]) {
                if (item.label === property) {
                    styleSheetPath = key;
                    found = true;
                    break;
                }
            }

            if (found) {
                break;
            }
        }

        return styleSheetPath;
    }
}