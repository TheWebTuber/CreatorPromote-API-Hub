/* Shared CreatorPromote YouTube hub: no public API key or visitor requests to Google. */
(() => {
  'use strict';
  const cfg = window.RACCOON_YOUTUBE_CONFIG || {};
  const collab = document.getElementById('collab-videos');
  const personal = document.getElementById('personal-videos');
  const collabStatus = document.getElementById('collab-status');
  const personalStatus = document.getElementById('personal-status');
  const updateLabel = document.getElementById('feed-updated');
  const refreshButtons = [...document.querySelectorAll('[data-refresh]')];
  const cacheKey = 'raccoon-yt-feeds-hub-v1';
  const MAX_COLLAB = 4;
  const MAX_PERSONAL = 3;
  const fallbackSessions = [
    { id: 'FRVmoksciRg', title: 'Player adventures — first collection', label:'Featured player session' },
    { id: '8R5yICkMZn4', title: 'Player adventures — second collection', label:'Featured player session' },
    { id: 'TqJk7cQ72e0', title: 'Behind the screen — GM session', label:'Featured GM session' }
  ];
  const isoDate = str => str && !Number.isNaN(Date.parse(str)) ? new Date(str).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}) : 'YouTube';
  const videoUrl = id => `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
  const imgUrl = id => `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
  function node(tag, className, content) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content != null) el.textContent = content;
    return el;
  }
  function videoCard(v) {
    const a = node('a','video-card');
    a.href = videoUrl(v.id);
    a.target='_blank'; a.rel='noopener noreferrer';
    a.setAttribute('aria-label',`Watch ${v.title} on YouTube (opens new tab)`);
    const thumb = node('div','video-poster');
    const img = document.createElement('img'); img.src = (v.thumbnail && /^https:\/\//.test(v.thumbnail)) ? v.thumbnail : imgUrl(v.id);
    img.alt=''; img.loading='lazy'; thumb.appendChild(img);
    thumb.appendChild(node('span','video-play','▶'));
    const body = node('div','video-card-body');
    body.appendChild(node('h4','', v.title || 'Watch on YouTube'));
    const meta = node('div','video-meta');
    meta.appendChild(node('span','', v.label || 'YouTube'));
    meta.appendChild(node('span','', v.date ? isoDate(v.date) : 'Open video'));
    body.appendChild(meta); a.append(thumb,body); return a;
  }
  function render(target, items, limit) {
    target.replaceChildren(...items.slice(0,limit).map(videoCard));
  }
  function fallback(why) {
    render(collab, fallbackSessions, MAX_COLLAB);
    collabStatus.textContent = 'Featured sessions from your supplied links are shown instead of an automatic newest-video list.';
    const card = node('div','video-placeholder');
    card.appendChild(node('strong','', 'His own livestreams are on YouTube.'));
    card.appendChild(node('p','',why || 'Add a restricted YouTube API key to show the three most recent ones here.'));
    const a = node('a','', 'View personal livestreams ↗');
    a.href = 'https://www.youtube.com/@daddydepresso/streams'; a.target='_blank'; a.rel='noopener noreferrer';
    card.appendChild(a); personal.replaceChildren(card);
    personalStatus.textContent='';
    updateLabel.textContent='✦ Featured sessions (automatic updates not active)';
  }
  function loading() {
    const placeholder = node('div','video-placeholder','Gathering stories from YouTube…');
    collab.replaceChildren(placeholder.cloneNode(true));
    personal.replaceChildren(placeholder);
    collabStatus.textContent=''; personalStatus.textContent='';
  }
  function saveCache(data) {
    try { localStorage.setItem(cacheKey, JSON.stringify({when:Date.now(),handle:cfg.channelHandle,playlists:JSON.stringify(cfg.collabPlaylists),data})); } catch (_) { /* no localStorage */ }
  }
  function readCache() {
    try {
      const s=JSON.parse(localStorage.getItem(cacheKey)||'null');
      const maxAge=Math.min(Math.max(Number(cfg.refreshHours)||2,0.5),24)*3600000;
      if (s && Date.now()-s.when < maxAge && s.handle === cfg.channelHandle && s.playlists===JSON.stringify(cfg.collabPlaylists)) return s;
    } catch (_) { /* corrupt cache */ }
    return null;
  }
  function show(data, cached=false) {
    if (data.collabs?.length) {
      render(collab,data.collabs,MAX_COLLAB);
      collabStatus.textContent=data.collabPartial?'One or more playlists could not be read; showing available collaborations.':'';
    } else {
      render(collab,fallbackSessions,MAX_COLLAB);
      collabStatus.textContent='No public playlist videos found yet; showing the three featured sessions you provided.';
    }
    if (data.personal?.length) {
      render(personal,data.personal,MAX_PERSONAL);
      personalStatus.textContent=data.personalError?'Showing available livestreams. The latest check was incomplete.':'';
    } else {
      const block=node('div','video-placeholder');
      block.appendChild(node('strong','', 'No public personal livestreams found in the recent uploads checked.'));
      const a=node('a','', 'Visit his streams on YouTube ↗');
      a.href='https://www.youtube.com/@daddydepresso/streams'; a.target='_blank'; a.rel='noopener noreferrer';
      block.appendChild(a); personal.replaceChildren(block);
      personalStatus.textContent=data.personalError?'Could not load his channel feed: '+data.personalError:'';
    }
    updateLabel.textContent='✦ '+(cached?'Cached results':'Updated')+' · '+new Date(data.time).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  let inFlight=false;
  async function refresh(force=false) {
    const base=String(cfg.hubUrl||'').replace(/\/$/,'');
    if(!base.startsWith('https://') || base.includes('YOUR-USERNAME')) {
      fallback('The creator feed will appear once its shared Hub URL is configured.');return;
    }
    if (!force) { const cached=readCache();if(cached){show(cached.data,true);return;} }
    if(inFlight)return;
    inFlight=true;refreshButtons.forEach(b=>b.disabled=true);loading();
    try {
      const response=await fetch(base+'/data/daddydepresso.json',{cache:'no-store'});
      if(!response.ok)throw Error('The shared hub is unavailable (HTTP '+response.status+').');
      const raw=await response.json();
      const adapt=v=>({id:v.id,title:v.title,date:v.startedAt||v.publishedAt,thumbnail:v.thumbnail,label:v.label||'YouTube'});
      const data={
        collabs:(raw.collabs||[]).slice(0,4).map(adapt),
        collabPartial:!!raw.collabIssues?.length,
        personal:(raw.latestLivestreams||[]).filter(v=>v.wasLive).slice(0,3).map(adapt),
        personalError:null,time:Date.parse(raw.updatedAt)||Date.now()
      };
      saveCache(data);show(data);
      if(raw.updatedAt && Date.now()-Date.parse(raw.updatedAt)>2*60*60*1000)updateLabel.textContent+=' · Last successful Hub result (may be stale)';
    } catch(error) {
      console.warn('CreatorPromote hub:',error.message);
      const cached=readCache();if(cached)show(cached.data,true);
      else fallback('Our shared creator feed is temporarily unavailable. Check YouTube directly.');
    } finally {inFlight=false;refreshButtons.forEach(b=>b.disabled=false);}
  }
  refreshButtons.forEach(b=>b.addEventListener('click',()=>refresh(true)));
  refresh(false);
})();
