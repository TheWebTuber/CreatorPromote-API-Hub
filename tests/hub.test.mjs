import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createYoutube,fetchChannelData,validSlug,validVideoId,validateConfig} from '../scripts/hub.mjs';

const videoId = (c) => c.repeat(11);
const details = (id, kind, date) => ({
  id, snippet:{title:kind+' '+id,publishedAt:date,liveBroadcastContent:kind==='live'?'live':'none',thumbnails:{medium:{url:'https://i.ytimg.com/vi/'+id+'/mqdefault.jpg'}}},
  statistics:{viewCount:'12'},
  ...(kind==='replay'?{liveStreamingDetails:{actualStartTime:date,actualEndTime:date}}:
      kind==='live'?{liveStreamingDetails:{actualStartTime:date}}:{})
});

function mockYoutube() {
  const calls=[];
  const videos=[details(videoId('a'),'video','2026-11-12T00:00:00Z'),details(videoId('b'),'replay','2026-11-11T00:00:00Z'),details(videoId('c'),'live','2026-11-13T00:00:00Z')];
  const fetcher=async input=>{
    const u=new URL(input);
    calls.push({method:u.pathname.split('/').at(-1),key:u.searchParams.get('key')});
    const endpoint=u.pathname.split('/').at(-1);
    let response;
    if(endpoint==='channels') response={items:[{id:'UC_test',snippet:{title:'Example Creator'},statistics:{subscriberCount:'900'},contentDetails:{relatedPlaylists:{uploads:'UU_test'}}}]};
    else if(endpoint==='playlistItems')response={items:(u.searchParams.get('playlistId')==='UU_test'?videos:[]).map(v=>({contentDetails:{videoId:v.id}}))};
    else if(endpoint==='videos')response={items:videos.filter(v=>u.searchParams.get('id').split(',').includes(v.id))};
    else response={error:{errors:[{reason:'bad endpoint'}]}};
    return {ok:!response.error,status:response.error?400:200,json:async()=>response};
  };
  return {youtube:createYoutube('TEST_SECRET',fetcher),calls};
}

test('configured creator names have unique valid slugs; Duffball16 stays disabled',()=>{
  const config=JSON.parse(fs.readFileSync(new URL('../config/channels.json',import.meta.url),'utf8'));
  const entries=validateConfig(config.channels);
  assert.equal(entries.length,9);
  assert.equal(entries.filter(c=>c.enabled).length,5);
  assert(entries.filter(c=>c.identityVerified===false).every(c=>!c.enabled));
  assert.equal(entries.find(c=>c.slug==='duffball16').enabled,false);
  assert(entries.some(c=>c.slug==='daddydepresso'&&c.collabPlaylists.length===3));
});

test('slug/video validation excludes path injection',()=>{
  assert(validSlug('dreamdropscrew'));
  assert(!validSlug('../../secret'));
  assert(validVideoId('FRVmoksciRg'));
  assert(!validVideoId('<bad-id>'));
});

test('one channel uses only low-cost list methods and returns legacy-compatible JSON',async()=>{
  const {youtube,calls}=mockYoutube();
  const result=await fetchChannelData({slug:'example',label:'Example',handle:'@example',latestCount:6,livestreamCount:6},youtube,'2026-11-14T00:00:00Z');
  assert.equal(result.channel.id,'UC_test');
  assert.equal(result.uploads.length,3);
  assert.equal(result.replays.length,1);
  assert.equal(result.latestLivestreams.length,2);
  assert.equal(result.live.id,videoId('c'));
  assert.equal(result.liveStatus.status,'live');
  assert.equal(result.channel.statistics.subscriberCount,'900');
  assert(calls.every(c=>['channels','playlistItems','videos'].includes(c.method)));
  assert(calls.every(c=>c.key==='TEST_SECRET'));
});

test('no live in scanned uploads is UNKNOWN, never definitively offline',async()=>{
  const {youtube}=mockYoutube();
  const wrapped=async(name,args)=>{
    const result=await youtube(name,args);
    if(name==='videos')result.items=result.items.filter(v=>v.id!==videoId('c'));
    return result;
  };
  const data=await fetchChannelData({slug:'example',label:'Example',handle:'@example'},wrapped);
  assert.equal(data.live,null);
  assert.equal(data.liveStatus.status,'unknown');
  assert.equal(data.liveChecked,false);
});

test('invalid or missing API key never prints a request URL with key',async()=>{
  assert.throws(()=>createYoutube(''),/missing/i);
  const yt=createYoutube('SECRET_DO_NOT_PRINT',async()=>({ok:false,status:403,json:async()=>({error:{errors:[{reason:'quotaExceeded'}],message:'Quota temporarily exceeded'}})}));
  await assert.rejects(()=>yt('videos',{id:videoId('a')}),error=>error.message.includes('quotaExceeded')&&!error.message.includes('SECRET_DO_NOT_PRINT'));
});

test('invalid YouTube playlist can fail without aborting all creator data',async()=>{
  const {youtube}=mockYoutube();
  const wrapped=async(method,args)=>{
    if(method==='playlistItems' && args.playlistId==='BAD_PLAYLIST')throw Error('playlistNotFound');
    return youtube(method,args);
  };
  const data=await fetchChannelData({slug:'example',label:'Example',handle:'@example',collabPlaylists:[{id:'BAD_PLAYLIST',label:'invalid collab'}]},wrapped);
  assert.equal(data.collabIssues.length,1);
  assert(data.uploads.length>0);
});
