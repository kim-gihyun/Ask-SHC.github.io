import requests, json, re, hashlib, time, io, concurrent.futures, sys
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urldefrag
from pathlib import Path
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data'; OUT.mkdir(exist_ok=True)
RAW=OUT/'originals'; RAW.mkdir(exist_ok=True)
HOSTS={'shunhingcollege.hku.hk','jockeyv3.hku.hk'}
SEEDS=['https://shunhingcollege.hku.hk/','https://jockeyv3.hku.hk/','https://jockeyv3.hku.hk/management-rules-of-jockey-club-student-village-iii/','https://jockeyv3.hku.hk/regulations-governing-residential-colleges/','https://jockeyv3.hku.hk/warm-reminder-for-residents/','https://jockeyv3.hku.hk/fees-and-charges-2/','https://jockeyv3.hku.hk/?page_id=910','https://jockeyv3.hku.hk/?page_id=905']
seen=set(); docs=[]; failures=[]; hashes=set()
def normal(u):
 u=urldefrag(u)[0].replace('http://','https://').replace('://www.', '://')
 return u
def allowed(u):
 p=urlparse(u)
 return p.hostname in HOSTS and not re.search(r'\.(jpg|jpeg|png|gif|webp|mp4|zip|ics|css|js)$',p.path,re.I) and not any(x in u for x in ['/feed','/wp-json','/author/','/tag/','/page/','replytocom','attachment_id','/category/'])
def fetch(u):
 try:
  r=requests.get(u,timeout=35,headers={'User-Agent':'SHC-KnowledgeBase-Research/1.0'}); r.raise_for_status()
  u=normal(r.url); pdf='pdf' in r.headers.get('content-type','') or urlparse(u).path.lower().endswith('.pdf')
  links=[]; pages=[]
  if pdf:
   reader=PdfReader(io.BytesIO(r.content))
   pages=[{'page':i+1,'text':p.extract_text() or ''} for i,p in enumerate(reader.pages)]
   title=urlparse(u).path.split('/')[-1].replace('.pdf','').replace('_',' ').replace('-',' ')
   body='\n\n'.join(p['text'] for p in pages)
  else:
   soup=BeautifulSoup(r.content,'html.parser')
   links=[normal(urljoin(u,a['href'])) for a in soup.select('a[href]')]
   title=soup.title.get_text(' ',strip=True) if soup.title else u
   for t in soup.select('script,style,nav,header,footer,#main-header,#main-footer,#top-header,.menu,.sidebar,#sidebar,.comment-respond,.comments-area'):t.decompose()
   main=soup.select_one('.entry-content') or soup.select_one('article') or soup.select_one('#main-content') or soup.body or soup
   body=main.get_text('\n',strip=True)
  body=re.sub(r'\n{3,}','\n\n',body).strip()
  digest=hashlib.sha256(body.encode()).hexdigest()
  ident=hashlib.sha256(u.encode()).hexdigest()[:16]
  if pdf:(RAW/(ident+'.pdf')).write_bytes(r.content)
  category='College life'
  for cat,terms in [('Rules & regulations',['rule','regulation','reminder']),('Admissions & fees',['admission','fee','charge','scholarship']),('Facilities & services',['facilit','laundry','check-in','check-out','faq','hall','booking']),('Contacts & support',['contact','tutorial','adviser'])]:
   if any(t in (title+' '+u).lower() for t in terms):category=cat;break
  dates=re.findall(r'(?:Last\s+(?:Revised|Updated)|Revised|Updated)\s*:?\s*([^\n]{3,55})',body,re.I)
  years=re.findall(r'20\d{2}[-–/]20?\d{2}|20\d{2}-\d{2}',title+' '+u)
  historic=bool(re.search(r'201[0-9]|202[0-4]|2025[-_/]26|2025-2026',title+' '+u))
  return {'id':ident,'title':title.split(' | ')[0].split(' – Jockey')[0], 'url':u,'organization':'SHC' if 'shunhing' in u else 'JCSV III','category':category,'kind':'PDF' if pdf else 'Web page','retrievedAt':time.strftime('%Y-%m-%d'),'updatedLabel':dates[-1] if dates else None,'historical':historic,'text':body,'pages':pages,'hash':digest},links,None
 except Exception as e:return None,[],{'url':u,'error':str(e)[:180]}

if '--refresh-url' in sys.argv:
 url=normal(sys.argv[sys.argv.index('--refresh-url')+1])
 if not allowed(url):raise SystemExit('Only official SHC/JCSV III pages may be refreshed.')
 doc,links,error=fetch(url)
 if error:raise SystemExit(json.dumps(error))
 current=json.loads((OUT/'knowledge.json').read_text(encoding='utf-8'))
 current=[d for d in current if d['url']!=doc['url']]+[doc]
 (OUT/'knowledge.json').write_text(json.dumps(current,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'refreshed':doc['url'],'characters':len(doc['text']),'documents':len(current)}))
 raise SystemExit(0)

queue=SEEDS
for depth in range(3):
 batch=[u for u in dict.fromkeys(queue) if allowed(u) and u not in seen][:220-len(seen)]
 if not batch:break
 seen.update(batch);queue=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
  for d,links,error in ex.map(fetch,batch):
   if error:failures.append(error);continue
   if len(d['text'])>100 and d['hash'] not in hashes:
    hashes.add(d['hash']);docs.append(d)
   for link in links:
    # Root navigation, documents, and operational pages; avoid an unbounded news archive.
    if depth==0 or '.pdf' in link.lower() or re.search(r'regulat|rule|admiss|fee|charge|facilit|contact|check|faq|remind|guide|handbook|scholar|service|form',link,re.I):queue.append(link)
 print(json.dumps({'depth':depth,'documents':len(docs),'visited':len(seen),'next':len(queue),'failures':len(failures)}),flush=True)
 (OUT/'knowledge.json').write_text(json.dumps(docs,ensure_ascii=False,indent=2),encoding='utf-8')
 (OUT/'collection-report.json').write_text(json.dumps({'visited':len(seen),'failures':failures,'documents':len(docs)},indent=2),encoding='utf-8')
print('Collection complete',flush=True)

