const screens = document.querySelectorAll('.screen');
const navItems = document.querySelectorAll('.nav-item');
function goTo(page) {
  screens.forEach(s => s.classList.toggle('active', s.id === page));
  navItems.forEach(n => n.classList.toggle('active', n.dataset.page === page));
  window.scrollTo({top:0, behavior:'smooth'});
  setTimeout(()=>{if(page==='alerts'&&alertsSeaMap)alertsSeaMap.invalidateSize();if(page==='report'&&reportMap)reportMap.invalidateSize();},120);
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
let reportMap,reportMarker,homeSeaMap,homeSeaMarker,alertsSeaMap,alertsSeaMarker,latestObservation=null;
let selectedSea={lat:35.2692,lng:129.2334,label:'기장군 일광면 앞바다'};
function setReportLocation(label,lat,lng){document.querySelector('#report-location').value=label;document.querySelector('#gps-map-label').textContent=label;if(reportMap&&lat!=null){if(reportMarker)reportMarker.setLatLng([lat,lng]);else reportMarker=L.marker([lat,lng]).addTo(reportMap);reportMap.setView([lat,lng],13);}}
function getLocation(){if(!navigator.geolocation){toast('이 기기에서는 GPS 위치를 지원하지 않습니다. 위치를 직접 입력해주세요.');return;}navigator.geolocation.getCurrentPosition(pos=>{const {latitude,longitude}=pos.coords;setReportLocation(`GPS 위치 · ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,latitude,longitude);toast('현재 GPS 위치가 반영되었습니다.');},()=>toast('위치 권한을 허용하거나 위치를 직접 입력해주세요.'),{enableHighAccuracy:true,timeout:10000});}
function addOsmTiles(map){L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);}
function coordinatesLabel(lat,lng){return `선택한 바다 · ${lat.toFixed(5)}, ${lng.toFixed(5)}`;}
function chooseSeaLocation(lat,lng,label=coordinatesLabel(lat,lng)){selectedSea={lat,lng,label};sessionStorage.setItem('ocean-selected-sea',JSON.stringify(selectedSea));document.querySelector('#selected-sea-label').textContent=label;document.querySelector('#alerts-location-label').textContent=label;document.querySelector('#farm-context').innerHTML=`선택한 바다 위치 반경 5km를 분석해<br/>물고기 폐사 위험을 조기에 알려드립니다.`;if(homeSeaMarker)homeSeaMarker.setLatLng([lat,lng]);else homeSeaMarker=L.marker([lat,lng]).addTo(homeSeaMap);homeSeaMap.panTo([lat,lng]);if(alertsSeaMarker)alertsSeaMarker.setLatLng([lat,lng]);else if(alertsSeaMap)alertsSeaMarker=L.marker([lat,lng]).addTo(alertsSeaMap);if(alertsSeaMap)alertsSeaMap.setView([lat,lng],13);renderSelectedTemperature();}
function initSeaMaps(){if(!window.L)return;const saved=sessionStorage.getItem('ocean-selected-sea');if(saved){try{selectedSea=JSON.parse(saved);}catch(_){}}homeSeaMap=L.map('home-sea-map').setView([selectedSea.lat,selectedSea.lng],12);addOsmTiles(homeSeaMap);homeSeaMarker=L.marker([selectedSea.lat,selectedSea.lng]).addTo(homeSeaMap);homeSeaMap.on('click',e=>{chooseSeaLocation(e.latlng.lat,e.latlng.lng);toast('이 바다 위치를 선택했습니다.');});alertsSeaMap=L.map('alerts-sea-map',{zoomControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false}).setView([selectedSea.lat,selectedSea.lng],13);addOsmTiles(alertsSeaMap);alertsSeaMarker=L.marker([selectedSea.lat,selectedSea.lng]).addTo(alertsSeaMap);document.querySelector('#selected-sea-label').textContent=selectedSea.label;document.querySelector('#alerts-location-label').textContent=selectedSea.label;}
function selectMySeaLocation(){if(!navigator.geolocation){toast('이 기기에서는 GPS를 지원하지 않습니다.');return;}navigator.geolocation.getCurrentPosition(pos=>{chooseSeaLocation(pos.coords.latitude,pos.coords.longitude,`내 위치 주변 바다 · ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);toast('내 위치 주변을 선택했습니다.');},()=>toast('위치 권한을 허용해주세요.'),{enableHighAccuracy:true,timeout:10000});}
function openAlerts(){goTo('alerts');setTimeout(()=>{alertsSeaMap?.invalidateSize();alertsSeaMap?.setView([selectedSea.lat,selectedSea.lng],13);},180);}
function initReportMap(){if(!window.L)return;reportMap=L.map('report-map').setView([selectedSea.lat,selectedSea.lng],12);addOsmTiles(reportMap);reportMap.on('click',event=>{const {lat,lng}=event.latlng;setReportLocation(`지도 선택 · ${lat.toFixed(5)}, ${lng.toFixed(5)}`,lat,lng);toast('지도에서 발생 위치를 지정했습니다.');});}
function toggleNotifications(){document.querySelector('#notification-panel').classList.toggle('hidden');document.querySelector('#account-panel').classList.add('hidden');}
function toggleAccount(){document.querySelector('#account-panel').classList.toggle('hidden');document.querySelector('#notification-panel').classList.add('hidden');}
const guestMode=new URLSearchParams(window.location.search).get('mode')==='guest';
if(guestMode)sessionStorage.setItem('badaon-user','guest');
const signedInUser=sessionStorage.getItem('badaon-user');
if(!signedInUser){window.location.replace('login.html');}else{const label=signedInUser==='guest'?'방문자':signedInUser;document.querySelector('#welcome-title').innerHTML=`안녕하세요, ${label} 님<br /><strong>${signedInUser==='guest'?'우리 바다의 안전을 확인하세요.':'오늘도 안전 양식하세요.'}</strong>`;document.querySelector('#account-name').textContent=label;}
function logout(){document.querySelector('#account-panel').classList.add('hidden');sessionStorage.removeItem('badaon-user');window.location.replace('login.html');}
document.querySelector('#report-form').addEventListener('submit',e=>{e.preventDefault();const missing=[];if(!document.querySelector('#report-location').value.trim())missing.push('발생 위치');if(!document.querySelector('#report-description').value.trim())missing.push('제보 내용');if(!document.querySelector('#report-image').files.length)missing.push('사진 첨부');if(missing.length){toast(`${missing.join(', ')} 항목을 입력하거나 첨부해주세요.`);return;}toast('제보가 접수되었습니다. 확인 후 안내드릴게요.');e.target.reset();document.querySelector('#report-photo-label').textContent='사진 추가하기';document.querySelector('#gps-map-label').textContent='지도를 눌러 위치 지정';});
document.querySelector('#report-image').addEventListener('change',e=>{const n=e.target.files.length;document.querySelector('#report-photo-label').textContent=n?`${n}장 선택됨`:'사진 추가하기';if(n)toast(`${n}장의 사진이 첨부되었습니다.`);});

function updateRisk(temp){const card=document.querySelector('#ai-zone-status'),label=document.querySelector('#zone-risk-label'),text=document.querySelector('#zone-risk-text'),score=document.querySelector('#zone-score'),risk=document.querySelector('#water-temp-risk');card.className='ai-zone-status';if(temp==null){label.textContent='관측 대기';text.innerHTML='공식 수온을 받는 즉시<br/>위험도를 분석합니다.';score.innerHTML='–';risk.textContent='관측 대기';return;}if(temp>=28){card.classList.add('danger');label.textContent='매우위험';text.innerHTML='고수온이 폐사 위험 기준에 가까워<br/>즉시 산소·먹이 관리를 권장합니다.';score.innerHTML='24<small>/100</small>';risk.textContent='매우위험';}else if(temp>=25){card.classList.add('warning');label.textContent='위험';text.innerHTML='수온 상승이 감지되어<br/>양식장 환경 확인이 필요합니다.';score.innerHTML='52<small>/100</small>';risk.textContent='위험';}else{card.classList.add('safe');label.textContent='양호';text.innerHTML='현재 양식장 주변 환경은 안정적이에요.<br/>수온·바람·적조 지수를 계속 관찰 중입니다.';score.innerHTML='82<small>/100</small>';risk.textContent='양호';}}
function renderSelectedTemperature(){const temp=latestObservation?.temperature;if(Number.isFinite(temp)){document.querySelector('#alerts-risk-title').textContent=temp>=28?'매우 높은 수온입니다':temp>=25?'수온 상승에 주의하세요':'현재 수온은 안정적입니다';document.querySelector('#alerts-temp-detail').textContent=`${selectedSea.label} · 인근 ${latestObservation.station||'공식 관측소'} ${temp}°C`;document.querySelector('#chart-current-temp').textContent=`최근 7일 · 현재 ${temp}°C`;document.querySelector('#temp-axis-high').textContent=`${Math.ceil(temp+3)}°C`;document.querySelector('#temp-axis-mid').textContent=`${Math.round(temp)}°C`;document.querySelector('#temp-axis-low').textContent=`${Math.floor(temp-3)}°C`;}else{document.querySelector('#alerts-risk-title').textContent='공식 수온 관측 대기 중';document.querySelector('#alerts-temp-detail').textContent=`${selectedSea.label} 인근 관측값을 확인하고 있습니다.`;document.querySelector('#chart-current-temp').textContent='최근 7일 · 관측 대기';}}
async function loadLiveMarineData(){try{const r=await fetch('data/latest.json?ts='+Date.now()),d=await r.json(),temp=Number(d.temperature);latestObservation={...d,temperature:Number.isFinite(temp)?temp:null};document.querySelector('#live-station').textContent=d.station||'공식 해양 관측소';document.querySelector('#live-updated').textContent=`${d.source||'공식 데이터'} · ${d.updatedAt?new Date(d.updatedAt).toLocaleString('ko-KR'):'갱신 대기 중'}`;document.querySelector('#live-summary').innerHTML=Number.isFinite(temp)?`현재 수온 <b>${temp}°C</b> · 선택 위치 인근 공식 관측값`:(d.status||'관측값 갱신 대기 중입니다.');document.querySelector('#water-temp-value').textContent=Number.isFinite(temp)?`현재 ${temp}°C · ${d.station||'관측소'}`:'공식 수온 연결 중';updateRisk(Number.isFinite(temp)?temp:null);renderSelectedTemperature();}catch(_){document.querySelector('#live-summary').textContent='공식 관측 데이터 연결을 준비 중입니다.';updateRisk(null);renderSelectedTemperature();}}
initSeaMaps();initReportMap();loadLiveMarineData();
