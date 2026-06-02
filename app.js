import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-messaging.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";
import { FCM_VAPID_KEY } from "./fcm-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let messaging = null;
let serviceWorkerRegistration = null;
let deferredInstallPrompt = null;

let isSignup = false, currentUser = null, currentDayData = null, settings = null, achievements = [];
let currentDateKey = localDateKey(), editingTaskIndex = null, aiModule = null;

const $ = id => document.getElementById(id);
const q = sel => document.querySelectorAll(sel);

const defaultSettings = {
  wakeTime:"05:00", sleepTime:"23:00", sportTime:"06:30", classStart:"08:00", classEnd:"17:00",
  moneyGoal:"$100K from YouTube and online skills in 3 years",
  channels:[
    {name:"DiraIQ", focus:"Truth behind surroundings. Teach what the world will not teach you. Deep reality, life, discipline, money, AI, future skills."},
    {name:"5 Highlight", focus:"Five-minute football highlights. Short, clean, exciting, globally understandable football recap content."},
    {name:"GeoMystery", focus:"Geography and mysteries. Countries, strange places, hidden facts, maps, and unknown world stories."}
  ],
  rules:[
    {title:"Avoid dating for 3 years", text:"Protect your focus. No chasing relationships while building your future."},
    {title:"Avoid useless status posts", text:"No memes or emotional status. Post only for very important birthdays or serious purpose."},
    {title:"Work on YouTube until $100K", text:"Research, script, create, edit, upload, learn, and repeat for 3 years."},
    {title:"Avoid too much talking and useless groups", text:"Reduce unnecessary words and groups that steal your time."},
    {title:"Live privately and control emotions", text:"Appear for a short time, work deeply, and use discipline before emotion."}
  ]
};
const defaultCoach = {research:false, script:false, visuals:false, edit:false, upload:false, competitors:false, videoIdea:""};

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  const installBtn = $("installAppBtn");
  if (installBtn) installBtn.textContent = "Install App";
});

async function registerPWAServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    serviceWorkerRegistration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");
    return serviceWorkerRegistration;
  } catch (error) {
    console.warn("Service worker registration failed:", error);
    return null;
  }
}


function localDateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;}
function formatDate(){return new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});}
function isAdminEmail(email){return email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();}
function cleanError(m){return String(m).replace("Firebase: ","").replace(/\(auth\/.*?\)\.?/g,"").trim();}
function escapeHTML(v){return String(v||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function downloadText(filename,text){const blob=new Blob([text],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}

$("loginTab").onclick=()=>setMode(false);
$("signupTab").onclick=()=>setMode(true);
function setMode(signup){isSignup=signup;$("nameInput").classList.toggle("hidden",!signup);$("authSubmit").textContent=signup?"Create Admin":"Login";$("signupTab").classList.toggle("active",signup);$("loginTab").classList.toggle("active",!signup);$("authMessage").textContent="";}

$("authForm").onsubmit=async e=>{
  e.preventDefault();
  const email=$("emailInput").value.trim(), password=$("passwordInput").value.trim(), name=$("nameInput").value.trim()||"Iragena";
  if(!isAdminEmail(email)){ $("authMessage").textContent=`This is private. Use ${ADMIN_EMAIL}`; return; }
  $("authMessage").textContent="Processing...";
  try{
    if(isSignup){ const cred=await createUserWithEmailAndPassword(auth,email,password); await updateProfile(cred.user,{displayName:name}); await ensureUserDoc(cred.user); }
    else await signInWithEmailAndPassword(auth,email,password);
  }catch(err){$("authMessage").textContent=cleanError(err.message);}
};
$("resetPasswordBtn").onclick=async()=>{const email=$("emailInput").value.trim(); if(!isAdminEmail(email)){ $("authMessage").textContent=`Use ${ADMIN_EMAIL}`; return;} try{await sendPasswordResetEmail(auth,email);$("authMessage").textContent="Password reset email sent.";}catch(e){$("authMessage").textContent=cleanError(e.message);}};
$("logoutBtn").onclick=()=>signOut(auth);

onAuthStateChanged(auth, async user=>{
  currentUser=user;
  if(!user){$("dashboard").classList.add("hidden");$("authScreen").classList.remove("hidden");return;}
  if(!isAdminEmail(user.email)){await signOut(auth);return;}
  $("authScreen").classList.add("hidden");$("dashboard").classList.remove("hidden");
  await registerPWAServiceWorker(); await ensureUserDoc(user); await loadAllData(); renderAll(); startReminderLoop(); startMidnightWatcher(); setupForegroundMessages();
});

async function ensureUserDoc(user){
  const ref=doc(db,"users",user.uid), snap=await getDoc(ref);
  if(!snap.exists()){await setDoc(ref,{name:user.displayName||"Iragena",email:user.email,role:"admin",settings:defaultSettings,createdAt:serverTimestamp()}); return;}
  const data=snap.data();
  const merged={...defaultSettings,...(data.settings||{}),channels:defaultSettings.channels,rules:defaultSettings.rules};
  await updateDoc(ref,{settings:merged});
}
async function loadAllData(){
  const userSnap=await getDoc(doc(db,"users",currentUser.uid));
  settings=userSnap.data().settings||defaultSettings;
  currentDateKey=localDateKey();
  const dayRef=doc(db,"users",currentUser.uid,"days",currentDateKey);
  const daySnap=await getDoc(dayRef);
  currentDayData=daySnap.exists()?daySnap.data():createDayData("class",currentDateKey);
  currentDayData.tasks=currentDayData.tasks||[];
  currentDayData.coach=currentDayData.coach||structuredClone(defaultCoach);
  currentDayData.reminders=currentDayData.reminders||buildDefaultReminders();
  if(!daySnap.exists()) await setDoc(dayRef,currentDayData);
  await loadAchievements();
}
function createDayData(type,key=localDateKey()){return{date:key,dayType:type,tasks:buildTasks(type),comment:"",mood:"focused",energy:"medium",tomorrowFocus:"",coach:structuredClone(defaultCoach),reminders:buildDefaultReminders(),finished:false,updatedAt:new Date().toISOString()};}
async function saveDayData(){currentDayData.updatedAt=new Date().toISOString();await setDoc(doc(db,"users",currentUser.uid,"days",currentDateKey),currentDayData,{merge:true});}
function t(time,title){return{time,title,done:false};}
function buildTasks(type){
  if(type==="free") return [t(settings.wakeTime,"Wake up. No excuses. No scrolling first."),t("05:05","Pray for 10 minutes and ask for strength."),t("05:15","Brainstorm today's mission and priorities."),t("05:45","Research DiraIQ, 5 Highlight, and GeoMystery ideas."),t(settings.sportTime,"Sport: push-ups, stretching, body activation."),t("07:00","Deep work block 1: scripts, research, or coding."),t("10:00","Deep work block 2: editing or project building."),t("12:30","Cook, eat, reset focus."),t("14:00","Skill improvement and business research."),t("17:00","Review money plan and channel progress."),t("18:00","Editing / content production / cooking dinner."),t("22:30","Review the day and save achievement."),t(settings.sleepTime,"Sleep on time.")];
  if(type==="custom") return [t(settings.wakeTime,"Wake up and protect the day."),t("05:05","Pray for 10 minutes."),t("05:30","Write custom agenda for this specific day."),t(settings.sportTime,"Sport / push-ups."),t("08:00","Custom important work block."),t("12:30","Cook, eat, reset."),t("18:00","Editing / content production / important evening work."),t("22:30","Review day and save achievement."),t(settings.sleepTime,"Sleep on time.")];
  return [t(settings.wakeTime,"Wake up at 5:00 AM. No excuses."),t("05:05","Pray for 10 minutes."),t("05:15","Brainstorm today's tasks and discipline mission."),t("05:45","Research content ideas for DiraIQ, 5 Highlight, and GeoMystery."),t(settings.sportTime,"Sport: push-ups / body activation."),t("07:00","Prepare for university."),t(settings.classStart,"Attend class / study seriously."),t("12:30","Cook, eat, refresh, and return to class if needed."),t(settings.classEnd,"Finish class and return home."),t("18:00","Edit videos / create content / cook dinner."),t("22:30","Review the day and save achievement."),t(settings.sleepTime,"Sleep at 11:00 PM.")];
}
function buildDefaultReminders(){return[{time:settings.wakeTime,text:"Wake up. Your future needs discipline today.",enabled:true,firedDate:""},{time:"05:05",text:"Prayer time. Ask for strength, then work.",enabled:true,firedDate:""},{time:"05:45",text:"Research content ideas for your 3 channels.",enabled:true,firedDate:""},{time:settings.sportTime,text:"Sport time. Push-ups and body activation.",enabled:true,firedDate:""},{time:"18:00",text:"Editing and content production block.",enabled:true,firedDate:""},{time:"22:30",text:"Review the day and finish your achievement.",enabled:true,firedDate:""},{time:settings.sleepTime,text:"Sleep. Protect tomorrow.",enabled:true,firedDate:""}];}

function renderAll(){
  $("todayDate").textContent=formatDate(); $("welcomeTitle").textContent=`Welcome back, ${currentUser.displayName||"Iragena"}`;
  $("dayType").value=currentDayData.dayType||"class"; $("dailyComment").value=currentDayData.comment||""; $("moodInput").value=currentDayData.mood||"focused"; $("energyInput").value=currentDayData.energy||"medium"; $("tomorrowFocusInput").value=currentDayData.tomorrowFocus||"";
  renderTasks(); renderRules(); renderChannels(); renderCoach(); renderReminders(); fillSettings(); renderAchievements();
}
function renderTasks(){
  $("taskList").innerHTML="";
  currentDayData.tasks.forEach((task,index)=>{
    const div=document.createElement("div"); div.className=`task ${task.done?"done":""}`;
    div.innerHTML=`<input class="check" type="checkbox" ${task.done?"checked":""}><div class="task-time">${escapeHTML(task.time||"--")}</div><div class="task-title">${escapeHTML(task.title)}</div><button class="edit-task">Edit</button><button class="delete-task">Delete</button>`;
    div.querySelector(".check").onchange=async e=>{currentDayData.tasks[index].done=e.target.checked;await saveDayData();renderTasks();};
    div.querySelector(".edit-task").onclick=()=>{editingTaskIndex=index;$("newTaskTime").value=task.time||"";$("newTaskTitle").value=task.title||"";$("taskSubmitBtn").textContent="Save Edit";$("cancelEditTaskBtn").classList.remove("hidden");$("newTaskTitle").focus();};
    div.querySelector(".delete-task").onclick=async()=>{currentDayData.tasks.splice(index,1);await saveDayData();renderTasks();};
    $("taskList").appendChild(div);
  });
  updateScore();
}
function getScore(){const total=currentDayData.tasks.length||1;return Math.round(currentDayData.tasks.filter(t=>t.done).length/total*100);}
function updateScore(){const done=currentDayData.tasks.filter(t=>t.done).length, left=currentDayData.tasks.length-done; $("completionScore").textContent=`${getScore()}%`; $("todayDoneCount").textContent=done; $("todayMissedCount").textContent=left; $("todayDayType").textContent=currentDayData.dayType==="free"?"Deep":currentDayData.dayType==="custom"?"Custom":"Class"; const next=currentDayData.tasks.find(t=>!t.done); $("nextTaskText").textContent=next?next.title.slice(0,24)+(next.title.length>24?"...":""):"Complete";}

$("generateAgendaBtn").onclick=async()=>{currentDayData.dayType=$("dayType").value;currentDayData.tasks=buildTasks($("dayType").value);await saveDayData();renderTasks();};
$("addTaskForm").onsubmit=async e=>{e.preventDefault(); const task={time:$("newTaskTime").value.trim()||"--",title:$("newTaskTitle").value.trim(),done:editingTaskIndex!==null?currentDayData.tasks[editingTaskIndex].done:false}; if(editingTaskIndex!==null) currentDayData.tasks[editingTaskIndex]=task; else currentDayData.tasks.push(task); resetTaskForm(); await saveDayData(); renderTasks();};
$("cancelEditTaskBtn").onclick=resetTaskForm;
function resetTaskForm(){editingTaskIndex=null;$("newTaskTime").value="";$("newTaskTitle").value="";$("taskSubmitBtn").textContent="Add Activity";$("cancelEditTaskBtn").classList.add("hidden");}
$("saveCommentBtn").onclick=async()=>{currentDayData.comment=$("dailyComment").value.trim();currentDayData.mood=$("moodInput").value;currentDayData.energy=$("energyInput").value;await saveDayData();$("saveStatus").textContent="Reflection saved.";setTimeout(()=>$("saveStatus").textContent="",1800);};
$("resetTodayBtn").onclick=async()=>{if(!confirm("Reset today's activities to default?"))return;currentDayData=createDayData($("dayType").value,currentDateKey);await saveDayData();renderAll();};
$("downloadTodayBtn").onclick=()=>downloadText(`daily-roadmap-${currentDateKey}.txt`,buildDayReportText(currentDayData));

$("finishDayBtn").onclick=async()=>{currentDayData.comment=$("dailyComment").value.trim();currentDayData.mood=$("moodInput").value;currentDayData.energy=$("energyInput").value;currentDayData.tomorrowFocus=$("tomorrowFocusInput").value.trim();currentDayData.finished=true;const achievement=buildAchievement();await setDoc(doc(db,"users",currentUser.uid,"achievements",currentDateKey),achievement,{merge:true});await saveDayData();await loadAchievements();$("dailyAdviceBox").classList.remove("hidden");$("dailyAdviceBox").innerHTML=generateAdvice(achievement);renderAchievements();showSection("achievements");};
function buildAchievement(){const done=currentDayData.tasks.filter(t=>t.done), missed=currentDayData.tasks.filter(t=>!t.done);return{date:currentDateKey,score:getScore(),completedCount:done.length,missedCount:missed.length,completedTasks:done.map(t=>t.title),missedTasks:missed.map(t=>t.title),comment:currentDayData.comment||"",mood:currentDayData.mood||"normal",energy:currentDayData.energy||"medium",tomorrowFocus:currentDayData.tomorrowFocus||"",coach:currentDayData.coach||structuredClone(defaultCoach),advice:generateAdviceText(getScore()),createdAt:new Date().toISOString()};}
function generateAdvice(a){return `<h3>Today's Coaching Advice</h3><p>${escapeHTML(a.advice)}</p><p><strong>Tomorrow focus:</strong> ${escapeHTML(a.tomorrowFocus||"Protect the morning block and complete the first important task.")}</p>`;}
function generateAdviceText(score){if(score>=85)return"Strong execution today. Do not celebrate by relaxing too much. Repeat the same structure tomorrow, especially prayer, research, sport, and editing."; if(score>=65)return"Good movement, but not full control. Tomorrow, protect the first 3 hours of the day."; if(score>=40)return"You did not fail, but execution was weak. Reduce talking, reduce phone checking, and start tomorrow with one serious task."; return"This was a warning day. Dreams do not grow without execution. Tomorrow: wake, pray, research one idea, sport, and complete one content task.";}

async function loadAchievements(){const snap=await getDocs(collection(db,"users",currentUser.uid,"achievements"));achievements=[];snap.forEach(d=>achievements.push(d.data()));achievements.sort((a,b)=>String(b.date).localeCompare(String(a.date)));}
function renderAchievements(){$("totalDays").textContent=achievements.length;$("currentStreak").textContent=calcStreak();$("averageScore").textContent=`${calcAvg()}%`;$("bestScore").textContent=`${calcBest()}%`; $("achievementList").innerHTML=achievements.length?"":'<p class="muted">No achievements saved yet. Finish your first day.</p>'; achievements.forEach(item=>{const div=document.createElement("div");div.className="history-card";div.innerHTML=`<h3>${escapeHTML(item.date)} — ${item.score}%</h3><p class="muted">Completed: ${item.completedCount||0} | Missed: ${item.missedCount||0} | Mood: ${escapeHTML(item.mood||"normal")} | Energy: ${escapeHTML(item.energy||"medium")}</p><p><strong>Comment:</strong> ${escapeHTML(item.comment||"No comment saved.")}</p><p><strong>Advice:</strong> ${escapeHTML(item.advice||"")}</p><p><strong>Tomorrow focus:</strong> ${escapeHTML(item.tomorrowFocus||"")}</p><div class="card-actions"><button class="download-card-btn">Download Report</button></div>`; div.querySelector(".download-card-btn").onclick=()=>downloadText(`achievement-${item.date}.txt`,buildAchievementReportText(item)); $("achievementList").appendChild(div);});}
function calcAvg(){return achievements.length?Math.round(achievements.reduce((s,a)=>s+Number(a.score||0),0)/achievements.length):0}
function calcBest(){return achievements.length?Math.max(...achievements.map(a=>Number(a.score||0))):0}
function calcStreak(){const dates=new Set(achievements.map(a=>a.date));let streak=0,d=new Date();while(dates.has(localDateKey(d))){streak++;d.setDate(d.getDate()-1)}return streak;}
$("downloadAllCSVBtn").onclick=()=>{const rows=[["date","score","completed","missed","mood","energy","tomorrow_focus"]];achievements.forEach(a=>rows.push([a.date,a.score,a.completedCount||0,a.missedCount||0,a.mood||"",a.energy||"",a.tomorrowFocus||""]));downloadText("daily-roadmap-achievements.csv",rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n"));};
$("downloadAllJSONBtn").onclick=()=>downloadText("daily-roadmap-achievements.json",JSON.stringify(achievements,null,2));

$("saveCoachBtn").onclick=async()=>{const coach={};q(".coach-check").forEach(c=>coach[c.dataset.key]=c.checked);coach.videoIdea=$("videoIdeaInput").value.trim();currentDayData.coach=coach;await saveDayData();renderCoach();};
function renderCoach(){const coach=currentDayData.coach||structuredClone(defaultCoach);q(".coach-check").forEach(c=>c.checked=!!coach[c.dataset.key]);$("videoIdeaInput").value=coach.videoIdea||"";const done=Object.entries(coach).filter(([k,v])=>k!=="videoIdea"&&v).length;let msg=done>=5?"Excellent channel work today. Invisible effort becomes visible growth.":done>=3?"Good progress. Tomorrow add one more serious content action.":done>=1?"You touched the mission, but lightly. Tomorrow protect a full content block.":"No channel progress saved yet. Your future audience cannot find work you never create.";$("channelMotivationBox").innerHTML=`<strong>Coach:</strong> ${escapeHTML(msg)}`;}
function renderChannels(){$("channelFocusList").innerHTML="";settings.channels.forEach(c=>{const div=document.createElement("div");div.className="channel-card";div.innerHTML=`<h3>${escapeHTML(c.name)}</h3><p class="muted">${escapeHTML(c.focus)}</p>`;$("channelFocusList").appendChild(div);});}
function renderRules(){$("rulesList").innerHTML="";settings.rules.forEach(r=>{const div=document.createElement("div");div.className="rule-card";div.innerHTML=`<h3>${escapeHTML(r.title)}</h3><p class="muted">${escapeHTML(r.text)}</p>`;$("rulesList").appendChild(div);});}

async function getAIModel(){ if(aiModule) return aiModule; const m=await import("https://www.gstatic.com/firebasejs/12.5.0/firebase-ai.js"); const ai=m.getAI(app,{backend:new m.GoogleAIBackend()}); aiModule=m.getGenerativeModel(ai,{model:"gemini-2.5-flash"}); return aiModule; }
async function aiBox(type,box){box.className="ai-output loading";box.textContent="Gemini AI is thinking...";try{const model=await getAIModel();const res=await Promise.race([model.generateContent(buildPrompt(type)),new Promise((_,rej)=>setTimeout(()=>rej(new Error("AI request timed out after 25 seconds.")),25000))]);const text=res?.response?.text?.()||"No AI response received.";box.className="ai-output";box.textContent=text;await setDoc(doc(db,"users",currentUser.uid,"aiResponses",`${currentDateKey}-${type}`),{type,date:currentDateKey,text,score:getScore(),createdAt:new Date().toISOString()},{merge:true});}catch(e){box.className="ai-output error";box.textContent=`AI did not respond yet. Fallback coaching:\n\n${fallback(type)}\n\nTechnical error: ${cleanError(e.message||e)}`;}}
$("generateAIAdviceBtn").onclick=()=>{$("dailyAdviceBox").classList.remove("hidden");aiBox("daily",$("dailyAdviceBox"));};
$("aiDailyReviewBtn").onclick=()=>aiBox("daily",$("aiDailyReviewBox"));
$("aiTomorrowPlanBtn").onclick=()=>aiBox("tomorrow",$("aiTomorrowPlanBox"));
$("aiChannelCoachBtn").onclick=()=>aiBox("channel",$("aiChannelCoachBox"));
$("aiWeeklyReviewBtn").onclick=()=>aiBox("weekly",$("aiWeeklyReviewBox"));
function buildPrompt(type){const completed=currentDayData.tasks.filter(t=>t.done).map(t=>t.title), missed=currentDayData.tasks.filter(t=>!t.done).map(t=>t.title);const base=`You are a strict but constructive discipline coach for Iragena. Mission: ${settings.moneyGoal}. Routine: sleep 11 PM, wake 5 AM, prayer, brainstorming, content research, sport, university/class when available, evening editing/cooking, review. Channels: DiraIQ = truth behind surroundings and what the world will not teach you; 5 Highlight = 5-minute football highlights; GeoMystery = geography and mysteries. Rules: avoid dating 3 years, avoid useless status/memes, avoid too much talking/groups, live privately, control emotions, focus on YouTube until $100K in 3 years. Today score ${getScore()}%. Mood ${currentDayData.mood}. Energy ${currentDayData.energy}. Reflection: ${currentDayData.comment||"none"}. Completed: ${completed.join("; ")||"none"}. Missed: ${missed.join("; ")||"none"}. Channel progress: ${JSON.stringify(currentDayData.coach)}. Recent achievements: ${JSON.stringify(achievements.slice(0,7))}. Be direct, short, practical, motivational. Use English with a little Kinyarwanda only where useful.`; if(type==="tomorrow")return base+" Give tomorrow plan: warning, first 3 hours, each channel action, one thing to avoid, command."; if(type==="channel")return base+" Give channel growth coaching for DiraIQ, 5 Highlight, and GeoMystery."; if(type==="weekly")return base+" Analyze weekly pattern, strongest habit, weakest habit, weekly improvement system, 5-line discipline message."; return base+" Give today review: score interpretation, biggest weakness, best win, tomorrow advice, YouTube motivation, sentence before sleeping."; }
function fallback(type){ if(type==="channel")return"DiraIQ needs one truth-based idea. 5 Highlight needs one football highlight plan. GeoMystery needs one mysterious/geography topic. Do not wait to feel ready."; if(type==="tomorrow")return"Tomorrow: wake up, pray, research one idea, do sport, and finish one real YouTube action before distractions."; if(type==="weekly")return"Your week improves when your mornings improve. Protect wake-up, prayer, research, sport, and evening review."; return generateAdviceText(getScore()); }


const installAppBtn = $("installAppBtn");
if (installAppBtn) {
  installAppBtn.onclick = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      $("pushStatus").textContent = "Install prompt completed.";
    } else {
      $("pushStatus").textContent = "If install button does not open, use browser menu: Add to Home Screen / Install app.";
    }
  };
}

const sendTestLocalBtn = $("sendTestLocalBtn");
if (sendTestLocalBtn) {
  sendTestLocalBtn.onclick = async () => {
    if (!("Notification" in window)) {
      $("pushStatus").textContent = "Notifications are not supported on this browser.";
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      $("pushStatus").textContent = "Notifications are blocked. Enable them in phone/browser settings.";
      return;
    }

    new Notification("Daily Roadmap Reminder", {
      body: "Test notification: protect your focus today.",
      icon: "./icon-192.png",
      badge: "./badge-72.png"
    });

    $("pushStatus").textContent = "Test notification sent.";
  };
}

const copyTokenBtn = $("copyTokenBtn");
if (copyTokenBtn) {
  copyTokenBtn.onclick = async () => {
    const box = $("fcmTokenBox");
    if (!box || !box.value) {
      $("pushStatus").textContent = "No token to copy yet. Enable push notifications first.";
      return;
    }
    await navigator.clipboard.writeText(box.value);
    $("pushStatus").textContent = "FCM token copied.";
  };
}

const enablePushBtn = $("enablePushBtn");
if (enablePushBtn) {
  enablePushBtn.onclick = enablePushNotifications;
}

async function enablePushNotifications() {
  const status = $("pushStatus");
  const tokenBox = $("fcmTokenBox");

  try {
    if (!FCM_VAPID_KEY || FCM_VAPID_KEY.includes("PASTE_")) {
      status.textContent = "Add your Web Push certificate key in fcm-config.js first.";
      return;
    }

    const supported = await isSupported();
    if (!supported) {
      status.textContent = "Firebase push messaging is not supported on this browser/device.";
      return;
    }

    if (!("Notification" in window)) {
      status.textContent = "Notifications are not supported here.";
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      status.textContent = "Notifications blocked. Allow notifications in browser/phone settings.";
      return;
    }

    if (!serviceWorkerRegistration) {
      serviceWorkerRegistration = await registerPWAServiceWorker();
    }

    messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration
    });

    if (!token) {
      status.textContent = "No FCM token received. Try again after reinstalling/refreshing app.";
      return;
    }

    if (tokenBox) tokenBox.value = token;

    await setDoc(doc(db, "users", currentUser.uid, "fcmTokens", token), {
      token,
      userAgent: navigator.userAgent,
      platform: navigator.platform || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    status.textContent = "Push notifications enabled and device token saved.";
  } catch (error) {
    status.textContent = "Push setup error: " + cleanError(error.message || error);
  }
}

async function setupForegroundMessages() {
  try {
    const supported = await isSupported();
    if (!supported) return;

    messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      const title = payload?.notification?.title || "Daily Roadmap Reminder";
      const body = payload?.notification?.body || payload?.data?.body || "You have a roadmap reminder.";
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "./icon-192.png",
          badge: "./badge-72.png"
        });
      } else {
        alert(`${title}: ${body}`);
      }
    });
  } catch (error) {
    console.warn("Foreground messaging not ready:", error);
  }
}


$("enableNotificationsBtn").onclick=async()=>{if(!("Notification"in window)){$("notificationStatus").textContent="Notifications not supported.";return;}const p=await Notification.requestPermission();$("notificationStatus").textContent=p==="granted"?"Notifications enabled.":"Notifications not allowed.";};
$("addDefaultRemindersBtn").onclick=async()=>{currentDayData.reminders=buildDefaultReminders();await saveDayData();renderReminders();};
$("addReminderForm").onsubmit=async e=>{e.preventDefault();currentDayData.reminders.push({time:$("reminderTimeInput").value,text:$("reminderTextInput").value.trim(),enabled:true,firedDate:""});$("reminderTimeInput").value="";$("reminderTextInput").value="";await saveDayData();renderReminders();};
function renderReminders(){$("reminderList").innerHTML=currentDayData.reminders.length?"":'<p class="muted">No reminders yet.</p>';currentDayData.reminders.forEach((r,i)=>{const div=document.createElement("div");div.className="reminder-row";div.innerHTML=`<input class="check" type="checkbox" ${r.enabled?"checked":""}><div class="reminder-time">${escapeHTML(r.time)}</div><div>${escapeHTML(r.text)}</div><button class="delete-reminder">Delete</button>`;div.querySelector(".check").onchange=async e=>{currentDayData.reminders[i].enabled=e.target.checked;await saveDayData();renderReminders();};div.querySelector(".delete-reminder").onclick=async()=>{currentDayData.reminders.splice(i,1);await saveDayData();renderReminders();};$("reminderList").appendChild(div);});}
let reminderInterval=null;function startReminderLoop(){if(reminderInterval)clearInterval(reminderInterval);reminderInterval=setInterval(async()=>{const now=new Date(),time=now.toTimeString().slice(0,5),today=localDateKey();let changed=false;for(const r of currentDayData.reminders||[]){if(r.enabled&&r.firedDate!==today&&r.time===time){showReminder(r.text);r.firedDate=today;changed=true;}}if(changed){await saveDayData();renderReminders();}},30000);}
let midnightInterval=null;function startMidnightWatcher(){if(midnightInterval)clearInterval(midnightInterval);midnightInterval=setInterval(async()=>{const key=localDateKey();if(key!==currentDateKey){currentDateKey=key;await loadAllData();renderAll();showReminder("New day created. Your roadmap has reset for today.");}},60000);}
function showReminder(text){if("Notification"in window&&Notification.permission==="granted")new Notification("Daily Roadmap Reminder",{body:text});else alert(`Reminder: ${text}`);}

function fillSettings(){$("wakeTimeInput").value=settings.wakeTime;$("sleepTimeInput").value=settings.sleepTime;$("sportTimeInput").value=settings.sportTime;$("classStartInput").value=settings.classStart;$("classEndInput").value=settings.classEnd;$("moneyGoalInput").value=settings.moneyGoal||"";}
$("settingsForm").onsubmit=async e=>{e.preventDefault();settings.wakeTime=$("wakeTimeInput").value||"05:00";settings.sleepTime=$("sleepTimeInput").value||"23:00";settings.sportTime=$("sportTimeInput").value||"06:30";settings.classStart=$("classStartInput").value||"08:00";settings.classEnd=$("classEndInput").value||"17:00";settings.moneyGoal=$("moneyGoalInput").value.trim();settings.channels=defaultSettings.channels;settings.rules=defaultSettings.rules;await updateDoc(doc(db,"users",currentUser.uid),{settings});currentDayData.tasks=buildTasks(currentDayData.dayType||"class");currentDayData.reminders=buildDefaultReminders();await saveDayData();$("settingsStatus").textContent="Settings saved.";setTimeout(()=>$("settingsStatus").textContent="",1800);renderAll();};

q(".nav-btn").forEach(btn=>btn.onclick=()=>showSection(btn.dataset.section));
function showSection(id){q(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.section===id));q(".page-section").forEach(s=>s.classList.toggle("active-section",s.id===id));if(id==="achievements")renderAchievements();}
function buildDayReportText(day){const done=day.tasks.filter(t=>t.done).map(t=>`✓ ${t.time} - ${t.title}`).join("\n"),missed=day.tasks.filter(t=>!t.done).map(t=>`✗ ${t.time} - ${t.title}`).join("\n");return`MY DAILY ROADMAP REPORT\nDate: ${currentDateKey}\nScore: ${getScore()}%\nMood: ${day.mood||""}\nEnergy: ${day.energy||""}\n\nCOMPLETED\n${done||"None"}\n\nMISSED\n${missed||"None"}\n\nREFLECTION\n${day.comment||""}\n\nTOMORROW FOCUS\n${day.tomorrowFocus||""}\n`;}
function buildAchievementReportText(a){return`MY DAILY ACHIEVEMENT\nDate: ${a.date}\nScore: ${a.score}%\nCompleted: ${a.completedCount||0}\nMissed: ${a.missedCount||0}\nMood: ${a.mood||""}\nEnergy: ${a.energy||""}\n\nCOMMENT\n${a.comment||""}\n\nADVICE\n${a.advice||""}\n\nTOMORROW FOCUS\n${a.tomorrowFocus||""}\n`;}
