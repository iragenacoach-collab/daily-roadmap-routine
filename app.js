import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let isSignup = false;
let currentUser = null;
let currentDayData = null;

const $ = (id) => document.getElementById(id);

const authScreen = $("authScreen");
const dashboard = $("dashboard");
const authForm = $("authForm");
const nameInput = $("nameInput");
const emailInput = $("emailInput");
const passwordInput = $("passwordInput");
const authSubmit = $("authSubmit");
const authMessage = $("authMessage");
const loginTab = $("loginTab");
const signupTab = $("signupTab");
const resetPasswordBtn = $("resetPasswordBtn");
const logoutBtn = $("logoutBtn");
const todayDate = $("todayDate");
const welcomeTitle = $("welcomeTitle");
const userRole = $("userRole");
const adminNav = $("adminNav");
const adminEmailText = $("adminEmailText");

const dayType = $("dayType");
const generateAgendaBtn = $("generateAgendaBtn");
const taskList = $("taskList");
const completionScore = $("completionScore");
const addTaskForm = $("addTaskForm");
const newTaskTime = $("newTaskTime");
const newTaskTitle = $("newTaskTitle");
const dailyComment = $("dailyComment");
const saveCommentBtn = $("saveCommentBtn");
const saveStatus = $("saveStatus");
const resetTodayBtn = $("resetTodayBtn");

const routineTimeline = $("routineTimeline");
const channelList = $("channelList");
const addChannelIdeaForm = $("addChannelIdeaForm");
const channelSelect = $("channelSelect");
const ideaTitle = $("ideaTitle");
const ideaNotes = $("ideaNotes");
const rulesList = $("rulesList");
const usersCount = $("usersCount");
const usersList = $("usersList");

const todayKey = () => new Date().toISOString().split("T")[0];

const formatDate = () => {
  const d = new Date();
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
};

const baseRoutine = [
  { time: "23:00", title: "Sleep. Protect tomorrow by ending today on time." },
  { time: "05:00", title: "Wake up. No excuses. No scrolling first." },
  { time: "05:05", title: "Pray for 10 minutes. Ask for strength, discipline, and wisdom." },
  { time: "05:15", title: "Brainstorm today's mission and write the most important tasks." },
  { time: "05:45", title: "Research content ideas for 3 global YouTube channels." },
  { time: "06:30", title: "Sport: push-ups, stretching, and body activation." },
  { time: "07:00", title: "Prepare for university/class when class exists." },
  { time: "08:00", title: "Class / study block." },
  { time: "12:30", title: "Cook, eat, refresh, and prepare for the next block." },
  { time: "17:00", title: "Return from class or finish main school block." },
  { time: "18:00", title: "Editing / content production / deep work." },
  { time: "20:00", title: "Cook dinner, eat, clean, and organize tomorrow." },
  { time: "22:30", title: "Review checklist, comment, plan tomorrow, no phone distractions." },
  { time: "23:00", title: "Sleep again. The system repeats." }
];

const classDayTasks = [
  { time: "05:00", title: "Wake up at 5:00 AM", done: false },
  { time: "05:05", title: "Pray for 10 minutes", done: false },
  { time: "05:15", title: "Brainstorm today’s tasks and discipline mission", done: false },
  { time: "05:45", title: "Research content for 3 global YouTube channels", done: false },
  { time: "06:30", title: "Do push-ups / sport", done: false },
  { time: "07:00", title: "Prepare for university", done: false },
  { time: "08:00", title: "Attend class / study seriously", done: false },
  { time: "12:30", title: "Cook, eat, refresh, and return to class if needed", done: false },
  { time: "17:00", title: "Finish class and return home", done: false },
  { time: "18:00", title: "Edit videos / create content", done: false },
  { time: "20:00", title: "Cook dinner and eat", done: false },
  { time: "22:30", title: "Review the day and write comment", done: false },
  { time: "23:00", title: "Sleep at 11:00 PM", done: false }
];

const freeDayTasks = [
  { time: "05:00", title: "Wake up at 5:00 AM", done: false },
  { time: "05:05", title: "Pray for 10 minutes", done: false },
  { time: "05:15", title: "Brainstorm today’s mission", done: false },
  { time: "05:45", title: "Research content for 3 global YouTube channels", done: false },
  { time: "06:30", title: "Do push-ups / sport", done: false },
  { time: "07:00", title: "Deep work block 1: YouTube scripts/research", done: false },
  { time: "10:00", title: "Deep work block 2: editing or website/project build", done: false },
  { time: "12:30", title: "Cook, eat, rest shortly", done: false },
  { time: "14:00", title: "Skill improvement / coding / business research", done: false },
  { time: "17:00", title: "Review money plan and content progress", done: false },
  { time: "18:00", title: "Editing / content production", done: false },
  { time: "20:00", title: "Cook dinner and eat", done: false },
  { time: "22:30", title: "Review the day and plan tomorrow", done: false },
  { time: "23:00", title: "Sleep at 11:00 PM", done: false }
];

const disciplineRules = [
  {
    title: "Avoid dating for 3 years",
    text: "Protect your focus. No chasing relationships while building your future."
  },
  {
    title: "Avoid useless status posts",
    text: "No memes or emotional status updates. Post only for very important birthdays or serious purpose."
  },
  {
    title: "Work on YouTube until $100K in 3 years",
    text: "Your content system is the mission. Learn, publish, improve, repeat."
  },
  {
    title: "Avoid too much talking",
    text: "Reduce unnecessary conversations. Your words must match your goals."
  },
  {
    title: "Avoid useless groups",
    text: "Do not stay in groups that waste time, distract you, or weaken discipline."
  },
  {
    title: "Live privately",
    text: "Appear for a short time, work deeply, and let results speak."
  },
  {
    title: "Control emotions",
    text: "Do not let feelings decide your future. Use discipline before emotion."
  }
];

const defaultChannels = [
  { name: "Channel 1", focus: "Global AI tools and beginner digital skills", ideas: [] },
  { name: "Channel 2", focus: "Money mindset, discipline, and practical growth", ideas: [] },
  { name: "Channel 3", focus: "Content systems, productivity, and online income learning", ideas: [] }
];

function setMode(signup) {
  isSignup = signup;
  nameInput.classList.toggle("hidden", !signup);
  authSubmit.textContent = signup ? "Create Account" : "Login";
  signupTab.classList.toggle("active", signup);
  loginTab.classList.toggle("active", !signup);
  authMessage.textContent = "";
}

loginTab.addEventListener("click", () => setMode(false));
signupTab.addEventListener("click", () => setMode(true));

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authMessage.textContent = "Processing...";

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const name = nameInput.value.trim();

  try {
    if (isSignup) {
      if (!name) throw new Error("Please enter your full name.");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        email,
        role: email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? "admin" : "user",
        createdAt: serverTimestamp()
      });
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    authMessage.textContent = "Success.";
  } catch (error) {
    authMessage.textContent = cleanFirebaseError(error.message);
  }
});

resetPasswordBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  if (!email) {
    authMessage.textContent = "Enter your email first, then click forgot password.";
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    authMessage.textContent = "Password reset email sent.";
  } catch (error) {
    authMessage.textContent = cleanFirebaseError(error.message);
  }
});

logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    authScreen.classList.add("hidden");
    dashboard.classList.remove("hidden");
    await ensureUserDoc(user);
    await loadUserData();
    renderAll();
  } else {
    dashboard.classList.add("hidden");
    authScreen.classList.remove("hidden");
  }
});

async function ensureUserDoc(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      name: user.displayName || "User",
      email: user.email,
      role: user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? "admin" : "user",
      createdAt: serverTimestamp()
    });
  }
}

async function loadUserData() {
  const dayRef = doc(db, "users", currentUser.uid, "days", todayKey());
  const daySnap = await getDoc(dayRef);

  if (!daySnap.exists()) {
    currentDayData = {
      date: todayKey(),
      dayType: "class",
      tasks: classDayTasks,
      comment: "",
      channels: defaultChannels,
      updatedAt: new Date().toISOString()
    };
    await setDoc(dayRef, currentDayData);
  } else {
    currentDayData = daySnap.data();
    if (!currentDayData.channels) currentDayData.channels = defaultChannels;
    if (!currentDayData.tasks) currentDayData.tasks = classDayTasks;
  }
}

async function saveDayData() {
  const dayRef = doc(db, "users", currentUser.uid, "days", todayKey());
  currentDayData.updatedAt = new Date().toISOString();
  await setDoc(dayRef, currentDayData, { merge: true });
}

function renderAll() {
  todayDate.textContent = formatDate();
  welcomeTitle.textContent = `Welcome back, ${currentUser.displayName || "Builder"}`;
  const admin = isAdmin();
  userRole.textContent = admin ? "Admin Mode" : "User Mode";
  adminNav.style.display = admin ? "block" : "none";
  dayType.value = currentDayData.dayType || "class";
  dailyComment.value = currentDayData.comment || "";
  adminEmailText.textContent = ADMIN_EMAIL;
  renderTasks();
  renderRoutine();
  renderChannels();
  renderRules();
  if (admin) loadAdminData();
}

function renderTasks() {
  taskList.innerHTML = "";
  currentDayData.tasks.forEach((task, index) => {
    const div = document.createElement("div");
    div.className = `task ${task.done ? "done" : ""}`;
    div.innerHTML = `
      <input class="check" type="checkbox" ${task.done ? "checked" : ""} />
      <div class="task-time">${escapeHTML(task.time || "--")}</div>
      <div class="task-title">${escapeHTML(task.title)}</div>
      <button class="delete-task">Delete</button>
    `;

    div.querySelector(".check").addEventListener("change", async (e) => {
      currentDayData.tasks[index].done = e.target.checked;
      await saveDayData();
      renderTasks();
    });

    div.querySelector(".delete-task").addEventListener("click", async () => {
      currentDayData.tasks.splice(index, 1);
      await saveDayData();
      renderTasks();
    });

    taskList.appendChild(div);
  });

  updateScore();
}

function updateScore() {
  const total = currentDayData.tasks.length || 1;
  const done = currentDayData.tasks.filter(t => t.done).length;
  const percent = Math.round((done / total) * 100);
  completionScore.textContent = `${percent}%`;
}

generateAgendaBtn.addEventListener("click", async () => {
  const type = dayType.value;
  currentDayData.dayType = type;

  if (type === "class") {
    currentDayData.tasks = structuredClone(classDayTasks);
  } else if (type === "free") {
    currentDayData.tasks = structuredClone(freeDayTasks);
  } else {
    currentDayData.tasks = [
      { time: "05:00", title: "Wake up and protect the day", done: false },
      { time: "05:05", title: "Pray for 10 minutes", done: false },
      { time: "05:30", title: "Write custom agenda for this specific day", done: false },
      { time: "23:00", title: "Sleep at 11:00 PM", done: false }
    ];
  }

  await saveDayData();
  renderTasks();
});

addTaskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  currentDayData.tasks.push({
    time: newTaskTime.value.trim() || "--",
    title: newTaskTitle.value.trim(),
    done: false
  });
  newTaskTime.value = "";
  newTaskTitle.value = "";
  await saveDayData();
  renderTasks();
});

saveCommentBtn.addEventListener("click", async () => {
  currentDayData.comment = dailyComment.value.trim();
  await saveDayData();
  saveStatus.textContent = "Saved.";
  setTimeout(() => (saveStatus.textContent = ""), 1800);
});

resetTodayBtn.addEventListener("click", async () => {
  if (!confirm("Reset today's checklist?")) return;
  currentDayData.tasks = currentDayData.tasks.map(t => ({ ...t, done: false }));
  await saveDayData();
  renderTasks();
});

function renderRoutine() {
  routineTimeline.innerHTML = "";
  baseRoutine.forEach(item => {
    const div = document.createElement("div");
    div.className = "timeline-item";
    div.innerHTML = `
      <div class="timeline-time">${escapeHTML(item.time)}</div>
      <div>${escapeHTML(item.title)}</div>
    `;
    routineTimeline.appendChild(div);
  });
}

function renderChannels() {
  channelList.innerHTML = "";
  currentDayData.channels.forEach(ch => {
    const div = document.createElement("div");
    div.className = "channel-card";
    const ideas = (ch.ideas || []).map(idea => `<li><strong>${escapeHTML(idea.title)}</strong> — ${escapeHTML(idea.notes || "")}</li>`).join("");
    div.innerHTML = `
      <h3>${escapeHTML(ch.name)}</h3>
      <p class="muted">${escapeHTML(ch.focus)}</p>
      <ul>${ideas || "<li>No idea saved today.</li>"}</ul>
    `;
    channelList.appendChild(div);
  });
}

addChannelIdeaForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const selected = channelSelect.value;
  const channel = currentDayData.channels.find(c => c.name === selected);
  channel.ideas.push({
    title: ideaTitle.value.trim(),
    notes: ideaNotes.value.trim(),
    createdAt: new Date().toISOString()
  });
  ideaTitle.value = "";
  ideaNotes.value = "";
  await saveDayData();
  renderChannels();
});

function renderRules() {
  rulesList.innerHTML = "";
  disciplineRules.forEach(rule => {
    const div = document.createElement("div");
    div.className = "rule-card";
    div.innerHTML = `
      <h3>${escapeHTML(rule.title)}</h3>
      <p class="muted">${escapeHTML(rule.text)}</p>
    `;
    rulesList.appendChild(div);
  });
}

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".page-section").forEach(section => {
      section.classList.remove("active-section");
    });

    $(btn.dataset.section).classList.add("active-section");
  });
});

function isAdmin() {
  return currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

async function loadAdminData() {
  if (!isAdmin()) return;
  try {
    const snap = await getDocs(collection(db, "users"));
    usersCount.textContent = snap.size;
    usersList.innerHTML = "";
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const div = document.createElement("div");
      div.className = "user-row";
      div.innerHTML = `
        <span><strong>${escapeHTML(data.name || "User")}</strong></span>
        <span>${escapeHTML(data.email || "")}</span>
        <span>${escapeHTML(data.role || "user")}</span>
      `;
      usersList.appendChild(div);
    });
  } catch (error) {
    usersList.innerHTML = `<p class="message">Admin data blocked. Check Firestore Rules.</p>`;
  }
}

function cleanFirebaseError(message) {
  return message
    .replace("Firebase: ", "")
    .replace(/\(auth\/.*?\)\.?/g, "")
    .trim();
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
