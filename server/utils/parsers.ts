import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mammoth = require('mammoth');
const pdf = require('pdf-parse');
import * as xlsx from 'xlsx';

const MAX_PARSED_LINES = 500;
const MAX_PLAYER_ROWS = 500;

function cleanLine(line: string) {
  return line.replace(/\0/g, '').trim();
}

/**
 * Parses a Word document (.docx) to extract text rows.
 */
export async function parseWordFixtures(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.split('\n').map(cleanLine).filter(Boolean).slice(0, MAX_PARSED_LINES);
}

/**
 * Parses a PDF document to extract text.
 */
export async function parsePdfFixtures(buffer: Buffer) {
  const pdfParser = typeof pdf === 'function' ? pdf : (pdf.default || pdf);
  const data = await pdfParser(buffer);
  return data.text.split('\n').map(cleanLine).filter(Boolean).slice(0, MAX_PARSED_LINES);
}

/**
 * Parses an Excel file and returns a list of player objects.
 */
export function parsePlayerExcel(buffer: Buffer) {
  const workbook = xlsx.read(buffer, {
    type: 'buffer',
    cellFormula: false,
    cellHTML: false,
    cellNF: false,
    cellStyles: false,
    sheetRows: MAX_PLAYER_ROWS + 1,
  });
  if (workbook.SheetNames.length === 0) throw new Error('Workbook has no sheets');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { raw: false }).slice(0, MAX_PLAYER_ROWS);
  
  return data.map((row: any) => ({
    name: cleanLine(String(row['Name'] || row['name'] || '')),
    team: cleanLine(String(row['Team'] || row['team'] || '')),
    position: cleanLine(String(row['Position'] || row['position'] || '')),
    age: parseInt(row['Age'] || row['age']),
    nationality: cleanLine(String(row['Nationality'] || row['nationality'] || '')),
    jersey_number: parseInt(row['Number'] || row['Jersey Number'] || row['number']),
  }));
}
