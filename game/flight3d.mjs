import * as T from './vendor/three.module.js';
import {ground,predict} from './physics.mjs';
const palettes={mars:['#9d573b','#b57550','#292333'],moon:['#777e87','#b7bec5','#020610'],europa:['#82a9b8','#d8e8e8','#05111e'],titan:['#9b713a','#bf9b5d','#392a1c'],venus:['#90673e','#c59c58','#403023'],mercury:['#72665c','#ad9e8a','#04070c'],earth:['#4b695f','#819389','#071b2b']};
function rng(n){const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);}
function terrainTexture(id){
  const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d'),p=palettes[id]||palettes.moon;
  g.fillStyle=p[0];g.fillRect(0,0,512,512);
  for(let i=0;i<16000;i++){g.fillStyle=i%2?'#ffffff0b':'#00000013';g.fillRect(rng(i)*512,rng(i+200)*512,1+rng(i+30)*3,1+rng(i+50)*3);}
  if(id==='europa'){g.strokeStyle='#5d656b99';for(let i=0;i<24;i++){g.lineWidth=1+rng(i)*3;g.beginPath();g.moveTo(rng(i)*512,0);for(let y=0;y<=512;y+=30)g.lineTo(rng(i)*512+Math.sin(y*.03+i)*30,y);g.stroke();}}
  else if(id==='titan'){for(let i=0;i<35;i++){g.strokeStyle='#eddba12a';g.lineWidth=4;g.beginPath();for(let x=0;x<512;x+=5)g.lineTo(x,i*18+Math.sin(x*.02)*15);g.stroke();}}
  else {for(let i=0;i<75;i++){const x=rng(i+4)*512,y=rng(i+70)*512,r=3+rng(i+200)*28;const grad=g.createRadialGradient(x-r*.2,y-r*.2,1,x,y,r);grad.addColorStop(0,'#00000040');grad.addColorStop(.7,'#00000018');grad.addColorStop(.86,'#ffffff25');grad.addColorStop(1,'#ffffff00');g.fillStyle=grad;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}}
  const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(5,4);tex.colorSpace=T.SRGBColorSpace;return tex;
}
function planetTexture(body){
  const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d');g.fillStyle=body?.color||'#9babb5';g.fillRect(0,0,1024,512);
  if(body?.orbitOnly){for(let y=0;y<512;y+=4){g.fillStyle=`rgba(${y%12?20:245},${y%12?30:220},${y%12?45:175},${.04+rng(y)*.12})`;g.beginPath();g.moveTo(0,y);for(let x=0;x<=1024;x+=20)g.lineTo(x,y+Math.sin(x*.02+y)*3);g.lineTo(1024,y+8);g.lineTo(0,y+8);g.fill();}}
  else if(body?.id==='earth'){g.fillStyle='#386d98';g.fillRect(0,0,1024,512);for(let i=0;i<80;i++){const x=rng(i+9)*1024,y=70+rng(i+90)*350;g.fillStyle=i%2?'#426956':'#648060';g.beginPath();g.ellipse(x,y,10+rng(i+8)*45,8+rng(i+3)*30,rng(i)*4,0,7);g.fill();}g.fillStyle='#e3efed';g.fillRect(0,0,1024,24);g.fillRect(0,488,1024,24);}
  else {for(let i=0;i<700;i++){const x=rng(i)*1024,y=rng(i+70)*512,r=2+rng(i+20)*15;g.fillStyle='#00000014';g.beginPath();g.arc(x,y,r,0,7);g.fill();g.strokeStyle='#ffffff17';g.lineWidth=1;g.stroke();}}
  for(let i=0;i<8000;i++){g.fillStyle=i%2?'#ffffff07':'#00000007';g.fillRect(rng(i)*1024,rng(i+40)*512,2,2);}const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;
}
export function createFlight3D(canvas,onUnavailable){
  let renderer;
  try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});}catch{onUnavailable();return null;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,1,20000);scene.background=new T.Color('#030915');
  scene.add(new T.HemisphereLight(0xb5ddff,0x29202a,1.4));const sun=new T.DirectionalLight(0xffe6bf,2.4);sun.position.set(-800,1400,600);scene.add(sun);const fill=new T.DirectionalLight(0x8ec8ff,1);fill.position.set(400,700,900);scene.add(fill);
  const stars=new Float32Array(3500*3);for(let i=0;i<3500;i++){const a=rng(i)*Math.PI*2,r=4500+rng(i+5)*3000,h=(rng(i+30)-.2)*5000;stars.set([Math.cos(a)*r,h,Math.sin(a)*r],i*3);}const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(stars,3));scene.add(new T.Points(sg,new T.PointsMaterial({color:0xa5c4e5,size:4,sizeAttenuation:true})));
  const hull=new T.MeshStandardMaterial({color:0xc9d4dc,metalness:.55,roughness:.32}),dark=new T.MeshStandardMaterial({color:0x182a3e,metalness:.6,roughness:.3}),gold=new T.MeshStandardMaterial({color:0xb6945a,metalness:.7,roughness:.5}),glow=new T.MeshStandardMaterial({color:0x9dffdf,emissive:0x63e6c0,emissiveIntensity:1.4});
  function mesh(geo,mat,parent,pos=[0,0,0]){const m=new T.Mesh(geo,mat);m.position.set(...pos);parent.add(m);return m;}
  const ship=new T.Group();scene.add(ship);
  mesh(new T.CylinderGeometry(14,18,36,24),hull,ship,[0,9,0]);mesh(new T.ConeGeometry(14,25,24),hull,ship,[0,39,0]);
  const window=mesh(new T.BoxGeometry(18,12,2),new T.MeshStandardMaterial({color:0x183f59,emissive:0x143348,metalness:.8,roughness:.15}),ship,[0,25,12]);window.rotation.x=-.25;
  const flames=[];
  for(const side of [-1,1]){mesh(new T.CylinderGeometry(5,8,10,18,true),dark,ship,[side*9,-15,0]);const f=mesh(new T.ConeGeometry(5,35,14),new T.MeshBasicMaterial({color:0x92dcff,transparent:true,opacity:.8}),ship,[side*9,-36,0]);f.rotation.z=Math.PI;flames.push(f);mesh(new T.BoxGeometry(18,2,25),dark,ship,[side*31,8,0]);for(let j=0;j<4;j++)mesh(new T.BoxGeometry(18,.3,.4),hull,ship,[side*31,9.1,-9+j*6]);mesh(new T.BoxGeometry(7,10,5),gold,ship,[side*16,-2,0]);}
  for(const x of [-1,1])for(const z of [-1,1]){const leg=mesh(new T.CylinderGeometry(1.2,1.2,30,8),hull,ship,[x*20,-8,z*14]);leg.rotation.z=x*.4;leg.rotation.x=-z*.3;mesh(new T.CylinderGeometry(6,6,1.5,10),dark,ship,[x*26,-22,z*19]);}
  const mast=mesh(new T.CylinderGeometry(.6,.6,22,8),hull,ship,[15,33,0]);mast.rotation.z=-.5;const dish=mesh(new T.SphereGeometry(5,16,8,0,Math.PI*2,0,Math.PI*.4),hull,ship,[20,43,0]);dish.rotation.z=-.8;
  const planet=mesh(new T.SphereGeometry(520,48,32),new T.MeshStandardMaterial({color:0x99bacd,roughness:1}),scene,[900,300,-2200]);
  const ring=mesh(new T.RingGeometry(680,860,96),new T.MeshBasicMaterial({color:0xc7b993,side:T.DoubleSide,transparent:true,opacity:.55}),planet);ring.rotation.x=Math.PI*.43;ring.scale.setScalar(1/1);ring.visible=false;
  const rover=new T.Group();scene.add(rover);mesh(new T.BoxGeometry(20,8,28),gold,rover,[0,9,0]);mesh(new T.BoxGeometry(22,1,24),dark,rover,[0,14,0]);mesh(new T.CylinderGeometry(1,1,20,8),hull,rover,[0,23,-6]);mesh(new T.BoxGeometry(8,5,5),dark,rover,[0,33,-6]);const wheels=[];for(const side of [-1,1])for(const z of [-10,0,10]){const w=mesh(new T.CylinderGeometry(5,5,4,12),dark,rover,[side*12,5,z]);w.rotation.z=Math.PI/2;wheels.push(w);}
  const environment=new T.Group();scene.add(environment);const markers=new T.Group();scene.add(markers);let terrain=null,worldId='',lastWorld=null,yaw=.35,drag=null;const target=new T.Vector3(),desired=new T.Vector3();
  const trajectoryGeometry=new T.BufferGeometry();trajectoryGeometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(303),3));const trajectory=new T.Line(trajectoryGeometry,new T.LineDashedMaterial({color:0x89d6c0,dashSize:8,gapSize:12,transparent:true,opacity:.5}));scene.add(trajectory);
  function disposeGroup(group){while(group.children.length){const obj=group.children.pop();obj.traverse(o=>{o.geometry?.dispose();if(o.material&&![hull,dark,gold,glow].includes(o.material)){o.material.map?.dispose();o.material.dispose();}});obj.parent=null;}}
  function setWorld(w,points=[]){
    const id=(w.body?.id||w.name)+':'+points.length;if(worldId===id)return;worldId=id;lastWorld=w;disposeGroup(environment);disposeGroup(markers);const palette=palettes[w.body?.id]||palettes.moon;
    scene.fog=new T.FogExp2(palette[2],w.body?.id==='titan'?.0008:w.body?.id==='venus'?.00065:.00012);scene.background=new T.Color(palette[2]);
    const geo=new T.PlaneGeometry(2400,1600,120,80);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,850-ground(pos.getX(i)+900,w));geo.computeVertexNormals();terrain=mesh(geo,new T.MeshStandardMaterial({map:terrainTexture(w.body?.id),roughness:.96,metalness:0}),environment);
    const pad=mesh(new T.CylinderGeometry(w.width/2,w.width/2,3,48),dark,environment,[w.pad-900,1,0]);
    const beacon=mesh(new T.TorusGeometry(w.width/2-4,1.4,8,64),glow,environment,[w.pad-900,3,0]);beacon.rotation.x=Math.PI/2;
    for(let i=0;i<8;i++){const a=i*Math.PI/4;mesh(new T.CylinderGeometry(2,2,9,8),glow,environment,[w.pad-900+Math.cos(a)*(w.width/2),7,Math.sin(a)*(w.width/2)]);}
    // Non-colliding geological scenery lies outside the flight/rover corridor.
    for(let i=0;i<85;i++){const x=(rng(i+10)-.5)*2100,z=(i%2?1:-1)*(530+rng(i+70)*200),size=8+rng(i+90)*48;const rock=mesh(new T.DodecahedronGeometry(size,0),new T.MeshStandardMaterial({color:palette[0],roughness:1}),environment,[x,850-ground(x+900,w)+size*.3,z]);rock.scale.y=.6+rng(i);rock.rotation.set(rng(i)*2,rng(i+2)*5,rng(i+3));}
    planet.material.map?.dispose();planet.material.map=planetTexture(w.body);planet.material.color.set('#ffffff');planet.material.needsUpdate=true;ring.visible=!!w.body?.rings;
    const nasaIds=['earth','moon','mars','europa','titan','jupiter','saturn','neptune','venus'];
    if(nasaIds.includes(w.body?.id))new T.TextureLoader().load('/assets/'+w.body.id+'.jpg',tex=>{if(worldId!==id){tex.dispose();return;}tex.colorSpace=T.SRGBColorSpace;planet.material.map?.dispose();planet.material.map=tex;planet.material.needsUpdate=true;},undefined,()=>{});
    for(const point of points){const m=new T.Group();m.position.set(point.x-900,850-ground(point.x,w),point.z);markers.add(m);mesh(new T.CylinderGeometry(3,4,25,10),gold,m,[0,12,0]);const halo=mesh(new T.TorusGeometry(13,1,8,24),glow,m,[0,30,0]);halo.rotation.x=Math.PI/2;}
    if(w.body?.orbitOnly){environment.visible=false;markers.visible=false;}else environment.visible=true;
  }
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(drag){yaw+=(e.clientX-drag.x)*.005;drag.x=e.clientX;}});for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
  let failed=false;canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;onUnavailable();});
  return {render(s,w,view,mode,time,surface,points=[]){
    if(failed)return false;setWorld(w,points);const orbital=mode==='orbit',onSurface=mode==='surface';terrain.visible=!orbital;markers.visible=onSurface;environment.visible=!orbital;rover.visible=onSurface;trajectory.visible=!onSurface&&!orbital&&mode!=='ready';
    ship.position.set(s.x-900,850-s.y,s.z||0);ship.rotation.set(0,0,-Math.max(-.2,Math.min(.2,s.vx*.003)));ship.visible=s.status!=='crashed'&&view!=='cockpit';
    flames.forEach(f=>{f.visible=mode==='flying'&&(s.burn||s.braking);f.scale.y=.8+Math.sin(time*40)*.15;});
    if(onSurface){rover.position.set(surface.x-900,850-ground(surface.x,w),surface.z);rover.rotation.y=surface.heading||0;if(surface.moving)wheels.forEach(w=>w.rotation.x+=.1);target.copy(rover.position);desired.set(target.x+90, target.y+150,target.z+220);}
    else if(orbital){ship.position.set(-100,380,100);target.set(400,600,-900);desired.set(0,500,550);if(view==='chase')desired.set(-20,430,260);}
    else if(view==='cockpit'){desired.copy(ship.position).add(new T.Vector3(0,20,5));target.set(w.pad-900,0,0);}
    else if(view==='chase'){target.copy(ship.position);desired.set(target.x+Math.sin(yaw)*220,target.y+110,target.z+Math.cos(yaw)*270);}
    else if(camera.aspect<.8){target.copy(ship.position).add(new T.Vector3(0,-80,0));desired.set(target.x+Math.sin(yaw)*400,target.y+220,target.z+Math.cos(yaw)*850);}
    else{target.set((s.x-900+w.pad-900)*.5,300,0);desired.set(target.x+Math.sin(yaw)*700,750,Math.cos(yaw)*1500);}
    camera.position.copy(desired);camera.lookAt(target);
    if(trajectory.visible){const prediction=[{x:s.x,y:s.y,z:s.z||0},...predict(s,w)],arr=trajectory.geometry.attributes.position;for(let i=0;i<prediction.length;i++)arr.setXYZ(i,prediction[i].x-900,850-prediction[i].y,prediction[i].z||0);trajectory.geometry.setDrawRange(0,prediction.length);arr.needsUpdate=true;trajectory.computeLineDistances();}
    renderer.render(scene,camera);return true;
  },photo(){return canvas.toDataURL('image/jpeg',.8);}};
}
