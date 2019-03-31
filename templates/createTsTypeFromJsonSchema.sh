#!/usr/bin/env bash

tslint ./createTsTypeFromJsonSchema.ts --fix
tsc ./createTsTypeFromJsonSchema.ts
node ./createTsTypeFromJsonSchema.js
rm ./createTsTypeFromJsonSchema.js
