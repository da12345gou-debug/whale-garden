import * as T from './assets/three.module.js';
import {GLTFLoader} from './assets/GLTFLoader.js';
import {DRACOLoader} from './assets/DRACOLoader.js';
import {createCharacterMotion} from './character-motion.js';

const yawAxis=new T.Vector3(0,1,0),pitchAxis=new T.Vector3(1,0,0),rollAxis=new T.Vector3(0,0,1),offset=new T.Quaternion();
let characterEnvironment;
export function reflectionLight(){
  if(characterEnvironment)return characterEnvironment;
  const faces=Array.from({length:6},(_,i)=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
    const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,64);
    gradient.addColorStop(0,i===3?'#9ca7b4':'#e3efff');
    gradient.addColorStop(1,i===2?'#e3efff':'#adbcd0');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
    return canvas;
  });
  characterEnvironment=new T.CubeTexture(faces);
  characterEnvironment.colorSpace=T.SRGBColorSpace;
  characterEnvironment.needsUpdate=true;
  return characterEnvironment;
}

export function prepareCharacter(gltf,name,targetHeight,{environment=true}={}){
  const root=new T.Group(),visual=gltf.scene;
  root.name=name;
  root.add(visual);
  visual.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(visual),scale=targetHeight/(bounds.max.y-bounds.min.y);
  visual.scale.multiplyScalar(scale);
  visual.position.y=-bounds.min.y*scale;
  visual.traverse(o=>{
    if(o.userData.accessory==='Pink crossbody satchel')o.visible=false;
    if(o.isMesh){
    o.castShadow=true;o.receiveShadow=true;
    for(const material of Array.isArray(o.material)?o.material:[o.material]){
      if(environment){material.envMap=reflectionLight();material.envMapIntensity=.7;}
    }
  }});
  // Sample clips on a separate transform tree. Three caches constant keyframes;
  // modifying the same animated bones for inertia would otherwise freeze a
  // partially blended pose when the constant idle track is cached.
  const poseTarget=visual.clone(true),mixer=new T.AnimationMixer(poseTarget);
  const actions=Object.fromEntries(gltf.animations.filter(clip=>clip.name==='Idle'||clip.name==='Walk').map(clip=>{
    const action=mixer.clipAction(clip);
    action.play();
    action.setEffectiveWeight(0);
    return[clip.name,action];
  }));
  const girl=name==='白发女孩';
  const joints={head:visual.getObjectByName(girl?'Girl_Head':'Cat_Head'),torso:visual.getObjectByName(girl?'Girl_Spine':'Cat_Spine'),tail:girl?null:visual.getObjectByName('Cat_Tail')};
  const rest=Object.fromEntries(Object.entries(joints).filter(([,joint])=>joint).map(([key,joint])=>[key,joint.quaternion.clone()]));
  const poseNodes=[];visual.traverse(o=>{if(o.isBone||o.name.endsWith('_provided_rig'))poseNodes.push(o);});
  let skin;visual.traverse(o=>{if(o.isSkinnedMesh&&(!skin||o.geometry.attributes.position.count>skin.geometry.attributes.position.count))skin=o;});
  const soles=[];if(skin){const p=skin.geometry.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)<.026)soles.push(i);}
  const groundSamples=soles.filter((_,i)=>i%Math.max(1,Math.floor(soles.length/160))===0);
  root.userData={blender:true,source:girl?'女孩.fbx':'猫.fbx',visual,mixer,actions,joints,rest,weight:0,runWeight:0,motion:createCharacterMotion(girl?'girl':'cat'),poseNodes,targetNodes:poseNodes.map(o=>poseTarget.getObjectByName(o.name)),previousPose:poseNodes.map(o=>o.quaternion.clone()),transition:null,transitionAge:1,wantsMove:false,skin,groundSamples,baseVisualY:visual.position.y,groundPoint:new T.Vector3()};
  return root;
}

export async function loadCharacters(){
  const draco=new DRACOLoader().setDecoderPath('./assets/draco/').setWorkerLimit(2);
  const loader=new GLTFLoader().setDRACOLoader(draco);
  try{
    const [girl,cat]=await Promise.all([
      loader.loadAsync('./assets/characters/girl-provided.glb'),
      loader.loadAsync('./assets/characters/cat-provided.glb')
    ]);
    if([girl,cat].some(g=>!['Idle','Walk'].every(name=>g.animations.some(clip=>clip.name===name))))throw new Error('Character motion library is incomplete.');
    return{girl:prepareCharacter(girl,'白发女孩',3.08),cat:prepareCharacter(cat,'白猫',1.38)};
  }finally{draco.dispose();}
}

function step(root,speed,dt,responsiveness,running){
  const d=root.userData;d.visual.position.y=d.baseVisualY;
  // Clear only the secondary motion before the mixer restores the authored pose.
  d.poseNodes.forEach((o,i)=>o.quaternion.copy(d.previousPose[i]));
  const state=d.motion.update(speed,running,dt,d.wantsMove);d.motionState=state;d.weight=Math.min(1,speed);d.runWeight=state.mode==='Run'?1:0;
  if(state.changed){d.transition=d.poseNodes.map(o=>({position:o.position.clone(),quaternion:o.quaternion.clone()}));d.transitionAge=0;}
  for(const [name,action] of Object.entries(d.actions)){
    action.setEffectiveWeight(name===state.mode?1:0);action.setEffectiveTimeScale(0);
    if(name===state.mode)action.time=state.stopping?Math.min(state.time,action.getClip().duration-.00001):state.phase*action.getClip().duration;
  }
  d.mixer.update(0);
  d.poseNodes.forEach((o,i)=>{const target=d.targetNodes[i];o.position.copy(target.position);o.quaternion.copy(target.quaternion);o.scale.copy(target.scale);});
  if(d.transition){
    d.transitionAge+=dt;const duration=state.mode==='Idle'?.36:.30,t=Math.min(1,d.transitionAge/duration),weight=t*t*(3-2*t);
    d.poseNodes.forEach((o,i)=>{o.position.lerpVectors(d.transition[i].position,o.position,weight);o.quaternion.slerpQuaternions(d.transition[i].quaternion,offset.copy(o.quaternion),weight);});
    if(t===1)d.transition=null;
  }
  d.poseNodes.forEach((o,i)=>{
    // The supplied paw IK can snap near a straight knee. Limit that turn during
    // walking as well as when settling, instead of passing the jolt to the skin.
    const limit=(state.mode==='Walk'?10:8)*dt,angle=d.previousPose[i].angleTo(o.quaternion);
    if(angle>limit)o.quaternion.slerpQuaternions(d.previousPose[i],offset.copy(o.quaternion),limit/angle);
    d.previousPose[i].copy(o.quaternion);
  });
  // Rotation blending may dip a sole between two valid planted poses. Check a
  // small sole sample after skinning and keep the blended feet above the floor.
  if(d.skin&&d.groundSamples.length){
    root.updateMatrixWorld(true);d.skin.skeleton.update();let low=Infinity;
    for(const i of d.groundSamples){const p=d.groundPoint.fromBufferAttribute(d.skin.geometry.attributes.position,i);d.skin.applyBoneTransform(i,p);p.applyMatrix4(d.skin.matrixWorld);low=Math.min(low,p.y-root.position.y);}
    if(low<0)d.visual.position.y+=Math.min(.18,-low);
  }
  return d;
}

export function animateReferenceGirl(root,t,speed=0,pet=0,dt=.016,running=speed>4){
  const d=step(root,speed,dt,9,running);
  if(d.joints.torso)d.joints.torso.quaternion.multiply(offset.setFromAxisAngle(pitchAxis,pet*.20));
  if(d.joints.head)d.joints.head.quaternion.multiply(offset.setFromAxisAngle(yawAxis,Math.sin(t*.7)*.035));
}

export function animateReferenceCat(root,t,speed=0,dt=.016,running=speed>4){
  const d=step(root,speed,dt,12,running);
  if(d.joints.tail)d.joints.tail.quaternion.multiply(offset.setFromAxisAngle(rollAxis,Math.sin(t*1.5)*.045*(1-d.weight)));
  if(d.joints.head)d.joints.head.quaternion.multiply(offset.setFromAxisAngle(yawAxis,Math.sin(t*.8)*.035));
}
