# Visual Studio Code SCSS Support for HTML Documents

Missing SCSS support for HTML documents.
This project is a fork of the [ HTML CSS Support extension by ecmel](https://github.com/ecmel/vscode-html-css) but it uses the SCSSLanguageService instead of CSS.

## Features

- Class attribute completion.
- Id attribute completion.
- Scans workspace folder for scss files.
- Supports optional scss-options.json file for fine tuned resource selection.
- Supports Angular projects by looking for component scss files relative to the opened component html file. 
- Uses [vscode-css-languageservice](https://github.com/Microsoft/vscode-scss-languageservice).

## Supported Languages

- html

## Optional scss-options.json

If a scss-options.json file is found in the root of the workspace, only files listed in the file will be used for class and id attribute completion.
Set the "isAngularProject" option to true if you want the extension to look for scss files relative to a opened component html file.

### Example
```
{
    "options": {
        "globalStyles": [
            "./test.scss",
            "./assets/styles/site.scss"
        ],
        "isAngularProject": true
    }
}
```
<!--## Installation-->

<!--[Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ecmel.vscode-html-scss)-->
