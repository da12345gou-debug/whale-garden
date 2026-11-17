import * as T from './assets/three.module.js';
import {GLTFLoader} from './assets/GLTFLoader.js';
import {DRACOLoader} from './assets/DRACOLoader.js';
import {reflectionLight} from './characters.js';
import {detailedPlantInfo} from './foraging-species.js';
const templates=new Map();
export function registerBotanyModel(key,scene){
  scene.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(scene);templates.set(key,{scene,height:bounds.max.y-bounds.min.y,minY:bounds.min.y});
}
export async function loadBotany(){
  const draco=new DRACOLoader().setDecoderPath('./assets/draco/').setWorkerLimit(2),loader=new GLTFLoader().setDRACOLoader(draco);
  try{
    await Promise.all([...new Set(Object.values(detailedPlantInfo).map(p=>p.model))].map(async key=>{
      const gltf=await loader.loadAsync('./assets/botany/'+key+'.glb');
      gltf.scene.traverse(o=>{if(o.isMesh){o.userData.sharedBotanyGeometry=true;o.castShadow=false;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.envMap=reflectionLight();m.envMapIntensity=.45;if(o.geometry.getAttribute('color_1')){m.onBeforeCompile=shader=>{shader.vertexShader='attribute vec4 color_1;\nvarying vec3 vBotanyLight;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBotanyLight=color_1.rgb;');shader.fragmentShader='varying vec3 vBotanyLight;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vBotanyLight*.35;');};m.customProgramCacheKey=()=> 'living-botany-v2';}}}});
      registerBotanyModel(key,gltf.scene);
    }));
  }finally{draco.dispose();}
}
export function createDetailedPlant(spec,scale=1){
  const info=detailedPlantInfo[spec.id],template=info&&templates.get(info.model);if(!template)return null;
  const root=new T.Group(),visual=template.scene.clone(true),s=info.height*scale/template.height;root.name=spec.name;root.userData.botanyModel=info.model;root.userData.poisonous=!!spec.poisonous;visual.scale.multiplyScalar(s);visual.position.y=-template.minY*s;root.add(visual);return root;
}
export function detailedTemplate(key){return templates.get(key)?.scene;}
