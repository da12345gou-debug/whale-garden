import {inCottageFootprint} from './house-data.js';
import * as T from './assets/three.module.js';
import {terrainHeight,biomeAt,biomeWeights,grassCover} from './biome-data.js';
import {random} from './world.js';
import {distanceToGardenPath} from './garden-world.js';
import {GrassBendField} from './grass-field.js';
import {wildTrailDistance} from './trails.js';

export function buildBladeGeometry(){
  const positions=[],tips=[],indices=[];
  for(let blade=0;blade<3;blade++){
    const angle=blade*2.399,ca=Math.cos(angle),sa=Math.sin(angle),base=positions.length/3;
    for(let segment=0;segment<=3;segment++){
      const t=segment/3,width=(1-t)*(.016+blade*.002)+.0004,lean=t*t*(.11+blade*.025),height=t*(.37+blade*.055);
      for(const side of [-1,1]){const xx=side*width+lean;positions.push(xx*ca, height,xx*sa);tips.push(t);}
      if(segment){const a=base+segment*2;indices.push(a-2,a,a-1,a-1,a,a+1);}
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('bladeT',new T.Float32BufferAttribute(tips,1));g.setIndex(indices);g.computeVertexNormals();return g;
}

export function grassAllowed(x,z){
  if(grassCover(x,z)<.015)return false;
  if(inCottageFootprint(x,z,.45)||Math.hypot(x-5,z+34)<4.9)return false;
  if(Math.abs(x)<57&&z>-73&&z<53){if(distanceToGardenPath(x,z)<.57)return false;}
  if(wildTrailDistance(x,z)<.51)return false;
  return true;
}

export function createMeadowGrass(scene,{mobile=false,getClearings=()=>[]}={}){
  const root=new T.Group();root.name='Wind and footsteps meadow';scene.add(root);
  const field=new GrassBendField(),texture=new T.DataTexture(field.pixels,field.count,field.count,T.RGBAFormat,T.UnsignedByteType);
  texture.minFilter=texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
  const uniforms={grassTime:{value:0},grassField:{value:texture},grassOrigin:{value:new T.Vector2()},grassFieldSize:{value:field.size}};
  const material=new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide,dithering:true});
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
      attribute float bladeT; varying float vGrassTip;
      uniform float grassTime; uniform sampler2D grassField; uniform vec2 grassOrigin; uniform float grassFieldSize;`);
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vGrassTip=bladeT;
      vec4 grassBase=modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.);
      vec2 fieldUV=(grassBase.xz-grassOrigin)/grassFieldSize;
      vec2 pressed=vec2(0.);
      if(all(greaterThanEqual(fieldUV,vec2(0.)))&&all(lessThanEqual(fieldUV,vec2(1.))))pressed=(texture2D(grassField,fieldUV).rg*255.-128.)/127.;
      float phase=grassBase.x*.23+grassBase.z*.17;
      float wind=sin(grassTime*1.12+phase)*.065+sin(grassTime*2.05+phase*1.71)*.022;
      vec2 bladeBend=(vec2(.86,.5)*wind+pressed*.78)*pow(bladeT,1.65);
      vec4 grassWorld=modelMatrix*instanceMatrix*vec4(transformed,1.);
      grassWorld.xz+=bladeBend;
      grassWorld.y-=min((grassWorld.y-grassBase.y)*.92,length(pressed)*.29*pow(bladeT,1.4));`);
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 mvPosition=viewMatrix*grassWorld;gl_Position=projectionMatrix*mvPosition;`);
    shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`vec4 worldPosition=grassWorld;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vGrassTip;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      diffuseColor.rgb*=mix(vec3(.45,.70,.65),vec3(1.25,1.22,.82),smoothstep(0.,1.,vGrassTip));`);
  };
  material.customProgramCacheKey=()=> 'living-meadow-v1';
  const geometry=buildBladeGeometry(),tiles=new Map(),TILE=12,temp=new T.Object3D(),tint=new T.Color();let previous='',clumps=0;
  function buildTile(cx,cz,lod){
    const density=(mobile?[14,5,1]:[32,9,1.8])[lod],r=random((cx*73856093^cz*19349663)^37919),list=[];
    // Cache the path mask on a fine grid; sample dense blades without repeating
    // hundreds of winding-path distance checks for each individual clump.
    const allowed=new Uint8Array(25*25),clearings=getClearings().filter(p=>p.position.x>cx*TILE-2.6&&p.position.x<(cx+1)*TILE+2.6&&p.position.z>cz*TILE-2.6&&p.position.z<(cz+1)*TILE+2.6);
    for(let j=0;j<25;j++)for(let i=0;i<25;i++){
      const x=cx*TILE+i*.5,z=cz*TILE+j*.5;let cover=grassAllowed(x,z)?grassCover(x,z):0;
      if(cover)for(const plant of clearings){const radius=plant.clearanceRadius??plant.spec.clearance??(plant.spec.id==='rafflesia'?1.35:.48),d=Math.hypot(x-plant.position.x,z-plant.position.z);if(d<radius)cover*=T.MathUtils.smoothstep(d,radius*.72,radius);}
      allowed[j*25+i]=Math.round(cover*255);
    }
    const attempts=Math.floor(TILE*TILE*density);
    for(let i=0;i<attempts;i++){
      const lx=r()*TILE,lz=r()*TILE,x=cx*TILE+lx,z=cz*TILE+lz;
      if(r()>allowed[Math.round(lz*2)*25+Math.round(lx*2)]/255)continue;
      const weights=biomeWeights(x,z),biome=biomeAt(x,z),scale=(1+weights.rainforest*.3)*(.80+r()*.65);
      list.push({lx,lz,y:terrainHeight(x,z)-.014,angle:r()*Math.PI*2,scale,shade:r(),biome,rain:weights.rainforest});
    }
    if(!list.length)return{mesh:null,lod,count:0};
    const mesh=new T.InstancedMesh(geometry,material,list.length);mesh.name=`Living grass ${cx},${cz}`;mesh.position.set(cx*TILE,0,cz*TILE);
    for(let i=0;i<list.length;i++){
      const p=list[i];temp.position.set(p.lx,p.y,p.lz);temp.rotation.set(0,p.angle,0);temp.scale.set(.75+p.shade*.4,p.scale,.75+p.shade*.4);temp.updateMatrix();mesh.setMatrixAt(i,temp.matrix);
      tint.set(p.shade>.6?0xa7de69:p.shade>.3?0x47be84:0x159b7b);tint.lerp(new T.Color(0x13aaa0),p.rain);mesh.setColorAt(i,tint);
    }
    mesh.receiveShadow=true;mesh.castShadow=false;mesh.computeBoundingSphere();root.add(mesh);return{mesh,lod,count:list.length};
  }
  function stream(position){
    const cx=Math.floor(position.x/TILE),cz=Math.floor(position.z/TILE),key=cx+','+cz;if(key===previous)return;previous=key;
    const needed=new Set(),range=mobile?4:6;
    for(let x=cx-range;x<=cx+range;x++)for(let z=cz-range;z<=cz+range;z++){
      const d=Math.hypot((x+.5)*TILE-position.x,(z+.5)*TILE-position.z);if(d>(mobile?51:76))continue;
      const lod=d<25?0:d<46?1:2,id=x+','+z;needed.add(id);let tile=tiles.get(id);
      if(tile&&tile.lod!==lod){if(tile.mesh){root.remove(tile.mesh);tile.mesh.dispose();}tiles.delete(id);tile=null;}
      if(!tile)tiles.set(id,buildTile(x,z,lod));
    }
    for(const [id,tile] of tiles)if(!needed.has(id)){if(tile.mesh){root.remove(tile.mesh);tile.mesh.dispose();}tiles.delete(id);}
    clumps=[...tiles.values()].reduce((n,tile)=>n+tile.count,0);
  }
  return{root,field,stream,get bladeCount(){return clumps*3;},update(time,dt,girl,cat,girlSpeed=0,catSpeed=0){
    stream(girl);field.follow(girl.x,girl.z);field.step(dt,[{x:girl.x,z:girl.z,radius:girlSpeed>4?1.05:.87,strength:.92},{x:cat.x,z:cat.z,radius:catSpeed>4?.77:.60,strength:.78}]);
    uniforms.grassTime.value=time;uniforms.grassOrigin.value.set(field.originX,field.originZ);texture.needsUpdate=true;
  }};
}
