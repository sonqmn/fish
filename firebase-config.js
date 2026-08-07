export const firebaseConfig = {
  apiKey: 'AIzaSyBVDD4qGrrnptq2yr5AV5jgksnkr5LYmfI',
  authDomain: 'ocean-breathe-ce596.firebaseapp.com',
  projectId: 'ocean-breathe-ce596',
  storageBucket: 'ocean-breathe-ce596.firebasestorage.app',
  messagingSenderId: '15354827224',
  appId: '1:15354827224:web:f8f010b504c6e2add122ad'
};

export const isFirebaseConfigured = !Object.values(firebaseConfig).some(value => value.startsWith('YOUR_'));
