import * as T from './assets/three.module.js';

export function createClickFeedback(){
  const root=new T.Group();root.name='Click destination beacon';root.visible=false;
  const bright=new T.MeshBasicMaterial({color:0xfff0ad,transparent:true,opacity:.95,depthTest:false,depthWrite:false});
  const ring=new T.Mesh(new T.TorusGeometry(.63,.030,6,56),bright);ring.rotation.x=-Math.PI/2;ring.position.y=.08;root.add(ring);
  const pulseMaterial=bright.clone(),pulse=new T.Mesh(new T.TorusGeometry(.62,.018,5,48),pulseMaterial);pulse.rotation.x=-Math.PI/2;pulse.position.y=.09;root.add(pulse);
  const arrow=new T.Mesh(new T.ConeGeometry(.15,.30,4),bright);arrow.rotation.z=Math.PI;arrow.position.y=1.65;root.add(arrow);
  const diamond=new T.Mesh(new T.OctahedronGeometry(.12),bright);diamond.position.y=2.05;root.add(diamond);root.renderOrder=30;root.traverse(o=>o.renderOrder=30);
  const crumbMaterial=new T.MeshBasicMaterial({color:0xffe8a3,transparent:true,opacity:.65,depthTest:false,depthWrite:false}),crumbs=new T.InstancedMesh(new T.OctahedronGeometry(.055),crumbMaterial,48);crumbs.count=0;crumbs.renderOrder=29;
  crumbs.frustumCulled=false;let age=0,active=false,settle=0;const object=new T.Object3D();
  function show(point,path=[],floor=()=>0){
    root.position.copy(point);age=0;active=true;settle=0;root.visible=true;
    let count=0;for(let i=0;i<path.length-1&&count<48;i++){
      const a=path[i],b=path[i+1],length=Math.hypot(a.x-b.x,a.z-b.z);
      for(let d=.4;d<length&&count<48;d+=.85){const t=d/length,x=T.MathUtils.lerp(a.x,b.x,t),z=T.MathUtils.lerp(a.z,b.z,t);object.position.set(x,floor(x,z)+.17,z);object.scale.setScalar(1);object.rotation.set(0,0,0);object.updateMatrix();crumbs.setMatrixAt(count++,object.matrix);}
    }crumbs.count=count;crumbs.instanceMatrix.needsUpdate=true;crumbs.visible=true;
  }
  return{root,crumbs,show,clear(){if(active){active=false;settle=.4;}crumbs.visible=false;},update(dt,time,visible=true){
    age+=dt;if(!active)settle=Math.max(0,settle-dt);root.visible=visible&&(active||settle>0);crumbs.visible=visible&&active&&age<7;
    const s=1+(age%1.0)*1.25;pulse.scale.setScalar(s);pulseMaterial.opacity=(1-age%1)*.64;
    arrow.position.y=1.62+Math.sin(time*3.4)*.10;diamond.position.y=2.04+Math.sin(time*3.4)*.10;diamond.rotation.y=time;
    ring.scale.setScalar(1+Math.sin(time*4)*.05);bright.opacity=active?.95:settle/.4;
  }};
}

export function findNearbyCollectible(items,point,camera,screenX,screenY,width,height){
  let result=null,best=19*19;const projected=new T.Vector3();
  for(const item of items){
    if(!item.available||item.position.distanceTo(point)>1.1)continue;
    projected.copy(item.position).add(new T.Vector3(0,.45,0)).project(camera);if(projected.z<-1||projected.z>1)continue;
    const dx=(projected.x*.5+.5)*width-screenX,dy=(-projected.y*.5+.5)*height-screenY,d=dx*dx+dy*dy;
    if(d<best){best=d;result=item;}
  }
  return result;
}
