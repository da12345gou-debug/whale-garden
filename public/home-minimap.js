import {biomeWeights,terrainHeight} from './biome-data.js';
import {gardenTrailCurves} from './garden-trails.js';
import {trailLateral} from './trails.js';
import {COTTAGE_DOOR as COTTAGE_ENTRY,nearCottageEntrance} from './house-data.js';
export {COTTAGE_ENTRY};
export function minimapFrame(position,inHome=false){
  const player=inHome?COTTAGE_ENTRY:position,distance=Math.hypot(player.x-COTTAGE_ENTRY.x,player.z-COTTAGE_ENTRY.z);
  const halfSpan=Math.max(56,Math.ceil(distance*1.22/8)*8),scale=84/halfSpan;
  return{distance,halfSpan,scale,player,project:(x,z)=>({x:100+(x-COTTAGE_ENTRY.x)*scale,y:100+(z-COTTAGE_ENTRY.z)*scale})};
}
const palette={home:[164,195,150],desert:[223,195,147],snow:[221,234,230],rainforest:[92,155,133],meadow:[184,208,145]};
export function installHomeMinimap(root,onOpen){
  const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),playerMarker=root.querySelector('#minimap-player'),distanceLabel=root.querySelector('#minimap-distance'),scaleLabel=root.querySelector('#minimap-scale'),scaleLine=root.querySelector('#minimap-scale-line');
  let lastSpan=0,lastTime=-1;const tile=document.createElement('canvas');tile.width=tile.height=96;const tileCtx=tile.getContext('2d');
  root.addEventListener('click',onOpen);
  function draw(frame){
    const data=tileCtx.createImageData(96,96);
    for(let py=0;py<96;py++)for(let px=0;px<96;px++){
      const x=COTTAGE_ENTRY.x+(px/95*200-100)/frame.scale,z=COTTAGE_ENTRY.z+(py/95*200-100)/frame.scale,w=biomeWeights(x,z),tone=1+.025*Math.sin(terrainHeight(x,z)*2.5),i=(py*96+px)*4;
      for(let c=0;c<3;c++)data.data[i+c]=Object.entries(w).reduce((sum,[k,v])=>sum+palette[k][c]*v,0)*tone;data.data[i+3]=255;
    }
    tileCtx.putImageData(data,0,0);ctx.clearRect(0,0,200,200);ctx.drawImage(tile,0,0,200,200);
    const stroke=points=>{ctx.beginPath();for(let i=0;i<points.length;i++){const p=frame.project(points[i].x,points[i].z);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}ctx.stroke();};
    ctx.lineCap=ctx.lineJoin='round';ctx.strokeStyle='#7a9c7055';ctx.lineWidth=4;
    const curves=gardenTrailCurves.map(c=>c.getPoints(100));
    for(const axis of [0,1])for(const sign of [-1,1]){const points=[];for(let i=0;i<=100;i++){const t=sign*(30+i/100*(frame.halfSpan*1.3+Math.abs(axis?COTTAGE_ENTRY.z:COTTAGE_ENTRY.x))),a=trailLateral(t);points.push({x:axis?a:t,z:axis?t:a});}curves.push(points);}
    curves.forEach(stroke);ctx.strokeStyle='#f0dfaf';ctx.lineWidth=Math.max(.8,Math.min(2.4,frame.scale*1.1));curves.forEach(stroke);
    const metres=[10,20,50,100,200,500,1000,2000,5000,10000,50000].filter(v=>v<=frame.halfSpan*.45).at(-1)||10;
    scaleLabel.textContent=metres>=1000?metres/1000+' km':metres+' m';scaleLine.setAttribute('x2',String(12+metres*frame.scale));
  }
  return{update(position,yaw,inHome,time){
    if(time-lastTime<.1)return;lastTime=time;const frame=minimapFrame(position,inHome);
    if(frame.halfSpan!==lastSpan){draw(frame);lastSpan=frame.halfSpan;}
    const p=frame.project(frame.player.x,frame.player.z);playerMarker.setAttribute('transform',`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);playerMarker.querySelector('path').setAttribute('transform',`rotate(${180-yaw*180/Math.PI})`);
    distanceLabel.textContent=inHome?'正在家中':nearCottageEntrance(position)?'已经到家门口':'距家 '+(frame.distance>=1000?(frame.distance/1000).toFixed(1)+' km':Math.round(frame.distance)+' m');
    root.dataset.homeDistance=frame.distance.toFixed(1);root.dataset.player=JSON.stringify({x:+frame.player.x.toFixed(2),z:+frame.player.z.toFixed(2)});root.dataset.halfSpan=String(frame.halfSpan);
  }};
}
