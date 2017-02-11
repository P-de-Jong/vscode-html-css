import * as vscode from 'vscode';
import * as lst from 'vscode-languageserver-types';
import * as css from 'vscode-css-languageservice';
import * as path from 'path';
import * as fs from 'fs';

import { Snippet } from '../models';
import { IConfiguration } from '../interfaces';
import { ConfigurationManager } from '../utils';


export class ClassServer implements vscode.CompletionItemProvider {
    private cssLanguageService = css.getSCSSLanguageService();
    private globalWatcher: vscode.FileSystemWatcher;
    private fileOpenListener: vscode.Disposable;
    private globalMap: { [index: string]: Array<vscode.CompletionItem>; } = {};
    private localMap: { [index: string]: Array<vscode.CompletionItem>; } = {};
    private dot = vscode.CompletionItemKind.Class;
    private hash = vscode.CompletionItemKind.Reference;
    private glob = '**/*.scss';
    private configuration: IConfiguration;
    private globalStyleSheets: { [index: string]: Array<string> } = {};
    private globalImports: { [index: string]: string } = {};
    private regex = [
        /(class|\[class\]|\[id\]|id|\[ngClass\])=["|']([^"^']*$)/i,
        /(\.|\#)[^\.^\#^\<^\>]*$/i,
        /<style[\s\S]*>([\s\S]*)<\/style>/ig
    ];


    constructor(private context: vscode.ExtensionContext, private configurationManager: ConfigurationManager) {
        this.initialize();

        configurationManager.setConfigChangeListener(() => this.onConfigurationChange());
    }


    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.CompletionList {
        let start = new vscode.Position(0, 0);
        let range = new vscode.Range(start, position);
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

            let items: { [index: string]: vscode.CompletionItem; } = {};
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
            let ci = new Array<vscode.CompletionItem>();
            for (let item in items) {
                if ((id && items[item].kind === this.hash) || !id && items[item].kind === this.dot) {
                    ci.push(items[item]);
                }
            }
            return new vscode.CompletionList(ci);
        }
        return null;
    }

    public resolveCompletionItem(item: vscode.CompletionItem, token: vscode.CancellationToken): vscode.CompletionItem {
        return null;
    }


    private initialize(): void {
        if (vscode.workspace.rootPath) {
            this.configuration = this.configurationManager.getConfiguration();
            if (!this.configuration.globalStyles) {
                this.findGlobalFiles();
            }
            else {
                this.getGlobalStyleSheets();
            }

            if (this.configuration.isAngularProject) {
                this.initializeAngularProject();
            }
        }
    }

    private findGlobalFiles(): void {
        vscode.workspace.findFiles(this.glob, '').then((uris: Array<vscode.Uri>) => {
            for (let i = 0; i < uris.length; i++) {
                this.parse(uris[i], true);
            }
        });
        this.setGlobalWatcher();
    }

    private pushSymbols(key: string, symbols: Array<lst.SymbolInformation>, isGlobal: boolean = false): void {
        let regex = /[\.\#]([\w-]+)/g;
        let ci: Array<vscode.CompletionItem> = new Array<vscode.CompletionItem>();

        for (let i = 0; i < symbols.length; i++) {
            if (symbols[i].kind !== 5) {
                continue;
            }
            let symbol;
            while (symbol = regex.exec(symbols[i].name)) {
                let item = new vscode.CompletionItem(symbol[1]);
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

    private parse(uri: vscode.Uri, isGlobal: boolean = false, callback?: (succes: boolean) => void): void {
        fs.readFile(uri.fsPath, 'utf8', (err: any, data: string) => {
            if (err) {
                delete this.globalMap[uri.fsPath];
                if (callback) {
                    callback(false);
                }
            }
            else {
                let doc = lst.TextDocument.create(uri.fsPath, 'scss', 1, data);
                let parsedDoc = this.cssLanguageService.parseStylesheet(doc);

                this.findImports(doc, isGlobal);

                let symbols = this.cssLanguageService.findDocumentSymbols(doc, parsedDoc);
                this.pushSymbols(uri.fsPath, symbols, isGlobal);

                if (callback) {
                    callback(true);
                }
            }
        });
    }

    private findImports(doc: lst.TextDocument, isGlobal: boolean): void {
        let imports = doc.getText().match(/@import '([^;]*)';/g);
        if (!imports) {
            return;
        }
        let currentDir = doc.uri.substring(0, doc.uri.lastIndexOf('\\'));
        imports.forEach(imp => {
            let relativePath = imp.match(/'(.*)'/).pop();
            this.parseImport(currentDir, relativePath, doc.uri, isGlobal);

            let _relativePath: string;
            if (relativePath.indexOf('/_') === -1) {
                _relativePath = [relativePath.slice(0, relativePath.lastIndexOf('/') + 1), '_', relativePath.slice(relativePath.lastIndexOf('/') + 1)].join('');
            }

            if (_relativePath) {
                this.parseImport(currentDir, _relativePath, doc.uri, isGlobal);
            }

        });
    }

    private getLocalClasses(htmlUri: vscode.Uri): void {
        // Clear local map
        this.localMap = {};

        let filePath = htmlUri.fsPath.replace(/\.[^/.]+$/, '');
        filePath += '.scss';

        let scssUri = vscode.Uri.file(filePath);
        this.parse(scssUri);
    }

    private getGlobalStyleSheets(): void {
        if (this.configuration.globalStyles.length === 0) {
            return;
        }

        for (let styleSheetPath of this.configuration.globalStyles) {
            let uri = vscode.Uri.file(path.resolve(vscode.workspace.rootPath, styleSheetPath));
            this.globalStyleSheets[uri.fsPath] = [];
            this.parse(uri, true);
        }

        this.setGlobalWatcher();
    }

    private setGlobalWatcher(): void {
        this.globalWatcher = vscode.workspace.createFileSystemWatcher(this.glob);

        this.globalWatcher.onDidCreate(uri => {
            if (Object.keys(this.globalStyleSheets).length === 0 || this.globalStyleSheets[uri.fsPath] || this.globalImports[uri.fsPath]) {
                this.parse(uri, true);
            }
        });
        this.globalWatcher.onDidChange(uri => {
            if (Object.keys(this.globalStyleSheets).length === 0 || this.globalStyleSheets[uri.fsPath] || this.globalImports[uri.fsPath]) {
                this.parse(uri, true);
            }
        });
        this.globalWatcher.onDidDelete(uri => {
            delete this.globalMap[uri.fsPath];
        });

        this.context.subscriptions.push(this.globalWatcher);
    }

    private initializeAngularProject(): void {
       if (vscode.window.activeTextEditor) {
            let currentDocument = vscode.window.activeTextEditor.document;
            if (currentDocument.languageId === 'html') {
                this.getLocalClasses(currentDocument.uri);
            }
        }

        this.setFileOpenListener();
    }

    private setFileOpenListener(): void {
        this.fileOpenListener = vscode.workspace.onDidOpenTextDocument(document => {
            let fileExtension = document.fileName.split('.').pop();
            if (fileExtension === 'html') {
                this.getLocalClasses(document.uri);
            }
        });

        this.context.subscriptions.push(this.fileOpenListener);
    }

    private parseImport(currentDir: string, relativePath: string, parent: string, isGlobal: boolean): void {
        let filePath = path.resolve(currentDir, relativePath + '.scss');
        let uri = vscode.Uri.file(filePath);

        if (this.globalImports[uri.fsPath]) {
            return;
        }

        this.parse(uri, isGlobal, succes => {
            if (succes && isGlobal) {
                let existingImport = this.globalImports[uri.fsPath];
                if (!existingImport) {
                    this.globalImports[uri.fsPath] = parent;
                }
                let parentSheetImports = this.globalStyleSheets[parent];
                if (parentSheetImports) {
                    parentSheetImports.push(uri.fsPath);
                }
                else {

                }
            }
        });
    }

    private onConfigurationChange(): void {
        this.globalMap = {};
        this.localMap = {};
        this.globalStyleSheets = {};
        this.globalImports = {};

        if (this.globalWatcher) {
            this.globalWatcher.dispose();
        }

        if (this.fileOpenListener) {
            this.fileOpenListener.dispose();
        }

        this.initialize();
    }
}