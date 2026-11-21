import assert from 'node:assert/strict';
import {createPlanarMotor} from './public/character-motion.js';
import {createCompanionCircle} from './public/companion-circle.js';
import {lifeForCharacter,INITIAL_SPAWN,INITIAL_CAT,CHARACTER_SPAWN_KEY} from './public/character-spawn.js';
import {COTTAGE_DOOR,cottageWalkHeight,cottageColliders,cottageDoorColliders} from './public/house-data.js';
import {isPositionClear,CAT_RADIUS,GIRL_RADIUS,clearSegment} from './public/navigation.js';

// A first RAF callback can precede initialization. An idle negative delta must
// never poison the motor, including when the player starts moving afterward.
const motor=createPlanarMotor();
for(const dt of [-.001,0,NaN,.016]){
 const v=motor.update(0,0,2.5,dt);
 assert.deepEqual(v,{x:0,z:0,speed:0});
}
let distance=0;
for(let i=0;i<120;i++){
 const v=motor.update(1,0,2.5,1/60);
 assert(Number.isFinite(v.x)&&Number.isFinite(v.z)&&Number.isFinite(v.speed));
 distance+=v.x/60;
}
assert(distance>4.5&&distance<5);
for(let i=0;i<60;i++)motor.update(0,0,2.5,1/60);
assert.equal(motor.update(0,0,2.5,1/60).speed,0);
assert(motor.update(0,1,2.5,1/60).z>0);

const life={position:{x:200,z:50},counts:[1,2,3],storedCounts:[4,5,6],recipes:['tea'],resume:{scene:'home'}};
const spawned=lifeForCharacter(life,'new','old');
assert.deepEqual(spawned.position,INITIAL_SPAWN);
assert.equal(spawned.resume.scene,'world');
assert.deepEqual(spawned.counts,life.counts);
assert.deepEqual(spawned.storedCounts,life.storedCounts);
assert.equal(life.position.x,200);
assert.equal(lifeForCharacter(life,'new','new'),life);
assert.notEqual(CHARACTER_SPAWN_KEY,'whale-garden-character-spawn-v1');
assert.deepEqual(lifeForCharacter(life,'new',null).position,INITIAL_SPAWN);
assert.equal(lifeForCharacter(null,'new',null),null);
assert.equal(Math.hypot(INITIAL_SPAWN.x-COTTAGE_DOOR.x,INITIAL_SPAWN.z-COTTAGE_DOOR.z),10,'spawn ten world metres in front of actual door');
assert.equal(cottageWalkHeight(INITIAL_SPAWN.x,INITIAL_SPAWN.z),0,'spawn on the lawn in front of the house');
assert(isPositionClear(INITIAL_SPAWN,[...cottageColliders(),...cottageDoorColliders()],GIRL_RADIUS));
assert(isPositionClear(INITIAL_CAT,cottageColliders(),CAT_RADIUS));
assert(clearSegment(INITIAL_SPAWN,{x:-13,z:-6},cottageColliders(),GIRL_RADIUS),'can walk down steps');

const orbit=createCompanionCircle(),girl={x:0,z:0},cat={x:2.45,z:0};
const args={girl,cat,dt:.1,colliders:[]};
assert.equal(orbit.update(args),null);
let first,last;
for(let i=0;i<80;i++){
 const p=orbit.update(args);
 if(!p)continue;
 first??=p;last=p;
 assert(Math.abs(Math.hypot(p.x,p.z)-2.45)<1e-6);
}
assert(Math.hypot(first.x-last.x,first.z-last.z)>2);
assert.equal(orbit.update({...args,walking:true}),null);
assert.equal(orbit.update(args),null);
assert.equal(orbit.update({...args,busy:true}),null);
const blocked=[{x:0,z:0,r:3}];
for(let i=0;i<20;i++)assert.equal(orbit.update({...args,colliders:blocked}),null);
const obstacle=[{x:2.45,z:0,r:.5}];
let clear;
for(let i=0;i<20;i++)clear=orbit.update({...args,colliders:obstacle});
assert(clear&&isPositionClear(clear,obstacle,CAT_RADIUS+.18));
console.log('Gameplay passed: first-frame movement, stopping/restarting, home spawn preserving collections, idle cat orbit and obstacle avoidance.');
