#!/usr/bin/env bash

tslint ./createTsTypeFromJsonSchema.ts --fix
tsc ./createTsTypeFromJsonSchema.ts
cd ..
npm run createTsTypeFromJsonSchema
cd templates
rm ./createTsTypeFromJsonSchema.js
