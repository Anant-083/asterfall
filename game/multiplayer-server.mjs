import {randomBytes} from 'node:crypto';
const fail=(status,message)=>Object.assign(new Error(message),{status});
export function createRooms({now=Date.now,maxRooms=64,capacity=8,ttl=20000}={}){
 const rooms=new Map(),sessions=new Map();
 function prune(){for(const [token,p] of sessions)if(now()-p.seen>ttl)leave(token);}
 function leave(token){const p=sessions.get(token);if(!p)return;const room=rooms.get(p.room);room.players.delete(token);sessions.delete(token);if(!room.players.size)rooms.delete(p.room);}
 function join({name,room,create=false}){prune();if(typeof name!=='string'||!name.trim()||name.length>20)throw fail(400,'Use a pilot name of 1–20 characters.');let code;
 if(create){if(rooms.size>=maxRooms)throw fail(503,'All flight rooms are occupied. Try again shortly.');do{code=randomBytes(4).toString('hex').toUpperCase();}while(rooms.has(code));rooms.set(code,{players:new Map()});}
 else{code=String(room||'').trim().toUpperCase();if(!/^[A-F0-9]{8}$/.test(code)||!rooms.has(code))throw fail(404,'Room not found or expired. Ask your friend for a new code.');}
 const r=rooms.get(code);if(r.players.size>=capacity)throw fail(409,'This room is full (8 pilots).');const token=randomBytes(24).toString('hex'),id=randomBytes(8).toString('hex');const slot=[0,1,2,3,4,5,6,7].find(n=>![...r.players.values()].some(p=>p.slot===n));const spawn=[(slot%4)*90,Math.floor(slot/4)*90,0];const p={token,id,room:code,name:name.trim().replace(/[\x00-\x1f]/g,''),slot,seen:now(),lastSync:0,state:{position:spawn,attitude:[0,0,0,1],throttle:0,status:'paused'}};r.players.set(token,p);sessions.set(token,p);return {token,id,room:code,spawn,capacity};
 }
 function sync(token,state){prune();const p=sessions.get(token);if(!p)throw fail(401,'Session expired. Join the room again.');if(now()-p.lastSync<70)throw fail(429,'Updates are too frequent.');
 const vector=(v,n,limit)=>Array.isArray(v)&&v.length===n&&v.every(x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=limit);
 if(!state||!vector(state.position,3,1e8)||!vector(state.attitude,4,1.001)||!Number.isFinite(state.throttle)||state.throttle<0||state.throttle>1||!['flying','paused','docked','stopped'].includes(state.status))throw fail(400,'Invalid flight state.');const norm=Math.hypot(...state.attitude);if(norm<.9||norm>1.1)throw fail(400,'Invalid attitude.');p.state={position:[...state.position],attitude:state.attitude.map(x=>x/norm),throttle:state.throttle,status:state.status};p.seen=now();p.lastSync=now();return {room:p.room,players:[...rooms.get(p.room).players.values()].map(({id,name,slot,state})=>({id,name,slot,...state}))};
 }
 return {join,sync,leave,prune};
}
export function multiplayerHandler(rooms=createRooms()){
 const timer=setInterval(()=>rooms.prune(),5000);timer.unref();
 return async(req,res,path)=>{if(!path.startsWith('/api/multiplayer/'))return false;
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 if(req.method!=='POST'){send(405,{error:'Use POST.'});return true;}
 if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)throw Error();}catch{send(403,{error:'Cross-origin request rejected.'});return true;}}
 if(!req.headers['content-type']?.startsWith('application/json')){send(415,{error:'JSON required.'});return true;}
 try{let bytes=0,body='';for await(const chunk of req){bytes+=chunk.length;if(bytes>2048){send(413,{error:'Request too large.'});return true;}body+=chunk;}let data;try{data=JSON.parse(body);}catch{throw fail(400,'Invalid JSON.');}if(!data||typeof data!=='object')throw fail(400,'Invalid request.');const token=req.headers.authorization?.replace(/^Bearer /,'');if(path==='/api/multiplayer/join')send(200,rooms.join(data));else if(path==='/api/multiplayer/sync')send(200,rooms.sync(token,data));else if(path==='/api/multiplayer/leave'){rooms.leave(token);send(200,{ok:true});}else send(404,{error:'Not found.'});}catch(e){if(!res.headersSent)send(e.status||500,{error:e.status?e.message:'Room service unavailable.'});}return true;
 };
}
