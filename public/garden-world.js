import {addReferenceCottage} from './reference-cottage.js';
import {inCottageFootprint} from './house-data.js';
import {spaceForagePoints,decorateForagePoint} from './forage-points.js';
import * as T from './assets/three.module.js';
import {petalGeometry} from './petal-geometry.js';
import {addEnchantedLandmarks,placeForageOutsideSolids} from './fantasy-forest.js';
import {addAncientTrees} from './forest-trees.js';
import {GARDEN_RADIUS,WORLD_SCALE} from './world-scale.js';
import {groundColorAt,blendedGroundMaterial} from './biome-data.js';
import {createFantasyPlant} from './flora.js';
import {trailRibbon,trailLateral,wildTrailDistance} from './trails.js';
import {gardenRoute as route,gardenPathDistance as distanceToPath,allGardenPathDistance,cottageTrail,gardenConnectors} from './garden-trails.js';
import {mergeGeometries} from './assets/BufferGeometryUtils.js';
import {mat,mesh,ball,rod,tube,leafGeometry,createPlant,createWhale,refineWhale,species} from './models.js';
import {random,scatterInstances,canopyGeometry,cottage,batch} from './world.js';
import {createTrailSignpost} from './signposts.js';
import {createCloudBanks} from './sky-life.js';
import {createHeroWhale,HERO_FLIGHT} from './sky-whales.js';
export {height} from './world.js';
import {height} from './world.js';
export const pathX=z=>Math.sin(z*.035)*8;
export const distanceToGardenPath=allGardenPathDistance;
function paintTexture(kind){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),r=random(kind==='path'?925:311);ctx.fillStyle=kind==='path'?'#eebc70':'#3e9658';ctx.fillRect(0,0,512,512);const colors=kind==='path'?['#f9d58a','#e5a566','#eab37b','#ffe3a0','#d5a266']:['#30855b','#5aa653','#6caf54','#277d58','#83b74f'];for(let i=0;i<11000;i++){const x=r()*512,y=r()*512;ctx.globalAlpha=.15+r()*.2;ctx.fillStyle=colors[i%colors.length];ctx.beginPath();ctx.ellipse(x,y,1+r()*7,.3+r()*1.2,-.3,0,Math.PI*2);ctx.fill();}const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(kind==='path'?1:18,kind==='path'?20:18);tex.anisotropy=8;return tex;}
function ribbon(parent,curve,width,texture){const pos=[],uv=[],ix=[];for(let i=0;i<=500;i++){const t=i/500,p=curve.getPointAt(t),tan=curve.getTangentAt(t),side=new T.Vector3(-tan.z,0,tan.x);for(let j=0;j<=8;j++){const off=(j/8-.5)*width*(1+.035*Math.sin(t*60)),x=p.x+side.x*off,z=p.z+side.z*off;pos.push(x,height(x,z)+.045,z);uv.push(j/8,i/500);if(i<500&&j<8){const a=i*9+j;ix.push(a,a+9,a+1,a+1,a+9,a+10);}}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();const m=mesh(geo,new T.MeshLambertMaterial({map:texture,color:0xffffff,side:T.DoubleSide}),parent);m.castShadow=false;return m;}
function fernGeometry(){const geos=[];for(let i=0;i<9;i++)for(const s of [-1,1]){const t=i/9,g=leafGeometry(.38*(1-t*.7),.075*(1-t*.6));g.rotateY(s*(.75+t*.2));g.rotateX(-.38);g.translate(0,t*.16,t*.80);geos.push(g);}const g=mergeGeometries(geos);return g;}
function flowerPetal(){return petalGeometry();}
export async function createWorld(scene,onProgress){const r=random(341),root=new T.Group(),decor=new T.Group();scene.add(root,decor);const colliders=[],butterflies=[];onProgress(10);
 const terrain=new T.RingGeometry(0,GARDEN_RADIUS,160,80);terrain.rotateX(-Math.PI/2);for(let i=0;i<terrain.attributes.position.count;i++){const p=terrain.attributes.position;p.setY(i,height(p.getX(i),p.getZ(i)));}terrain.computeVertexNormals();const groundColors=[];for(let i=0;i<terrain.attributes.position.count;i++){const a=terrain.attributes.position,c=groundColorAt(a.getX(i),a.getZ(i));groundColors.push(c.r,c.g,c.b);}terrain.setAttribute('color',new T.Float32BufferAttribute(groundColors,3));const ground=mesh(terrain,blendedGroundMaterial,root);ground.castShadow=false;
 root.add(trailRibbon(route,.94,500));root.add(trailRibbon(cottageTrail,.78,90));for(const curve of gardenConnectors)root.add(trailRibbon(curve,.80,100));
 for(const [destination,direction,x,z,seed] of [['琥珀沙海','东',27,3.5,71],['星灯雨林','西',-30,3.5,103],['银雪松原','南',3.5,26,191],['风铃花原','北',4,-42,251]]){const sign=createTrailSignpost({destination,direction,seed});sign.position.set(x,height(x,z),z);sign.rotation.y=Math.atan2(-x,-5-z);root.add(sign);colliders.push({x,z,r:sign.userData.collisionRadius});}
 const cottage=await addReferenceCottage(root,colliders);
 // A garden with a real edge: layered slopes, a screen of deep emerald trees,
 // and a continuous winding ochre footpath, rather than an endless flat field.
 const crownData=[],trunkData=[],tinyLeaves=[],treePositions=[[-11,24,1.35],[16,26,1.45],[-27,10,1.45],[29,6,1.5],[-33,-20,1.5],[29,-28,1.5],[-23,-45,1.5],[14,-48,1.45]];
 for(let i=0;i<160;i++){const angle=i/160*Math.PI*2,x=Math.cos(angle)*(42+r()*10)*WORLD_SCALE,z=-11+Math.sin(angle)*(46+r()*6)*WORLD_SCALE;treePositions.push([x,z,.75+r()*.65]);}
 for(const [x,z,s] of treePositions){if(Math.hypot(x,z)>32&&wildTrailDistance(x,z)<2)continue;const y=height(x,z),age=r(),h=(age<.22?3.5+r()*3:age<.78?8+r()*9:18+r()*16)*s;trunkData.push({x,y:y+h/2,z,sx:.40*s,sy:h,sz:.40*s,color:0x243347});colliders.push({x,z,r:.55*s});for(let k=0;k<5;k++){const angle=k/5*Math.PI*2+1,rr=k===0?0:2*s,cx=x+Math.cos(angle)*rr,cz=z+Math.sin(angle)*rr,cy=y+h+(k===0?.7:0);crownData.push({x:cx,y:cy,z:cz,sx:(3.3+r()*.5)*s,sy:1.25*s,sz:3.0*s});rod(decor,[x,y+h*.50,z],[cx,cy-.2,cz],.15*s,.055*s,0x293c50);for(let j=0;j<65;j++){const aa=r()*Math.PI*2,v=r(),rr2=Math.sqrt(1-v*v);tinyLeaves.push({x:cx+Math.cos(aa)*rr2*3.5*s,y:cy+v*1.4*s,z:cz+Math.sin(aa)*rr2*3.2*s,rx:-Math.PI/2+(r()-.5)*.9,ry:aa,rz:r(),s:.4+r()*.5,color:v>.6?[0xd7df83,0x9ad475,0x39ba91][j%3]:[0x087970,0x138e84,0x259a9a,0x115f65][j%4]});}}for(let j=0;j<4;j++){const aa=j/4*Math.PI*2,xx=x+Math.cos(aa)*s,zz=z+Math.sin(aa)*s;rod(decor,[x,y+.5,z],[xx,height(xx,zz),zz],.25*s,.10*s,0x293c50);}}
 scatterInstances(root,new T.CylinderGeometry(.68,1,1,14),mat(0xffffff),trunkData,true);scatterInstances(root,canopyGeometry(),mat(0xffffff,{vertexColors:true}),crownData,true);scatterInstances(root,leafGeometry(.8,.30),mat(0xffffff,{side:T.DoubleSide}),tinyLeaves);onProgress(30);await new Promise(a=>setTimeout(a,0));
 // Individual multi-petal cosmos, daisies, long meadow blades and compound ferns.
 const grasses=[],petals=[],centers=[],stems=[],ferns=[],rocks=[];for(let i=0;i<13000;i++){const x=(r()-.5)*84,z=30-r()*85,d=distanceToPath(x,z);if(d<.65||inCottageFootprint(x,z,.5))continue;const y=height(x,z),lush=d<8;if(lush||i%3===0){grasses.push({x,y:y+.015,z,rx:-.9-r()*.5,ry:r()*7,s:.45+r()*.65,color:[0x358a4e,0x66b650,0x1b9e66,0xa3c965][i%4]});}if(i%4===0&&lush){const h=.25+r()*.40,yf=y+h,scale=.6+r()*.7,color=[0xf381ae,0xffb4ca,0xfff0d0,0xef8aac,0x8bbce8][i%5];for(let p=0;p<7;p++)petals.push({x,y:yf,z,ry:p*Math.PI*2/7,rx:-.16,s:scale,color});centers.push({x,y:yf+.025,z,s:.046*scale});stems.push({x,y:y+h/2,z,sx:.012,sy:h,sz:.012});}if(i%31===0&&d<11)ferns.push({x,y:y+.02,z,rx:-.6,ry:r()*7,s:.8+r()*.65});if(i%193===0&&d>3)rocks.push({x,y:y-.15,z,sx:.5+r(),sy:.35+r()*.4,sz:.5+r()*.7,ry:r()*6,color:[0x598a8a,0x7f98aa,0x669486][i%3]});}
 scatterInstances(root,flowerPetal(),mat(0xffffff,{side:T.DoubleSide}),petals);scatterInstances(root,new T.SphereGeometry(1,8,5),mat(0xffcb45),centers);scatterInstances(root,new T.CylinderGeometry(1,1,1,5),mat(0x3b8849),stems);scatterInstances(root,fernGeometry(),mat(0x88c657,{side:T.DoubleSide}),ferns);scatterInstances(root,new T.DodecahedronGeometry(1,1),mat(0xffffff),rocks,true);
 // Border mounds make it clear that this is an enclosed woodland garden.
 for(let i=0;i<0;i++){const a=i/28*Math.PI*2,x=Math.cos(a)*49,z=-10+Math.sin(a)*56;ball(decor,[0x146553,0x197b63,0x288b66][i%3],[x,-2,z],[9,4+r()*4,9]);}
 // A little stone clearing at the far end offers an unobstructed view of the whale.
 const lookout=mesh(new T.CylinderGeometry(4.5,4.7,.25,48),mat(0xc5bd8f),decor,[5,height(5,-34)+.03,-34]);lookout.receiveShadow=true;const bench=new T.Group();bench.position.set(6,height(6,-37),-37);decor.add(bench);mesh(new T.BoxGeometry(2.5,.14,.60),mat(0xa27559),bench,[0,.55,0]);mesh(new T.BoxGeometry(2.5,.55,.10),mat(0xb78962),bench,[0,.92,-.24]);for(const xx of [-.9,.9])for(const zz of [-.2,.2])rod(bench,[xx,0,zz],[xx,.55,zz],.055,.055,0x305d51);
 onProgress(52);await new Promise(a=>setTimeout(a,0));
 // Cream/pink-lit clouds under the requested blazing orange sky.
 const clouds=createCloudBanks(scene);
 batch(decor);const whale=createHeroWhale();whale.position.fromArray(HERO_FLIGHT.center);scene.add(whale);
 const glitter=[],sparkColors=[];for(let i=0;i<95;i++){const x=(r()-.5)*38,y=(r()-.5)*9,z=(r()-.5)*13;glitter.push(x,y,z);sparkColors.push(1,.8+r()*.2,.75+r()*.25);}const glitterGeo=new T.BufferGeometry();glitterGeo.setAttribute('position',new T.Float32BufferAttribute(glitter,3));glitterGeo.setAttribute('color',new T.Float32BufferAttribute(sparkColors,3));whale.add(new T.Points(glitterGeo,new T.PointsMaterial({size:.13,vertexColors:true,transparent:true,opacity:.8,depthWrite:false})));
 const motes=[],moteGeo=new T.BufferGeometry();for(let i=0;i<240;i++)motes.push((r()-.5)*65,.7+r()*12,25-r()*70);moteGeo.setAttribute('position',new T.Float32BufferAttribute(motes,3));const fireflies=new T.Points(moteGeo,new T.PointsMaterial({size:.055,color:0xffecc5,transparent:true,opacity:.7,depthWrite:false}));scene.add(fireflies);
 for(let i=0;i<16;i++){const b=new T.Group(),x=(r()-.5)*45,z=22-r()*64;b.position.set(x,height(x,z)+1.4,z);b.userData.base=b.position.clone();for(const s of [-1,1]){const w=mesh(new T.SphereGeometry(1,12,8),mat(i%2?0xff9dc7:0xfbe07f),b,[s*.09,0,0],[.12,.012,.18]);w.userData.side=s;}scene.add(b);butterflies.push(b);}onProgress(76);await new Promise(a=>setTimeout(a,0));
 const collectibles=[];for(let i=0;i<16;i++){const p=route.getPointAt(i/16),tan=route.getTangentAt(i/16),s=i%2?1:-1,off=.95+r()*.8;const x=p.x-tan.z*off*s,z=p.z+tan.x*off*s,spec=species[i%9],plant=createFantasyPlant(spec,1.3);plant.position.set(x,height(x,z),z);plant.rotation.y=r()*6;scene.add(plant);const ring=mesh(new T.TorusGeometry(.40,.009,5,32),new T.MeshBasicMaterial({color:0xfff0b4,transparent:true,opacity:.35}),scene,[x,plant.position.y+.03,z]);ring.rotation.x=Math.PI/2;ring.castShadow=false;const sparkle=mesh(new T.OctahedronGeometry(.055),new T.MeshBasicMaterial({color:0xfff6d5}),scene,[x,plant.position.y+.95,z]);sparkle.castShadow=false;collectibles.push({id:'garden-plant-'+i,spec,mesh:plant,ring,sparkle,position:plant.position.clone(),available:true,regrowAt:0});}
 for(const [id,x,z] of [['strawberry',4,19],['raspberry',-18,3],['blueberry',18,-20],['porcini',-5,16],['flyagaric',-29,-29]]){
   const spec=species.find(s=>s.id===id),plant=createFantasyPlant(spec,1.3);plant.position.set(x,height(x,z),z);plant.rotation.y=r()*6;scene.add(plant);
   const ring=mesh(new T.TorusGeometry(.40,.009,5,32),new T.MeshBasicMaterial({color:spec.poisonous?0xd8bce9:0xfff0b4,transparent:true,opacity:.28}),scene,[x,plant.position.y+.03,z]);ring.rotation.x=Math.PI/2;ring.castShadow=false;
   const sparkle=mesh(new T.OctahedronGeometry(.045),new T.MeshBasicMaterial({color:0xfff6d5}),scene,[x,plant.position.y+.95,z]);sparkle.castShadow=false;
   collectibles.push({id:'garden-special-'+id,spec,mesh:plant,ring,sparkle,position:plant.position.clone(),available:true,regrowAt:0});
 }
 const enchanted=addEnchantedLandmarks(scene,colliders),forest=addAncientTrees(scene,colliders);placeForageOutsideSolids(collectibles,colliders);spaceForagePoints(collectibles,colliders,{maxRadius:58});collectibles.forEach(decorateForagePoint);onProgress(95);return{root,colliders,cottage,whale,clouds,enchanted,forest,balloons:[],fireflies,butterflies,collectibles};
}
