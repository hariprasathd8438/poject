/* ══════════════════════════════════════════
   VoltEarth — Database Module (db.js)
   Supabase REST API via plain fetch() — no SDK
   ✅ Auto-seeds all 4 tables on first run
   ✅ Auto-saves every prediction, login, action
══════════════════════════════════════════ */

const SB_URL = 'https://eicwqdylfqbzuvxmxdgh.supabase.co';
const SB_KEY = 'sb_publishable_CSX_PJrPrQeruzoE1cE7fg_3dZ1Z2j4';

/* ─────────────────────────────────────────
   CORE REST HELPER
───────────────────────────────────────── */
async function sbFetch(method, table, body, params){
  try {
    let url = SB_URL + '/rest/v1/' + table;
    if(params) url += '?' + params;
    const opts = {
      method,
      headers: {
        'Content-Type' : 'application/json',
        'apikey'       : SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Prefer'       : 'return=representation'
      }
    };
    if(body && (method==='POST'||method==='PATCH')) opts.body = JSON.stringify(body);
    const res  = await fetch(url, opts);
    const text = await res.text();
    let data   = null;
    try { data = text ? JSON.parse(text) : null; } catch(e){ data = text; }
    if(!res.ok) return { data: null, error:{ message: data?.message||data?.hint||text||res.statusText, code: res.status }};
    return { data, error: null };
  } catch(e){
    return { data: null, error:{ message: e.message }};
  }
}

/* ─────────────────────────────────────────
   SEED DATA DEFINITIONS
───────────────────────────────────────── */
const SEED_USERS = [
  { name:'Priya Sharma',  email:'p.sharma@solar.in',   device:'Chrome 124 / Windows 11',  ip:'103.21.58.12'  },
  { name:'Arjun Mehta',   email:'a.mehta@windtech.co', device:'Safari 17 / macOS Sonoma', ip:'49.36.102.44'  },
  { name:'Sneha Patil',   email:'s.patil@gov.in',      device:'Firefox 125 / Ubuntu',     ip:'117.55.9.201'  },
  { name:'Rahul Desai',   email:'r.desai@greenco.io',  device:'Chrome 124 / Android 14',  ip:'182.64.77.33'  },
  { name:'Kavya Nair',    email:'k.nair@pvglobal.in',  device:'Edge 124 / Windows 10',    ip:'49.204.56.18'  },
  { name:'Demo User',     email:'demo@voltearth.io',   device:'Demo Browser',             ip:'127.0.0.1'     },
];

const SEED_LOCATIONS = [
  { city:'Coimbatore',      state:'Tamil Nadu',      lat:11.0168, lng:76.9558, irr:5.8, wind:6.2 },
  { city:'Chennai',         state:'Tamil Nadu',      lat:13.0827, lng:80.2707, irr:5.5, wind:5.8 },
  { city:'Madurai',         state:'Tamil Nadu',      lat:9.9252,  lng:78.1198, irr:5.9, wind:5.5 },
  { city:'Bengaluru',       state:'Karnataka',       lat:12.9716, lng:77.5946, irr:5.4, wind:5.0 },
  { city:'Hyderabad',       state:'Telangana',       lat:17.3850, lng:78.4867, irr:5.7, wind:5.6 },
  { city:'Pune',            state:'Maharashtra',     lat:18.5204, lng:73.8567, irr:5.6, wind:5.9 },
  { city:'Mumbai',          state:'Maharashtra',     lat:19.0760, lng:72.8777, irr:4.9, wind:6.8 },
  { city:'Ahmedabad',       state:'Gujarat',         lat:23.0225, lng:72.5714, irr:6.1, wind:6.5 },
  { city:'Jaipur',          state:'Rajasthan',       lat:26.9124, lng:75.7873, irr:6.5, wind:5.7 },
  { city:'Jodhpur',         state:'Rajasthan',       lat:26.2389, lng:73.0243, irr:6.8, wind:7.2 },
  { city:'Delhi',           state:'Delhi',           lat:28.7041, lng:77.1025, irr:5.2, wind:4.8 },
  { city:'Kolkata',         state:'West Bengal',     lat:22.5726, lng:88.3639, irr:4.6, wind:4.2 },
  { city:'Kochi',           state:'Kerala',          lat:9.9312,  lng:76.2673, irr:4.8, wind:7.5 },
  { city:'Visakhapatnam',   state:'Andhra Pradesh',  lat:17.6868, lng:83.2185, irr:5.6, wind:7.8 },
  { city:'Nagpur',          state:'Maharashtra',     lat:21.1458, lng:79.0882, irr:5.8, wind:5.2 },
  { city:'Tirunelveli',     state:'Tamil Nadu',      lat:8.7139,  lng:77.7567, irr:6.2, wind:8.1 },
];

/* Generate realistic past timestamps */
function daysAgo(n, hourOffset=0){
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hourOffset, Math.floor(Math.random()*60), 0, 0);
  return d.toISOString();
}

function rand(min, max, dec=1){
  return parseFloat((min + Math.random()*(max-min)).toFixed(dec));
}

/* Build seed predictions — 60 rows over last 90 days */
function buildSeedPredictions(userEmails){
  const rows = [];
  const types = ['solar','solar','solar','wind','solar','wind']; // 2:1 solar
  for(let i=0; i<60; i++){
    const daysBack = Math.floor(Math.random()*90);
    const loc  = SEED_LOCATIONS[i % SEED_LOCATIONS.length];
    const type = types[i % types.length];
    const sz   = rand(5, 50, 0);
    const eff  = rand(17, 22, 1);
    const temp = rand(24, 38, 1);
    const irr  = type==='solar' ? rand(loc.irr-0.5, loc.irr+0.8, 2) : null;
    const wind = type==='wind'  ? rand(loc.wind-1,  loc.wind+2,  1) : null;
    const tDerate = type==='solar' ? Math.max(0.65, 1-(temp-25)*0.0045) : 1;
    const daily = type==='solar'
      ? parseFloat((sz * (irr||5) * (eff/100) * tDerate).toFixed(1))
      : parseFloat((0.5*1.225*Math.PI*25*Math.pow(wind||6,3)*(eff/100)/1000).toFixed(1));
    const annual = parseFloat((daily*365).toFixed(0));
    const co2    = parseFloat((annual*0.7).toFixed(0));
    const rev    = parseFloat((annual*8).toFixed(0));
    rows.push({
      user_name    : SEED_USERS[i % SEED_USERS.length].name,
      user_email   : userEmails[i % userEmails.length] || SEED_USERS[i % SEED_USERS.length].email,
      type,
      location     : loc.city,
      state_name   : loc.state,
      lat          : loc.lat,
      lng          : loc.lng,
      system_size_kw: sz,
      efficiency_pct: eff,
      temperature_c : temp,
      irradiance    : irr,
      wind_speed    : wind,
      daily_kwh     : daily,
      annual_kwh    : annual,
      co2_kg        : co2,
      revenue_inr   : rev,
      gps_string    : `${loc.lat}°N, ${loc.lng}°E`,
      created_at    : daysAgo(daysBack, 8 + Math.floor(Math.random()*10))
    });
  }
  return rows;
}

/* Build seed generation_logs — one log per prediction (for each day of this week) */
function buildSeedGenerationLogs(predictionIds){
  const rows = [];
  const sources  = ['Solar','Solar','Wind','Solar','Wind'];
  const statuses = ['Optimal','Good','Optimal','Good','Optimal','Processing'];
  predictionIds.forEach((pid, i) => {
    // 3-7 log entries per prediction
    const count = 3 + Math.floor(Math.random()*5);
    for(let d=0; d<count; d++){
      const daysBack = d + Math.floor(Math.random()*7);
      const src = sources[i % sources.length];
      rows.push({
        prediction_id  : pid,
        date           : new Date(Date.now() - daysBack*86400000).toISOString().slice(0,10),
        source         : src,
        generation_kwh : rand(src==='Solar'?45:30, src==='Solar'?180:120, 1),
        efficiency_pct : rand(17.0, 22.5, 1),
        status         : statuses[Math.floor(Math.random()*statuses.length)],
        created_at     : daysAgo(daysBack, 7)
      });
    }
  });
  return rows;
}

/* Build seed activity_logs — 150 rows */
function buildSeedActivityLogs(){
  const rows = [];
  const actions = [
    {action:'Login',        detail:'Session started',              cat:'auth'},
    {action:'Generate',     detail:'Solar Analysis – Coimbatore',  cat:'generate'},
    {action:'Generate',     detail:'Wind Analysis – Jaipur',       cat:'generate'},
    {action:'View Report',  detail:'Monthly Generation Report',    cat:'view'},
    {action:'View Report',  detail:'Weekly Energy Summary',        cat:'view'},
    {action:'Download',     detail:'Weekly CSV Report',            cat:'download'},
    {action:'Download',     detail:'Monthly Analysis PDF',         cat:'download'},
    {action:'Search',       detail:'Solar irradiance Coimbatore',  cat:'search'},
    {action:'Search',       detail:'Wind speed Tirunelveli',       cat:'search'},
    {action:'Search',       detail:'Energy forecast Pune',         cat:'search'},
    {action:'View Page',    detail:'Dashboard',                    cat:'view'},
    {action:'View Page',    detail:'Generator',                    cat:'view'},
    {action:'GPS Capture',  detail:'Coimbatore, Tamil Nadu',       cat:'location'},
    {action:'Download',     detail:'Yearly Energy Report',         cat:'download'},
    {action:'Generate',     detail:'Solar Analysis – Chennai',     cat:'generate'},
    {action:'Logout',       detail:'Session ended',                cat:'auth'},
  ];
  const gpsOptions = [
    'Coimbatore, Tamil Nadu','Chennai, Tamil Nadu','Bengaluru, Karnataka',
    'Hyderabad, Telangana','Pune, Maharashtra','Jaipur, Rajasthan',
    'Mumbai, Maharashtra','Ahmedabad, Gujarat',
  ];
  for(let i=0; i<150; i++){
    const u   = SEED_USERS[i % SEED_USERS.length];
    const act = actions[i % actions.length];
    const daysBack = Math.floor(Math.random()*60);
    rows.push({
      user_name  : u.name,
      user_email : u.email,
      action     : act.action,
      detail     : act.detail,
      location   : gpsOptions[i % gpsOptions.length],
      category   : act.cat,
      ip_address : u.ip,
      device     : u.device,
      created_at : daysAgo(daysBack, 7 + Math.floor(Math.random()*14))
    });
  }
  return rows;
}

/* ─────────────────────────────────────────
   MAIN SEED FUNCTION
   Called once when DB is empty
───────────────────────────────────────── */
async function seedDatabase(){
  console.log('%c🌱 VoltEarth: Seeding database...', 'color:#f59e0b;font-weight:bold');
  dbSetBadge('seeding', 'Seeding DB…');

  // ── 1. Seed users ──────────────────────
  console.log('  → Seeding users…');
  const { data: insertedUsers, error: uErr } = await sbFetch('POST', 'users',
    SEED_USERS.map(u => ({
      ...u,
      last_login: daysAgo(Math.floor(Math.random()*5), 9),
      created_at: daysAgo(90 + Math.floor(Math.random()*30))
    }))
  );
  if(uErr){ console.error('User seed failed:', uErr.message); }
  else { console.log(`  ✅ ${(insertedUsers||[]).length} users seeded`); }

  // ── 2. Seed predictions ────────────────
  console.log('  → Seeding predictions…');
  const userEmails = (insertedUsers||SEED_USERS).map(u=>u.email);
  const seedPreds  = buildSeedPredictions(userEmails);

  // Insert in batches of 20 to avoid request size limits
  let insertedPredIds = [];
  for(let i=0; i<seedPreds.length; i+=20){
    const batch = seedPreds.slice(i, i+20);
    const { data: pd, error: pErr } = await sbFetch('POST', 'predictions', batch);
    if(pErr){ console.error('Prediction seed batch error:', pErr.message); }
    else { insertedPredIds = insertedPredIds.concat((pd||[]).map(r=>r.id)); }
  }
  console.log(`  ✅ ${insertedPredIds.length} predictions seeded`);

  // ── 3. Seed generation_logs ────────────
  if(insertedPredIds.length > 0){
    console.log('  → Seeding generation_logs…');
    const genLogs = buildSeedGenerationLogs(insertedPredIds.slice(0,20));
    for(let i=0; i<genLogs.length; i+=20){
      const batch = genLogs.slice(i, i+20);
      const { error: gErr } = await sbFetch('POST', 'generation_logs', batch);
      if(gErr) console.error('generation_logs seed error:', gErr.message);
    }
    console.log(`  ✅ ~${genLogs.length} generation_logs seeded`);
  }

  // ── 4. Seed activity_logs ──────────────
  console.log('  → Seeding activity_logs…');
  const actLogs = buildSeedActivityLogs();
  for(let i=0; i<actLogs.length; i+=30){
    const batch = actLogs.slice(i, i+30);
    const { error: aErr } = await sbFetch('POST', 'activity_logs', batch);
    if(aErr) console.error('activity_logs seed error:', aErr.message);
  }
  console.log(`  ✅ ${actLogs.length} activity_logs seeded`);

  console.log('%c✅ VoltEarth: Database seeded successfully!', 'color:#22c55e;font-weight:bold');
  dbSetBadge('ok', 'DB Live');
  return true;
}

/* ─────────────────────────────────────────
   INIT — check DB, seed if empty
───────────────────────────────────────── */
async function initDB(){
  const { data, error } = await sbFetch('GET', 'predictions', null, 'select=id&limit=1');

  if(error){
    const msg = String(error.message);
    if(msg.includes('does not exist') || msg.includes('42P01')){
      console.error('VoltEarth: Tables missing. Run db/setup.sql in Supabase SQL Editor.');
      dbSetBadge('error', 'No Tables');
    } else {
      console.warn('DB warning:', msg);
      dbSetBadge('warn', 'DB Warn');
    }
    return false;
  }

  // If predictions table is empty → seed all tables
  if(!data || data.length === 0){
    console.log('VoltEarth: Empty DB detected → auto-seeding...');
    await seedDatabase();
  } else {
    console.log('%c✅ VoltEarth connected to Supabase', 'color:#22c55e;font-weight:bold');
    dbSetBadge('ok', 'DB Live');
  }
  return true;
}

/* Helper: update the nav DB badge */
function dbSetBadge(state, text){
  const badge = document.getElementById('db-badge');
  if(!badge) return;
  const dot  = badge.querySelector('span:first-child');
  const label= badge.querySelector('span:last-child');
  const colors = {
    ok     : { bg:'rgba(34,197,94,.08)',  border:'rgba(34,197,94,.2)',  dot:'#22c55e', text:'#22c55e' },
    error  : { bg:'rgba(239,68,68,.08)', border:'rgba(239,68,68,.2)', dot:'#ef4444', text:'#ef4444' },
    warn   : { bg:'rgba(245,158,11,.08)',border:'rgba(245,158,11,.2)',dot:'#f59e0b', text:'#f59e0b' },
    seeding: { bg:'rgba(59,130,246,.08)',border:'rgba(59,130,246,.2)',dot:'#3b82f6', text:'#3b82f6' },
  };
  const c = colors[state] || colors.ok;
  badge.style.background   = c.bg;
  badge.style.borderColor  = c.border;
  if(dot)   dot.style.background = c.dot;
  if(label){ label.style.color = c.text; label.textContent = text; }
}

/* ─────────────────────────────────────────
   SAVE — predictions (auto on every generate)
───────────────────────────────────────── */
async function dbSavePrediction(result){
  const row = {
    user_name     : user?.name  || 'Anonymous',
    user_email    : user?.email || '',
    type          : result.type,
    location      : result.district,
    state_name    : result.state,
    lat           : gpsData.lat ? parseFloat(gpsData.lat) : null,
    lng           : gpsData.lng ? parseFloat(gpsData.lng) : null,
    system_size_kw: parseFloat(result.sz),
    efficiency_pct: parseFloat(result.eff),
    temperature_c : parseFloat(result.temp),
    irradiance    : result.type==='solar' ? parseFloat(result.irr)  : null,
    wind_speed    : result.type==='wind'  ? parseFloat(result.wind) : null,
    daily_kwh     : parseFloat(result.daily),
    annual_kwh    : parseFloat(result.annual),
    co2_kg        : parseFloat(result.co2),
    revenue_inr   : parseFloat(result.rev),
    gps_string    : result.gps
  };
  const { data, error } = await sbFetch('POST', 'predictions', row);
  if(error){ console.error('Save prediction error:', error.message); return null; }

  // Also save a generation_log entry for today
  const saved = Array.isArray(data) ? data[0] : data;
  if(saved?.id){
    await sbFetch('POST', 'generation_logs', {
      prediction_id  : saved.id,
      date           : new Date().toISOString().slice(0,10),
      source         : result.type==='solar' ? 'Solar' : 'Wind',
      generation_kwh : parseFloat(result.daily),
      efficiency_pct : parseFloat(result.eff),
      status         : 'Optimal'
    });
  }
  toast('✅ Result auto-saved to database!');
  return saved;
}

/* ─────────────────────────────────────────
   SAVE — user login/register (upsert)
───────────────────────────────────────── */
async function dbSaveUser(userData){
  const row = {
    email      : userData.email,
    name       : userData.name,
    last_login : new Date().toISOString(),
    device     : userData.device || 'Browser',
    ip_address : userData.ip    || '—'
  };
  const { data, error } = await sbFetch('POST', 'users', row, 'on_conflict=email');
  if(error){ console.warn('User upsert warning:', error.message); return null; }
  return Array.isArray(data) ? data[0] : data;
}

/* ─────────────────────────────────────────
   SAVE — activity log (auto on every action)
───────────────────────────────────────── */
async function dbSaveActivity(name, action, detail, gpsStr, cat){
  await sbFetch('POST', 'activity_logs', {
    user_name  : name  || 'Anonymous',
    user_email : user?.email || '',
    action,
    detail     : detail  || '—',
    location   : gpsStr  || '—',
    category   : cat     || 'view',
    ip_address : user?.ip     || '—',
    device     : user?.device || 'Browser'
  });
}

/* ─────────────────────────────────────────
   LOAD — report rows from predictions
───────────────────────────────────────── */
async function dbLoadReportRows(){
  const { data, error } = await sbFetch('GET', 'predictions', null,
    'select=*&order=created_at.desc&limit=365');
  if(error){ console.error('Load predictions error:', error.message); return null; }
  if(!data || !data.length) return null;
  return data.map(r => {
    const d = new Date(r.created_at);
    return {
      date   : d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),
      loc    : (r.location||'') + (r.state_name ? ', '+r.state_name : ''),
      gps    : r.lat && r.lng
                 ? parseFloat(r.lat).toFixed(4)+'°N, '+parseFloat(r.lng).toFixed(4)+'°E'
                 : (r.gps_string||'—'),
      src    : r.type==='solar' ? 'Solar' : 'Wind',
      gen    : r.daily_kwh  ? parseFloat(r.daily_kwh).toFixed(1) : '—',
      env    : r.type==='solar'
                 ? (r.irradiance  ? parseFloat(r.irradiance).toFixed(2)+' kWh/m²' : '—')
                 : (r.wind_speed  ? parseFloat(r.wind_speed).toFixed(1)+' m/s'    : '—'),
      eff    : r.efficiency_pct ? parseFloat(r.efficiency_pct).toFixed(1)+'%' : '—',
      status : 'Complete',
      raw_date: d,
      annual : r.annual_kwh,
      co2    : r.co2_kg,
      rev    : r.revenue_inr
    };
  });
}

/* ─────────────────────────────────────────
   LOAD — activity logs
───────────────────────────────────────── */
async function dbLoadActivityLogs(){
  const { data, error } = await sbFetch('GET', 'activity_logs', null,
    'select=*&order=created_at.desc&limit=200');
  if(error){ console.error('Load activity error:', error.message); return null; }
  if(!data || !data.length) return null;
  return data.map(r => ({
    name  : r.user_name || 'User',
    ini   : (r.user_name||'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2),
    action: r.action,
    detail: r.detail   || '—',
    gps   : r.location || '—',
    ip    : r.ip_address || '—',
    device: r.device   || 'Browser',
    time  : new Date(r.created_at),
    cat   : r.category || 'view',
    status: 'Success'
  }));
}

/* ─────────────────────────────────────────
   LOAD — dashboard stats from predictions
───────────────────────────────────────── */
async function dbLoadDashboardStats(){
  const { data } = await sbFetch('GET', 'predictions', null,
    'select=daily_kwh,annual_kwh,co2_kg,type,created_at&order=created_at.desc&limit=200');
  if(!data || !data.length) return null;
  const totalAnnual = data.reduce((s,r) => s+(r.annual_kwh||0), 0);
  const totalCo2    = data.reduce((s,r) => s+(r.co2_kg||0),     0);
  const avgDaily    = data.reduce((s,r) => s+(r.daily_kwh||0),  0) / data.length;
  return {
    totalAnnual, totalCo2, avgDaily, count: data.length,
    solar: data.filter(r=>r.type==='solar').length,
    wind : data.filter(r=>r.type==='wind').length
  };
}

/* ─────────────────────────────────────────
   LOAD — generation_logs for charts
───────────────────────────────────────── */
async function dbLoadGenerationLogs(days=30){
  const since = new Date(Date.now() - days*86400000).toISOString().slice(0,10);
  const { data, error } = await sbFetch('GET', 'generation_logs', null,
    `select=*&date=gte.${since}&order=date.asc&limit=500`);
  if(error){ console.warn('Load generation_logs error:', error.message); return null; }
  return data || [];
}

/* ─────────────────────────────────────────
   AUTH — Look up a user by email
   Returns the user row or null
───────────────────────────────────────── */
async function dbGetUserByEmail(email){
  const { data, error } = await sbFetch('GET', 'users', null,
    `select=*&email=eq.${encodeURIComponent(email)}&limit=1`);
  if(error){ console.warn('dbGetUserByEmail error:', error.message); return null; }
  return (data && data.length > 0) ? data[0] : null;
}

/* ─────────────────────────────────────────
   AUTH — Check if a password_hash already
   exists on any account (uniqueness check)
───────────────────────────────────────── */
async function dbIsPasswordTaken(hash){
  const { data, error } = await sbFetch('GET', 'users', null,
    `select=email&password_hash=eq.${encodeURIComponent(hash)}&limit=1`);
  if(error){ console.warn('dbIsPasswordTaken error:', error.message); return false; }
  return data && data.length > 0;
}

/* ─────────────────────────────────────────
   AUTH — Register a brand-new user
   Returns saved row or null
───────────────────────────────────────── */
async function dbRegisterUser(userData, passwordHash){
  const row = {
    email         : userData.email,
    name          : userData.name,
    password_hash : passwordHash,
    last_login    : new Date().toISOString(),
    device        : userData.device || 'Browser',
    ip_address    : userData.ip    || '—'
  };
  const { data, error } = await sbFetch('POST', 'users', row);
  if(error){ console.error('dbRegisterUser error:', error.message); return null; }
  return Array.isArray(data) ? data[0] : data;
}

/* ─────────────────────────────────────────
   AUTH — Update last_login for existing user
───────────────────────────────────────── */
async function dbUpdateLastLogin(email, ip, device){
  await sbFetch('PATCH', 'users',
    { last_login: new Date().toISOString(), ip_address: ip, device },
    `email=eq.${encodeURIComponent(email)}`
  );
}

/* ─────────────────────────────────────────
   SIMPLE password hash (SHA-256 via Web Crypto)
───────────────────────────────────────── */
async function hashPassword(plain){
  const buf  = await crypto.subtle.digest('SHA-256',
    new TextEncoder().encode(plain));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2,'0')).join('');
}
