import test from 'node:test';
import assert from 'node:assert/strict';
import {passwordMatches,issueSession,verifySession,sessionCookie,SESSION_SECONDS} from '../lib/admin-session.ts';
test('correct password, signed session, expiry and secret rotation',async()=>{
 assert.equal(await passwordMatches('secret','wrong'),false);assert.equal(await passwordMatches('secret','secret'),true);assert.equal(await passwordMatches('',''),false);
 const now=Date.now(),token=await issueSession('secret',now);
 assert.equal(await verifySession('secret',token,now),true);assert.equal(await verifySession('changed',token,now),false);
 assert.equal(await verifySession('secret',token,now+SESSION_SECONDS*1000),false);
 assert.equal(await verifySession('secret',token+'0',now),false);assert.equal(await verifySession('secret','',now),false);
 assert.ok(sessionCookie(token,true).includes('HttpOnly; SameSite=Strict'));assert.ok(sessionCookie(token,true).endsWith('; Secure'));assert.ok(sessionCookie('',false).includes('Max-Age=0'));
});
