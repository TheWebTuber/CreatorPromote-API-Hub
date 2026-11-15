import {safeFeed, validateFeed, LIVE_MAX_AGE_MS} from '../public/js/creatorpromote-hub.js';

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
    if (c.enabled && c.identityVerified === false) throw Error('Channel identity not verified: '+c.slug);
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
      const knownReasons = ['quotaExceeded','dailyLimitExceeded','keyInvalid','accessNotConfigured','forbidden','notFound','playlistNotFound','channelNotFound','invalidParameter','invalidValue','badRequest','rateLimitExceeded','backendError','serviceUnavailable'];
      const safeReason = knownReasons.includes(reason) && !String(reason).includes(apiKey) ? reason : 'requestFailed';
      // Never print request URL: it contains the private API key.
      throw Error('YouTube '+method+' failed: '+safeReason);
    }
    if (!payload || !Array.isArray(payload.items)) throw Error('Invalid YouTube items from '+method+'.');
    return payload;
  };
}

async function videosById(youtube, ids) {
  const unique = [...new Set(ids.filter(validVideoId))];
  const found = [];
  for (const batch of chunks(unique,50)) {
    const response = await youtube('videos', {part:'snippet,liveStreamingDetails,statistics,contentDetails,status', id:batch.join(','), maxResults:50});
    if (!Array.isArray(response.items)) throw Error('Invalid video response');
    found.push(...response.items);
  }
  return found.filter(v => (!v.status?.privacyStatus || v.status.privacyStatus === 'public') && v?.id && v.snippet?.title && v.snippet.title !== 'Private video' && v.snippet.title !== 'Deleted video');
}

function normalized(v, label='YouTube') {
  const time = v.liveStreamingDetails || {};
  const thumb=v.snippet?.thumbnails || {};
  return {
    id:v.id, title:v.snippet?.title || 'Video',
    label, publishedAt:v.snippet?.publishedAt || null,
    startedAt:time.actualStartTime || null,
    endedAt:time.actualEndTime || null,
    scheduledAt:time.scheduledStartTime || null,
    duration:v.contentDetails?.duration || null,
    embeddable:v.status?.embeddable ?? null,
    upcoming:v.snippet?.liveBroadcastContent === 'upcoming',
    thumbnail: (thumb.medium || thumb.high || thumb.default)?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
    url:`https://www.youtube.com/watch?v=${v.id}`,
    views:v.statistics?.viewCount ?? null,
    live:v.snippet?.liveBroadcastContent === 'live' && Boolean(time.actualStartTime) && !time.actualEndTime,
    wasLive:Boolean(time.actualStartTime)
  };
}


/** Independent sections preserve their own successful observation times. */
export async function fetchChannelData(cfg, youtube, updatedAt = new Date().toISOString(), previous = null) {
  if(previous) {try{validateFeed(previous,cfg.slug);}catch{previous=null;}}
  if(previous && cfg.channelId && previous.channel.id!==cfg.channelId)previous=null;
  const sections={}, issues=[];
  async function section(name, fetchSection, fallback) {
    try { const value=await fetchSection();sections[name]={status:'fresh',updatedAt};return value; }
    catch {
      const prior=previous?.sections?.[name];
      const available=fallback!==undefined && prior?.status!=='unavailable';
      sections[name]={status:available?'cached':'unavailable',updatedAt:available?(prior?.updatedAt||previous?.updatedAt||null):null};
      issues.push(name+': refresh unavailable');
      return available?fallback:undefined;
    }
  }
  const channel=await section('channel',async()=>{
    const response=await youtube('channels',{part:'snippet,statistics,contentDetails,brandingSettings',...(cfg.channelId?{id:cfg.channelId}:{forHandle:cfg.handle})});
    const c=response.items?.[0];if(!c?.id||!c.snippet||!c.statistics||!c.contentDetails?.relatedPlaylists?.uploads)throw Error('Channel unavailable');
    if(cfg.channelId && c.id!==cfg.channelId)throw Error('Channel mismatch');
    return {...c,url:'https://www.youtube.com/channel/'+c.id};
  },previous?.channel);
  if(!channel)throw Error('No successful channel data available');
  // Never combine previous data from another resolved channel with this channel.
  if(previous && previous.channel.id!==channel.id)previous=null;
  const cachedItems=previous?.catalog || (previous ? [...new Map([...previous.uploads,...previous.replays,...(previous.live?[previous.live]:[])].map(v=>[v.id,v])).values()] : undefined);
  const items=await section('videos',async()=>{
    const playlistId=channel.contentDetails?.relatedPlaylists?.uploads;
    if(!playlistId)throw Error('Uploads unavailable');
    const ids=[];let pageToken;
    for(let n=0;n<clipNumber(cfg.scanPages,2,1,8);n++){
      const page=await youtube('playlistItems',{part:'contentDetails',playlistId,maxResults:50,...(pageToken?{pageToken}:{})});
      if(!Array.isArray(page.items))throw Error('Invalid playlist');
      ids.push(...page.items.map(v=>v.contentDetails?.videoId));
      pageToken=page.nextPageToken;if(!pageToken)break;
    }
    return (await videosById(youtube,ids)).sort((a,b)=>Date.parse(b.snippet?.publishedAt||0)-Date.parse(a.snippet?.publishedAt||0));
  },cachedItems);
  const catalog=items||[];
  const uploads=catalog.filter(v=>v.snippet?.liveBroadcastContent!=='upcoming').slice(0,clipNumber(cfg.latestCount,6,1,100));
  const streamed=catalog.filter(v=>v.liveStreamingDetails?.actualStartTime).sort(latestFirst);
  const replays=streamed.filter(v=>v.liveStreamingDetails?.actualEndTime).slice(0,clipNumber(cfg.livestreamCount,6,1,100));
  const current=streamed.find(v=>v.snippet?.liveBroadcastContent==='live'&&!v.liveStreamingDetails.actualEndTime)||null;
  const collabSources={};const collabIssues=[];
  for(const p of (cfg.collabPlaylists||[]).slice(0,6)){
    if(!p.id)continue;
    const name='collab:'+p.id;
    const prior=previous?.collabSources?.[p.id];
    const entries=await section(name,async()=>{
      const pl=await youtube('playlistItems',{part:'contentDetails',playlistId:p.id,maxResults:50});
      if(!Array.isArray(pl.items))throw Error('Invalid playlist');
      return (await videosById(youtube,pl.items.map(v=>v.contentDetails?.videoId))).map(v=>({...normalized(v,p.label||'Collaboration'),featured:false}));
    },prior?.items);
    collabSources[p.id]={...sections[name],items:entries||[]};
    if(sections[name].status!=='fresh')collabIssues.push((p.label||p.id)+': refresh unavailable');
  }
  let collabs=Object.values(collabSources).flatMap(v=>v.items);
  // Legacy v1 has no per-playlist attribution: preserve its whole last good list on partial failure.
  const legacyCollabs=collabIssues.length ? (previous && !previous.collabSources ? previous.collabs : previous?.legacyCollabs || []) : [];
  collabs.push(...legacyCollabs);
  if(!collabs.length && cfg.featuredCollabs?.length){
    const featured=await section('featured',async()=>{
      const provided=cfg.featuredCollabs.filter(v=>validVideoId(v.id));
      const extra=await videosById(youtube,provided.map(v=>v.id));
      return extra.map(v=>({...normalized(v,provided.find(f=>f.id===v.id)?.label||'Featured session (not newest)'),featured:true}));
    },previous?.collabs?.filter(v=>v.featured));
    collabs=featured||[];
    if(sections.featured.status!=='fresh')collabIssues.push('Featured sessions: refresh unavailable');
  }
  collabs=[...new Map(collabs.map(v=>[v.id,v])).values()].sort((a,b)=>Date.parse(b.startedAt||b.publishedAt||0)-Date.parse(a.startedAt||a.publishedAt||0)).slice(0,4);
  const collabTimes=Object.values(collabSources).map(v=>v.updatedAt).filter(Boolean);
  sections.collabs={status:collabIssues.length?'cached':'fresh',updatedAt:collabIssues.length?(collabTimes.sort()[0]||previous?.sections?.collabs?.updatedAt||previous?.updatedAt||null):updatedAt};
  let playlists=previous?.playlists;
  if(cfg.includePlaylists){playlists=await section('playlists',async()=>{
    const rows=[];let pageToken;
    for(let i=0;i<clipNumber(cfg.playlistPages,2,1,8);i++){
      const response=await youtube('playlists',{part:'snippet,contentDetails,status',channelId:channel.id,maxResults:50,...(pageToken?{pageToken}:{})});
      if(!Array.isArray(response.items))throw Error('Invalid playlists');
      rows.push(...response.items.filter(v=>!v.status?.privacyStatus||v.status.privacyStatus==='public'));
      pageToken=response.nextPageToken;if(!pageToken)break;
    }return rows;
  },previous?.playlists);}
  const checkedAt=sections.videos.updatedAt;
  const liveStatus={status:current?'live':'unknown',video:current?normalized(current,'Live now'):null,
    checkedAt,expiresAt:checkedAt?new Date(Date.parse(checkedAt)+LIVE_MAX_AGE_MS).toISOString():null,
    method:'recent_uploads',note:'Not detected does not prove offline; observations expire after 45 minutes.'};
  const feed={version:1,slug:cfg.slug,label:cfg.label,updatedAt,source:'YouTube Data API v3 via GitHub Actions',
    channel,uploads,replays,live:current,liveChecked:!!current,
    latestVideos:uploads.map(v=>normalized(v)),latestLivestreams:streamed.slice(0,clipNumber(cfg.livestreamCount,6,1,100)).map(v=>normalized(v,'Livestream')),
    latestReplays:replays.map(v=>normalized(v,'Replay')),liveStatus,collabs,collabIssues,
    scannedUploadCount:catalog.length,scanNote:'Only recent public uploads are scanned; some past/live broadcasts may not be indexed.',
    catalog,playlists:playlists||[],collabSources,legacyCollabs,sections,issues};
  // If nothing succeeded, keep the original timestamp rather than presenting a fresh snapshot.
  if(previous && !Object.entries(sections).some(([k,v])=>k!=='collabs'&&v.status==='fresh'))feed.updatedAt=previous.updatedAt;
  return safeFeed(feed,Date.parse(updatedAt));
}
