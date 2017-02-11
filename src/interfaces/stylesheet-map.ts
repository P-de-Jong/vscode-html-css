import * as vscode from 'vscode';


export interface IStyleheetMap {

    [index: string]: Array<vscode.CompletionItem>;

}