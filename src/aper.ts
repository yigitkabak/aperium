#!/usr/bin/env node
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

const args = process.argv.slice(2);
const version = "v0.0.7";

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

const setupAperiumStructure = (targetFolder: string) => {
  try {
    const aperiumFolder = path.join(targetFolder, '.aperium');
    fs.ensureDirSync(aperiumFolder);
    const randomSerial = Math.random().toString(36).substring(2, 10).toUpperCase();
    const aperFile = path.join(aperiumFolder, '.aper');
    const content = `Serial: ${randomSerial}\nAper version: ${version}\n`;
    fs.writeFileSync(aperFile, content);
  } catch (error) {
    console.error(chalk.red('🚨 Error creating .aperium structure:'), error);
    process.exit(1);
  }
};

const installTemplate = async (templateName: string) => {
  try {
    const packageName = 'aperium';
    const packagePath = path.join(process.cwd(), 'node_modules', packageName);
    const templatesDir = path.join(packagePath, 'temps');
    const templatePath = path.join(templatesDir, templateName);
    const targetFolder = path.join(process.cwd(), templateName);
    if (!fs.existsSync(templatesDir)) {
      console.error(chalk.red(`❌ Error: "temps" folder not found in package: ${templatesDir}`));
      process.exit(1);
    }
    if (!fs.existsSync(templatePath)) {
      console.error(chalk.red(`❌ Error: Template "${templateName}" not found in "temps" folder.`));
      process.exit(1);
    }
    if (fs.existsSync(targetFolder)) {
      console.error(chalk.yellow(`⚠️ Error: Target folder "${targetFolder}" already exists. Please use a different name.`));
      process.exit(1);
    }
    fs.ensureDirSync(targetFolder);
    await fs.copy(templatePath, targetFolder);
    console.log(chalk.green(`✅ Template "${templateName}" successfully copied to "${targetFolder}"`));
    setupAperiumStructure(targetFolder);
  } catch (err) {
    console.error(chalk.red('🚨 An error occurred during installation:'), err);
    process.exit(1);
  }
};

const installAllTemplates = async () => {
  try {
    const packageName = 'aperium';
    const packagePath = path.join(process.cwd(), 'node_modules', packageName);
    const templatesDir = path.join(packagePath, 'temps');
    if (!fs.existsSync(templatesDir)) {
      console.error(chalk.red(`❌ Error: "temps" folder not found in package: ${templatesDir}`));
      process.exit(1);
    }
    const files = await fs.readdir(templatesDir);
    for (const templateName of files) {
      const templatePath = path.join(templatesDir, templateName);
      const targetFolder = path.join(process.cwd(), templateName);
      if (fs.existsSync(targetFolder)) {
        console.log(chalk.yellow(`⚠️ "${templateName}" already exists, skipping.`));
        continue;
      }
      fs.ensureDirSync(targetFolder);
      try {
        await fs.copy(templatePath, targetFolder);
        console.log(chalk.green(`✅ Template "${templateName}" successfully copied to "${targetFolder}"`));
        setupAperiumStructure(targetFolder);
      } catch (err) {
        console.error(chalk.red('🚨 An error occurred while copying template:'), err);
        process.exit(1);
      }
    }
  } catch (err) {
    console.error(chalk.red('❌ Error retrieving templates:'), err);
    process.exit(1);
  }
};

const main = async () => {
  if (args.length === 0) {
    displayUsage();
    process.exit(0);
  }
  switch (args[0]) {
    case 'version':
      console.log(`Aper ${version}`);
      process.exit(0);
    case 'help':
      displayHelp();
      process.exit(0);
    case 'install':
    case 'i':
      if (args.length > 1) {
        await installTemplate(args[1]);
      } else {
        console.log(chalk.blue('🔍 Installing all templates...'));
        await installAllTemplates();
      }
      process.exit(0);
    default:
      console.error(chalk.red('❌ Error: Invalid command.'));
      process.exit(1);
  }
};

main();