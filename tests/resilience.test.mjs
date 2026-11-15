import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchChannelData,createYoutube,validateConfig} from '../scripts/hub.mjs';
import {createHubClient,safeFeed,validateFeed,LIVE_MAX_AGE_MS} from '../public/js/creatorpromote-hub.js';
const time='2026-11-14T10:00:00.000Z', later='2026-11-14T11:00:00.000Z', id='abcdefghijk';
const cfg={slug:'example',label:'Example',handle:'@example',enabled:true};
const video={id,snippet:{title:'Live',publishedAt:time,liveBroadcastContent:'live'},contentDetails:{duration:'PT2M'},status:{privacyStatus:'public',embeddable:true},liveStreamingDetails:{actualStartTime:time},statistics:{viewCount:'8'}};
function mock({fail=[],empty=false}={}){return async(method,args)=>{
 if(fail.includes(method)||fail.includes(args.playlistId))throw Error('Simulated failure');
 if(method==='channels')return {items:[{id:'UC_example',snippet:{title:'Example'},brandingSettings:{channel:{description:'Extra links'}},statistics:{subscriberCount:'42'},contentDetails:{relatedPlaylists:{uploads:'UU_example'}}}]};
 if(method==='playlistItems')return {items:empty?[]:[{contentDetails:{videoId:id}}]};
 if(method==='videos')return {items:empty?[]:[structuredClone(video)]};
 if(method==='playlists')return {items:[{id:'PL_example',snippet:{title:'Minecraft'},contentDetails:{itemCount:4},status:{privacyStatus:'public'}}]};
 throw Error('Unexpected method');
};}
const fixture=()=>fetchChannelData(cfg,mock(),time);

test('additive schema retains legacy fields and adds catalog, duration, branding and playlists',async()=>{
 const data=await fetchChannelData({...cfg,includePlaylists:true},mock(),time);
 for(const key of ['version','slug','label','updatedAt','source','channel','uploads','replays','live','liveChecked','latestVideos','latestLivestreams','latestReplays','liveStatus','collabs','collabIssues','scannedUploadCount','scanNote'])assert(key in data,key);
 assert.equal(data.version,1);assert.equal(data.latestVideos[0].duration,'PT2M');assert.equal(data.catalog[0].status.embeddable,true);
 assert.equal(data.channel.brandingSettings.channel.description,'Extra links');assert.equal(data.playlists.length,1);
});
test('scan cap supports eight pages and deduplicates IDs',async()=>{
 let pages=0,batches=0;const yt=mock();await fetchChannelData({...cfg,scanPages:99},async(method,args)=>{
 if(method==='playlistItems'){pages++;return {items:[{contentDetails:{videoId:id}}],nextPageToken:String(pages)};}
 if(method==='videos'){batches++;assert.equal(args.id,id);}return yt(method,args);
 },time);assert.equal(pages,8);assert.equal(batches,1);
});
test('video failure retains old catalog and timestamp while statistics update',async()=>{
 const data=await fetchChannelData(cfg,mock({fail:['videos']}),later,await fixture());
 assert.equal(data.catalog.length,1);assert.equal(data.sections.videos.updatedAt,time);assert.equal(data.sections.videos.status,'cached');
 assert.equal(data.sections.channel.updatedAt,later);assert.equal(data.live,null);assert.equal(data.latestLivestreams[0].live,false);
});
test('channel failure retains stats while uploads refresh independently',async()=>{
 const data=await fetchChannelData(cfg,mock({fail:['channels']}),later,await fixture());
 assert.equal(data.channel.statistics.subscriberCount,'42');assert.equal(data.sections.channel.status,'cached');assert.equal(data.sections.videos.status,'fresh');
});
test('collaboration failures preserve individual sources',async()=>{
 const config={...cfg,collabPlaylists:[{id:'PL_one'},{id:'PL_two'}]};const before=await fetchChannelData(config,mock(),time);
 const data=await fetchChannelData(config,mock({fail:['PL_two']}),later,before);
 assert.equal(data.collabSources.PL_one.status,'fresh');assert.equal(data.collabSources.PL_two.status,'cached');
 assert.equal(data.collabSources.PL_two.updatedAt,time);assert.equal(data.collabSources.PL_two.items.length,1);assert.equal(data.collabSources.PL_two.items[0].live,false);
 assert.equal(data.collabs.length,1);assert.equal(data.collabIssues.length,1);
});
test('legacy collaboration list survives partial failure without attribution',async()=>{
 const before=await fixture();before.collabs=[{id:'zzzzzzzzzzz',title:'Old collab',publishedAt:time}];delete before.collabSources;
 const config={...cfg,collabPlaylists:[{id:'PL_fail'}]};
 const data=await fetchChannelData(config,mock({fail:['PL_fail']}),later,before);assert.equal(data.collabs[0].id,'zzzzzzzzzzz');
 const again=await fetchChannelData(config,mock({fail:['PL_fail']}),later,data);assert.equal(again.collabs[0].id,'zzzzzzzzzzz');
});
test('playlist failure preserves prior playlists',async()=>{
 const config={...cfg,includePlaylists:true};const before=await fetchChannelData(config,mock(),time);
 const data=await fetchChannelData(config,mock({fail:['playlists']}),later,before);assert.equal(data.playlists[0].id,'PL_example');assert.equal(data.sections.playlists.status,'cached');
});
test('empty success replaces old data; malformed response does not',async()=>{
 const before=await fixture();const empty=await fetchChannelData(cfg,mock({empty:true}),later,before);assert.equal(empty.catalog.length,0);
 const yt=mock();const broken=await fetchChannelData(cfg,async(m,a)=>m==='videos'?{}:yt(m,a),later,before);assert.equal(broken.catalog.length,1);assert.equal(broken.sections.videos.status,'cached');
});
test('different channel cannot inherit previous data',async()=>{await assert.rejects(fetchChannelData({...cfg,channelId:'UC_other'},mock({fail:['channels']}),later,await fixture()));});
test('unverified channels cannot be enabled',()=>assert.throws(()=>validateConfig([{...cfg,identityVerified:false}]),/not verified/));
test('API errors cannot echo request keys or arbitrary upstream text',async()=>{
 const secret='DO_NOT_EXPOSE';const yt=createYoutube(secret,async()=>({ok:false,status:403,json:async()=>({error:{errors:[{reason:'quotaExceeded'}],message:'https://example.test/?key='+secret}})}));
 await assert.rejects(yt('videos'),e=>e.message.includes('quotaExceeded')&&!e.message.includes(secret)&&!e.message.includes('https'));
});
test('malformed successful API response rejected',async()=>{const yt=createYoutube('mock',async()=>({ok:true,json:async()=>({})}));await assert.rejects(yt('videos'),/Invalid/);});
test('missing channel statistics cannot overwrite successful cached stats',async()=>{
 const yt=mock();const data=await fetchChannelData(cfg,async(m,a)=>{const result=await yt(m,a);if(m==='channels')delete result.items[0].statistics;return result;},later,await fixture());
 assert.equal(data.channel.statistics.subscriberCount,'42');assert.equal(data.sections.channel.status,'cached');
});
test('stale live flags cleared in every view without mutating source',async()=>{
 const data=await fixture();const result=safeFeed(data,Date.parse(time)+LIVE_MAX_AGE_MS+1);
 assert.equal(result.live,null);assert.equal(result.liveChecked,false);assert.equal(result.liveStatus.status,'unknown');assert.equal(result.latestVideos[0].live,false);assert.equal(result.catalog[0].snippet.liveBroadcastContent,'none');assert.equal(data.live.id,id);
});
test('invalid and future observation times cannot claim LIVE',async()=>{
 const data=await fixture();for(const value of ['nonsense',later]){data.liveStatus.checkedAt=value;assert.equal(safeFeed(data,Date.parse(time)).live,null);}
});
test('client deduplicates, caches and recalculates live freshness',async()=>{
 const data=await fixture();let calls=0,clock=Date.parse(time);const client=createHubClient({now:()=>clock,fetcher:async()=>{calls++;return {ok:true,json:async()=>data};},storage:null});
 await Promise.all([client.get('example'),client.get('example')]);assert.equal(calls,1);clock+=60000;assert.equal((await client.get('example')).source,'cache');assert.equal(calls,1);
 clock+=LIVE_MAX_AGE_MS;assert.equal((await client.get('example')).data.live,null);
});
test('client retains valid cache on HTTP, wrong creator and malformed JSON',async()=>{
 const data=await fixture();let mode=0;const client=createHubClient({now:()=>Date.parse(later),storage:null,fetcher:async()=>mode===1?{ok:false,status:503}:{ok:true,json:async()=>mode===2?{...data,slug:'other'}:mode===3?null:data}});
 await client.get('example');for(mode of [1,2,3]){const result=await client.get('example',{force:true});assert.equal(result.source,'fallback');assert.equal(result.data.live,null);}
});
test('blocked storage and corrupt cache do not prevent loading',async()=>{
 const data=await fixture();for(const storage of [{getItem:()=>'{',setItem:()=>{throw Error();}},{getItem:()=>{throw Error();},setItem:()=>{throw Error();}}]){
 const client=createHubClient({now:()=>Date.parse(time),storage,fetcher:async()=>({ok:true,json:async()=>data})});assert.equal((await client.get('example')).source,'network');}
});
test('cold start timeout rejects safely',async()=>{const client=createHubClient({storage:null,timeoutMs:5,fetcher:()=>new Promise(()=>{})});await assert.rejects(client.get('example'),/unavailable/);});
test('client rejects bad slugs, schemas and insecure base URLs',async()=>{await assert.rejects(createHubClient({storage:null}).get('../bad'));assert.throws(()=>validateFeed({},'example'));assert.throws(()=>createHubClient({baseUrl:'http://example.test'}));});
test('older deployments cannot replace newer cache',async()=>{
 const data=await fixture();let fresh=true;const client=createHubClient({now:()=>Date.parse(later),storage:null,fetcher:async()=>({ok:true,json:async()=>({...data,updatedAt:fresh?later:time})})});
 await client.get('example');fresh=false;const result=await client.get('example',{force:true});assert.equal(result.data.updatedAt,later);assert.equal(result.source,'fallback');
});
test('subscription clears LIVE on its expiry timer without another download',{timeout:2000},async()=>{
 const data=await fixture();let clock=Date.parse(time),calls=0;
 const client=createHubClient({storage:null,maxLiveAgeMs:10,now:()=>clock,fetcher:async()=>{calls++;return {ok:true,json:async()=>data};}});
 await new Promise((resolve,reject)=>{
   const stop=client.subscribe('example',value=>{
     if(value.data.live){clock+=11;}
     else {stop();resolve();}
   },reject);
 });
 assert.equal(calls,1);
});
