#!/usr/bin/env node
import { execSync } from 'child_process';
import chalk from 'chalk';

const args = process.argv.slice(2);

if (args[0] === 'version') {
  console.log("Naper V0.0.1");
  process.exit(0);
}

if (args.length === 0) {
  console.log('\x1b[33mUsage:\x1b[0m naper install <name>\n');
  console.log('\x1b[1mAperture Labs.\x1b[0m');
  process.exit(1);
}

if (args[0] === 'help') {
  console.log("\n" + chalk.bold.blue('📖 NAPER COMMAND GUIDE') + "\n");

  console.log(chalk.yellow('  ➜  ') + chalk.cyan('naper install <module>') + chalk.gray('   # Installs a new module.'));
  console.log(chalk.yellow('  ➜  ') + chalk.cyan('naper version') + chalk.gray('         # Displays the current version.'));
  console.log(chalk.yellow('  ➜  ') + chalk.cyan('naper help') + chalk.gray('            # Shows the help menu.'));
  
  console.log("\n" + chalk.green('For more information: ') + chalk.underline.cyan('https://github.com/yigitkabak/aperium'));
  process.exit(0);
}

if (args[0] === 'install') {
  if (args.length < 2) {
    console.error('❌ Error: Please enter the name of the package you want to install.');
    process.exit(1);
  }

  const packageToInstall = args[1];
  console.log(`🔍 Downloading package: ${packageToInstall}...`);

  try {
    execSync(`npm install ${packageToInstall} --quiet > /dev/null 2>&1`, { stdio: 'ignore' });
    console.log(`✅ ${packageToInstall} was successfully installed.`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ An error occurred: ${error.message}`);
    } else {
      console.error('❌ An unknown error occurred.');
    }
    process.exit(1);
  }

  process.exit(0);
}

console.error('❌ Error: Invalid command!');
process.exit(1);