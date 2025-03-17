use image::{self, GenericImageView};
use std::{env, fs::File, io::{self, BufRead, Write}, path::PathBuf};

fn png_to_huh(png_path: PathBuf, huh_path: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    println!("Attempting to open PNG file: {}", png_path.display());
    let img = image::open(&png_path)?.to_rgb8();

    let width = img.width();
    let height = img.height();

    let mut output = Vec::new();

    output.extend_from_slice(&width.to_ne_bytes());
    output.extend_from_slice(&height.to_ne_bytes());

    for pixel in img.pixels() {
        output.push(pixel[0]); // Red
        output.push(pixel[1]); // Green
        output.push(pixel[2]); // Blue
    }

    println!("Writing to HUH file: {}", huh_path.display());
    let mut file = File::create(&huh_path)?;
    file.write_all(&output)?;
    file.flush()?;

    println!("Successfully converted {} to {}", png_path.display(), huh_path.display());
    Ok(())
}

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() == 3 {
        let png_path: PathBuf = args[1].clone().into();
        let huh_path: PathBuf = args[2].clone().into();
        if let Err(e) = png_to_huh(png_path, huh_path) {
            eprintln!("Conversion error: {}", e);
        }
    } else {
        println!("Console arguments are missing. Reading from file.txt...");

        let file_path = "file.txt";
        let file = match File::open(file_path) {
            Ok(file) => file,
            Err(e) => {
                eprintln!("Error opening file.txt: {}", e);
                return;
            }
        };

        let mut lines = io::BufReader::new(file).lines();
        
        let input_file = match lines.next() {
            Some(Ok(line)) => line.trim().to_string(),
            _ => {
                eprintln!("file.txt does not contain the input file name");
                return;
            }
        };

        let output_file = match lines.next() {
            Some(Ok(line)) => line.trim().to_string(),
            _ => {
                eprintln!("file.txt does not contain the output file name");
                return;
            }
        };

        let png_path: PathBuf = input_file.into();
        let huh_path: PathBuf = output_file.into();

        if let Err(e) = png_to_huh(png_path, huh_path) {
            eprintln!("Conversion error: {}", e);
        }
    }
}