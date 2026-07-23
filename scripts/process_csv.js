import fs from 'fs';
import path from 'path';

function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result.map(s => s.trim().replace(/^"|"$/g, ''));
}

function formatDate(dStr) {
  if (!dStr) return '';
  dStr = dStr.trim();
  if (!dStr) return '';
  const parts = dStr.split('/');
  if (parts.length === 3) {
    let day = parts[0].padStart(2, '0');
    let month = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) year = '20' + year;
    return `${day}/${month}/${year}`;
  }
  return dStr;
}

function cleanDNI(dniStr) {
  if (!dniStr) return '';
  return dniStr.replace(/^DNI\s*/i, '').trim();
}

const rawText = fs.readFileSync('scripts/raw_csv.txt', 'utf-8');
const lines = rawText.split('\n');

const employees = [];

for (let line of lines) {
  line = line.trim();
  if (!line) continue;
  const cols = parseCSVLine(line);
  // Row structure:
  // Col 0: empty
  // Col 1: ESTADO (ACTIVO / INACTIVO)
  // Col 2: EMPRESA
  // Col 3: LEGAJO
  // Col 4: COLABORADOR
  // Col 5: FECHA DE INGRESO
  // Col 6: CUIL
  // Col 7: DNI
  // Col 8: FECHA DE NACIMIENTO
  // Col 9: SECTOR
  // Col 10: FECHA DE EGRESO (optional)

  // Check if header or content row
  const estado = cols[1];
  if (estado !== 'ACTIVO' && estado !== 'INACTIVO') continue;

  const empresa = cols[2];
  const legajo = cols[3];
  const colaborador = cols[4];
  const fechaIngreso = formatDate(cols[5]);
  const cuil = cols[6] ? cols[6].replace(/\D/g, '') : '';
  const dni = cleanDNI(cols[7]);
  const fechaNacimiento = formatDate(cols[8]);
  const sector = cols[9] || '';
  const fechaEgreso = formatDate(cols[10]);

  const emp = {
    legajo,
    colaborador,
    estado,
    empresa,
    sector,
    fechaIngreso,
    cuil,
    dni,
    fechaNacimiento,
    ...(fechaEgreso ? { fechaEgreso } : {})
  };

  employees.push(emp);
}

console.log(`Parsed ${employees.length} employees.`);

// Now let's view current initialData.ts structure and replace INITIAL_EMPLOYEES block
const initialDataPath = path.join(process.cwd(), 'src/data/initialData.ts');
let content = fs.readFileSync(initialDataPath, 'utf-8');

const employeesTS = `export const INITIAL_EMPLOYEES: Empleado[] = ${JSON.stringify(employees, null, 2)};\n`;

// Replace from `export const INITIAL_EMPLOYEES: Empleado[] = [` to the end of array `];`
const startIdx = content.indexOf('export const INITIAL_EMPLOYEES: Empleado[] = [');
if (startIdx === -1) {
  console.error('Could not find INITIAL_EMPLOYEES in initialData.ts');
  process.exit(1);
}

const nextExportIdx = content.indexOf('export const INITIAL_NOVEDADES', startIdx);
if (nextExportIdx === -1) {
  console.error('Could not find INITIAL_NOVEDADES in initialData.ts');
  process.exit(1);
}

const newContent = content.substring(0, startIdx) + employeesTS + '\n' + content.substring(nextExportIdx);
fs.readFileSync(initialDataPath, 'utf-8');
fs.writeFileSync(initialDataPath, newContent, 'utf-8');
console.log('Successfully updated initialData.ts!');
