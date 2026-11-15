import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createYoutube,fetchChannelData,validateConfig,validSlug} from './hub.mjs';
import {validateFeed,safeFeed} from '../public/js/creatorpromote-hub.js';

export async function atomicJson(file,data) {
  const temporary=file+'.tmp';
  await fs.writeFile(temporary,JSON.stringify(data,null,2)+'\n','utf8');
  await fs.rename(temporary,file);
}
/** No API key required when a mock youtube function is supplied. Never deploys or commits. */
export async function runUpdate({root, youtube, target='', fetcher=globalThis.fetch, now=()=>new Date().toISOString(), bootstrap=true}) {
  const out=path.join(root,'public','data');
  const config=JSON.parse(await fs.readFile(path.join(root,'config','channels.json'),'utf8'));
  const enabled=validateConfig(config.channels).filter(c=>c.enabled);
  if(target&&(!validSlug(target)||!enabled.some(c=>c.slug===target)))throw Error('Unknown or disabled channel');
  if(!enabled.length)throw Error('No enabled channels configured');
  await fs.mkdir(out,{recursive:true});
  const feeds=new Map(),missing=[],failures=[];
  for(const c of enabled){
    let previous;
    try{previous=validateFeed(JSON.parse(await fs.readFile(path.join(out,c.slug+'.json'),'utf8')),c.slug);}catch{}
    if(previous && c.channelId && previous.channel.id!==c.channelId)previous=undefined;
    // Clean checkouts may lack generated JSON. Recover only from the fixed public Hub origin.
    if(!previous&&bootstrap){try{
      const response=await fetcher('https://api.creatorpromote.com/data/'+c.slug+'.json',{signal:AbortSignal.timeout(12000)});
      if(response.ok)previous=validateFeed(await response.json(),c.slug);
      if(previous && c.channelId && previous.channel.id!==c.channelId)previous=undefined;
    }catch{}}
    let data=previous;
    if(!target||target===c.slug){
      try{data=await fetchChannelData(c,youtube,now(),previous);if(data.issues.length)failures.push(c.slug);}
      catch{failures.push(c.slug);}
    }
    if(!data){missing.push(c.slug);continue;}
    data=safeFeed(data,Date.parse(now()));
    validateFeed(data,c.slug);
    feeds.set(c.slug,data);
  }
  // Refuse a deployment that would erase an existing endpoint. No partial disk writes.
  if(missing.length)throw Error('No valid feed available for: '+missing.join(', '));
  for(const [slug,data] of feeds)await atomicJson(path.join(out,slug+'.json'),data);
  const entries=enabled.map(c=>({slug:c.slug,label:c.label,handle:c.handle,updatedAt:feeds.get(c.slug).updatedAt,channelId:feeds.get(c.slug).channel.id}));
  await atomicJson(path.join(out,'index.json'),{version:1,updatedAt:now(),channels:entries});
  return {channels:entries.length,failedSectionsInChannels:[...new Set(failures)]};
}
const entry=process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href;
if(import.meta.url===entry){
  try{
    const result=await runUpdate({root:path.resolve(import.meta.dirname,'..'),youtube:createYoutube(process.env.YOUTUBE_API_KEY),target:String(process.env.CHANNEL||'').trim()});
    console.log('Available channels: '+result.channels+'; channels with refresh issues: '+result.failedSectionsInChannels.length);
    if(result.failedSectionsInChannels.length)console.warn('Some sections use saved data. Inspect section timestamps in public JSON.');
  }catch{console.error('Hub update failed. Check configuration and feed availability. No credentials are logged.');process.exitCode=1;}
}
