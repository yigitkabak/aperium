#!/usr/bin/env node
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import express from 'express';
import cors from 'cors';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

const DEFAULT_REPO_URL = 'https://github.com/yigitkabak/aperium-repo.git';

interface PackageInfo {
    name: string;
    author: string;
    date: string;
    message: string;
    hash: string;
    structure: any;
}

const getDirectoryStructure = (dirPath: string) => {
    const structure: any = {};
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
            structure[item] = getDirectoryStructure(itemPath);
        } else {
            structure[item] = 'file';
        }
    }
    return structure;
};

const processPackages = async (git: SimpleGit, packagesPath: string): Promise<PackageInfo[]> => {
    const packagesData: PackageInfo[] = [];
    if (!fs.existsSync(packagesPath)) {
        console.warn(`Warning: Directory not found: ${packagesPath}. Skipping.`);
        return packagesData;
    }

    const packageDirs = fs.readdirSync(packagesPath).filter(file => 
        fs.statSync(path.join(packagesPath, file)).isDirectory()
    );

    for (const packageName of packageDirs) {
        const packageDir = path.join(packagesPath, packageName);
        
        try {
            const log = await git.log({
                from: packageDir,
                maxCount: 1,
            });

            const lastCommit = log.latest;
            const structure = getDirectoryStructure(packageDir);

            packagesData.push({
                name: packageName,
                author: lastCommit?.author_name || 'N/A',
                date: lastCommit?.date || 'N/A',
                message: lastCommit?.message || 'N/A',
                hash: lastCommit?.hash || 'N/A',
                structure: structure
            });
        } catch (error) {
            console.warn(`Warning: Could not get git log for ${packageName}, using default values.`);
            const structure = getDirectoryStructure(packageDir);
            
            packagesData.push({
                name: packageName,
                author: 'N/A',
                date: 'N/A',
                message: 'N/A',
                hash: 'N/A',
                structure: structure
            });
        }
    }

    return packagesData;
};

const getPackageNames = (packagesPath: string): string[] => {
    if (!fs.existsSync(packagesPath)) {
        console.warn(`Warning: Directory not found: ${packagesPath}. Skipping.`);
        return [];
    }

    return fs.readdirSync(packagesPath).filter(file =>
        fs.statSync(path.join(packagesPath, file)).isDirectory()
    );
};

export const startApiServer = async (port: number = 8000) => {
    const app = express();
    app.use(cors());
    app.use(express.json());

    console.log('Starting Aperium API server...');

    // Ana rota - hem templates hem modules
    app.get('/api/repo', async (req, res) => {
        console.log(`[${new Date().toISOString()}] Received request for '/api/repo'.`);
        const tempCloneRoot = path.join(os.tmpdir(), `.aperium_api_clone_${Date.now()}`);

        try {
            const options: Partial<SimpleGitOptions> = { baseDir: tempCloneRoot, binary: 'git' };
            fs.ensureDirSync(tempCloneRoot);
            
            console.log(`Cloning ${DEFAULT_REPO_URL}...`);
            await simpleGit(options).clone(DEFAULT_REPO_URL, 'repo');
            const repoPath = path.join(tempCloneRoot, 'repo');
            const git: SimpleGit = simpleGit(repoPath);

            const packsPath = path.join(repoPath, 'repo', 'packs');
            const modulesPath = path.join(repoPath, 'repo', 'modules');

            console.log(`Processing templates from: ${packsPath}`);
            console.log(`Processing modules from: ${modulesPath}`);

            const templates = await processPackages(git, packsPath);
            const modules = await processPackages(git, modulesPath);

            console.log(`${templates.length} templates from 'packs' and ${modules.length} modules from 'modules' were processed.`);

            res.status(200).json({ templates, modules });

        } catch (error: any) {
            console.error('API Error:', error);
            res.status(500).json({ error: 'Failed to retrieve package data.', details: error.message });
        } finally {
            if (fs.existsSync(tempCloneRoot)) {
                fs.removeSync(tempCloneRoot);
                console.log(`Temporary directory cleaned up: ${tempCloneRoot}`);
            }
        }
    });

    // Sadece modules rotası - detaylı bilgi ile
    app.get('/api/modules', async (req, res) => {
        console.log(`[${new Date().toISOString()}] Received request for '/api/modules'.`);
        const tempCloneRoot = path.join(os.tmpdir(), `.aperium_api_clone_${Date.now()}`);

        try {
            const options: Partial<SimpleGitOptions> = { baseDir: tempCloneRoot, binary: 'git' };
            fs.ensureDirSync(tempCloneRoot);
            
            console.log(`Cloning ${DEFAULT_REPO_URL}...`);
            await simpleGit(options).clone(DEFAULT_REPO_URL, 'repo');
            const repoPath = path.join(tempCloneRoot, 'repo');
            const git: SimpleGit = simpleGit(repoPath);
            
            const modulesPath = path.join(repoPath, 'repo', 'modules');
            console.log(`Processing modules from: ${modulesPath}`);
            
            const modules = await processPackages(git, modulesPath);

            console.log(`${modules.length} modules were processed.`);

            res.status(200).json(modules);

        } catch (error: any) {
            console.error('API Error:', error);
            res.status(500).json({ error: 'Failed to retrieve modules data.', details: error.message });
        } finally {
            if (fs.existsSync(tempCloneRoot)) {
                fs.removeSync(tempCloneRoot);
                console.log(`Temporary directory cleaned up: ${tempCloneRoot}`);
            }
        }
    });

    // Sadece templates rotası
    app.get('/api/templates', async (req, res) => {
        console.log(`[${new Date().toISOString()}] Received request for '/api/templates'.`);
        const tempCloneRoot = path.join(os.tmpdir(), `.aperium_api_clone_${Date.now()}`);

        try {
            const options: Partial<SimpleGitOptions> = { baseDir: tempCloneRoot, binary: 'git' };
            fs.ensureDirSync(tempCloneRoot);
            
            console.log(`Cloning ${DEFAULT_REPO_URL}...`);
            await simpleGit(options).clone(DEFAULT_REPO_URL, 'repo');
            const repoPath = path.join(tempCloneRoot, 'repo');
            const git: SimpleGit = simpleGit(repoPath);
            
            const packsPath = path.join(repoPath, 'repo', 'packs');
            console.log(`Processing templates from: ${packsPath}`);
            
            const templates = await processPackages(git, packsPath);

            console.log(`${templates.length} templates were processed.`);

            res.status(200).json(templates);

        } catch (error: any) {
            console.error('API Error:', error);
            res.status(500).json({ error: 'Failed to retrieve template data.', details: error.message });
        } finally {
            if (fs.existsSync(tempCloneRoot)) {
                fs.removeSync(tempCloneRoot);
                console.log(`Temporary directory cleaned up: ${tempCloneRoot}`);
            }
        }
    });

    // Ek rota - Sadece module isimlerini almak için
    app.get('/api/modules/names', async (req, res) => {
        console.log(`[${new Date().toISOString()}] Received request for '/api/modules/names'.`);
        const tempCloneRoot = path.join(os.tmpdir(), `.aperium_api_clone_${Date.now()}`);

        try {
            const options: Partial<SimpleGitOptions> = { baseDir: tempCloneRoot, binary: 'git' };
            fs.ensureDirSync(tempCloneRoot);
            
            await simpleGit(options).clone(DEFAULT_REPO_URL, 'repo');
            const repoPath = path.join(tempCloneRoot, 'repo');
            
            const modulesPath = path.join(repoPath, 'repo', 'modules');
            const moduleNames = getPackageNames(modulesPath);

            console.log(`${moduleNames.length} module names were processed.`);

            res.status(200).json(moduleNames);

        } catch (error: any) {
            console.error('API Error:', error);
            res.status(500).json({ error: 'Failed to retrieve module names.', details: error.message });
        } finally {
            if (fs.existsSync(tempCloneRoot)) {
                fs.removeSync(tempCloneRoot);
            }
        }
    });

    app.listen(port, () => {
        console.log(`🚀 Aperium API server running on http://localhost:${port}`);
        console.log(`Access repo data at:
  - All data: http://localhost:${port}/api/repo
  - Modules (detailed): http://localhost:${port}/api/modules
  - Modules (names only): http://localhost:${port}/api/modules/names
  - Templates (detailed): http://localhost:${port}/api/templates
`);
    });
};