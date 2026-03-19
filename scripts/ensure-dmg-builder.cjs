#!/usr/bin/env node
/**
 * Ensures the dmg-builder binary is cached before electron-builder runs.
 *
 * Problem: electron_mirror in .npmrc redirects all @electron/get downloads to
 * npmmirror.com/mirrors/electron/, but the dmg-builder binary lives at
 * npmmirror.com/mirrors/electron-builder-binaries/ — a different path.
 * When the cache is empty, electron-builder hits a 404 and fails.
 *
 * This script pre-downloads the binary from the correct mirror and writes the
 * .complete marker that electron-builder uses to detect a valid cache entry.
 */

const https = require("node:https");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFileSync } = require("node:child_process");

// Must match the hash function in app-builder-lib/out/binDownload.js
function hashUrlSafe(input, length = 6) {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  hash >>>= 0;
  const out = hash.toString(36);
  return out.length >= length ? out.slice(0, length) : out.padStart(length, "0");
}

function getCacheDir() {
  if (process.env.ELECTRON_BUILDER_CACHE) return process.env.ELECTRON_BUILDER_CACHE.trim();
  return path.join(os.homedir(), "Library", "Caches", "electron-builder");
}

function followRedirects(url, redirects = 10) {
  return new Promise((resolve, reject) => {
    if (redirects === 0) return reject(new Error("Too many redirects"));
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          resolve(followRedirects(res.headers.location, redirects - 1));
        } else if (res.statusCode === 200) {
          resolve(res);
        } else {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
      })
      .on("error", reject);
  });
}

async function downloadToFile(url, dest) {
  const res = await followRedirects(url);
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(dest);
    res.pipe(out);
    out.on("finish", resolve);
    out.on("error", reject);
  });
}

async function main() {
  if (process.platform !== "darwin") return;

  const BASE_URL = "https://github.com/electron-userland/electron-builder-binaries/releases/download/";
  const RELEASE = "dmg-builder@1.2.0";
  const arch = process.arch === "arm64" ? "arm64" : "x86_64";
  const FILENAME = `dmgbuild-bundle-${arch}-75c8a6c.tar.gz`;

  const suffix = hashUrlSafe(`${BASE_URL}-${RELEASE}-${FILENAME}`, 5);
  const folderName = `${FILENAME.replace(/\.(tar\.gz|tgz)$/, "")}-${suffix}`;
  const extractDir = path.join(getCacheDir(), RELEASE, folderName);
  const completeMarker = `${extractDir}.complete`;

  if (fs.existsSync(completeMarker)) {
    console.log(`  • dmg-builder cached  path=${extractDir}`);
    return;
  }

  const MIRROR =
    process.env.ELECTRON_BUILDER_BINARIES_MIRROR ||
    process.env.npm_config_electron_builder_binaries_mirror ||
    "https://npmmirror.com/mirrors/electron-builder-binaries/";

  const url = `${MIRROR}${RELEASE}/${FILENAME}`;
  const tmpFile = path.join(os.tmpdir(), FILENAME);

  console.log(`  • downloading dmg-builder  url=${url}`);
  await downloadToFile(url, tmpFile);

  fs.mkdirSync(extractDir, { recursive: true });
  execFileSync("tar", ["-xzf", tmpFile, "-C", extractDir, "--strip-components=1"]);
  fs.unlinkSync(tmpFile);
  fs.writeFileSync(completeMarker, "");

  console.log(`  • dmg-builder ready  path=${extractDir}`);
}

main().catch((err) => {
  console.error("ensure-dmg-builder failed:", err.message);
  process.exit(1);
});
