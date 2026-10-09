/* Run from any directory: node --test Q2/tests/q2.test.cjs
   Tests execute the same core JavaScript embedded in the submitted HTML.
   WebXR API objects below are test doubles, not physical-device testing. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const final = path.join(root,'f','index.html');
const html = fs.existsSync(final) ? fs.readFileSync(final,'utf8') : '';
const match = html.match(/<script id="q2-core">([\s\S]*?)<\/script>/);
let C;
if (match) { const ctx = { console }; vm.runInNewContext(match[1],ctx); C = ctx.Q2Core; }
const plain = x => JSON.parse(JSON.stringify(x));
const pose = (x=0,y=0,z=0) => ({position:[x,y,z], rotation:[0,0,0,1]});
const near = (a,b,tol=1e-9) => assert.ok(Math.abs(a-b)<tol, `${a} != ${b}`);
const state = (level=6) => { assert.ok(C,'Q2 HTML core has not been implemented'); return new C.DuckState(level); };
test('HTML contains a runnable application core',()=>assert.ok(C,'Q2 HTML core has not been implemented'));
test('empty-scene manipulation is safe',()=>{const s=state();assert.equal(s.move(1,1,.01),false);assert.equal(s.rotate(1,.01),false);assert.equal(s.resize(1.1),false);assert.equal(s.reset(),false);});
test('no valid hit means no spawn',()=>{const s=state();assert.equal(s.spawn(null),null);assert.equal(s.ducks.length,0);});
test('nonfinite coordinates are rejected',()=>{const s=state();assert.equal(s.spawn(pose(NaN)),null);assert.equal(s.spawn(pose(Infinity)),null);});
test('spawn stores position and an independent initial transform',()=>{const s=state();const p=pose(1,.8,-2);const d=s.spawn(p);p.position[0]=50;assert.deepEqual(plain(d.position),[1,.8,-2]);d.position[0]=7;assert.equal(d.initial.position[0],1);});
test('movement changes x/z, never y',()=>{const s=state();s.spawn(pose(1,.8,2));s.move(1,-1,.04);assert.ok(s.latest.position[0]>1);assert.ok(s.latest.position[2]<2);assert.equal(s.latest.position[1],.8);});
test('movement affects newest duck only',()=>{const s=state();const first=s.spawn(pose());const before=JSON.stringify(first);s.spawn(pose(2));s.move(1,0,.03);assert.equal(JSON.stringify(first),before);});
test('movement is time-based rather than frame-based',()=>{const a=state(),b=state();a.spawn(pose());b.spawn(pose());for(let i=0;i<100;i++)a.move(1,0,.01);for(let i=0;i<50;i++)b.move(1,0,.02);near(a.latest.position[0],b.latest.position[0]);});
test('dead zone stops joystick drift',()=>{const s=state();s.spawn(pose());const old=JSON.stringify(s.latest);s.move(.05,-.08,.02);s.rotate(.04,.02);assert.equal(JSON.stringify(s.latest),old);});
test('rotation changes orientation but not position or scale',()=>{const s=state();s.spawn(pose(1,2,3));s.rotate(1,.05);assert.notDeepEqual(plain(s.latest.rotation),[0,0,0,1]);assert.deepEqual(plain(s.latest.position),[1,2,3]);assert.deepEqual(plain(s.latest.scale),[1,1,1]);});
test('world-y rotation works on a tilted initial orientation',()=>{const s=state();s.spawn({position:[0,0,0],rotation:[Math.SQRT1_2,0,0,Math.SQRT1_2]});s.rotate(1,.05);near(Math.hypot(...s.latest.rotation),1);assert.ok(Math.abs(s.latest.rotation[2])>0);});
test('A/B scale uniformly and reciprocally',()=>{const s=state();s.spawn(pose());s.resize(1.1);s.latest.scale.forEach(v=>near(v,1.1));s.resize(1/1.1);s.latest.scale.forEach(v=>near(v,1));});
test('size limits remain positive and finite',()=>{const s=state();s.spawn(pose());for(let i=0;i<500;i++)s.resize(1/1.1);assert.ok(s.latest.scale[0]>=.1);for(let i=0;i<500;i++)s.resize(1.1);assert.ok(s.latest.scale[0]<=4);assert.equal(s.resize(-1),false);});
test('reset restores all three components of the newest duck only',()=>{const s=state();const first=s.spawn(pose(3,1,-1));s.move(1,0,.05);const old=JSON.stringify(first);const second=s.spawn({position:[1,2,-3],rotation:[0,.4,0,Math.sqrt(.84)]});const initial=plain(second.initial);s.move(1,1,.03);s.rotate(1,.05);s.resize(1.1);assert.equal(s.reset(),true);assert.deepEqual(plain(second.position),initial.position);assert.deepEqual(plain(second.rotation),initial.rotation);assert.deepEqual(plain(second.scale),initial.scale);assert.equal(JSON.stringify(first),old);});
test('snapshots survive repeated reset and edits',()=>{const s=state();s.spawn(pose(1));s.move(1,0,.03);s.reset();s.move(1,0,.03);s.reset();assert.equal(s.latest.position[0],1);});
for (const [part,level] of Object.entries({b:2,c:3,d:4,e:5,f:6})) {
 test(`part ${part} has a standalone HTML and correct cumulative feature level`,()=>{const p=path.join(root,part,'index.html');assert.ok(fs.existsSync(p),`${part}/index.html missing`);const t=fs.readFileSync(p,'utf8');assert.ok(t.includes(`const LEVEL = ${level};`));assert.ok(t.includes('../a/assets/'));assert.ok(t.includes('requestHitTestSource'));for(const m of t.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);});
}
test('cumulative feature flags prevent later operations in earlier parts',()=>{for(let level=2;level<=6;level++){const s=state(level);s.spawn(pose());assert.equal(s.move(1,0,.03),level>=3);assert.equal(s.rotate(1,.03),level>=4);assert.equal(s.resize(1.1),level>=5);assert.equal(s.reset(),level>=6);}});
test('one press edge, not release/touch/analog changes, triggers an action',()=>{state();assert.equal(C.isPressEdge({pressed:true,changes:{pressed:{current:true}}}),true);assert.equal(C.isPressEdge({pressed:true,changes:{value:{current:1}}}),false);assert.equal(C.isPressEdge({pressed:false,changes:{pressed:{current:false}}}),false);});
test('hit subscription uses RIGHT controller targetRaySpace, never viewer',async()=>{state();const raySpace={tag:'right-ray'};let passed;const source={cancel(){}};const h=new C.ControllerHitTest();const ok=await h.start({requestHitTestSource:async opts=>{passed=opts;return source;}},{handedness:'right',targetRayMode:'tracked-pointer',targetRaySpace:raySpace});assert.equal(ok,true);assert.equal(passed.space,raySpace);assert.equal(h.source,source);h.stop();assert.equal(h.source,null);});
test('left or gaze sources cannot silently substitute for the right controller',async()=>{state();const h=new C.ControllerHitTest();let calls=0;const session={requestHitTestSource:async()=>{calls++;return{cancel(){}}}};assert.equal(await h.start(session,{handedness:'left',targetRayMode:'tracked-pointer'}),false);assert.equal(await h.start(session,{handedness:'right',targetRayMode:'gaze'}),false);assert.equal(calls,0);});
test('source creation finishing after disconnect is canceled',async()=>{state();let resolve;let cancels=0;const h=new C.ControllerHitTest();const promise=h.start({requestHitTestSource:()=>new Promise(r=>resolve=r)},{handedness:'right',targetRayMode:'tracked-pointer',targetRaySpace:{}});h.stop();resolve({cancel(){cancels++;}});assert.equal(await promise,false);assert.equal(h.source,null);assert.equal(cancels,1);});
test('missing hit in the next frame clears the old pose',async()=>{state();const h=new C.ControllerHitTest();await h.start({requestHitTestSource:async()=>({cancel(){}})},{handedness:'right',targetRayMode:'tracked-pointer',targetRaySpace:{}});const ref={};let usedRef;const f={getHitTestResults:()=>[{getPose:r=>{usedRef=r;return{transform:{position:{x:1,y:2,z:3},orientation:{x:0,y:0,z:0,w:1}}}}}]};assert.deepEqual(plain(h.read(f,ref)),pose(1,2,3));assert.equal(usedRef,ref);assert.equal(h.read({getHitTestResults:()=>[]},ref),null);assert.equal(h.latest,null);});
test('unsupported hit test rejects without a fake-floor fallback',async()=>{state();const h=new C.ControllerHitTest();await assert.rejects(h.start({requestHitTestSource:async()=>{throw Error('NotSupportedError');}},{handedness:'right',targetRayMode:'tracked-pointer',targetRaySpace:{}}),/NotSupportedError/);assert.equal(h.source,null);assert.equal(h.latest,null);});
function fakeMotion(){
 const components={};
 for(const id of ['xr-standard-trigger','a-button','b-button','x-button','xr-standard-thumbstick']){
  const listeners=new Set();
  components[id]={pressed:false,changes:{},axes:{x:0,y:0},
   onButtonStateChangedObservable:{add(fn){listeners.add(fn);return fn;},remove(fn){listeners.delete(fn);}},
   emit(pressed,changed=true){this.pressed=pressed;this.changes=changed?{pressed:{current:pressed}}:{value:{current:.8}};listeners.forEach(fn=>fn());},
   count(){return listeners.size;}};
 }
 return {components,getComponent:id=>components[id]};
}
test('right trigger spawns once and right A/B scale; X is not bound on the right',()=>{
 state();const motion=fakeMotion();let spawns=0,resets=0;const factors=[];
 C.wireMotionController('right',motion,{spawn:()=>spawns++,scale:x=>factors.push(x),reset:()=>resets++});
 const t=motion.components['xr-standard-trigger'];t.emit(true);t.emit(true,false);t.emit(false);
 motion.components['a-button'].emit(true);motion.components['b-button'].emit(true);motion.components['x-button'].emit(true);
 assert.equal(spawns,1);assert.equal(resets,0);assert.deepEqual(factors,[1.1,1/1.1]);
});
test('left X resets and left trigger cannot spawn',()=>{
 state();const motion=fakeMotion();let resets=0,spawns=0;
 C.wireMotionController('left',motion,{spawn:()=>spawns++,scale:()=>{},reset:()=>resets++});
 motion.components['x-button'].emit(true);motion.components['x-button'].emit(false);motion.components['xr-standard-trigger'].emit(true);
 assert.equal(resets,1);assert.equal(spawns,0);
});
test('disconnect cleanup removes button subscriptions',()=>{
 state();const motion=fakeMotion();let count=0;
 const binding=C.wireMotionController('right',motion,{spawn:()=>count++,scale:()=>{},reset:()=>{}});
 assert.equal(binding.stick,motion.components['xr-standard-thumbstick']);binding.dispose();
 motion.components['xr-standard-trigger'].emit(true);assert.equal(count,0);
 for(const c of Object.values(motion.components))assert.equal(c.count(),0);
});
test('all cumulative HTML pages contain the same tested core',()=>{
 state();for(const part of 'bcdef'){
 const t=fs.readFileSync(path.join(root,part,'index.html'),'utf8');
 assert.equal(t.match(/<script id="q2-core">([\s\S]*?)<\/script>/)[1],match[1]);
 }
});
