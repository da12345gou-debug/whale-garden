export const WALK_MULTIPLIERS=Object.freeze([1,1.5,2]);
export const DEFAULT_WALK_MULTIPLIER=2;
export const BASE_WALK_SPEED=1.25;
export const WALK_SPEED=BASE_WALK_SPEED*DEFAULT_WALK_MULTIPLIER;
export const CAT_WALK_SPEED=1.60*DEFAULT_WALK_MULTIPLIER;
export function validWalkMultiplier(value){const n=Number(value);return WALK_MULTIPLIERS.includes(n)?n:DEFAULT_WALK_MULTIPLIER;}
export const walkSpeedFor=value=>BASE_WALK_SPEED*validWalkMultiplier(value);
export const HOLD_TO_WALK_MS=230;
export const WALK_MOTOR=Object.freeze({acceleration:4.2,deceleration:7});
// Authored contact travel / stance time, scaled to the in-world model height.
export const WALK_STRIDES=Object.freeze({girl:.70/.62*(3.08/1.78),cat:.26/.72*(1.38/.8)});

export function steerWalk(yaw,dx,dz,dt,turnRate=2.1){
  const length=Math.min(1,Math.hypot(dx,dz));if(length<.001)return{yaw,x:0,z:0};
  const wanted=Math.atan2(dx,dz),tau=Math.PI*2,delta=((wanted-yaw+Math.PI)%tau+tau)%tau-Math.PI;
  const turn=Math.sign(delta)*Math.min(Math.abs(delta)*(1-Math.exp(-5*dt)),turnRate*dt);
  yaw+=turn;const a=Math.max(0,Math.min(1,(Math.cos(delta-turn)-.15)/.8)),pace=a*a*(3-2*a)*length;
  return{yaw,x:Math.sin(yaw)*pace,z:Math.cos(yaw)*pace};
}

export function catFollowSpeed(distance,playerSpeed,multiplier=DEFAULT_WALK_MULTIPLIER){
  const desired=playerSpeed>.12?playerSpeed+(distance-1.1)*1.4:(distance-.25)*1.8;
  return Math.max(0,Math.min(CAT_WALK_SPEED*validWalkMultiplier(multiplier)/DEFAULT_WALK_MULTIPLIER,desired));
}
