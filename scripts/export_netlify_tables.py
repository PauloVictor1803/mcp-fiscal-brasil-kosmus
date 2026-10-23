"""Exporta dados do fork sem executar os módulos Python de terceiros.

Snapshot para homologação, sem certificação de vigência fiscal. Ausência na
tabela não significa código inválido. Não amplia a amostra de CEST por inferência.
"""
import ast
import hashlib
import json
import sqlite3
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'src/mcp_fiscal_brasil/tabelas/loader.py'
names = ['CFOP_TABLE', 'CST_ICMS_NORMAL', 'CSOSN_TABLE', 'CST_PIS_COFINS',
         'CST_IPI_ENTRADA', 'CST_IPI_SAIDA']
tables = {n.target.id: ast.literal_eval(n.value)
          for n in ast.parse(source.read_text(encoding='utf-8')).body
          if isinstance(n, ast.AnnAssign) and isinstance(n.target, ast.Name)
          and n.target.id in names}
db = ROOT / 'src/mcp_fiscal_brasil/tabelas/data/tabelas_fiscais.db'
with sqlite3.connect(db.as_uri() + '?mode=ro', uri=True) as conn:
    conn.row_factory = sqlite3.Row
    cest = [dict(row) for row in conn.execute('SELECT * FROM cest')]
    relations = [dict(row) for row in conn.execute('SELECT * FROM cest_ncm')]
for row in cest:
    row['ncm_relacionados'] = [r['ncm'] for r in relations if r['cest'] == row['cest']]
tables['CEST'] = {row['cest']: row for row in cest}
tables['metadata'] = {
    'origem': 'PauloVictor1803/mcp-fiscal-brasil-kosmus',
    'commit_origem': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
    'sha256_loader': hashlib.sha256(source.read_bytes()).hexdigest(),
    'sha256_cest_db': hashlib.sha256(db.read_bytes()).hexdigest(),
    'vigencia_validada': False,
    'cobertura': {'CFOP': 'parcial_nao_auditada', 'CST': 'parcial_nao_auditada', 'CEST': 'amostra'},
    'quantidades': {name: len(data) for name, data in tables.items()},
}
target = ROOT / 'netlify-mcp/data/tabelas.json'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(tables, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(tables['metadata'], ensure_ascii=False))
