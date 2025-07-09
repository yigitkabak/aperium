#!/usr/bin/env node
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { simpleGit, SimpleGitOptions } from 'simple-git';

const args = process.argv.slice(2);
const version = "v0.0.7";

const DEFAULT_REPO_URL = 'https://github.com/yigitkabak/aperium-repo.git';

const displayUsage = () => {
  console.log(chalk.yellow('Usage: ') + chalk.white('aper install <template_name>\n'));
  console.log(chalk.bold('Aperture Labs.'));
};

const displayHelp = () => {
  console.log("\n" + chalk.bold.blue('APER COMMAND GUIDE') + "\n");
  console.log(chalk.cyan('aper install <template_name>') + chalk.gray(' # Installs a specific template from the default repository.'));
  console.log(chalk.cyan('aper install all') + chalk.gray('       # Installs all templates from the default repository.'));
  console.log(chalk.cyan('aper version') + chalk.gray('             # Displays the current version.'));
  console.log(chalk.cyan('aper help') + chalk.gray('                # Shows the help menu.'));
  console.log("\n" + chalk.green('For more information: ') + chalk.underline.cyan('https://github.com/yigitkabak/aperium'));
  console.log(chalk.gray(`Default template repository: ${chalk.cyan(DEFAULT_REPO_URL)}`));
};

const setupAperiumStructure = (targetFolder: string) => {
  try {
    const aperiumFolder = path.join(targetFolder, '.aperium');
    fs.ensureDirSync(aperiumFolder);
    const randomSerial = Math.random().toString(36).substring(2, 10).toUpperCase();
    const aperFile = path.join(aperiumFolder, '.aper');
    const content = `Serial: ${randomSerial}\nAper version: ${version}\n`;
    fs.writeFileSync(aperFile, content);
  } catch (error) {
    console.error(chalk.red('Error creating .aperium structure:'), error);
    process.exit(1);
  }
};

const installTemplateFromDefaultRepo = async (templateName: string) => {
  const repoName = DEFAULT_REPO_URL.split('/').pop()?.replace('.git', '') || 'cloned_repo';
  const tempCloneRoot = path.join(process.cwd(), '.aperium');
  const clonePath = path.join(tempCloneRoot, repoName);

  try {
    const options: Partial<SimpleGitOptions> = {
      baseDir: process.cwd(),
      binary: 'git',
      maxConcurrentProcesses: 6,
    };
    const git = simpleGit(options);

    if (fs.existsSync(clonePath)) {
      fs.removeSync(clonePath);
    }
    fs.ensureDirSync(tempCloneRoot);

    await git.clone(DEFAULT_REPO_URL, clonePath);
    console.log(chalk.green(`Repository cloned successfully.`));

    const repoPacksDir = path.join(clonePath, 'repo', 'packs');

    if (!fs.existsSync(repoPacksDir)) {
      console.error(chalk.red(`Error: "repo/packs" directory not found in the cloned repository: ${chalk.cyan(repoPacksDir)}`));
      console.error(chalk.red('Please ensure your default repository has a "repo/packs" structure.'));
      process.exit(1);
    }

    if (templateName === 'all') {
      const files = await fs.readdir(repoPacksDir);
      if (files.length === 0) {
          console.log(chalk.yellow(`No templates found in "${chalk.cyan(repoPacksDir)}".`));
          return;
      }
      for (const tName of files) {
        const sourceTemplatePath = path.join(repoPacksDir, tName);
        const targetFolder = path.join(process.cwd(), tName);

        if (fs.existsSync(targetFolder)) {
          console.log(chalk.yellow(`"${tName}" already exists, skipping.`));
          continue;
        }

        if (!fs.lstatSync(sourceTemplatePath).isDirectory()) {
            continue;
        }

        fs.ensureDirSync(targetFolder);
        try {
          await fs.copy(sourceTemplatePath, targetFolder);
          console.log(chalk.green(`Template "${tName}" successfully copied.`));
          setupAperiumStructure(targetFolder);
        } catch (err) {
          console.error(chalk.red(`An error occurred while copying template "${tName}":`), err);
        }
      }
    } else {
      const sourceTemplatePath = path.join(repoPacksDir, templateName);
      const targetFolder = path.join(process.cwd(), templateName);

      if (!fs.existsSync(sourceTemplatePath)) {
        console.error(chalk.red(`Error: Template "${templateName}" not found in the repository's "packs" folder.`));
        process.exit(1);
      }
      if (fs.existsSync(targetFolder)) {
        console.error(chalk.yellow(`Error: Target folder "${targetFolder}" already exists. Please use a different name.`));
        process.exit(1);
      }

      fs.ensureDirSync(targetFolder);
      await fs.copy(sourceTemplatePath, targetFolder);
      console.log(chalk.green(`Template "${templateName}" successfully copied.`));
      setupAperiumStructure(targetFolder);
    }

  } catch (error) {
    console.error(chalk.red('An error occurred during installation from the repository:'), error);
    process.exit(1);
  } finally {
    if (fs.existsSync(tempCloneRoot)) {
      fs.removeSync(tempCloneRoot);
    }
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
        const templateName = args[1];
        await installTemplateFromDefaultRepo(templateName);
      } else {
        console.error(chalk.red('Error: Please provide a template name or "all" for the "install" command.'));
        displayUsage();
        process.exit(1);
      }
      process.exit(0);
    default:
      console.error(chalk.red('Error: Invalid command.'));
      process.exit(1);
  }
};

main();
