import * as T from './assets/three.module.js';
import {mergeGeometries} from './assets/BufferGeometryUtils.js';
export const BLOOM_NAMES=['星辉百合','蓝晶风铃','虹羽天堂花','旋光海螺花','霞光蝴蝶兰','宝石千瓣莲'];
function paint(g,a,b=a){g.deleteAttribute('uv');g.computeBoundingBox();const p=g.attributes.position,c=[],lo=g.boundingBox.min.y,span=Math.max(.01,g.boundingBox.max.y-lo);for(let i=0;i<p.count;i++){const color=new T.Color(a).lerp(new T.Color(b),(p.getY(i)-lo)/span);c.push(color.r,color.g,color.b);}g.setAttribute('color',new T.Float32BufferAttribute(c,3));return g;}
function petal(length,width,a,b,curl=.10){const p=[],ix=[],colors=[];for(let i=0;i<=8;i++)for(let j=0;j<=4;j++){const t=i/8,s=j/4*2-1,w=Math.sin(Math.PI*t)**.55*width;p.push(s*w,.06*Math.sin(t*Math.PI)+curl*t*t+.04*s*s*Math.sin(t*Math.PI)+.012*Math.sin(t*20+s*5)*Math.sin(t*Math.PI),t*length);const c=new T.Color(a).lerp(new T.Color(b),t).lerp(new T.Color(0xffedc9),Math.abs(s)*.10);colors.push(c.r,c.g,c.b);if(i<8&&j<4){const k=i*5+j;ix.push(k,k+5,k+1,k+1,k+5,k+6);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();return g;}
export function fantasyBloomGeometry(style=0){
  const geos=[];let height=[1.28,1.55,1.42,1.10,1.45,.90][style];
  const add=(g,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);geos.push(g);};
  const stem=(points,r=.013,color=0x009e70)=>add(paint(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),12,r,5,false),color,0x5bf0ad));
  const bead=(x,y,z,r,color)=>add(paint(new T.SphereGeometry(r,8,5),color),x,y,z);
  stem([[0,0,0],[.04,height*.45,0],[0,height,0]]);
  for(let i=0;i<4;i++)add(petal(.34,.105,0x007f71,0x55e2a1,.05),0,.18+i*.14,0,-.42,i*2.4,.1);
  if(style===0){
    for(let i=0;i<6;i++)add(petal(i%2?.47:.55,i%2?.11:.15,0xffcf42,0xff3ba9,.15),0,height,0,-.12,i*Math.PI/3,0);
    for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.cos(a)*.10,z=Math.sin(a)*.10;stem([[0,height,0],[x,height+.14,z],[x*1.4,height+.22,z*1.4]],.006,0xffb22b);bead(x*1.4,height+.22,z*1.4,.024,0xffed6a);}
  }else if(style===1){
    for(let i=0;i<3;i++){const x=(i-1)*.22,y=height-i*.21,z=Math.sin(i*2.4)*.10;stem([[0,y-.25,0],[x,y+.20,z],[x,y+.12,z]]);
      const g=new T.LatheGeometry([[.025,.23],[.055,.21],[.105,.17],[.145,.10],[.16,.02],[.18,-.10],[.22,-.15]].map(p=>new T.Vector2(...p)),24),p=g.attributes.position;
      for(let j=0;j<p.count;j++){const a=Math.atan2(p.getZ(j),p.getX(j)),t=Math.max(0,1-(p.getY(j)+.15)/.38);p.setY(j,p.getY(j)+Math.cos(a*5)*.025*t*t);}g.computeVertexNormals();add(paint(g,0xee78db,0x17dff0),x,y,z,-.75);bead(x,y-.07,z+.10,.038,0xffe879);
      const rim=paint(new T.TorusGeometry(.215,.012,5,24),0xffc2e6);rim.rotateX(Math.PI/2);rim.translate(0,-.15,0);add(rim,x,y,z,-.75);
    }
  }else if(style===2){
    for(let i=0;i<7;i++)add(petal(.50+i%2*.12,.055,0xffc62c,i%2?0xff3a8d:0xff7624,.18),0,height,0,-.48+i*.12,-.7+i*.24,(i-3)*.10);
    for(let i=0;i<3;i++)add(petal(.52,.032,0x1bddf4,0x4b32de,.07),.04,height+.05,0,-.50,-.3+i*.24,-.1);
  }else if(style===3){
    const p=[],ix=[],colors=[];for(let i=0;i<=18;i++)for(let j=0;j<=24;j++){const t=i/18,a=j/24*Math.PI*2+t*1.1,r=.028+.31*t*t;p.push(Math.cos(a)*r,height+.48*t+.035*Math.sin(a*7)*t**5,Math.sin(a)*r);const c=new T.Color(0x05c69b).lerp(new T.Color(0x753bff),Math.min(1,t*1.6)).lerp(new T.Color(0xff69d1),Math.max(0,(t-.6)/.4));colors.push(c.r,c.g,c.b);if(i<18&&j<24){const k=i*25+j;ix.push(k,k+25,k+1,k+1,k+25,k+26);}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();add(g);bead(0,height+.12,0,.055,0xffd54d);
  }else if(style===4){
    for(let j=0;j<3;j++){const x=(j-1)*.19,y=height-j*.24,z=j%2*.08;stem([[0,y-.24,0],[x,y+.1,z]]);
      for(let i=0;i<5;i++)add(petal(i<2?.27:.22,i<2?.15:.11,0x9c3bcc,0xff67bb,.055),x,y,z,.35,i*Math.PI*2/5,.12);
      add(petal(.22,.13,0xffcc42,0xff48b0,.13),x,y+.025,z,1.25,0,0);bead(x,y+.06,z,.045,0xffea81);
    }
  }else{
    for(let row=0;row<3;row++)for(let i=0;i<8;i++)add(petal(.40-row*.065,.115-row*.012,row===1?0x234ce9:0xe32ebc,row===2?0xffdf73:0xff77ce,.16+row*.04),0,height+row*.035,0,-row*.20,i*Math.PI/4+row*.27,0);
    for(let i=0;i<9;i++){const a=i*2.4;bead(Math.cos(a)*.07,height+.18,Math.sin(a)*.07,.023,0xffe04f);}
  }
  const result=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());result.computeBoundingBox();result.computeBoundingSphere();return result;
}
