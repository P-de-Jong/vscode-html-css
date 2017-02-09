import * as vsc from 'vscode';
import * as lst from 'vscode-languageserver-types';
import * as css from 'vscode-css-languageservice';

export class Snippet {

    private _document: lst.TextDocument;
    private _stylesheet: css.Stylesheet;
    private _position: lst.Position;


    constructor(content: string, cssLanguageService: css.LanguageService, character?: number) {
        this._document = lst.TextDocument.create('', 'scss', 1, content);
        this._stylesheet = cssLanguageService.parseStylesheet(this._document);
        this._position = new vsc.Position(this._document.lineCount - 1, character ? character : 0);
    }


    public get document(): lst.TextDocument {
        return this._document;
    }

    public get stylesheet(): css.Stylesheet {
        return this._stylesheet;
    }

    public get position(): lst.Position {
        return this._position;
    }
}