#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const args = process.argv.slice(2);
if (args[0] === 'aper') {
    console.log(chalk_1.default.yellow('📌 Aper Usage:') +
        chalk_1.default.cyan(" 'aper install <module>'") +
        chalk_1.default.green('\n📖 Description:') +
        ' Aper allows you to add new modules to your system. It is very easy to use. ');
    process.exit(0);
}
if (args[0] === 'naper') {
    console.log(chalk_1.default.magenta('📌 Naper Usage:') +
        chalk_1.default.blue(" 'naper install <module>'") +
        chalk_1.default.green('\n📖 Description:') +
        ' Naper is a system compatible with Aper and is used for installing NPM modules in the same way.');
    process.exit(0);
}
if (args.length === 0) {
    console.error(chalk_1.default.yellow('Aperium, ') +
        chalk_1.default.blue('developed by Aperture Labs.') +
        chalk_1.default.green(' is a product designed to enhance your development process.') +
        chalk_1.default.cyan('\nDescription: ') +
        'Aperium is designed to simplify your software development workflow. ' +
        'If you are unsure how to use it, please try the following commands:\n' +
        chalk_1.default.yellow('  ➜ ') + chalk_1.default.cyan('aperium aper\n') +
        chalk_1.default.yellow('  ➜ ') + chalk_1.default.cyan('aperium naper\n'));
    process.exit(1);
}
console.error('❌ Error: Invalid command!');
process.exit(1);
