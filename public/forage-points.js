import * as T from './assets/three.module.js';
import {terrainHeight} from './biome-data.js';
import {resolveMove} from './navigation.js';
export const FORAGE_GAP=9;
export function forageClearance(item){
  if(item.modelFootprintRadius===undefined){const box=new T.Box3().setFromObject(item.mesh);item.modelFootprintRadius=Math.max(box.max.x-box.min.x,box.max.z-box.min.z)*.5;}
  return Math.max(1.35,item.modelFootprintRadius+.40,item.spec.id==='rafflesia'?2.1:(item.spec.clearance??.65)+.60);
}

export function spaceForagePoints(items,colliders,{gap=FORAGE_GAP,bounds=null,minRadius=0,maxRadius=Infinity}={}){
  const accepted=[];
  for(const item of [...items]){
    const origin=item.position.clone();let chosen=null;
    for(let i=0;i<256;i++){
      const radius=i?1.8+Math.floor((i-1)/8)*1.7:0,angle=i*2.399963;
      const p=resolveMove({x:origin.x+Math.cos(angle)*radius,z:origin.z+Math.sin(angle)*radius},0,0,colliders,.95);
      if(bounds&&(p.x<bounds.minX||p.x>bounds.maxX||p.z<bounds.minZ||p.z>bounds.maxZ))continue;
      const distance=Math.hypot(p.x,p.z);if(distance<minRadius||distance>maxRadius)continue;
      if(colliders.some(c=>Math.hypot(p.x-c.x,p.z-c.z)<c.r+.94))continue;
      if(accepted.some(other=>Math.hypot(p.x-other.position.x,p.z-other.position.z)<gap))continue;
      chosen=p;break;
    }
    if(!chosen){item.mesh.removeFromParent();item.ring.removeFromParent();item.sparkle.removeFromParent();items.splice(items.indexOf(item),1);continue;}
    const delta=new T.Vector3(chosen.x,terrainHeight(chosen.x,chosen.z),chosen.z).sub(item.position);
    item.position.add(delta);for(const obj of [item.mesh,item.ring,item.sparkle])obj.position.add(delta);
    item.clearanceRadius=forageClearance(item);accepted.push(item);
  }
  return items;
}
const diamondGeometry=new T.OctahedronGeometry(.14),beamGeometry=new T.CylinderGeometry(.012,.012,.55,5),beaconMaterials=new Map(),ringMaterials=new Map();
function markerMaterial(poison,ring=false){const cache=ring?ringMaterials:beaconMaterials;if(!cache.has(poison))cache.set(poison,new T.MeshBasicMaterial({color:poison?0xd4b4ff:0xffed9e,transparent:ring,opacity:ring?.65:1,depthWrite:!ring,depthTest:!ring}));return cache.get(poison);}
export function decorateForagePoint(item){
  const parent=item.mesh.parent;
  for(const previous of [item.ring,item.sparkle]){previous.removeFromParent();previous.geometry?.dispose();previous.material?.dispose();}
  item.mesh.updateWorldMatrix(true,true);const box=new T.Box3().setFromObject(item.mesh);
  item.markerHeight=Math.max(2.05,box.max.y-item.position.y+.45);
  const radius=Math.max(1.02,Math.min(2.6,(item.modelFootprintRadius??.7)+.18));
  const g=new T.RingGeometry(radius*.86,radius,48);g.rotateX(-Math.PI/2);const p=g.attributes.position;
  for(let i=0;i<p.count;i++)p.setY(i,terrainHeight(item.position.x+p.getX(i),item.position.z+p.getZ(i))-item.position.y+.07);
  g.computeVertexNormals();const ring=new T.Mesh(g,markerMaterial(!!item.spec.poisonous,true));ring.position.copy(item.position);ring.renderOrder=8;parent.add(ring);
  const sparkle=new T.Group();sparkle.name='可采集 · '+item.spec.name;sparkle.position.copy(item.position).add(new T.Vector3(0,item.markerHeight,0));
  for(const [geometry,y] of [[diamondGeometry,0],[beamGeometry,-.43]]){const mesh=new T.Mesh(geometry,markerMaterial(!!item.spec.poisonous));mesh.position.y=y;mesh.userData.sharedForageGeometry=true;sparkle.add(mesh);}parent.add(sparkle);
  ring.visible=sparkle.visible=item.available;item.ring=ring;item.sparkle=sparkle;
}

// Only the closest few actual harvest points receive labels. Ornamental flower
// beds have no interaction, so their density can stay high without ambiguity.
export function createForageLabels(onCollect){
  const root=document.createElement('div');root.id='forage-labels';document.body.append(root);
  const entries=Array.from({length:3},()=>{const button=document.createElement('button');button.type='button';button.className='forage-label';button.hidden=true;root.append(button);const entry={button,item:null};button.addEventListener('click',e=>{e.stopPropagation();if(entry.item?.available)onCollect(entry.item);});return entry;});
  const point=new T.Vector3();
  return{update(items,player,camera,{visible=true,width=innerWidth,height=innerHeight}={}){
    if(!visible){entries.forEach(e=>{e.button.hidden=true;e.item=null;});return;}
    const candidates=[];
    for(const item of items){if(!item.available||!item.mesh.visible)continue;const distance=item.position.distanceTo(player);if(distance>14)continue;
      point.copy(item.position).add(new T.Vector3(0,(item.markerHeight??2.05)+.24,0)).project(camera);
      if(point.z<0||point.z>1||Math.abs(point.x)>.91||Math.abs(point.y)>.88)continue;
      candidates.push({item,distance,x:(point.x*.5+.5)*width,y:(-.5*point.y+.5)*height});
    }
    candidates.sort((a,b)=>a.distance-b.distance);const shown=[];
    for(const c of candidates){if(shown.some(s=>Math.abs(c.x-s.x)<128&&Math.abs(c.y-s.y)<55))continue;shown.push(c);if(shown.length===3)break;}
    entries.forEach((entry,i)=>{const c=shown[i];entry.button.hidden=!c;if(!c){entry.item=null;return;}if(entry.item!==c.item){entry.item=c.item;entry.button.innerHTML='<span>✦ 可采集'+(c.item.spec.poisonous?' · 标本':'')+'</span><strong>'+c.item.spec.name+'</strong>';entry.button.setAttribute('aria-label','采集 '+c.item.spec.name);entry.button.dataset.forage=c.item.id;entry.button.classList.toggle('poison',!!c.item.spec.poisonous);}entry.button.style.left=c.x+'px';entry.button.style.top=c.y+'px';entry.button.title=c.distance>2.35?'点击走近采集':'点击或按 E 采集';});
  }};
}
