/** YouTube Data API client for GitHub Actions; no client-side API keys. */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const CHANNEL_SLUG = /^[a-z0-9][a-z0-9-]{0,55}$/;

export const validVideoId = (id) => VIDEO_ID.test(String(id || ''));
export const validSlug = (slug) => CHANNEL_SLUG.test(String(slug || ''));
export const chunks = (items, length = 50) => Array.from({length: Math.ceil(items.length / length)}, (_, n) => items.slice(n * length, (n + 1) * length));
export const latestFirst = (a, b) => Date.parse(b?.liveStreamingDetails?.actualStartTime || b?.snippet?.publishedAt || 0) - Date.parse(a?.liveStreamingDetails?.actualStartTime || a?.snippet?.publishedAt || 0);

export function validateConfig(channels) {
  if (!Array.isArray(channels) || !channels.length) throw Error('config/channels.json has no channels');
  const seen = new Set();
  for (const c of channels) {
    if (!validSlug(c.slug) || seen.has(c.slug)) throw Error('Invalid/duplicate channel slug: ' + c.slug);
    seen.add(c.slug);
    if (c.enabled && !c.channelId && !String(c.handle || '').startsWith('@')) throw Error('Channel '+c.slug+' needs a handle or channelId');
  }
  return channels;
}

function clipNumber(value, defaultValue, min, max) {
  return Number.isFinite(+value) && value != null ? Math.min(max, Math.max(min, Math.trunc(+value))) : defaultValue;
}

export function createYoutube(apiKey, fetcher = globalThis.fetch) {
  if (!apiKey) throw Error('YOUTUBE_API_KEY secret is missing. Add it in GitHub → Settings → Secrets and variables → Actions.');
  return async function youtube(method, args = {}) {
    const url = new URL('https://www.googleapis.com/youtube/v3/' + method);
    for (const [key, value] of Object.entries(args)) if(value != null && value !== '') url.searchParams.set(key, String(value));
    url.searchParams.set('key', apiKey);
    let result;
    try { result = await fetcher(url.toString(), {signal: AbortSignal.timeout(25000)}); }
    catch { throw Error('YouTube network request failed ('+method+').'); }
    let payload;
    try { payload = await result.json(); }
    catch { throw Error('Invalid YouTube response from '+method+'.'); }
    if (!result.ok || payload?.error) {
      const reason = payload?.error?.errors?.[0]?.reason || payload?.error?.status || String(result.status);
      const description = String(payload?.error?.message || '').slice(0,160);
      // Never print request URL: it contains the private API key.
      throw Error('YouTube '+method+' failed: '+reason+(description ? ' — '+description : ''));
    }
    return payload;
  };
}

async function videosById(youtube, ids) {
  const unique = [...new Set(ids.filter(validVideoId))];
  const found = [];
  for (const batch of chunks(unique,50)) {
    const response = await youtube('videos', {part:'snippet,liveStreamingDetails,statistics', id:batch.join(','), maxResults:50});
    found.push(...(response.items || []));
  }
  return found.filter(v => v?.id && v.snippet?.title && v.snippet.title !== 'Private video' && v.snippet.title !== 'Deleted video');
}

function normalized(v, label='YouTube') {
  const time = v.liveStreamingDetails || {};
  const thumb=v.snippet?.thumbnails || {};
  return {
    id:v.id, title:v.snippet?.title || 'Video',
    label, publishedAt:v.snippet?.publishedAt || null,
    startedAt:time.actualStartTime || null,
    endedAt:time.actualEndTime || null,
    thumbnail: (thumb.medium || thumb.high || thumb.default)?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
    url:`https://www.youtube.com/watch?v=${v.id}`,
    views:v.statistics?.viewCount ?? null,
    live:v.snippet?.liveBroadcastContent === 'live' && Boolean(time.actualStartTime) && !time.actualEndTime,
    wasLive:Boolean(time.actualStartTime)
  };
}

export async function fetchChannelData(cfg, youtube, updatedAt = new Date().toISOString()) {
  const channelCriteria = cfg.channelId ? {id:cfg.channelId} : {forHandle:cfg.handle};
  const ch = await youtube('channels', {part:'snippet,statistics,contentDetails',...channelCriteria});
  const channel=ch.items?.[0];
  if(!channel?.contentDetails?.relatedPlaylists?.uploads) throw Error('Could not find channel / uploads for '+cfg.slug+' ('+(cfg.handle||cfg.channelId)+')');
  const playlistId=channel.contentDetails.relatedPlaylists.uploads;
  const pages=clipNumber(cfg.scanPages,2,1,3);
  const ids=[];
  const already=new Set();
  let pageToken;
  for(let n=0;n<pages;n++){
    const page=await youtube('playlistItems', {part:'contentDetails',playlistId, maxResults:50, ...(pageToken?{pageToken}:{})});
    for(const item of page.items || []) {
      const id=item.contentDetails?.videoId;
      if(validVideoId(id) && !already.has(id)){already.add(id);ids.push(id);}
    }
    pageToken=page.nextPageToken;
    if(!pageToken)break;
  }
  const items=(await videosById(youtube,ids));
  items.sort((a,b) => Date.parse(b.snippet?.publishedAt||0) - Date.parse(a.snippet?.publishedAt||0));
  const latestCount=clipNumber(cfg.latestCount,6,1,24);
  const liveCount=clipNumber(cfg.livestreamCount,6,1,24);
  const uploads=items.filter(v=>v.snippet?.liveBroadcastContent!=='upcoming').slice(0,latestCount);
  const streamed=items.filter(v => Boolean(v.liveStreamingDetails?.actualStartTime)).sort(latestFirst);
  const replays=streamed.filter(v=>Boolean(v.liveStreamingDetails?.actualEndTime)).slice(0,liveCount);
  const current=streamed.find(v=>v.snippet?.liveBroadcastContent==='live' && !v.liveStreamingDetails?.actualEndTime) || null;
  const collabs=[];
  const collabIssues=[];
  for (const p of (cfg.collabPlaylists || []).slice(0,6)) {
    if(!p.id) continue;
    try {
      const pl=await youtube('playlistItems',{part:'contentDetails',playlistId:p.id,maxResults:50});
      const entries=await videosById(youtube,(pl.items||[]).map(item=>item.contentDetails?.videoId));
      for(const v of entries) collabs.push({...normalized(v,p.label||'Collaboration'), featured:false});
    } catch(err) { collabIssues.push(`${p.label||p.id}: ${err.message}`); }
  }
  const collabUnique=[...new Map(collabs.map(v=>[v.id,v])).values()].sort((a,b)=>Date.parse(b.startedAt||b.publishedAt||0)-Date.parse(a.startedAt||a.publishedAt||0));
  if(!collabUnique.length && cfg.featuredCollabs?.length){
    try {
      const provided=cfg.featuredCollabs.filter(v=>validVideoId(v.id));
      const extra=await videosById(youtube,provided.map(v=>v.id));
      for(const f of provided){
        const v=extra.find(x=>x.id===f.id);
        if(v) collabUnique.push({...normalized(v,f.label||'Featured session (not newest)'),featured:true});
      }
    } catch(err) {collabIssues.push('Featured sessions could not be checked: '+err.message);}
  }
  const liveStatus=current
    ? {status:'live',video:normalized(current,'Live now'),checkedAt:updatedAt,method:'recent_uploads'}
    : {status:'unknown',video:null,checkedAt:updatedAt,method:'recent_uploads',note:'Not detected in recent uploads. This does not prove the creator is offline.'};
  return {
    version:1, slug:cfg.slug,label:cfg.label,updatedAt,source:'YouTube Data API v3 via GitHub Actions',
    channel:{id:channel.id,snippet:channel.snippet,statistics:channel.statistics,url:`https://www.youtube.com/channel/${channel.id}`},
    uploads, replays, live:current, liveChecked:!!current,
    latestVideos:uploads.map(v=>normalized(v)),
    latestLivestreams:streamed.slice(0,liveCount).map(v=>normalized(v,'Livestream')),
    latestReplays:replays.map(v=>normalized(v,'Replay')),
    liveStatus,collabs:collabUnique.slice(0,4),collabIssues,
    scannedUploadCount:items.length,
    scanNote:'Only recent public uploads are scanned; some past/live broadcasts may not be indexed.'
  };
}
