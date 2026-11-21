// Retain the previous asset for a future selector; only the active girl is loaded.
export const GIRL_CHARACTERS=Object.freeze([
 Object.freeze({id:'original-girl',name:'白发女孩',url:'./assets/characters/girl-provided.glb',hidden:true,source:'女孩.fbx'}),
 Object.freeze({id:'redhood-20261121',name:'红兜帽女孩',url:'./assets/characters/girl-redhood-20261121.glb',hidden:false,source:'66f243502c6267ae66aeab543f915753.fbx'})
]);
export const ACTIVE_GIRL_ID='redhood-20261121';
export const activeGirl=GIRL_CHARACTERS.find(character=>character.id===ACTIVE_GIRL_ID);
