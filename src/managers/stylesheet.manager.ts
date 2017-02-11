import { IStyleheetMap } from '../interfaces';


export class StylesheetManager {
    public globalStyleSheets: { [index: string]: Array<string> } = {};

    public globalImports: { [index: string]: string } = {};

    public globalMap: IStyleheetMap = {};

    public localMap: IStyleheetMap = {};

}
