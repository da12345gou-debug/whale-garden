import * as T from './assets/three.module.js';
import {terrainHeight,grassCover,biomeWeights} from './biome-data.js';
import {mergeGeometries} from './assets/BufferGeometryUtils.js';
import {resolveMove} from './navigation.js';

const materials=new Map(),up=new T.Vector3(0,1,0),dummy=new T.Object3D();
function material(color,glow=0){const key=color+':'+glow;if(!materials.has(key))materials.set(key,new T.MeshLambertMaterial({color,side:T.DoubleSide,emissive:color,emissiveIntensity:glow}));return materials.get(key);}
const painted=new T.MeshPhongMaterial({vertexColors:true,side:T.DoubleSide,shininess:26,specular:0x6c9caa});
function add(parent,geometry,mat,pos=[0,0,0],scale=[1,1,1]){const o=new T.Mesh(geometry,mat);o.position.set(...pos);o.scale.set(...scale);o.receiveShadow=true;o.castShadow=true;parent.add(o);return o;}
function paint(g,colorFn){const p=g.attributes.position,c=[];for(let i=0;i<p.count;i++){const color=colorFn(p.getX(i),p.getY(i),p.getZ(i),i);c.push(color.r,color.g,color.b);}g.setAttribute('color',new T.Float32BufferAttribute(c,3));return g;}
function curve(points,radius,parent,color,segments=40){return add(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,radius,8,false),material(color));}
function seeded(seed){return()=>{seed=Math.imul(seed^seed>>>15,1|seed)+0x6d2b79f5|0;return(seed>>>0)/4294967296;};}
function batchVine(root){
  root.updateMatrixWorld(true);const inv=root.matrixWorld.clone().invert(),groups=[[],[]],originals=new Set();
  root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();originals.add(o.geometry);g.deleteAttribute('uv');g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld));const old=g.attributes.color,p=g.attributes.position,c=[],tint=o.material.color||new T.Color(0xffffff);for(let i=0;i<p.count;i++)c.push((old?old.getX(i):1)*tint.r,(old?old.getY(i):1)*tint.g,(old?old.getZ(i):1)*tint.b);g.setAttribute('color',new T.Float32BufferAttribute(c,3));groups[o.material.emissive?.getHex()&&o.material.emissiveIntensity>.1?1:0].push(g);});
  root.clear();groups.forEach((list,i)=>{if(!list.length)return;const g=mergeGeometries(list,false);g.computeBoundingSphere();add(root,g,i?new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide}):painted);list.forEach(p=>p.dispose());});originals.forEach(g=>g.dispose());root.userData.batched=true;return root;
}

export function giantLeafGeometry(length=4,width=1.35){
  const p=[],index=[],colors=[],rows=22,columns=10;
  for(let i=0;i<=rows;i++)for(let j=0;j<=columns;j++){
    const t=i/rows,s=j/columns*2-1,w=Math.sin(Math.PI*t)**.62*width*(1+.09*Math.sin(t*31));
    p.push(s*w,length*(.09*Math.sin(t*Math.PI)-.14*t*t)+.17*s*s,t*length);
    const c=new T.Color(0x008e81).lerp(new T.Color(0x55dcb1),.30+Math.abs(s)*.36+Math.sin(t*18)*.05);colors.push(c.r,c.g,c.b);
    const slit=t>.25&&t<.84&&Math.abs(s)>.58&&i%5===2;
    if(i<rows&&j<columns&&!slit){const a=i*(columns+1)+j;index.push(a,a+columns+1,a+1,a+1,a+columns+1,a+columns+2);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(index);g.computeVertexNormals();return g;
}
function addLeaf(parent,length,width,position,rotation){
  const root=new T.Group();root.position.set(...position);root.rotation.set(...rotation);parent.add(root);add(root,giantLeafGeometry(length,width),painted);
  curve([[0,.025,0],[0,length*.075,length*.48],[0,-length*.14+.05,length]],.018,root,0xb5e87e,20);
  for(let i=1;i<=6;i++)for(const side of [-1,1]){
    const t=i/8,w=Math.sin(Math.PI*t)**.62*width*.92;curve([[0,length*(.09*Math.sin(t*Math.PI)-.14*t*t)+.035,t*length],[side*w*.6,.08,t*length+.10],[side*w,.12,t*length+.23]],.008,root,0x8edba2,10);
  }
  return root;
}

const themes=[{top:0xff319d,middle:0xdf2387,rim:0xffdfb4,gill:0xf6c0ed},{top:0x00d8ed,middle:0x009cda,rim:0xb8f1d5,gill:0xaba5ee},{top:0x9250ff,middle:0xea3fc9,rim:0xffc6dd,gill:0xc7dfff}];
export function createGiantMushroom({height=8,radius=4,theme=0,seed=13}={}){
  const root=new T.Group();root.name='Giant jewel mushroom';root.userData.fantasyKind='mushroom';const r=seeded(seed),palette=themes[theme%3],positions=[],indices=[],colors=[],rings=26,segments=96;
  const capHeight=t=>height+radius*.40*Math.cos(t*Math.PI*.5)**.9+.10*Math.sin(t*12)*(t*t);
  for(let i=0;i<=rings;i++)for(let j=0;j<=segments;j++){
    const t=i/rings,a=j/segments*Math.PI*2,rr=radius*t*(1+.025*Math.sin(a*7)+.018*Math.sin(a*13));positions.push(Math.cos(a)*rr,capHeight(t)+Math.sin(a*8)*.055*t*t,Math.sin(a)*rr);
    const color=new T.Color(palette.top).lerp(new T.Color(palette.middle),t*.45).lerp(new T.Color(palette.rim),T.MathUtils.smoothstep(t,.82,1));color.multiplyScalar(.94+.08*Math.sin(a*16+t*11));colors.push(color.r,color.g,color.b);
    if(i<rings&&j<segments){const n=i*(segments+1)+j;indices.push(n,n+1,n+segments+1,n+1,n+segments+2,n+segments+1);}
  }
  const cap=new T.BufferGeometry();cap.setAttribute('position',new T.Float32BufferAttribute(positions,3));cap.setAttribute('color',new T.Float32BufferAttribute(colors,3));cap.setIndex(indices);cap.computeVertexNormals();add(root,cap,painted);
  const stem=new T.CylinderGeometry(radius*.13,radius*.21,height,28,22),sp=stem.attributes.position;
  for(let i=0;i<sp.count;i++){const t=(sp.getY(i)+height/2)/height;sp.setX(i,sp.getX(i)+Math.sin(t*Math.PI)*.36);sp.setZ(i,sp.getZ(i)+Math.sin(t*5)*.15);}
  stem.translate(0,height/2,0);paint(stem,(x,y,z)=>new T.Color(0x379ca0).lerp(new T.Color(0xb8eacc),y/height).multiplyScalar(.92+.08*Math.sin(Math.atan2(z,x)*18)));stem.computeVertexNormals();add(root,stem,painted);
  const gills=[];
  for(let i=0;i<64;i++){
    const a=i/64*Math.PI*2,points=[];for(let j=0;j<=8;j++){const t=.15+j/8*.84;points.push(new T.Vector3(Math.cos(a)*radius*t,height-.12-radius*.17*(1-t),Math.sin(a)*radius*t));}
    gills.push(new T.TubeGeometry(new T.CatmullRomCurve3(points),12,.026,4,false));
  }
  add(root,mergeGeometries(gills),material(palette.gill,.24));for(const g of gills)g.dispose();
  const dots=new T.InstancedMesh(new T.SphereGeometry(1,10,6),material(0xfff5d9,.08),92);
  for(let i=0;i<92;i++){
    const a=r()*Math.PI*2,t=.13+Math.sqrt(r())*.72,size=(.022+r()*.030)*radius;dummy.position.set(Math.cos(a)*radius*t,capHeight(t)+.025,Math.sin(a)*radius*t);dummy.quaternion.setFromUnitVectors(up,new T.Vector3(Math.cos(a)*t*.65,1,Math.sin(a)*t*.65).normalize());dummy.scale.set(size,.035+size*.12,size*.76);dummy.updateMatrix();dots.setMatrixAt(i,dummy.matrix);
  }
  dots.castShadow=true;root.add(dots);
  const rim=add(root,new T.TorusGeometry(radius*.99,.045,6,96),material(palette.rim,.18),[0,height,0]);rim.rotation.x=Math.PI/2;
  for(let i=0;i<4;i++){const a=i*2.4;curve([[0,.3,0],[Math.cos(a)*1,.2,Math.sin(a)*1],[Math.cos(a)*1.6,.04,Math.sin(a)*1.6]],.10,root,0x23a79a,14);}
  return root;
}

function rafflesiaHeight(t,s){return .95+.30*Math.sin(t*Math.PI)+.35*t*t*t+.40*s*s*Math.sin(t*Math.PI)+Math.sin(t*35+s*7)*.025;}
function rafflesiaPetal(){
  const p=[],c=[],indices=[],rows=28,columns=16;
  for(let i=0;i<=rows;i++)for(let j=0;j<=columns;j++){
    const t=i/rows,s=j/columns*2-1,w=Math.sin(Math.PI*t)**.55*1.52,x=w*s,z=.65+t*3.65,y=rafflesiaHeight(t,s);
    p.push(x,y,z);const color=new T.Color(0xa43c76).lerp(new T.Color(0xff3c78),T.MathUtils.smoothstep(t,0,.65)).lerp(new T.Color(0xffb3bc),Math.abs(s)*.24);c.push(color.r,color.g,color.b);
    if(i<rows&&j<columns){const a=i*(columns+1)+j;indices.push(a,a+columns+1,a+1,a+1,a+columns+1,a+columns+2);}
  }
  const count=p.length/3,topIndices=indices.slice(),topPositions=p.slice(),topColors=c.slice();
  for(let i=0;i<count;i++){p.push(topPositions[i*3],topPositions[i*3+1]-.16,topPositions[i*3+2]);c.push(topColors[i*3]*.68,topColors[i*3+1]*.68,topColors[i*3+2]*.68);}
  for(let i=0;i<topIndices.length;i+=3)indices.push(topIndices[i]+count,topIndices[i+2]+count,topIndices[i+1]+count);
  const edge=(a,b)=>indices.push(a,b,a+count,b,b+count,a+count);
  for(let i=0;i<rows;i++){edge(i*(columns+1),(i+1)*(columns+1));edge(i*(columns+1)+columns,(i+1)*(columns+1)+columns);}
  for(let j=0;j<columns;j++){edge(j,j+1);edge(rows*(columns+1)+j,rows*(columns+1)+j+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function createGiantRafflesia({scale=1,seed=2}={}){
  const root=new T.Group();root.name='Giant coral Rafflesia';root.userData.fantasyKind='rafflesia';root.scale.set(scale,scale*1.8,scale);const r=seeded(seed),petal=rafflesiaPetal();
  const calyx=new T.LatheGeometry([[1.35,0],[1.30,.25],[1.02,.65],[.91,1.12]].map(p=>new T.Vector2(...p)),36);
  paint(calyx,(x,y,z)=>new T.Color(0x475a62).lerp(new T.Color(0x9e3d70),y));add(root,calyx,painted);
  for(let i=0;i<5;i++){
    const group=new T.Group();group.rotation.y=i*Math.PI*2/5;root.add(group);add(group,petal.clone(),painted);
    const dots=new T.InstancedMesh(new T.SphereGeometry(1,8,5),material(0xffe1ba),76);
    for(let j=0;j<76;j++){const t=.12+r()*.77,s=(r()-.5)*1.70,w=Math.sin(t*Math.PI)**.55*1.52,x=w*s,y=rafflesiaHeight(t,s)+.055,z=.65+t*3.65;dummy.position.set(x,y,z);dummy.rotation.set(0,r()*6,0);const size=.06+r()*.09;dummy.scale.set(size,.045,size*(.7+r()*.4));dummy.updateMatrix();dots.setMatrixAt(j,dummy.matrix);}dots.castShadow=true;group.add(dots);
  }
  petal.dispose();
  const profile=[[.75,.30],[.9,.50],[1.15,1.20],[1.42,1.55],[1.57,1.50],[1.61,1.32],[1.40,1.14],[1.05,.18]].map(p=>new T.Vector2(...p));
  const bowl=new T.LatheGeometry(profile,72);paint(bowl,(x,y,z)=>new T.Color(0x912561).lerp(new T.Color(0xff5591),T.MathUtils.smoothstep(y,.35,1.65)));add(root,bowl,painted);
  const ring=add(root,new T.TorusGeometry(1.43,.12,12,72),material(0xffc6b2),[0,1.50,0]);ring.rotation.x=Math.PI/2;
  add(root,new T.CylinderGeometry(.95,.95,.12,48),material(0x633465),[0,.26,0]);
  for(let i=0;i<44;i++){const a=i*2.399,rr=Math.sqrt(i/44)*.88,h=.34+r()*.4;add(root,new T.ConeGeometry(.065,h,7),material(i%3?0xffc38c:0xffe8aa,.10),[Math.cos(a)*rr,.32+h/2,Math.sin(a)*rr]);}
  for(let i=0;i<7;i++){const a=i*2.399;addLeaf(root,2.7,1.0,[Math.cos(a)*.6,.10,Math.sin(a)*.6],[-.08,a,0]);}
  return root;
}

export function createVineArch({width=58,height=17,thickness=1.1,seed=8}={}){
  const root=new T.Group();root.name='Giant living vine arch';root.userData.fantasyKind='vine';const r=seeded(seed);
  const points=[[-width/2,0,0],[-width*.43,height*.40,-2],[-width*.30,height*.86,0],[-width*.10,height,-1],[width*.14,height*1.02,1],[width*.35,height*.83,0],[width*.48,height*.34,-1],[width/2,0,0]],path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
  const vine=new T.TubeGeometry(path,160,thickness,12,false);paint(vine,(x,y,z)=>new T.Color(0x174b60).lerp(new T.Color(0x00af8b),.3+y/height*.4).lerp(new T.Color(0x94df8d),Math.max(0,Math.sin(x*1.7+z*4))*.12));add(root,vine,painted);
  for(const side of [-1,1]){
    const twist=[];for(let i=0;i<=190;i++){const t=i/190,p=path.getPoint(t),a=t*55+side;twist.push(p.add(new T.Vector3(Math.cos(a)*thickness*.95,Math.sin(a)*thickness*.9,Math.sin(a+1)*thickness*.95)));}
    add(root,new T.TubeGeometry(new T.CatmullRomCurve3(twist),200,thickness*.24,7,false),material(side===1?0x44c18c:0x387d87));
  }
  for(let i=0;i<20;i++){
    const t=.10+i/19*.80,p=path.getPoint(t),side=i%2?1:-1;
    addLeaf(root,3.5+r()*2.1,1.4+r()*.7,[p.x,p.y+.10,p.z],[.55+r()*.5,side*(.45+r()*.8)+Math.PI*(i%3===0),side*.1]);
    if(i%4===0){
      const drop=3+r()*2;curve([[p.x,p.y,p.z],[p.x+.4,p.y-drop*.6,p.z+.3],[p.x+.12,p.y-drop,p.z+.5]],.045,root,0x7edca4,24);
      for(let j=0;j<5;j++){const b=new T.Group();b.position.set(p.x+(j%2?.26:-.10),p.y-drop+j*.55,p.z+.50);root.add(b);const corolla=new T.ConeGeometry(.3,.54,9,1,true);const bell=add(b,corolla,material(j%2?0xff9bcc:0xbaabf6,.16));bell.rotation.z=Math.PI;add(b,new T.SphereGeometry(.09,8,6),material(0xffe18c,.2),[0,-.22,0]);}
    }
  }
  for(const side of [-1,1])for(let i=0;i<4;i++)curve([[side*width/2,.8,0],[side*(width/2+.4),.4,(i-1.5)*.6],[side*(width/2+2.2),.02,(i-1.5)*1.2]],.20,root,0x139e84,22);
  return batchVine(root);
}

export function createColossalVine({height=44,seed=4}={}){
  const root=new T.Group();root.name='Colossal braided forest vine';root.userData.fantasyKind='vine';root.userData.colossal=true;const r=seeded(seed),path=new T.CatmullRomCurve3([[0,0,0],[2,height*.22,-1],[-1,height*.48,2],[3,height*.76,0],[1,height,-2]].map(p=>new T.Vector3(...p)));
  const stem=new T.TubeGeometry(path,140,1.65,12,false);paint(stem,(x,y,z)=>new T.Color(0x00645d).lerp(new T.Color(0x36db84),.25+.25*Math.sin(y*.6+Math.atan2(z,x)*3)));add(root,stem,painted);
  for(let j=0;j<3;j++){const points=[];for(let i=0;i<=150;i++){const t=i/150,p=path.getPoint(t),a=t*25+j*Math.PI*2/3;points.push(p.add(new T.Vector3(Math.cos(a)*1.65,Math.sin(a)*.4,Math.sin(a)*1.65)));}add(root,new T.TubeGeometry(new T.CatmullRomCurve3(points),160,.38,8,false),material(j%2?0x00b57e:0x76dd8b));}
  for(let i=0;i<9;i++){
    const t=.18+i*.085,p=path.getPoint(t),a=i*2.399;addLeaf(root,7.5+r()*3.5,2.6+r()*1.3,[p.x,p.y,p.z],[.25+r()*.45,a,0]);
    if(i%3===1){const points=[];for(let j=0;j<=80;j++){const u=j/80,rr=4*(1-u)+.3,aa=u*Math.PI*5;points.push([p.x+Math.cos(a)*4+Math.cos(aa)*rr,p.y-2-u*3,p.z+Math.sin(a)*4+Math.sin(aa)*rr]);}curve(points,.15,root,0x71e4a0,90);}
  }
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2;curve([[0,1.5,0],[Math.cos(a)*3,.5,Math.sin(a)*3],[Math.cos(a)*7,.05,Math.sin(a)*7]],.28,root,0x007e67,26);}
  return batchVine(root);
}

export function addEnchantedLandmarks(scene,colliders){
  const root=new T.Group();root.name='The reference-colour giant garden';scene.add(root);
  for(const [x,z,height,radius,theme] of [[-39,1,8.3,4.4,0],[18,0,10,4.8,1],[-31,-35,11.5,5.5,2],[-26,-35,5.2,2.7,1],[28,25,10.8,5,0],[-31,24,7,3.6,2],[30,-35,8.8,4.6,1]]){
    const m=createGiantMushroom({height,radius,theme,seed:Math.round(x*10-z)});m.position.set(x,terrainHeight(x,z),z);root.add(m);colliders.push({x,z,r:radius*.24});
  }
  // Overlapping crowns form an actual walkable grove around the garden path.
  for(const [i,p] of [[-9,8,15,5.8],[-18,10,18,6.2],[-25,4,22,6.8],[-37,-11,16,5.4],[-35,-14,25,7.2],[-38,-22,12,4.6],[-40,-23,20,6.2],[-37,-31,27,7.4],[-20,-40,17,5.6],[-33,-48,23,6.7],[-12,-52,20,6.2],[-26,-64,28,7.7],[23,-8,18,5.9],[32,-13,24,7.1],[37,-25,17,5.3],[24,-32,21,6.1],[34,-46,26,7.0],[20,-54,16,5.2]].entries()){
    const [x,z,height,radius]=p,m=createGiantMushroom({height,radius,theme:i%3,seed:1000+i*37});m.userData.grove=true;m.position.set(x,terrainHeight(x,z),z);root.add(m);colliders.push({x,z,r:radius*.24});
  }
  for(const [x,z,scale] of [[17,14,1.05],[10,-13,1.30],[-28,4,1.27],[-37,-40,.95]]){const p=createGiantRafflesia({scale,seed:x*x+17});p.position.set(x,terrainHeight(x,z),z);p.rotation.y=.7;root.add(p);colliders.push({x,z,r:4.4*scale,height:4.1*scale});}
  for(const [x,z,scale] of [[5,5,1.45],[-33,10,1.55],[17,-31,1.65],[-31,-51,1.8]]){const p=createGiantRafflesia({scale,seed:x*x+z*z});p.userData.landmark=true;p.position.set(x,terrainHeight(x,z),z);p.rotation.y=.35;root.add(p);colliders.push({x,z,r:4.4*scale,height:4.1*scale});}
  const arch=createVineArch();arch.position.set(0,terrainHeight(0,-13),-13);root.add(arch);for(const x of [-29,29])colliders.push({x,z:-13,r:1.4});
  const arch2=createVineArch({width:38,height:13,seed:91});arch2.position.set(-7,terrainHeight(-7,-62),-62);arch2.rotation.y=.36;root.add(arch2);for(const x of [-25,11])colliders.push({x,z:-62,r:1.4});
  const gallery=createVineArch({width:66,height:27,thickness:1.8,seed:171});gallery.position.set(-3,terrainHeight(-3,-48),-48);root.add(gallery);for(const x of [-36,30])colliders.push({x,z:-48,r:2.4});
  for(const [x,z,height,seed] of [[-24,-38,42,71],[31,-45,48,191],[-9,-70,39,251],[18,-82,53,501]]){const vine=createColossalVine({height,seed});vine.position.set(x,terrainHeight(x,z),z);root.add(vine);colliders.push({x,z,r:3.0});}
  return root;
}
export function addWildGiant(root,colliders,x,z,seed){
  if(Math.hypot(x,z)<88||grassCover(x,z)<.55)return;
  const w=biomeWeights(x,z),r=seeded(seed);
  const m=createGiantMushroom({height:6+r()*7,radius:3+r()*2.5,theme:Math.floor(r()*3),seed});m.position.set(x,terrainHeight(x,z),z);root.add(m);colliders.push({x,z,r:1.2});
  if(w.rainforest>.4){const flower=createGiantRafflesia({scale:1.1+r()*.4,seed});flower.position.set(x+9,terrainHeight(x+9,z+4),z+4);root.add(flower);colliders.push({x:x+9,z:z+4,r:5.2,height:6.2});}
}
export function placeForageOutsideSolids(items,colliders){
  for(const item of items){
    const p=resolveMove(item.position,0,0,colliders,.90),delta=new T.Vector3(p.x,terrainHeight(p.x,p.z),p.z).sub(item.position);
    if(delta.lengthSq()<.000001)continue;item.position.add(delta);item.mesh.position.add(delta);item.ring.position.add(delta);item.sparkle.position.add(delta);
  }
}
