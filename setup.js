// This script automates the setup for both the server and the client.
// It runs automatically after you execute `npm install` in the root directory.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const runCommand = (command, cwd) => {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: 'inherit', cwd });
};

const writeFile = (filePath, content) => {
  fs.writeFileSync(filePath, content);
  console.log(`✅ Created ${path.basename(filePath)}`);
};

// --- Main Setup Logic ---
console.log("🚀 Starting project setup...");
console.log("--------------------------------------------------------");

// --- Backend Setup ---
const serverDir = path.join(__dirname, 'server');
if (!fs.existsSync(serverDir)) {
    console.log("⚙️  Setting up Backend (Node.js, Express, Prisma)...");
    fs.mkdirSync(serverDir);
    const packageJsonServer = { name: 'server', version: '1.0.0', main: 'index.js', scripts: { dev: 'nodemon index.js' } };
    writeFile(path.join(serverDir, 'package.json'), JSON.stringify(packageJsonServer, null, 2));
    runCommand('npm install express dotenv cors', serverDir);
    runCommand('npm install nodemon prisma --save-dev', serverDir);
    const gitignoreContent = `# Dependencies\n/node_modules\n\n# Environment variables\n.env\n`;
    writeFile(path.join(serverDir, '.gitignore'), gitignoreContent);
    const envContent = `# Server Port\nPORT=3002\n\n# Database URL from Neon\nDATABASE_URL="<YOUR_NEON_DATABASE_URL_HERE>"\n`;
    writeFile(path.join(serverDir, '.env'), envContent);
    const indexJsContent = `const express = require('express');\nconst dotenv = require('dotenv');\nconst cors = require('cors');\ndotenv.config();\nconst app = express();\napp.use(cors());\napp.use(express.json());\napp.get('/', (req, res) => res.send('Server is up and running!'));\nconst PORT = process.env.PORT || 3002;\napp.listen(PORT, () => console.log(\`Server is running on port \${PORT}\`));`;
    writeFile(path.join(serverDir, 'index.js'), indexJsContent);
    console.log("✅ Backend setup complete!");
    console.log("--------------------------------------------------------");
}

// --- Frontend Setup ---
const clientDir = path.join(__dirname, 'client');
if (!fs.existsSync(clientDir)) {
    console.log("\n🎨 Setting up Frontend (React, Vite, Tailwind CSS)...");
    runCommand(`npm create vite@latest ${path.basename(clientDir)} -- --template react`, __dirname);
    runCommand('npm install axios react-router-dom', clientDir);
    runCommand('npm install -D tailwindcss postcss autoprefixer', clientDir);
    const indexCssContent = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`;
    writeFile(path.join(clientDir, 'src/index.css'), indexCssContent);
    const appJsxContent = `import React from 'react';\n\nfunction App() {\n  return (\n    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white font-sans">\n      <div className="text-center p-8">\n        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">\n          Waste Management Platform\n        </h1>\n        <p className="text-xl text-gray-300">\n          Frontend is running with React + Vite + Tailwind!\n        </p>\n      </div>\n    </div>\n  );\n}\n\nexport default App;`;
    writeFile(path.join(clientDir, 'src/App.jsx'), appJsxContent.trim());
    console.log("✅ Frontend dependency installation complete!");
    console.log("❗ Frontend requires manual Tailwind CSS configuration.");
    console.log("--------------------------------------------------------");
}

// --- Final Instructions ---
console.log("\n🎉 Automated setup is complete! 🎉");
console.log("\n➡️  Next Steps: Please follow the manual instructions to finish setup.\n");