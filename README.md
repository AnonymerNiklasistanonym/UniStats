# UniStats

Visualize your current progress at University.
Made from a Computer Science student of the University of Stuttgart (could be incompatible with your university).
Any problems/ideas? - open an issue and I try my best.

*This is just a hobby project of mine and in no way tested etc.!*

## Demo

- [Data of the demo](https://anonymerniklasistanonym.github.io/UniStats/demo.json)
- [HTML output created by this program](https://anonymerniklasistanonym.github.io/UniStats/demo.html)

## Docs

Currently there is only a documentation for the source code directly from the source code available through [TypeDoc](https://typedoc.org/):

- [TypeDoc Source Code Docs](https://anonymerniklasistanonym.github.io/UniStats/globals.html)

## Setup

1. Install [NodeJs](https://nodejs.org/en/download/current/)

2. Install dependencies

   ```sh
   npm install
   ```

## Run

| Commands | Description |
| ---------------- | ---------------- |
| `npm run start` | Run TypeScript program and use either `data/demo.json` or a custom `data/uni.json` file as input |
| `npm run start:live` | Run `npm start` automatically every time a source file or input file is updated |
| `npm run build` | Compile program to nodejs executable script in `dist` with the main file being `dist/index.js` |
| `npm run start:js` | Run compiled nodejs program (no dev dependencies necessary) with the same input files as when executing the typescript files |
| `npm run docs` | Create the documentation of the source code |
| `npm run lint` | Lint the source code and automatically fix easy/syntax errors |

### Update JSON schema template of the data

```sh
npm run createTsTypeFromJsonSchema
```

## Export to JavaScript

You need to first compile it:

```sh
npm run build:js
```

An then you can run the JavaScript files with:

```sh
npm run start:js
```

or with:

```sh
node dist/index.js
```
