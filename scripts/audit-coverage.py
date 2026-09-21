"""Refresh every official page/PDF linked from either official homepage; report gaps."""
import runpy,sys,json,concurrent.futures
from pathlib import Path
# Load collector helpers without executing its command-line crawl.
source=Path(__file__).with_name('collect.py').read_text(encoding='utf-8').split("if '--refresh-url'")[0]
ns={'__file__':str(Path(__file__).with_name('collect.py'))};exec(source,ns)
fetch,allowed=ns['fetch'],ns['allowed'];out=ns['OUT']
current={d['url']:d for d in json.loads((out/'knowledge.json').read_text(encoding='utf-8'))}
links=set(current);failures=[];checked=[]
for root in ns['SEEDS'][:2]:
 d,found,error=fetch(root)
 if d:current[d['url']]=d
 if error:failures.append(error)
 links.update(u for u in found if allowed(u))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 for d,found,error in pool.map(fetch,sorted(links)):
  if error:failures.append(error);continue
  if len(d['text'])>40:current[d['url']]=d;checked.append(d['url'])
# Preserve old sources if a fetch fails, while recording that they need review.
(out/'knowledge.json').write_text(json.dumps(list(current.values()),ensure_ascii=False,indent=2),encoding='utf-8')
report={'scope':'All existing sources and official homepage navigation links, including linked PDFs. Not a claim of complete archive or image/OCR coverage.','documents':len(current),'checked':checked,'failures':failures}
(out/'coverage-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'documents':len(current),'checked':len(checked),'failures':failures}),flush=True)
