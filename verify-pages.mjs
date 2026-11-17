import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'public');
async function walk(dir){const entries=await fs.readdir(dir,{withFileTypes:true});return(await Promise.all(entries.map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat();}
const files=await walk(root),prefix='/whale-garden/';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.wasm':'application/wasm','.glb':'model/gltf-binary'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(!url.pathname.startsWith(prefix)){res.writeHead(404);res.end();return;}
  const relative=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';
  const target=path.resolve(root,relative);
  if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const data=await fs.readFile(target);
  res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream'});
  res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
let references=0;
try{
 assert(files.length>180,'The full model and decoder bundle must be present');
 assert((await fetch(origin+prefix)).ok,'The project subdirectory must serve index.html');
 for(const file of files){
  const relative=path.relative(root,file).split(path.sep).join('/'),url=origin+prefix+relative;
  assert.equal((await fetch(url,{method:'HEAD'})).status,200,relative);
  if(!/\.(?:js|html|css)$/.test(file))continue;
  const text=await fs.readFile(file,'utf8');
  const patterns=file.endsWith('.html')?[/\b(?:src|href)=["']([^"']+)["']/g]:file.endsWith('.js')?[/\bfrom\s*["']([^"']+)["']/g,/\bimport\s*["']([^"']+)["']/g]:[];
  for(const pattern of patterns)for(const match of text.matchAll(pattern)){
   const ref=match[1];if(!ref.startsWith('.')&&!file.endsWith('.html'))continue;
   if(/^(?:https?:|data:|#)/.test(ref))continue;
   const target=new URL(ref,url);assert(target.pathname.startsWith(prefix),`Escaped Pages project directory: ${ref}`);
   assert.equal((await fetch(target,{method:'HEAD'})).status,200,`${relative} → ${ref}`);references++;
  }
 }
 const script=await fetch(origin+prefix+'sky-whales.js');assert.match(script.headers.get('content-type'),/javascript/);
 assert.match(await script.text(),/WHALE_MAGNIFICATION=100/);
 assert.match(await fs.readFile(path.join(root,'life-state.js'),'utf8'),/whale-garden-forest-v2/);
 assert(files.some(f=>f.endsWith('THREE-LICENSE.txt'))&&files.some(f=>f.endsWith('DRACO-LICENSE.txt')));
 console.log(`Verified ${files.length} hosted files, ${references} relative imports/links, project-subdirectory paths, 100x whales, local-save key and bundled licenses.`);
}finally{await new Promise(resolve=>server.close(resolve));}
