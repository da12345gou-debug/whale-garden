import * as T from './assets/three.module.js';
import {terrainHeight} from './biome-data.js';
export const TRAIL_WIDTH=.82;
function hash(i){let n=Math.imul(i^7919,374761393);n=Math.imul(n^n>>>13,1274126177);return((n^n>>>16)>>>0)/4294967296;}
export function trailLateral(t){
  const v=t/38,i=Math.floor(v),u=v-i,p0=(hash(i-1)*2-1)*10,p1=(hash(i)*2-1)*10,p2=(hash(i+1)*2-1)*10,p3=(hash(i+2)*2-1)*10;
  const value=.5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u);
  return (value+Math.sin(t*.079)*1.4+Math.sin(t*.133+1.7)*2.8)*T.MathUtils.smoothstep(Math.abs(t),19,43);
}
export function wildTrailDistance(x,z){
  const distance=(a,b)=>Math.abs(b-trailLateral(a))/Math.sqrt(1+((trailLateral(a+.1)-trailLateral(a-.1))/.2)**2);
  let d=Infinity;if(Math.abs(x)>30)d=Math.min(d,distance(x,z));if(Math.abs(z)>30)d=Math.min(d,distance(z,x));return d;
}
let material;const pebbleGeometry=new T.DodecahedronGeometry(1,0),litterGeometry=new T.SphereGeometry(1,5,3),pebbleMaterial=new T.MeshLambertMaterial({color:0xffffff}),litterMaterial=new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide}),rootMaterial=new T.MeshLambertMaterial({color:0x85745a});
export function naturalTrailMaterial(){
  if(material)return material;
  const n=256,data=new Uint8Array(n*n*4),bumps=new Uint8Array(n*n);let seed=9113;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const u=x/(n-1),v=y/(n-1),wobble=Math.sin(v*22)*.025+Math.sin(v*53)*.018,edge=T.MathUtils.smoothstep(.5-Math.abs(u-.5+wobble),0,.18),noise=rand(),patch=Math.sin(x*.055+Math.sin(y*.043)*2)*Math.sin(y*.071),tone=.90+noise*.18+patch*.055,i=(y*n+x)*4;
    data[i]=(161+patch*10)*tone;data[i+1]=(132+patch*9)*tone;data[i+2]=(91+patch*8)*tone;data[i+3]=255*edge*(noise<.025?.15:1);bumps[y*n+x]=95+noise*90+patch*12;
  }
  const tex=new T.DataTexture(data,n,n,T.RGBAFormat);tex.colorSpace=T.SRGBColorSpace;tex.wrapT=T.RepeatWrapping;tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.needsUpdate=true;
  const bump=new T.DataTexture(bumps,n,n,T.RedFormat);bump.wrapT=T.RepeatWrapping;bump.magFilter=T.LinearFilter;bump.needsUpdate=true;
  material=new T.MeshStandardMaterial({map:tex,bumpMap:bump,bumpScale:.025,roughness:1,metalness:0,transparent:true,alphaTest:.055,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});return material;
}
function addTrailDetails(parent,curve,width){
  const length=curve.getLength(),count=Math.floor(length*.75),leaves=Math.floor(length*1.3),temp=new T.Object3D();
  const pebbles=new T.InstancedMesh(pebbleGeometry,pebbleMaterial,count),litter=new T.InstancedMesh(litterGeometry,litterMaterial,leaves);pebbles.userData.sharedTrailGeometry=litter.userData.sharedTrailGeometry=true;
  for(const [mesh,n,leaf] of [[pebbles,count,false],[litter,leaves,true]]){
    for(let i=0;i<n;i++){
      const t=(i+.2+hash(i+Math.floor(length)*43)*.7)/n,p=curve.getPoint(t),tan=curve.getTangent(t),side=new T.Vector3(-tan.z,0,tan.x).normalize(),offset=(hash(i*13+7)-.5)*width*.84,x=p.x+side.x*offset,z=p.z+side.z*offset,s=leaf?.035+hash(i+8)*.045:.025+hash(i+8)*.055;
      temp.position.set(x,terrainHeight(x,z)+.088,z);temp.rotation.set(leaf?-.1:hash(i)*.7,hash(i+2)*6,hash(i+9)*.3);temp.scale.set(s,leaf?s*.10:s*.42,leaf?s*1.8:s*.85);temp.updateMatrix();mesh.setMatrixAt(i,temp.matrix);mesh.setColorAt(i,new T.Color(leaf?[0xb49b68,0xd3b28b,0x8f946b][i%3]:[0x9e9b85,0xa8a58c,0x897e68][i%3]));
    }mesh.receiveShadow=true;mesh.computeBoundingSphere();parent.add(mesh);
  }
  for(let i=0;i<Math.floor(length/12);i++){
    const t=(i+.5)/Math.max(1,Math.floor(length/12)),p=curve.getPoint(t),tan=curve.getTangent(t),side=new T.Vector3(-tan.z,0,tan.x).normalize(),points=[];
    for(let j=0;j<7;j++){const u=j/6,off=(u-.5)*width*.95,x=p.x+side.x*off+tan.x*Math.sin(u*7)*.09,z=p.z+side.z*off+tan.z*Math.sin(u*7)*.09;points.push(new T.Vector3(x,terrainHeight(x,z)+.07+Math.sin(u*Math.PI)*.024,z));}
    const root=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),12,.014+hash(i)*.012,5,false),rootMaterial);root.receiveShadow=true;parent.add(root);
  }
}
export function trailRibbon(curve,width=TRAIL_WIDTH,steps=120){
  const positions=[],uv=[],indices=[];let length=0,previous=null;
  for(let i=0;i<=steps;i++){
    const t=i/steps,p=curve.getPoint(t),tangent=curve.getTangent(t),side=new T.Vector3(-tangent.z,0,tangent.x).normalize();if(previous)length+=p.distanceTo(previous);previous=p;
    for(let j=0;j<=10;j++){const s=j/10,offset=(s-.5)*width*(1+.12*Math.sin(p.x*.57+p.z*.33)+.06*Math.sin(p.x*1.19-p.z*.51));const x=p.x+side.x*offset,z=p.z+side.z*offset;positions.push(x,terrainHeight(x,z)+.074+.012*Math.abs(s*2-1)**2,z);uv.push(s,(p.x+p.z)/3.7);if(i<steps&&j<10){const a=i*11+j;indices.push(a,a+1,a+11,a+1,a+12,a+11);}}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const mesh=new T.Mesh(g,naturalTrailMaterial());mesh.name='Narrow worn grass path';mesh.receiveShadow=true;mesh.renderOrder=1;addTrailDetails(mesh,curve,width);return mesh;
}
export function addWildernessTrails(root,ox,oz,size){
  for(const horizontal of [true,false]){
    if(Math.abs(horizontal?oz:ox)>size/2+3)continue;
    const start=(horizontal?ox:oz)-size/2,end=start+size;
    // Leave the cottage garden's center to its small hand-shaped paths.
    for(const [lo,hi] of [[start,Math.min(end,-30)],[Math.max(start,30),end]]){
      if(hi<=lo)continue;const points=[];for(let i=0;i<=32;i++){const t=T.MathUtils.lerp(lo,hi,i/32),a=trailLateral(t);points.push(new T.Vector3(horizontal?t:a,0,horizontal?a:t));}
      root.add(trailRibbon(new T.CatmullRomCurve3(points),TRAIL_WIDTH,Math.max(24,Math.ceil(hi-lo)*2)));
    }
  }
}
