import test from 'node:test';
import assert from 'node:assert/strict';
import {BODIES,estimatedPositions,bodyWorld} from './solar-data.mjs';
import {parseVector,horizonsURL,loadEphemeris} from './ephemeris.mjs';
// Synthetic response with the documented Horizons CSV layout. No live fetch is implied.
const fixture={result:'header\n$$SOE\n2461347.500000000, A.D. 2026-Nov-03 00:00:00.0000, 7.1E-01, 6.9E-01, -2.1E-05, 0, 0, 0,\n$$EOE\nfooter'};
test('Horizons parser preserves AU vectors and provenance',()=>{assert.deepEqual(parseVector(fixture,'earth'),{id:'earth',x:.71,y:.69,z:-.000021,source:'NASA/JPL Horizons'});});
test('parser rejects missing, malformed and nonfinite vectors',()=>{for(const response of [{result:'upstream error'},{},{result:'$$SOE\n1,date,NaN,0,0\n$$EOE'},{result:'$$SOE\n1,date,0,0,0\n$$EOE'}])assert.throws(()=>parseVector(response,'earth'));});
test('requests use fixed JPL host and Sun-centered ecliptic AU coordinates',()=>{const url=new URL(horizonsURL(BODIES[0],new Date('2026-11-03T16:00:00Z')));assert.equal(url.hostname,'ssd.jpl.nasa.gov');assert.equal(url.searchParams.get('CENTER'),"'500@10'");assert.equal(url.searchParams.get('OUT_UNITS'),"'AU-D'");assert.equal(url.searchParams.get('START_TIME'),"'2026-11-03'");});
test('successful responses are marked as NASA/JPL data',async()=>{const result=await loadEphemeris(async()=>({ok:true,json:async()=>fixture}),new Date('2026-11-03'));assert.equal(result.liveCount,BODIES.length);assert.equal(result.source,'NASA/JPL Horizons');});
test('network failure returns honest labeled estimates',async()=>{const result=await loadEphemeris(async()=>{throw Error('network blocked');},new Date('2026-11-03'));assert.equal(result.liveCount,0);assert.match(result.source,/estimates/);assert.ok(result.positions.every(p=>p.source==='estimate'));assert.equal(result.positions.length,11);});
test('partial failure does not mislabel estimates as live',async()=>{let n=0;const result=await loadEphemeris(async()=>++n%2?{ok:true,json:async()=>fixture}:{ok:false});assert.ok(result.liveCount>0&&result.liveCount<11);assert.match(result.source,/Mixed/);});
test('catalog provides NASA references and disallows giant surface landings',()=>{for(const body of BODIES){assert.equal(new URL(body.source).hostname,'science.nasa.gov');assert.ok(body.radius>0);assert.ok(bodyWorld(body).gravity<65);}for(const id of ['jupiter','saturn','uranus','neptune'])assert.equal(BODIES.find(b=>b.id===id).orbitOnly,true);assert.equal(BODIES.find(b=>b.id==='moon').orbitOnly,undefined);});
test('approximate map positions vary with date and remain finite',()=>{const a=estimatedPositions(new Date('2026-01-01')),b=estimatedPositions(new Date('2026-06-01'));assert.notEqual(a[0].x,b[0].x);assert.ok(a.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));});
test('every rocky destination supports a controlled landing',async()=>{
  const {initialState,step,ground}=await import('./physics.mjs');
  for(const body of BODIES.filter(b=>!b.orbitOnly)){
    const w=bodyWorld(body);let s=initialState();
    for(let i=0;i<120*150&&s.status==='flying';i++){
      const keys=new Set(),dx=w.pad-s.x,desired=Math.max(-65,Math.min(65,dx*.35));
      if(s.vx<desired-3)keys.add('ArrowRight');if(s.vx>desired+3)keys.add('ArrowLeft');
      if(ground(s.x,w)-s.y-22<250||Math.abs(dx)<120)keys.add('ArrowDown');else if(s.vy>32)keys.add('ArrowUp');
      s=step(s,keys,1/120,w);
    }
    assert.equal(s.status,'landed',body.name+' must have a reachable safe landing');
  }
});
