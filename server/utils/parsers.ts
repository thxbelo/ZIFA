import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mammoth = require('mammoth');
const pdf = require('pdf-parse');
import * as xlsx from 'xlsx';

/**
 * Parses a Word document (.docx) to extract text rows.
 */
export async function parseWordFixtures(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.split('\n').filter(line => line.trim().length > 0);
}

/**
 * Parses a PDF document to extract text.
 */
export async function parsePdfFixtures(buffer: Buffer) {
  const pdfParser = typeof pdf === 'function' ? pdf : (pdf.default || pdf);
  const data = await pdfParser(buffer);
  return data.text.split('\n').filter(line => line.trim().length > 0);
}

/**
 * Parses an Excel file and returns a list of player objects.
 */
export function parsePlayerExcel(buffer: Buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  return data.map((row: any) => ({
    name: row['Name'] || row['name'],
    team: row['Team'] || row['team'],
    position: row['Position'] || row['position'],
    age: parseInt(row['Age'] || row['age']),
    nationality: row['Nationality'] || row['nationality'],
    jersey_number: parseInt(row['Number'] || row['Jersey Number'] || row['number']),
  }));
}
