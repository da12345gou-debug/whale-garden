import * as T from './assets/three.module.js';

// The whale faces +X. Its spine bends vertically, with increasing tail motion.
export const SPINE_X=[3,-5,-12,-18,-22];
export function bindWhaleGeometry(geometry,part='body'){
 const p=geometry.attributes.position,indices=new Uint16Array(p.count*4),weights=new Float32Array(p.count*4);
 for(let i=0;i<p.count;i++){
  let a=0,b=0,w=0;
  if(part.startsWith('fin'))a=b=part==='fin-1'?5:6;
  else if(part==='tail'){a=4;b=p.getZ(i)<0?7:8;w=T.MathUtils.smoothstep(Math.abs(p.getZ(i)),1.6,7.5)*.78;}
  else{
   const x=p.getX(i);
   if(x<=SPINE_X.at(-1))a=b=4;
   else for(let k=0;k<SPINE_X.length-1;k++)if(x<SPINE_X[k]&&x>=SPINE_X[k+1]){a=k;b=k+1;w=(SPINE_X[k]-x)/(SPINE_X[k]-SPINE_X[k+1]);break;}
  }
  indices[i*4]=a;indices[i*4+1]=b;weights[i*4]=1-w;weights[i*4+1]=w;
 }
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
}
export function createWhaleRig(root){
 const bones=SPINE_X.map((x,i)=>{const b=new T.Bone();b.name=['spine-root','spine-mid','spine-rear','tail-stock','tail'][i];b.position.x=i?x-SPINE_X[i-1]:x;return b;});
 root.add(bones[0]);for(let i=1;i<5;i++)bones[i-1].add(bones[i]);
 for(const side of [-1,1]){const b=new T.Bone();b.name='fin'+side;b.position.set(0,-1,side*4);bones[0].add(b);bones.push(b);}
 for(const side of [-1,1]){const b=new T.Bone();b.name='fluke'+side;b.position.set(-2,.3,side*2);bones[4].add(b);bones.push(b);}
 root.updateMatrixWorld(true);const skeleton=new T.Skeleton(bones);root.userData.rig={bones,skeleton};root.userData.finLeft=bones[5];root.userData.finRight=bones[6];root.userData.tail=bones[4];return skeleton;
}
export function animateWhale(whale,time,{size=1,phase=0,turn=0}={}){
 const bones=whale.userData.rig.bones,beat=time*Math.PI*2/(5.4+size*1.6)+phase,amplitudes=[.014,.045,.085,.12,.16];
 // A delayed wave travels down the spine; the fluke tips follow the tail stock.
 for(let i=0;i<5;i++){const a=beat-i*.38;bones[i].rotation.z=amplitudes[i]*(Math.sin(a)+.08*Math.sin(a*2));}
 bones[5].rotation.x=.10*Math.sin(beat*.5-.7)+turn*.14;bones[6].rotation.x=-.10*Math.sin(beat*.5-.7)+turn*.14;
 bones[5].rotation.z=bones[6].rotation.z=.035*Math.sin(beat-.6);
 bones[7].rotation.z=bones[8].rotation.z=.10*Math.sin(beat-1.95);
 bones[7].rotation.x=.025*Math.sin(beat-1.8);bones[8].rotation.x=-bones[7].rotation.x;
 whale.userData.swimPhase=beat;
}
