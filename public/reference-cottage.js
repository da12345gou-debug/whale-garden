import * as T from './assets/three.module.js';
import {GLTFLoader} from './assets/GLTFLoader.js';
import {DRACOLoader} from './assets/DRACOLoader.js';
import {reflectionLight} from './characters.js';
import {terrainHeight} from './biome-data.js';
import {COTTAGE_CENTER,DOOR_OPEN_ANGLE,cottageColliders,cottageDoorColliders} from './house-data.js';
export async function addReferenceCottage(root,colliders){
  const decoder=new DRACOLoader().setDecoderPath('./assets/draco/').setWorkerLimit(1),loader=new GLTFLoader().setDRACOLoader(decoder);
  try{const {scene}=await loader.loadAsync('./assets/cottage/reference-log-cottage.glb');scene.name='原木田园小屋';scene.position.set(COTTAGE_CENTER.x,terrainHeight(COTTAGE_CENTER.x,COTTAGE_CENTER.z),COTTAGE_CENTER.z);scene.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.envMap=reflectionLight();m.envMapIntensity=.35;}}});root.add(scene);
    const leaf=scene.getObjectByName('CottageDoorLeaf');if(!leaf)throw new Error('Cottage hinged door mesh is missing');
    const hinge=new T.Group();hinge.name='木门铰链';hinge.position.set(-1.05,1.1,5.35);scene.add(hinge);scene.updateMatrixWorld(true);hinge.attach(leaf);
    const moving=cottageDoorColliders();colliders.push(...cottageColliders(),...moving);let angle=0;
    function apply(){hinge.rotation.y=angle;const positions=cottageDoorColliders(angle);positions.forEach((p,i)=>Object.assign(moving[i],p));}
    const doorBox=new T.Box3(new T.Vector3(COTTAGE_CENTER.x-1.18,scene.position.y+1.1,COTTAGE_CENTER.z+5.0),new T.Vector3(COTTAGE_CENTER.x+1.18,scene.position.y+5.6,COTTAGE_CENTER.z+5.7));
    return{root:scene,get openness(){return angle/DOOR_OPEN_ANGLE;},snapOpen(){angle=DOOR_OPEN_ANGLE;apply();},update(dt,open){const target=open?DOOR_OPEN_ANGLE:0;angle+=Math.sign(target-angle)*Math.min(Math.abs(target-angle),dt*2.1);apply();},hitDoor(ray){return ray.direction.z<-.05&&ray.intersectsBox(doorBox);}};
  }finally{decoder.dispose();}
}
