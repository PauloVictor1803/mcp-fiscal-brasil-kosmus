"""Mede fontes reais sem substituir tabelas; mantém resultado de cada chamada."""
import hashlib
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import time
import requests

BASE='https://ats-fontes-oficiais-teste.paulo-magalhaes.workers.dev/'
FILES={'cfop':'cfop_consolidado.html','icms':'sinief_atual.html','moc':'moc.pdf','cest':'cest.html'}
ROOT=Path(__file__).resolve().parents[1]
REFERENCE=json.loads((ROOT/'netlify-mcp/data/tabelas.json').read_text(encoding='utf-8'))['metadata']['fontes']

def collect(name,nocache,attempt):
    start=time.monotonic()
    record={'fonte':name,'nocache':nocache,'medicao':attempt,'timestamp_utc':datetime.now(timezone.utc).isoformat()}
    try:
        r=requests.get(BASE,params={'fonte':name,'formato':'arquivo',**({'nocache':'1'} if nocache else {})},timeout=(12,60),allow_redirects=False)
        record.update(http=r.status_code,bytes=len(r.content),worker_cache=r.headers.get('X-Worker-Cache'),
            fetched_at=r.headers.get('X-Fetched-At'),placement=r.headers.get('cf-placement'),cf_ray=r.headers.get('CF-Ray'))
        try:
            d=json.loads(r.headers['X-Source-Diagnostics']) if r.headers.get('X-Source-Diagnostics') else r.json() if r.status_code==502 else {}
        except ValueError:d={}
        record['diagnostico']=d
        if r.status_code==200:
            sha=hashlib.sha256(r.content).hexdigest()
            record.update(sha256=sha,hash_igual_cabecalho=sha==r.headers.get('X-Source-SHA256'),
                hash_igual_referencia=sha==REFERENCE[FILES[name]]['sha256'],origem_correta=r.headers.get('X-Official-Source')==REFERENCE[FILES[name]]['url'],
                formato_valido=r.content.startswith(b'%PDF') if name=='moc' else b'<html' in r.content[:1000].lower() or b'<!doctype' in r.content[:1000].lower())
            record['valido']=all(record[k] for k in ['hash_igual_cabecalho','origem_correta','formato_valido']) and 20000<=len(r.content)<=6000000
            if nocache:record['valido']=record['valido'] and record['worker_cache']=='BYPASS' and d.get('sem_cache') is True and d.get('origem_cf_cache') not in ['HIT','STALE','UPDATING']
            # Cabeçalho CDN ausente permanece desconhecido; não prova origem direta.
            record['cache_cdn_informado']=d.get('origem_cf_cache') is not None
        else:record.update(valido=False,erro=r.text[:1800])
    except requests.RequestException as e:record.update(valido=False,erro=type(e).__name__+': '+str(e))
    record['segundos']=round(time.monotonic()-start,3)
    print('MEDICAO '+json.dumps(record,ensure_ascii=False),flush=True)
    return record

def main():
    results=[]
    for name in FILES:results.append(collect(name,True,1));time.sleep(1.5)
    for attempt in [2,3]:results.append(collect('moc',True,attempt));time.sleep(3)
    for attempt in [1,2]:results.append(collect('moc',False,attempt));time.sleep(1.5)
    output=ROOT/'diagnostico-fontes-resultado.json'
    output.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    if os.getenv('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'],'a',encoding='utf-8') as f:
            f.write('| Fonte | Sem cache | Medição | HTTP | Worker | CDN | Placement | Válido |\n|---|---|---|---|---|---|---|---|\n')
            for r in results:f.write('| '+' | '.join(str(v) for v in [r['fonte'],r['nocache'],r['medicao'],r.get('http'),r.get('worker_cache'),r.get('diagnostico',{}).get('origem_cf_cache'),r.get('placement'),r['valido']])+' |\n')
    baseline=results[:4]
    if not all(r['valido'] for r in baseline):raise SystemExit('Diagnóstico sem cache incompleto; consultar resultado por fonte. Nenhuma tabela foi publicada.')

if __name__=='__main__':main()
