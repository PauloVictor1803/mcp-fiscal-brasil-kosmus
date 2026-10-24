"""Verifica que falhas parciais não escondem o resultado das demais fontes."""
import contextlib
import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import requests
import atualizar_tabelas_oficiais as coletor

def response(url, status=200):
    r=requests.Response();r.status_code=status;r.url=url
    r._content=(b'%PDF'+b'a'*21000) if url.endswith('.pdf') else (b'<html>'+b'a'*21000)
    return r

class ColetaTest(unittest.TestCase):
    def test_telemetria_cache_e_erro_sem_inferir_origem(self):
        r=response('https://teste')
        r.headers.update({'X-Worker-Cache':'HIT','X-Fetched-At':'2026-10-23T10:00:00Z','X-Source-Diagnostics':'{"origem_http":null,"coleta_anterior":{"origem_http":200}}'})
        meta=coletor.telemetry(r)
        self.assertEqual(meta['worker_cache'],'HIT');self.assertIsNone(meta['diagnostico']['origem_http'])
        r=response('https://teste',502);r._content=b'{"origem_http":522,"origem_bytes":16}'
        self.assertEqual(coletor.telemetry(r)['diagnostico']['origem_http'],522)
        r._content=b'nao e JSON'
        self.assertEqual(coletor.telemetry(r)['diagnostico'],{})

    def test_falha_permanente_nao_esconde_demais_fontes(self):
        calls=[]
        def get(url,**kwargs):
            calls.append(url)
            return response(url,403 if 'CV142_18' in url else 200)
        log=io.StringIO()
        with tempfile.TemporaryDirectory(dir=coletor.ROOT) as tmp,patch.object(coletor.requests,'get',side_effect=get),contextlib.redirect_stdout(log):
            with self.assertRaisesRegex(RuntimeError,'cest.html'):
                coletor.download(Path(tmp))
            self.assertEqual(len(list(Path(tmp).iterdir())),3)
        self.assertEqual(len(calls),4)
        self.assertIn('RESUMO_COLETA',log.getvalue())
        for name in coletor.URLS:self.assertIn(name,log.getvalue())

    def test_falha_transitoria_tem_backoff_e_recupera(self):
        attempts={}
        def get(url,**kwargs):
            attempts[url]=attempts.get(url,0)+1
            return response(url,502 if attempts[url]==1 else 200)
        with tempfile.TemporaryDirectory(dir=coletor.ROOT) as tmp,patch.object(coletor.requests,'get',side_effect=get),patch.object(coletor.time,'sleep') as sleep,contextlib.redirect_stdout(io.StringIO()):
            coletor.download(Path(tmp))
            self.assertEqual(len(list(Path(tmp).iterdir())),4)
            self.assertEqual(sleep.call_count,4)
        self.assertTrue(all(v==2 for v in attempts.values()))

if __name__=='__main__':unittest.main()
