import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB2kdqCZkEhgyRhrm3aHL_N1NftVQdPHmQ",
  authDomain: "ecoapp-927a6.firebaseapp.com",
  projectId: "ecoapp-927a6",
  storageBucket: "ecoapp-927a6.firebasestorage.app",
  messagingSenderId: "573569887590",
  appId: "1:573569887590:web:e7965c393a5e2bdcc0eca7",
  measurementId: "G-62DZCFWT1Y"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { firebaseConfig, app };
