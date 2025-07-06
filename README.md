## About the option

TypeScript 5.7 introduced the --rewriteRelativeImportExtensions option, which transforms relative module specifiers with .ts, .tsx, .mts, or .cts extensions to their JavaScript equivalents in output files. This option is useful for creating TypeScript files that can be run directly in Node.js during development and still be compiled to JavaScript outputs for distribution or production use.

[Read more](https://www.typescriptlang.org/docs/handbook/modules/theory.html#module-specifiers-are-not-transformed-by-default)