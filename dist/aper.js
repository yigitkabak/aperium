#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const args = process.argv.slice(2);
const version = "v0.0.5";
const displayUsage = () => {
    console.log('\x1b[33mUsage:\x1b[0m aper install <name>\n');
    console.log('\x1b[1mAperture Labs.\x1b[0m');
};
const displayHelp = () => {
    console.log("\n" + chalk_1.default.bold.blue('📖 APER COMMAND GUIDE') + "\n");
    console.log(chalk_1.default.yellow('  ➜  ') + chalk_1.default.cyan('aper install <module>') + chalk_1.default.gray('   # Installs a new module.'));
    console.log(chalk_1.default.yellow('  ➜  ') + chalk_1.default.cyan('aper version') + chalk_1.default.gray('         # Displays the current version.'));
    console.log(chalk_1.default.yellow('  ➜  ') + chalk_1.default.cyan('aper help') + chalk_1.default.gray('            # Shows the help menu.'));
    console.log("\n" + chalk_1.default.green('For more information: ') + chalk_1.default.underline.cyan('https://github.com/yigitkabak/aperium'));
};
const setupAperiumStructure = (targetFolder) => {
    try {
        const aperiumFolder = path.join(targetFolder, '.aperium');
        fs.ensureDirSync(aperiumFolder);
        const randomSerial = Math.random().toString(36).substring(2, 10).toUpperCase();
        const aperFile = path.join(aperiumFolder, '.aper');
        const content = `Serial: ${randomSerial}\nAper version: ${version}\n`;
        fs.writeFileSync(aperFile, content);
    }
    catch (error) {
        console.error(chalk_1.default.red('🚨 Error creating .aperium structure:'), error);
        process.exit(1);
    }
};
const installTemplate = async (templateName) => {
    try {
        const packageName = 'aperium';
        const packagePath = path.join(process.cwd(), 'node_modules', packageName);
        const templatesDir = path.join(packagePath, 'temps');
        const templatePath = path.join(templatesDir, templateName);
        const targetFolder = path.join(process.cwd(), templateName);
        if (!fs.existsSync(templatesDir)) {
            console.error(chalk_1.default.red(`❌ Error: "temps" folder not found in package: ${templatesDir}`));
            process.exit(1);
        }
        if (!fs.existsSync(templatePath)) {
            console.error(chalk_1.default.red(`❌ Error: Template "${templateName}" not found in "temps" folder.`));
            process.exit(1);
        }
        if (fs.existsSync(targetFolder)) {
            console.error(chalk_1.default.yellow(`⚠️ Error: Target folder "${targetFolder}" already exists. Please use a different name.`));
            process.exit(1);
        }
        fs.ensureDirSync(targetFolder);
        await fs.copy(templatePath, targetFolder);
        console.log(chalk_1.default.green(`✅ Template "${templateName}" successfully copied to "${targetFolder}"`));
        setupAperiumStructure(targetFolder);
    }
    catch (err) {
        console.error(chalk_1.default.red('🚨 An error occurred during installation:'), err);
        process.exit(1);
    }
};
const installAllTemplates = async () => {
    try {
        const packageName = 'aperium';
        const packagePath = path.join(process.cwd(), 'node_modules', packageName);
        const templatesDir = path.join(packagePath, 'temps');
        if (!fs.existsSync(templatesDir)) {
            console.error(chalk_1.default.red(`❌ Error: "temps" folder not found in package: ${templatesDir}`));
            process.exit(1);
        }
        const files = await fs.readdir(templatesDir);
        for (const templateName of files) {
            const templatePath = path.join(templatesDir, templateName);
            const targetFolder = path.join(process.cwd(), templateName);
            if (fs.existsSync(targetFolder)) {
                console.log(chalk_1.default.yellow(`⚠️ "${templateName}" already exists, skipping.`));
                continue;
            }
            fs.ensureDirSync(targetFolder);
            try {
                await fs.copy(templatePath, targetFolder);
                console.log(chalk_1.default.green(`✅ Template "${templateName}" successfully copied to "${targetFolder}"`));
                setupAperiumStructure(targetFolder);
            }
            catch (err) {
                console.error(chalk_1.default.red('🚨 An error occurred while copying template:'), err);
                process.exit(1);
            }
        }
    }
    catch (err) {
        console.error(chalk_1.default.red('❌ Error retrieving templates:'), err);
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
            }
            else {
                console.log(chalk_1.default.blue('🔍 Installing all templates...'));
                await installAllTemplates();
            }
            process.exit(0);
        default:
            console.error(chalk_1.default.red('❌ Error: Invalid command.'));
            process.exit(1);
    }
};
main();
