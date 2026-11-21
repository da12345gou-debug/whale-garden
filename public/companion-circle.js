import {isPositionClear,CAT_RADIUS} from './navigation.js';
import {HOME_BOUNDS} from './house-data.js';
export function createCompanionCircle(radius=2.45){
 let angle=0,idleAge=0,active=false;
 return {update({girl,cat,dt,walking=false,busy=false,colliders=[],inside=false}){
  if(walking||busy){idleAge=0;active=false;return null;}
  idleAge+=dt;
  if(idleAge<1)return null;
  if(!active){angle=Math.atan2(cat.z-girl.z,cat.x-girl.x);active=true;}
  angle+=dt*.24;
  for(const ahead of [0,.25,.55,.9,1.3]){
   const a=angle+ahead,p={x:girl.x+Math.cos(a)*radius,z:girl.z+Math.sin(a)*radius};
   if(inside&&(p.x<HOME_BOUNDS.minX+.6||p.x>HOME_BOUNDS.maxX-.6||p.z<HOME_BOUNDS.minZ+.6||p.z>HOME_BOUNDS.maxZ-.6))continue;
   if(isPositionClear(p,colliders,CAT_RADIUS+.18)){if(ahead)angle+=Math.min(ahead,dt*.4);return p;}
  }
  return null;
 }};
}
