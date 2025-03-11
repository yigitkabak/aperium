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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Kullanım: aper <templateAdı>, aper install <templateAdı> veya naper install <paketAdı>');
    process.exit(1);
}
if (args[0] === 'install') {
    const packageName = 'aperium';
    const packagePath = path.join(process.cwd(), 'node_modules', packageName);
    const templatesDir = path.join(packagePath, 'temps');
    if (!fs.existsSync(templatesDir)) {
        console.error(`❌ Hata: Paket içindeki "temps" klasörü bulunamadı: ${templatesDir}`);
        process.exit(1);
    }
    if (args.length > 1) {
        const templateName = args[1];
        const templatePath = path.join(templatesDir, templateName);
        const targetFolder = path.join(process.cwd(), templateName);
        console.log(`🔍 Şablon yolu: ${templatePath}`);
        if (!fs.existsSync(templatePath)) {
            console.error(`❌ Hata: "${templateName}" isimli template, "aperium" modülünün içindeki "temps" klasöründe bulunamadı.`);
            process.exit(1);
        }
        if (fs.existsSync(targetFolder)) {
            console.error(`⚠️ Hata: "${targetFolder}" zaten var. Farklı bir ad kullan.`);
            process.exit(1);
        }
        fs.ensureDirSync(targetFolder);
        fs.copy(templatePath, targetFolder)
            .then(() => console.log(`✅ "${templateName}" başarıyla "${targetFolder}" dizinine kopyalandı.`))
            .catch((err) => {
            console.error('🚨 Hata oluştu:', err);
            process.exit(1);
        });
    }
    else {
        console.log('🔍 Tüm şablonlar indiriliyor...');
        fs.readdir(templatesDir, (err, files) => {
            if (err) {
                console.error('❌ Şablonlar alınırken hata oluştu:', err);
                process.exit(1);
            }
            files.forEach((templateName) => {
                const templatePath = path.join(templatesDir, templateName);
                const targetFolder = path.join(process.cwd(), templateName);
                if (fs.existsSync(targetFolder)) {
                    console.log(`⚠️ "${templateName}" zaten var, atlanıyor.`);
                    return;
                }
                fs.ensureDirSync(targetFolder);
                fs.copy(templatePath, targetFolder)
                    .then(() => console.log(`✅ "${templateName}" başarıyla "${targetFolder}" dizinine kopyalandı.`))
                    .catch((err) => {
                    console.error('🚨 Hata oluştu:', err);
                    process.exit(1);
                });
            });
        });
    }
    process.exit(0);
}
const packageName = 'aperium';
const packagePath = path.join(process.cwd(), 'node_modules', packageName);
const templatesDir = path.join(packagePath, 'temps');
const templateName = args[0];
const templatePath = path.join(templatesDir, templateName);
const targetFolder = path.join(process.cwd(), templateName);
console.log(`🔍 Şablon yolu: ${templatePath}`);
if (!fs.existsSync(templatesDir)) {
    console.error(`❌ Hata: Paket içindeki "temps" klasörü bulunamadı: ${templatesDir}`);
    process.exit(1);
}
if (!fs.existsSync(templatePath)) {
    console.error(`❌ Hata: "${templateName}" isimli template, "aperium" modülünün içindeki "temps" klasöründe bulunamadı.`);
    process.exit(1);
}
if (fs.existsSync(targetFolder)) {
    console.error(`⚠️ Hata: "${targetFolder}" zaten var. Farklı bir ad kullan.`);
    process.exit(1);
}
fs.ensureDirSync(targetFolder);
fs.copy(templatePath, targetFolder)
    .then(() => console.log(`✅ "${templateName}" başarıyla "${targetFolder}" dizinine kopyalandı.`))
    .catch((err) => {
    console.error('🚨 Hata oluştu:', err);
    process.exit(1);
});
