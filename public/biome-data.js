import * as T from './assets/three.module.js';
import {GARDEN_RADIUS,TRANSITION_OUTER_RADIUS} from './world-scale.js';
export const blendedGroundMaterial=new T.MeshLambertMaterial({vertexColors:true});
export const biomeInfo={home:{name:'鲸游花园',subtitle:'橙色天空下，鲸鱼正游过森林。',color:0x65a35e},desert:{name:'东 · 琥珀沙海',subtitle:'金色沙丘之间，藏着太阳的果实。',color:0xe4b579},snow:{name:'南 · 银雪松原',subtitle:'雪花很轻，白猫的脚印也很轻。',color:0xe0eff3},rainforest:{name:'西 · 星灯雨林',subtitle:'巨大的花冠下，有雨滴和微光。',color:0x18896d},meadow:{name:'北 · 风铃花原',subtitle:'向远方走，花海还在继续。',color:0x8ebd63}};
export function biomeWeights(x,z){
  const radius=Math.hypot(x,z),edgeVariation=18*Math.sin(x*.012)*Math.sin(z*.014)+9*Math.sin((x+z)*.019);
  const t=T.MathUtils.smoothstep(radius-GARDEN_RADIUS,0,TRANSITION_OUTER_RADIUS-GARDEN_RADIUS+edgeVariation);
  if(t===0)return{home:1,desert:0,snow:0,rainforest:0,meadow:0};
  const inv=1/Math.max(radius,.001),east=Math.max(0,x*inv)**4,west=Math.max(0,-x*inv)**4,south=Math.max(0,z*inv)**4,north=Math.max(0,-z*inv)**4,total=east+west+south+north;
  return{home:1-t,desert:t*east/total,snow:t*south/total,rainforest:t*west/total,meadow:t*north/total};
}
export function biomeAt(x,z){return Object.entries(biomeWeights(x,z)).reduce((a,b)=>b[1]>a[1]?b:a,['home',-1])[0];}
export function vegetationBiome(x,z,randomValue){const weights=biomeWeights(x,z);let at=0;for(const [biome,weight] of Object.entries(weights)){at+=weight;if(randomValue<at)return biome;}return'meadow';}
export function grassCover(x,z){const w=biomeWeights(x,z);return w.home+w.rainforest+w.meadow;}
const groundPalette=Object.fromEntries(Object.entries({home:0x3caa75,desert:0xd6b27c,snow:0xdce6e5,rainforest:0x128e79,meadow:0x7dcc78}).map(([k,v])=>[k,new T.Color(v)]));
const fogPalette=Object.fromEntries(Object.entries({home:0x95ceb6,desert:0xeebe8f,snow:0xf2d8bc,rainforest:0x72bcb4,meadow:0xa4d7b2}).map(([k,v])=>[k,new T.Color(v)]));
function mixedColor(weights,palette,target){target.setRGB(0,0,0);for(const [k,w] of Object.entries(weights)){target.r+=palette[k].r*w;target.g+=palette[k].g*w;target.b+=palette[k].b*w;}return target;}
export function groundColorAt(x,z,target=new T.Color()){return mixedColor(biomeWeights(x,z),groundPalette,target).multiplyScalar(1+.035*Math.sin(x*.33+z*.21)+.025*Math.sin(x*.9-z*.41));}
export function fogColorAt(x,z,target=new T.Color()){return mixedColor(biomeWeights(x,z),fogPalette,target);}
function gardenHills(x,z){return 1.7*Math.sin(x*.085)+1.35*Math.sin(z*.072+.4)+.85*Math.cos((x+z)*.058)+.22*Math.sin(x*.22)*Math.sin(z*.16);}
export function terrainHeight(x,z){
  const w=biomeWeights(x,z);
  let h=gardenHills(x,z)*w.home+(3.2*Math.sin(x*.035+Math.sin(z*.019)*1.4)+1.7*Math.cos(z*.044))*w.desert+(2.3*Math.sin(x*.05)*Math.cos(z*.035))*w.rainforest+(2.7*Math.sin(z*.022)+1.8*Math.sin(x*.035))*w.snow+(1.9*Math.sin(x*.045)+1.7*Math.cos(z*.042))*w.meadow;
  for(const [cx,cz,flat,edge] of [[-13,-18,15.5,23],[5,-34,4.9,12]]){
    const d=Math.hypot(x-cx,z-cz);if(d<edge)h=T.MathUtils.lerp(gardenHills(cx,cz),h,T.MathUtils.smoothstep(d,flat,edge));
  }
  return h;
}
