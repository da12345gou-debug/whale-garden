import * as T from './assets/three.module.js';
import {mergeGeometries} from './assets/BufferGeometryUtils.js';
import {terrainHeight,grassCover} from './biome-data.js';
import {grassAllowed} from './meadow-grass.js';
import {fantasyBloomGeometry,BLOOM_NAMES} from './fantasy-blooms.js';

function rng(seed){return()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
function tint(g,hex,variation=false){
  g.deleteAttribute('uv');const p=g.attributes.position,color=new T.Color(hex),colors=[];
  for(let i=0;i<p.count;i++){const c=color.clone();if(variation)c.lerp(new T.Color(0xffe6d8),Math.max(0,p.getY(i))*.26);colors.push(c.r,c.g,c.b);}
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return g;
}
function petal(length,width){
  const pos=[],ix=[];
  for(let i=0;i<=5;i++)for(let j=0;j<=4;j++){
    const t=i/5,s=j/4*2-1,w=Math.sin(Math.PI*t)**.50*width;
    pos.push(s*w,.075*t*t+.045*s*s*Math.sin(Math.PI*t)+.008*Math.sin(s*8)*Math.sin(Math.PI*t),length*t);
    if(i<5&&j<4){const a=i*5+j;ix.push(a,a+5,a+1,a+1,a+5,a+6);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(ix);g.computeVertexNormals();return g;
}
export function flowerSprigGeometry(style=0){
  if(style>=4){const g=fantasyBloomGeometry(style-4),height=g.boundingBox.max.y;g.setAttribute('flowerT',new T.Float32BufferAttribute(Array.from(g.attributes.position.array).filter((_,i)=>i%3===1).map(y=>Math.max(0,y)/height),1));return g;}
  const geometries=[],height=[.70,.85,.65,.95][style],colors=[0xff48ac,0xffd447,0x8563ff,0xff5cc7];
  function head(x,y,z,radius,n,color,tilt=0){
    for(let i=0;i<n;i++){
      const g=petal(radius,radius*.44);g.rotateY(i/n*Math.PI*2);g.rotateX(tilt);g.translate(x,y,z);geometries.push(tint(g,color,true));
    }
    const center=new T.SphereGeometry(radius*.22,8,5);center.scale(1,.42,1);center.translate(x,y+.04,z);geometries.push(tint(center,0xffd45e));
  }
  const stem=new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(),new T.Vector3(.035,height*.45,.015),new T.Vector3(0,height,0)]),8,.012,4,false);geometries.push(tint(stem,0x22a77d));
  for(let i=0;i<4;i++){
    const g=petal(.22+i%2*.12,.075);g.rotateX(-.42);g.rotateY(i*2.4);g.translate(0,.12+i*.09,0);geometries.push(tint(g,i%2?0x37bd89:0x65d596));
  }
  if(style===3){for(let i=0;i<5;i++){const a=i*2.4;head(Math.cos(a)*.11,height+Math.sin(i)*.08,Math.sin(a)*.11,.14,5,colors[style],.1);}}
  else head(0,height,0,[.29,.27,.25][style],style===1?7:8,colors[style],style===2?.18:.04);
  const g=mergeGeometries(geometries);for(const part of geometries)part.dispose();
  const p=g.attributes.position,t=[];for(let i=0;i<p.count;i++)t.push(Math.max(0,p.getY(i))/height);g.setAttribute('flowerT',new T.Float32BufferAttribute(t,1));g.computeBoundingSphere();return g;
}

export function createFlowerMeadow(scene,{mobile=false,getClearings=()=>[],getColliders=()=>[]}={}){
  const root=new T.Group();root.name='Dense living flower beds';root.userData.flowerKinds=BLOOM_NAMES;scene.add(root);
  const uniforms={flowerTime:{value:0}},material=new T.MeshPhongMaterial({vertexColors:true,side:T.DoubleSide,shininess:32,specular:0x66b9c1});
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float flowerT;uniform float flowerTime;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec4 flowerBase=instanceMatrix*vec4(0.,0.,0.,1.);
      float wave=sin(flowerTime*.95+flowerBase.x*.19+flowerBase.z*.13)*.045;
      transformed.x+=wave*flowerT*flowerT;transformed.z+=wave*.4*flowerT*flowerT;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vColor*.075;');
  };
  material.customProgramCacheKey=()=> 'lush-reference-flowers-v2';
  const geometries=Array.from({length:10},(_,i)=>flowerSprigGeometry(i)),tiles=new Map(),tileSize=16,temp=new T.Object3D();let previous='',plantCount=0;
  for(const [index,center] of [[-8,18],[-4,18],[-10,14],[-5,12],[0,19],[-12,19]].entries()){
    const model=new T.InstancedMesh(geometries[index+4],material,7);model.name=BLOOM_NAMES[index];
    for(let j=0;j<7;j++){const a=j*2.399,x=center[0]+Math.cos(a)*(.3+j*.13),z=center[1]+Math.sin(a)*(.3+j*.13);temp.position.set(x,terrainHeight(x,z),z);temp.rotation.set(0,a,0);temp.scale.setScalar(getClearings().some(p=>Math.hypot(x-p.position.x,z-p.position.z)<(p.clearanceRadius??1.1))?0:1.0+j%3*.16);temp.updateMatrix();model.setMatrixAt(j,temp.matrix);}model.receiveShadow=true;model.computeBoundingSphere();root.add(model);
  }
  function buildTile(cx,cz,lod){
    const r=rng((cx*73856093^cz*19349663)^983177),groups=Array.from({length:10},()=>[]),density=[3.1,1.15,.36][lod]*(mobile?.45:1),ox=cx*tileSize,oz=cz*tileSize;
    const clearings=getClearings().filter(p=>p.position.x>ox-3&&p.position.x<ox+19&&p.position.z>oz-3&&p.position.z<oz+19),solids=getColliders().filter(c=>c.x>ox-7&&c.x<ox+23&&c.z>oz-7&&c.z<oz+23);
    const mask=new Float32Array(33*33);
    for(let j=0;j<=32;j++)for(let i=0;i<=32;i++){
      const x=ox+i*.5,z=oz+j*.5;let allowed=grassAllowed(x,z)?grassCover(x,z):0;
      if(allowed)for(const p of clearings)if(Math.hypot(x-p.position.x,z-p.position.z)<(p.clearanceRadius??(p.spec.clearance??.65)+.25)){allowed=0;break;}
      if(allowed)for(const c of solids)if(Math.hypot(x-c.x,z-c.z)<c.r+.30){allowed=0;break;}
      mask[j*33+i]=allowed;
    }
    for(let i=0;i<tileSize*tileSize*density;i++){
      const lx=r()*tileSize,lz=r()*tileSize,x=ox+lx,z=oz+lz,patch=.58+.23*Math.sin(x*.15+Math.sin(z*.10)*2)+.19*Math.sin(z*.17-x*.05),cover=mask[Math.round(lz*2)*33+Math.round(lx*2)];
      if(r()>cover*patch)continue;
      const style=r()<.34?4+Math.floor(r()*6):Math.floor((.5+.5*Math.sin(x*.10+z*.06))*4)%4;
      groups[style].push({x:lx,y:terrainHeight(x,z),z:lz,s:.65+r()*.80,ry:r()*Math.PI*2,lean:(r()-.5)*.14});
    }
    const node=new T.Group();node.position.set(ox,0,oz);let count=0;
    groups.forEach((list,style)=>{
      if(!list.length)return;const mesh=new T.InstancedMesh(geometries[style],material,list.length);
      list.forEach((p,i)=>{temp.position.set(p.x,p.y,p.z);temp.rotation.set(p.lean,p.ry,p.lean*.4);temp.scale.setScalar(p.s);temp.updateMatrix();mesh.setMatrixAt(i,temp.matrix);});
      mesh.receiveShadow=true;mesh.computeBoundingSphere();node.add(mesh);count+=list.length;
    });root.add(node);return{node,lod,count};
  }
  function stream(position){
    const cx=Math.floor(position.x/tileSize),cz=Math.floor(position.z/tileSize),key=cx+','+cz;if(key===previous)return;previous=key;const needed=new Set(),range=mobile?3:4;
    for(let x=cx-range;x<=cx+range;x++)for(let z=cz-range;z<=cz+range;z++){
      const d=Math.hypot((x+.5)*tileSize-position.x,(z+.5)*tileSize-position.z);if(d>(mobile?42:66))continue;
      const lod=d<24?0:d<47?1:2,id=x+','+z;needed.add(id);let tile=tiles.get(id);
      if(tile&&tile.lod!==lod){root.remove(tile.node);tile.node.traverse(o=>{if(o.isInstancedMesh)o.dispose();});tiles.delete(id);tile=null;}
      if(!tile)tiles.set(id,buildTile(x,z,lod));
    }
    for(const [id,tile] of tiles)if(!needed.has(id)){root.remove(tile.node);tile.node.traverse(o=>{if(o.isInstancedMesh)o.dispose();});tiles.delete(id);}
    plantCount=[...tiles.values()].reduce((n,t)=>n+t.count,0);
  }
  return{root,varietyCount:geometries.length,get plantCount(){return plantCount;},update(time,position){uniforms.flowerTime.value=time;stream(position);}};
}
