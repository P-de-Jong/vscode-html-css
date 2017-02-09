import * as vsc from 'vscode';
import * as lst from 'vscode-languageserver-types';
import * as css from 'vscode-css-languageservice';
import * as fs from 'fs';
import * as path from 'path';

import { Snippet } from './snippet';


export class ClassServer implements vsc.CompletionItemProvider {
    private cssLanguageService = css.getSCSSLanguageService();
    private globalMap: { [index: string]: Array<vsc.CompletionItem>; } = {};
    private localMap: { [index: string]: Array<vsc.CompletionItem>; } = {};
    private dot = vsc.CompletionItemKind.Class;
    private hash = vsc.CompletionItemKind.Reference;
    private glob = '**/*.scss';

    private regex = [
        /(class|id)=["|']([^"^']*$)/i,
        /(\.|\#)[^\.^\#^\<^\>]*$/i,
        /<style[\s\S]*>([\s\S]*)<\/style>/ig
    ];


    constructor(private context: vsc.ExtensionContext) {
        this.initialize();
    }


    public provideCompletionItems(document: vsc.TextDocument, position: vsc.Position, token: vsc.CancellationToken): vsc.CompletionList {
        let start = new vsc.Position(0, 0);
        let range = new vsc.Range(start, position);
        let text = document.getText(range);

        let tag = this.regex[0].exec(text);
        if (!tag) {
            tag = this.regex[1].exec(text);
        }
        if (tag) {
            let internal = new Array<lst.SymbolInformation>();
            let style;
            while (style = this.regex[2].exec(document.getText())) {
                let snippet = new Snippet(style[1], this.cssLanguageService);
                let symbols = this.cssLanguageService.findDocumentSymbols(snippet.document, snippet.stylesheet);
                for (let symbol of symbols) {
                    internal.push(symbol);
                }
            }

            this.pushSymbols('style', internal);

            let items: { [index: string]: vsc.CompletionItem; } = {};
            for (let key in this.globalMap) {
                for (let item of this.globalMap[key]) {
                    items[item.label] = item;
                }
            }

            for (let key in this.localMap) {
                for (let item of this.localMap[key]) {
                    items[item.label] = item;
                }
            }

            let id = tag[0].startsWith('id') || tag[0].startsWith('#');
            let ci = new Array<vsc.CompletionItem>();
            for (let item in items) {
                if ((id && items[item].kind === this.hash) || !id && items[item].kind === this.dot) {
                    ci.push(items[item]);
                }
            }
            return new vsc.CompletionList(ci);
        }
        return null;
    }

    public resolveCompletionItem(item: vsc.CompletionItem, token: vsc.CancellationToken): vsc.CompletionItem {
        return null;
    }


    private initialize() {
        if (vsc.workspace.rootPath) {
            let optionsJson = path.resolve(vsc.workspace.rootPath, 'scss-options.json');

            fs.readFile(optionsJson, 'utf8', (err: any, data: string) => {

                if (err) {
                    vsc.workspace.findFiles(this.glob, '').then((uris: Array<vsc.Uri>) => {
                        for (let i = 0; i < uris.length; i++) {
                            this.parse(uris[i]);
                        }
                    });
                }
                else {
                    let optionsJson = JSON.parse(data);

                    if (!optionsJson.options) {
                        console.log('no options found');
                        return;
                    }

                    let options = optionsJson.options;
                    this.getGlobalStyleSheets(this.context, options);

                    if (options.isAngularProject) {
                        this.initializeAngularProject(this.context);
                    }
                }
            });
        }
    }

    private pushSymbols(key: string, symbols: Array<lst.SymbolInformation>, isGlobal: boolean = false): void {
        let regex = /[\.\#]([\w-]+)/g;
        let ci: Array<vsc.CompletionItem> = new Array<vsc.CompletionItem>();

        for (let i = 0; i < symbols.length; i++) {
            if (symbols[i].kind !== 5) {
                continue;
            }
            let symbol;
            while (symbol = regex.exec(symbols[i].name)) {
                let item = new vsc.CompletionItem(symbol[1]);
                item.kind = symbol[0].startsWith('.') ? this.dot : this.hash;
                item.detail = path.basename(key);
                ci.push(item);
            }
        }

        if (isGlobal) {
            this.globalMap[key] = ci;
        }
        else {
            this.localMap[key] = ci;
        }
    }

    private parse(uri: vsc.Uri, isGlobal: boolean = false): void {
        fs.readFile(uri.fsPath, 'utf8', (err: any, data: string) => {
            if (err) {
                delete this.globalMap[uri.fsPath];
            } else {
                let doc = lst.TextDocument.create(uri.fsPath, 'scss', 1, data);
                let symbols = this.cssLanguageService.findDocumentSymbols(doc, this.cssLanguageService.parseStylesheet(doc));
                this.pushSymbols(uri.fsPath, symbols, isGlobal);
            }
        });
    }

    private getLocalClasses(htmlUri: vsc.Uri) {
        // Clear local map
        this.localMap = {};

        let filePath = htmlUri.fsPath.replace(/\.[^/.]+$/, '');
        filePath += '.scss';

        let scssUri = vsc.Uri.file(filePath);
        this.parse(scssUri);
    }

    private getGlobalStyleSheets(context: vsc.ExtensionContext, options: any) {
        let globalStyleSheetsPaths = new Array<string>();

        for (let resource of options.globalStyles) {
            let uri = vsc.Uri.file(path.resolve(vsc.workspace.rootPath, resource));
            globalStyleSheetsPaths.push(uri.fsPath);
            this.parse(uri, true);
        }

        this.setGlobalWatcher(context, this.glob, globalStyleSheetsPaths);
    }

    private setGlobalWatcher(context: vsc.ExtensionContext, glob: string, globalStyleSheetsPaths: Array<string>) {
        let watcher = vsc.workspace.createFileSystemWatcher(glob);

        watcher.onDidCreate(uri => {
            if (globalStyleSheetsPaths.length === 0 || globalStyleSheetsPaths.indexOf(uri.fsPath) !== -1) {
                this.parse(uri);
            }
        });
        watcher.onDidChange(uri => {
            if (globalStyleSheetsPaths.length === 0 || globalStyleSheetsPaths.indexOf(uri.fsPath) !== -1) {
                this.parse(uri);
            }
        });
        watcher.onDidDelete(uri => {
            delete this.globalMap[uri.fsPath];
        });

        context.subscriptions.push(watcher);
    }

    private initializeAngularProject(context: vsc.ExtensionContext) {
        let currentDocument = vsc.window.activeTextEditor.document;
        if (currentDocument.languageId === 'html') {
            this.getLocalClasses(currentDocument.uri);
        }

        let fileChangeListener = vsc.workspace.onDidOpenTextDocument(document => {
            if (document.fileName.split('.').pop() === 'html') {
                this.getLocalClasses(document.uri);
            }
        });

        context.subscriptions.push(fileChangeListener);
    }
}