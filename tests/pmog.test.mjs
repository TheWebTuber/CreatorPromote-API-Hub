import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fetchChannelData} from '../scripts/hub.mjs';
import {safeFeed,validateFeed} from '../public/js/creatorpromote-hub.js';

test('PMOG full scan uses five list calls and supplies compatible statistics, content and safe live observations',async()=>{
  const {channels}=JSON.parse(await fs.readFile(new URL('../config/channels.json',import.meta.url)));
  const cfg=channels.find(c=>c.slug==='portalmasterofgames');
  const stamp='2026-11-17T12:00:00Z', calls=[];
  const youtube=async(resource,params)=>{
    calls.push(resource);
    if(resource==='channels')return {items:[{id:cfg.channelId,snippet:{title:'Portal Master Of Games'},statistics:{subscriberCount:'1234',viewCount:'5678',videoCount:'100'},contentDetails:{relatedPlaylists:{uploads:'UUfixture'}}}]};
    if(resource==='playlistItems'){
      const page=Number(params.pageToken||0);
      return {items:Array.from({length:50},(_,i)=>({contentDetails:{videoId:String(page*50+i).padStart(11,'0')}})),...(page===0?{nextPageToken:'1'}:{})};
    }
    if(resource==='videos')return {items:params.id.split(',').map(id=>({id,snippet:{title:'Test '+id,publishedAt:stamp,liveBroadcastContent:id==='00000000000'?'live':'none'},status:{privacyStatus:'public'},contentDetails:{duration:'PT5M'},...(Number(id)<2?{liveStreamingDetails:{actualStartTime:stamp,...(Number(id)===1?{actualEndTime:stamp}:{})}}:{})}))};
    throw Error('Unexpected endpoint');
  };
  const data=validateFeed(await fetchChannelData(cfg,youtube,stamp),cfg.slug);
  assert.equal(data.channel.id,'UCdOJvhjojFe3Z0yKeGEIERA');
  assert.equal(data.catalog.length,100);assert.equal(data.latestVideos.length,6);
  assert.equal(data.latestLivestreams.length,2);assert.equal(data.latestReplays.length,1);
  assert.equal(data.channel.statistics.subscriberCount,'1234');
  assert.equal(data.sections.videos.status,'fresh');assert.equal(data.liveStatus.status,'live');
  assert.equal(calls.length,5);assert.ok(!calls.includes('search'));
  const stale=safeFeed(data,Date.parse(stamp)+46*60000);
  assert.equal(stale.live,null);assert.equal(stale.liveStatus.status,'unknown');
  assert.ok(stale.latestLivestreams.every(v=>!v.live));
});
