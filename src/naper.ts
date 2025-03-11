#!/usr/bin/env node
import { execSync } from 'child_process';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Hata: Kullanım: naper install <paketAdı>');
  process.exit(1);
}

if (args[0] === 'install') {
  if (args.length < 2) {
    console.error('❌ Hata: Lütfen yüklemek istediğiniz paketin adını girin.');
    process.exit(1);
  }

  const packageToInstall = args[1];
  console.log(`🔍 ${packageToInstall} paketi indiriliyor...`);

  try {
    execSync(`npm install ${packageToInstall} --quiet > /dev/null 2>&1`, { stdio: 'ignore' });
    console.log(`✅ ${packageToInstall} başarıyla indirildi.`);
  } catch (error: any) {
    console.error(`❌ Hata oluştu: ${error.message}`);
    process.exit(1);
  }

  process.exit(0);
}

console.error('❌ Hata: Geçersiz komut!');
process.exit(1);
