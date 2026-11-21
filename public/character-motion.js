import {WALK_STRIDES} from './locomotion.js';
export function createCharacterMotion(kind,{stride=WALK_STRIDES[kind]}={}){
  let mode='Idle',phase=0,time=0;
  return{update(speed,_running,dt,wantsMove=speed>.08){
    const previous=mode;time+=dt;
    if(speed>.04&&(wantsMove||speed>.12)){
      mode='Walk';
      if(previous==='Idle')phase=.12;
      phase=(phase+speed*dt/stride)%1;
    }
    else{mode='Idle';if(previous==='Walk')phase=0;phase=(phase+dt*.25)%1;}
    if(mode!==previous)time=0;
    return{mode,previous,changed:mode!==previous,phase,time,stopping:false};
  }};
}
export function createPlanarMotor({acceleration=18,deceleration=25}={}){
  let x=0,z=0;
  return{reset(){x=z=0;},update(dx,dz,speed,dt){
    // The first animation-frame timestamp can precede module initialization.
    // A negative delta at rest used to divide 0 by 0 and poison movement forever.
    if(!Number.isFinite(x)||!Number.isFinite(z))x=z=0;
    dt=Number.isFinite(dt)?Math.max(0,dt):0;
    dx=Number.isFinite(dx)?dx:0;dz=Number.isFinite(dz)?dz:0;
    speed=Number.isFinite(speed)?Math.max(0,speed):0;
    const tx=dx*speed,tz=dz*speed,ax=tx-x,az=tz-z,length=Math.hypot(ax,az),limit=(Math.hypot(tx,tz)<Math.hypot(x,z)?deceleration:acceleration)*dt;
    if(length<=limit||length<1e-9){x=tx;z=tz;}else{x+=ax/length*limit;z+=az/length*limit;}
    if(Math.hypot(x,z)<.015)x=z=0;
    return{x,z,speed:Math.hypot(x,z)};
  }};
}
