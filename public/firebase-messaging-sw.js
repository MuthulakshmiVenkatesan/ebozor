importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');
// // Initialize the Firebase app in the service worker by passing the generated config

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAOvgF-CMtm2Z47S-4h8dPpTVYwaqtzwH0",
    authDomain: "bidnbuy-bee45.firebaseapp.com",
    projectId: "bidnbuy-bee45",
    storageBucket: "bidnbuy-bee45.firebasestorage.app",
    messagingSenderId: "36985304599",
    appId: "1:36985304599:web:74b2018374d83391d44e52",
    measurementId: "G-W6G8VQ2NJH"
  };

firebase?.initializeApp(firebaseConfig)

// Retrieve firebase messaging
const messaging = firebase.messaging();

self.addEventListener('install', function (event) {
    console.log('Hello world from the Service Worker :call_me_hand:');
});


