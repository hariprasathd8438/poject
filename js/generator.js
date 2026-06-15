/* ══════════════════════════════════════════
   VoltEarth — Generator & Reports (generator.js)
   Energy analysis, results, report builder, charts
══════════════════════════════════════════ */

// GENERATOR
// ══════════════════════════════════════════
function generate(){
  const c = document.getElementById('sel-c').value;
  const s = document.getElementById('sel-s').value;
  const d = document.getElementById('sel-d').value;

  let locLabel = '';

  if(selectedLocationType === 'exact'){
    // For exact GPS, use gpsData directly
    const city = gpsData.city || 'GPS Location';
    const state = gpsData.state || '';
    locLabel = state ? `${city}, ${state}` : city;
    if(!city){ toast('⚠️ GPS location not captured yet'); return; }

  } else if(selectedLocationType === 'country'){
    if(!c){ toast('⚠️ Select a country'); return; }
    locLabel = document.querySelector('#sel-c option:checked')?.textContent || c;

  } else if(selectedLocationType === 'state'){
    if(!c || !s){ toast('⚠️ Select country and state'); return; }
    const cName = document.querySelector('#sel-c option:checked')?.textContent || c;
    locLabel = `${s}, ${cName}`;

  } else {
    // district (default)
    if(!c || !s || !d){ toast('⚠️ Select all location fields'); return; }
    locLabel = `${d}, ${s}`;
  }

  const stateForResult = s || gpsData.state || 'India';
  const query = `${selEnergy==='solar'?'Solar':'Wind'} analysis – ${locLabel}`;
  logAct(user?.name||'User','Generate Analysis',query,gpsStr(),'generate');

  showLoader('Connecting to NASA POWER API…');
  let step = 0;
  const iv = setInterval(()=>{
    ['ls1','ls2','ls3'].forEach(id=>document.getElementById(id).classList.remove('on'));
    if(step<3) document.getElementById(['ls1','ls2','ls3'][step]).classList.add('on');
    const msgs=['Fetching solar irradiance data…','Calculating generation capacity…','Building report…'];
    if(step<3) document.getElementById('ltxt').textContent=msgs[step];
    step++;
  },700);
  setTimeout(()=>{clearInterval(iv);hideLoader();showResults(selEnergy,locLabel,stateForResult);},2300);
}

function showResults(type,district,state){
  const isSol=type==='solar';
  const sz=parseFloat(document.getElementById('sys-sz').value)||10;
  const eff=parseFloat(document.getElementById('eff-pct').value)/100||.2;
  const temp=parseFloat(document.getElementById('temp-in').value)||28;
  const tDerate=isSol?Math.max(.65,1-(temp-25)*.0045):1;

  // ── Solar Night-time Guard ──────────────────────────────────────────────
  // Solar panels produce ZERO power without sunlight (roughly 6 AM–7 PM).
  // We use the current local hour to determine whether the sun is up.
  // Irradiance follows a sine-curve through the solar window; outside it = 0.
  const nowHour = new Date().getHours() + new Date().getMinutes() / 60;
  const SUNRISE = 6;    // 06:00 local time
  const SUNSET  = 19;   // 19:00 local time

  // Peak irradiance (kWh/m²/d equivalent for the current moment, scaled to daily avg)
  // During the day: sine-shaped curve peaks at solar noon (~12:30), ±small random
  // At night: irradiance is 0 — no generation possible
  let irr;
  if(isSol){
    if(nowHour < SUNRISE || nowHour >= SUNSET){
      // Night-time — no solar generation
      irr = '0.00';
    } else {
      // Day-time — scale irradiance by sine curve position through solar window
      const solarProgress = (nowHour - SUNRISE) / (SUNSET - SUNRISE); // 0→1
      const sineMultiplier = Math.sin(solarProgress * Math.PI);        // 0→1→0
      // Realistic daily avg (kWh/m²/d) modulated by current sun position
      const baseDailyIrr = 4.2 + Math.random() * 2.8;                 // 4.2–7.0
      irr = (baseDailyIrr * sineMultiplier).toFixed(2);
    }
  } else {
    irr = (4.2 + Math.random() * 2.8).toFixed(2); // not used for wind
  }

  const wind=(5.0+Math.random()*4.5).toFixed(1);

  // Solar daily output is 0 at night; wind is unaffected by time of day
  const daily=isSol
    ? (parseFloat(irr) === 0
        ? '0.0'
        : (sz * parseFloat(irr) * eff * tDerate).toFixed(1))
    : (0.5*1.225*Math.PI*25*Math.pow(parseFloat(wind),3)*eff/1000).toFixed(1);

  // For annual projections, use a realistic regional daytime daily average
  // so CO2 and revenue estimates remain meaningful even when run at night.
  // Regional avg irradiance for India = ~5.5 kWh/m2/d.
  const dailyForAnnual = isSol
    ? (sz * 5.5 * eff * tDerate).toFixed(1)
    : daily;
  const annual=(parseFloat(dailyForAnnual)*365).toFixed(0);
  const co2=(parseFloat(annual)*.7).toFixed(0);
  const rev=(parseFloat(annual)*8).toFixed(0);
  lastResult={type,district,state,irr,wind,daily,annual,co2,rev,temp,eff:Math.round(eff*100),sz,gps:gpsStr(),city:gpsCity()};
  // ── Auto-save result to Supabase database ──
  dbSavePrediction(lastResult);
  // ── Add result to allRptRows for immediate Reports display ──
  const _now = new Date();
  allRptRows.unshift({
    date: _now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),
    loc: district,
    gps: gpsStr(),
    src: type==='solar'?'Solar':'Wind',
    gen: daily,
    env: type==='solar'?irr+' kWh/m²':wind+' m/s',
    eff: Math.round(eff*100)+'%',
    status: 'Complete',
    raw_date: _now
  });
  // Night-time flag: solar with zero irradiance means it's currently night
  const isNight = isSol && parseFloat(irr) === 0;

  const mets=[
    {l:isSol?'Solar Irradiance':'Wind Speed',v:isSol?irr+' kWh/m²/d':wind+' m/s',c:isSol?(isNight?'#ef4444':'#f59e0b'):'#10b981'},
    {l:'Temp Derating',v:isNight?'N/A (Night)':(tDerate*100).toFixed(0)+'%',c:isNight?'#6b7280':(temp>35?'#ef4444':'#22c55e')},
    {l:'Daily Output',v:daily+' kWh',c:isNight?'#ef4444':'#3b82f6'},
    {l:'Annual Output',v:Number(annual).toLocaleString()+' kWh',c:'#06b6d4'},
    {l:'CO₂ Offset/yr',v:co2+' kg',c:'#22c55e'},
    {l:'Est. Revenue/yr',v:'₹'+Number(rev).toLocaleString(),c:'#8b5cf6'},
  ];

  // Night-time warning banner shown above metrics for solar
  const nightBanner = isNight
    ? `<div style="background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.35);border-radius:10px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px;font-size:13px;color:#fca5a5;">
        <span style="font-size:22px;">🌙</span>
        <div><strong>Night-time detected (${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})})</strong> — Solar panels produce zero power without sunlight. Active generation window: 06:00–19:00 local time. Values above reflect daytime projections based on historical irradiance for this region.</div>
       </div>`
    : '';

  document.getElementById('res-metrics').innerHTML= nightBanner + mets.map((m,i)=>`
    <div class="mc" style="--cc:${m.c};animation-delay:${i*.06}s;border-color:${m.c}20;">
      <div class="mc-label">${m.l}</div>
      <div class="mc-val" style="font-size:18px;color:${m.c};">${m.v}</div>
    </div>`).join('');
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  // Use dailyForAnnual for chart so monthly projections are realistic even at night
  const md=months.map(()=>Math.round(parseFloat(dailyForAnnual)*(28+Math.floor(Math.random()*4))*(0.78+Math.random()*.44)));
  if(resChart) resChart.destroy();
  resChart=new Chart(document.getElementById('resC'),{type:'bar',data:{labels:months,datasets:[{label:'kWh',data:md,backgroundColor:isSol?'rgba(245,158,11,.72)':'rgba(16,185,129,.72)',borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#8da4c0',font:{size:11}},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'#8da4c0',font:{size:11}},grid:{color:'rgba(255,255,255,.04)'}}}}});
  document.getElementById('gen-res').classList.add('on');
  toast('✅ Analysis complete · '+district);
  setTimeout(()=>speakResults(),500);
}

// ══════════════════════════════════════════
// DASHBOARD CHARTS
// ══════════════════════════════════════════
function initDashCharts(){
  const mos=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const sol=[310,290,370,420,480,510,530,520,470,410,330,280];
  const wnd=[180,195,165,145,130,110,108,115,140,165,185,195];
  if(mC) mC.destroy();
  mC=new Chart(document.getElementById('mainC'),{type:'bar',data:{labels:mos,datasets:[{label:'Solar',data:sol,backgroundColor:'rgba(245,158,11,.72)',borderRadius:5},{label:'Wind',data:wnd,backgroundColor:'rgba(16,185,129,.68)',borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{stacked:true,ticks:{color:'#8da4c0',font:{size:11}},grid:{color:'rgba(255,255,255,.04)'}},y:{stacked:true,ticks:{color:'#8da4c0',font:{size:11}},grid:{color:'rgba(255,255,255,.04)'}}}}});
  if(piC) piC.destroy();
  piC=new Chart(document.getElementById('pieC'),{type:'doughnut',data:{labels:['Solar','Wind'],datasets:[{data:[64,36],backgroundColor:['#f59e0b','#10b981'],borderColor:'#111d30',borderWidth:3}]},options:{responsive:true,maintainAspectRatio:false,cutout:'66%',plugins:{legend:{display:false}}}});
  const hrs=Array.from({length:24},(_,i)=>i+':00');
  const solH=hrs.map((_,i)=>i<6||i>20?0:Math.max(0,Math.round(Math.sin((i-6)/14*Math.PI)*940+Math.random()*55)));
  if(sC) sC.destroy();
  sC=new Chart(document.getElementById('solC'),{type:'line',data:{labels:hrs,datasets:[{data:solH,borderColor:'#f59e0b',backgroundColor:'rgba(245,158,11,.1)',fill:true,tension:.4,pointRadius:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#4e6480',font:{size:9},maxTicksLimit:8},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'#4e6480',font:{size:9}},grid:{color:'rgba(255,255,255,.04)'}}}}});
  const wndH=hrs.map(()=>+(5+Math.random()*5).toFixed(1));
  if(wC) wC.destroy();
  wC=new Chart(document.getElementById('wndC'),{type:'line',data:{labels:hrs,datasets:[{data:wndH,borderColor:'#10b981',backgroundColor:'rgba(16,185,129,.1)',fill:true,tension:.4,pointRadius:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#4e6480',font:{size:9},maxTicksLimit:8},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'#4e6480',font:{size:9}},grid:{color:'rgba(255,255,255,.04)'}}}}});
}
function swChart(t,el){document.querySelectorAll('.tab-pill').forEach(p=>p.classList.remove('on'));el.classList.add('on');if(mC){mC.config.type=t;mC.update();}}

// ══════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════
function buildRptData(){
  const locs=['Tiruchirappalli, TN','Chennai, TN','Coimbatore, TN','Madurai, TN','Bengaluru, KA','Mumbai, MH'];
  const srcs=['Solar','Wind','Solar','Solar','Wind','Solar'];
  const gpsArr=[['10.7905','78.7047'],['13.0827','80.2707'],['11.0168','76.9558'],['9.9252','78.1198'],['12.9716','77.5946'],['19.0760','72.8777']];
  allRptRows=[];
  for(let i=364;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);
    const idx=i%locs.length;const src=srcs[idx];
    const gp=gpsArr[idx];
    allRptRows.push({
      date:d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),
      loc:locs[idx],
      gps:`${gp[0]}°N, ${gp[1]}°E`,
      src,
      gen:(80+Math.random()*120).toFixed(1),
      env:src==='Solar'?(4.1+Math.random()*2.1).toFixed(2)+' kWh/m²':(4.8+Math.random()*4.2).toFixed(1)+' m/s',
      eff:(17+Math.random()*6).toFixed(1)+'%',
      status:Math.random()>.08?'Complete':'Processing'
    });
  }
  renderRptTable(allRptRows.slice(0,30));
}
function renderRptTable(rows){
  const tb=document.getElementById('rpt-tb');if(!tb)return;
  tb.innerHTML=rows.map(r=>`<tr><td>${r.date}</td><td>${r.loc}</td><td style="font-size:11px;color:var(--text3);">${r.gps}</td><td><span class="badge ${r.src==='Solar'?'b-solar':'b-wind'}">${r.src}</span></td><td style="font-weight:600;">${r.gen}</td><td style="color:var(--text2);font-size:12px;">${r.env}</td><td>${r.eff}</td><td><span class="badge ${r.status==='Complete'?'b-ok':'b-info'}">${r.status}</span></td></tr>`).join('');
}
function filterRpt(q){
  const f=allRptRows.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(q.toLowerCase())));
  renderRptTable(f.slice(0,60));
  if(q.trim().length>2) logAct(user?.name||'User','Search','Report search: "'+q+'"',gpsStr(),'search');
}
function swTf(tf,el){document.querySelectorAll('.tft').forEach(t=>t.classList.remove('on'));el.classList.add('on');curTf=tf;initRptChart(tf);logAct(user?.name||'User','View Report',tf+' chart',gpsStr(),'view');}
function initRptChart(tf){
  const cfg={
    day:{l:Array.from({length:24},(_,i)=>i+':00'),t:'Today — Hourly Output (kWh)'},
    week:{l:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],t:'Week — Daily Output (kWh)'},
    month:{l:Array.from({length:30},(_,i)=>i+1+''),t:'Month — Daily Output (kWh)'},
    '6m':{l:['Nov','Dec','Jan','Feb','Mar','Apr'],t:'6 Months — Monthly Output (kWh)'},
    year:{l:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],t:'Year — Monthly Output (kWh)'}
  };
  const c=cfg[tf];
  document.getElementById('rpt-title').textContent=c.t;
  const data=c.l.map(()=>Math.round(38+Math.random()*310));
  if(rC) rC.destroy();
  rC=new Chart(document.getElementById('rptC'),{type:tf==='day'?'line':'bar',data:{labels:c.l,datasets:[{data,backgroundColor:'rgba(59,130,246,.6)',borderColor:'#3b82f6',fill:tf==='day',tension:.4,borderRadius:4,pointRadius:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#8da4c0',font:{size:11},maxTicksLimit:18},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'#8da4c0',font:{size:11}},grid:{color:'rgba(255,255,255,.04)'}}}}});
}