#!/usr/bin/env node
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { simpleGit, SimpleGitOptions } from 'simple-git';
import inquirer from 'inquirer';
import { exec, spawn } from 'child_process';
import AdmZip from 'adm-zip';
import * as crypto from 'crypto';
import * as os from 'os';

const args = process.argv.slice(2);
const version = "v0.0.7";

const DEFAULT_REPO_URL = 'https://github.com/yigitkabak/aperium-repo.git';

const APERIUM_CONFIG_DIR = path.join(os.homedir(), '.aperium');
const ENCRYPTION_KEY_FILE = path.join(APERIUM_CONFIG_DIR, 'key.enc');

let ENCRYPTION_KEY: Buffer;
const IV_LENGTH = 16;

const loadOrCreateEncryptionKey = (): Buffer => {
  if (fs.existsSync(ENCRYPTION_KEY_FILE)) {
    try {
      const keyHex = fs.readFileSync(ENCRYPTION_KEY_FILE, 'utf8');
      const keyBuffer = Buffer.from(keyHex, 'hex');
      if (keyBuffer.length !== 32) {
        throw new Error('Saved key is not of valid length.');
      }
      return keyBuffer;
    } catch (error: any) {
      console.error(chalk.red(`Error: Problem reading or corrupt encryption key file: ${error.message}`));
      console.error(chalk.yellow('Generating a new key. Your old packages might not work with this key.'));
      const newKey = crypto.randomBytes(32);
      fs.ensureDirSync(APERIUM_CONFIG_DIR);
      fs.writeFileSync(ENCRYPTION_KEY_FILE, newKey.toString('hex'), { mode: 0o600 });
      console.log(chalk.green(`New encryption key created and saved: ${ENCRYPTION_KEY_FILE}`));
      return newKey;
    }
  } else {
    const newKey = crypto.randomBytes(32);
    fs.ensureDirSync(APERIUM_CONFIG_DIR);
    fs.writeFileSync(ENCRYPTION_KEY_FILE, newKey.toString('hex'), { mode: 0o600 });
    console.log(chalk.green(`New encryption key created and saved: ${ENCRYPTION_KEY_FILE}`));
    return newKey;
  }
};

ENCRYPTION_KEY = loadOrCreateEncryptionKey();

const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text: string): string => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift() as string, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

const calculateHash = (content: string): string => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

const displayUsage = () => {
  console.log(chalk.bold.blue('\n🚀 Aperium: Modern Package Manager\n'));
  console.log(chalk.yellow('Usage:'));
  console.log(`  ${chalk.cyan('aper install')} ${chalk.white('<file.apr>')}        ${chalk.gray('# Yerel bir .apr paketini yükler.')}`);
  console.log(`  ${chalk.cyan('aper install')} ${chalk.yellow('-r')} ${chalk.white('<template_name>')} ${chalk.gray('# Varsayılan depodan belirli bir şablonu yükler.')}`);
  console.log(`  ${chalk.cyan('aper new')} ${chalk.white('<package_name>')}    ${chalk.gray('# Yeni bir .apr paketi oluşturur.')}`);
  console.log(`  ${chalk.cyan('aper view')} ${chalk.white('<file.apr>')}         ${chalk.gray('# .apr paketi içeriğini görüntüler.')}`);
  console.log(`  ${chalk.cyan('aper version')}                    ${chalk.gray('# Aperium sürümünü gösterir.')}`);
  console.log(`  ${chalk.cyan('aper help')}                         ${chalk.gray('# Yardım menüsünü gösterir.')}`);
  console.log('\n' + chalk.bold.magenta('Aperture Labs. All rights reserved.'));
  console.log(chalk.gray(`For more info: ${chalk.underline('https://github.com/yigitkabak/aperium')}`));
};

const displayHelp = () => {
  console.log(chalk.bold.blue('\n🚀 APERIUM KOMUT REHBERİ\n'));
  console.log(chalk.bold.yellow('📦 Paket Yükleme:'));
  console.log(`  ${chalk.cyan('aper install')} ${chalk.white('<dosya.apr>')}`);
  console.log(`    ${chalk.gray('-> Yerel bir .apr paket dosyasını yükler.')}\n`);

  console.log(chalk.bold.yellow('🌐 Depo Şablon Yükleme:'));
  console.log(`  ${chalk.cyan('aper install')} ${chalk.yellow('-r')} ${chalk.white('<şablon_adı>')}`);
  console.log(`    ${chalk.gray('-> Aperium varsayılan deposundan belirli bir şablonu indirip kurar.')}\n`);

  console.log(chalk.bold.yellow('➕ Yeni Paket Oluşturma:'));
  console.log(`  ${chalk.cyan('aper new')} ${chalk.white('<paket_adı>')}`);
  console.log(`    ${chalk.gray('-> Belirtilen kurulum komut dosyaları/ayarları ile yeni bir .apr paketi oluşturur.')}\n`);

  console.log(chalk.bold.yellow('🔍 Paket İçeriği Görüntüleme:'));
  console.log(`  ${chalk.cyan('aper view')} ${chalk.white('<dosya.apr>')}`);
  console.log(`    ${chalk.gray('-> Bir .apr paketi dosyasının içindeki kurulum komut dosyalarını/ayarlarını görüntüler.')}\n`);

  console.log(chalk.bold.yellow('ℹ️ Bilgi Komutları:'));
  console.log(`  ${chalk.cyan('aper version')}`);
  console.log(`    ${chalk.gray('-> Mevcut Aperium sürümünü gösterir.')}\n`);

  console.log(`  ${chalk.cyan('aper help')}`);
  console.log(`    ${chalk.gray('-> Bu yardım menüsünü görüntüler.')}\n`);

  console.log(chalk.green('Daha fazla bilgi ve örnek için: ') + chalk.underline.cyan('https://github.com/yigitkabak/aperium'));
  console.log(chalk.gray(`Varsayılan şablon deposu: ${chalk.cyan(DEFAULT_REPO_URL)}`));
};

const APERIUM_INSTALLED_PACKAGES_DIR = path.join(os.homedir(), '.aperium', 'installed_packages');

const registerInstalledPackage = async (packageName: string, packageHash: string) => {
  const packageRecordPath = path.join(APERIUM_INSTALLED_PACKAGES_DIR, `${packageName}.json`);
  const record = {
    name: packageName,
    hash: packageHash,
    installedAt: new Date().toISOString(),
    version: version
  };
  const recordContent = JSON.stringify(record, null, 2);

  try {
    await runSudoCommand('mkdir', ['-p', APERIUM_INSTALLED_PACKAGES_DIR], `Ensuring package record directory exists: ${APERIUM_INSTALLED_PACKAGES_DIR}`);
    
    console.log(chalk.blue(`Recording installation for "${packageName}"...`));
    const tempRecordPath = path.join(os.tmpdir(), `${packageName}.json.tmp`);
    fs.writeFileSync(tempRecordPath, recordContent);
    await runSudoCommand('mv', [tempRecordPath, packageRecordPath], `Moving package record to ${packageRecordPath}...`);
    console.log(chalk.green(`Package "${packageName}" installation recorded.`));
  } catch (error) {
    console.error(chalk.red(`Error recording installed package "${packageName}":`), error);
  }
};


const setupAperiumStructure = (targetFolder: string) => {
  try {
    const aperiumFolder = path.join(targetFolder, '.aperium');
    fs.ensureDirSync(aperiumFolder);
    const randomSerial = Math.random().toString(36).substring(2, 10).toUpperCase();
    const aperFile = path.join(aperiumFolder, '.aper');
    const content = `Serial: ${randomSerial}\nAper version: ${version}\n`;
    fs.writeFileSync(aperFile, content);
    console.log(chalk.green(`Aperium structure successfully created: ${aperiumFolder}`));
  } catch (error) {
    console.error(chalk.red('Error creating Aperium structure:'), error);
    process.exit(1);
  }
};

const getOS = async (): Promise<string> => {
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
          console.log(chalk.yellow(`Warning: Specific scripts for ID "${id}" are not available. Attempting generic approach.`));
          resolve(id);
        } else {
          resolve('unknown');
        }
      }
    });
  });
};

const executeScriptContent = async (scriptContent: string, templateName: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        if (!scriptContent.trim()) {
            console.log(chalk.yellow(`Script content to run for "${templateName}" is empty.`));
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

        console.log(chalk.green(`Running installation script for "${templateName}"... Please wait...`));
        const tempScriptPath = path.join(os.tmpdir(), `aper_script_${Date.now()}.sh`);
        
        try {
            fs.writeFileSync(tempScriptPath, scriptContent, { mode: 0o755 });

            args.push(tempScriptPath);

            const child = spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: false  
            });

            let stdoutBuffer = '';
            let stderrBuffer = '';

            const progressInterval = setInterval(() => {
                process.stdout.write(chalk.gray('.'));
            }, 500);

            child.stdout?.on('data', (data) => {
                stdoutBuffer += data.toString();
            });
            child.stderr?.on('data', (data) => {
                stderrBuffer += data.toString();
                process.stdout.write(chalk.red('!'));
            });

            child.on('close', (code) => {
                clearInterval(progressInterval);
                fs.removeSync(tempScriptPath);

                if (code !== 0) {
                    console.log('\n' + chalk.red(`"${templateName}" installation exited with code ${code}.`));
                    if (stderrBuffer) {
                        console.error(chalk.red('Error Output (stderr, first 1KB):'));
                        console.error(chalk.red(stderrBuffer.substring(0, 1024) + (stderrBuffer.length > 1024 ? '...' : '')));
                    }
                    reject(new Error(`Installation "${templateName}" failed.`));
                } else {
                    console.log('\n' + chalk.green(`Installation script for "${templateName}" completed successfully.`));
                    resolve();
                }
            });

            child.on('error', (err) => {
                clearInterval(progressInterval);
                fs.removeSync(tempScriptPath);
                console.error(chalk.red(`An unexpected error occurred while running "${templateName}" installation script:`), err);
                reject(err);
            });

        } catch (execError: any) {
            fs.removeSync(tempScriptPath);
            console.error(chalk.red(`Could not run "${templateName}" installation script:`), execError);
            reject(execError);
        }
    });
};

const runSudoCommand = async (command: string, args: string[], message: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const isTermux = process.env.TERMUX_VERSION !== undefined;
        if (isTermux) {
            console.log(chalk.yellow(`Termux detected. Attempting to run command directly: ${command} ${args.join(' ')}`));
            const child = spawn(command, args, { stdio: 'inherit' });
            child.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Command failed with code ${code}: ${command} ${args.join(' ')}`));
                } else {
                    resolve();
                }
            });
            child.on('error', (err) => {
                reject(new Error(`Failed to run command directly in Termux: ${err.message}`));
            });
            return;
        }

        console.log(chalk.blue(message));
        const child = spawn('sudo', [command, ...args], { stdio: 'inherit' });

        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Command failed with code ${code}: sudo ${command} ${args.join(' ')}`));
            } else {
                resolve();
            }
        });

        child.on('error', (err) => {
            reject(new Error(`Failed to run sudo command: ${err.message}`));
        });
    });
};

const applyNixOSConfiguration = async (packageListString: string, templateName: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    if (!packageListString.trim()) {
      console.log(chalk.yellow(`NixOS package list for "${templateName}" is empty.`));
      resolve();
      return;
    }

    const nixConfigPath = '/etc/nixos/configuration.nix';
    const aperiumModulesDir = '/etc/nixos/aperium-modules';

    try {
      console.log(chalk.blue('Aperium needs administrative privileges to set up NixOS modules. You may be prompted for your password.'));
      await runSudoCommand('mkdir', ['-p', aperiumModulesDir], `Ensuring module directory exists: ${aperiumModulesDir}`);
    } catch (error) {
      console.error(chalk.red(`Error ensuring module directory ${aperiumModulesDir}:`), error);
      reject(new Error(`Failed to create module directory.`));
      return;
    }

    const backupPath = `${nixConfigPath}.bak_aper_${Date.now()}`;
    try {
      console.log(chalk.blue(`Backing up existing ${nixConfigPath} to ${backupPath}. This requires sudo permissions.`));
      await runSudoCommand('cp', [nixConfigPath, backupPath], `Backing up existing ${nixConfigPath}...`);
      console.log(chalk.green(`Backed up existing ${nixConfigPath} to ${backupPath}`));
    } catch (error) {
      console.error(chalk.red(`Error backing up ${nixConfigPath}:`), error);
      reject(new Error(`Failed to back up ${nixConfigPath}.`));
      return;
    }

    const moduleFileName = `${templateName}-packages.nix`;
    const modulePath = path.join(aperiumModulesDir, moduleFileName);

    const packages = packageListString.split(',').map(p => p.trim()).filter(p => p.length > 0);
    const packagesNixFormat = packages.join('\n    ');

    const moduleContent = `{ config, pkgs, ... }:

{
  environment.systemPackages = with pkgs; [
    ${packagesNixFormat}
  ];
}
`;

    try {
      console.log(chalk.blue(`Creating NixOS module for "${templateName}" at ${modulePath}. This requires sudo permissions.`));
      const tempModulePath = path.join(os.tmpdir(), moduleFileName);
      fs.writeFileSync(tempModulePath, moduleContent);
      await runSudoCommand('mv', [tempModulePath, modulePath], `Moving module to ${modulePath}...`);
      console.log(chalk.green(`Created NixOS module for "${templateName}" at ${modulePath}.`));
    } catch (error) {
      console.error(chalk.red(`Error creating NixOS module for "${templateName}":`), error);
      reject(new Error(`Failed to create NixOS module.`));
      return;
    }

    let currentConfigContent = await fs.readFile(nixConfigPath, 'utf8');
    const importStatement = `\n  ./aperium-modules/${moduleFileName}`;

    if (!currentConfigContent.includes(importStatement)) {
      const importRegex = /(imports\s*=\s*\[)([\s\S]*?)(\]\s*;)/;
      const match = currentConfigContent.match(importRegex);

      if (match) {
        const preImports = match[1];
        const existingImportsContent = match[2];
        const postImports = match[3];

        const newImportsContent = `${existingImportsContent}${importStatement}\n  `;
        const newConfigContent = currentConfigContent.replace(
          importRegex,
          `${preImports}${newImportsContent}${postImports}`
        );
        currentConfigContent = newConfigContent;
        console.log(chalk.blue(`Added import for "${moduleFileName}" to ${nixConfigPath}.`));
      } else {
        const openingBraceIndex = currentConfigContent.indexOf('{');
        if (openingBraceIndex !== -1) {
          const contentAfterBrace = currentConfigContent.substring(openingBraceIndex + 1);
          currentConfigContent = currentConfigContent.substring(0, openingBraceIndex + 1) +
            `\n\n  imports = [\n    ./hardware-configuration.nix\n    ${importStatement}\n  ];\n` +
            contentAfterBrace;
        } else {
          currentConfigContent = `{ config, pkgs, ... }:\n\n{\n  imports = [\n    ./hardware-configuration.nix\n    ${importStatement}\n  ];\n\n${currentConfigContent}\n}\n`;
        }
        console.log(chalk.yellow(`Warning: No existing 'imports' block found. Attempting to add a new one to ${nixConfigPath}. Please review your ${nixConfigPath} file manually.`));
      }

      try {
        console.log(chalk.blue(`Updating ${nixConfigPath} with new module import. This requires sudo permissions.`));
        const tempNixConfigPath = path.join(os.tmpdir(), 'configuration.nix.tmp');
        fs.writeFileSync(tempNixConfigPath, currentConfigContent);
        await runSudoCommand('mv', [tempNixConfigPath, nixConfigPath], `Moving updated configuration to ${nixConfigPath}...`);
      } catch (error) {
        console.error(chalk.red(`Error updating ${nixConfigPath} with import: `), error);
        reject(new Error(`Failed to update main configuration.nix.`));
        return;
      }
    } else {
      console.log(chalk.yellow(`Import for "${moduleFileName}" already exists in ${nixConfigPath}.`));
    }

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'rebuildNixos',
        message: chalk.yellow('The NixOS configuration has been updated. Do you want to rebuild your system now? (This may take a while and requires sudo)'),
        default: true,
      }
    ]);

    if (answers.rebuildNixos) {
      console.log(chalk.blue('Rebuilding NixOS system... This may take a while. You may be prompted for your password again.'));
      const child = spawn('sudo', ['-E', 'nixos-rebuild', 'switch'], {
        stdio: 'inherit',
        shell: false
      });

      child.on('close', (code) => {
        if (code !== 0) {
          console.log('\n' + chalk.red(`NixOS rebuild exited with code ${code}.`));
          console.error(chalk.red('Please check the output above for errors. You may need to manually run `sudo nixos-rebuild switch` to apply changes.'));
          reject(new Error(`NixOS rebuild failed.`));
        } else {
          console.log('\n' + chalk.green(`NixOS rebuild completed successfully.`));
          resolve();
        }
      });

      child.on('error', (err) => {
        console.error(chalk.red(`An unexpected error occurred during NixOS rebuild:`), err);
        reject(err);
      });
    } else {
      console.log(chalk.yellow('NixOS rebuild skipped. Remember to run `sudo nixos-rebuild switch` to apply the changes.'));
      resolve();
    }
  });
};

const executeLegacySetupScript = async (scriptPath: string, targetFolder: string, templateName: string) => {
  if (fs.existsSync(scriptPath)) {
    console.log(chalk.blue(`Installation script found for template "${templateName}": ${path.basename(scriptPath)}`));
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    await executeScriptContent(scriptContent, templateName);
  } else {
      console.log(chalk.yellow(`Specified installation script (${path.basename(scriptPath)}) not found for "${templateName}".`));
  }
};

const installTemplateFromDefaultRepo = async (templateName: string) => {
  const repoName = DEFAULT_REPO_URL.split('/').pop()?.replace('.git', '') || 'cloned_repo';
  const tempCloneRoot = path.join(os.tmpdir(), `.aperium_repo_temp_clone_${Date.now()}`);
  const clonePath = path.join(tempCloneRoot, repoName);

  try {
    const options: Partial<SimpleGitOptions> = {
      baseDir: os.tmpdir(),
      binary: 'git',
      maxConcurrentProcesses: 6,
    };
    const git = simpleGit(options);

    if (fs.existsSync(clonePath)) {
      fs.removeSync(clonePath);
    }
    fs.ensureDirSync(tempCloneRoot);

    console.log(chalk.blue(`Cloning repository: ${DEFAULT_REPO_URL}`));
    await git.clone(DEFAULT_REPO_URL, clonePath);
    console.log(chalk.green(`Repository successfully cloned: ${clonePath}`));

    const repoPacksDir = path.join(clonePath, 'repo', 'packs');

    if (!fs.existsSync(repoPacksDir)) {
      console.error(chalk.red(`Error: "repo/packs" directory not found in the cloned repository: ${chalk.cyan(repoPacksDir)}`));
      console.error(chalk.red('Please ensure your default repository has a "repo/packs" structure.'));
      process.exit(1);
    }

    const processSingleTemplate = async (tName: string) => {
      const sourceTemplatePath = path.join(repoPacksDir, tName);
      const targetFolder = path.join(process.cwd(), tName);

      if (!fs.lstatSync(sourceTemplatePath).isDirectory()) {
          return;
      }

      fs.ensureDirSync(targetFolder);
      try {
        await fs.copy(sourceTemplatePath, targetFolder);
        console.log(chalk.green(`"${tName}" template successfully copied to: ${targetFolder}`));
        
        setupAperiumStructure(targetFolder);

        const setupScriptPath = path.join(targetFolder, 'setup.sh');
        await executeLegacySetupScript(setupScriptPath, targetFolder, tName);

      } catch (err) {
        console.error(chalk.red(`An error occurred while copying "${tName}" template:`), err);
      }
    };

    const sourceTemplatePath = path.join(repoPacksDir, templateName);
    const targetFolder = path.join(process.cwd(), templateName);

    if (!fs.existsSync(sourceTemplatePath)) {
      console.error(chalk.red(`Error: Template "${templateName}" not found in the repository's "packs" folder.`));
      process.exit(1);
    }

    await processSingleTemplate(templateName);

  } catch (error) {
    console.error(chalk.red('An error occurred during installation from repository:'), error);
    process.exit(1);
  } finally {
    if (fs.existsSync(tempCloneRoot)) {
      fs.removeSync(tempCloneRoot);
    }
  }
};

const createNewAprPackage = async (packageName: string) => {
  const outputAprFile = path.join(process.cwd(), `${packageName}.apr`);

  if (fs.existsSync(outputAprFile)) {
    console.error(chalk.yellow(`Error: A file named "${packageName}.apr" already exists.`));
    process.exit(1);
  }

  console.log(chalk.blue(`Creating a new .apr package named "${packageName}"...`));

  const creationTypeAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'scriptType',
      message: chalk.cyan('Would you like to provide a generic bash script or distribution-specific commands?'),
      choices: [
        { name: 'Generic Bash Script (for all Linux)', value: 'generic' },
        { name: 'Distribution-Specific Commands (Arch, Debian, NixOS)', value: 'specific' },
      ],
      default: 'specific'
    }
  ]);

  let answers: any = {};
  if (creationTypeAnswer.scriptType === 'generic') {
    answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'genericScript',
        message: chalk.cyan('Enter the generic bash installation script (can be left blank):'),
        default: ''
      }
    ]);
  } else {
    answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'archScript',
        message: chalk.cyan('Enter installation commands for Arch Linux (can be left blank):'),
        default: ''
      },
      {
        type: 'input',
        name: 'debianScript',
        message: chalk.cyan('Enter installation commands for Debian/Ubuntu (can be left blank):'),
        default: ''
      },
      {
        type: 'input',
        name: 'nixosPackages',
        message: chalk.cyan('Enter NixOS packages to install (comma-separated, e.g., neofetch, git, vim - can be left blank):'),
        default: ''
      }
    ]);
  }

  const zip = new AdmZip();

  try {
    const packageMeta: {
        name: string;
        version: string;
        description: string;
        archScriptEnc?: string;
        archScriptHash?: string;
        debianScriptEnc?: string;
        debianScriptHash?: string;
        nixosPackagesEnc?: string;
        nixosPackagesHash?: string;
        genericScriptEnc?: string;
        genericScriptHash?: string;
    } = {
      name: packageName,
      version: "1.0.0",
      description: 'Aperium Package',
    };

    if (creationTypeAnswer.scriptType === 'generic' && answers.genericScript) {
      packageMeta.genericScriptEnc = encrypt(answers.genericScript);
      packageMeta.genericScriptHash = calculateHash(answers.genericScript);
    } else if (creationTypeAnswer.scriptType === 'specific') {
      if (answers.archScript) {
        packageMeta.archScriptEnc = encrypt(answers.archScript);
        packageMeta.archScriptHash = calculateHash(answers.archScript);
      }
      if (answers.debianScript) {
        packageMeta.debianScriptEnc = encrypt(answers.debianScript);
        packageMeta.debianScriptHash = calculateHash(answers.debianScript);
      }
      if (answers.nixosPackages) {
        packageMeta.nixosPackagesEnc = encrypt(answers.nixosPackages);
        packageMeta.nixosPackagesHash = calculateHash(answers.nixosPackages);
      }
    }

    zip.addFile('package.json', Buffer.from(JSON.stringify(packageMeta, null, 2)), 'Package metadata');

    zip.writeZip(outputAprFile);

    console.log(chalk.green(`"${packageName}.apr" package successfully created: ${outputAprFile}`));

  } catch (error) {
    console.error(chalk.red('An error occurred while creating the package:'), error);
    process.exit(1);
  }
};

const installFromAprFile = async (aprFilePath: string) => {
  if (!fs.existsSync(aprFilePath)) {
    console.error(chalk.red(`Error: .apr file not found: "${aprFilePath}".`));
    process.exit(1);
  }
  if (!aprFilePath.toLowerCase().endsWith('.apr')) {
    console.error(chalk.red(`Error: Provided file "${aprFilePath}" does not have a .apr extension.`));
    process.exit(1);
  }

  const tempExtractDir = path.join(os.tmpdir(), `aperium_apr_temp_extract_${Date.now()}`);
  let packageMeta: any;

  try {
    fs.ensureDirSync(tempExtractDir);
    const zip = new AdmZip(aprFilePath);
    zip.extractAllTo(tempExtractDir, true);
    console.log(chalk.green(`"${aprFilePath}" successfully extracted to temporary directory.`));

    const packageMetaPath = path.join(tempExtractDir, 'package.json');
    if (!fs.existsSync(packageMetaPath)) {
      console.error(chalk.red(`Error: 'package.json' file not found in .apr package. Invalid package.`));
      process.exit(1);
    }
    packageMeta = JSON.parse(fs.readFileSync(packageMetaPath, 'utf8'));

    let scriptToExecuteEnc: string | null = null;
    let scriptToExecuteHash: string | null = null;
    let scriptNameForLog: string = 'unknown script';
    let scriptContent: string | null = null;
    let nixosPackagesContent: string | null = null;

    if (packageMeta.genericScriptEnc) {
        scriptToExecuteEnc = packageMeta.genericScriptEnc;
        scriptToExecuteHash = packageMeta.genericScriptHash;
        scriptNameForLog = 'Generic Bash installation script';
        console.log(chalk.blue(`Found generic Bash script. Attempting to use it.`));
    } else {
        const osType = await getOS();
        if (osType === 'arch' && packageMeta.archScriptEnc) {
            scriptToExecuteEnc = packageMeta.archScriptEnc;
            scriptToExecuteHash = packageMeta.archScriptHash;
            scriptNameForLog = 'Arch installation script';
            console.log(chalk.blue(`System detected as Arch-based. Searching for Arch installation script.`));
        } else if (osType === 'debian' && packageMeta.debianScriptEnc) {
            scriptToExecuteEnc = packageMeta.debianScriptEnc;
            scriptToExecuteHash = packageMeta.debianScriptHash;
            scriptNameForLog = 'Debian installation script';
            console.log(chalk.blue(`System detected as Debian-based. Searching for Debian installation script.`));
        } else if (osType === 'nixos' && packageMeta.nixosPackagesEnc) {
            scriptToExecuteEnc = packageMeta.nixosPackagesEnc;
            scriptToExecuteHash = packageMeta.nixosPackagesHash;
            scriptNameForLog = 'NixOS package list';
            nixosPackagesContent = decrypt(scriptToExecuteEnc!);
            console.log(chalk.blue(`System detected as NixOS. Searching for NixOS package list.`));
        } else {
            console.log(chalk.yellow(`Warning: No suitable or generic installation script found for detected system (${osType}).`));
        }
    }

    if (scriptToExecuteEnc) {
      if (scriptNameForLog !== 'NixOS package list') {
        const decryptedScript = decrypt(scriptToExecuteEnc);
        const calculatedHash = calculateHash(decryptedScript);

        if (calculatedHash !== scriptToExecuteHash) {
          console.error(chalk.red(`Error: Installation script could not be verified! Hash mismatch. It may be unsafe to install this package.`));
          process.exit(1);
        }
        console.log(chalk.green(`${scriptNameForLog} successfully verified.`));
        scriptContent = decryptedScript;
        await executeScriptContent(scriptContent, packageMeta.name);
      } else if (nixosPackagesContent) {
        const calculatedHash = calculateHash(nixosPackagesContent);
        if (calculatedHash !== scriptToExecuteHash) {
          console.error(chalk.red(`Error: NixOS package list could not be verified! Hash mismatch. It may be unsafe to install this package.`));
          process.exit(1);
        }
        console.log(chalk.green(`${scriptNameForLog} successfully verified.`));
        await applyNixOSConfiguration(nixosPackagesContent, packageMeta.name);
      }
    } else {
      console.log(chalk.yellow(`No executable script found in "${packageMeta.name}" package.`));
    }

    const packageCombinedHash = calculateHash(
        (packageMeta.archScriptEnc || '') +
        (packageMeta.debianScriptEnc || '') +
        (packageMeta.nixosPackagesEnc || '') +
        (packageMeta.genericScriptEnc || '')
    );
    await registerInstalledPackage(packageMeta.name, packageCombinedHash);

  } catch (error) {
    console.error(chalk.red('An error occurred during installation from .apr file:'), error);
    process.exit(1);
  } finally {
    if (fs.existsSync(tempExtractDir)) {
      fs.removeSync(tempExtractDir);
    }
  }
};

const viewAprFileContent = async (aprFilePath: string) => {
  if (!fs.existsSync(aprFilePath)) {
    console.error(chalk.red(`Error: .apr file not found: "${aprFilePath}".`));
    process.exit(1);
  }
  if (!aprFilePath.toLowerCase().endsWith('.apr')) {
    console.error(chalk.red(`Error: Provided file "${aprFilePath}" does not have a .apr extension.`));
    process.exit(1);
  }

  const tempExtractDir = path.join(os.tmpdir(), `aperium_apr_temp_extract_view_${Date.now()}`);
  let packageMeta: any;

  try {
    fs.ensureDirSync(tempExtractDir);
    const zip = new AdmZip(aprFilePath);
    zip.extractAllTo(tempExtractDir, true);

    const packageMetaPath = path.join(tempExtractDir, 'package.json');
    if (!fs.existsSync(packageMetaPath)) {
      console.error(chalk.red(`Error: 'package.json' file not found in .apr package. Invalid package.`));
      process.exit(1);
    }
    packageMeta = JSON.parse(fs.readFileSync(packageMetaPath, 'utf8'));

    console.log(chalk.blue(`\nPackage Name: ${packageMeta.name}`));
    console.log(chalk.blue(`Package Version: ${packageMeta.version}`));
    console.log(chalk.blue(`Description: ${packageMeta.description || 'None'}\n`));

    if (packageMeta.genericScriptEnc) {
        try {
            const decryptedScript = decrypt(packageMeta.genericScriptEnc);
            const calculatedHash = calculateHash(decryptedScript);
            if (calculatedHash === packageMeta.genericScriptHash) {
                console.log(chalk.cyan('--- Generic Bash Installation Script ---'));
                console.log(chalk.white(decryptedScript));
                console.log(chalk.cyan('----------------------------------------\n'));
            } else {
                console.error(chalk.red('Warning: Generic script hash verification failed. Script may have been tampered with.'));
            }
        } catch (e: any) {
            console.error(chalk.red('Failed to decrypt or malformed generic script:'), e.message);
        }
    } else {
        console.log(chalk.yellow('No generic bash installation script found.\n'));
    }

    if (packageMeta.debianScriptEnc) {
      try {
        const decryptedScript = decrypt(packageMeta.debianScriptEnc);
        const calculatedHash = calculateHash(decryptedScript);
        if (calculatedHash === packageMeta.debianScriptHash) {
          console.log(chalk.cyan('--- Debian/Ubuntu Installation Script ---'));
          console.log(chalk.white(decryptedScript));
          console.log(chalk.cyan('-----------------------------------------\n'));
        } else {
          console.error(chalk.red('Warning: Debian script hash verification failed. Script may have been tampered with.'));
        }
      } catch (e: any) {
        console.error(chalk.red('Failed to decrypt or malformed Debian script:'), e.message);
      }
    } else {
      console.log(chalk.yellow('No installation script found for Debian/Ubuntu.\n'));
    }

    if (packageMeta.archScriptEnc) {
      try {
        const decryptedScript = decrypt(packageMeta.archScriptEnc);
        const calculatedHash = calculateHash(decryptedScript);
        if (calculatedHash === packageMeta.archScriptHash) {
          console.log(chalk.cyan('--- Arch Linux Installation Script ---'));
          console.log(chalk.white(decryptedScript));
          console.log(chalk.cyan('--------------------------------------\n'));
        } else {
          console.error(chalk.red('Warning: Arch script hash verification failed. Script may have been tampered with.'));
        }
      } catch (e: any) {
        console.error(chalk.red('Failed to decrypt or malformed Arch script:'), e.message);
      }
    } else {
      console.log(chalk.yellow('No installation script found for Arch Linux.\n'));
    }

    if (packageMeta.nixosPackagesEnc) {
      try {
        const decryptedPackages = decrypt(packageMeta.nixosPackagesEnc);
        const calculatedHash = calculateHash(decryptedPackages);
        if (calculatedHash === packageMeta.nixosPackagesHash) {
          console.log(chalk.cyan('--- NixOS Package List ---'));
          console.log(chalk.white(decryptedPackages));
          console.log(chalk.cyan('--------------------------\n'));
        } else {
          console.error(chalk.red('Warning: NixOS package list hash verification failed. Data may have been tampered with.'));
        }
      } catch (e: any) {
        console.error(chalk.red('Failed to decrypt or malformed NixOS package list:'), e.message);
      }
    } else {
      console.log(chalk.yellow('No NixOS package list found.\n'));
    }

  } catch (error) {
    console.error(chalk.red('An error occurred while viewing .apr file content:'), error);
    process.exit(1);
  } finally {
    if (fs.existsSync(tempExtractDir)) {
      fs.removeSync(tempExtractDir);
    }
  }
};

const ensureSudo = async (): Promise<void> => {
  const isTermux = process.env.TERMUX_VERSION !== undefined;

  if (isTermux) {
    console.log(chalk.yellow('Termux environment detected. Sudo is not required.'));
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    console.log(chalk.yellow('Aperium needs administrator (sudo) privileges for installation.'));
    console.log(chalk.yellow('You may be prompted for your password.'));
    const child = spawn('sudo', ['-v'], { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('Sudo access granted.'));
        resolve();
      } else {
        console.error(chalk.red('Error: Sudo access denied or cancelled. Cannot proceed with installation.'));
        reject(new Error('Sudo access denied.'));
      }
    });

    child.on('error', (err) => {
      console.error(chalk.red(`Error checking sudo access: ${err.message}`));
      reject(err);
    });
  });
};


const run = async () => {
  const command = args[0];
  const value = args[1];
  const option = args[2];

  switch (command) {
    case 'install':
      try {
        await ensureSudo();
      } catch (error) {
        process.exit(1);
      }

      if (!value) {
        console.error(chalk.red('Error: Missing file or template name for install command.'));
        displayUsage();
        process.exit(1);
      }
      if (value === '-r') {
        if (!option) {
          console.error(chalk.red('Error: Missing template name for repository install.'));
          displayUsage();
          process.exit(1);
        }
        await installTemplateFromDefaultRepo(option);
      } else {
        await installFromAprFile(value);
      }
      break;
    case 'new':
      if (!value) {
        console.error(chalk.red('Error: Missing package name for new command.'));
        displayUsage();
        process.exit(1);
      }
      await createNewAprPackage(value);
      break;
    case 'view':
      if (!value) {
        console.error(chalk.red('Error: Missing .apr file path for view command.'));
        displayUsage();
        process.exit(1);
      }
      await viewAprFileContent(value);
      break;
    case 'version':
      console.log(chalk.green(`Aperium version: ${version}`));
      break;
    case 'help':
      displayHelp();
      break;
    default:
      if (command) {
        console.error(chalk.red(`Error: Unknown command "${command}".`));
      }
      displayUsage();
      process.exit(1);
  }
};

run();
