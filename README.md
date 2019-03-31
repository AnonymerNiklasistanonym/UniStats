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

### Main script

```sh
npm start
```

### Update JSON schema template of the data

```sh
cd templates
sh ./createTsTypeFromJsonSchema.sh
```
