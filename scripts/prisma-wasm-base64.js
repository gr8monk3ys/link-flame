const fs = require('fs');
const path = require('path');

const runtimeDir = path.join(__dirname, '..', 'node_modules', '@prisma', 'client', 'runtime');
const wasmPath = path.join(runtimeDir, 'query_engine_bg.postgresql.wasm');
const outPath = path.join(runtimeDir, 'query_engine_bg.postgresql.wasm-base64.js');

if (!fs.existsSync(wasmPath)) {
  console.warn('[prisma-wasm-base64] wasm file not found, skipping');
  process.exit(0);
}

if (fs.existsSync(outPath)) {
  process.exit(0);
}

const wasmBase64 = fs.readFileSync(wasmPath).toString('base64');
const contents = `exports.wasm = "${wasmBase64}";\n`;
fs.writeFileSync(outPath, contents, 'utf8');
