const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function setup(consent='granted') {
 const events=[];
 const context={window:{fbq:(...args)=>events.push(args)},localStorage:{getItem:()=>consent},location:{hostname:'localhost'},console};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'meta-events.js'),'utf8'),context);
 return {events,api:context.window.veldVibeTracking};
}
const item=(price,quantity=1)=>[{product:'mens',sizes:{'8XL':{price,quantity}}}];
test('AddToCart retains its standard name and selected R1700 variant',()=>{
 const {api,events}=setup(); api.send('AddToCart',item(1700));
 assert.equal(events.length,1); assert.equal(events[0][0],'track'); assert.equal(events[0][1],'AddToCart');
 assert.equal(events[0][2].value,1700); assert.equal(events[0][2].currency,'ZAR');
});
test('mixed checkout sums all quantities and uses standard event',()=>{
 const {api,events}=setup(); api.send('InitiateCheckout',[...item(1700,2),{product:'chelsea',sizes:{'8':{price:990,quantity:1}}}]);
 assert.equal(events[0][0],'track'); assert.equal(events[0][2].value,4390); assert.equal(events[0][2].num_items,3);
});
test('formatted, missing, infinite and invalid prices never reach Meta',()=>{
 const {api,events}=setup(); for(const price of ['R1500','1,500','1500',undefined,NaN,Infinity,0,-1]) api.send('AddToCart',item(price));
 assert.equal(events.length,0);
});
test('unconsented actions never queue tracking',()=>{
 const {api,events}=setup('denied'); api.send('AddToCart',item(1500)); assert.equal(events.length,0);
});
test('success page requires paid backend status and deduplicates reloads',async()=>{
 const stored=new Map([['veldVibePendingPayment',JSON.stringify({paymentId:'VV-12345678-1234-1234-1234-123456789abc'})]]);
 const events=[];
 async function visit(paid) {
  const c={window:{fbq:(...a)=>events.push(a),addEventListener(){}},localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)},fetch:async()=>({ok:true,json:async()=>({paid,value:1700,currency:'ZAR'})}),setTimeout(){},console};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'payment-success.js'),'utf8'),c);
  await new Promise(resolve=>setImmediate(resolve));
 }
 await visit(false); assert.equal(events.length,0);
 await visit(true); assert.equal(events.length,1); assert.equal(events[0][2].value,1700);
 await visit(true); assert.equal(events.length,1);
});

// Execute the real storefront handlers against a small DOM, with Meta/network
// replaced by local recorders. No production requests or events are sent.
function pageHarness(initial={}) {
 const events=[], actions=[], elements=new Map(), stored=new Map(Object.entries(initial));
 stored.set('veldVibeMetaConsent',initial.veldVibeMetaConsent || 'granted');
 function element() {
  return {style:{},children:[],disabled:false,value:'Test',innerHTML:'',classList:{add(){},remove(){}},
   listeners:{},setAttribute(){},appendChild(child){this.children.push(child);},
   addEventListener(name,fn){this.listeners[name]=fn;},focus(){},querySelectorAll(){return [];}};
 }
 const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
 const context=vm.createContext({
  window:{fbq:(...a)=>{events.push(a);actions.push(a[1]);},addEventListener(){},location:{}},
  document:{getElementById:get,querySelector:()=>null,querySelectorAll:()=>[],createElement:element,body:element()},
  localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)},
  location:{hostname:'localhost'},console,alert(){},setTimeout(){return 1;},clearTimeout(){},
  fetch:async url=>{if(url.endsWith('/create-payment')){actions.push('payment request');return {ok:false,json:async()=>({success:false})};}return {};}
 });
 const run=s=>vm.runInContext(s,context);
 run(fs.readFileSync(path.join(__dirname,'meta-events.js'),'utf8'));
 return {events,actions,get,run};
}
function shopHarness(consent='granted') {
 const h=pageHarness({veldVibeMetaConsent:consent});
 const script=fs.readFileSync(path.join(__dirname,'script.js'),'utf8');
 h.run(script.slice(0,script.indexOf('function openCart()')));
 h.run('function updateCartButton() {} function openCart() {}');
 // Use the original inline handler from each actual visible BUY NOW link.
 h.buttons=[...fs.readFileSync(path.join(__dirname,'index.html'),'utf8').matchAll(/onclick="(openBuyModal\('[^']+'\); return false;)"/g)].map(m=>m[1]);
 h.clickBuy=index=>h.run(`(function(){${h.buttons[index]}})()`);
 return h;
}
test('each original BUY NOW button emits one intent event before sizes, never AddToCart',()=>{
 const h=shopHarness(); assert.equal(h.buttons.length,5);
 for(let i=0;i<h.buttons.length;i++) {
  const before=h.events.length; h.clickBuy(i);
  assert.equal(h.events.length,before+1);
  const [method,name,payload]=h.events.at(-1);
  assert.equal(method,'trackCustom');assert.equal(name,'Buy now');
  assert.equal('value' in payload,false);assert.equal('currency' in payload,false);
  assert.equal(payload.content_type,'product');assert.equal(payload.content_ids.length,1);
  assert.equal(h.run('Object.keys(selectedSizes).length'),0);
  assert.equal(h.get('continueCheckout').disabled,true);
 }
 assert.equal(h.events.filter(e=>e[1]==='AddToCart').length,0);
});
test('selecting 8XL then confirming cart emits one exact AddToCart and no second Buy now',()=>{
 const h=shopHarness();h.clickBuy(0);
 const row=h.get('sizeOptions').children.find(row=>row.children[0].innerHTML==='8XL');
 row.children[0].listeners.click();
 assert.equal(h.events.length,1); // Size choice alone does not emit either event.
 h.get('continueCheckout').onclick();
 h.get('continueCheckout').onclick(); // Existing duplicate-add guard remains effective.
 assert.deepEqual(h.events.map(e=>e[1]),['Buy now','AddToCart']);
 const data=h.events[1][2];assert.equal(data.value,1700);assert.equal(data.currency,'ZAR');
 assert.equal(data.contents[0].item_price,1700);assert.equal(data.num_items,1);
 assert.equal(h.run('cart[0].sizes["8XL"].quantity'),1);
});
test('a later genuine BUY NOW click records new intent even for the same product',()=>{
 const h=shopHarness();h.clickBuy(0);h.clickBuy(0);
 assert.deepEqual(h.events.map(e=>e[1]),['Buy now','Buy now']);
});
test('BUY NOW remains consent gated without blocking product selection',()=>{
 const h=shopHarness('denied');h.clickBuy(0);
 assert.equal(h.events.length,0);assert.equal(h.get('buyModal').style.display,'flex');
});
test('real PaySecurely handler sends full value before starting payment and not on page load',async()=>{
 const h=pageHarness({veldVibeCart:JSON.stringify([...item(1700,2),{product:'chelsea',sizes:{'8':{price:990,quantity:1}}}])});
 h.run(fs.readFileSync(path.join(__dirname,'checkout.js'),'utf8'));
 assert.equal(h.events.length,0);
 await h.get('checkoutButton').onclick();
 assert.deepEqual(h.actions,['PaySecurely','payment request']);
 assert.equal(h.events[0][2].value,4390);assert.equal(h.events[0][2].currency,'ZAR');
 assert.equal(h.events.some(e=>e[1]==='Purchase'),false);
});
