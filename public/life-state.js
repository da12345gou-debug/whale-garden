import {validSave,bounds} from './navigation.js';
import {HOME_BOUNDS} from './house-data.js';
export const LIFE_KEY='whale-garden-forest-v2';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const point=(p,b)=>p&&finite(p.x)&&finite(p.z)&&p.x>=b.minX&&p.x<=b.maxX&&p.z>=b.minZ&&p.z<=b.maxZ;
const angle=n=>finite(n)?Math.atan2(Math.sin(n),Math.cos(n)):0;
export function normalizeLife(input,count=38){
 let raw;try{raw=typeof input==='string'?JSON.parse(input):input;}catch{return null;}
 if(!validSave(raw,count))return null;
 const inventory=values=>Array.from({length:count},(_,i)=>values?.[i]??0);
 const result={version:1,counts:inventory(raw.counts),bagCounts:inventory(raw.bagCounts||raw.counts),storedCounts:inventory(raw.storedCounts),pantryMeals:Array.isArray(raw.pantryMeals)?raw.pantryMeals.slice(0,512):[],position:{x:raw.position.x,z:raw.position.z},collectedAt:Array.isArray(raw.collectedAt)?raw.collectedAt.filter(p=>Array.isArray(p)&&typeof p[0]==='string'&&p[0].length<180&&finite(p[1])&&p[1]>=0).slice(-20000):[],updatedAt:finite(raw.updatedAt)&&raw.updatedAt>0?raw.updatedAt:0};
 const r=raw.resume,b=r?.scene==='home'?HOME_BOUNDS:bounds;
 if(r&&['home','world'].includes(r.scene)&&point(r.position,b)){
  result.resume={scene:r.scene,position:{x:r.position.x,z:r.position.z},yaw:angle(r.yaw)};
  if(point(r.cat,b))result.resume.cat={x:r.cat.x,z:r.cat.z,yaw:angle(r.cat.yaw)};
  const c=r.camera;if(c&&finite(c.yaw)&&finite(c.pitch)&&finite(c.distance))result.resume.camera={yaw:angle(c.yaw),pitch:Math.max(-.65,Math.min(1.42,c.pitch)),distance:Math.max(4,Math.min(22,c.distance))};
 }
 return result;
}
export async function readLife({storage=globalThis.localStorage,desktop=globalThis.whaleGardenDesktop}={}){
 let local=null,disk=null;try{local=normalizeLife(storage.getItem(LIFE_KEY));}catch{}
 try{if(desktop)disk=normalizeLife(await desktop.loadLife());}catch{}
 return disk&&(!local||disk.updatedAt>=local.updatedAt)?disk:local;
}
export function writeLife(snapshot,{storage=globalThis.localStorage,desktop=globalThis.whaleGardenDesktop}={}){
 const life=normalizeLife(snapshot);if(!life)return false;let saved=false;
 try{storage.setItem(LIFE_KEY,JSON.stringify(life));saved=true;}catch{}
 try{if(desktop?.saveLife(life))saved=true;}catch{}
 return saved;
}
