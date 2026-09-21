import test from 'node:test';import assert from 'node:assert/strict';import {sourceScope} from '../lib/source-scope.ts';
test('SHC-hosted HKU regulations remain university-wide',()=>assert.match(sourceScope({title:'Regulations Governing Residential Colleges',organization:'SHC'}),/HKU residential colleges generally/));
test('village rules are not restricted to their host college',()=>assert.equal(sourceScope({title:'Management Rules of JCSV III',organization:'SHC'}),'JCSV III village-wide'));
