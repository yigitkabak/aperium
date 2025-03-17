#!/usr/bin/env ts-node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const chalk_1 = __importDefault(require("chalk"));
const readline_1 = __importDefault(require("readline"));
// Terminalde interaktif menü için readline arayüzü
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
});
const args = process.argv.slice(2);
// HUH dosyasını analiz eden fonksiyon
const analyzeHuhFile = async (filePath) => {
    const data = await promises_1.default.readFile(filePath);
    const buffer = new Uint8Array(data);
    const width = new DataView(buffer.buffer).getUint32(0, true);
    const height = new DataView(buffer.buffer).getUint32(4, true);
    const expectedPixels = width * height;
    const pixels = [];
    for (let i = 8; i < buffer.length; i += 3) {
        if (i + 2 < buffer.length) {
            const r = buffer[i];
            const g = buffer[i + 1];
            const b = buffer[i + 2];
            pixels.push([r, g, b]);
        }
    }
    // Piksel istatistikleri
    let totalR = 0, totalG = 0, totalB = 0;
    const colorFrequency = {};
    pixels.forEach(([r, g, b]) => {
        totalR += r;
        totalG += g;
        totalB += b;
        const colorKey = `${r},${g},${b}`;
        colorFrequency[colorKey] = (colorFrequency[colorKey] || 0) + 1;
    });
    const avgR = totalR / pixels.length || 0;
    const avgG = totalG / pixels.length || 0;
    const avgB = totalB / pixels.length || 0;
    // En çok kullanılan 5 renk
    const topColors = Object.entries(colorFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color]) => `rgb(${color})`);
    // Veri integritesi kontrolü
    const integrity = pixels.length === expectedPixels;
    // Renk paleti önerisi
    const palette = topColors.map(color => {
        const [r, g, b] = color.match(/\d+/g).map(Number);
        const variation = `rgb(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)})`;
        return `${color}, ${variation}`;
    });
    // Renk frekans haritası (ASCII sanatı ile)
    const maxFreq = Math.max(...Object.values(colorFrequency));
    const colorMapLines = [];
    colorMapLines.push(chalk_1.default.cyan('Renk Frekans Haritası (Yoğunluk Gösterimi):'));
    const scale = 20; // Terminalde gösterim için ölçek
    Object.entries(colorFrequency)
        .slice(0, 5) // İlk 5 renk
        .forEach(([color, freq]) => {
        const barLength = Math.round((freq / maxFreq) * scale);
        const bar = '█'.repeat(barLength) + '-'.repeat(scale - barLength);
        colorMapLines.push(chalk_1.default.white(`[${color}] ${bar} (${freq} piksel)`));
    });
    const colorMap = colorMapLines.join('\n');
    // Piksel değişim hızı analizi
    let totalChange = 0;
    for (let i = 1; i < pixels.length; i++) {
        const [r1, g1, b1] = pixels[i - 1];
        const [r2, g2, b2] = pixels[i];
        const change = Math.sqrt((r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2);
        totalChange += change;
    }
    const changeRate = totalChange / pixels.length || 0;
    return { width, height, pixelCount: pixels.length, pixels, stats: { avgR, avgG, avgB, topColors }, integrity, palette, colorMap, changeRate };
};
// Analiz sonuçlarını terminalde gösteren ve interaktif menü sunan fonksiyon
const huhFileViewer = async (filePath) => {
    try {
        if (!filePath.endsWith('.huh')) {
            console.error(chalk_1.default.red('❌ Hata: Lütfen geçerli bir .huh dosyası belirtin.'));
            process.exit(1);
        }
        const analysis = await analyzeHuhFile(filePath);
        const showDetails = () => {
            console.log(chalk_1.default.cyan('=== HUH Dosya Analizi ==='));
            console.log(chalk_1.default.white('Dosya Detayları:'));
            console.log(chalk_1.default.white(`- Genişlik: ${analysis.width}px`));
            console.log(chalk_1.default.white(`- Yükseklik: ${analysis.height}px`));
            console.log(chalk_1.default.white(`- Piksel Sayısı: ${analysis.pixelCount}`));
            console.log(chalk_1.default.white(`- Veri Entegritesi: ${analysis.integrity ? chalk_1.default.green('Geçerli') : chalk_1.default.red('Geçersiz - Beklenen: ' + (analysis.width * analysis.height) + ', Bulunan: ' + analysis.pixelCount)}`));
        };
        const showStats = () => {
            console.log(chalk_1.default.white('\nPiksel İstatistikleri:'));
            console.log(chalk_1.default.white(`- Ortalama Kırmızı: ${analysis.stats.avgR.toFixed(2)}`));
            console.log(chalk_1.default.white(`- Ortalama Yeşil: ${analysis.stats.avgG.toFixed(2)}`));
            console.log(chalk_1.default.white(`- Ortalama Mavi: ${analysis.stats.avgB.toFixed(2)}`));
            console.log(chalk_1.default.white(`- En Çok Kullanılan 5 Renk: ${analysis.stats.topColors.join(', ')}`));
            console.log(chalk_1.default.white(`- Piksel Değişim Hızı: ${analysis.changeRate.toFixed(2)} (Düşük: Düz Alan, Yüksek: Detaylı Desen)`));
        };
        const showColorMap = () => {
            console.log(chalk_1.default.white('\n' + analysis.colorMap));
        };
        const showPalette = () => {
            console.log(chalk_1.default.white('\nTasarım için Renk Paleti Önerisi:'));
            analysis.palette.forEach((p, i) => {
                console.log(chalk_1.default.white(`- Palet ${i + 1}: ${p}`));
            });
        };
        const exportReport = async () => {
            const report = {
                details: {
                    width: analysis.width,
                    height: analysis.height,
                    pixelCount: analysis.pixelCount,
                    integrity: analysis.integrity,
                },
                stats: analysis.stats,
                changeRate: analysis.changeRate,
                palette: analysis.palette,
            };
            const reportPath = 'huh_analysis_report.json';
            await promises_1.default.writeFile(reportPath, JSON.stringify(report, null, 2));
            console.log(chalk_1.default.green(`✅ Analiz raporu ${reportPath} dosyasına kaydedildi.`));
        };
        // İnteraktif menü
        const showMenu = () => {
            console.log(chalk_1.default.cyan('\n=== Analiz Menüsü ==='));
            console.log(chalk_1.default.white('1: Dosya Detaylarını Göster'));
            console.log(chalk_1.default.white('2: Piksel İstatistiklerini Göster'));
            console.log(chalk_1.default.white('3: Renk Frekans Haritasını Göster'));
            console.log(chalk_1.default.white('4: Renk Paleti Önerisini Göster'));
            console.log(chalk_1.default.white('5: Analizi Rapor Olarak Dışa Aktar'));
            console.log(chalk_1.default.white('6: Çıkış'));
            rl.question(chalk_1.default.yellow('Seçiminizi yapın (1-6): '), (answer) => {
                switch (answer) {
                    case '1':
                        showDetails();
                        showMenu();
                        break;
                    case '2':
                        showStats();
                        showMenu();
                        break;
                    case '3':
                        showColorMap();
                        showMenu();
                        break;
                    case '4':
                        showPalette();
                        showMenu();
                        break;
                    case '5':
                        exportReport().then(() => showMenu());
                        break;
                    case '6':
                        console.log(chalk_1.default.yellow('Programdan çıkılıyor...'));
                        rl.close();
                        process.exit(0);
                    default:
                        console.log(chalk_1.default.red('Geçersiz seçim! Lütfen 1-6 arasında bir sayı girin.'));
                        showMenu();
                }
            });
        };
        // İlk menüyü göster
        showMenu();
    }
    catch (err) {
        const error = err;
        console.error(chalk_1.default.red('🚨 .huh dosyası analiz edilirken hata oluştu:'), error.message);
        process.exit(1);
    }
};
// Ana fonksiyon
const main = async () => {
    if (args.length === 0) {
        console.log(chalk_1.default.yellow('Kullanım: huh <dosya_yolu>'));
        console.log(chalk_1.default.yellow('Örnek: huh yigit.huh'));
        process.exit(0);
    }
    const filePath = args[0];
    await huhFileViewer(filePath);
};
// Programı çalıştır
main();
