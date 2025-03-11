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
const version = "v0.0.1";
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
const installTemplate = async (templateName) => {
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
    }
    catch (err) {
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
            }
            catch (err) {
                console.error('🚨 An error occurred:', err);
                process.exit(1);
            }
        }
    }
    catch (err) {
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
    }
    else {
        console.log('🔍 Downloading all templates...');
        installAllTemplates();
    }
    process.exit(0);
}
console.error('❌ Error: Invalid command.');
process.exit(1);
