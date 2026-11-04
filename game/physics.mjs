export const WORLDS = [
  {name:'Selene', subtitle:'The quiet frontier', type:'LUNAR EXPEDITION', color:'#a7c7e9', glow:'#74bbff', gravity:22, wind:0, pad:1280, width:170, terrain:15, description:'A forgiving lunar descent. Learn to read your momentum in the silence of Selene.'},
  {name:'Ember', subtitle:'Into the red', type:'VOLCANIC EXPEDITION', color:'#db907b', glow:'#ffaf75', gravity:31, wind:4, pad:1100, width:140, terrain:30, description:'Stronger gravity and a steady crosswind. Begin your braking burn earlier.'},
  {name:'Nereid', subtitle:'Beyond the blue', type:'ICE WORLD EXPEDITION', color:'#7acdc7', glow:'#6be6d5', gravity:17, wind:-6, pad:1420, width:115, terrain:24, description:'Low gravity, narrow landing zone. Small corrections beat long burns.'}
];
export function ground(x, world){
  const distance = Math.abs(x-world.pad);
  const blend=Math.min(1,Math.max(0,(distance-world.width/2-18)/100));
  return 850 + (Math.sin(x*.009)*world.terrain + Math.sin(x*.025)*world.terrain*.45)*blend;
}
export function initialState(){ return {x:390,y:280,z:0,vx:26,vy:0,vz:0,fuel:100,time:0,status:'flying',reason:'',burn:false,side:0,braking:false}; }
export function step(state, keys, dt, world){
  if(state.status!=='flying')return state;
  const s={z:0,vz:0,...state}; s.time+=dt;
  const up=keys.has('ArrowUp'), brake=keys.has('ArrowDown');
  const lateral=Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));
  const depth=Number(keys.has('KeyS'))-Number(keys.has('KeyW'));
  const cost=(depth?.6:0)+(up?1.5:0)+(brake?2:0)+(lateral?.6:0);
  const power=cost>0?Math.min(1,s.fuel/(cost*dt)):0;
  s.burn=up&&power>0;s.braking=brake&&power>0;s.side=lateral*power;s.depth=depth*power;
  s.fuel=Math.max(0,s.fuel-cost*dt);
  let az=depth*36*power, ax=world.wind+lateral*44*power, ay=world.gravity-(up?65*power:0);
  if(brake&&power>0){az-=s.vz*1.65*power;ax-=s.vx*1.65*power;ay-= s.vy*1.65*power;}
  s.vz+=az*dt;s.z+=s.vz*dt;s.vx+=ax*dt;s.vy+=ay*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;
  if(s.x<35){s.x=35;s.vx=Math.max(0,s.vx);} if(s.x>1765){s.x=1765;s.vx=Math.min(0,s.vx);}
  if(s.z< -450){s.z=-450;s.vz=Math.max(0,s.vz);}if(s.z>450){s.z=450;s.vz=Math.min(0,s.vz);}
  if(s.y<130){s.y=130;s.vy=Math.max(0,s.vy);}
  if(s.y+22>=ground(s.x,world)){
    s.y=ground(s.x,world)-22;
    const aligned=Math.abs(s.x-world.pad)<world.width/2-16 && Math.abs(s.z)<world.width/2-16;
    const gentle=Math.hypot(s.vx,s.vz)<=18 && Math.abs(s.vy)<=28;
    s.status=aligned&&gentle?'landed':'crashed';
    s.reason=!aligned?'You touched down outside the landing zone.':!gentle?'Approach speed was too high. Use ↓ to brake before touchdown.':'Precision touchdown. Welcome to '+world.name+'.';
    s.burn=false;s.braking=false;
  }
  return s;
}
export function predict(state,world){let s={...state};const points=[];for(let i=0;i<100;i++){s=step(s,new Set(),.12,world);points.push({x:s.x,y:s.y,z:s.z});if(s.status!=='flying')break;}return points;}
export function score(s){return Math.round(s.fuel*10+Math.max(0,300-s.time*2)+Math.max(0,300-Math.hypot(s.vx,s.vy)*10));}
