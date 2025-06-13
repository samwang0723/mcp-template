#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class McpProjectGenerator {
  constructor() {
    this.templateDir = __dirname;
    this.excludeFiles = [
      'create-mcp-project',
      'setup-new-project.js',
      '.git',
      'node_modules',
      'dist',
      '.DS_Store',
      '.env',
    ];
  }

  /**
   * Validates the project name
   */
  validateProjectName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Project name is required');
    }

    if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(name)) {
      throw new Error(
        'Project name must start with a lowercase letter, contain only lowercase letters, numbers, and hyphens, and end with a letter or number'
      );
    }

    if (name.length < 3 || name.length > 50) {
      throw new Error('Project name must be between 3 and 50 characters');
    }
  }

  /**
   * Converts kebab-case to other formats
   */
  formatName(kebabName) {
    const pascalCase = kebabName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    const titleCase = kebabName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const camelCase = kebabName.replace(/-([a-z])/g, g => g[1].toUpperCase());

    return {
      kebab: kebabName,
      pascal: pascalCase,
      title: titleCase,
      camel: camelCase,
      constant: kebabName.toUpperCase().replace(/-/g, '_'),
    };
  }

  /**
   * Copies directory recursively, excluding specified files
   */
  copyDirectory(src, dest, excludeList = []) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);

    for (const item of items) {
      if (excludeList.includes(item)) {
        continue;
      }

      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);

      // Skip if we're trying to copy into ourselves (prevents infinite recursion)
      const srcAbsolute = path.resolve(srcPath);
      const destAbsolute = path.resolve(destPath);

      if (
        destAbsolute.startsWith(srcAbsolute + path.sep) ||
        destAbsolute === srcAbsolute
      ) {
        continue;
      }

      const stat = fs.lstatSync(srcPath);

      if (stat.isDirectory()) {
        this.copyDirectory(srcPath, destPath, excludeList);
      } else if (stat.isFile()) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Updates package.json with new project details
   */
  updatePackageJson(projectDir, nameFormats, description, author) {
    const packagePath = path.join(projectDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    packageJson.name = `mcp-${nameFormats.kebab}`;
    packageJson.description =
      description || `MCP server for ${nameFormats.title}`;
    packageJson.author = author || '';
    packageJson.keywords = ['mcp', nameFormats.kebab];

    // Reset version to 0.1.0 for new project
    packageJson.version = '0.1.0';

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  }

  /**
   * Updates the main server file with new project name
   */
  updateServerCode(projectDir, nameFormats) {
    const indexPath = path.join(projectDir, 'src', 'index.ts');
    let content = fs.readFileSync(indexPath, 'utf8');

    // Update server name
    content = content.replace(
      "name: 'mcp-sample-server'",
      `name: 'mcp-${nameFormats.kebab}-server'`
    );

    // Update tool names (example)
    content = content.replace(
      'sample-function',
      `${nameFormats.camel}-function`
    );

    content = content.replace(
      'Sample function description',
      `${nameFormats.title} function description`
    );

    // Update health check service name
    content = content.replace(
      "service: 'mcp-time-server'",
      `service: 'mcp-${nameFormats.kebab}-server'`
    );

    // Update console log messages
    content = content.replace(
      'MCP Time Server running',
      `MCP ${nameFormats.title} Server running`
    );

    fs.writeFileSync(indexPath, content);
  }

  /**
   * Updates README.md with new project information
   */
  updateReadme(projectDir, nameFormats, description) {
    const readmePath = path.join(projectDir, 'README.md');
    let content = fs.readFileSync(readmePath, 'utf8');

    // Update title
    content = content.replace(
      '# MCP Server Template',
      `# MCP ${nameFormats.title} Server`
    );

    // Update description
    content = content.replace(
      'A production-ready TypeScript template for creating Model Context Protocol (MCP) servers with HTTP transport. This template provides a solid foundation for building scalable, secure, and maintainable MCP servers.',
      description ||
        `A production-ready MCP server for ${nameFormats.title} built with TypeScript and HTTP transport.`
    );

    // Update clone instructions
    content = content.replace(
      'git clone <your-repo-url>',
      `git clone <your-repo-url>\ncd mcp-${nameFormats.kebab}`
    );

    content = content.replace('cd mcp-template', '');

    // Update project structure
    content = content.replace('mcp-template/', `mcp-${nameFormats.kebab}/`);

    // Update tool examples
    content = content.replace('your-tool-name', `${nameFormats.camel}-tool`);

    // Update Docker image name
    content = content.replace(
      'docker build -t mcp-server .',
      `docker build -t mcp-${nameFormats.kebab}-server .`
    );

    content = content.replace(
      'docker run -p 3000:3000 --env-file .env mcp-server',
      `docker run -p 3000:3000 --env-file .env mcp-${nameFormats.kebab}-server`
    );

    fs.writeFileSync(readmePath, content);
  }

  /**
   * Creates a basic .env.example file
   */
  createEnvExample(projectDir) {
    const envContent = `# Server Configuration
PORT=3000
LOG_LEVEL=info

# Add your custom environment variables here
# API_KEY=your_api_key_here
# DATABASE_URL=your_database_url_here
`;

    fs.writeFileSync(path.join(projectDir, '.env.example'), envContent);
  }

  /**
   * Initializes git repository
   */
  initializeGit(projectDir) {
    try {
      execSync('git init', { cwd: projectDir, stdio: 'pipe' });
      execSync('git add .', { cwd: projectDir, stdio: 'pipe' });
      execSync('git commit -m "Initial commit: MCP server template setup"', {
        cwd: projectDir,
        stdio: 'pipe',
      });
      return true;
    } catch (error) {
      console.warn(
        'Warning: Failed to initialize git repository:',
        error.message
      );
      return false;
    }
  }

  /**
   * Main generation method
   */
  async generate(options) {
    const {
      name,
      description,
      author,
      targetDir,
      initGit = true,
      installDeps = false,
    } = options;

    console.log(`🚀 Creating new MCP server project: ${name}`);

    // Validate project name
    this.validateProjectName(name);

    // Format name variations
    const nameFormats = this.formatName(name);

    // Determine target directory
    const projectDir = targetDir || `mcp-${nameFormats.kebab}`;
    const fullProjectPath = path.resolve(projectDir);

    // Check if directory already exists
    if (fs.existsSync(fullProjectPath)) {
      throw new Error(`Directory ${projectDir} already exists`);
    }

    console.log(`📁 Creating project directory: ${projectDir}`);

    // Add the target directory to the exclude list to prevent infinite recursion
    const excludeFiles = [...this.excludeFiles, path.basename(fullProjectPath)];

    // Copy template files
    this.copyDirectory(this.templateDir, fullProjectPath, excludeFiles);

    // Update configuration files
    console.log('⚙️  Updating configuration files...');
    this.updatePackageJson(fullProjectPath, nameFormats, description, author);
    this.updateServerCode(fullProjectPath, nameFormats);
    this.updateReadme(fullProjectPath, nameFormats, description);
    this.createEnvExample(fullProjectPath);

    // Initialize git repository
    if (initGit) {
      console.log('📦 Initializing git repository...');
      this.initializeGit(fullProjectPath);
    }

    // Install dependencies
    if (installDeps) {
      console.log('📥 Installing dependencies...');
      try {
        execSync('npm install', { cwd: fullProjectPath, stdio: 'inherit' });
      } catch (error) {
        console.warn('Warning: Failed to install dependencies:', error.message);
        console.log('You can install them manually by running: npm install');
      }
    }

    console.log('\n✅ Project created successfully!');
    console.log('\n📋 Next steps:');
    console.log(`   cd ${projectDir}`);
    if (!installDeps) {
      console.log('   npm install');
    }
    console.log('   cp .env.example .env');
    console.log('   npm run dev');
    console.log('\n📚 Documentation:');
    console.log(`   📖 README: ${projectDir}/README.md`);
    console.log(`   🛠️  Main server: ${projectDir}/src/index.ts`);
    console.log(`   ⚙️  Config: ${projectDir}/src/config/index.ts`);

    return fullProjectPath;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
🔧 MCP Server Project Generator

Usage:
  node setup-new-project.js <project-name> [options]

Arguments:
  <project-name>    Name of the new MCP server project (kebab-case)

Options:
  --description <desc>    Project description
  --author <name>         Author name
  --target-dir <dir>      Target directory (default: mcp-<project-name>)
  --install-deps          Install npm dependencies automatically
  --no-git               Skip git repository initialization
  --help, -h             Show this help message

Examples:
  node setup-new-project.js weather-service
  node setup-new-project.js task-manager --description "Task management MCP server" --author "John Doe"
  node setup-new-project.js file-processor --target-dir ./my-server --install-deps
`);
    process.exit(0);
  }

  const projectName = args[0];
  let description = '';
  let author = '';
  let targetDir = '';
  let installDeps = false;
  let initGit = true;

  // Parse arguments
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--description':
        description = args[++i];
        break;
      case '--author':
        author = args[++i];
        break;
      case '--target-dir':
        targetDir = args[++i];
        break;
      case '--install-deps':
        installDeps = true;
        break;
      case '--no-git':
        initGit = false;
        break;
    }
  }

  try {
    const generator = new McpProjectGenerator();
    await generator.generate({
      name: projectName,
      description,
      author,
      targetDir,
      installDeps,
      initGit,
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default McpProjectGenerator;
