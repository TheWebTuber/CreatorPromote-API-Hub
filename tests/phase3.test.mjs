import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fetchChannelData,validateConfig} from '../scripts/hub.mjs';
const config=JSON.parse(await fs.readFile(new URL('../config/channels.json',import.meta.url)));
test('Phase 3 leaves the four live feeds enabled and all new feeds disabled',()=>{
  const channels=validateConfig(config.channels);
  assert.deepEqual(channels.filter(c=>c.enabled).map(c=>c.slug),['thedocrot','dreamdropscrew','daddydepresso','bonakvt']);
  for(const slug of ['duffball16','portalmasterofgames']) {
    const c=channels.find(c=>c.slug===slug);assert.equal(c.identityVerified,true);assert.equal(c.enabled,false);
  }
  for(const slug of ['blackjacksetzer','crystalsdreamdrops','salahare'])assert.equal(channels.find(c=>c.slug===slug).identityVerified,false);
});
test('Duffball catalog and three playlist pages preserve the website scan coverage without search',async()=>{
  const cfg=config.channels.find(c=>c.slug==='duffball16');const calls=[];
  const stamp='2026-11-16T12:00:00Z';
  const youtube=async(resource,params)=>{
    calls.push(resource);
    if(resource==='channels')return {items:[{id:cfg.channelId,snippet:{title:'Synthetic Duffball fixture'},statistics:{subscriberCount:'1234'},contentDetails:{relatedPlaylists:{uploads:'UUfixture'}}}]};
    const page=Number(params.pageToken||0);
    if(resource==='playlistItems')return {items:Array.from({length:50},(_,n)=>({contentDetails:{videoId:String(page*50+n).padStart(11,'0')}})),...(page<4?{nextPageToken:String(page+1)}:{})};
    if(resource==='videos')return {items:params.id.split(',').map(id=>({id,snippet:{title:'Synthetic '+id,publishedAt:stamp},status:{privacyStatus:'public'},contentDetails:{duration:'PT1M'}}))};
    if(resource==='playlists')return {items:Array.from({length:50},(_,n)=>({id:'PL'+String(page*50+n).padStart(12,'0'),snippet:{title:'Synthetic playlist'},status:{privacyStatus:'public'},contentDetails:{itemCount:1}})),...(page<2?{nextPageToken:String(page+1)}:{})};
    throw Error('Unexpected endpoint');
  };
  const feed=await fetchChannelData(cfg,youtube,stamp);
  assert.equal(feed.catalog.length,250);assert.equal(feed.playlists.length,150);
  assert.equal(calls.length,14);assert.ok(!calls.includes('search'));
  assert.equal(feed.channel.id,cfg.channelId);
});
