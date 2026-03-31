import fs from "node:fs";
import path from "node:path";

const distRoot = path.resolve(process.cwd(), "dist");

const isRelative = (specifier) => specifier.startsWith("./") || specifier.startsWith("../");

const hasExtension = (specifier) => /\.(?:js|mjs|cjs|json|node)$/.test(specifier);

const resolveSpecifier = (fileDir, specifier) => {
  if (!isRelative(specifier) || hasExtension(specifier)) {
    return specifier;
  }

  const filePath = path.resolve(fileDir, `${specifier}.js`);
  if (fs.existsSync(filePath)) {
    return `${specifier}.js`;
  }

  const indexPath = path.resolve(fileDir, specifier, "index.js");
  if (fs.existsSync(indexPath)) {
    return `${specifier}/index.js`;
  }

  return specifier;
};

const rewriteImports = (filePath) => {
  const fileDir = path.dirname(filePath);
  const source = fs.readFileSync(filePath, "utf8");

  const rewritten = source
    .replace(/(from\s+["'])(\.{1,2}\/[^"']+)(["'])/g, (_, prefix, specifier, suffix) => {
      return `${prefix}${resolveSpecifier(fileDir, specifier)}${suffix}`;
    })
    .replace(/(import\(\s*["'])(\.{1,2}\/[^"']+)(["']\s*\))/g, (_, prefix, specifier, suffix) => {
      return `${prefix}${resolveSpecifier(fileDir, specifier)}${suffix}`;
    });

  if (rewritten !== source) {
    fs.writeFileSync(filePath, rewritten, "utf8");
  }
};

const walk = (dirPath) => {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(".js")) {
      rewriteImports(fullPath);
    }
  }
};

if (!fs.existsSync(distRoot)) {
  process.exit(0);
}

walk(distRoot);