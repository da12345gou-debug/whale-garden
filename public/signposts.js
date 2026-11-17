import * as T from './assets/three.module.js';
import {random} from './world.js';

// A sign is a solid timber object. Lettering is part of its wood material,
// including the shallow carved recess, rather than an unlit floating label.
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function tex(c){const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
function woodMaps(w,h,seed,vertical=false){
 const color=canvas(w,h),relief=canvas(w,h),ctx=color.getContext('2d'),bump=relief.getContext('2d'),pixels=ctx.createImageData(w,h),depth=bump.createImageData(w,h),r=random(seed);
 const knotX=w*.24,knotY=h*.68;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const along=vertical?y:x,across=vertical?x:y,dx=(x-knotX)/(w*.095),dy=(y-knotY)/(h*.20),knot=Math.exp(-(dx*dx+dy*dy)*.65),bend=Math.sin(along*.019)*2.1+Math.sin(along*.006)*4+knot*17;
  const grain=Math.sin((across+bend)*.31)*.55+Math.sin((across+bend)*1.29)*.22+Math.sin(across*.067+along*.002)*.45,noise=(r()-.5)*7,shade=grain*12+noise-knot*16,edge=Math.pow(Math.abs(y/h-.5)*2,8)*6,index=(y*w+x)*4;
  pixels.data[index]=153+shade+edge;pixels.data[index+1]=111+shade*.82+edge;pixels.data[index+2]=72+shade*.62+edge;pixels.data[index+3]=255;
  const value=143+grain*29+noise;depth.data[index]=depth.data[index+1]=depth.data[index+2]=value;depth.data[index+3]=255;
 }
 ctx.putImageData(pixels,0,0);bump.putImageData(depth,0,0);
 return{color,relief};
}
function paintLettering(maps,destination,direction){
 const ctx=maps.color.getContext('2d'),cut=maps.relief.getContext('2d'),w=maps.color.width,h=maps.color.height;
 const draw=(c,fill,dy=0)=>{c.fillStyle=fill;c.textAlign='center';c.textBaseline='middle';c.font='bold 118px "KaiTi","STKaiti","SimSun",serif';const chars=[...destination],spacing=129,total=(chars.length-1)*spacing;chars.forEach((ch,i)=>c.fillText(ch,w*.49-total/2+i*spacing,h*.53+dy));c.font='54px "KaiTi","STKaiti","SimSun",serif';c.fillText(direction,107,h*.53+dy);c.lineCap='round';c.lineJoin='round';c.strokeStyle=fill;c.lineWidth=12;c.beginPath();c.moveTo(897,h*.72+dy);c.lineTo(897,h*.31+dy);c.moveTo(867,h*.44+dy);c.lineTo(897,h*.31+dy);c.lineTo(927,h*.44+dy);c.stroke();};
 draw(ctx,'rgba(67,45,29,.85)',3);draw(ctx,'#e7d5b0');draw(cut,'#343434');
 // A few fine grain scars cross the old paint without making it illegible.
 const r=random(19);ctx.save();ctx.strokeStyle='#97734e';ctx.globalAlpha=.17;ctx.lineWidth=.8;for(let i=0;i<16;i++){const y=h*.25+r()*h*.48,x=w*.14+r()*w*.70;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+12+r()*35,y-.6);ctx.stroke();}ctx.restore();
}
function boardGeometry(width,height,depth){
 const x=width/2,y=height/2,s=new T.Shape();s.moveTo(-x+.045,-y+.015);s.lineTo(-x-.009,-y+.085);s.lineTo(-x+.015,y-.055);s.lineTo(-x+.065,y+.009);s.lineTo(-.30,y-.004);s.lineTo(-.285,y-.018);s.lineTo(-.25,y+.002);s.lineTo(x-.075,y-.012);s.lineTo(x+.013,y-.065);s.lineTo(x-.002,-y+.048);s.lineTo(x-.065,-y-.006);s.lineTo(.49,-y+.006);s.lineTo(.465,-y+.020);s.lineTo(.43,-y+.005);s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.012,bevelThickness:.009,bevelSegments:3,curveSegments:1});
 const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;g.clearGroups();let last=-1,start=0;
 for(let i=0;i<p.count;i+=3){const z=(n.getZ(i)+n.getZ(i+1)+n.getZ(i+2))/3,material=z>.9?0:z<-.9?1:2;if(material!==last){if(last>=0)g.addGroup(start,i-start,last);start=i;last=material;}if(Math.abs(z)>.9)for(let j=0;j<3;j++)uv.setXY(i+j,(p.getX(i+j)+x)/width,(p.getY(i+j)+y)/height);}
 g.addGroup(start,p.count-start,last);return g;
}
function addMesh(root,geometry,material,position,rotation){const o=new T.Mesh(geometry,material);o.position.set(...position);if(rotation)o.rotation.set(...rotation);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
function bar(root,a,b,radius,material){const d=new T.Vector3(...b).sub(new T.Vector3(...a)),o=addMesh(root,new T.CylinderGeometry(radius*.85,radius,d.length(),8),material,[0,0,0]);o.position.copy(new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}

export function createTrailSignpost({destination,direction,seed=1}){
 const root=new T.Group();root.name=`木质路牌 · ${destination}`;const r=random(seed),hasCanvas=typeof document!=='undefined';
 const blank=hasCanvas?woodMaps(1024,256,seed):null,label=hasCanvas?woodMaps(1024,256,seed):null,postMap=hasCanvas?woodMaps(256,1024,seed+9,true):null;if(label)paintLettering(label,destination,direction);
 const face=new T.MeshStandardMaterial({color:0xffffff,roughness:.90,map:label?tex(label.color):null,bumpMap:label?tex(label.relief):null,bumpScale:.008});
 const wood=new T.MeshStandardMaterial({color:0xffffff,roughness:.94,map:blank?tex(blank.color):null,bumpMap:blank?tex(blank.relief):null,bumpScale:.009});
 const edge=new T.MeshStandardMaterial({color:0x9a7049,roughness:.97});
 const postMaterial=new T.MeshStandardMaterial({color:0xffffff,roughness:.97,map:postMap?tex(postMap.color):null,bumpMap:postMap?tex(postMap.relief):null,bumpScale:.012,vertexColors:true});
 const iron=new T.MeshStandardMaterial({color:0x635950,metalness:.22,roughness:.85}),rust=new T.MeshStandardMaterial({color:0x846d53,metalness:.12,roughness:.91});
 const timber=new T.Group();timber.rotation.z=(r()-.5)*.035;root.add(timber);
 const postGeo=new T.CylinderGeometry(.089,.118,2.14,10,8),p=postGeo.attributes.position,colors=[];
 for(let i=0;i<p.count;i++){const y=p.getY(i),a=Math.atan2(p.getZ(i),p.getX(i)),jitter=.004*Math.sin(a*3+y*6);p.setX(i,p.getX(i)+Math.cos(a)*jitter);p.setZ(i,p.getZ(i)+Math.sin(a)*jitter);if(y>1.06)p.setY(i,y+.011*Math.sin(a*2+.5));const color=new T.Color(0xffffff).lerp(new T.Color(0x748569),T.MathUtils.clamp((-.62-y)*.8,0,.28));colors.push(color.r,color.g,color.b);}
 postGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));postGeo.computeVertexNormals();addMesh(timber,postGeo,postMaterial,[0,1.015,-.04]);
 const width=1.96,height=.46,depth=.125,board=addMesh(timber,boardGeometry(width,height,depth),[face,wood,edge],[0,1.77,.035]);board.rotation.z=(r()-.5)*.026;
 // Two back battens and a diagonal timber brace physically carry the plank.
 for(const x of [-.32,.32])addMesh(timber,new T.BoxGeometry(.09,.34,.075),wood,[x,1.77,-.014]);
 bar(timber,[0,1.16,-.08],[.54,1.63,-.075],.038,wood);
 for(const y of [1.61,1.93])addMesh(timber,new T.TorusGeometry(.105,.012,5,12),iron,[0,y,-.04],[Math.PI/2,0,0]);
 for(const x of [-.70,.70]){
  const y=1.77+(x<0?.088:-.083),z=.176;
  addMesh(timber,new T.CylinderGeometry(.030,.030,.006,18),iron,[x,y,z],[Math.PI/2,0,0]);
  addMesh(timber,new T.CylinderGeometry(.020,.021,.014,6),rust,[x,y,z+.010],[Math.PI/2,0,.25]);
  addMesh(timber,new T.BoxGeometry(.021,.003,.002),iron,[x,y,z+.018],[0,0,.35]);
 }
 // The sawn top is visible in close-up, with annual rings instead of a blank cap.
 if(hasCanvas){const c=canvas(128,128),ctx=c.getContext('2d');ctx.fillStyle='#bc9463';ctx.fillRect(0,0,128,128);ctx.strokeStyle='#8f6a48';ctx.lineWidth=1.4;for(let i=8;i<70;i+=7){ctx.beginPath();ctx.ellipse(59,66,i,i*.91,.3,0,Math.PI*2);ctx.stroke();}addMesh(timber,new T.CircleGeometry(.085,10),new T.MeshStandardMaterial({map:tex(c),roughness:.97}),[0,2.091,-.04],[-Math.PI/2,0,0]);}
 const stoneMaterial=new T.MeshStandardMaterial({color:0x7c8e7b,roughness:1});
 for(const [x,z,s] of [[-.19,.06,.16],[.20,-.12,.12],[-.05,-.24,.10]]){const o=addMesh(root,new T.DodecahedronGeometry(s,1),stoneMaterial,[x,.025,z]);o.scale.set(1,.56,.85);o.rotation.y=r()*6;}
 const mossMaterial=new T.MeshStandardMaterial({color:0x708452,roughness:1});for(let i=0;i<5;i++){const a=i*2.4,o=addMesh(root,new T.SphereGeometry(.07,9,6),mossMaterial,[Math.cos(a)*.12,.012,Math.sin(a)*.12]);o.scale.set(1,.30,1.15);}
 root.userData={destination,direction,collisionRadius:.73,boardDepth:depth};return root;
}
