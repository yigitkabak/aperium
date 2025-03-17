#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log(chalk_1.default.yellow('Usage:') + ' naper install <package-name>\n');
    console.log(chalk_1.default.bold('Aperture Labs.'));
    process.exit(1);
}
switch (args[0]) {
    case 'version':
        console.log('Naper v0.0.5');
        break;
    case 'help':
        console.log('\n' + chalk_1.default.bold.blue('📖 NAPER COMMAND GUIDE') + '\n');
        console.log(chalk_1.default.yellow('  ➜  ') + chalk_1.default.cyan('naper install <module>') + chalk_1.default.gray('   # Installs a new module.'));
        console.log(chalk_1.default.yellow('  ➜  ') + chalk_1.default.cyan('naper version') + chalk_1.default.gray('         # Displays the current version.'));
        console.log(chalk_1.default.yellow('  ➜  ') + chalk_1.default.cyan('naper help') + chalk_1.default.gray('            # Shows the help menu.'));
        console.log('\n' + chalk_1.default.green('For more information: ') + chalk_1.default.underline.cyan('https://github.com/yigitkabak/aperium'));
        break;
    case 'install':
    case 'i':
        if (args.length < 2) {
            console.error(chalk_1.default.red('❌ Error: Please specify the package name to install.'));
            process.exit(1);
        }
        const packageToInstall = args[1];
        console.log(chalk_1.default.cyan(`🔍 Downloading package: ${packageToInstall}...`));
        try {
            (0, child_process_1.execSync)(`npm install ${packageToInstall} --silent --quiet > /dev/null 2>&1`);
            console.log(chalk_1.default.green(`✅ ${packageToInstall} was successfully installed.`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`❌ Installation failed`));
            process.exit(1);
        }
        break;
    default:
        console.error(chalk_1.default.red('❌ Error: Invalid command! Use "naper help" for usage information.'));
        process.exit(1);
}
