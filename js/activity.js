/* ══════════════════════════════════════════
   VoltEarth — Activity Log (activity.js)
   logAct, fake data seed, table render, filter
══════════════════════════════════════════ */

// ACTIVITY LOG
// ══════════════════════════════════════════
function logAct(name,action,detail,gps,cat){
  if(!name) return;
  const ini=(name||'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  allActRows.unshift({name,ini,action,detail:detail||'—',gps:gps||'—',ip:user?.ip||'Unknown',device:user?.device||'Browser',time:new Date(),cat:cat||'view',status:'Success'});
  if(allActRows.length>500) allActRows.pop();
  // ── Auto-save to Supabase DB ──
  if(user && action !== 'View Page') dbSaveActivity(name, action, detail, gps, cat);
}
function buildFakeActivityData(){
  const now=new Date();
  const FAKE_GPS_LIST=[
    {lat:'10.7905',lng:'78.7047',city:'Tiruchirappalli',state:'Tamil Nadu'},
    {lat:'13.0827',lng:'80.2707',city:'Chennai',state:'Tamil Nadu'},
    {lat:'12.9716',lng:'77.5946',city:'Bengaluru',state:'Karnataka'},
    {lat:'19.0760',lng:'72.8777',city:'Mumbai',state:'Maharashtra'},
    {lat:'17.3850',lng:'78.4867',city:'Hyderabad',state:'Telangana'},
  ];
  FAKE_USERS.forEach((u,ui)=>{
    const fg=FAKE_GPS_LIST[ui%FAKE_GPS_LIST.length];
    const gStr=`${fg.city}, ${fg.state}`;
    const loginT=new Date(now-Math.random()*3.6e6);
    allActRows.push({name:u.name,ini:u.name.split(' ').map(w=>w[0]).join('').slice(0,2),action:'Login',detail:'Session started',gps:gStr,ip:u.ip,device:u.device,time:loginT,cat:'auth',status:'Success'});
    for(let j=0;j<4+Math.floor(Math.random()*5);j++){
      const ac=ACTIONS[Math.floor(Math.random()*ACTIONS.length)];
      allActRows.push({name:u.name,ini:u.name.split(' ').map(w=>w[0]).join('').slice(0,2),action:ac.a,detail:ac.d,gps:gStr,ip:u.ip,device:u.device,time:new Date(loginT.getTime()+Math.random()*3.6e6),cat:ac.cat,status:'Success'});
    }
  });
  allActRows.sort((a,b)=>b.time-a.time);
}
function buildActUI(){
  const ll=document.getElementById('live-list');if(!ll)return;
  ll.innerHTML=FAKE_USERS.map((u,i)=>`
    <div class="arow" style="animation-delay:${i*.07}s">
      <div class="online-pip"></div>
      <div class="aavatar" style="background:linear-gradient(135deg,${u.colors[0]},${u.colors[1]});">${u.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
      <div class="ainfo">
        <div class="aname">${u.name}</div>
        <div class="adetail">${u.email} · ${u.device}</div>
      </div>
      <div style="text-align:right;">
        <div class="badge b-ok" style="font-size:10px;">Online</div>
        <div class="atime" style="margin-top:3px;">${u.ip}</div>
      </div>
    </div>`).join('');
  const fl=document.getElementById('feed-list');if(!fl)return;
  const catColors={auth:'b-ok',view:'b-info',download:'b-purple',search:'b-pink',generate:'b-solar',location:'b-wind'};
  const recent=allActRows.slice(0,10);
  fl.innerHTML=recent.map((a,i)=>`
    <div class="arow" style="animation-delay:${i*.05}s">
      <div class="aavatar" style="font-size:10px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);">${a.ini}</div>
      <div class="ainfo">
        <div class="aname" style="font-size:12.5px;">${a.name}</div>
        <div class="adetail">${a.detail}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
        <span class="badge ${catColors[a.cat]||'b-info'}" style="font-size:9.5px;">${a.action}</span>
        <span class="atime">${timeAgo(a.time)}</span>
      </div>
    </div>`).join('');
  renderActTable(allActRows.slice(0,50));
}
function renderActTable(rows){
  const tb=document.getElementById('act-tb');if(!tb)return;
  const catColors={auth:'b-ok',view:'b-info',download:'b-purple',search:'b-pink',generate:'b-solar',location:'b-wind'};
  tb.innerHTML=rows.map(r=>`
    <tr>
      <td><div style="display:flex;align-items:center;gap:7px;">
        <div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:700;flex-shrink:0;">${r.ini}</div>
        <div><div style="font-weight:600;font-size:12.5px;">${r.name}</div></div></div></td>
      <td><span class="badge ${catColors[r.cat]||'b-info'}">${r.action}</span></td>
      <td style="font-size:12px;color:var(--text2);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.detail}</td>
      <td style="font-size:11px;color:var(--text3);">${r.gps}</td>
      <td style="font-size:11px;color:var(--text3);">${r.ip}</td>
      <td style="font-size:11px;color:var(--text3);">${r.device}</td>
      <td style="font-size:11px;color:var(--text3);">${r.time.toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short'})}</td>
      <td><span class="badge b-ok" style="font-size:9.5px;">${r.status}</span></td>
    </tr>`).join('');
}
function filterAct(q){
  const f=allActRows.filter(r=>[r.name,r.action,r.detail,r.gps,r.ip,r.device].some(v=>String(v).toLowerCase().includes(q.toLowerCase())));
  renderActTable(f.slice(0,50));
}
function timeAgo(d){const s=Math.floor((new Date()-d)/1000);if(s<60)return s+'s ago';if(s<3600)return Math.floor(s/60)+'m ago';return Math.floor(s/3600)+'h ago';}