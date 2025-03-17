#!/usr/bin/env node
import { execSync } from 'child_process';
import chalk from 'chalk';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(chalk.yellow('Usage:') + ' naper install <package-name>\n');
  console.log(chalk.bold('Aperture Labs.'));
  process.exit(1);
}

switch (args[0]) {
  case 'version':
    console.log('Naper v0.0.6');
    break;

  case 'help':
    console.log('\n' + chalk.bold.blue('📖 NAPER COMMAND GUIDE') + '\n');
    console.log(chalk.yellow('  ➜  ') + chalk.cyan('naper install <module>') + chalk.gray('   # Installs a new module.'));
    console.log(chalk.yellow('  ➜  ') + chalk.cyan('naper version') + chalk.gray('         # Displays the current version.'));
    console.log(chalk.yellow('  ➜  ') + chalk.cyan('naper help') + chalk.gray('            # Shows the help menu.'));
    console.log('\n' + chalk.green('For more information: ') + chalk.underline.cyan('https://github.com/yigitkabak/aperium'));
    break;

  case 'install':
  case 'i':
    if (args.length < 2) {
      console.error(chalk.red('❌ Error: Please specify the package name to install.'));
      process.exit(1);
    }

    const packageToInstall = args[1];
    console.log(chalk.cyan(`🔍 Downloading package: ${packageToInstall}...`));

    try {
      execSync(`npm install ${packageToInstall} --silent --quiet > /dev/null 2>&1`);
      console.log(chalk.green(`✅ ${packageToInstall} was successfully installed.`));
    } catch (error) {
      console.error(chalk.red(`❌ Installation failed`));
      process.exit(1);
    }
    break;

  default:
    console.error(chalk.red('❌ Error: Invalid command! Use "naper help" for usage information.'));
    process.exit(1);
}