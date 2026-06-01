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
let settings = null;
let achievements = [];

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
const completionScore = $("completionScore");
const dayType = $("dayType");
const generateAgendaBtn = $("generateAgendaBtn");
const taskList = $("taskList");
const addTaskForm = $("addTaskForm");
const newTaskTime = $("newTaskTime");
const newTaskTitle = $("newTaskTitle");
const dailyComment = $("dailyComment");
const moodInput = $("moodInput");
const energyInput = $("energyInput");
const saveCommentBtn = $("saveCommentBtn");
const saveStatus = $("saveStatus");
const resetTodayBtn = $("resetTodayBtn");
const tomorrowFocusInput = $("tomorrowFocusInput");
const finishDayBtn = $("finishDayBtn");
const dailyAdviceBox = $("dailyAdviceBox");

const totalDays = $("totalDays");
const currentStreak = $("currentStreak");
const averageScore = $("averageScore");
const bestScore = $("bestScore");
const achievementList = $("achievementList");

const coachChecks = document.querySelectorAll(".coach-check");
const videoIdeaInput = $("videoIdeaInput");
const saveCoachBtn = $("saveCoachBtn");
const channelMotivationBox = $("channelMotivationBox");
const channelFocusList = $("channelFocusList");

const enableNotificationsBtn = $("enableNotificationsBtn");
const notificationStatus = $("notificationStatus");
const addDefaultRemindersBtn = $("addDefaultRemindersBtn");
const reminderList = $("reminderList");
const addReminderForm = $("addReminderForm");
const reminderTimeInput = $("reminderTimeInput");
const reminderTextInput = $("reminderTextInput");

const rulesList = $("rulesList");

const settingsForm = $("settingsForm");
const wakeTimeInput = $("wakeTimeInput");
const sleepTimeInput = $("sleepTimeInput");
const sportTimeInput = $("sportTimeInput");
const classStartInput = $("classStartInput");
const classEndInput = $("classEndInput");
const moneyGoalInput = $("moneyGoalInput");
const settingsStatus = $("settingsStatus");

const todayKey = () => new Date().toISOString().split("T")[0];

const defaultSettings = {
  wakeTime: "05:00",
  sleepTime: "23:00",
  sportTime: "06:30",
  classStart: "08:00",
  classEnd: "17:00",
  moneyGoal: "$100K from YouTube and online skills in 3 years",
  channels: [
    { name: "Channel 1", focus: "Global AI tools and beginner digital skills" },
    { name: "Channel 2", focus: "Money mindset, discipline, and practical growth" },
    { name: "Channel 3", focus: "Content systems, productivity, and online income learning" }
  ],
  rules: [
    { title: "Avoid dating for 3 years", text: "Protect your focus. No chasing relationships while building your future." },
    { title: "Avoid useless status posts", text: "No memes or emotional status. Post only for very important birthdays or serious purpose." },
    { title: "Work on YouTube until $100K", text: "Research, script, create, edit, upload, learn, and repeat for 3 years." },
    { title: "Avoid too much talking and useless groups", text: "Reduce unnecessary words and groups that steal your time." },
    { title: "Live privately and control emotions", text: "Appear for a short time, work deeply, and use discipline before emotion." }
  ]
};

const defaultCoach = {
  research: false,
  script: false,
  visuals: false,
  edit: false,
  upload: false,
  competitors: false,
  videoIdea: ""
};

function formatDate() {
  const d = new Date();
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function isAdminEmail(email) {
  return email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

function setMode(signup) {
  isSignup = signup;
  nameInput.classList.toggle("hidden", !signup);
  authSubmit.textContent = signup ? "Create Admin Account" : "Login";
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
  const name = nameInput.value.trim() || "Iragena";

  if (!isAdminEmail(email)) {
    authMessage.textContent = `This is a private app. Use the admin email: ${ADMIN_EMAIL}`;
    return;
  }

  try {
    if (isSignup) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await ensureUserDoc(cred.user);
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
    authMessage.textContent = "Enter your admin email first.";
    return;
  }

  if (!isAdminEmail(email)) {
    authMessage.textContent = `Use the admin email: ${ADMIN_EMAIL}`;
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

  if (!user) {
    dashboard.classList.add("hidden");
    authScreen.classList.remove("hidden");
    return;
  }

  if (!isAdminEmail(user.email)) {
    authMessage.textContent = "Access denied. This roadmap is private.";
    await signOut(auth);
    return;
  }

  authScreen.classList.add("hidden");
  dashboard.classList.remove("hidden");

  await ensureUserDoc(user);
  await loadAllData();
  renderAll();
  startReminderLoop();
});

async function ensureUserDoc(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      name: user.displayName || "Iragena",
      email: user.email,
      role: "admin",
      settings: defaultSettings,
      createdAt: serverTimestamp()
    });
    return;
  }

  const data = snap.data();
  if (!data.settings) {
    await updateDoc(ref, { settings: defaultSettings });
  }
}

async function loadAllData() {
  const userRef = doc(db, "users", currentUser.uid);
  const userSnap = await getDoc(userRef);
  settings = userSnap.data().settings || defaultSettings;

  const dayRef = doc(db, "users", currentUser.uid, "days", todayKey());
  const daySnap = await getDoc(dayRef);

  if (!daySnap.exists()) {
    currentDayData = createDayData("class");
    await setDoc(dayRef, currentDayData);
  } else {
    currentDayData = daySnap.data();
    currentDayData.tasks = currentDayData.tasks || [];
    currentDayData.coach = currentDayData.coach || structuredClone(defaultCoach);
    currentDayData.reminders = currentDayData.reminders || buildDefaultReminders();
  }

  await loadAchievements();
}

function createDayData(type) {
  return {
    date: todayKey(),
    dayType: type,
    tasks: buildTasks(type),
    comment: "",
    mood: "focused",
    energy: "medium",
    tomorrowFocus: "",
    coach: structuredClone(defaultCoach),
    reminders: buildDefaultReminders(),
    finished: false,
    updatedAt: new Date().toISOString()
  };
}

async function saveDayData() {
  currentDayData.updatedAt = new Date().toISOString();
  await setDoc(doc(db, "users", currentUser.uid, "days", todayKey()), currentDayData, { merge: true });
}

function buildTasks(type) {
  if (type === "free") {
    return [
      t(settings.wakeTime, "Wake up. No excuses. No scrolling first."),
      t("05:05", "Pray for 10 minutes and ask for strength."),
      t("05:15", "Brainstorm today's mission and priorities."),
      t("05:45", "Research content ideas for 3 global YouTube channels."),
      t(settings.sportTime, "Sport: push-ups, stretching, body activation."),
      t("07:00", "Deep work block 1: scripts, research, or coding."),
      t("10:00", "Deep work block 2: editing or project building."),
      t("12:30", "Cook, eat, reset focus."),
      t("14:00", "Skill improvement and business research."),
      t("17:00", "Review money plan and channel progress."),
      t("18:00", "Editing / content production / cooking dinner."),
      t("22:30", "Review the day and prepare tomorrow."),
      t(settings.sleepTime, "Sleep on time.")
    ];
  }

  if (type === "custom") {
    return [
      t(settings.wakeTime, "Wake up and protect the day."),
      t("05:05", "Pray for 10 minutes."),
      t("05:30", "Write custom agenda for this specific day."),
      t(settings.sportTime, "Sport / push-ups."),
      t("08:00", "Custom important work block."),
      t("12:30", "Cook, eat, reset."),
      t("18:00", "Editing / content production / important evening work."),
      t("22:30", "Review day and plan tomorrow."),
      t(settings.sleepTime, "Sleep on time.")
    ];
  }

  return [
    t(settings.wakeTime, "Wake up at 5:00 AM. No excuses."),
    t("05:05", "Pray for 10 minutes."),
    t("05:15", "Brainstorm today's tasks and discipline mission."),
    t("05:45", "Research content ideas for 3 global YouTube channels."),
    t(settings.sportTime, "Sport: push-ups / body activation."),
    t("07:00", "Prepare for university."),
    t(settings.classStart, "Attend class / study seriously."),
    t("12:30", "Cook, eat, refresh, and return to class if needed."),
    t(settings.classEnd, "Finish class and return home."),
    t("18:00", "Edit videos / create content / cook dinner."),
    t("22:30", "Review the day and write reflection."),
    t(settings.sleepTime, "Sleep at 11:00 PM.")
  ];
}

function t(time, title) {
  return { time, title, done: false };
}

function buildDefaultReminders() {
  return [
    { time: settings.wakeTime || "05:00", text: "Wake up. Your future needs discipline today.", enabled: true, firedToday: false },
    { time: "05:05", text: "Prayer time. Ask for strength, then work.", enabled: true, firedToday: false },
    { time: "05:45", text: "Research content ideas for your channels.", enabled: true, firedToday: false },
    { time: settings.sportTime || "06:30", text: "Sport time. Push-ups and body activation.", enabled: true, firedToday: false },
    { time: "18:00", text: "Editing and content production block.", enabled: true, firedToday: false },
    { time: "22:30", text: "Review the day and finish your achievement.", enabled: true, firedToday: false },
    { time: settings.sleepTime || "23:00", text: "Sleep. Protect tomorrow.", enabled: true, firedToday: false }
  ];
}

function renderAll() {
  todayDate.textContent = formatDate();
  welcomeTitle.textContent = `Welcome back, ${currentUser.displayName || "Iragena"}`;
  dayType.value = currentDayData.dayType || "class";
  dailyComment.value = currentDayData.comment || "";
  moodInput.value = currentDayData.mood || "focused";
  energyInput.value = currentDayData.energy || "medium";
  tomorrowFocusInput.value = currentDayData.tomorrowFocus || "";

  renderTasks();
  renderRules();
  renderChannelFocus();
  renderCoach();
  renderReminders();
  fillSettings();
  renderAchievements();
}

function renderTasks() {
  taskList.innerHTML = "";
  currentDayData.tasks.forEach((task, index) => {
    const div = document.createElement("div");
    div.className = `task ${task.done ? "done" : ""}`;
    div.innerHTML = `
      <input class="check" type="checkbox" ${task.done ? "checked" : ""}>
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

function getScore() {
  const total = currentDayData.tasks.length || 1;
  const done = currentDayData.tasks.filter(task => task.done).length;
  return Math.round((done / total) * 100);
}

function updateScore() {
  completionScore.textContent = `${getScore()}%`;
}

generateAgendaBtn.addEventListener("click", async () => {
  currentDayData.dayType = dayType.value;
  currentDayData.tasks = buildTasks(dayType.value);
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
  currentDayData.mood = moodInput.value;
  currentDayData.energy = energyInput.value;
  await saveDayData();
  saveStatus.textContent = "Reflection saved.";
  setTimeout(() => saveStatus.textContent = "", 1800);
});

resetTodayBtn.addEventListener("click", async () => {
  if (!confirm("Reset today's checklist?")) return;
  currentDayData.tasks = currentDayData.tasks.map(task => ({ ...task, done: false }));
  await saveDayData();
  renderTasks();
});

finishDayBtn.addEventListener("click", async () => {
  currentDayData.comment = dailyComment.value.trim();
  currentDayData.mood = moodInput.value;
  currentDayData.energy = energyInput.value;
  currentDayData.tomorrowFocus = tomorrowFocusInput.value.trim();
  currentDayData.finished = true;

  const achievement = buildAchievement();
  await setDoc(doc(db, "users", currentUser.uid, "achievements", todayKey()), achievement, { merge: true });
  await saveDayData();
  await loadAchievements();

  dailyAdviceBox.classList.remove("hidden");
  dailyAdviceBox.innerHTML = generateAdvice(achievement);
  renderAchievements();
  showSection("achievements");
});

function buildAchievement() {
  const completed = currentDayData.tasks.filter(t => t.done);
  const missed = currentDayData.tasks.filter(t => !t.done);
  return {
    date: todayKey(),
    score: getScore(),
    completedCount: completed.length,
    missedCount: missed.length,
    completedTasks: completed.map(t => t.title),
    missedTasks: missed.map(t => t.title),
    comment: currentDayData.comment || "",
    mood: currentDayData.mood || "normal",
    energy: currentDayData.energy || "medium",
    tomorrowFocus: currentDayData.tomorrowFocus || "",
    coach: currentDayData.coach || structuredClone(defaultCoach),
    advice: generateAdviceText({ score: getScore(), missedTasks: missed.map(t => t.title), coach: currentDayData.coach }),
    createdAt: new Date().toISOString()
  };
}

function generateAdvice(achievement) {
  return `
    <h3>Today's Coaching Advice</h3>
    <p>${escapeHTML(achievement.advice)}</p>
    <p><strong>Tomorrow focus:</strong> ${escapeHTML(achievement.tomorrowFocus || "Protect the morning block and complete the first important task.")}</p>
  `;
}

function generateAdviceText(achievement) {
  const score = achievement.score;
  const coach = achievement.coach || {};
  const missed = achievement.missedTasks || [];

  if (score >= 85) {
    return "Strong execution today. Do not celebrate by relaxing too much. Repeat the same structure tomorrow, especially morning prayer, research, sport, and evening editing.";
  }

  if (score >= 65) {
    return "Good movement, but not full control. Tomorrow, protect the first 3 hours of the day. If the morning is clean, the rest of the day becomes easier.";
  }

  if (score >= 40) {
    return "You did not fail, but your execution was weak. Reduce talking, reduce phone checking, and start tomorrow with one serious task before anything else.";
  }

  return "This was a warning day. Your dreams are still alive, but dreams do not grow without execution. Tomorrow must be simple: wake up, pray, research one idea, do sport, and complete one content task.";
}

async function loadAchievements() {
  const snap = await getDocs(collection(db, "users", currentUser.uid, "achievements"));
  achievements = [];
  snap.forEach(docSnap => achievements.push(docSnap.data()));
  achievements.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function renderAchievements() {
  totalDays.textContent = achievements.length;
  currentStreak.textContent = calculateStreak();
  averageScore.textContent = `${calculateAverage()}%`;
  bestScore.textContent = `${calculateBest()}%`;

  achievementList.innerHTML = "";

  if (achievements.length === 0) {
    achievementList.innerHTML = `<p class="muted">No achievements saved yet. Finish your first day.</p>`;
    return;
  }

  achievements.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-card";
    div.innerHTML = `
      <h3>${escapeHTML(item.date)} — ${item.score}%</h3>
      <p class="muted">Completed: ${item.completedCount || 0} | Missed: ${item.missedCount || 0} | Mood: ${escapeHTML(item.mood || "normal")} | Energy: ${escapeHTML(item.energy || "medium")}</p>
      <p><strong>Comment:</strong> ${escapeHTML(item.comment || "No comment saved.")}</p>
      <p><strong>Advice:</strong> ${escapeHTML(item.advice || "")}</p>
      <p><strong>Tomorrow focus:</strong> ${escapeHTML(item.tomorrowFocus || "")}</p>
    `;
    achievementList.appendChild(div);
  });
}

function calculateAverage() {
  if (!achievements.length) return 0;
  const sum = achievements.reduce((total, item) => total + Number(item.score || 0), 0);
  return Math.round(sum / achievements.length);
}

function calculateBest() {
  if (!achievements.length) return 0;
  return Math.max(...achievements.map(item => Number(item.score || 0)));
}

function calculateStreak() {
  if (!achievements.length) return 0;
  const dates = new Set(achievements.map(a => a.date));
  let streak = 0;
  const d = new Date();

  while (true) {
    const key = d.toISOString().split("T")[0];
    if (!dates.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return streak;
}

saveCoachBtn.addEventListener("click", async () => {
  const coach = {};
  coachChecks.forEach(check => coach[check.dataset.key] = check.checked);
  coach.videoIdea = videoIdeaInput.value.trim();
  currentDayData.coach = coach;
  await saveDayData();
  renderCoach();
});

function renderCoach() {
  const coach = currentDayData.coach || structuredClone(defaultCoach);
  coachChecks.forEach(check => check.checked = Boolean(coach[check.dataset.key]));
  videoIdeaInput.value = coach.videoIdea || "";

  const done = Object.entries(coach).filter(([key, value]) => key !== "videoIdea" && value === true).length;
  let message = "Your channels grow from daily repetition. Research, script, edit, upload, learn, repeat.";

  if (done >= 5) {
    message = "Excellent channel work today. This is how invisible effort becomes visible growth.";
  } else if (done >= 3) {
    message = "Good progress. Tomorrow, add one more serious content action before evening.";
  } else if (done >= 1) {
    message = "You touched the mission, but lightly. Tomorrow, protect a full content block.";
  } else {
    message = "No channel progress saved yet. Your future audience cannot find work you never create.";
  }

  channelMotivationBox.innerHTML = `<strong>Coach:</strong> ${escapeHTML(message)}`;
}

function renderChannelFocus() {
  channelFocusList.innerHTML = "";
  settings.channels.forEach(channel => {
    const div = document.createElement("div");
    div.className = "channel-card";
    div.innerHTML = `
      <h3>${escapeHTML(channel.name)}</h3>
      <p class="muted">${escapeHTML(channel.focus)}</p>
    `;
    channelFocusList.appendChild(div);
  });
}

function renderRules() {
  rulesList.innerHTML = "";
  settings.rules.forEach(rule => {
    const div = document.createElement("div");
    div.className = "rule-card";
    div.innerHTML = `
      <h3>${escapeHTML(rule.title)}</h3>
      <p class="muted">${escapeHTML(rule.text)}</p>
    `;
    rulesList.appendChild(div);
  });
}

enableNotificationsBtn.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    notificationStatus.textContent = "Browser notifications are not supported here.";
    return;
  }

  const permission = await Notification.requestPermission();
  notificationStatus.textContent = permission === "granted" ? "Notifications enabled." : "Notifications not allowed.";
});

addDefaultRemindersBtn.addEventListener("click", async () => {
  currentDayData.reminders = buildDefaultReminders();
  await saveDayData();
  renderReminders();
});

addReminderForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  currentDayData.reminders = currentDayData.reminders || [];
  currentDayData.reminders.push({
    time: reminderTimeInput.value,
    text: reminderTextInput.value.trim(),
    enabled: true,
    firedToday: false
  });
  reminderTimeInput.value = "";
  reminderTextInput.value = "";
  await saveDayData();
  renderReminders();
});

function renderReminders() {
  reminderList.innerHTML = "";

  if (!currentDayData.reminders || currentDayData.reminders.length === 0) {
    reminderList.innerHTML = `<p class="muted">No reminders yet.</p>`;
    return;
  }

  currentDayData.reminders.forEach((reminder, index) => {
    const div = document.createElement("div");
    div.className = "reminder-row";
    div.innerHTML = `
      <input class="check" type="checkbox" ${reminder.enabled ? "checked" : ""}>
      <div class="reminder-time">${escapeHTML(reminder.time)}</div>
      <div>${escapeHTML(reminder.text)}</div>
      <button class="delete-reminder">Delete</button>
    `;

    div.querySelector(".check").addEventListener("change", async (e) => {
      currentDayData.reminders[index].enabled = e.target.checked;
      await saveDayData();
      renderReminders();
    });

    div.querySelector(".delete-reminder").addEventListener("click", async () => {
      currentDayData.reminders.splice(index, 1);
      await saveDayData();
      renderReminders();
    });

    reminderList.appendChild(div);
  });
}

let reminderInterval = null;

function startReminderLoop() {
  if (reminderInterval) clearInterval(reminderInterval);

  reminderInterval = setInterval(async () => {
    if (!currentDayData?.reminders) return;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    let changed = false;

    for (const reminder of currentDayData.reminders) {
      if (reminder.enabled && !reminder.firedToday && reminder.time === currentTime) {
        showReminder(reminder.text);
        reminder.firedToday = true;
        changed = true;
      }
    }

    if (changed) {
      await saveDayData();
      renderReminders();
    }
  }, 30000);
}

function showReminder(text) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Daily Roadmap Reminder", { body: text });
  } else {
    alert(`Reminder: ${text}`);
  }
}

function fillSettings() {
  wakeTimeInput.value = settings.wakeTime || "05:00";
  sleepTimeInput.value = settings.sleepTime || "23:00";
  sportTimeInput.value = settings.sportTime || "06:30";
  classStartInput.value = settings.classStart || "08:00";
  classEndInput.value = settings.classEnd || "17:00";
  moneyGoalInput.value = settings.moneyGoal || "";
}

settingsForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  settings.wakeTime = wakeTimeInput.value || "05:00";
  settings.sleepTime = sleepTimeInput.value || "23:00";
  settings.sportTime = sportTimeInput.value || "06:30";
  settings.classStart = classStartInput.value || "08:00";
  settings.classEnd = classEndInput.value || "17:00";
  settings.moneyGoal = moneyGoalInput.value.trim();

  await updateDoc(doc(db, "users", currentUser.uid), { settings });
  currentDayData.tasks = buildTasks(currentDayData.dayType || "class");
  currentDayData.reminders = buildDefaultReminders();
  await saveDayData();

  settingsStatus.textContent = "Settings saved.";
  setTimeout(() => settingsStatus.textContent = "", 1800);
  renderAll();
});

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => showSection(btn.dataset.section));
});

function showSection(sectionId) {
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.section === sectionId));
  document.querySelectorAll(".page-section").forEach(section => section.classList.toggle("active-section", section.id === sectionId));

  if (sectionId === "achievements") renderAchievements();
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
