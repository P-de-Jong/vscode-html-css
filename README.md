# Visual Studio Code SCSS Support for HTML Documents

Missing SCSS support for HTML documents.
This project is a fork of the [ HTML CSS Support extension by ecmel](https://github.com/ecmel/vscode-html-css) but it uses the SCSSLanguageService instead of CSS.

## Features

- Class attribute completion.
- Id attribute completion.
- Supports @import.
- Scans workspace folder for scss files.
- Supports Angular projects by looking for component scss files relative to the opened component html file.
- Press F12 to go to definition(s). 
- Uses [vscode-css-languageservice](https://github.com/Microsoft/vscode-css-languageservice).

## Supported Languages

- html
- typescript inline template (e.g. Angular Components)
- laravel-blade
- razor
- vue

![example](https://raw.githubusercontent.com/P-de-Jong/vscode-html-scss/master/images/inline-template.png)

## Go To Definition(s)

Press F12 to go to definition(s) of a scss class.

![example](https://raw.githubusercontent.com/P-de-Jong/vscode-html-scss/master/images/definition.gif)


## Workspace settings

Extension settings can be set in the workspace settings.
- **htmlScss.globalStyles:** Array of filepaths. When this setting is not present all scss files in the workspace will be used. When the array is empty, no files will be used.
- **htmlScss.isAngularProject:** Set to true if you want the extension to look for scss files relative to a opened component html file.

### Example
![example](https://raw.githubusercontent.com/P-de-Jong/vscode-html-scss/master/images/settings.png)

<!--## Installation-->

<!--[Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ecmel.vscode-html-scss)-->
