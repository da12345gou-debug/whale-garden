export const MIN_PITCH=-.85,MAX_PITCH=1.53;
export const clampPitch=value=>Math.max(MIN_PITCH,Math.min(MAX_PITCH,value));
export const isOrbitButton=button=>button===1||button===2;
export function orbitView(yaw,pitch,dx,dy){
  return{yaw:yaw-dx*.005,pitch:clampPitch(pitch+dy*.004)};
}
