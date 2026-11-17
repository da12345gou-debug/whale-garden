import * as T from './assets/three.module.js';
import {trailLateral,wildTrailDistance} from './trails.js';
export const gardenRoute=new T.CatmullRomCurve3([[0,16],[8,14],[11,10],[16,5],[17,-4],[21,-15],[11,-28],[6,-34],[-5,-39],[-17,-33],[-27,-26],[-28,-14],[-27,-3],[-17,8],[-7,12]].map(([x,z])=>new T.Vector3(x,0,z)),true,'centripetal');
const make=points=>new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,0,z)),false,'centripetal');
export const cottageTrail=make([[-27,-3],[-23,-5.8],[-18,-6.7],[-13,-7.3]]);
export const gardenConnectors=[
  make([[16,5],[23,3.8],[28,1.2],[36,trailLateral(36)]]),
  make([[-27,-3],[-32,-4],[-36,trailLateral(-36)]]),
  make([[0,16],[2,22],[-1,29],[trailLateral(38),38]]),
  make([[6,-34],[2,-39],[-1,-44],[trailLateral(-53),-53]])
];
export const gardenTrailCurves=[gardenRoute,cottageTrail,...gardenConnectors];
const grid=new Map(),cell=8;
for(const curve of gardenTrailCurves){
  const points=curve.getPoints(curve===gardenRoute?220:44);
  for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],segment={ax:a.x,az:a.z,bx:b.x,bz:b.z};
    for(let x=Math.floor((Math.min(a.x,b.x)-12)/cell);x<=Math.floor((Math.max(a.x,b.x)+12)/cell);x++)for(let z=Math.floor((Math.min(a.z,b.z)-12)/cell);z<=Math.floor((Math.max(a.z,b.z)+12)/cell);z++){
      const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(segment);
    }
  }
}
export function gardenPathDistance(x,z){
  let min=Infinity;for(const s of grid.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[]){const dx=s.bx-s.ax,dz=s.bz-s.az,t=T.MathUtils.clamp(((x-s.ax)*dx+(z-s.az)*dz)/(dx*dx+dz*dz||1),0,1);min=Math.min(min,(x-s.ax-dx*t)**2+(z-s.az-dz*t)**2);}return Math.sqrt(min);
}
export function allGardenPathDistance(x,z){return Math.min(gardenPathDistance(x,z),wildTrailDistance(x,z));}
