import {COTTAGE_CENTER,COTTAGE_APPROACH,COTTAGE_THRESHOLD,COTTAGE_LANDING,PORTAL_CLEAR_Z,HOME_INTERACTIONS} from './house-data.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const messages={approach:'走上台阶，去门口…',opening:'正在打开木门…',entering:'从门洞走进去…','waiting-cat':'等白猫一起回家…',fading:'穿过木门…','exit-approach':'走向木屋大门…',exiting:'走出木门，慢慢下台阶…','exit-cat':'等白猫走下台阶…'};
export function createCottageJourney({navigate,stop,openDoor,transition,notice}){
 let phase='outside',serial=0;
 const go=(next,p)=>{phase=next;if(!navigate(p)){phase=next.startsWith('exit')?'inside':'outside';notice('门前暂时走不过去，先绕到台阶前。');return false;}return true;};
 function finishTransition(inside){phase='fading';stop();const turn=++serial;transition(inside,()=>{if(turn!==serial)return;if(inside)phase='inside';else go('exiting',COTTAGE_LANDING);});}
 return{
  get phase(){return phase;},get busy(){return !['outside','inside'].includes(phase);},get holding(){return ['opening','waiting-cat','fading','exit-cat'].includes(phase);},get message(){return messages[phase]||'';},
  reset(inside=false){serial++;phase=inside?'inside':'outside';},
  enter(position){if(phase!=='outside')return false;if(position&&Math.abs(position.x-COTTAGE_CENTER.x)<.45&&position.z<COTTAGE_APPROACH.z+.2&&position.z>COTTAGE_CENTER.z+3.3){phase='opening';stop();openDoor();return true;}notice(messages.approach);return go('approach',COTTAGE_APPROACH);},
  leave(){if(phase!=='inside')return false;return go('exit-approach',HOME_INTERACTIONS.find(p=>p.id==='exit'));},
  cancel(){if(phase==='approach'||phase==='exit-approach'){phase=phase==='approach'?'outside':'inside';stop();}},
  catTarget(girl){if(['approach','opening','entering','waiting-cat'].includes(phase))return{x:COTTAGE_CENTER.x,z:phase==='waiting-cat'?COTTAGE_THRESHOLD.z+.12:Math.max(COTTAGE_THRESHOLD.z+.12,girl.z+1.05)};if(['exiting','exit-cat'].includes(phase))return{x:COTTAGE_CENTER.x,z:girl.z-.9};return null;},
  update({girl,cat,speed,doorOpen,inHome}){
   if(phase==='outside'&&!inHome&&doorOpen>.95&&Math.abs(girl.x-COTTAGE_CENTER.x)<.45&&girl.z<PORTAL_CLEAR_Z&&girl.z>COTTAGE_CENTER.z+3.4)go('entering',COTTAGE_THRESHOLD);
   if(phase==='approach'&&distance(girl,COTTAGE_APPROACH)<.28&&speed<.15){phase='opening';stop();}
   if(phase==='opening'){openDoor();if(doorOpen>.98)go('entering',COTTAGE_THRESHOLD);}
   if(phase==='entering'&&distance(girl,COTTAGE_THRESHOLD)<.27&&speed<.15){phase='waiting-cat';stop();}
   if(phase==='waiting-cat'&&cat.z<PORTAL_CLEAR_Z&&Math.abs(cat.x-COTTAGE_CENTER.x)<.55)finishTransition(true);
   if(phase==='exit-approach'&&distance(girl,HOME_INTERACTIONS.find(p=>p.id==='exit'))<.28&&speed<.15)finishTransition(false);
   if(phase==='exiting'&&distance(girl,COTTAGE_LANDING)<.3&&speed<.15){phase='exit-cat';stop();}
   if(phase==='exit-cat'&&cat.z>COTTAGE_CENTER.z+10.65){phase='outside';notice('木门在身后轻轻合上。');}
  }
 };
}
