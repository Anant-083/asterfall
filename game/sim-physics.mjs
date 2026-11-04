import {Vector3,Quaternion,Euler} from './vendor/three.module.js';
export function newFlight(position=[0,0,0]){return {position:new Vector3(...position),velocity:new Vector3(),attitude:new Quaternion(),angular:new Vector3(),throttle:0,fuel:100,elapsed:0,status:'flying',stabilize:true};}
export function flightStep(s,keys,dt,{gravity=null,mouseX=0,mouseY=0}={}){
 if(s.status!=='flying')return s;
 s.elapsed+=dt;
 const axis=(a,b)=>Number(keys.has(a))-Number(keys.has(b));
 s.throttle=Math.max(0,Math.min(1,s.throttle+axis('KeyW','KeyS')*dt*.45));
 if(keys.has('KeyX'))s.throttle=0;
 const torque=new Vector3(axis('ArrowDown','ArrowUp')+mouseY,axis('ArrowLeft','ArrowRight')+mouseX,axis('KeyQ','KeyE'));
 s.angular.addScaledVector(torque,dt*1.4);
 if(s.stabilize)s.angular.multiplyScalar(Math.exp(-dt*3));
 s.angular.clampLength(0,2.2);
 const dq=new Quaternion().setFromEuler(new Euler(s.angular.x*dt,s.angular.y*dt,s.angular.z*dt,'XYZ'));
 s.attitude.multiply(dq).normalize();
 const boost=keys.has('ShiftLeft')||keys.has('ShiftRight');
 const thrust=new Vector3(axis('KeyD','KeyA')*18,axis('KeyR','KeyF')*18,-s.throttle*(boost?100:32));
 const cost=(thrust.length()*.012+(keys.has('KeyX')?1:0))*dt;
 const power=cost?Math.min(1,s.fuel/cost):1;s.fuel=Math.max(0,s.fuel-cost);
 thrust.applyQuaternion(s.attitude);s.velocity.addScaledVector(thrust,dt*power);
 if(keys.has('KeyX'))s.velocity.multiplyScalar(Math.exp(-dt*1.1*power));
 if(gravity){const toward=gravity.center.clone().sub(s.position),d=Math.max(gravity.radius,toward.length());s.velocity.addScaledVector(toward.normalize(),gravity.strength*gravity.radius**2/d**2*dt);}
 s.position.addScaledVector(s.velocity,dt);
 return s;
}
export function dockingStatus(s,station){const distance=s.position.distanceTo(station),speed=s.velocity.length();const facing=new Vector3(0,0,-1).applyQuaternion(s.attitude).dot(new Vector3(0,0,-1));return {distance,speed,aligned:facing>.96,ready:distance<65&&speed<8&&facing>.96};}
