#!/usr/bin/env node
import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';

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
  } else {
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
