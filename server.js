const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const STORE = path.join(DATA_DIR, 'store.json');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@vsmhospital.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'VSM@2026';
const sessions = new Map();

const seed = {
  doctors: [
    {id:'d1',name:'Dr. Ananya Rao',department:'Cardiology',specialization:'Interventional Cardiology',qualification:'MBBS, MD, DM (Cardiology)',experience:14,availability:'Mon–Sat · 10:00 AM–2:00 PM',photo:'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=700&q=80',availableDates:'2026-06-20, 2026-06-22, 2026-06-23, 2026-06-24, 2026-06-25, 2026-06-26',startTime:'10:00 AM',endTime:'02:00 PM'},
    {id:'d2',name:'Dr. Arjun Menon',department:'Neurology',specialization:'Stroke & Movement Disorders',qualification:'MBBS, MD, DM (Neurology)',experience:12,availability:'Mon, Wed, Fri · 9:00 AM–1:00 PM',photo:'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=700&q=80',availableDates:'2026-06-22, 2026-06-24, 2026-06-26',startTime:'09:00 AM',endTime:'01:00 PM'},
    {id:'d3',name:'Dr. Meera Iyer',department:'Paediatrics',specialization:'Neonatology',qualification:'MBBS, MD (Paediatrics), FIAP',experience:10,availability:'Mon–Fri · 11:00 AM–4:00 PM',photo:'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=700&q=80',availableDates:'2026-06-22, 2026-06-23, 2026-06-24, 2026-06-25, 2026-06-26',startTime:'11:00 AM',endTime:'04:00 PM'},
    {id:'d4',name:'Dr. Vikram Shah',department:'Orthopaedics',specialization:'Joint Replacement',qualification:'MBBS, MS (Orthopaedics)',experience:18,availability:'Tue–Sat · 3:00 PM–7:00 PM',photo:'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=700&q=80',availableDates:'2026-06-20, 2026-06-23, 2026-06-24, 2026-06-25, 2026-06-26',startTime:'03:00 PM',endTime:'07:00 PM'},
    {id:'d5',name:'Dr. Kavya Nair',department:'Obstetrics & Gynaecology',specialization:'High-risk Pregnancy',qualification:'MBBS, MS (OBG), FMAS',experience:11,availability:'Mon–Sat · 9:30 AM–1:30 PM',photo:'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=700&q=80',availableDates:'2026-06-20, 2026-06-22, 2026-06-23, 2026-06-24, 2026-06-25, 2026-06-26',startTime:'09:30 AM',endTime:'01:30 PM'},
    {id:'d6',name:'Dr. Rohan Kulkarni',department:'General Medicine',specialization:'Diabetes & Preventive Care',qualification:'MBBS, MD (Internal Medicine)',experience:9,availability:'Daily · 8:00 AM–12:00 PM',photo:'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=700&q=80',availableDates:'2026-06-20, 2026-06-21, 2026-06-22, 2026-06-23, 2026-06-24, 2026-06-25, 2026-06-26',startTime:'08:00 AM',endTime:'12:00 PM'}
  ],
  events: [
    {id:'e1',type:'Event',title:'Free Heart Health Screening Camp',date:'2026-07-12',excerpt:'ECG, blood pressure and cardiac risk review for adults over 40.',location:'VSM Community Hall'},
    {id:'e2',type:'News',title:'VSM launches 24×7 stroke response unit',date:'2026-06-08',excerpt:'A dedicated rapid-response pathway connects emergency, imaging and neurology teams.',location:'VSM Hospital'},
    {id:'e3',type:'Event',title:'Prenatal wellness workshop',date:'2026-07-26',excerpt:'A practical session on nutrition, movement and preparing for birth.',location:'Women’s Health Centre'}
  ], appointments: [], feedback: [], contacts: [], nextToken: 1
};

function ensureStore() { fs.mkdirSync(DATA_DIR,{recursive:true}); if(!fs.existsSync(STORE)) fs.writeFileSync(STORE,JSON.stringify(seed,null,2)); }
function readStore(){
  ensureStore();
  const store = JSON.parse(fs.readFileSync(STORE,'utf8'));
  let modified = false;
  if (store.doctors && store.doctors.length) {
    store.doctors.forEach(d => {
      if (d.availableDates === undefined) {
        d.availableDates = '2026-06-20, 2026-06-22, 2026-06-23, 2026-06-24, 2026-06-25, 2026-06-26';
        modified = true;
      }
      if (d.startTime === undefined) {
        const avail = d.availability || '';
        if (avail.includes('10:00 AM')) d.startTime = '10:00 AM';
        else if (avail.includes('9:00 AM')) d.startTime = '09:00 AM';
        else if (avail.includes('11:00 AM')) d.startTime = '11:00 AM';
        else if (avail.includes('3:00 PM')) d.startTime = '03:00 PM';
        else if (avail.includes('9:30 AM')) d.startTime = '09:30 AM';
        else if (avail.includes('8:00 AM')) d.startTime = '08:00 AM';
        else d.startTime = '09:00 AM';
        modified = true;
      }
      if (d.endTime === undefined) {
        const avail = d.availability || '';
        if (avail.includes('2:00 PM')) d.endTime = '02:00 PM';
        else if (avail.includes('1:00 PM')) d.endTime = '01:00 PM';
        else if (avail.includes('4:00 PM')) d.endTime = '04:00 PM';
        else if (avail.includes('7:00 PM')) d.endTime = '07:00 PM';
        else if (avail.includes('1:30 PM')) d.endTime = '01:30 PM';
        else if (avail.includes('12:00 PM')) d.endTime = '12:00 PM';
        else d.endTime = '05:00 PM';
        modified = true;
      }
    });
  }
  if (store.nextToken === undefined) {
    let maxToken = 0;
    if (store.appointments && store.appointments.length) {
      store.appointments.forEach(a => {
        const num = Number(a.id);
        if (!isNaN(num) && num > maxToken) maxToken = num;
      });
    }
    store.nextToken = maxToken + 1;
    modified = true;
  }
  if (modified) {
    const tmp=STORE+'.tmp'; fs.writeFileSync(tmp,JSON.stringify(store,null,2)); fs.renameSync(tmp,STORE);
  }
  return store;
}
function writeStore(data){ const tmp=STORE+'.tmp'; fs.writeFileSync(tmp,JSON.stringify(data,null,2)); fs.renameSync(tmp,STORE); }
function send(res,status,data,headers={}){ const body=typeof data==='string'?data:JSON.stringify(data); res.writeHead(status,{'Content-Type':typeof data==='string'?'text/plain; charset=utf-8':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}); res.end(body); }
function parseCookies(req){ return Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(v=>{const i=v.indexOf('=');return [v.slice(0,i).trim(),decodeURIComponent(v.slice(i+1))]})); }
function isAdmin(req){ const token=parseCookies(req).vsm_session; const s=sessions.get(token); return !!s && s.expires>Date.now(); }
function safeEqual(a,b){ const ah=crypto.createHash('sha256').update(String(a)).digest(); const bh=crypto.createHash('sha256').update(String(b)).digest(); return crypto.timingSafeEqual(ah,bh); }
async function body(req){ return new Promise((resolve,reject)=>{let raw='';req.on('data',c=>{raw+=c;if(raw.length>2_500_000){reject(new Error('Payload too large'));req.destroy();}});req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch{reject(new Error('Invalid JSON'))}});req.on('error',reject);}); }
function clean(v,n=300){ return String(v??'').trim().slice(0,n); }
function validPhone(v){ return /^[+\d][\d\s-]{8,15}$/.test(v); }
function id(prefix){ return prefix+crypto.randomBytes(6).toString('hex'); }
function originOk(req){ const origin=req.headers.origin; return !origin || origin===`http://${req.headers.host}` || origin===`https://${req.headers.host}`; }

async function api(req,res,url){
  if(!originOk(req)) return send(res,403,{error:'Origin not allowed'});
  const method=req.method;
  if(method==='GET' && url.pathname==='/api/doctors') return send(res,200,readStore().doctors);
  if(method==='GET' && url.pathname==='/api/events') return send(res,200,readStore().events);
  if(method==='POST' && url.pathname==='/api/login'){
    const b=await body(req); if(!safeEqual(clean(b.email).toLowerCase(),ADMIN_EMAIL.toLowerCase())||!safeEqual(b.password,ADMIN_PASSWORD)) return send(res,401,{error:'Invalid email or password'});
    const token=crypto.randomBytes(32).toString('hex');sessions.set(token,{expires:Date.now()+8*60*60*1000});
    return send(res,200,{ok:true},{'Set-Cookie':`vsm_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`});
  }
  if(method==='POST' && url.pathname==='/api/logout'){const t=parseCookies(req).vsm_session;sessions.delete(t);return send(res,200,{ok:true},{'Set-Cookie':'vsm_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
  if(method==='GET' && url.pathname==='/api/admin/session') return send(res,isAdmin(req)?200:401,{authenticated:isAdmin(req)});
  if(method==='POST' && url.pathname==='/api/appointments'){
    const b=await body(req), required=['name','phone','age','gender','department','doctor','date','time','reason']; if(required.some(k=>!clean(b[k]))) return send(res,400,{error:'Please complete every required field.'}); if(!validPhone(clean(b.phone))) return send(res,400,{error:'Enter a valid phone number.'});
    const data=readStore();
    const docRecord=data.doctors.find(d=>d.name===clean(b.doctor));
    if(docRecord){
      const dates=(docRecord.availableDates||'').split(',').map(s=>s.trim()).filter(Boolean);
      if(dates.length && !dates.includes(clean(b.date))){
        return send(res,400,{error:`The selected doctor is not available on ${clean(b.date)}. Please select an available date.`});
      }
    }
    const token=data.nextToken||1;
    data.nextToken=token+1;
    const record={id:String(token),tokenNumber:token,createdAt:new Date().toISOString(),status:'Pending',...Object.fromEntries(required.map(k=>[k,clean(b[k],k==='reason'?1000:200)]))};
    data.appointments.unshift(record);
    writeStore(data);
    return send(res,201,{ok:true,reference:record.id,appointment:record});
  }
  if(method==='POST' && url.pathname==='/api/feedback'){
    const b=await body(req);if(!clean(b.name)||!Number(b.rating)||!clean(b.comments))return send(res,400,{error:'Name, rating and comments are required.'});const data=readStore();data.feedback.unshift({id:id('FDB-'),createdAt:new Date().toISOString(),name:clean(b.name),rating:Math.min(5,Math.max(1,Number(b.rating))),comments:clean(b.comments,1200)});writeStore(data);return send(res,201,{ok:true});
  }
  if(method==='POST' && url.pathname==='/api/contact'){const b=await body(req);if(!clean(b.name)||!validPhone(clean(b.phone))||!clean(b.message))return send(res,400,{error:'Please enter valid contact details.'});const data=readStore();data.contacts.unshift({id:id('CON-'),createdAt:new Date().toISOString(),name:clean(b.name),phone:clean(b.phone),email:clean(b.email),message:clean(b.message,1200)});writeStore(data);return send(res,201,{ok:true});}
  if(url.pathname.startsWith('/api/admin/')&&!isAdmin(req))return send(res,401,{error:'Please sign in again.'});
  if(method==='GET' && url.pathname==='/api/admin/overview'){const d=readStore();return send(res,200,{doctors:d.doctors,events:d.events,appointments:d.appointments,feedback:d.feedback});}
  
  const appointmentMatch=url.pathname.match(/^\/api\/admin\/appointments(?:\/([^/]+))?$/);
  if(appointmentMatch && ['PUT','DELETE'].includes(method)){
    const data=readStore();
    if(method==='DELETE'){
      data.appointments=data.appointments.filter(x=>x.id!==appointmentMatch[1]);
      writeStore(data);
      return send(res,200,{ok:true});
    }
    const b=await body(req);
    const required=['name','phone','age','gender','department','doctor','date','time','reason','status'];
    if(required.slice(0, 9).some(k=>!clean(b[k]))) return send(res,400,{error:'Complete all required patient fields.'});
    if(!validPhone(clean(b.phone))) return send(res,400,{error:'Enter a valid phone number.'});
    const i=data.appointments.findIndex(x=>x.id===appointmentMatch[1]);
    if(i<0)return send(res,404,{error:'Appointment not found'});
    const original=data.appointments[i];
    const record={...original,...Object.fromEntries(required.map(k=>[k,clean(b[k],k==='reason'?1000:200)]))};
    data.appointments[i]=record;
    writeStore(data);
    return send(res,200,record);
  }

  const doctorMatch=url.pathname.match(/^\/api\/admin\/doctors(?:\/([^/]+))?$/);
  if(doctorMatch && ['POST','PUT','DELETE'].includes(method)){const data=readStore();if(method==='DELETE'){data.doctors=data.doctors.filter(x=>x.id!==doctorMatch[1]);writeStore(data);return send(res,200,{ok:true});}const b=await body(req);const fields=['name','department','specialization','qualification','experience','availability','photo','availableDates','startTime','endTime'];const required=['name','department','specialization','qualification','experience','availability','availableDates','startTime','endTime'];if(required.some(k=>!clean(b[k])))return send(res,400,{error:'Complete all required doctor fields.'});const record={id:doctorMatch[1]||id('d'),...Object.fromEntries(fields.map(k=>[k,k==='experience'?Number(b[k]):clean(b[k],b[k]?.startsWith?.('data:')?2_000_000:500)]))};if(method==='POST')data.doctors.unshift(record);else{const i=data.doctors.findIndex(x=>x.id===doctorMatch[1]);if(i<0)return send(res,404,{error:'Doctor not found'});data.doctors[i]=record;}writeStore(data);return send(res,200,record);}
  const eventMatch=url.pathname.match(/^\/api\/admin\/events(?:\/([^/]+))?$/);
  if(eventMatch && ['POST','PUT','DELETE'].includes(method)){const data=readStore();if(method==='DELETE'){data.events=data.events.filter(x=>x.id!==eventMatch[1]);writeStore(data);return send(res,200,{ok:true});}const b=await body(req),fields=['type','title','date','excerpt','location'];if(fields.some(k=>!clean(b[k])))return send(res,400,{error:'Complete all event fields.'});const record={id:eventMatch[1]||id('e'),...Object.fromEntries(fields.map(k=>[k,clean(b[k],800)]))};if(method==='POST')data.events.unshift(record);else{const i=data.events.findIndex(x=>x.id===eventMatch[1]);if(i<0)return send(res,404,{error:'Event not found'});data.events[i]=record;}writeStore(data);return send(res,200,record);}
  send(res,404,{error:'Not found'});
}

const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};
function staticFile(req,res,url){let pathname=decodeURIComponent(url.pathname);if(pathname==='/'||!path.extname(pathname))pathname='/index.html';const file=path.resolve(PUBLIC,'.'+pathname);if(!file.startsWith(PUBLIC))return send(res,403,'Forbidden');fs.readFile(file,(e,data)=>{if(e)return send(res,404,'Not found');const immutable=/\.(png|svg|ico)$/.test(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':immutable?'public, max-age=604800':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'SAMEORIGIN'});res.end(data);});}
ensureStore();
http.createServer((req,res)=>{const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);if(url.pathname.startsWith('/api/'))api(req,res,url).catch(e=>send(res,e.message==='Payload too large'?413:400,{error:e.message||'Request failed'}));else staticFile(req,res,url);}).listen(PORT,()=>console.log(`VSM Hospital running at http://localhost:${PORT}`));
