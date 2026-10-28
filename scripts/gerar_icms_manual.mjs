import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const expected = 'AC AL AM AP BA CE DF ES GO MA MT MS MG PA PB PR PE PI RN RS RJ RO RR SC SP SE TO'.split(' ');
export function parseMatrix(csv) {
  const rows = csv.replace(/^\uFEFF/, '').trim().split(/\r?\n/).map(line => line.split(';').map(x => x.trim()));
  if (rows.length !== 28 || rows.some(row => row.length !== 28)) throw new Error('A matriz precisa ter 27 origens e 27 destinos.');
  const destinos = rows[0].slice(1), origens = rows.slice(1).map(row => row[0]);
  const valid = items => items.length === 27 && new Set(items).size === 27 && items.every(uf => expected.includes(uf));
  if (!valid(destinos) || !valid(origens)) throw new Error('UF ausente, duplicada ou desconhecida.');
  return Object.fromEntries(rows.slice(1).map(row => [row[0], Object.fromEntries(destinos.map((destino, index) => {
    const raw = row[index + 1];
    if (!/^\d{1,2}(?:[,.]\d{1,4})?$/.test(raw)) throw new Error(`Percentual inválido em ${row[0]} → ${destino}.`);
    const value = Number(raw.replace(',', '.'));
    if (value < 1 || value >= 100) throw new Error('Use pontos percentuais, por exemplo 19,5; percentual fora do intervalo esperado.');
    return [destino, value];
  }))]));
}

export async function generate() {
  const data = new URL('../netlify-mcp/data/', import.meta.url);
  const metadata = JSON.parse(await fs.readFile(new URL('icms-referencia-manual.metadata.json', data), 'utf8'));
  if (!Number.isInteger(metadata.ano_referencia) || metadata.ano_referencia < 2026 || metadata.atualizacao !== 'manual' || !metadata.url_fonte?.startsWith('https://') || !/^\d{4}-\d{2}-\d{2}$/.test(metadata.registrado_em || '')) throw new Error('Metadados da referência manual inválidos.');
  const matriz = parseMatrix(await fs.readFile(new URL('icms-referencia-manual.csv', data), 'utf8'));
  const target = new URL('icms-referencia-manual.json', data);
  const output = JSON.stringify({ metadata, matriz }, null, 2) + '\n';
  if (process.argv.includes('--check')) {
    if (await fs.readFile(target, 'utf8') !== output) throw new Error('JSON não corresponde ao CSV. Execute gerar_icms_manual.mjs.');
  } else await fs.writeFile(target, output, 'utf8');
  console.log(`Referência ICMS ${metadata.ano_referencia}: 729 percentuais validados.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await generate();
