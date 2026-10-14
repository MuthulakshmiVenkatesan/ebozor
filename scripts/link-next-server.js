const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const nextDistPath = path.join(projectRoot, "node_modules", "next", "dist");

const aliases = [
  { name: "server", target: path.join(nextDistPath, "server") },
  { name: "build", target: path.join(nextDistPath, "build") },
  { name: "lib", target: path.join(nextDistPath, "lib") },
];

const linkType = process.platform === "win32" ? "junction" : "dir";

const createLink = (name, target) => {
  const aliasPath = path.join(projectRoot, "node_modules", name);

  if (!fs.existsSync(target)) {
    console.warn(`Next ${name} folder not found yet. Run after installing dependencies.`);
    return;
  }

  try {
    fs.rmSync(aliasPath, { recursive: true, force: true });
  } catch (err) {
    // ignore errors when path does not exist
  }

  try {
    fs.symlinkSync(target, aliasPath, linkType);
  } catch (error) {
    console.error(`Failed to create Next ${name} symlink:`, error);
    process.exitCode = 1;
  }
};

aliases.forEach(({ name, target }) => createLink(name, target));

