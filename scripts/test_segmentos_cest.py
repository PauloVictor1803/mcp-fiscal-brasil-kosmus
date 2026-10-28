import unittest
from bs4 import BeautifulSoup
from atualizar_tabelas_oficiais import parse_cest_segments

class SegmentosTest(unittest.TestCase):
    def document(self, duplicate=False):
        rows = [('01', 'Autopeças', '01')] + [(f'{i:02}', f'Segmento {i}', f'{i+1:02}') for i in range(2,26)]
        if duplicate: rows[-1] = ('25','Repetido','01')
        html = '<table>' + ''.join('<tr>'+''.join('<td>'+x+'</td>' for x in row)+'</tr>' for row in rows)+'</table>'
        return BeautifulSoup(html,'html.parser')
    def test_codigo_e_ultima_coluna_nao_item(self):
        result=parse_cest_segments(self.document())
        self.assertEqual(len(result),25)
        self.assertEqual(result['03'],'Segmento 2')
        self.assertEqual(result['01'],'Autopeças')
    def test_duplicado_e_estrutura_incompleta_rejeitados(self):
        with self.assertRaises(ValueError): parse_cest_segments(self.document(True))
        with self.assertRaises(ValueError): parse_cest_segments(BeautifulSoup('<table></table>','html.parser'))

if __name__=='__main__':unittest.main()
