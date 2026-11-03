import {BODIES,estimatedPositions} from './solar-data.mjs';
export function horizonsURL(body,date){
  const start=date.toISOString().slice(0,10),end=new Date(date.getTime()+86400000).toISOString().slice(0,10);
  const params={format:'json',COMMAND:`'${body.code}'`,OBJ_DATA:"'NO'",MAKE_EPHEM:"'YES'",EPHEM_TYPE:"'VECTORS'",CENTER:"'500@10'",START_TIME:`'${start}'`,STOP_TIME:`'${end}'`,STEP_SIZE:"'1 d'",REF_PLANE:"'ECLIPTIC'",REF_SYSTEM:"'ICRF'",OUT_UNITS:"'AU-D'",VEC_TABLE:"'2'",CSV_FORMAT:"'YES'"};
  return 'https://ssd.jpl.nasa.gov/api/horizons.api?'+new URLSearchParams(params);
}
export function parseVector(payload,id){
  if(typeof payload.result!=='string')throw Error('Missing Horizons result');
  const section=payload.result.split('$$SOE')[1]?.split('$$EOE')[0];
  const row=section?.trim().split('\n')[0]?.split(',');
  if(!row||row.length<5)throw Error('Missing vector row');
  const values=row.slice(2,5).map(v=>Number(v.trim().replace(/[dD]/g,'e')));
  if(values.some(v=>!Number.isFinite(v))||values.every(v=>v===0))throw Error('Invalid vector');
  return {id,x:values[0],y:values[1],z:values[2],source:'NASA/JPL Horizons'};
}
export async function loadEphemeris(fetcher=fetch,date=new Date()){
  const epochDate=new Date(date.toISOString().slice(0,10)+'T00:00:00.000Z');
  const positions=estimatedPositions(epochDate);
  await Promise.all(BODIES.map(async(body,i)=>{
    try{const response=await fetcher(horizonsURL(body,date),{signal:AbortSignal.timeout(6500)});if(!response.ok)throw Error('Upstream unavailable');positions[i]=parseVector(await response.json(),body.id);}catch{/* Every failed body retains its explicitly labeled illustrative estimate. */}
  }));
  const live=positions.filter(p=>p.source==='NASA/JPL Horizons').length;
  return {epoch:date.toISOString().slice(0,10)+'T00:00:00.000Z',fetchedAt:new Date().toISOString(),source:live===positions.length?'NASA/JPL Horizons':live?'Mixed: Horizons and estimates':'Illustrative estimates — NASA/JPL unavailable',liveCount:live,positions,reference:'https://ssd.jpl.nasa.gov/horizons/',frame:'Sun-centered ecliptic J2000; coordinates in AU',note:'Map distances are compressed; body sizes and moon offsets are exaggerated. Fallback positions use circular orbits and are not ephemerides.'};
}
let cached=null,inflight=null,expires=0;
export async function getEphemeris(){
  if(cached&&Date.now()<expires)return cached;
  if(!inflight)inflight=loadEphemeris().then(data=>{cached=data;expires=Date.now()+(data.liveCount?3600000:60000);return data;}).finally(()=>{inflight=null;});
  return inflight;
}
