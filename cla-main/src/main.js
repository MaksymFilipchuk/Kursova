import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAWNcQgvmMGTtfOozb_c85rBIE2ZpPxMkw",
  authDomain: "kursova-f1c66.firebaseapp.com",
  projectId: "kursova-f1c66",
  storageBucket: "kursova-f1c66.appspot.com",
  messagingSenderId: "960703904315",
  appId: "1:960703904315:web:de376057cb23f2eb07fa1e"
};

initializeApp(firebaseConfig);

const app = createApp(App)

app.use(router);

app.config.globalProperties.$loading = 'lazy';

app.mount('#app')
