const screens = document.querySelectorAll('.screen');
const navItems = document.querySelectorAll('.nav-item');
function goTo(page) {
  screens.forEach(s => s.classList.toggle('active', s.id === page));
  navItems.forEach(n => n.classList.toggle('active', n.dataset.page === page));
  window.scrollTo({top:0, behavior:'smooth'});
}
const photoInput = document.querySelector('#photo-input');
photoInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  document.querySelector('#preview').src = URL.createObjectURL(file);
  document.querySelector('#upload-state').classList.add('hidden');
  document.querySelector('#result-state').classList.remove('hidden');
});
function showDemoDiagnosis() {
  document.querySelector('#preview').src = 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?auto=format&fit=crop&w=800&q=80';
  document.querySelector('#upload-state').classList.add('hidden');
  document.querySelector('#result-state').classList.remove('hidden');
}
function resetDiagnosis() {
  photoInput.value = '';
  document.querySelector('#result-state').classList.add('hidden');
  document.querySelector('#upload-state').classList.remove('hidden');
}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600)}
function setReportLocation(label){document.querySelector('#report-location').value=label;document.querySelector('#gps-map-label').textContent=label;}
function getLocation(){if(!navigator.geolocation){toast('이 기기에서는 GPS 위치를 지원하지 않습니다. 위치를 직접 입력해주세요.');return;}navigator.geolocation.getCurrentPosition(pos=>{const {latitude,longitude}=pos.coords;setReportLocation(`GPS 위치 · ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);toast('현재 GPS 위치가 반영되었습니다.');},()=>toast('위치 권한을 허용하거나 위치를 직접 입력해주세요.'),{enableHighAccuracy:true,timeout:10000});}
function toggleNotifications(){document.querySelector('#notification-panel').classList.toggle('hidden');document.querySelector('#account-panel').classList.add('hidden');}
function toggleAccount(){document.querySelector('#account-panel').classList.toggle('hidden');document.querySelector('#notification-panel').classList.add('hidden');}
const guestMode=new URLSearchParams(window.location.search).get('mode')==='guest';
if(guestMode)sessionStorage.setItem('badaon-user','guest');
const signedInUser=sessionStorage.getItem('badaon-user');
if(!signedInUser){window.location.replace('login.html');}else{const label=signedInUser==='guest'?'방문자':signedInUser;document.querySelector('#welcome-title').innerHTML=`안녕하세요, ${label} 님<br /><strong>${signedInUser==='guest'?'우리 바다의 안전을 확인하세요.':'오늘도 안전 양식하세요.'}</strong>`;document.querySelector('#account-name').textContent=label;}
function logout(){document.querySelector('#account-panel').classList.add('hidden');sessionStorage.removeItem('badaon-user');window.location.replace('login.html');}
document.querySelector('#gps-map').addEventListener('click',event=>{const map=event.currentTarget;const rect=map.getBoundingClientRect();const x=((event.clientX-rect.left)/rect.width*100).toFixed(0);const y=((event.clientY-rect.top)/rect.height*100).toFixed(0);setReportLocation(`지도 지정 위치 · 해역 지점 ${x}%, ${y}%`);toast('지도에서 발생 위치를 지정했습니다.');});
document.querySelector('#report-form').addEventListener('submit',e=>{e.preventDefault();const missing=[];if(!document.querySelector('#report-location').value.trim())missing.push('발생 위치');if(!document.querySelector('#report-description').value.trim())missing.push('제보 내용');if(!document.querySelector('#report-image').files.length)missing.push('사진 첨부');if(missing.length){toast(`${missing.join(', ')} 항목을 입력하거나 첨부해주세요.`);return;}toast('제보가 접수되었습니다. 확인 후 안내드릴게요.');e.target.reset();document.querySelector('#report-photo-label').textContent='사진 추가하기';document.querySelector('#gps-map-label').textContent='지도를 눌러 위치 지정';});
document.querySelector('#report-image').addEventListener('change',e=>{const n=e.target.files.length;document.querySelector('#report-photo-label').textContent=n?`${n}장 선택됨`:'사진 추가하기';if(n)toast(`${n}장의 사진이 첨부되었습니다.`);});

async function loadLiveMarineData(){try{const r=await fetch('data/latest.json?ts='+Date.now()),d=await r.json();document.querySelector('#live-station').textContent=d.station||'공식 해양 관측소';document.querySelector('#live-updated').textContent=`${d.source||'공식 데이터'} · ${d.updatedAt?new Date(d.updatedAt).toLocaleString('ko-KR'):'갱신 대기 중'}`;document.querySelector('#live-summary').innerHTML=d.temperature!=null?`현재 수온 <b>${d.temperature}°C</b> · 공식 관측값`:(d.status||'관측값 갱신 대기 중입니다.');}catch(_){document.querySelector('#live-summary').textContent='공식 관측 데이터 연결을 준비 중입니다.';}}loadLiveMarineData();
