"""Reconstrói as tabelas de referência em fontes oficiais; falha sem substituir.

Uso: python scripts/atualizar_tabelas_oficiais.py --fontes-dir <pasta> [--download]
Dependências de manutenção: requests, beautifulsoup4, pypdf (não usadas em produção).
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import time

from bs4 import BeautifulSoup
from pypdf import PdfReader
import requests

ROOT = Path(__file__).resolve().parents[1]
URLS = {
    'cest.html': 'https://www.confaz.fazenda.gov.br/legislacao/convenios/2018/CV142_18',
    'cfop_consolidado.html': 'https://www.confaz.fazenda.gov.br/legislacao/ajustes/sinief/cfop_cvsn_1-6.24/',
    'sinief_atual.html': 'https://www.confaz.fazenda.gov.br/legislacao/ajustes/sinief/cvsn_70',
    'moc.pdf': 'https://www.confaz.fazenda.gov.br/legislacao/arquivo-manuais/moc7-anexo-i-leiaute-e-rv.pdf',
}
RELAY_URL = 'https://ats-fontes-oficiais-teste.paulo-magalhaes.workers.dev/'
RELAY_NAMES = {'cest.html':'cest', 'cfop_consolidado.html':'cfop', 'sinief_atual.html':'icms', 'moc.pdf':'moc'}

def clean(text):
    return re.sub(r'\s+', ' ', text.replace('\xa0', ' ')).strip()

def telemetry(response):
    diagnostic = {}
    try:
        if response.headers.get('X-Source-Diagnostics'):
            diagnostic = json.loads(response.headers['X-Source-Diagnostics'])
        elif response.status_code == 502:
            diagnostic = response.json()
    except (ValueError, requests.JSONDecodeError):
        pass
    if not isinstance(diagnostic,dict): diagnostic = {}
    return {'worker_cache':response.headers.get('X-Worker-Cache'),
        'fetched_at':response.headers.get('X-Fetched-At'),
        'cf_placement':response.headers.get('cf-placement'),
        'cf_ray':response.headers.get('CF-Ray'),
        'origem_cf_cache':diagnostic.get('origem_cf_cache'),
        'diagnostico':diagnostic}

def download(directory, via_cloudflare=False):
    def fetch(item):
        name, url = item
        for attempt in range(3):
            print(f'Baixando {name}, tentativa {attempt + 1}/3', flush=True)
            start = time.monotonic()
            try:
                response = requests.get(RELAY_URL if via_cloudflare else url,
                    params={'fonte':RELAY_NAMES[name], 'formato':'arquivo'} if via_cloudflare else None,
                    timeout=(12, 55), allow_redirects=False)
                record = {'fonte':name, 'tentativa':attempt+1, 'http':response.status_code,
                    'bytes':len(response.content), 'segundos':round(time.monotonic()-start,3),
                    'timestamp_utc':datetime.now(timezone.utc).isoformat(), **telemetry(response)}
                if response.status_code != 200:
                    record['erro'] = response.text[:1500]
                print('COLETA ' + json.dumps(record,ensure_ascii=False),flush=True)
                response.raise_for_status()
                if response.status_code != 200:
                    raise ValueError(f'Resposta inesperada da fonte: {name}')
                break
            except (requests.ConnectionError, requests.Timeout, requests.HTTPError) as error:
                status = error.response.status_code if isinstance(error,requests.HTTPError) and error.response is not None else None
                print(json.dumps({'fonte':name,'tentativa':attempt+1,'erro':type(error).__name__,
                    'http':status,'segundos':round(time.monotonic()-start,3)},ensure_ascii=False),flush=True)
                if attempt == 2 or (status is not None and status not in [408,425,429,500,502,503,504]):
                    raise
                time.sleep(2 ** attempt)
        payload = response.content
        if via_cloudflare:
            if response.headers.get('X-Official-Source') != url:
                raise ValueError(f'Origem da ponte não confere: {name}')
            if response.headers.get('X-Source-SHA256') != hashlib.sha256(payload).hexdigest():
                raise ValueError(f'Hash da ponte não confere: {name}')
        if len(payload) < 20000: raise ValueError(f'Fonte muito pequena: {name}')
        if name.endswith('.pdf') and not payload.startswith(b'%PDF'): raise ValueError('PDF inválido')
        (directory / name).write_bytes(payload)
        return {'fonte':name, 'ok':True, 'tentativas':attempt+1, 'bytes':len(payload), **telemetry(response)}
    results = []
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = {pool.submit(fetch,item):item[0] for item in URLS.items()}
        for future in as_completed(futures):
            try: results.append(future.result())
            except Exception as error:
                results.append({'fonte':futures[future],'ok':False,'erro':str(error)[:1500]})
    print('RESUMO_COLETA ' + json.dumps(results,ensure_ascii=False),flush=True)
    failures = [r['fonte'] for r in results if not r['ok']]
    if failures:
        raise RuntimeError('Coleta incompleta; tabela anterior preservada. Fontes: ' + ', '.join(sorted(failures)))

def soup(directory, name):
    document = BeautifulSoup((directory / name).read_text(encoding='utf-8'), 'html.parser')
    return document.select_one('#content-core') or document

def reject_future(document, reference):
    # O portal publica redações futuras antes da entrada em vigor. Não escolher
    # automaticamente a primeira redação nesse caso: manter a base anterior.
    for p in document.find_all('p'):
        if any('Ant' in cls for cls in p.get('class', [])): continue
        text = clean(p.get_text(' ', strip=True))
        if 'efeitos' not in text.lower(): continue
        for day, month, year in re.findall(r'(\d{2})[./](\d{2})[./](\d{2,4})(?!\d)', text):
            year = int(year) + ((1900 if int(year) >= 70 else 2000) if len(year) == 2 else 0)
            try: date = datetime(year, int(month), int(day)).date()
            except ValueError: continue
            if date > reference and ('a partir' in text.lower() or 'desde' in text.lower()):
                raise ValueError(f'Redação futura exige revisão: {text[:220]}')

def parse_cfop(document):
    rows = {}
    for p in document.find_all('p'):
        if any('Ant' in cls for cls in p.get('class', [])): continue
        match = re.match(r'^([123567])\.(\d{3})\s*[-–]\s*(.+)$', clean(p.get_text(' ', strip=True)))
        if not match: continue
        code, description = match[1] + match[2], match[3].rstrip('.')
        if description.isupper(): continue  # cabeçalhos de grupos não são CFOP operacionais
        rows.setdefault(code, [description, 'entrada' if code[0] in '123' else 'saida',
                               {'1': 'estadual', '5': 'estadual', '2': 'interestadual',
                                '6': 'interestadual', '3': 'exterior', '7': 'exterior'}[code[0]]])
    if not 600 <= len(rows) <= 750: raise ValueError(f'Cobertura CFOP inesperada: {len(rows)}')
    assert 'substituição tributária' in rows['1403'][0].lower()
    assert rows['7667'][0].startswith('Saída de combustíveis')
    assert '1650' not in rows and '5100' not in rows
    return rows

def note_dates(text):
    def date(match):
        if not match: return None
        day, month, year = match.groups()
        return datetime(int(year) + ((1900 if int(year) >= 70 else 2000) if len(year) == 2 else 0), int(month), int(day)).date()
    pattern = r'(\d{2})[./](\d{2})[./](\d{2,4})(?!\d)'
    start = date(re.search(r'(?:a partir de|desde)\s*' + pattern, text, re.I))
    end = date(re.search(r'até\s*' + pattern, text, re.I))
    interval = re.search(r'efeitos de\s*' + pattern + r'\.?\s*a\s*' + pattern, text, re.I)
    if interval:
        start = datetime.strptime('.'.join(interval.groups()[:3]), '%d.%m.%y' if len(interval[3]) == 2 else '%d.%m.%Y').date()
        end = datetime.strptime('.'.join(interval.groups()[3:]), '%d.%m.%y' if len(interval[6]) == 2 else '%d.%m.%Y').date()
    return start, end

def parse_cest(document, reference):
    tables = document.find_all('table')
    main = []
    for table in tables:
        previous = ' '.join(p.get_text(' ', strip=True) for p in table.find_all_previous('p', limit=4))
        if 'ANEXO XXVII' in previous: break  # exemplos/exceções e retificações não são novos cadastros
        main.append(table)
    if len(main) != 26: raise ValueError(f'Estrutura CEST mudou: {len(main)} tabelas principais')
    rows, future = {}, {}
    for table in main[1:]:  # primeiro quadro apenas lista segmentos
        note = ''
        for tr in table.find_all('tr'):
            cells = [clean(c.get_text(' ', strip=True)) for c in tr.find_all('td', recursive=False)]
            if len(cells) < 4 or not re.fullmatch(r'\d{2}\.\d{3}\.\d{2}', cells[1]):
                if any('efeitos' in c.lower() or 'revogad' in c.lower() for c in cells): note = ' '.join(cells)
                continue
            # Algumas linhas oficiais têm uma quinta célula vazia de formatação.
            if any(cells[4:]): raise ValueError(f'Colunas inesperadas CEST: {cells[1]}')
            code = cells[1].replace('.', '')
            start, end = note_dates(note)
            no_effect = 'sem efeitos' in note.lower()
            note = ''
            if no_effect or (end and end < reference): continue
            if start and start > reference:
                future.setdefault(code, {'status': 'vigencia_futura', 'inicio': start.isoformat()})
                continue
            if code in rows: continue  # consolidado: redação atual vem antes das versões anteriores
            description = cells[3]
            if 'revogad' in (cells[2] + description).lower():
                rows[code] = {'status': 'revogado'}
                continue
            ncms = re.findall(r'\b(?:\d{8}|\d{4}(?:\.\d{1,2}){0,2})\b', cells[2])
            if not description: raise ValueError(f'Registro CEST incompleto: {code}')
            rows[code] = {'descricao': description, 'ncm_sh': list(dict.fromkeys(ncms)),
                         'ncm_sh_texto_fonte': cells[2], 'status': 'ativo'}
            if start: rows[code]['inicio'] = start.isoformat()
            if end: rows[code]['fim'] = end.isoformat()
            if cells[2] and not ncms:
                # Erro tipográfico presente no próprio texto oficial: não inventar
                # prefixos nem substituir a consulta Siscomex existente.
                rows[code]['ncm_sh_requer_conferencia'] = True
    for code, row in future.items(): rows.setdefault(code, row)
    if not 1000 <= len(rows) <= 1500: raise ValueError(f'Cobertura CEST inesperada: {len(rows)}')
    assert 'gaxetas' in rows['0100700']['descricao'].lower()
    assert rows['0302200']['descricao'] == 'Cerveja sem álcool em garrafa de vidro retornável'
    assert rows['0111000']['status'] == 'revogado'
    assert rows['0104200']['ncm_sh'] == ['8421.32.00']
    return rows

def parse_icms_csosn(document):
    tables = document.find_all('table')
    icms, csosn = {}, {}
    for table, out, size in [(tables[0], icms, 2), (tables[-1], csosn, 3)]:
        for tr in table.find_all('tr'):
            cells = tr.find_all('td', recursive=False)
            if len(cells) != 2: continue
            code = clean(cells[0].get_text(' ', strip=True))
            if not re.fullmatch(r'\d{' + str(size) + '}', code) or code in out: continue
            first = cells[1].find('p')
            description = clean((first or cells[1]).get_text(' ', strip=True))
            out[code] = {'descricao': description, 'status': 'revogado' if 'revogad' in description.lower() else 'ativo'}
    origins = {}
    started = False
    for p in document.find_all('p'):
        text = clean(p.get_text(' ', strip=True))
        if text.startswith('Tabela A - Origem'): started = True; continue
        if started and text.startswith('Tabela B - Tributa'): break
        if started:
            match = re.match(r'^([0-8])\s*[-–]\s*(.+)$', text)
            if match: origins.setdefault(match[1], match[2])
    assert len(origins) == 9
    assert len(csosn) == 10 and csosn['101']['status'] == 'ativo'
    assert all(icms[k]['status'] == 'ativo' for k in ['02', '15', '53', '61'])
    assert all(icms[k]['status'] == 'revogado' for k in ['12', '13', '52', '72', '74'])
    return icms, csosn, origins

def parse_pdf_codes(text):
    result, current = {}, None
    for line in text.splitlines():
        line = clean(line)
        match = re.search(r'(?<!\d)(\d{2})=(.+)$', line)
        if match:
            current = match[1]
            result[current] = match[2].rstrip(';')
        elif current and line and not re.match(r'^(?:\d{3}(?:[.,]\d+)?\s+[A-Z]\d|Grupo |Nota Fiscal|MOC |Página |# ID)', line):
            result[current] += ' ' + line.rstrip(';')
        else: current = None
    return result

def parse_ipi_pis_cofins(path):
    reader = PdfReader(path)
    pages = [reader.pages[i].extract_text() for i in range(50, 56)]
    ipi = parse_pdf_codes(pages[0].split('Grupo P.')[0])
    pis = parse_pdf_codes((pages[1] + '\n' + pages[2] + '\n' + pages[3]).split('Grupo R.')[0])
    cofins_text = ('\n'.join(pages[3:])).split('Grupo S. COFINS', 1)[1].split('Grupo T.', 1)[0]
    cofins = parse_pdf_codes(cofins_text)
    expected_pis = {f'{i:02}' for i in range(1, 10)} | {'49', '98', '99'} | {str(i) for i in range(50, 57)} | {str(i) for i in range(60, 68)} | {str(i) for i in range(70, 76)}
    assert set(pis) == set(cofins) == expected_pis
    assert set(ipi) == {'00','01','02','03','04','05','49','50','51','52','53','54','55','99'}
    assert 'Direito a Crédito' in pis['50'] and ipi['50'] == 'Saída tributada'
    for table in [ipi, pis, cofins]:
        assert all(len(v) < 300 and ' E Q' not in v and ' E S' not in v for v in table.values())
    return ipi, pis, cofins

def rebuild(directory, reference):
    cfop_doc, cest_doc, sinief_doc = [soup(directory, n) for n in ['cfop_consolidado.html', 'cest.html', 'sinief_atual.html']]
    for doc in [cfop_doc, sinief_doc]: reject_future(doc, reference)
    cfop = parse_cfop(cfop_doc)
    cest = parse_cest(cest_doc, reference)
    icms, csosn, origins = parse_icms_csosn(sinief_doc)
    ipi, pis, cofins = parse_ipi_pis_cofins(directory / 'moc.pdf')
    result = {'CFOP_TABLE': cfop, 'CEST': cest, 'CST_ICMS': icms, 'CSOSN_TABLE': csosn,
              'ORIGENS': origins, 'CST_IPI': ipi, 'CST_PIS': pis, 'CST_COFINS': cofins}
    result['metadata'] = {'validacao': 'aprovada', 'data_referencia': reference.isoformat(),
        'natureza': 'consulta de referência documental; não define enquadramento tributário',
        'fontes': {name: {'url': url, 'sha256': hashlib.sha256((directory / name).read_bytes()).hexdigest()}
                   for name, url in URLS.items()},
        'quantidades': {name: len(value) for name, value in result.items()},
        'ncm': 'Utilizar a consulta Siscomex existente; sem tabela NCM substituta.'}
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--fontes-dir', type=Path, required=True)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--via-cloudflare', action='store_true', help='Coleta pela ponte fixa da ATS, mantendo fontes oficiais e hashes')
    parser.add_argument('--data', default=datetime.now(timezone.utc).date().isoformat())
    args = parser.parse_args()
    args.fontes_dir.mkdir(parents=True, exist_ok=True)
    if args.via_cloudflare and not args.download:
        parser.error('--via-cloudflare exige --download')
    if args.download: download(args.fontes_dir, args.via_cloudflare)
    reference = datetime.strptime(args.data, '%Y-%m-%d').date()
    result = rebuild(args.fontes_dir, reference)
    if args.via_cloudflare:
        result['metadata']['coleta_via'] = RELAY_URL
    target = ROOT / 'netlify-mcp/data/tabelas.json'
    temporary = target.with_suffix('.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    temporary.replace(target)
    print(json.dumps({'referencia': args.data, 'quantidades': result['metadata']['quantidades']}, ensure_ascii=True))
