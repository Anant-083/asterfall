import {score} from './physics.mjs';
import {BODIES} from './solar-data.mjs';
import {SIGNALS,readJournal,saveJournal,recordArrival,landmarks,scanLandmark,nearestLandmark,moveRover,assistedKeys,TRAINING_STEPS,surfaceNote} from './mission.mjs';
const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function installFeatures(api){
  let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('Unavailable');}};}
  let journal=readJournal(storage),assist=false,haptics=true,training=null,rover=null,points=[],scanningBody=null,depthMode=false;
  const stickKeys=new Set();let stickPointer=null;
  function announce(message){$('announcement').textContent=message;$('feature-toast').textContent=message;$('feature-toast').hidden=false;clearTimeout(announce.timer);announce.timer=setTimeout(()=>$('feature-toast').hidden=true,4500);}
  function persist(){if(!saveJournal(storage,journal))announce('Browser storage is full or unavailable. This session still works; export your journal to keep it.');}
  function vibrate(pattern){if(haptics&&typeof navigator.vibrate==='function')navigator.vibrate(pattern);}
  function setAssist(value){assist=value;$('assist-toggle').setAttribute('aria-pressed',String(value));$('assist-toggle').textContent=value?'Assist on':'Assist off';}
  function openJournal(){api.pause();renderJournal();$('journal').showModal();}
  function renderJournal(){
    $('journal-summary').textContent=`${new Set(journal.arrivals.map(a=>a.bodyId)).size} destinations · ${journal.scans.length} scans · ${journal.signals.length}/4 signal fragments · best landing ${Math.max(0,...journal.arrivals.map(a=>a.score||0))} points`;
    $('journal-signals').innerHTML=SIGNALS.map(s=>`<article class="signal-fragment ${journal.signals.includes(s.id)?'recovered':''}"><span class="eyebrow">${escape(s.id.toUpperCase())} / ${journal.signals.includes(s.id)?'RECOVERED':'AWAITING SCAN'}</span><h3>${escape(s.title)}</h3><p>${escape(journal.signals.includes(s.id)?s.message:s.hint)}</p><button data-signal-travel="${s.id}">${journal.signals.includes(s.id)?'Revisit':'Set course'} →</button></article>`).join('');
    $('journal-ending').hidden=journal.signals.length!==4;
    $('journal-arrivals').innerHTML=journal.arrivals.length?journal.arrivals.slice().reverse().map(a=>`<article class="journal-entry"><strong>${escape(a.name)}</strong><span>${escape(a.site)}</span><small>${escape(new Date(a.date).toLocaleDateString())} · ${a.orbit?'Orbital survey':escape(a.score)+' points'}</small></article>`).join(''):'<p class="empty-notes">Your first landing starts the log. Finish a mission, then deploy the rover to uncover more.</p>';
    $('journal-scans').innerHTML=journal.scans.length?journal.scans.map(s=>`<span class="scan-tag">${escape(s.bodyId)} · ${escape(s.name)}</span>`).join(''):'<p class="empty-notes">No samples recorded yet.</p>';
    $('journal-photos').innerHTML=journal.photos.map(p=>`<figure><img alt="${escape(p.caption)}" src="${/^data:image\/jpeg;base64,/.test(p.image)?p.image:''}"><figcaption>${escape(p.caption)}</figcaption></figure>`).join('');
    document.querySelectorAll('[data-signal-travel]').forEach(b=>b.onclick=()=>{$('journal').close();api.setCourse(BODIES.find(body=>body.id===b.dataset.signalTravel));});
  }
  function beginTraining(){if($('manual').open)$('manual').close();setAssist(true);api.startTraining();training={stage:0,held:0};$('tutorial-card').hidden=false;renderTraining();announce('Flight academy started. Training holds altitude for the first three exercises.');}
  function renderTraining(){if(!training)return;const step=TRAINING_STEPS[training.stage];$('tutorial-title').textContent=step.title;$('tutorial-text').textContent=step.text;$('tutorial-progress').style.width=(training.stage/4*100)+'%';}
  function stopTraining(){training=null;$('tutorial-card').hidden=true;}
  function releaseStick(){for(const key of stickKeys)api.keys.delete(key);stickKeys.clear();if($('touch-brake').classList.contains('active'))api.keys.add('ArrowDown');stickPointer=null;$('stick-knob').style.transform='translate(0,0)';}
  function steer(e){const r=$('thumbstick').getBoundingClientRect(),dx=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width*.36))),dy=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/(r.height*.36)));for(const key of stickKeys)api.keys.delete(key);stickKeys.clear();if(dx<-.25)stickKeys.add('ArrowLeft');if(dx>.25)stickKeys.add('ArrowRight');if(dy<-.25)stickKeys.add(depthMode?'KeyW':'ArrowUp');if(dy>.25)stickKeys.add(depthMode?'KeyS':'ArrowDown');for(const key of stickKeys)api.keys.add(key);$('stick-knob').style.transform=`translate(${dx*30}px,${dy*30}px)`;}
  $('thumbstick').addEventListener('pointerdown',e=>{if(!['flying','surface'].includes(api.get().mode))return;e.preventDefault();if(stickPointer!==null)return;stickPointer=e.pointerId;$('thumbstick').setPointerCapture(e.pointerId);steer(e);});
  $('thumbstick').addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)steer(e);});for(const event of ['pointerup','pointercancel','lostpointercapture'])$('thumbstick').addEventListener(event,e=>{if(e.pointerId===stickPointer)releaseStick();});
  addEventListener('blur',()=>{brake.classList.remove('active');releaseStick();api.keys.clear();});document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseStick();});
  $('stick-depth').onclick=()=>{releaseStick();depthMode=!depthMode;$('stick-depth').textContent=depthMode?'Depth W/S':'Lift ↑/↓';$('stick-depth').setAttribute('aria-pressed',String(depthMode));};
  const brake=$('touch-brake');brake.addEventListener('pointerdown',e=>{if(api.get().mode!=='flying')return;e.preventDefault();brake.setPointerCapture(e.pointerId);api.keys.add('ArrowDown');brake.classList.add('active');vibrate(10);});for(const event of ['pointerup','pointercancel','lostpointercapture'])brake.addEventListener(event,()=>{api.keys.delete('ArrowDown');brake.classList.remove('active');if(stickKeys.has('ArrowDown'))api.keys.add('ArrowDown');});
  $('assist-toggle').onclick=()=>{setAssist(!assist);announce(assist?'Landing assist enabled. Manual input overrides guidance; fuel is still required.':'Manual flight selected.');};
  $('haptics-toggle').onclick=()=>{haptics=!haptics;$('haptics-toggle').setAttribute('aria-pressed',String(haptics));$('haptics-toggle').textContent=haptics?'Haptics on':'Haptics off';if(haptics)vibrate(20);};
  $('train-button').onclick=beginTraining;$('start-training').onclick=beginTraining;$('end-training').onclick=()=>{stopTraining();announce('Training ended. Continue flying or restart.');};
  $('journal-button').onclick=openJournal;$('close-journal').onclick=()=>$('journal').close();
  $('journal-export').onclick=()=>{const blob=new Blob([JSON.stringify(journal,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='asterfall-mission-journal.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('photo-button').onclick=async()=>{try{const source=api.photo();const image=new Image();image.src=source;await image.decode();const c=document.createElement('canvas');c.width=640;c.height=Math.round(image.height/image.width*640);c.getContext('2d').drawImage(image,0,0,c.width,c.height);const f=api.get(),photo={caption:(f.destination?.name||f.world.name)+' · '+new Date().toLocaleString(),image:c.toDataURL('image/jpeg',.7)};journal={...journal,photos:[...journal.photos,photo].slice(-4)};persist();announce('Photo saved to your journal. The latest four photos are kept.');}catch{announce('Photo capture is unavailable in this browser.');}};
  function deployRover(){const f=api.get();if(f.state.status!=='landed'||f.destination?.orbitOnly)return;scanningBody=f.destination||{id:f.world.name.toLowerCase(),name:f.world.name};rover={x:f.state.x,z:f.state.z||0,heading:0,moving:false};points=landmarks(scanningBody,f.world);$('result').close();api.enterSurface();$('surface-panel').hidden=false;$('stick-depth').hidden=true;depthMode=false;releaseStick();announce('Rover deployed. Use arrows or the thumbstick. Move within 45 m of a landmark, then scan.');}
  $('deploy-rover').onclick=deployRover;
  $('return-ship').onclick=()=>{rover=null;points=[];$('surface-panel').hidden=true;$('stick-depth').hidden=false;api.returnShip();};
  function scan(){if(!rover||api.get().mode!=='surface')return;const nearest=nearestLandmark(rover,points);if(nearest.distance>45){announce('Move closer to '+nearest.name+' before scanning.');return;}const result=scanLandmark(journal,scanningBody,nearest);if(result.duplicate){announce('This location is already in your journal.');return;}journal=result.journal;persist();vibrate([25,50,25]);const body=BODIES.find(b=>b.id===scanningBody.id);$('scan-title').textContent=result.signal?'Signal fragment recovered':nearest.name;$('scan-message').textContent=result.signal?result.signal.message:body?surfaceNote(body,nearest.index):'Survey complete. This is an imagined world in the original story campaign.';$('scan-source').hidden=!body;$('scan-source').href=body?.source||'#';$('scan-report').showModal();api.keys.clear();if(journal.signals.length===4)announce('All four fragments recovered. Open your journal to read the complete transmission.');}
  $('scan-button').onclick=scan;$('close-scan').onclick=()=>$('scan-report').close();
  addEventListener('keydown',e=>{if(e.repeat||document.querySelector('dialog[open]'))return;if(e.key.toLowerCase()==='e')scan();if(e.key.toLowerCase()==='j')openJournal();});
  return {
    update(dt,state,world,mode){
      if(training&&mode==='flying'){
        if(training.stage<3){state.y=620;state.vy=0;state.x=world.pad-70;state.z=0;state.vx=0;state.vz=0;state.fuel=100;const step=TRAINING_STEPS[training.stage];if(api.keys.has(step.key))training.held+=dt;if(training.held>.55){training.stage++;training.held=0;renderTraining();vibrate(15);api.keys.clear();}}
      }
      if(mode==='surface'&&rover){if(!document.querySelector('dialog[open]'))rover=moveRover(rover,api.keys,dt);else rover.moving=false;const near=nearestLandmark(rover,points);$('surface-nearest').textContent=near.name+' · '+Math.round(near.distance)+' m';$('scan-button').disabled=near.distance>45;$('surface-count').textContent=journal.scans.filter(s=>s.bodyId===scanningBody.id).length+' / 3 locations scanned';$('surface-heading').textContent='X '+Math.round(rover.x-world.pad)+' · Z '+Math.round(rover.z);$('surface-targets').innerHTML=points.map(p=>`<span>${journal.scans.some(s=>s.id===p.id)?'✓':'◇'} ${escape(p.name)} <small>${Math.round(Math.hypot(p.x-rover.x,p.z-rover.z))} m · ${p.x>rover.x?'→':'←'} ${p.z>rover.z?'↓':'↑'}</small></span>`).join('');}
    },
    flightKeys(s,k,w){return assist&&(!training||training.stage===3)?assistedKeys(s,k,w):k;},
    arrived(body,state){if(state.status==='landed'||body.orbitOnly){journal=recordArrival(journal,body,body.orbitOnly?0:score(state));if(training){journal.tutorialComplete=true;stopTraining();announce('Flight academy complete. Your first landing is in the journal.');}persist();vibrate([40,80,40]);}else vibrate([80,40,80]);},
    reset(){stopTraining();releaseStick();rover=null;points=[];$('surface-panel').hidden=true;$('stick-depth').hidden=false;},
    surface(){return {rover,points};},
    clearTouch(){brake.classList.remove('active');releaseStick();},
    isTraining(){return !!training;},
    announce,
    saveTutorial(){journal.tutorialComplete=true;persist();}
  };
}
