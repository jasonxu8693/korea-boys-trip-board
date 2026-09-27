const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements=new Map();
function el(){return {style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},append(){},addEventListener(){},querySelectorAll(){return []},querySelector(){return el()},before(){},setAttribute(){},getAttribute(){return ''},innerHTML:'',textContent:'',children:[]};}
const mem=new Map();const document={getElementById(id){if(!html.includes('id="'+id+'"'))return null;if(!elements.has(id))elements.set(id,el());return elements.get(id)},querySelectorAll(){return []},querySelector(){return null},addEventListener(){},createElement:el,body:el(),activeElement:null};
const ctx={console,structuredClone,URL,Blob,AbortSignal,document,localStorage:{getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)},window:{addEventListener(){},matchMedia(){return {matches:true}},innerWidth:1440},navigator:{},setInterval(){},setTimeout(){},clearTimeout(){},requestAnimationFrame(){},fetch:async()=>{throw Error('Network not allowed in test')},Date,Intl};
vm.createContext(ctx);
vm.runInContext(script.slice(0,script.indexOf('    // Operational corrections'))+`
globalThis.api={mergeThree,normalizePlan,normalizeDeskRooms,normalized,shared,safeHttpUrl,sortPlanItems,validTime,roomSettled,
 get state(){return state},set state(v){state=v},get base(){return syncBase},set base(v){syncBase=v},
 get pending(){return pendingSave},set pending(v){pendingSave=v},get conflicts(){return syncConflicts},
 reset(){saving=false;syncConflicts=[];conflictChoice=null;remoteLoadAttempted=false;lastSeenUpdatedAt=null;lastSyncedAt=null;},
 pull:remotePull,save:remoteSave,get stamp(){return lastSeenUpdatedAt},defaults:defaultState};
renderAll=()=>{};showSyncConflicts=()=>{};toast=()=>{};
`,ctx);
const a=ctx.api,plain=x=>JSON.parse(JSON.stringify(x));
async function test(){
 let conf=[];
 let b={items:[{id:'a',votes:{0:1},title:'x'}],players:[{name:'A'},{name:'B'}]};
 let l=structuredClone(b),r=structuredClone(b);l.items[0].votes[1]=1;r.items[0].votes[2]=1;l.players[0].name='AA';r.players[1].name='BB';
 let m=a.mergeThree(b,l,r,'',conf);assert.equal(conf.length,0);assert.equal(m.items[0].votes[2],1);assert.equal(m.items[0].votes[1],1);assert.equal(m.players[0].name,'AA');assert.equal(m.players[1].name,'BB');
 conf=[];a.mergeThree({x:1},{x:2},{x:3},'',conf);assert.equal(conf.length,1);
 conf=[];m=a.mergeThree({items:[{id:'x',n:1}]},{items:[]},{items:[{id:'x',n:2}]},'',conf);assert.equal(conf.length,1);
 assert.equal(a.safeHttpUrl('javascript:alert(1)'),'#');assert.equal(a.safeHttpUrl('data:text/html,evil'),'#');assert.equal(a.safeHttpUrl('https://example.com'),'https://example.com/');
 assert.equal(a.validTime('25:30'),false);assert.equal(a.validTime('23:59'),true);
 const live=plain(a.normalized(a.defaults));
 delete live.plan.koreaReviewV11;
 live.plan.items.find(x=>x.id==='seed_25').time='13:00';
 live.plan.items.find(x=>x.id==='seed_24').time='10:30';
 live.desk.rooms[0].notes=[{id:'synthetic_note',by:0,text:'Preserve this note'}];
 live.desk.rooms[0].owners=[0];
 live.desk.rooms[0].options[0].votes={0:true};
 const n=plain(a.normalized(live));assert.deepEqual(plain(a.normalized(n)),n,'normalization idempotent');
 assert.deepEqual(n.players,live.players);assert.deepEqual(n.feed,live.feed);assert.deepEqual(n.ideaVotes,live.ideaVotes);
 for(const room of live.desk.rooms){let after=n.desk.rooms.find(x=>x.id===room.id);assert.deepEqual(after.owners,room.owners);assert.deepEqual(after.notes,room.notes||[]);if(room.drivers)assert.deepEqual(after.drivers,room.drivers);assert.equal(after.status,room.status);for(const op of room.options)assert.deepEqual(after.options.find(x=>x.id===op.id)?.votes,op.votes);}
 assert.equal(n.plan.items.length,live.plan.items.length);assert.equal(n.plan.items.find(x=>x.id==='seed_25').time,'10:30');assert.equal(n.plan.items.find(x=>x.id==='seed_24').time,'13:00');
 const edited=structuredClone(live);edited.plan.items.find(x=>x.id==='seed_25').time='12:20';assert.equal(a.normalized(edited).plan.items.find(x=>x.id==='seed_25').time,'12:20');
 console.log('PASS: migration idempotent; roster, votes, notes, ownership, bookings and all seeded stops preserved; user retiming preserved.');
 a.reset();a.state=structuredClone(n);a.base=a.shared(n);a.state.groupDone.offlinePack=true;a.pending=true;
 ctx.fetch=async()=>{throw Error('offline')};await a.save();assert.equal(a.pending,true);assert.ok([...mem.keys()].some(k=>k.includes('outbox')));assert.match(elements.get('syncChipText').textContent,/Unsaved/);
 console.log('PASS: failed save remains pending, durable and visibly unsaved.');
 // Concurrent write after GET causes zero-row PATCH, then safe re-read/re-merge.
 a.reset();a.base=a.shared(n);a.state=structuredClone(n);a.state.groupDone.offlinePack=true;a.pending=true;
 let remote=structuredClone(n);remote.groupDone.flightKraken=!n.groupDone.flightKraken;let gets=0,patches=0,body;
 ctx.fetch=async(url,o)=>{if(o.method==='PATCH'){patches++;body=JSON.parse(o.body).state;return {ok:true,json:async()=>patches===1?[]:[{updated_at:'v3'}]};}gets++;return {ok:true,json:async()=>[{state:remote,updated_at:'v'+gets}]};};
 await a.save();assert.equal(patches,2);assert.equal(body.groupDone.offlinePack,true);assert.equal(body.groupDone.flightKraken,remote.groupDone.flightKraken);assert.equal(a.pending,false);assert.equal(body.selectedPlayer,undefined);
 console.log('PASS: CAS conflict retries and combines independent changes; device identity excluded.');
 a.reset();a.base=a.shared(n);a.state=structuredClone(n);a.pending=false;
 let finish;ctx.fetch=()=>new Promise(resolve=>finish=resolve);const pull=a.pull({poll:true});a.pending=true;finish({ok:true,json:async()=>[{state:remote,updated_at:'skip'}]});await pull;assert.equal(a.stamp,null);
 a.pending=false;ctx.fetch=async()=>({ok:true,json:async()=>[{state:remote,updated_at:'skip'}]});await a.pull({poll:true});assert.equal(a.stamp,'skip');
 console.log('PASS: poll skipped during edit is not marked seen and applies later.');
 a.reset();a.base=a.shared(n);a.state=structuredClone(n);a.state.players[0].name='Mine';a.pending=true;remote=structuredClone(n);remote.players[0].name='Theirs';patches=0;
 ctx.fetch=async(u,o)=>{if(o.method==='PATCH')patches++;return {ok:true,json:async()=>[{state:remote,updated_at:'v4'}]};};await a.save();assert.equal(patches,0);assert.equal(a.pending,true);assert.ok(a.conflicts.length);
 console.log('PASS: same-field conflict blocks write for explicit resolution.');
 
 console.log('PASS: unsafe URLs, invalid times and independent vote/roster merging.');
 a.reset();a.state=structuredClone(n);a.pending=false;
 vm.runInContext(script.slice(script.indexOf('    // Operational corrections'),script.indexOf('    spawnLeaves();'))+'\nglobalThis.offlineResult=offlineText();',ctx);
 assert.match(ctx.offlineResult,/OFFLINE DAY PACK/);assert.match(ctx.offlineResult,/Seopjikoji/);assert.match(ctx.offlineResult,/08:00/);assert.match(ctx.offlineResult,/Parking:/);assert.match(ctx.offlineResult,/FOOD SHORTLISTS/);assert.match(ctx.offlineResult,/All itinerary times local/);
 console.log('PASS: offline text export includes timeline, stay addresses, logistics, parking and sourced food alternatives.');
}
test().catch(e=>{console.error(e);process.exitCode=1});
