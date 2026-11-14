/* Universal, static GitHub Pages feed reader for NEW CreatorPromote sites.
   Include this script after setting window.CREATORPROMOTE_FEED (see README).
   Expects <div id="creatorpromote-videos"></div> on the page.
   Does not call Google or require API keys in the visitor browser.
*/
(() => {
  'use strict';
  const cfg=window.CREATORPROMOTE_FEED||{};
  const target=document.getElementById(cfg.containerId||'creatorpromote-videos');
  if(!target) return;
  const slug=String(cfg.slug||'').trim();
  const base=String(cfg.hubUrl||'').replace(/\/$/,'');
  const message=s=>{target.textContent=s;};
  if(!/^[a-z0-9-]+$/.test(slug)||!base.startsWith('https://')||base.includes('YOUR-USERNAME')){
    message('The CreatorPromote feed needs its Hub URL and channel slug configured.');return;
  }
  const getUrl=(v)=>`https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}`;
  function render(d){
    const videos=(cfg.kind==='streams'?d.latestLivestreams:cfg.kind==='replays'?d.latestReplays:d.latestVideos)||[];
    const items=videos.slice(0,Math.min(Number(cfg.limit)||6,12));
    if(!items.length){message('No recent public videos found. Check the creator’s YouTube channel.');return;}
    target.replaceChildren();
    for(const v of items){
      if(!/^[a-zA-Z0-9_-]{11}$/.test(v.id||''))continue;
      const a=document.createElement('a');a.href=getUrl(v);a.target='_blank';a.rel='noopener noreferrer';a.className='cp-video';
      const img=document.createElement('img');img.src=v.thumbnail||`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;img.loading='lazy';img.alt='';
      const title=document.createElement('span');title.textContent=v.title||'Watch on YouTube';
      a.append(img,title);target.append(a);
    }
    if(d.updatedAt && Date.now()-Date.parse(d.updatedAt)>2*60*60*1000){
      const note=document.createElement('p');note.textContent='Showing the last successful update; the automatic feed may be delayed.';target.after(note);
    }
  }
  fetch(`${base}/data/${encodeURIComponent(slug)}.json`,{cache:'no-store'})
    .then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json()})
    .then(render).catch(()=>message('Feed unavailable right now. Visit the creator on YouTube.'));
})();
