/* ══════════════════════════════════════════
   VoltEarth — Helpers & Init (helpers.js)
   Toast, Loader, DOMContentLoaded init
══════════════════════════════════════════ */

// HELPERS
// ══════════════════════════════════════════
function showLoader(msg){
  document.getElementById('ltxt').textContent=msg||'Loading…';
  document.getElementById('loader').classList.add('on');
}
function hideLoader(){document.getElementById('loader').classList.remove('on');}
function toast(msg){
  const t=document.getElementById('toast');
  t.style.display='flex';t.textContent=msg;t.classList.remove('toast-hide');
  clearTimeout(t._t);
  t._t=setTimeout(()=>{t.classList.add('toast-hide');setTimeout(()=>t.style.display='none',350);},3400);
}
document.getElementById('dl-modal').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal();});

window.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('sel-c').value='IN';
  updStates();
});