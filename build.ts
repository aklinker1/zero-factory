await Bun.$`rm -rf dist/*`;

console.log("Building \x1b[36m\x1b[1mindex.js\x1b[0m...\n");
await Bun.$`bun build src/index.ts --outfile=dist/index.js --target=node`;

console.log("Building \x1b[36m\x1b[1mindex.d.ts\x1b[0m...");
await Bun.$`bun tsc -p tsconfig.build.json`;

console.log("\n\x1b[32m\x1b[1m✓\x1b[0m Done!");
