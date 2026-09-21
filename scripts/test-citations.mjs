import test from 'node:test';
import assert from 'node:assert/strict';
import {citedEvidence} from '../lib/citations.ts';
test('unused evidence is removed without swapping citation meanings',()=>{
 assert.deepEqual(citedEvidence('Third [3], first [1], third again [3].',['first','unused','third']),{answer:'Third [2], first [1], third again [2].',sources:['first','third']});
});
test('uncited fallback evidence remains available',()=>assert.deepEqual(citedEvidence('Read the excerpts.',['source']),{answer:'Read the excerpts.',sources:['source']}));
