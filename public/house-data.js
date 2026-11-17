export const COTTAGE_CENTER=Object.freeze({x:-13,z:-18});
export const COTTAGE_ENTRY=Object.freeze({x:-13,z:-7.2});
export const COTTAGE_DOOR=Object.freeze({x:-13,z:-12.65});
export const COTTAGE_APPROACH=Object.freeze({x:-13,z:-11.4});
export const COTTAGE_THRESHOLD=Object.freeze({x:-13,z:-14.5});
export const COTTAGE_LANDING=Object.freeze({x:-13,z:-6.0});
export const PORTAL_CLEAR_Z=COTTAGE_CENTER.z+4.4;
export const DOOR_OPEN_ANGLE=Math.PI*.49;
export function collisionBox(minX,maxX,minZ,maxZ,height=5.6){return{minX,maxX,minZ,maxZ,x:(minX+maxX)/2,z:(minZ+maxZ)/2,r:Math.hypot(maxX-minX,maxZ-minZ)/2,height};}
export const HOME_BOUNDS=Object.freeze({minX:-15.2,maxX:15.2,minZ:-13.2,maxZ:13.2});
export const HOME_SPAWN=Object.freeze({x:0,z:11.2});
export const HOME_WALLS=[
  {axis:'x',at:-16,lo:-14,hi:14,height:5.6},{axis:'x',at:16,lo:-14,hi:14,height:5.6},{axis:'z',at:-14,lo:-16,hi:16,height:5.6},
  {axis:'z',at:14,lo:-16,hi:-2.2,height:5.6},{axis:'z',at:14,lo:2.2,hi:16,height:5.6},
  {axis:'x',at:3.2,lo:-14,hi:-3.2,height:4.5},{axis:'z',at:-3.2,lo:3.2,hi:5.4,height:4.5},{axis:'z',at:-3.2,lo:8.4,hi:16,height:4.5},
  {axis:'x',at:9,lo:-3.1,hi:.2,height:4.2},{axis:'x',at:9,lo:3.2,hi:4.8,height:4.2},{axis:'z',at:4.8,lo:9,hi:16,height:4.2}
];
export const HOME_FURNITURE=[{x:10,z:-9,r:3},{x:13,z:-4.7,r:1.5},{x:-11,z:3,r:2.65},{x:-6.6,z:3,r:1.1},{x:0,z:-.8,r:3.05},{x:-9,z:-6.4,r:2.95},{x:-2.2,z:-12,r:1.2},{x:13,z:.2,r:2},{x:-14.9,z:3,r:1.4},{x:-12,z:10.8,r:1.6},{x:14.7,z:3.2,r:1.15},{x:14.8,z:9.5,r:1.3},{x:7,z:8.6,r:1.5},...[-11,-9,-7].map(x=>({x,z:-3.9,r:.6})),...[5.6,8.5,11.4].map(x=>({x,z:5.4,r:1.4}))];
export const HOME_INTERACTIONS=[
 {id:'exit',name:'木屋的大门',action:'去外面走走',x:0,z:12.5},
 {id:'kitchen',name:'田园大厨房',action:'选择食谱烹饪',x:-4.8,z:-6.4},
 {id:'cabinet',name:'四季采集收藏柜',action:'整理食材和标本',x:11.1,z:7.8},
 {id:'bed',name:'温暖的卧室',action:'休息一下',x:6.2,z:-6.5},
 {id:'bath',name:'暖暖的浴室',action:'洗洗手',x:10.6,z:2.1},
 {id:'living',name:'壁炉客厅',action:'在炉火旁歇歇',x:-7.5,z:7.5},
 {id:'study',name:'窗边的小书桌',action:'翻一页旅行手记',x:-9.4,z:10.5}
];
export function homeColliders(){const result=HOME_FURNITURE.map(c=>({...c}));for(const w of HOME_WALLS)result.push(w.axis==='x'?collisionBox(w.at-.13,w.at+.13,w.lo,w.hi,w.height):collisionBox(w.lo,w.hi,w.at-.13,w.at+.13,w.height));result.push(collisionBox(-14.9,-2.65,-13.5,-11.78,2),collisionBox(-15.72,-13.98,-12,-4,2));return result;}
export function cottageColliders(){
 const at=(a,b,c,d,h=8)=>collisionBox(COTTAGE_CENTER.x+a,COTTAGE_CENTER.x+b,COTTAGE_CENTER.z+c,COTTAGE_CENTER.z+d,h);
 // Exact wall envelope, leaving a 2.08-unit wide entrance vestibule.
 const out=[at(-10.32,-1.04,-5.28,5.49),at(1.04,10.32,-5.28,5.49),at(-1.04,1.04,-5.28,2.8),at(10.0,13.32,-3.65,4.22,6)];
 for(const x of [-3.12,3.12])out.push(at(x-.14,x+.14,5.3,8.12,2.85));
 out.push(at(-3.12,-1.8,7.94,8.22,2.85),at(1.8,3.12,7.94,8.22,2.85));
 for(const x of [-1.85,1.85])out.push(at(x-.10,x+.10,8.3,10.65,2.8));
 for(const x of [-3.12,3.12])for(const z of [5.30,8.08])out.push({x:COTTAGE_CENTER.x+x,z:COTTAGE_CENTER.z+z,r:.22,height:6});return out;
}
export function cottageDoorColliders(angle=0){const out=[];for(let i=0;i<=10;i++){const d=i/10*2.10;out.push({x:COTTAGE_CENTER.x-1.05+Math.cos(angle)*d,z:COTTAGE_CENTER.z+5.35-Math.sin(angle)*d,r:.14,height:5.3,doorLeaf:true});}return out;}
export function nearCottageEntrance(p){const x=p.x-COTTAGE_CENTER.x,z=p.z-COTTAGE_CENTER.z;return Math.abs(x)<4.5&&z>3.3&&z<14.5;}
export function inCottageFootprint(x,z,padding=0){const dx=x-COTTAGE_CENTER.x,dz=z-COTTAGE_CENTER.z;return(dx>-11.8-padding&&dx<14.3+padding&&dz>-6.5-padding&&dz<9+padding)||(Math.abs(dx)<2.3+padding&&dz>=9&&dz<11.6+padding);}
export function cottageWalkHeight(x,z){
  const dx=x-COTTAGE_CENTER.x,dz=z-COTTAGE_CENTER.z;
  if(Math.abs(dx)<1.75&&dz>=8.35&&dz<=10.85)return Math.max(0,Math.min(1.155,(10.85-dz)/2.5*1.155));
  if(Math.abs(dx)<1.0&&dz>=2.8&&dz<5.7)return 1.155+.125*Math.max(0,1-Math.abs(dz-5.4)/.3);
  if(Math.abs(dx)<3.35&&dz>=5&&dz<8.35)return 1.155;
  return 0;
}
