"""Preserve the official Teams navigation and refresh its linked SHC pages."""
import json, hashlib, time, concurrent.futures
from pathlib import Path
source=Path(__file__).with_name('collect.py').read_text(encoding='utf-8').split("if '--refresh-url'")[0]
ns={'__file__':str(Path(__file__).with_name('collect.py'))};exec(source,ns)
soup=ns['BeautifulSoup'](ns['requests'].get(ns['SEEDS'][0],timeout=35).content,'html.parser')
anchor=next(a for a in soup.select('a') if a.get_text(' ',strip=True)=='Teams')
root=anchor.find_parent('li'); groups=[]; links=[]
for item in root.find('ul',recursive=False).find_all('li',recursive=False):
 label=item.find('a',recursive=False).get_text(' ',strip=True)
 entries=[]
 for a in item.select('ul a[href]'):
  if a.get_text(' ',strip=True)==label:continue
  url=ns['normal'](ns['urljoin'](ns['SEEDS'][0],a['href']))
  entries.append({'name':a.get_text(' ',strip=True),'url':url});links.append(url)
 groups.append({'category':label,'entries':entries})
assert len(links)>=25, 'Teams menu extraction incomplete'
out=ns['OUT'];docs=json.loads((out/'knowledge.json').read_text(encoding='utf-8')); current={d['id']:d for d in docs}; failures=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
 for doc,_,error in pool.map(ns['fetch'],[u for u in links if ns['allowed'](u)]):
  if error:failures.append(error)
  elif doc and doc['text']:current[doc['id']]=doc
text='Official SHC website Teams navigation. These are the organisations listed on the website; listing does not confirm current recruitment or activity.\n\n'+'\n\n'.join(g['category']+'\n'+'\n'.join(e['name']+' — '+e['url'] for e in g['entries']) for g in groups)
current['shc-student-organisations-directory']={'id':'shc-student-organisations-directory','title':'SHC student teams, committees and clubs directory','url':ns['SEEDS'][0],'organization':'SHC','category':'Student organisations','kind':'Web page','retrievedAt':time.strftime('%Y-%m-%d'),'updatedLabel':None,'historical':False,'text':text}
(out/'knowledge.json').write_text(json.dumps(list(current.values()),ensure_ascii=False,indent=2),encoding='utf-8')
(out/'teams-directory.json').write_text(json.dumps({'groups':groups,'failures':failures,'retrievedAt':time.strftime('%Y-%m-%d')},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'listedGroups':len(links),'refreshed':len(links)-sum(not ns['allowed'](u) for u in links)-len(failures),'failures':failures}))
