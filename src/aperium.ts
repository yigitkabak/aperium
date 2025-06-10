#!/usr/bin/env node
import { execSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const APERIUM_VERSION = '0.0.6';

function createAperiumFile(targetDir: string) {
  const aperiumConfig = {
    version: APERIUM_VERSION,
    created: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(targetDir, '.aperium'),
    JSON.stringify(aperiumConfig, null, 2),
    'utf8'
  );
}

function cloneProject(type: string, source: string) {
  try {
    let repoUrl = source;
    let targetDir = source.split('/').pop()?.replace('.git', '') || 'cloned-repo';
    
    if (type === 'npm') {
      console.log(chalk.blue(`📦 Cloning npm package: ${source}`));
      targetDir = source;
      execSync(`npm pack ${source}`, { stdio: 'inherit' });
      execSync(`tar -xzf ${source}-*.tgz`, { stdio: 'inherit' });
      execSync(`mv package ${source}`, { stdio: 'inherit' });
      execSync(`rm ${source}-*.tgz`);
    } 
    else if (type === 'github') {
      console.log(chalk.blue(`📂 Cloning GitHub repository: ${source}`));
      if (!source.startsWith('https://') && !source.startsWith('git@')) {
        repoUrl = `https://github.com/${source}.git`;
      }
      execSync(`git clone ${repoUrl} ${targetDir}`, { stdio: 'inherit' });
    }

    createAperiumFile(targetDir);
    console.log(chalk.green(`✅ Successfully cloned ${source} to ${targetDir}`));
    console.log(chalk.green(`✅ Created .aperium file with version ${APERIUM_VERSION}`));
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`❌ Error cloning ${source}: ${error.message}`));
    } else {
      console.error(chalk.red(`❌ An unknown error occurred while cloning ${source}`));
    }
    process.exit(1);
  }
}

if (args[0] === 'clone') {
  if (args.length < 3) {
    console.error(chalk.red('❌ Error: Please specify clone type and source'));
    console.error(chalk.cyan('Usage: aperium clone [-npm|-github] <source>'));
    process.exit(1);
  }

  const cloneType = args[1].startsWith('-') ? args[1].slice(1) : args[1];
  const source = args[2];

  if (!['npm', 'github'].includes(cloneType)) {
    console.error(chalk.red('❌ Error: Invalid clone type. Use -npm or -github'));
    process.exit(1);
  }

  cloneProject(cloneType, source);
  process.exit(0);
}

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
    chalk.yellow('  ➜ ') + chalk.cyan('aperium naper\n') +
    chalk.yellow('  ➜ ') + chalk.cyan('aperium clone [-npm|-github] <source>\n')
  );
  process.exit(1);
}

console.error('❌ Error: Invalid command!');
process.exit(1);
