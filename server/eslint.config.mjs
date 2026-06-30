// noinspection NpmUsedModulesInstalled

import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: [
        "**/node_modules/",
        "**/fonts/",
        "**/log/",
        "**/minified/",
        "**/pdfs/",
        "**/public/",
        "**/views/",
        "**/lib/",
        "**/logger.js",
        "**/minify.js",
        "**/sequelizeErrorHandler.js",
    ],
}, ...compat.extends("standard"), {
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.commonjs,
        },

        ecmaVersion: 12,
        sourceType: "script",
    },

    rules: {
        indent: ["error", 2],
        "no-var": "error",
        "no-unused-vars": "error",
    },
}];