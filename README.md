# UniStats

Visualize your current progress at University.
Made from a Computer Science student of the University of Stuttgart (could be incompatible with your university).
Any problems/ideas? - open an issue and I try my best.

*This is just a hobby project of mine and in no way battle tested etc.!*

## Setup

1. Install [NodeJs](https://nodejs.org/en/download/current/)

2. Install dependencies (only necessary for building/compiling not for running)

   ```sh
   npm install
   ```

3. Build program

   ```sh
   npm run build
   ```

4. Run program using either the file [`data/demo.json`](data/demo.json) or if provided a custom file `data/uni.json` as input

   ```sh
   npm run start
   ```

## Other scripts

| Commands | Description |
| ---------------- | ---------------- |
| `npm run start:live` | Run `npm run start` automatically every time a JSON input file is updated |
| `npm run docs` | Create the documentation of the source code |
| `npm run lint:fix` | Lint the source code and automatically fix some errors |

### Update JSON schema

```sh
npm run createJsonSchema
```
