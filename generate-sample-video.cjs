/**
 * Generate a sample affirmation MP4-like video file.
 * Since we can't create a real MP4 without ffmpeg, this creates a 
 * minimal placeholder. The video player will show the poster image
 * and the full UI controls will be functional.
 * 
 * For a real video, connect the affirmation service to an AI video API
 * or place a real MP4 file at public/affirmation-sample.mp4
 */

const fs = require('fs');
const path = require('path');

// Create a minimal MP4 file header (ftyp + moov atoms for a valid but empty MP4)
// This ensures the browser recognizes it as a video file
// The video element will show the poster and not error on the file type

const ftyp = Buffer.from([
  0x00, 0x00, 0x00, 0x1C, // size: 28 bytes
  0x66, 0x74, 0x79, 0x70, // 'ftyp'
  0x69, 0x73, 0x6F, 0x6D, // 'isom'
  0x00, 0x00, 0x02, 0x00, // minor version
  0x69, 0x73, 0x6F, 0x6D, // compatible brand: isom
  0x69, 0x73, 0x6F, 0x32, // compatible brand: iso2
  0x6D, 0x70, 0x34, 0x31, // compatible brand: mp41
]);

const moov = Buffer.from([
  0x00, 0x00, 0x00, 0x08, // size: 8 bytes (minimal moov)
  0x6D, 0x6F, 0x6F, 0x76, // 'moov'
]);

const mp4 = Buffer.concat([ftyp, moov]);

const outputPath = path.join(__dirname, 'public', 'affirmation-sample.mp4');
fs.writeFileSync(outputPath, mp4);

console.log(`Created placeholder MP4 at: ${outputPath} (${mp4.length} bytes)`);
console.log('Replace this with a real affirmation video for production use.');
