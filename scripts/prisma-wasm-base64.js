const fs = require('fs');
const path = require('path');

const runtimeDir = path.join(__dirname, '..', 'node_modules', '@prisma', 'client', 'runtime');

// Detect provider from schema
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let provider = 'sqlite';
try {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const match = schema.match(/provider\s*=\s*"(postgresql|sqlite|mysql|sqlserver|cockroachdb)"/);
  if (match) provider = match[1];
} catch {
  // Default to sqlite if schema can't be read
}

const wasmPath = path.join(runtimeDir, `query_engine_bg.${provider}.wasm`);
const outPath = path.join(runtimeDir, `query_engine_bg.${provider}.wasm-base64.js`);

if (fs.existsSync(outPath)) {
  process.exit(0);
}

if (!fs.existsSync(wasmPath)) {
  console.warn(`[prisma-wasm-base64] ${provider} wasm file not found, skipping`);
  process.exit(0);
}

const wasmBase64 = fs.readFileSync(wasmPath).toString('base64');
const contents = `exports.wasm = "${wasmBase64}";\n`;
fs.writeFileSync(outPath, contents, 'utf8');
