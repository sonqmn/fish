import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js?v=ocean-breath-16114';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

const tabs=document.querySelectorAll('.login-tab');
const memberForm=document.querySelector('#member-login');
const guestPanel=document.querySelector('#guest-login');
const message=document.querySelector('#auth-message');
const modeTitle=document.querySelector('#auth-form-title');
const submitButton=document.querySelector('#auth-submit');
const modeToggle=document.querySelector('#auth-mode-toggle');
let signupMode=false;
let auth=null;

function setMessage(text,error=false){message.textContent=text;message.classList.toggle('error',error);}
function setSignupMode(value){signupMode=value;modeTitle.textContent=value?'회원가입':'회원 로그인';submitButton.textContent=value?'계정 만들기':'로그인하고 시작하기';modeToggle.innerHTML=value?'이미 계정이 있나요? <b>로그인</b>':'아직 회원이 아니신가요? <b>회원가입</b>';document.querySelector('#login-password').autocomplete=value?'new-password':'current-password';setMessage('');}
function friendlyError(error){const code=error?.code||'';if(code.includes('email-already-in-use'))return '이미 가입된 이메일입니다.';if(code.includes('invalid-credential'))return '이메일 또는 비밀번호가 맞지 않습니다.';if(code.includes('weak-password'))return '비밀번호는 6자 이상 입력해주세요.';if(code.includes('invalid-email'))return '올바른 이메일 주소를 입력해주세요.';return '로그인 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';}

tabs.forEach(tab=>tab.addEventListener('click',()=>{const member=tab.dataset.loginType==='member';tabs.forEach(item=>item.classList.toggle('active',item===tab));memberForm.classList.toggle('hidden',!member);guestPanel.classList.toggle('hidden',member);}));
modeToggle.addEventListener('click',()=>setSignupMode(!signupMode));
document.querySelector('#guest-enter').addEventListener('click',()=>{sessionStorage.setItem('badaon-user','guest');window.location.replace('index.html?mode=guest');});

if(isFirebaseConfigured){
  const app=initializeApp(firebaseConfig);
  auth=getAuth(app);
  onAuthStateChanged(auth,user=>{if(user&&sessionStorage.getItem('firebase-login-requested')==='yes'){sessionStorage.removeItem('firebase-login-requested');sessionStorage.setItem('badaon-user',user.email);window.location.replace('index.html');}});
}else{
  setMessage('Firebase 프로젝트 연결이 필요합니다. 아래 안내에 따라 설정해주세요.',true);
}

memberForm.addEventListener('submit',async event=>{event.preventDefault();if(!auth){setMessage('Firebase 설정이 아직 완료되지 않았습니다.',true);return;}const email=document.querySelector('#login-email').value.trim(),password=document.querySelector('#login-password').value;submitButton.disabled=true;setMessage(signupMode?'계정을 만들고 있어요.':'로그인 중입니다.');try{const result=signupMode?await createUserWithEmailAndPassword(auth,email,password):await signInWithEmailAndPassword(auth,email,password);sessionStorage.setItem('firebase-login-requested','yes');sessionStorage.setItem('badaon-user',result.user.email);window.location.replace('index.html');}catch(error){setMessage(friendlyError(error),true);}finally{submitButton.disabled=false;}});
