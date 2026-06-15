/* ══════════════════════════════════════════
   VoltEarth — Dashboard Charts (charts.js)
   Chart.js configs for all dashboard graphs
══════════════════════════════════════════ */

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