import test from 'node:test';import assert from 'node:assert/strict';
import {clarifyQuestion} from '../lib/question-clarification.ts';
test('vague help is welcomed instead of rejected for missing evidence',()=>{for(const q of ['help','Hi!','What can you do?','?'])assert.ok(clarifyQuestion(q,false));});
test('room booking distinguishes accommodation from facilities',()=>assert.match(clarifyQuestion('How do I book a room?',false),/residential.*function/));
test('specific requests and follow-ups are not intercepted',()=>{assert.equal(clarifyQuestion('How do I book a function room?',false),null);assert.equal(clarifyQuestion('?',true),null);});
