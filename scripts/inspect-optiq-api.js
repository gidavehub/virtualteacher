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
console.log(`Walking directory: ${rootPath}`);
if (fs.existsSync(rootPath)) {
  walkDir(rootPath, (filePath) => {
    console.log(filePath);
  });
} else {
  console.log("Directory does not exist.");
}
