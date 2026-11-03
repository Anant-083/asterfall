import http from 'node:http';
import {getEphemeris} from './ephemeris.mjs';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
const files=new Set(['index.html','style.css','game.mjs','physics.mjs','solar-data.mjs','atlas.mjs','spacecraft.mjs']);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/api/ephemeris'){const data=await getEphemeris();res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'public, max-age=60'});res.end(JSON.stringify(data));return;}
 if(pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end('{"status":"ok","app":"asterfall"}');return;}
 // A retirement worker replaces cached OpenJarvis workers on the same origin.
 if(pathname==='/sw.js'){res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});res.end("self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.map(k=>caches.delete(k)))).then(()=>self.registration.unregister()).then(()=>self.clients.claim())));");return;}
 const file=pathname==='/'?'index.html':pathname.slice(1);
 if(!files.has(file)){res.writeHead(404);res.end('Not found');return;}
 try{const body=await readFile(path.join(root,file));res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'});res.end(body);}catch{res.writeHead(500);res.end('Unable to load game');}
});
server.listen(Number(process.env.PORT)||10000,'0.0.0.0',()=>console.log('Asterfall listening on port '+(process.env.PORT||10000)));
