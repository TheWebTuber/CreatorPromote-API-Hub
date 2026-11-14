import fs from 'node:fs/promises';
import path from 'node:path';
import {createYoutube, fetchChannelData, validateConfig, validSlug} from './hub.mjs';

const ROOT=path.resolve(import.meta.dirname,'..');
const OUT=path.join(ROOT,'public','data');
const config=JSON.parse(await fs.readFile(path.join(ROOT,'config','channels.json'),'utf8'));
const channels=validateConfig(config.channels);
const enabled=channels.filter(ch=>ch.enabled);
const target=String(process.env.CHANNEL||'').trim();
if(target && (!validSlug(target) || !enabled.some(c=>c.slug===target))) throw Error('Unknown or disabled channel: '+target);
const selected=target?enabled.filter(c=>c.slug===target):enabled;
if(!selected.length)throw Error('No enabled channels configured');
const yt=createYoutube(process.env.YOUTUBE_API_KEY);
await fs.mkdir(OUT,{recursive:true});
let successes=0, failures=0;
for (const c of selected) {
  try {
    const data=await fetchChannelData(c,yt);
    const file=path.join(OUT,c.slug+'.json');
    await fs.writeFile(file,JSON.stringify(data,null,2)+'\n','utf8');
    successes++;
    console.log(`OK ${c.slug}: ${data.latestVideos.length} videos, ${data.latestLivestreams.length} streams, ${data.collabs.length} collabs`);
    if (data.collabIssues.length) console.warn(`Warning ${c.slug}: some collaboration playlists were unavailable; featured sessions may be shown instead.`);
  } catch(err) {
    failures++;
    console.error(`Could not refresh ${c.slug}: ${err.message}. Keeping the previous successful JSON, if any.`);
    // Don't overwrite the last good result. Never print a URL with the API key.
  }
}
const entries=[];
for(const c of enabled){
  let data;
  try { data=JSON.parse(await fs.readFile(path.join(OUT,c.slug+'.json'),'utf8')); }
  catch { continue; }
  entries.push({slug:c.slug,label:c.label,handle:c.handle,updatedAt:data.updatedAt,channelId:data.channel?.id||null});
}
await fs.writeFile(path.join(OUT,'index.json'),JSON.stringify({version:1,updatedAt:new Date().toISOString(),channels:entries},null,2)+'\n','utf8');
console.log(`Update complete: ${successes} fresh, ${failures} failed, ${entries.length} cached channels available`);
// Treat a totally empty hub as broken so GitHub won't deploy a blank "successful" site.
if(!entries.length)process.exitCode=1;
