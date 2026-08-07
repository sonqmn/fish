export const firebaseConfig = {
  apiKey: 'AIzaSyAtkXpxvtCsV-8xbnCoqWaQOllV9vDqVWE',
  authDomain: 'ocean-breath-16114.firebaseapp.com',
  projectId: 'ocean-breath-16114',
  storageBucket: 'ocean-breath-16114.firebasestorage.app',
  messagingSenderId: '860364403667',
  appId: '1:860364403667:web:8827f14ec13302ab51b526'
};

export const isFirebaseConfigured = !Object.values(firebaseConfig).some(value => value.startsWith('YOUR_'));
