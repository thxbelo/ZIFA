import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
console.log('pdf type:', typeof pdf);
console.log('pdf.PDFParse type:', typeof pdf.PDFParse);
if (typeof pdf === 'function') {
    console.log('pdf is a function');
} else {
    console.log('pdf is NOT a function');
}
