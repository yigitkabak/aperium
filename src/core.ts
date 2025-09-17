#!/usr/bin/env node
import fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { simpleGit } from 'simple-git';
import { spawn, exec } from 'child_process';
import * as crypto from 'crypto';
import inquirer from 'inquirer';
import AdmZip from 'adm-zip';

export const version = "v0.1.0";
export const DEFAULT_REPO_URL = 'https://github.com/yigitkabak/aperium-repo.git';
export const APERIUM_CONFIG_DIR = path.join(os.homedir(), '.aperium');
export const ENCRYPTION_KEY_FILE = path.join(APERIUM_CONFIG_DIR, 'key.enc');
export const APERIUM_INSTALLED_PACKAGES_DIR = path.join(os.homedir(), '.aperium', 'installed_packages');
export const APERIUM_MODULES_DIR = path.join(process.cwd(), 'aperium_modules');
export const IV_LENGTH = 16;

export interface AperiumJson {
  project: {
    name: string;
    version: string;
    description?: string;
    author?: string;
    license?: string;
  };
  main: string;
  dependencies: { [key: string]: string };
  imports?: { [key: string]: string };
  scripts: { [key: string]: string };
}

export interface PackageMeta {
  name: string;
  version: string;
  description: string;
  genericScriptEnc?: string;
  genericScriptHash?: string;
  archScriptEnc?: string;
  archScriptHash?: string;
  debianScriptEnc?: string;
  debianScriptHash?: string;
  nixosPackagesEnc?: string;
  nixosPackagesHash?: string;
}

export let ENCRYPTION_KEY: Buffer;

export const loadOrCreateEncryptionKey = (): Buffer => {
  if (fs.existsSync(ENCRYPTION_KEY_FILE)) {
    try {
      const keyHex = fs.readFileSync(ENCRYPTION_KEY_FILE, 'utf8');
      const keyBuffer = Buffer.from(keyHex, 'hex');
      if (keyBuffer.length !== 32) {
        throw new Error('Saved key is not of valid length.');
      }
      return keyBuffer;
    } catch (error: unknown) {
      console.error(`Error: Problem reading or corrupt encryption key file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Generating a new key. Your old packages might not work with this key.');
      const newKey = crypto.randomBytes(32);
      fs.ensureDirSync(APERIUM_CONFIG_DIR);
      fs.writeFileSync(ENCRYPTION_KEY_FILE, newKey.toString('hex'), { mode: 0o600 });
      console.log(`New encryption key created and saved: ${ENCRYPTION_KEY_FILE}`);
      return newKey;
    }
  } else {
    const newKey = crypto.randomBytes(32);
    fs.ensureDirSync(APERIUM_CONFIG_DIR);
    fs.writeFileSync(ENCRYPTION_KEY_FILE, newKey.toString('hex'), { mode: 0o600 });
    console.log(`New encryption key created and saved: ${ENCRYPTION_KEY_FILE}`);
    return newKey;
  }
};

ENCRYPTION_KEY = loadOrCreateEncryptionKey();

export const encrypt = (text: string, encryptionKey: Buffer): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text: string, encryptionKey: Buffer): string => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift() as string, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export const calculateHash = (content: string): string => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

export const getOS = async (): Promise<string> => {
  return new Promise((resolve) => {
    exec('cat /etc/os-release', (error, stdout, stderr) => {
      if (error || stderr) {
        exec('uname -s', (err, unameStdout) => {
          if (err) {
            resolve('unknown');
          } else {
            const osName = unameStdout.trim().toLowerCase();
            if (osName.includes('linux')) {
              resolve('linux');
            } else {
              resolve(osName);
            }
          }
        });
        return;
      }
      const lines = stdout.split('\n');
      let id = '';
      let idLike = '';
      lines.forEach(line => {
        if (line.startsWith('ID=')) {
          id = line.substring(3).replace(/"/g, '');
        } else if (line.startsWith('ID_LIKE=')) {
          idLike = line.substring(8).replace(/"/g, '');
        }
      });
      if (id === 'debian' || idLike.includes('debian')) {
        resolve('debian');
      } else if (id === 'arch' || idLike.includes('arch')) {
        resolve('arch');
      } else if (id === 'nixos' || idLike.includes('nixos')) {
        resolve('nixos');
      } else {
        if (id) {
          console.log(`Warning: Specific scripts for ID "${id}" are not available. Attempting generic approach.`);
          resolve(id);
        } else {
          resolve('unknown');
        }
      }
    });
  });
};

export const executeScriptContent = async (scriptContent: string, templateName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!scriptContent.trim()) {
      console.log(`Script content to run for "${templateName}" is empty.`);
      resolve();
      return;
    }
    const isTermux = process.env.TERMUX_VERSION !== undefined;
    let command = 'bash';
    let args: string[] = [];
    if (!isTermux) {
      command = 'sudo';
      args.push('bash');
    }
    scriptContent = scriptContent.replace(/apt install/g, 'apt install -y');
    scriptContent = scriptContent.replace(/pacman -S/g, 'pacman -S --noconfirm');
    scriptContent = scriptContent.replace(/dnf install/g, 'dnf install -y');
    scriptContent = scriptContent.replace(/yum install/g, 'yum install -y');
    scriptContent = scriptContent.replace(/zypper install/g, 'zypper install -y');
    console.log(`Running installation script for "${templateName}"... Please wait...`);
    const tempScriptPath = path.join(os.tmpdir(), `aper_script_${Date.now()}.sh`);
    try {
      fs.writeFileSync(tempScriptPath, scriptContent, { mode: 0o755 });
      args.push(tempScriptPath);
      const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], shell: false });
      let stdoutBuffer = '';
      let stderrBuffer = '';
      const progressInterval = setInterval(() => process.stdout.write('.'), 500);
      child.stdout?.on('data', (data) => stdoutBuffer += data.toString());
      child.stderr?.on('data', (data) => {
        stderrBuffer += data.toString();
        process.stdout.write('!');
      });
      child.on('close', (code: number) => {
        clearInterval(progressInterval);
        fs.removeSync(tempScriptPath);
        if (code !== 0) {
          console.log(`\n"${templateName}" installation exited with code ${code}.`);
          if (stderrBuffer) {
            console.error('Error Output (stderr, first 1KB):');
            console.error(stderrBuffer.substring(0, 1024) + (stderrBuffer.length > 1024 ? '...' : ''));
          }
          reject(new Error(`Installation "${templateName}" failed.`));
        } else {
          console.log(`\nInstallation script for "${templateName}" completed successfully.`);
          resolve();
        }
      });
      child.on('error', (err) => {
        clearInterval(progressInterval);
        fs.removeSync(tempScriptPath);
        console.error(`An unexpected error occurred while running "${templateName}" installation script:`, err);
        reject(err);
      });
    } catch (execError: unknown) {
      fs.removeSync(tempScriptPath);
      console.error(`Could not run "${templateName}" installation script:`, execError instanceof Error ? execError.message : 'Unknown error');
      reject(execError);
    }
  });
};

export const runSudoCommand = async (command: string, args: string[], message: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const isTermux = process.env.TERMUX_VERSION !== undefined;
    if (isTermux) {
      console.log(`Termux environment detected. Attempting to run command directly: ${command} ${args.join(' ')}`);
      const child = spawn(command, args, { stdio: 'inherit' });
      child.on('close', (code: number) => code !== 0 ? reject(new Error(`Command failed with code ${code}: ${command} ${args.join(' ')}`)) : resolve());
      child.on('error', (err) => reject(new Error(`Failed to run command directly in Termux: ${err.message}`)));
      return;
    }
    console.log(message);
    const child = spawn('sudo', [command, ...args], { stdio: 'inherit' });
    child.on('close', (code: number) => code !== 0 ? reject(new Error(`Command failed with code ${code}: sudo ${command} ${args.join(' ')}`)) : resolve());
    child.on('error', (err) => reject(new Error(`Failed to run sudo command: ${err.message}`)));
  });
};

export const applyNixOSConfiguration = async (packageListString: string, templateName: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    if (!packageListString.trim()) {
      console.log(`NixOS package list for "${templateName}" is empty.`);
      resolve();
      return;
    }
    const nixConfigPath = '/etc/nixos/configuration.nix';
    const aperiumModulesDir = '/etc/nixos/aperium-modules';
    try {
      console.log('Aperium needs administrative privileges to set up NixOS modules.');
      await runSudoCommand('mkdir', ['-p', aperiumModulesDir], `Ensuring module directory exists: ${aperiumModulesDir}`);
    } catch (error) {
      console.error(`Error ensuring module directory ${aperiumModulesDir}:`, error);
      reject(new Error(`Failed to create module directory.`));
      return;
    }
    const backupPath = `${nixConfigPath}.bak_aper_${Date.now()}`;
    try {
      await runSudoCommand('cp', [nixConfigPath, backupPath], `Backing up existing ${nixConfigPath} to ${backupPath}...`);
      console.log(`Backed up existing ${nixConfigPath} to ${backupPath}`);
    } catch (error) {
      console.error(`Error backing up ${nixConfigPath}:`, error);
      reject(new Error(`Failed to back up ${nixConfigPath}.`));
      return;
    }
    const moduleFileName = `${templateName}-packages.nix`;
    const modulePath = path.join(aperiumModulesDir, moduleFileName);
    const packages = packageListString.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
    const packagesNixFormat = packages.join('\n    ');
    const moduleContent = `{ config, pkgs, ... }:\n\n{\n  environment.systemPackages = with pkgs; [\n    ${packagesNixFormat}\n  ];\n}\n`;
    try {
      console.log(`Creating NixOS module for "${templateName}" at ${modulePath}.`);
      const tempModulePath = path.join(os.tmpdir(), moduleFileName);
      fs.writeFileSync(tempModulePath, moduleContent);
      await runSudoCommand('mv', [tempModulePath, modulePath], `Moving module to ${modulePath}...`);
      console.log(`Created NixOS module for "${templateName}" at ${modulePath}.`);
    } catch (error) {
      console.error(`Error creating NixOS module for "${templateName}":`, error);
      reject(new Error(`Failed to create NixOS module.`));
      return;
    }
    let currentConfigContent = await fs.readFile(nixConfigPath, 'utf8');
    const importStatement = `\n  ./aperium-modules/${moduleFileName}`;
    if (!currentConfigContent.includes(importStatement)) {
      const importRegex = /(imports\s*=\s*\[)([\s\S]*?)(\]\s*;)/;
      const match = currentConfigContent.match(importRegex);
      if (match) {
        const newImportsContent = `${match[2]}${importStatement}\n  `;
        currentConfigContent = currentConfigContent.replace(importRegex, `${match[1]}${newImportsContent}${match[3]}`);
        console.log(`Added import for "${moduleFileName}" to ${nixConfigPath}.`);
      } else {
        const openingBraceIndex = currentConfigContent.indexOf('{');
        if (openingBraceIndex !== -1) {
          currentConfigContent = currentConfigContent.substring(0, openingBraceIndex + 1) + `\n\n  imports = [\n    ./hardware-configuration.nix\n    ${importStatement}\n  ];\n` + currentConfigContent.substring(openingBraceIndex + 1);
        } else {
          currentConfigContent = `{ config, pkgs, ... }:\n\n{\n  imports = [\n    ./hardware-configuration.nix\n    ${importStatement}\n  ];\n\n${currentConfigContent}\n}\n`;
        }
        console.log(`Warning: No existing 'imports' block found. Attempting to add a new one to ${nixConfigPath}.`);
      }
      try {
        const tempNixConfigPath = path.join(os.tmpdir(), 'configuration.nix.tmp');
        fs.writeFileSync(tempNixConfigPath, currentConfigContent);
        await runSudoCommand('mv', [tempNixConfigPath, nixConfigPath], `Moving updated configuration to ${nixConfigPath}...`);
      } catch (error) {
        console.error(`Error updating ${nixConfigPath} with import: `, error);
        reject(new Error(`Failed to update main configuration.nix.`));
        return;
      }
    } else {
      console.log(`Import for "${moduleFileName}" already exists in ${nixConfigPath}.`);
    }
    const answers = await inquirer.prompt([{
      type: 'confirm',
      name: 'rebuildNixos',
      message: 'Do you want to rebuild your system now?',
      default: true,
    }]);
    if (answers.rebuildNixos) {
      console.log('Rebuilding NixOS system... This may take a while.');
      const child = spawn('sudo', ['-E', 'nixos-rebuild', 'switch'], { stdio: 'inherit', shell: false });
      child.on('close', (code: number) => code !== 0 ? reject(new Error(`NixOS rebuild failed.`)) : resolve());
      child.on('error', (err) => reject(new Error(`An unexpected error occurred during NixOS rebuild: ${err}`)));
    } else {
      console.log('NixOS rebuild skipped. Remember to run `sudo nixos-rebuild switch`.');
      resolve();
    }
  });
};

export const registerInstalledPackage = async (packageName: string, packageHash: string, aperiumVersion: string, installedPackagesDir: string) => {
  const packageRecordPath = path.join(installedPackagesDir, `${packageName}.json`);
  const record = { name: packageName, hash: packageHash, installedAt: new Date().toISOString(), version: aperiumVersion };
  const recordContent = JSON.stringify(record, null, 2);
  try {
    await runSudoCommand('mkdir', ['-p', installedPackagesDir], `Ensuring package record directory exists: ${installedPackagesDir}`);
    const tempRecordPath = path.join(os.tmpdir(), `${packageName}.json.tmp`);
    fs.writeFileSync(tempRecordPath, recordContent);
    await runSudoCommand('mv', [tempRecordPath, packageRecordPath], `Moving package record to ${packageRecordPath}...`);
    console.log(`Package "${packageName}" installation recorded.`);
  } catch (error) {
    console.error(`Error recording installed package "${packageName}":`, error);
  }
};

export const createNewApmPackage = async (packageName: string, encryptionKey: Buffer) => {
  const outputApmFile = path.join(process.cwd(), `${packageName}.apm`);
  if (fs.existsSync(outputApmFile)) {
    console.error(`Error: A file named "${packageName}.apm" already exists.`);
    process.exit(1);
  }
  console.log(`Creating a new .apm package named "${packageName}"...`);
  const creationTypeAnswer = await inquirer.prompt([{
    type: 'list',
    name: 'scriptType',
    message: 'Would you like to provide a generic bash script or distribution-specific commands?',
    choices: [{ name: 'Generic Bash Script (for all Linux)', value: 'generic' }, { name: 'Distribution-Specific Commands (Arch, Debian, NixOS)', value: 'specific' }],
    default: 'specific'
  }]);
  let answers: any = {};
  if (creationTypeAnswer.scriptType === 'generic') {
    answers = await inquirer.prompt([{ type: 'input', name: 'genericScript', message: 'Enter the generic bash installation script (can be left blank):', default: '' }]);
  } else {
    answers = await inquirer.prompt([{ type: 'input', name: 'archScript', message: 'Enter installation commands for Arch Linux (can be left blank):', default: '' }, { type: 'input', name: 'debianScript', message: 'Enter installation commands for Debian/Ubuntu (can be left blank):', default: '' }, { type: 'input', name: 'nixosPackages', message: 'Enter NixOS packages to install (comma-separated, e.g., neofetch, git - can be left blank):', default: '' }]);
  }
  const zip = new AdmZip();
  try {
    const packageMeta: PackageMeta = { name: packageName, version: "1.0.0", description: 'Aperium Package' };
    if (creationTypeAnswer.scriptType === 'generic' && answers.genericScript) {
      packageMeta.genericScriptEnc = encrypt(answers.genericScript, encryptionKey);
      packageMeta.genericScriptHash = calculateHash(answers.genericScript);
    } else if (creationTypeAnswer.scriptType === 'specific') {
      if (answers.archScript) {
        packageMeta.archScriptEnc = encrypt(answers.archScript, encryptionKey);
        packageMeta.archScriptHash = calculateHash(answers.archScript);
      }
      if (answers.debianScript) {
        packageMeta.debianScriptEnc = encrypt(answers.debianScript, encryptionKey);
        packageMeta.debianScriptHash = calculateHash(answers.debianScript);
      }
      if (answers.nixosPackages) {
        packageMeta.nixosPackagesEnc = encrypt(answers.nixosPackages, encryptionKey);
        packageMeta.nixosPackagesHash = calculateHash(answers.nixosPackages);
      }
    }
    zip.addFile('package.json', Buffer.from(JSON.stringify(packageMeta, null, 2)));
    zip.writeZip(outputApmFile);
    console.log(`"${packageName}.apm" package successfully created: ${outputApmFile}`);
  } catch (error: unknown) {
    console.error('An error occurred while creating the package:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
};

export const installFromApmFile = async (apmFilePath: string, encryptionKey: Buffer, aperiumVersion: string, installedPackagesDir: string) => {
  if (!fs.existsSync(apmFilePath) || !apmFilePath.toLowerCase().endsWith('.apm')) {
    console.error(`Error: .apm file not found or invalid extension: "${apmFilePath}".`);
    process.exit(1);
  }
  const tempExtractDir = path.join(os.tmpdir(), `aperium_apm_temp_extract_${Date.now()}`);
  let packageMeta: PackageMeta;
  try {
    fs.ensureDirSync(tempExtractDir);
    const zip = new AdmZip(apmFilePath);
    zip.extractAllTo(tempExtractDir, true);
    console.log(`"${apmFilePath}" successfully extracted.`);
    const packageMetaPath = path.join(tempExtractDir, 'package.json');
    if (!fs.existsSync(packageMetaPath)) {
      console.error(`Error: 'package.json' file not found in .apm package. Invalid package.`);
      process.exit(1);
    }
    packageMeta = JSON.parse(fs.readFileSync(packageMetaPath, 'utf8'));
    let scriptToExecuteEnc = null;
    let scriptToExecuteHash = null;
    let scriptNameForLog = 'unknown script';
    let scriptContent = null;
    let nixosPackagesContent = null;
    if (packageMeta.genericScriptEnc) {
      scriptToExecuteEnc = packageMeta.genericScriptEnc;
      scriptToExecuteHash = packageMeta.genericScriptHash;
      scriptNameForLog = 'Generic Bash installation script';
      console.log(`Found generic Bash script.`);
    } else {
      const osType = await getOS();
      if (osType === 'arch' && packageMeta.archScriptEnc) {
        scriptToExecuteEnc = packageMeta.archScriptEnc;
        scriptToExecuteHash = packageMeta.archScriptHash;
        scriptNameForLog = 'Arch installation script';
        console.log(`System detected as Arch-based.`);
      } else if (osType === 'debian' && packageMeta.debianScriptEnc) {
        scriptToExecuteEnc = packageMeta.debianScriptEnc;
        scriptToExecuteHash = packageMeta.debianScriptHash;
        scriptNameForLog = 'Debian installation script';
        console.log(`System detected as Debian-based.`);
      } else if (osType === 'nixos' && packageMeta.nixosPackagesEnc) {
        scriptToExecuteEnc = packageMeta.nixosPackagesEnc;
        scriptToExecuteHash = packageMeta.nixosPackagesHash;
        scriptNameForLog = 'NixOS package list';
        nixosPackagesContent = decrypt(scriptToExecuteEnc, encryptionKey);
        console.log(`System detected as NixOS.`);
      } else {
        console.log(`Warning: No suitable or generic installation script found for detected system (${osType}).`);
      }
    }
    if (scriptToExecuteEnc) {
      if (scriptNameForLog !== 'NixOS package list') {
        const decryptedScript = decrypt(scriptToExecuteEnc, encryptionKey);
        if (calculateHash(decryptedScript) !== scriptToExecuteHash) {
          console.error(`Error: Installation script could not be verified! Hash mismatch.`);
          process.exit(1);
        }
        console.log(`${scriptNameForLog} successfully verified.`);
        await executeScriptContent(decryptedScript, packageMeta.name);
      } else if (nixosPackagesContent) {
        if (calculateHash(nixosPackagesContent) !== scriptToExecuteHash) {
          console.error(`Error: NixOS package list could not be verified! Hash mismatch.`);
          process.exit(1);
        }
        console.log(`${scriptNameForLog} successfully verified.`);
        await applyNixOSConfiguration(nixosPackagesContent, packageMeta.name);
      }
    } else {
      console.log(`No executable script found in "${packageMeta.name}" package.`);
    }
    const packageCombinedHash = calculateHash((packageMeta.archScriptEnc || '') + (packageMeta.debianScriptEnc || '') + (packageMeta.nixosPackagesEnc || '') + (packageMeta.genericScriptEnc || ''));
    await registerInstalledPackage(packageMeta.name, packageCombinedHash, aperiumVersion, installedPackagesDir);
  } catch (error: unknown) {
    console.error('An error occurred during installation from .apm file:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  } finally {
    if (fs.existsSync(tempExtractDir)) {
      fs.removeSync(tempExtractDir);
    }
  }
};

export const viewApmFileContent = async (apmFilePath: string, encryptionKey: Buffer) => {
  if (!fs.existsSync(apmFilePath) || !apmFilePath.toLowerCase().endsWith('.apm')) {
    console.error(`Error: .apm file not found or invalid extension: "${apmFilePath}".`);
    process.exit(1);
  }
  const tempExtractDir = path.join(os.tmpdir(), `aperium_apm_temp_extract_view_${Date.now()}`);
  let packageMeta: PackageMeta;
  try {
    fs.ensureDirSync(tempExtractDir);
    const zip = new AdmZip(apmFilePath);
    zip.extractAllTo(tempExtractDir, true);
    const packageMetaPath = path.join(tempExtractDir, 'package.json');
    if (!fs.existsSync(packageMetaPath)) {
      console.error(`Error: 'package.json' file not found in .apm package. Invalid package.`);
      process.exit(1);
    }
    packageMeta = JSON.parse(fs.readFileSync(packageMetaPath, 'utf8'));
    console.log(`\nPackage Name: ${packageMeta.name}`);
    console.log(`Package Version: ${packageMeta.version}`);
    console.log(`Description: ${packageMeta.description || 'None'}\n`);
    if (packageMeta.genericScriptEnc) {
      try {
        const decryptedScript = decrypt(packageMeta.genericScriptEnc, encryptionKey);
        if (calculateHash(decryptedScript) === packageMeta.genericScriptHash) {
          console.log('--- Generic Bash Installation Script ---\n' + decryptedScript + '\n----------------------------------------\n');
        } else {
          console.error('Warning: Generic script hash verification failed. Script may have been tampered with.');
        }
      } catch (e: unknown) {
        console.error('Failed to decrypt or malformed generic script:', e instanceof Error ? e.message : 'Unknown error');
      }
    } else {
      console.log('No generic bash installation script found.\n');
    }
    if (packageMeta.debianScriptEnc) {
      try {
        const decryptedScript = decrypt(packageMeta.debianScriptEnc, encryptionKey);
        if (calculateHash(decryptedScript) === packageMeta.debianScriptHash) {
          console.log('--- Debian/Ubuntu Installation Script ---\n' + decryptedScript + '\n-----------------------------------------\n');
        } else {
          console.error('Warning: Debian script hash verification failed. Script may have been tampered with.');
        }
      } catch (e: unknown) {
        console.error('Failed to decrypt or malformed Debian script:', e instanceof Error ? e.message : 'Unknown error');
      }
    } else {
      console.log('No installation script found for Debian/Ubuntu.\n');
    }
    if (packageMeta.archScriptEnc) {
      try {
        const decryptedScript = decrypt(packageMeta.archScriptEnc, encryptionKey);
        if (calculateHash(decryptedScript) === packageMeta.archScriptHash) {
          console.log('--- Arch Linux Installation Script ---\n' + decryptedScript + '\n--------------------------------------\n');
        } else {
          console.error('Warning: Arch script hash verification failed. Script may have been tampered with.');
        }
      } catch (e: unknown) {
        console.error('Failed to decrypt or malformed Arch script:', e instanceof Error ? e.message : 'Unknown error');
      }
    } else {
      console.log('No installation script found for Arch Linux.\n');
    }
    if (packageMeta.nixosPackagesEnc) {
      try {
        const decryptedPackages = decrypt(packageMeta.nixosPackagesEnc, encryptionKey);
        if (calculateHash(decryptedPackages) === packageMeta.nixosPackagesHash) {
          console.log('--- NixOS Package List ---\n' + decryptedPackages + '\n--------------------------\n');
        } else {
          console.error('Warning: NixOS package list hash verification failed. Data may have been tampered with.');
        }
      } catch (e: unknown) {
        console.error('Failed to decrypt or malformed NixOS package list:', e instanceof Error ? e.message : 'Unknown error');
      }
    } else {
      console.log('No NixOS package list found.\n');
    }
  } catch (error: unknown) {
    console.error('An error occurred while viewing .apm file content:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  } finally {
    if (fs.existsSync(tempExtractDir)) {
      fs.removeSync(tempExtractDir);
    }
  }
};

export const setupAperiumStructure = (targetFolder: string) => {
  try {
    const aperiumFolder = path.join(targetFolder, '.aperium');
    fs.ensureDirSync(aperiumFolder);
    const randomSerial = Math.random().toString(36).substring(2, 10).toUpperCase();
    const aperFile = path.join(aperiumFolder, '.aper');
    const content = `Serial: ${randomSerial}\nAper version: ${version}\n`;
    fs.writeFileSync(aperFile, content);
    console.log(`Aperium structure successfully created: ${aperiumFolder}`);
  } catch (error) {
    console.error('Error creating Aperium structure:', error);
    process.exit(1);
  }
};

export const executeLegacySetupScript = async (scriptPath: string, templateName: string): Promise<void> => {
  if (fs.existsSync(scriptPath)) {
    console.log(`Installation script found for template "${templateName}": ${path.basename(scriptPath)}`);
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    return new Promise((resolve, reject) => {
      const child = spawn('sudo', ['bash', '-c', scriptContent], { stdio: 'inherit', shell: true });
      child.on('close', (code: number) => code === 0 ? resolve() : reject(new Error(`Legacy script failed with code ${code}`)));
      child.on('error', reject);
    });
  } else {
    console.log(`Specified installation script (${path.basename(scriptPath)}) not found for "${templateName}".`);
  }
};

export const installTemplateFromDefaultRepo = async (templateName: string) => {
  const repoName = DEFAULT_REPO_URL.split('/').pop()?.replace('.git', '') || 'cloned_repo';
  const tempCloneRoot = path.join(os.tmpdir(), `.aperium_repo_temp_clone_${Date.now()}`);
  const clonePath = path.join(tempCloneRoot, repoName);
  try {
    const git = simpleGit({ baseDir: os.tmpdir(), binary: 'git', maxConcurrentProcesses: 6 });
    if (fs.existsSync(clonePath)) {
      fs.removeSync(clonePath);
    }
    fs.ensureDirSync(tempCloneRoot);
    console.log(`Cloning repository: ${DEFAULT_REPO_URL}`);
    await git.clone(DEFAULT_REPO_URL, clonePath);
    console.log(`Repository successfully cloned to a temporary location.`);
    const repoPacksDir = path.join(clonePath, 'repo', 'packs');
    const sourceTemplatePath = path.join(repoPacksDir, templateName);
    const targetFolder = path.join(process.cwd(), templateName);
    if (!fs.existsSync(sourceTemplatePath)) {
      console.error(`Error: Template "${templateName}" not found in the repository's "packs" folder.`);
      process.exit(1);
    }
    await fs.copy(sourceTemplatePath, targetFolder);
    console.log(`"${templateName}" template successfully copied to: ${targetFolder}`);
    setupAperiumStructure(targetFolder);
    const setupScriptPath = path.join(targetFolder, 'setup.sh');
    await executeLegacySetupScript(setupScriptPath, templateName);
  } catch (error) {
    console.error('An error occurred during installation from repository:', error);
    process.exit(1);
  } finally {
    if (fs.existsSync(tempCloneRoot)) {
      fs.removeSync(tempCloneRoot);
    }
  }
};

export const ensureSudo = async (): Promise<void> => {
  if (process.env.TERMUX_VERSION !== undefined) {
    console.log('Termux environment detected. Sudo is not required.');
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    console.log('Aperium needs administrator (sudo) privileges for this operation.');
    console.log('You may be prompted for your password.');
    const child = spawn('sudo', ['-v'], { stdio: 'inherit' });
    child.on('close', (code: number) => code === 0 ? resolve() : reject(new Error('Sudo access denied.')));
    child.on('error', (err) => reject(err));
  });
};

export const createAperiumJson = async () => {
  console.log('This utility will walk you through creating an aperium.json file.');
  const answers = await inquirer.prompt([{
    type: 'input',
    name: 'projectName',
    message: 'Project Name:',
    default: path.basename(process.cwd()),
  }, {
    type: 'input',
    name: 'projectVersion',
    message: 'Version:',
    default: '1.0.0',
  }, {
    type: 'input',
    name: 'description',
    message: 'Description:',
  }, {
    type: 'input',
    name: 'author',
    message: 'Author:',
  }, {
    type: 'input',
    name: 'mainFile',
    message: 'Main entry point (e.g., index.js):',
    default: 'app.js',
  }, ]);
  const aperiumJsonContent: AperiumJson = {
    project: {
      name: answers.projectName,
      version: answers.projectVersion,
      description: answers.description,
      author: answers.author,
      license: 'GPL-3.0-or-later',
    },
    main: answers.mainFile,
    dependencies: {},
    imports: {},
    scripts: {
      start: `node ${answers.mainFile}`
    },
  };
  const filePath = path.join(process.cwd(), 'aperium.json');
  if (fs.existsSync(filePath)) {
    console.error('Error: aperium.json file already exists.');
    return;
  }
  fs.writeFileSync(filePath, JSON.stringify(aperiumJsonContent, null, 2));
  console.log('aperium.json file successfully created.');
};

export const installPackageFromRepo = async (packageName: string) => {
  const aperiumJsonPath = path.join(process.cwd(), 'aperium.json');
  if (!fs.existsSync(aperiumJsonPath)) {
    console.error('Error: aperium.json file not found. Please run `aper init` first.');
    process.exit(1);
  }
  try {
    const aperiumJson: AperiumJson = JSON.parse(fs.readFileSync(aperiumJsonPath, 'utf8'));
    const tempCloneRoot = path.join(os.tmpdir(), `.aperium_install_clone_${Date.now()}`);
    const clonePath = path.join(tempCloneRoot, 'repo');
    await simpleGit().clone(DEFAULT_REPO_URL, clonePath);
    console.log(`Repository cloned.`);
    const modulesRepoPath = path.join(clonePath, 'modules');
    const packageSourcePath = path.join(modulesRepoPath, packageName);
    if (!fs.existsSync(packageSourcePath)) {
      console.error(`Error: Package "${packageName}" not found in the repository.`);
      fs.removeSync(tempCloneRoot);
      process.exit(1);
    }
    fs.ensureDirSync(APERIUM_MODULES_DIR);
    const packageDestPath = path.join(APERIUM_MODULES_DIR, packageName);
    await fs.copy(packageSourcePath, packageDestPath);
    const NODE_MODULES_DIR = path.join(process.cwd(), 'node_modules');
    fs.ensureDirSync(NODE_MODULES_DIR);
    const symlinkPath = path.join(NODE_MODULES_DIR, packageName);
    const relativePathToPackage = path.relative(path.dirname(symlinkPath), packageDestPath);
    if (fs.existsSync(symlinkPath)) {
      fs.removeSync(symlinkPath);
    }
    fs.symlinkSync(relativePathToPackage, symlinkPath, 'dir');
    console.log(`Created symlink for "${packageName}" in node_modules.`);
    const moduleJsonPath = path.join(packageDestPath, 'module.json');
    const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
    const packageVersion = moduleJson.version || '0.0.0';
    aperiumJson.dependencies[packageName] = packageVersion;
    fs.writeFileSync(aperiumJsonPath, JSON.stringify(aperiumJson, null, 2));
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    let packageJson: any;
    if (fs.existsSync(packageJsonPath)) {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } else {
      console.log('No package.json found. Creating a new one.');
      packageJson = {
        name: path.basename(process.cwd()),
        version: '1.0.0',
        description: '',
        main: 'app.js',
        scripts: {},
        author: '',
        license: 'ISC',
        dependencies: {}
      };
    }
    packageJson.type = "module";
    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }
    packageJson.dependencies[packageName] = `file:./aperium_modules/${packageName}`;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Added "${packageName}" to package.json for npm compatibility.`);
    console.log(`"${packageName}@${packageVersion}" successfully installed.`);
    fs.removeSync(tempCloneRoot);
  } catch (error) {
    console.error(`Error: An issue occurred while installing package "${packageName}".`, error);
    process.exit(1);
  }
};

export const installAllDependencies = async () => {
  const aperiumJsonPath = path.join(process.cwd(), 'aperium.json');
  if (!fs.existsSync(aperiumJsonPath)) {
    console.error('Error: aperium.json file not found. Please run `aper init` first.');
    process.exit(1);
  }
  const aperiumJson: AperiumJson = JSON.parse(fs.readFileSync(aperiumJsonPath, 'utf8'));
  const dependencies = aperiumJson.dependencies;
  if (Object.keys(dependencies).length === 0) {
    console.log('No dependencies found in aperium.json to install.');
    return;
  }
  console.log('Installing all dependencies from aperium.json...');
  for (const packageName of Object.keys(dependencies)) {
    await installPackageFromRepo(packageName);
  }
  console.log('All dependencies installed successfully.');
};

export const uninstallPackage = async (packageName: string) => {
  const aperiumJsonPath = path.join(process.cwd(), 'aperium.json');
  if (!fs.existsSync(aperiumJsonPath)) {
    console.error('Error: aperium.json file not found. Cannot uninstall.');
    process.exit(1);
  }
  try {
    const aperiumJson: AperiumJson = JSON.parse(fs.readFileSync(aperiumJsonPath, 'utf8'));
    if (!aperiumJson.dependencies[packageName]) {
      console.error(`Error: Package "${packageName}" is not listed in aperium.json.`);
      process.exit(1);
    }
    const packageModulePath = path.join(APERIUM_MODULES_DIR, packageName);
    if (fs.existsSync(packageModulePath)) {
      fs.removeSync(packageModulePath);
      console.log(`Module folder for "${packageName}" removed.`);
    } else {
      console.log(`Module folder for "${packageName}" not found, skipping removal.`);
    }
    const symlinkPath = path.join(process.cwd(), 'node_modules', packageName);
    if (fs.existsSync(symlinkPath)) {
      fs.removeSync(symlinkPath);
      console.log(`Symlink for "${packageName}" removed from node_modules.`);
    }
    delete aperiumJson.dependencies[packageName];
    fs.writeFileSync(aperiumJsonPath, JSON.stringify(aperiumJson, null, 2));
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.dependencies && packageJson.dependencies[packageName]) {
        delete packageJson.dependencies[packageName];
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log(`Removed "${packageName}" from package.json.`);
      }
    }
    console.log(`Package "${packageName}" successfully uninstalled.`);
  } catch (error) {
    console.error(`Error: An issue occurred while uninstalling package "${packageName}".`, error);
    process.exit(1);
  }
};

export const listPackages = async () => {
  const aperiumJsonPath = path.join(process.cwd(), 'aperium.json');
  if (!fs.existsSync(aperiumJsonPath)) {
    console.error('Error: aperium.json file not found. Please run `aper init` first.');
    process.exit(1);
  }
  const aperiumJson: AperiumJson = JSON.parse(fs.readFileSync(aperiumJsonPath, 'utf8'));
  if (Object.keys(aperiumJson.dependencies).length === 0) {
    console.log('No dependencies are installed for this project.');
    return;
  }
  console.log('Project Dependencies:');
  for (const [name, version] of Object.entries(aperiumJson.dependencies)) {
    console.log(`  - ${name}@${version}`);
  }
};

export const runScript = async (scriptToRun: string | undefined) => {
  const aperiumJsonPath = path.join(process.cwd(), 'aperium.json');
  if (!fs.existsSync(aperiumJsonPath)) {
    console.error('Error: aperium.json file not found. Please run `aper init` first.');
    process.exit(1);
  }
  const aperiumJson: AperiumJson = JSON.parse(fs.readFileSync(aperiumJsonPath, 'utf8'));
  let commandToExecute = '';
  const finalScriptToRun = scriptToRun || 'start';
  if (finalScriptToRun.endsWith('.js') || finalScriptToRun.endsWith('.ts')) {
    commandToExecute = `node ${finalScriptToRun}`;
  } else {
    const script = aperiumJson.scripts?.[finalScriptToRun];
    if (!script) {
      console.error(`Error: No script named "${finalScriptToRun}" found in aperium.json.`);
      process.exit(1);
    }
    commandToExecute = script;
  }
  const commandParts = commandToExecute.split(' ');
  const executable = commandParts.shift();
  const finalArgs = commandParts;
  if (!executable) {
    console.error('Error: No executable command specified.');
    process.exit(1);
  }
  const child = spawn(executable, finalArgs, { stdio: 'inherit', shell: false });
  child.on('close', (code: number) => {
    if (code !== 0) {
      console.error(`Error: The command exited with code ${code}.`);
    }
  });
};