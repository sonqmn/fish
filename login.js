const tabs=document.querySelectorAll('.login-tab');
const memberForm=document.querySelector('#member-login');
const guestPanel=document.querySelector('#guest-login');
tabs.forEach(tab=>tab.addEventListener('click',()=>{const member=tab.dataset.loginType==='member';tabs.forEach(item=>item.classList.toggle('active',item===tab));memberForm.classList.toggle('hidden',!member);guestPanel.classList.toggle('hidden',member);}));
memberForm.addEventListener('submit',event=>{event.preventDefault();const id=document.querySelector('#login-id').value.trim();if(!id)return;sessionStorage.setItem('badaon-user',id);window.location.replace('index.html');});
document.querySelector('#guest-enter').addEventListener('click',()=>{sessionStorage.setItem('badaon-user','guest');window.location.replace('index.html?mode=guest');});
document.querySelector('.join-link').addEventListener('click',()=>alert('회원가입 기능은 준비 중입니다.'));
