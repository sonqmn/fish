import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js?v=ocean-breath-16114';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

let auth=null;
if(isFirebaseConfigured){
  const app=initializeApp(firebaseConfig);
  auth=getAuth(app);
  onAuthStateChanged(auth,user=>{
    if(user){sessionStorage.setItem('badaon-user',user.email);const email=document.querySelector('#profile-email');if(email)email.textContent=user.email;}
  });
}

window.firebaseLogout=async function(){
  try{if(auth)await signOut(auth);}finally{sessionStorage.removeItem('badaon-user');window.location.replace('login.html');}
};
