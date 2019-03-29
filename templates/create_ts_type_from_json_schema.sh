#!/usr/bin/env bash

tslint ./create_ts_type_from_json_schema.ts --fix
tsc ./create_ts_type_from_json_schema.ts
node ./create_ts_type_from_json_schema.js
rm ./create_ts_type_from_json_schema.js
