import * as T from './assets/three.module.js';
import {mergeGeometries} from './assets/BufferGeometryUtils.js';
import {terrainHeight,grassCover} from './biome-data.js';
import {wildTrailDistance} from './trails.js';
const barkMaterial=new T.MeshLambertMaterial({vertexColors:true}),crownMaterial=new T.MeshLambertMaterial({vertexColors:true}),mossMaterial=new T.MeshLambertMaterial({color:0x5dcba1});
function random(seed){return()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
function paintBark(g,height){
  g.deleteAttribute('uv');const p=g.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),light=.5+.5*Math.sin(a*3+y*.17);
    const c=new T.Color(0x173d4b).lerp(new T.Color(0x5e5a8b),light*.42).lerp(new T.Color(0x248578),T.MathUtils.smoothstep(y,0,height)*.26);c.multiplyScalar(.84+.18*Math.sin(a*11+y*.15));colors.push(c.r,c.g,c.b);
  }g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return g;
}
function taperedBranch(points,radii,height,segments=32,sides=10){
  const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),g=new T.TubeGeometry(path,segments,1,sides,false),p=g.attributes.position;
  for(let i=0;i<=segments;i++){
    const t=i/segments,center=path.getPointAt(t),v=t*(radii.length-1),lo=Math.min(radii.length-2,Math.floor(v)),radius=T.MathUtils.lerp(radii[lo],radii[lo+1],v-lo);
    for(let j=0;j<=sides;j++){const k=i*(sides+1)+j,a=j/sides*Math.PI*2,r=radius*(1+.065*Math.sin(a*7+t*12));p.setXYZ(k,center.x+(p.getX(k)-center.x)*r,center.y+(p.getY(k)-center.y)*r,center.z+(p.getZ(k)-center.z)*r);}
  }g.computeVertexNormals();return paintBark(g,height);
}
const crownGeometry=(()=>{
  const g=new T.SphereGeometry(1,18,12),p=g.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),wave=1+.12*Math.sin(x*12+z*7)*Math.sin(y*8-z*6);p.setXYZ(i,x*wave,y*wave,z*wave);
    const c=new T.Color(y>.4?0xbce974:y>-.1?0x18baa1:0x0a5e69);c.lerp(new T.Color(0x4ac7d9),Math.max(0,x)*.22);colors.push(c.r,c.g,c.b);
  }g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
})();
export function createAncientTree({height=58,seed=3,x=0,z=0}={}){
  const root=new T.Group();root.name='Ancient giant forest tree';root.userData.treeHeight=height;root.userData.forestKind='ancient';const r=random(seed),radius=height*.053,spread=height*.29,base=terrainHeight(x,z),bark=[],crowns=[];
  bark.push(taperedBranch([[0,0,0],[-radius*.3,height*.22,.6],[radius*.34,height*.52,-.8],[radius*.18,height*.80,.4],[0,height*.96,0]],[radius*1.28,radius*.94,radius*.70,radius*.45,radius*.18],height,58,18));
  for(let i=0;i<9;i++){
    const a=i*2.399+.3,reach=spread*(.58+r()*.42),startY=height*(.43+(i%3)*.07),tipY=height*(.76+(i%3)*.075),tx=Math.cos(a)*reach,tz=Math.sin(a)*reach;
    bark.push(taperedBranch([[0,startY,0],[tx*.33,startY+height*.12,tz*.33],[tx*.72,tipY-height*.035,tz*.75],[tx,tipY,tz]],[radius*.43,radius*.29,radius*.12,.10],height,28,10));
    for(let j=0;j<5;j++){const b=j*2.399,rr=j?spread*.14:0;crowns.push({x:tx+Math.cos(b)*rr,y:tipY+(j===0?1.0:0)+(r()-.5)*1.5,z:tz+Math.sin(b)*rr,sx:spread*(.26+r()*.10),sy:height*(.038+r()*.020),sz:spread*(.24+r()*.10),ry:r()*6});}
  }
  for(let i=0;i<9;i++){
    const a=i/9*Math.PI*2,reach=radius*(2.1+r()*.9),xx=Math.cos(a)*reach,zz=Math.sin(a)*reach,ground=terrainHeight(x+xx,z+zz)-base;
    bark.push(taperedBranch([[Math.cos(a)*radius*.4,height*.07,Math.sin(a)*radius*.4],[xx*.45,height*.023,zz*.45],[xx,ground+.03,zz]],[radius*.42,radius*.29,.07],height,24,10));
  }
  const merged=mergeGeometries(bark);for(const g of bark)g.dispose();const trunk=new T.Mesh(merged,barkMaterial);trunk.castShadow=true;trunk.receiveShadow=true;root.add(trunk);
  const foliage=new T.InstancedMesh(crownGeometry,crownMaterial,crowns.length),temp=new T.Object3D();foliage.userData.sharedForestGeometry=true;
  crowns.forEach((p,i)=>{temp.position.set(p.x,p.y,p.z);temp.rotation.set(0,p.ry,0);temp.scale.set(p.sx,p.sy,p.sz);temp.updateMatrix();foliage.setMatrixAt(i,temp.matrix);});foliage.computeBoundingSphere();foliage.castShadow=true;foliage.receiveShadow=true;root.add(foliage);
  const vines=[];
  for(let j=0;j<3;j++){
    const points=[];for(let i=0;i<=44;i++){const t=i/44,a=t*14+j*2.1,rr=radius*(1.04-t*.3);points.push(new T.Vector3(Math.cos(a)*rr,height*(.08+t*.62),Math.sin(a)*rr));}
    vines.push(new T.TubeGeometry(new T.CatmullRomCurve3(points),90,.07,6,false));
  }
  const vineMesh=new T.Mesh(mergeGeometries(vines),mossMaterial);for(const g of vines)g.dispose();root.add(vineMesh);root.userData.collisionRadius=radius*1.55;return root;
}
export function addAncientTrees(scene,colliders){
  const root=new T.Group();root.name='Uneven ancient forest skyline';scene.add(root);
  for(const [x,z,height,seed] of [[-39,-17,49,31],[44,-20,64,91],[-38,-94,78,117],[88,-65,58,391],[-85,47,67,461],[38,76,53,701]]){
    const tree=createAncientTree({height,seed,x,z});tree.position.set(x,terrainHeight(x,z),z);root.add(tree);colliders.push({x,z,r:tree.userData.collisionRadius});
  }return root;
}
export function addWildAncientTree(root,colliders,ox,oz,seed){
  if((Math.abs(seed)%5)!==0||Math.hypot(ox,oz)<190)return;
  const r=random(seed),x=ox+(r()-.5)*45,z=oz+(r()-.5)*45;if(grassCover(x,z)<.8||wildTrailDistance(x,z)<12)return;
  const tree=createAncientTree({height:34+r()*32,seed,x,z});tree.position.set(x,terrainHeight(x,z),z);root.add(tree);colliders.push({x,z,r:tree.userData.collisionRadius});
}
