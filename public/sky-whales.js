import * as T from './assets/three.module.js';
import {mergeGeometries} from './assets/BufferGeometryUtils.js';
import {createDetailedWhale} from './sky-life.js';
import {bindWhaleGeometry,createWhaleRig,animateWhale} from './whale-motion.js';

let sharedTemplate;
// Keep the reference details and weight them to the same flexible spine.
export function createWhaleTemplate(){
 if(sharedTemplate)return sharedTemplate;
 const source=createDetailedWhale();source.updateMatrixWorld(true);
 const template=sharedTemplate=new T.Group(),parts=['fin-1','fin1','tail'],mobile=new Set();
 for(const name of parts)source.userData[name].traverse(o=>mobile.add(o));
 const lit=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.30,metalness:.06,emissive:0x245473,emissiveIntensity:.26,fog:false});
 const glow=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,fog:false});
 const skin=source.children.find(o=>o.material?.isShaderMaterial).material;
 skin.vertexShader=`
  #include <common>
  #include <skinning_pars_vertex>
  varying vec3 vN;varying vec3 vP;varying vec3 vC;
  void main(){
   #include <skinbase_vertex>
   vec3 objectNormal=vec3(normal);
   #include <skinnormal_vertex>
   vec3 transformed=vec3(position);
   #include <skinning_vertex>
   vN=normalize(normalMatrix*objectNormal);vP=(modelViewMatrix*vec4(transformed,1.)).xyz;
   vC=color;gl_Position=projectionMatrix*vec4(vP,1.);
  }`;
 const inverse=source.matrixWorld.clone().invert();
 function bake(objects,part='body'){
  const groups={body:[],lit:[],glow:[]};
  for(const o of objects){
   if(!o.isMesh||o.material.side===T.BackSide)continue;
   const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
   for(const attr of Object.keys(g.attributes))if(!['position','normal','color'].includes(attr))g.deleteAttribute(attr);
   g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld));if(!g.attributes.normal)g.computeVertexNormals();
   const colors=g.attributes.color,p=g.attributes.position,col=o.material.color||new T.Color(0xffffff),out=new Float32Array(p.count*3);
   for(let i=0;i<p.count;i++){out[i*3]=(colors?colors.getX(i):1)*col.r;out[i*3+1]=(colors?colors.getY(i):1)*col.g;out[i*3+2]=(colors?colors.getZ(i):1)*col.b;}
   g.setAttribute('color',new T.BufferAttribute(out,3));groups[o.material.isShaderMaterial?'body':o.material.isMeshBasicMaterial?'glow':'lit'].push(g);
  }
  for(const [kind,geos] of Object.entries(groups))if(geos.length){
   const g=mergeGeometries(geos,false);bindWhaleGeometry(g,part);g.computeBoundingSphere();
   const mesh=new T.Mesh(g,kind==='body'?skin:kind==='glow'?glow:lit);mesh.name=part+'-'+kind;template.add(mesh);geos.forEach(geo=>geo.dispose());
  }
 }
 const still=[];source.traverse(o=>{if(!mobile.has(o))still.push(o);});bake(still);
 for(const name of parts){const objects=[];source.userData[name].traverse(o=>objects.push(o));bake(objects,name);}
 return template;
}
export function createSwimmingWhale(size=1){
 const root=new T.Group(),skeleton=createWhaleRig(root);root.userData.size=size;
 for(const original of createWhaleTemplate().children){
  const mesh=new T.SkinnedMesh(original.geometry,original.material);mesh.name=original.name;root.add(mesh);mesh.bind(skeleton,new T.Matrix4());
  mesh.boundingSphere=original.geometry.boundingSphere.clone();mesh.boundingSphere.radius+=9;
 }
 root.scale.setScalar(size);return root;
}
export const WHALE_MAGNIFICATION=100;
export const WHALE_VIEW_DISTANCE=16000;
export function createHeroWhale(){const whale=createSwimmingWhale(WHALE_MAGNIFICATION);whale.name='参照图详细天空蓝鲸';return whale;}

// Real, hundredfold model scale. Keep the complete animated body above the
// canopy while its broad belly and fins sweep across a large part of the sky.
export const HERO_FLIGHT={center:[-300,1850,-2900],radius:[1300,600],period:125,phase:-.4};
export const WHALE_PODS=[
 {name:'近处母子鲸',center:[1900,2100,-3600],radius:[1800,850],period:175,phase:.15,sizes:[.44,.25,.18],spacing:1900},
 {name:'高处结伴鲸',center:[-2100,3100,-4500],radius:[2100,1100],period:210,phase:2.1,sizes:[.38,.23,.18,.15],spacing:1700},
 {name:'远处迁徙鲸群',center:[-700,4100,-6200],radius:[2300,1300],period:240,phase:.3,sizes:[.18,.14,.11,.09,.08],spacing:1100},
 {name:'西侧独游鲸',center:[-3700,2500,-2800],radius:[1700,1050],period:180,phase:3.8,sizes:[.55],spacing:2000},
 {name:'东侧独游鲸',center:[3400,2200,-1900],radius:[1600,950],period:165,phase:1.1,sizes:[.30],spacing:2000}
];
function flight(spec,time){
 const phase=time*Math.PI*2/spec.period+spec.phase,s=Math.sin(phase),c=Math.cos(phase),omega=Math.PI*2/spec.period;
 const vx=spec.radius[0]*c,vz=-spec.radius[1]*s,length=Math.hypot(vx,vz);
 return{x:spec.center[0]+s*spec.radius[0],y:spec.center[1]+Math.sin(phase*2)*1.4,z:spec.center[2]+c*spec.radius[1],tx:vx/length,tz:vz/length,yaw:Math.atan2(-vz,vx),pitch:Math.atan2(2.8*Math.cos(phase*2),length),turn:omega*spec.radius[0]*spec.radius[1]/(length*length)};
}
function place(whale,f,anchor,time,size,phase,behind=0,side=0,lift=0){
 whale.position.set(anchor.x+f.x-f.tx*behind-f.tz*side,f.y+lift,anchor.y+f.z-f.tz*behind+f.tx*side);
 whale.rotation.set(-f.turn*.7,f.yaw,f.pitch,'YZX');animateWhale(whale,time,{size,phase,turn:f.turn});
}
export function createSkyWhales(scene,hero=createHeroWhale()){
 const root=new T.Group();root.name='大小错落的天空鲸群';scene.add(root);if(!hero.parent)scene.add(hero);
 const anchor=new T.Vector2(),pods=WHALE_PODS.map((spec,podIndex)=>({spec,podIndex,whales:spec.sizes.map((size,i)=>{const whale=createSwimmingWhale(size*WHALE_MAGNIFICATION);whale.name=spec.name+' '+(i+1);root.add(whale);return whale;})}));
 let initialized=false;
 function update(time,dt,player){
  if(!initialized||Math.hypot(anchor.x-player.x,anchor.y-player.z)>300){anchor.set(player.x,player.z);initialized=true;}
  else{anchor.x=T.MathUtils.damp(anchor.x,player.x,.08,dt);anchor.y=T.MathUtils.damp(anchor.y,player.z,.08,dt);}
  place(hero,flight(HERO_FLIGHT,time),anchor,time,1,0);
  for(const {spec,podIndex,whales} of pods){
   const f=flight(spec,time);
   for(let i=0;i<whales.length;i++){
    const side=i===0?0:(i%2?1:-1)*(400+Math.floor(i/2)*250),behind=i===0?0:Math.ceil(i/2)*spec.spacing;
    place(whales[i],f,anchor,time,spec.sizes[i],-i*.73+podIndex*.81,behind,side,i*230);
   }
  }
 }
 update(0,0,{x:0,z:0});return{root,hero,pods,anchor,count:root.children.length,update};
}
