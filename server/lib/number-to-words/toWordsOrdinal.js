/* Copyright (c) 2024 Soft The Next, All Rights Reserved. */

"use strict";const makeOrdinal=require("./makeOrdinal"),toWords=require("./toWords");function toWordsOrdinal(r){const o=toWords(r);return makeOrdinal(o)}module.exports=toWordsOrdinal;