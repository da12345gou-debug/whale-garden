import {DEFAULT_WALK_MULTIPLIER,validWalkMultiplier,walkSpeedFor} from './locomotion.js';
const KEY='whale-garden-walk-speed-v1';
export function installWalkSpeedControl(root,canvas,{storage,onChange=()=>{}}={}){
  let multiplier=DEFAULT_WALK_MULTIPLIER;
  try{storage??=globalThis.localStorage;const saved=storage.getItem(KEY);if(saved!==null)multiplier=validWalkMultiplier(saved);}catch{}
  const buttons=[...root.querySelectorAll('[data-walk-speed]')];
  function paint(){
    for(const button of buttons)button.setAttribute('aria-pressed',String(Number(button.dataset.walkSpeed)===multiplier));
    root.dataset.multiplier=String(multiplier);canvas.dataset.walkMultiplier=String(multiplier);canvas.dataset.walkSpeed=String(walkSpeedFor(multiplier));
  }
  for(const button of buttons)button.addEventListener('click',()=>{
    multiplier=validWalkMultiplier(button.dataset.walkSpeed);paint();try{storage.setItem(KEY,String(multiplier));}catch{}onChange(multiplier);
  });
  paint();return{get multiplier(){return multiplier;},get speed(){return walkSpeedFor(multiplier);}};
}
