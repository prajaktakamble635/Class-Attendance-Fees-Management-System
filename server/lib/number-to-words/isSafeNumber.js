/* Copyright (c) 2024 Soft The Next, All Rights Reserved. */

"use strict";const MAX_SAFE_INTEGER=require("./maxSafeInteger");function isSafeNumber(e){return"number"==typeof e&&Math.abs(e)<=MAX_SAFE_INTEGER}module.exports=isSafeNumber;