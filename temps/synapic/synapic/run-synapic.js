#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ana fonksiyon
function runSynapic() {
  console.log('Synapic uygulaması başlatılıyor...');
  
  // Olası synapic dizini yolları
  const possiblePaths = [
    // Mevcut dizinde
    path.join(process.cwd(), 'synapic'),
    // Ana dizinde
    path.join(process.cwd(), '..', 'synapic'),
    // Sabit yol (eğer biliyorsanız ayarlayın)
    '/data/data/com.termux/files/home/synapic'
  ];
  
  // Var olan ilk dizini bul
  let synapicPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      synapicPath = testPath;
      break;
    }
  }
  
  if (!synapicPath) {
    console.error('Hata: synapic dizini bulunamadı!');
    console.error('Lütfen synapic dizininin doğru yolunu kontrol edin.');
    console.error('Denenen yollar:');
    possiblePaths.forEach(p => console.error(` - ${p}`));
    return;
  }
  
  console.log(`Synapic dizini bulundu: ${synapicPath}`);
  
  // Yolu doğrudan kullanarak app.js'yi çalıştır
  const appPath = path.join(synapicPath, 'app.js');
  const command = `node "${appPath}"`;
  
  console.log(`Çalıştırılacak komut: ${command}`);
  
  // Komutu çalıştır
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Hata oluştu: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
    }
    
    console.log(`Stdout: ${stdout}`);
    console.log('Synapic uygulaması başarıyla çalıştırıldı.');
  });
}

// Programı çalıştır
runSynapic();