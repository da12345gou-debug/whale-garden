import {WALK_STRIDES} from './locomotion.js';
export function createCharacterMotion(kind){
  let mode='Idle',phase=0,time=0;
  return{update(speed,_running,dt,wantsMove=speed>.08){
    const previous=mode;time+=dt;
    if(speed>.04&&(wantsMove||speed>.12)){
      mode='Walk';
      if(previous==='Idle')phase=.12;
      phase=(phase+speed*dt/WALK_STRIDES[kind])%1;
    }
    else{mode='Idle';if(previous==='Walk')phase=0;phase=(phase+dt*.25)%1;}
    if(mode!==previous)time=0;
    return{mode,previous,changed:mode!==previous,phase,time,stopping:false};
  }};
}
export function createPlanarMotor({acceleration=18,deceleration=25}={}){
  let x=0,z=0;
  return{reset(){x=z=0;},update(dx,dz,speed,dt){
    const tx=dx*speed,tz=dz*speed,ax=tx-x,az=tz-z,length=Math.hypot(ax,az),limit=(Math.hypot(tx,tz)<Math.hypot(x,z)?deceleration:acceleration)*dt;
    if(length<=limit){x=tx;z=tz;}else{x+=ax/length*limit;z+=az/length*limit;}
    if(Math.hypot(x,z)<.015)x=z=0;
    return{x,z,speed:Math.hypot(x,z)};
  }};
}
