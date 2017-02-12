import * as vscode from 'vscode';
import * as lst from 'vscode-languageserver-types';
import * as css from 'vscode-css-languageservice';

import { IStyleheetMap } from '../interfaces';


export class StylesheetManager {
    private cssLanguageService = css.getSCSSLanguageService();



    public globalStyleSheets: { [index: string]: Array<string> } = {};

    public globalImports: { [index: string]: string } = {};

    public globalMap: IStyleheetMap = {};

    public localMap: IStyleheetMap = {};


    public findInMapFirstOrDefault(map: IStyleheetMap, property: string): string {
        let styleSheetPath: string = null;
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

    public findInMap(map: IStyleheetMap, property: string): Array<string> {
        let styleSheetPaths = new Array<string>();
        for (let key in map) {
            for (let item of map[key]) {
                if (item.label === property) {
                    styleSheetPaths.push(key);
                }
            }
        }

        return styleSheetPaths;
    }

    public compareSplit(split: Array<string>, compareTo: string): boolean {
        let isEqual: boolean = false;
        for (let i = 0; i < split.length; i++) {
            if (split[i] === compareTo) {
                isEqual = true;
                break;
            }
        }

        return isEqual;
    }

    public async findLocation(property: string, uri: vscode.Uri) {
        let doc = await vscode.workspace.openTextDocument(uri);
        return this.findLocationInSheet(doc, property, uri);
    }


    private findLocationInSheet(doc: vscode.TextDocument, property: string, uri: vscode.Uri) {
        let parsedDoc = this.cssLanguageService.parseStylesheet(<any>doc as lst.TextDocument);
        let symbols = this.cssLanguageService.findDocumentSymbols(<any>doc as lst.TextDocument, parsedDoc);
        let locationFound: boolean = false;
        let location: vscode.Location;

        for (let i = 0; i < symbols.length; i++) {
            let symbol = symbols[i];

            if (symbol.name.charAt(0) === '.' || symbol.name.charAt(0) === '#') {
                if (symbol.name.substring(1) === property) {
                    locationFound = true;
                }
                else {
                    let split = symbol.name.split(/[ ]+/);
                    for (let i = 0; i < split.length; i++) {
                        if (split[i].substring(1) === property) {
                            locationFound = true;
                            break;
                        }
                    }
                }
            }
            else {
                let splitPoint = symbol.name.split('.');
                locationFound = this.compareSplit(splitPoint, property);

                if (!locationFound) {
                    let splitHash = symbol.name.split('#');
                    locationFound = this.compareSplit(splitHash, property);
                }
            }

            if (locationFound) {
                location = this.getLocation(uri, symbol.location.range.start.line, symbol.location.range.start.character);
                break;
            }
        }

        return location;
    }

    private getLocation(uri: vscode.Uri, startLine: number, startCharacter: number): vscode.Location {
        let position = new vscode.Position(startLine, startCharacter);
        return new vscode.Location(uri, position);
    }
}
