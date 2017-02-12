import * as vscode from 'vscode';

import { StylesheetManager } from '../managers';


export class DefinitionProvider implements vscode.DefinitionProvider {


    constructor(private stylesheetManager: StylesheetManager, ) {
    }


    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Location> {
        let currentRange = document.getWordRangeAtPosition(position);
        let property = document.getText(currentRange);
        let locations = new Array<vscode.Location>();

        let localPaths: Array<string> = this.stylesheetManager.findInMap(this.stylesheetManager.localMap, property);
        let globalPaths: Array<string> = this.stylesheetManager.findInMap(this.stylesheetManager.globalMap, property);
        let combinedPaths: Array<string> = [...localPaths, ...globalPaths];

        return new Promise((resolve, reject) => {
            if (combinedPaths.length === 0) {
                resolve(locations);
            }

            combinedPaths = combinedPaths.filter((item, index, input) => {
                return input.indexOf(item) === index;
            });

            for (let i = 0; i < combinedPaths.length; i++) {
                let path = combinedPaths[i];
                let uri = vscode.Uri.file(path);
                this.stylesheetManager.findLocation(property, uri).then(location => {
                    if (location) {
                        locations.push(location);
                    }

                    if (i === combinedPaths.length - 1) {
                        resolve(locations);
                    }
                });
            }
        });
    }
}