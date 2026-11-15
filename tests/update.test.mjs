import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {runUpdate} from '../scripts/update.mjs';
const time='2026-11-14T10:00:00.000Z',later='2026-11-14T11:00:00.000Z';
const cfg={slug:'example',label:'Example',handle:'@example',enabled:true};
const id='abcdefghijk';
const feed={version:1,slug:'example',label:'Example',updatedAt:time,channel:{id:'UC_example',statistics:{subscriberCount:'42'},contentDetails:{relatedPlaylists:{uploads:'UU_example'}}},uploads:[],replays:[],latestVideos:[],latestLivestreams:[{id,live:true}],latestReplays:[],collabs:[],live:{id},liveChecked:true,liveStatus:{status:'live',checkedAt:time}};
async function sandbox(fn){
 const dir=await fs.mkdtemp(new URL('./.test-run-',import.meta.url));
 try{await fs.mkdir(path.join(dir,'config'));await fs.writeFile(path.join(dir,'config/channels.json'),JSON.stringify({channels:[cfg]}));await fn(dir);}
 finally{
  // Only these test-created files and empty directories can be removed.
  for(const f of ['public/data/example.json','public/data/index.json','config/channels.json'])await fs.unlink(path.join(dir,f)).catch(()=>{});
  for(const d of ['public/data','public','config',''])await fs.rmdir(path.join(dir,d)).catch(()=>{});
 }
}
const outage=async()=>{throw Error('Simulated upstream outage');};
test('updater preserves cached stats and expires LIVE during complete outage',()=>sandbox(async root=>{
 await fs.mkdir(path.join(root,'public/data'),{recursive:true});await fs.writeFile(path.join(root,'public/data/example.json'),JSON.stringify(feed));
 await runUpdate({root,youtube:outage,bootstrap:false,now:()=>later});
 const data=JSON.parse(await fs.readFile(path.join(root,'public/data/example.json')));
 assert.equal(data.updatedAt,time);assert.equal(data.channel.statistics.subscriberCount,'42');assert.equal(data.live,null);
}));
test('missing endpoint prevents partial output and index',()=>sandbox(async root=>{
 await assert.rejects(runUpdate({root,youtube:outage,bootstrap:false}),/No valid feed/);
 await assert.rejects(fs.access(path.join(root,'public/data/index.json')));
}));
test('clean checkout recovers from fixed public origin with no API credentials',()=>sandbox(async root=>{
 let url;await runUpdate({root,youtube:outage,now:()=>later,fetcher:async input=>{url=input;return {ok:true,json:async()=>feed};}});
 assert.equal(url,'https://api.creatorpromote.com/data/example.json');assert.equal(JSON.parse(await fs.readFile(path.join(root,'public/data/example.json'))).live,null);
}));
test('wrong-creator bootstrap fails without writing output',()=>sandbox(async root=>{
 await assert.rejects(runUpdate({root,youtube:outage,fetcher:async()=>({ok:true,json:async()=>({...feed,slug:'other'})})}),/No valid feed/);
 await assert.rejects(fs.access(path.join(root,'public/data/example.json')));
}));
test('unknown target rejected before network or writes',()=>sandbox(async root=>{
 await assert.rejects(runUpdate({root,target:'other',youtube:outage,fetcher:()=>{throw Error('Must not run');}}),/Unknown/);
 await assert.rejects(fs.access(path.join(root,'public')));
}));
