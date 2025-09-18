// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCn8Yg64jUZfQwhYeRa-sy1ZqSwrSpQMjY",
  authDomain: "ritd-pawprints.firebaseapp.com",
  projectId: "ritd-pawprints",
  storageBucket: "ritd-pawprints.firebasestorage.app",
  messagingSenderId: "575684413696",
  appId: "1:575684413696:web:1affedee83339025104be5",
  measurementId: "G-EEVFTJFNCQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };