#!/usr/bin/env ts-node

import fs from 'fs/promises';
import chalk from 'chalk';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const args = process.argv.slice(2);

const analyzeHuhFile = async (filePath: string): Promise<{
  width: number;
  height: number;
  pixelCount: number;
  pixels: number[][];
  stats: { avgR: number; avgG: number; avgB: number; topColors: string[] };
  integrity: boolean;
  palette: string[];
  colorMap: string;
  changeRate: number;
}> => {
  const data = await fs.readFile(filePath);
  const buffer = new Uint8Array(data);

  const width = new DataView(buffer.buffer).getUint32(0, true);
  const height = new DataView(buffer.buffer).getUint32(4, true);
  const expectedPixels = width * height;

  const pixels: number[][] = [];
  for (let i = 8; i < buffer.length; i += 3) {
    if (i + 2 < buffer.length) {
      const r = buffer[i];
      const g = buffer[i + 1];
      const b = buffer[i + 2];
      pixels.push([r, g, b]);
    }
  }

  let totalR = 0, totalG = 0, totalB = 0;
  const colorFrequency: { [key: string]: number } = {};
  pixels.forEach(([r, g, b]) => {
    totalR += r; totalG += g; totalB += b;
    const colorKey = `${r},${g},${b}`;
    colorFrequency[colorKey] = (colorFrequency[colorKey] || 0) + 1;
  });

  const avgR = totalR / pixels.length || 0;
  const avgG = totalG / pixels.length || 0;
  const avgB = totalB / pixels.length || 0;

  const topColors = Object.entries(colorFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color]) => `rgb(${color})`);

  const integrity = pixels.length === expectedPixels;

  const palette = topColors.map(color => {
    const [r, g, b] = color.match(/\d+/g)!.map(Number);
    const variation = `rgb(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)})`;
    return `${color}, ${variation}`;
  });

  const maxFreq = Math.max(...Object.values(colorFrequency));
  const colorMapLines: string[] = [];
  colorMapLines.push(chalk.cyan('Color Frequency Map (Intensity Display):'));
  const scale = 20;
  Object.entries(colorFrequency)
    .slice(0, 5)
    .forEach(([color, freq]) => {
      const barLength = Math.round((freq / maxFreq) * scale);
      const bar = '█'.repeat(barLength) + '-'.repeat(scale - barLength);
      colorMapLines.push(chalk.white(`[${color}] ${bar} (${freq} pixels)`));
    });
  const colorMap = colorMapLines.join('\n');

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

const huhFileViewer = async (filePath: string): Promise<void> => {
  try {
    if (!filePath.endsWith('.huh')) {
      console.error(chalk.red('❌ Error: Please specify a valid .huh file.'));
      process.exit(1);
    }

    const analysis = await analyzeHuhFile(filePath);

    const showDetails = () => {
      console.log(chalk.cyan('=== HUH File Analysis ==='));
      console.log(chalk.white('File Details:'));
      console.log(chalk.white(`- Width: ${analysis.width}px`));
      console.log(chalk.white(`- Height: ${analysis.height}px`));
      console.log(chalk.white(`- Pixel Count: ${analysis.pixelCount}`));
      console.log(chalk.white(`- Data Integrity: ${analysis.integrity ? chalk.green('Valid') : chalk.red('Invalid - Expected: ' + (analysis.width * analysis.height) + ', Found: ' + analysis.pixelCount)}`));
    };

    const showStats = () => {
      console.log(chalk.white('\nPixel Statistics:'));
      console.log(chalk.white(`- Average Red: ${analysis.stats.avgR.toFixed(2)}`));
      console.log(chalk.white(`- Average Green: ${analysis.stats.avgG.toFixed(2)}`));
      console.log(chalk.white(`- Average Blue: ${analysis.stats.avgB.toFixed(2)}`));
      console.log(chalk.white(`- Top 5 Most Used Colors: ${analysis.stats.topColors.join(', ')}`));
      console.log(chalk.white(`- Pixel Change Rate: ${analysis.changeRate.toFixed(2)} (Low: Flat Area, High: Detailed Pattern)`));
    };

    const showColorMap = () => {
      console.log(chalk.white('\n' + analysis.colorMap));
    };

    const showPalette = () => {
      console.log(chalk.white('\nColor Palette Suggestion for Design:'));
      analysis.palette.forEach((p, i) => {
        console.log(chalk.white(`- Palette ${i + 1}: ${p}`));
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
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(chalk.green(`✅ Analysis report saved to ${reportPath}.`));
    };

    const showMenu = () => {
      console.log(chalk.cyan('\n=== Analysis Menu ==='));
      console.log(chalk.white('1: Show File Details'));
      console.log(chalk.white('2: Show Pixel Statistics'));
      console.log(chalk.white('3: Show Color Frequency Map'));
      console.log(chalk.white('4: Show Color Palette Suggestion'));
      console.log(chalk.white('5: Export Analysis as Report'));
      console.log(chalk.white('6: Exit'));

      rl.question(chalk.yellow('Make your choice (1-6): '), (answer) => {
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
            console.log(chalk.yellow('Exiting program...'));
            rl.close();
            process.exit(0);
          default:
            console.log(chalk.red('Invalid choice! Please enter a number between 1-6.'));
            showMenu();
        }
      });
    };

    showMenu();

  } catch (err: unknown) {
    const error = err as Error;
    console.error(chalk.red('🚨 Error occurred while analyzing .huh file:'), error.message);
    process.exit(1);
  }
};

const main = async (): Promise<void> => {
  if (args.length === 0) {
    console.log(chalk.yellow('Usage: huh <file_path>'));
    console.log(chalk.yellow('Example: huh file.huh'));
    process.exit(0);
  }

  const filePath = args[0];
  await huhFileViewer(filePath);
};

main();