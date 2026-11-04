export const SIGNALS = [
  {id:'moon',title:'The first echo',message:'We were not lost. We left markers for the next crew.',hint:'A relay lies beyond the lunar landing pad.'},
  {id:'mars',title:'A world that remembers',message:'Follow the rivers that no longer flow. They taught us where to look.',hint:'Search the survey relay near the delta.'},
  {id:'europa',title:'Under the silence',message:'The ice is a roof, not an ending. Listen beneath it.',hint:'A fractured ice plain holds another transmission.'},
  {id:'titan',title:'A route home',message:'Four worlds, one route. Bring these coordinates home. The next expedition begins with you.',hint:'The final relay waits beyond Titan’s dunes.'}
];
export function emptyJournal(){return {version:1,arrivals:[],scans:[],signals:[],photos:[],tutorialComplete:false};}
export function readJournal(storage){try{const raw=JSON.parse(storage.getItem('asterfall-journal-v1')||'null');if(raw?.version!==1)return emptyJournal();return {...emptyJournal(),...raw,arrivals:Array.isArray(raw.arrivals)?raw.arrivals.slice(-40):[],scans:Array.isArray(raw.scans)?raw.scans:[],signals:Array.isArray(raw.signals)?raw.signals.filter(id=>SIGNALS.some(s=>s.id===id)):[],photos:Array.isArray(raw.photos)?raw.photos.slice(-4):[]};}catch{return emptyJournal();}}
export function saveJournal(storage,journal){try{storage.setItem('asterfall-journal-v1',JSON.stringify(journal));return true;}catch{return false;}}
export function recordArrival(journal,body,score,date=new Date().toISOString()){
  return {...journal,arrivals:[...journal.arrivals,{bodyId:body.id,name:body.name,site:body.site,score:Math.round(score||0),date,orbit:!!body.orbitOnly}].slice(-40)};
}
export function landmarks(body,world){
  const names={moon:['Basalt outcrop','Regolith sample','Survey relay'],mars:['Ancient delta layers','Oxidized sand','Survey relay'],europa:['Ice fracture','Salt-stained ridge','Survey relay'],titan:['Organic dune','Water-ice cobble','Survey relay'],venus:['Volcanic plain','Deformed highland','Survey relay'],mercury:['Impact ejecta','Crater rim','Survey relay'],earth:['Coastal basalt','Ocean sediment','Survey relay']};
  const labels=names[body?.id]||['Geology outcrop','Surface sample','Survey relay'];
  return labels.map((name,i)=>({id:(body?.id||world.name)+'-'+i,name,x:world.pad+[100,-150,240][i],z:[-80,70,-160][i],index:i}));
}
export function scanLandmark(journal,body,point){
  if(journal.scans.some(s=>s.id===point.id))return {journal,duplicate:true,signal:null};
  const signal=point.index===2?SIGNALS.find(s=>s.id===body.id):null;
  const next={...journal,scans:[...journal.scans,{id:point.id,bodyId:body.id,name:point.name,date:new Date().toISOString()}],signals:signal&&!journal.signals.includes(signal.id)?[...journal.signals,signal.id]:journal.signals};
  return {journal:next,duplicate:false,signal};
}
export function nearestLandmark(rover,points){return points.map(p=>({...p,distance:Math.hypot(p.x-rover.x,p.z-rover.z)})).sort((a,b)=>a.distance-b.distance)[0];}
export function moveRover(rover,keys,dt){
  let dx=Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));
  let dz=Number(keys.has('ArrowDown')||keys.has('KeyS'))-Number(keys.has('ArrowUp')||keys.has('KeyW'));
  const norm=Math.hypot(dx,dz)||1;
  return {...rover,x:Math.max(35,Math.min(1765,rover.x+dx/norm*75*dt)),z:Math.max(-500,Math.min(500,rover.z+dz/norm*75*dt)),moving:!!(dx||dz),heading:dx||dz?Math.atan2(dx,-dz):rover.heading};
}
export function assistedKeys(state,pilot,world){
  const keys=new Set(pilot),dx=world.pad-state.x,desired=Math.max(-65,Math.min(65,dx*.35));
  if(!keys.has('ArrowLeft')&&!keys.has('ArrowRight')){if(state.vx<desired-3)keys.add('ArrowRight');if(state.vx>desired+3)keys.add('ArrowLeft');}
  if(!keys.has('KeyW')&&!keys.has('KeyS')){const desiredZ=Math.max(-30,Math.min(30,-(state.z||0)*.4));if((state.vz||0)<desiredZ-2)keys.add('KeyS');if((state.vz||0)>desiredZ+2)keys.add('KeyW');}
  if(!keys.has('ArrowUp')&&!keys.has('ArrowDown')){if(850-state.y-22<250||Math.abs(dx)<120)keys.add('ArrowDown');else if(state.vy>32)keys.add('ArrowUp');}
  return keys;
}
export const TRAINING_STEPS=[
  {title:'01 / Feel the thruster',text:'Hold ↑ or push the thumbstick up. Training holds your altitude while you learn.',key:'ArrowUp'},
  {title:'02 / Make a small correction',text:'Hold → or push the thumbstick right. Short burns are easier to control.',key:'ArrowRight'},
  {title:'03 / Arrest your momentum',text:'Hold ↓ or the large BRAKE button. Braking slows all three axes.',key:'ArrowDown'},
  {title:'04 / Your first landing',text:'Training wheels off. Guide the ship to the glowing pad. Assist is on; your inputs always take priority.',key:null}
];

export function surfaceNote(body,index){
  const notes={
    moon:['Dark lunar maria are basalt plains left by ancient volcanic eruptions. Your fictional scanner records the outcrop as a geological sample.','Lunar regolith is loose rock and dust produced by impacts. With very little atmosphere and no liquid-water weathering, its grains can stay sharp.'],
    mars:['Sedimentary layers can preserve a history of moving water. Jezero crater contains an ancient delta, a major reason NASA selected it for Perseverance.','Oxidized iron minerals contribute to Mars’s reddish color. The wind moves fine dust across the surface, sometimes in planet-wide storms.'],
    europa:['Europa’s ridges and fractures record stresses in its icy shell. Jupiter’s tidal forces flex the moon and can supply internal heat.','Some dark surface material may contain salts and radiation-altered compounds. Its composition is an active subject of research, not proof of life.'],
    titan:['Titan’s dunes contain organic material shaped by winds. This surface chemistry differs from Earth’s typical silicate sand deserts.','At Titan’s cold surface, water ice behaves like rock. Methane and ethane, rather than water, participate in its surface liquid cycle.'],
    earth:['Basalt forms as lava cools. On Earth, volcanic and tectonic processes continually create and recycle rocks.','Sediment can carry information about past environments. This fictional sample is a prompt to investigate the destination reference, not a real measurement.']
  };
  return notes[body.id]?.[index]||body.discovery||'A fictional survey sample has been added to your expedition record.';
}
