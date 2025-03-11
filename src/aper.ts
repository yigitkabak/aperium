#!/usr/bin/env node
import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';

const args = process.argv.slice(2);
const version = "v0.0.1";

const displayUsage = () => {
  console.log('\x1b[33mUsage:\x1b[0m aper install <name>\n');
  console.log('\x1b[1mAperture Labs.\x1b[0m');
};

const displayHelp = () => {
  console.log("\n" + chalk.bold.blue('📖 APER COMMAND GUIDE') + "\n");
  console.log(chalk.yellow('  ➜  ') + chalk.cyan('aper install <module>') + chalk.gray('   # Installs a new module.'));
  console.log(chalk.yellow('  ➜  ') + chalk.cyan('aper version') + chalk.gray('         # Displays the current version.'));
  console.log(chalk.yellow('  ➜  ') + chalk.cyan('aper help') + chalk.gray('            # Shows the help menu.'));
  console.log("\n" + chalk.green('For more information: ') + chalk.underline.cyan('https://github.com/yigitkabak/aperium'));
};

const installTemplate = async (templateName: string) => {
  const packageName = 'aperium';
  const packagePath = path.join(process.cwd(), 'node_modules', packageName);
  const templatesDir = path.join(packagePath, 'temps');
  const templatePath = path.join(templatesDir, templateName);
  const targetFolder = path.join(process.cwd(), templateName);

  if (!fs.existsSync(templatesDir)) {
    console.error(`❌ Error: The "temps" folder inside the package was not found: ${templatesDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Error: Template "${templateName}" was not found in the "temps" folder of the "aperium" module.`);
    process.exit(1);
  }

  if (fs.existsSync(targetFolder)) {
    console.error(`⚠️ Error: "${targetFolder}" already exists. Please use a different name.`);
    process.exit(1);
  }

  fs.ensureDirSync(targetFolder);

  try {
    await fs.copy(templatePath, targetFolder);
    console.log(`✅ "${templateName}" was successfully copied to "${targetFolder}".`);
  } catch (err) {
    console.error('🚨 An error occurred:', err);
    process.exit(1);
  }
};

const installAllTemplates = async () => {
  const packageName = 'aperium';
  const packagePath = path.join(process.cwd(), 'node_modules', packageName);
  const templatesDir = path.join(packagePath, 'temps');

  if (!fs.existsSync(templatesDir)) {
    console.error(`❌ Error: The "temps" folder inside the package was not found: ${templatesDir}`);
    process.exit(1);
  }

  try {
    const files = await fs.readdir(templatesDir);
    for (const templateName of files) {
      const templatePath = path.join(templatesDir, templateName);
      const targetFolder = path.join(process.cwd(), templateName);

      if (fs.existsSync(targetFolder)) {
        console.log(`⚠️ "${templateName}" already exists, skipping.`);
        continue;
      }

      fs.ensureDirSync(targetFolder);

      try {
        await fs.copy(templatePath, targetFolder);
        console.log(`✅ "${templateName}" was successfully copied to "${targetFolder}".`);
      } catch (err) {
        console.error('🚨 An error occurred:', err);
        process.exit(1);
      }
    }
  } catch (err) {
    console.error('❌ Error retrieving templates:', err);
    process.exit(1);
  }
};

if (args.length === 0) {
  displayUsage();
  process.exit(0);
}

if (args[0] === 'version') {
  console.log(`Aper ${version}`);
  process.exit(0);
}

if (args[0] === 'help') {
  displayHelp();
  process.exit(0);
}

if (args[0] === 'install') {
  if (args.length > 1) {
    installTemplate(args[1]);
  } else {
    console.log('🔍 Downloading all templates...');
    installAllTemplates();
  }
  process.exit(0);
}

console.error('❌ Error: Invalid command.');
process.exit(1);