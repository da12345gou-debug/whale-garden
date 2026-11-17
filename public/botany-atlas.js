import * as T from './assets/three.module.js';
import {loadBotany,createDetailedPlant} from './botany-library.js';
import {species} from './models.js';
import {detailedPlantInfo} from './foraging-species.js';
const canvas=document.querySelector('canvas'),renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(40,1,.01,100);scene.add(new T.HemisphereLight(0xe7f8f8,0x47685b,2.0));const key=new T.DirectionalLight(0xffe9d1,2.1);key.position.set(-3,5,4);scene.add(key);const rim=new T.DirectionalLight(0x96e9ed,1.3);rim.position.set(3,3,-3);scene.add(rim);
const floor=new T.Mesh(new T.CylinderGeometry(1.9,1.96,.035,96),new T.MeshStandardMaterial({color:0x326a65,roughness:.9}));floor.position.y=-.035;scene.add(floor);
const pedestalRim=new T.Mesh(new T.TorusGeometry(1.91,.008,6,96),new T.MeshBasicMaterial({color:0x95bd9d}));pedestalRim.rotation.x=pi()/2;pedestalRim.position.y=-.011;scene.add(pedestalRim);
function pi(){return Math.PI;}
let visual=null,yaw=.5,pitch=.36,distance=5.6,targetY=1,drag=null,filter='all';const labels={mushroom:'森林菌蕈',flower:'奇幻花朵',leaf:'叶片与草本',fruit:'浆果与奇果'};
const grid=document.querySelector('#specimens');let selected=species.find(s=>s.id===new URLSearchParams(location.search).get('plant'))||species.find(s=>s.id==='snowlotus');
function reset(){yaw=.5;pitch=.36;distance=5.6;}document.querySelector('#reset').onclick=reset;canvas.ondblclick=reset;
function choose(spec){
  selected=spec;if(visual)scene.remove(visual);visual=createDetailedPlant(spec);const b=new T.Box3().setFromObject(visual),size=b.getSize(new T.Vector3()),s=2.65/Math.max(size.x,size.y,size.z);visual.scale.setScalar(s);scene.add(visual);targetY=size.y*s*.46;
  document.querySelector('#name').textContent=spec.name;document.querySelector('#category').textContent=labels[spec.type]+(spec.poisonous?' / 毒菇标本':' / 可采集');document.querySelector('#description').textContent=spec.description;
  canvas.dataset.model=detailedPlantInfo[spec.id].model;canvas.dataset.species=spec.id;let triangles=0,meshes=0;visual.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;meshes++;}});canvas.dataset.triangles=String(triangles);canvas.dataset.meshes=String(meshes);
  for(const button of grid.children)button.classList.toggle('selected',button.dataset.species===spec.id);reset();
}
function list(){grid.innerHTML='';for(const spec of species){if(filter!=='all'&&spec.type!==filter)continue;const button=document.createElement('button');button.dataset.species=spec.id;button.setAttribute('aria-label','查看 '+spec.name+' 三维标本');const img=document.createElement('img');img.src='./assets/botany/icons/'+detailedPlantInfo[spec.id].model+'.png';img.alt='';img.loading='lazy';button.append(img,document.createTextNode(spec.name+(spec.poisonous?' ⚠':'')));button.onclick=()=>choose(spec);button.classList.toggle('selected',selected.id===spec.id);grid.append(button);}}
for(const button of document.querySelectorAll('[data-filter]'))button.onclick=()=>{filter=button.dataset.filter;document.querySelector('nav .selected').classList.remove('selected');button.classList.add('selected');list();};
canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(!drag)return;yaw-=(e.clientX-drag.x)*.008;pitch=T.MathUtils.clamp(pitch+(e.clientY-drag.y)*.006,-.12,1.48);drag={x:e.clientX,y:e.clientY};};canvas.onpointerup=()=>drag=null;canvas.onpointercancel=()=>drag=null;canvas.addEventListener('wheel',e=>{e.preventDefault();distance=T.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),2.0,9);},{passive:false});
function render(){const w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}camera.position.set(sin(yaw)*cos(pitch)*distance,targetY+sin(pitch)*distance,cos(yaw)*cos(pitch)*distance);camera.lookAt(0,targetY,0);renderer.render(scene,camera);requestAnimationFrame(render);}const sin=Math.sin,cos=Math.cos;
try{await loadBotany();list();choose(selected);document.querySelector('#loading').hidden=true;render();}catch(error){document.querySelector('#loading').textContent='标本暂时未打开，请刷新重试。';console.error(error);}
