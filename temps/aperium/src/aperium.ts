#!/usr/bin/env node
import { execSync } from 'child_process';
import chalk from 'chalk';

const args = process.argv.slice(2);

if (args[0] === 'aper') {
  console.log(
    chalk.yellow('📌 Aper Usage:') + 
    chalk.cyan(" 'aper install <module>'") + 
    chalk.green('\n📖 Description:') + 
    ' Aper allows you to add new modules to your system. It is very easy to use. '
  );
  process.exit(0);
}

if (args[0] === 'naper') {
  console.log(
    chalk.magenta('📌 Naper Usage:') + 
    chalk.blue(" 'naper install <module>'") + 
    chalk.green('\n📖 Description:') + 
    ' Naper is a system compatible with Aper and is used for installing NPM modules in the same way.'
  );
  process.exit(0);
}

if (args.length === 0) {
  console.error(
    chalk.yellow('Aperium, ') + 
    chalk.blue('developed by Aperture Labs.') + 
    chalk.green(' is a product designed to enhance your development process.') + 
    chalk.cyan('\nDescription: ') + 
    'Aperium is designed to simplify your software development workflow. ' +
    'If you are unsure how to use it, please try the following commands:\n' + 
    chalk.yellow('  ➜ ') + chalk.cyan('aperium aper\n') + 
    chalk.yellow('  ➜ ') + chalk.cyan('aperium naper\n')
  );
  process.exit(1);
}

console.error('❌ Error: Invalid command!');
process.exit(1);