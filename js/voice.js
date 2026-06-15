/* ══════════════════════════════════════════
   VoltEarth — Voice & TTS Module (voice.js)
   Web Speech API, voice commands
══════════════════════════════════════════ */

// VOICE / TTS
// ══════════════════════════════════════════
function toggleVoice(){
  voiceOpen=!voiceOpen;
  const panel=document.getElementById('vpanel'),fab=document.getElementById('vfab');
  panel.classList.toggle('on',voiceOpen);
  fab.textContent=voiceOpen?'✕':'🎙';
  if(!voiceOpen&&window.speechSynthesis) window.speechSynthesis.cancel();
}
function speak(txt){
  if(!window.speechSynthesis){toast('⚠️ Speech not supported');return;}
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(txt);
  u.lang='en-IN';u.rate=.93;u.pitch=1.04;u.volume=1;
  document.getElementById('vtxt').textContent=txt;
  document.getElementById('vstatus').textContent='Speaking…';
  document.getElementById('vstatus').className='badge b-solar';
  document.getElementById('vfab').classList.add('active');
  u.onend=()=>{
    document.getElementById('vstatus').textContent='Ready';
    document.getElementById('vstatus').className='badge b-purple';
    document.getElementById('vfab').classList.remove('active');
  };
  window.speechSynthesis.speak(u);
}
function vcmd(cmd){
  const city=gpsCity(),state=gpsData.state,loc=gpsStr();
  const tempV=document.getElementById('temp-in')?.value||'28';
  const t=parseFloat(tempV);
  document.getElementById('vpanel').classList.add('on');voiceOpen=true;
  if(cmd==='temp'){
    const desc=t<15?'cold':t<25?'comfortable':t<33?'warm':t<40?'hot':'extremely hot';
    const feels=Math.round(t*1.07+1.5);
    const impact=t>35?`High temperature is reducing solar panel efficiency by approximately ${Math.round((t-25)*0.45)} percent.`:`Temperature is within optimal range for renewable energy generation.`;
    speak(`The ambient temperature at ${city}, ${state} is ${t} degrees Celsius. Conditions are ${desc}, with a feels-like temperature of ${feels} degrees. ${impact}`);
  } else if(cmd==='location'){
    const method=gpsData.method||'manual selection';
    const coords = gpsData.method === 'GPS' && gpsData.lat ? `Coordinates are ${gpsData.lat} degrees North and ${gpsData.lng} degrees East.` : '';
    speak(`Your location is set to ${city}, ${state}, ${gpsData.country} via ${method}. ${coords} This location is being used for your energy generation analysis.`);
  } else if(cmd==='solar'){
    const irr=document.getElementById('m-sol')?.textContent||'5.8';
    speak(`Solar irradiance is ${irr} kilowatt hours per square metre per day. This is ${parseFloat(irr)>5?'above':'below'} the Indian average, making this location ${parseFloat(irr)>5?'highly suitable':'moderately suitable'} for solar installation.`);
  } else if(cmd==='wind'){
    const ws=document.getElementById('m-wind')?.textContent||'7.2';
    speak(`Average wind speed is ${ws} metres per second. This ${parseFloat(ws)>6?'exceeds':'is close to'} the minimum threshold for commercial wind turbine operation.`);
  } else if(cmd==='summary'){
    const irr=document.getElementById('m-sol')?.textContent||'5.8';
    const ws=document.getElementById('m-wind')?.textContent||'7.2';
    speak(`VoltEarth dashboard summary. Location: ${city}, ${state}. Temperature is ${t} degrees Celsius. Solar irradiance is ${irr} kilowatt hours per square metre per day. Wind speed is ${ws} metres per second. Estimated annual output is 48.3 megawatt hours. Carbon dioxide offset is 34.1 tonnes per year.`);
  }
  logAct(user?.name||'User','Voice Command',cmd+' at '+city,loc,'view');
}
function speakResults(){
  if(!lastResult) return;
  const r=lastResult;
  const src=r.type==='solar'?'solar photovoltaic':'wind turbine';
  speak(`Energy analysis complete for ${r.district}. Using a ${src} system of ${r.sz} kilowatts at ${r.temp} degrees Celsius. ${r.type==='solar'?'Solar irradiance is '+r.irr+' kilowatt hours per square metre per day.':'Wind speed is '+r.wind+' metres per second.'} Daily generation potential is ${r.daily} kilowatt hours. Annual output estimate is ${Number(r.annual).toLocaleString()} kilowatt hours. Carbon dioxide offset is ${r.co2} kilograms per year. Estimated annual revenue is rupees ${Number(r.rev).toLocaleString()}.`);
  document.getElementById('vpanel').classList.add('on');voiceOpen=true;
}
function speakReport(){
  const tf=curTf;
  const cut=tf==='day'?1:tf==='week'?7:tf==='month'?30:tf==='6m'?180:365;
  const rows=allRptRows.slice(0,cut);
  const total=rows.reduce((a,r)=>a+parseFloat(r.gen),0).toFixed(0);
  const avg=(parseFloat(total)/Math.max(rows.length,1)).toFixed(1);
  speak(`Report summary for ${tf} period. Total energy generated is ${Number(total).toLocaleString()} kilowatt hours across ${rows.length} records. Average output is ${avg} kilowatt hours per day. ${rows.filter(r=>r.src==='Solar').length} solar records and ${rows.filter(r=>r.src==='Wind').length} wind records.`);
  document.getElementById('vpanel').classList.add('on');voiceOpen=true;
}