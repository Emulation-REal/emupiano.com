const firebaseConfig = {
  apiKey: "AIzaSyAdy-R98rUg23ibhbYVNRZfUfeY4Uy7TPs",
  authDomain: "emupiano-4b7ac.firebaseapp.com",
  databaseURL: "https://emupiano-4b7ac-default-rtdb.firebaseio.com",
  projectId: "emupiano-4b7ac",
  storageBucket: "emupiano-4b7ac.firebasestorage.app",
  messagingSenderId: "1035222015142",
  appId: "1:1035222015142:web:ff34b888c86ed67cd36867",
  measurementId: "G-7NVMZMB8RH"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const pianoKeys = ['C','D','E','F','G','A','B'];
const piano = document.getElementById('piano');
const userList = document.getElementById('userList');
const messages = document.getElementById('messages');
let username = "User" + Math.floor(Math.random() * 1000);
let currentRoom = "lobby";
let usersRef, chatRef, pianoRef;
let isDark = true;
let mutedUsers = {};
let isOwner = false;

function joinRoom() {
  const room = document.getElementById('roomInput').value.trim();
  if (!room) return;
  if (usersRef) usersRef.off();
  if (chatRef) chatRef.off();
  if (pianoRef) pianoRef.off();
  currentRoom = room;
  isOwner = username === "Emulation12";

  usersRef = db.ref(`rooms/${room}/users`);
  chatRef = db.ref(`rooms/${room}/chat`);
  pianoRef = db.ref(`rooms/${room}/notes`);

  usersRef.on('value', snap => {
    const val = snap.val() || {};
    userList.innerHTML = "Users: " + Object.keys(val).join(", ");
  });

  chatRef.on('child_added', snap => {
    const { sender, message } = snap.val();
    if (!mutedUsers[sender]) {
      messages.innerHTML += `<div><b>${sender}:</b> ${message}</div>`;
      messages.scrollTop = messages.scrollHeight;
    }
  });

  pianoRef.on('child_added', snap => {
    const { note } = snap.val();
    playSound(note);
    const el = document.querySelector(`.key[data-note="${note}"]`);
    if (el) {
      el.classList.add("playing");
      setTimeout(() => el.classList.remove("playing"), 200);
    }
  });

  usersRef.child(username).set(true);
  usersRef.child(username).onDisconnect().remove();
}

function sendMessage() {
  const val = document.getElementById('input').value.trim();
  if (!val) return;
  chatRef.push({ sender: username, message: val });
  document.getElementById('input').value = "";
}

function sendNote(note) {
  pianoRef.push({ note });
}

function playSound(note) {
  const audio = new Audio(`https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/piano-mp3/${note}.mp3`);
  audio.play();
}

function buildPiano() {
  for (let note of pianoKeys) {
    const el = document.createElement('div');
    el.className = 'key';
    el.innerText = note;
    el.dataset.note = note;
    el.onclick = () => {
      sendNote(note);
    };
    piano.appendChild(el);
  }
}
buildPiano();

function toggleTheme() {
  isDark = !isDark;
  document.body.style.background = isDark ? "#111" : "#eee";
  document.body.style.color = isDark ? "white" : "black";
}

function kickUser() {
  if (!isOwner) return alert("Only Emulation12 can kick.");
  const name = prompt("Kick who?");
  if (name) db.ref(`rooms/${currentRoom}/users/${name}`).remove();
}

function muteUser() {
  const name = prompt("Mute who?");
  if (name) mutedUsers[name] = true;
}

function saveSong() {
  let song = [];
  pianoRef.once('value', snap => {
    snap.forEach(child => {
      song.push(child.val().note);
    });
    localStorage.setItem("savedSong", JSON.stringify(song));
    alert("Song saved!");
  });
}

function loadSong() {
  const song = JSON.parse(localStorage.getItem("savedSong") || "[]");
  let i = 0;
  const interval = setInterval(() => {
    if (i >= song.length) return clearInterval(interval);
    sendNote(song[i++]);
  }, 300);
}
