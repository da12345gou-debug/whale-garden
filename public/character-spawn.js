import {COTTAGE_APPROACH} from './house-data.js';
// A new placement revision migrates existing sessions once as well as new games.
export const CHARACTER_SPAWN_KEY='whale-garden-character-spawn-porch-v2';
export const INITIAL_SPAWN=Object.freeze({...COTTAGE_APPROACH});
export const INITIAL_CAT=Object.freeze({x:INITIAL_SPAWN.x+1.25,z:INITIAL_SPAWN.z+.65,yaw:0});
export const INITIAL_CAMERA=Object.freeze({yaw:0,pitch:.40,distance:14});
export function lifeForCharacter(life,characterId,previousId){
 if(!life||characterId===previousId)return life;
 return {...life,position:{...INITIAL_SPAWN},resume:{scene:'world',position:{...INITIAL_SPAWN},yaw:0,
  cat:{...INITIAL_CAT},camera:{...INITIAL_CAMERA}}};
}
