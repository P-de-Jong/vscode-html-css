import { IStyleheetMap } from '../interfaces';


export class StylesheetManager {
    public globalStyleSheets: { [index: string]: Array<string> } = {};

    public globalImports: { [index: string]: string } = {};

    public globalMap: IStyleheetMap = {};

    public localMap: IStyleheetMap = {};


    public findInMap(map: IStyleheetMap, property: string): string {
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
}
