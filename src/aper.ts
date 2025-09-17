#!/usr/bin/env node
import {
  version,
  ENCRYPTION_KEY,
  installTemplateFromDefaultRepo,
  installPackageFromRepo,
  installAllDependencies,
  uninstallPackage,
  createNewApmPackage,
  installFromApmFile,
  viewApmFileContent,
  listPackages,
  runScript,
  createAperiumJson,
  ensureSudo,
  APERIUM_INSTALLED_PACKAGES_DIR,
  DEFAULT_REPO_URL
} from './core.js';
import {
  spawn
} from 'child_process';
import * as path from 'path';

const args = process.argv.slice(2);
const command = args[0];
const value = args[1];

const displayUsage = () => {
  console.log('\nAperium: Modern Package Manager\n');
  console.log('Usage:');
  console.log(`  aper init`);
  console.log(`  aper install [package_name]`);
  console.log(`  aper -m <module_name>`);
  console.log(`  aper -m`);
  console.log(`  aper -um <module_name>`);
  console.log(`  aper -r <template_name>`);
  console.log(`  aper new <package_name>`);
  console.log(`  aper view <file.apm>`);
  console.log(`  aper list`);
  console.log(`  aper run [script_name/file.js]`);
  console.log(`  aper version`);
  console.log(`  aper help`);
  console.log('openbyte. All rights reserved.');
  console.log(`For more info: https://github.com/yigitkabak/aperium`);
};

const displayHelp = () => {
  console.log('\nAPERIUM COMMAND GUIDE\n');
  console.log('Project Initialization:');
  console.log(`  aper init`);
  console.log(`    -> Creates a new aperium.json file to manage project dependencies.\n`);
  console.log(' Package Management:');
  console.log(`  aper install [package_name]`);
  console.log(`    -> Installs a package from the default repository into aperium_modules.`);
  console.log(`    -> If no package name is given, it installs dependencies from aperium.json.`);
  console.log(`  aper install <file.apm>`);
  console.log(`    -> Installs a local .apm package file.\n`);
  console.log(`  aper -m <module_name>`);
  console.log(`    -> A shortcut to install a module from the repository into aperium_modules.`);
  console.log(`    -> It's functionally the same as 'aper install <module_name>'.`);
  console.log(`  aper -m`);
  console.log(`    -> Installs all modules defined in the 'dependencies' section of aperium.json.`);
  console.log(`  aper -um <module_name>`);
  console.log(`    -> Uninstalls a module by deleting it from aperium_modules and removing it from aperium.json.\n`);
  console.log(`  aper list`);
  console.log(`    -> Lists all dependencies defined in aperium.json and installed in aperium_modules.\n`);
  console.log(' Script Runner:');
  console.log(`  aper run [script_name/file.js]`);
  console.log(`    -> Runs a script defined in the "scripts" section of aperium.json.`);
  console.log(`    -> Defaults to the "start" script if no name is provided.`);
  console.log(`    -> You can also provide a direct file path like 'app.js' or 'index.js' to run it without a script definition.\n`);
  console.log(' Repository Template Installation:');
  console.log(`  aper -r <template_name>`);
  console.log(`    -> Downloads and installs a template from the Aperium default repository.\n`);
  console.log(' Creating a New Package:');
  console.log(`  aper new <package_name>`);
  console.log(`    -> Creates a new .apm package with the specified installation scripts/settings.\n`);
  console.log(' Viewing Package Contents:');
  console.log(`  aper view <file.apm>`);
  console.log(`    -> Displays the installation scripts/settings inside an .apm package file.\n`);
  console.log(' Information Commands:');
  console.log(`  aper version`);
  console.log(`    -> Shows the current Aperium version.\n`);
  console.log(`  aper help`);
  console.log(`    -> Displays this help menu.\n`);
  console.log('For more information and examples: https://github.com/yigitkabak/aperium');
  console.log(`Default template repository: ${DEFAULT_REPO_URL}`);
};

const run = async () => {
  try {
    if (command === 'run') {
      await runScript(value);
      return;
    }
    if (command === '-r') {
      if (!value) {
        console.error('Error: Missing template name for repository install.');
        displayUsage();
        process.exit(1);
      }
      await ensureSudo();
      await installTemplateFromDefaultRepo(value);
      return;
    }
    if (command === '-m') {
      if (!value) {
        await installAllDependencies();
      } else {
        await installPackageFromRepo(value);
      }
      return;
    }
    if (command === '-um') {
      if (!value) {
        console.error('Error: Missing module name for uninstall.');
        displayUsage();
        process.exit(1);
      }
      await uninstallPackage(value);
      return;
    }
    switch (command) {
      case 'init':
        await createAperiumJson();
        break;
      case 'install':
        if (!value) {
          await installAllDependencies();
        } else if (value.endsWith('.apm')) {
          await ensureSudo();
          await installFromApmFile(value, ENCRYPTION_KEY, version, APERIUM_INSTALLED_PACKAGES_DIR);
        } else {
          await installPackageFromRepo(value);
        }
        break;
      case 'new':
        if (!value) {
          console.error('Error: Missing package name for new command.');
          displayUsage();
          process.exit(1);
        }
        await createNewApmPackage(value, ENCRYPTION_KEY);
        break;
      case 'view':
        if (!value) {
          console.error('Error: Missing .apm file path for view command.');
          displayUsage();
          process.exit(1);
        }
        await viewApmFileContent(value, ENCRYPTION_KEY);
        break;
      case 'list':
        await listPackages();
        break;
      case 'version':
        console.log(`Aperium version: ${version}`);
        break;
      case 'help':
        displayHelp();
        break;
      default:
        if (command) {
          console.error(`Error: Unknown command "${command}".`);
        }
        displayUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('An unhandled error occurred:', error);
    process.exit(1);
  }
};

run();