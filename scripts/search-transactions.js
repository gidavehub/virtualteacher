const fs = require("fs");
const path = require("path");

function walkDir(dir, callback) {
  try {
    fs.readdirSync(dir).forEach(f => {
      let dirPath = path.join(dir, f);
      if (f === "node_modules" || f === ".next" || f === ".git") return;
      let isDirectory = fs.statSync(dirPath).isDirectory();
      isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
  } catch (err) {}
}

const rootPath = "C:\\Projects\\optiq";
walkDir(rootPath, (filePath) => {
  if (filePath.endsWith(".ts") || filePath.endsWith(".js") || filePath.endsWith(".tsx")) {
    const content = fs.readFileSync(filePath, "utf-8");
    if (content.includes("transactions")) {
      console.log(`Found 'transactions' in: ${filePath}`);
    }
  }
});
