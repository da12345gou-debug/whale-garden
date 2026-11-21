import {COTTAGE_LANDING} from './house-data.js';
export const CHARACTER_SPAWN_KEY='whale-garden-character-spawn-v1';
export function lifeForCharacter(life,characterId,previousId){
 if(!life||characterId===previousId)return life;
 return {...life,position:{...COTTAGE_LANDING},resume:{scene:'world',position:{...COTTAGE_LANDING},yaw:Math.PI,
  cat:{x:COTTAGE_LANDING.x+1.5,z:COTTAGE_LANDING.z+1.9,yaw:Math.PI},
  camera:{yaw:0,pitch:.22,distance:10.5}}};
}
