import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { auth, db, storage } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  deleteUser,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";


const CREATOR_EMAILS = [
  "DuBosemo2@gmail.com",
  "Haileemccowen@icloud.com",
  "Sweetkybug09@gmail.com",
];

function isCreatorEmail(email) {
  return !!email && CREATOR_EMAILS.some((e) => e.toLowerCase() === email.toLowerCase());
}

function withCreatorUnlock(profile, user) {
  const creator = isCreatorEmail(user?.email);
  return {
    ...(profile || {}),
    isCreator: creator,
    subscription: creator ? "Premium" : profile?.subscription || "Free",
    photoLimit: creator ? 999999 : profile?.photoLimit || 15,
    photoCredits: creator ? 999999 : profile?.photoCredits || 0,
  };
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const BG_OPTIONS = [
  { id: "cream", name: "Cream" },
  { id: "blank", name: "Blank" },
  { id: "paper", name: "Paper" },
  { id: "grid", name: "Grid" },
  { id: "dots", name: "Dots" },
  { id: "babyBlue", name: "Baby Blue" },
  { id: "babyPink", name: "Baby Pink" },
  { id: "lavender", name: "Light Lavender" },
  { id: "wedding", name: "Wedding Cream" },
  { id: "christmas", name: "Christmas Cream" },
];

const FONT_OPTIONS = ["Playfair Display", "Georgia", "Poppins", "Courier New", "Brush Script MT", "Arial"];
const COLORS = ["#2f2825", "#a95379", "#7a8fa6", "#81916e", "#c38f65", "#111111", "#ffffff"];

const STICKERS = [
  { name: "Doodle 1", src: "/doodles_01.png", category: "Doodles", premium: false },
  { name: "Doodle 2", src: "/doodles_02.png", category: "Doodles", premium: false },
  { name: "Doodle 3", src: "/doodles_03.png", category: "Doodles", premium: false },
  { name: "Doodle 4", src: "/doodles_04.png", category: "Doodles", premium: false },
  { name: "Doodle 5", src: "/doodles_05.png", category: "Doodles", premium: false },
  { name: "Doodle 6", src: "/doodles_06.png", category: "Doodles", premium: false },
  { name: "Celebration 1", src: "/celebration_01.png", category: "Celebration", premium: false },
  { name: "Celebration 2", src: "/celebration_02.png", category: "Celebration", premium: true },
  { name: "Animal 1", src: "/animals_01.png", category: "Animals", premium: true },
  { name: "Animal 2", src: "/animals_02.png", category: "Animals", premium: true },
  { name: "Dream Plan 1", src: "/dream_plan_01.png", category: "Dream & Plan", premium: true },
  { name: "Dream Plan 2", src: "/dream_plan_02.png", category: "Dream & Plan", premium: true },
  { name: "Dream Plan 3", src: "/dream_plan_03.png", category: "Dream & Plan", premium: true },
  { name: "Frame Label 1", src: "/frames_labels_01.png", category: "Frames & Labels", premium: false },
  { name: "Frame Label 2", src: "/frames_labels_02.png", category: "Frames & Labels", premium: true },
];

const emojiStickers = ["♡", "☆", "✿", "🌸", "🌿", "🎀", "🧸", "📷", "✈️", "🎂", "🏡", "💍", "🎓", "🎄"];

function element(type, props = {}) {
  return {
    id: uid(),
    type,
    x: 20,
    y: 20,
    w: 28,
    h: 18,
    rotate: 0,
    locked: !!props.locked,
    ...props,
  };
}
function textEl(text, x, y, w, h, opts = {}) {
  return element("text", { text, x, y, w, h, size: opts.size || 18, color: opts.color || "#2f2825", font: opts.font || "Poppins", premiumCurve: false, ...opts });
}
function photoEl(x, y, w, h, opts = {}) {
  return element("photo", { src: "", x, y, w, h, ...opts });
}
function stickerEl(value, x, y, w, h, opts = {}) {
  return element("sticker", { value, x, y, w, h, ...opts });
}
function page(bg = "cream", elements = []) {
  return { id: uid(), bg, elements };
}

function decoEl(kind, x, y, w, h, opts = {}) {
  return stickerEl(opts.label || "", x, y, w, h, { kind, locked: true, ...opts });
}

function babyPages(kind = "girl") {
  const girl = kind === "girl";
  const bg = girl ? "babyPink" : "babyBlue";
  const accent = girl ? "#d889a7" : "#7595b6";
  const label = girl ? "our little girl" : "our little boy";
  const sweet = girl ? "sweet girl ♡" : "sweet boy ♡";
  const blessing = girl ? "little blessing ♡" : "little blessing ♡";
  const pages = [];

  // Cover page — built like a real scrapbook cover, fully editable after creating
  pages.push(page(bg, [
    decoEl(girl ? "bowPink" : "bowBlue", 3, 3, 15, 15),
    decoEl("paperTitle", 18, 7, 58, 27, { label: "baby's\nfirst year\n♡" }),
    decoEl(girl ? "tagPink" : "tagBlue", 67, 33, 24, 8, { label }),
    photoEl(7, 46, 34, 38, { rotate: -4 }),
    photoEl(55, 43, 28, 27, { rotate: 6 }),
    decoEl("tapeTan", 58, 40, 18, 5),
    decoEl("noteTan", 54, 74, 26, 14, { label: "so much\nlove\n♡" }),
    decoEl(girl ? "heartPink" : "heartBlue", 8, 79, 12, 12),
    decoEl("buttonTan", 4, 84, 9, 9),
    decoEl(girl ? "flowerPink" : "flowerBlue", 82, 72, 14, 18),
    decoEl(girl ? "starPink" : "starBlue", 81, 8, 8, 8),
    decoEl(girl ? "starPink" : "starBlue", 90, 15, 7, 7),
  ]));

  pages.push(page(bg, [
    decoEl("paperTall", 9, 10, 29, 58, { label: "hello\nworld\n♡\n\nthe day\nyou were born ♡\n\ndate: ____\ntime: ____\nweight: ____\nlength: ____" }),
    photoEl(48, 12, 36, 52, { rotate: 4 }),
    decoEl(girl ? "tapePink" : "tapeBlue", 54, 8, 23, 5),
    decoEl(girl ? "flowerPink" : "flowerBlue", 31, 22, 11, 20),
    decoEl(girl ? "heartPink" : "heartBlue", 80, 70, 10, 10),
  ]));

  pages.push(page(bg, [
    textEl("tiny\nhands\nbig\nlove\n♡", 13, 16, 30, 42, { font: "Courier New", size: 20, locked: true }),
    photoEl(50, 12, 35, 50, { rotate: 5 }),
    decoEl(girl ? "heartPinkPlaid" : "heartBluePlaid", 72, 62, 15, 15),
    decoEl("buttonTan", 22, 72, 9, 9),
    decoEl(girl ? "starPink" : "starBlue", 7, 8, 8, 8),
    decoEl(girl ? "starPink" : "starBlue", 14, 14, 6, 6),
    decoEl(girl ? "flowerPink" : "flowerBlue", 10, 68, 12, 18),
  ]));

  const monthLabels = [
    "you are\nso loved\n♡", "growing\nso fast ♡", sweet, "so happy ♡",
    "cutest\nsmile ♡", blessing, "cutest\nsmile ♡", "learning\n& growing ♡",
    "so\ncurious ♡", "so much\njoy ♡", "almost\none! ♡", "what a\nyear! ♡"
  ];

  for (let i = 1; i <= 12; i++) {
    const twoPhotos = [2,5,7,9,10,11,12].includes(i);
    const noteText = monthLabels[i - 1];
    pages.push(page(bg, [
      decoEl(girl ? "starPink" : "starBlue", 3, 6, 8, 8),
      decoEl("monthNote", 8, 8, 24, 22, { label: `${i}\nmonth${i === 1 ? "" : "s"}` }),
      twoPhotos ? photoEl(33, 22, 26, 36, { rotate: -2 }) : photoEl(38, 20, 42, 42),
      twoPhotos ? photoEl(59, 18, 27, 36, { rotate: 3 }) : null,
      i % 3 === 1 ? decoEl("linedNote", 58, 61, 29, 18, { label: noteText }) : decoEl(girl ? "tagPink" : "tagBlue", 56, 70, 30, 9, { label: noteText }),
      i === 3 ? decoEl(girl ? "bearPink" : "bearBlue", 26, 55, 16, 18) : null,
      i === 4 ? decoEl(girl ? "rattlePink" : "rattleBlue", 82, 36, 10, 20) : null,
      i === 6 ? decoEl(girl ? "bunnyPink" : "bunnyBlue", 68, 51, 18, 24) : null,
      i === 7 ? decoEl(girl ? "heartPinkPlaid" : "heartBluePlaid", 20, 63, 13, 13) : null,
      i === 8 ? decoEl(girl ? "paperListPink" : "paperListBlue", 61, 23, 24, 42) : null,
      i === 10 ? decoEl(girl ? "flowerPink" : "flowerBlue", 78, 49, 12, 20) : null,
      i === 12 ? decoEl("buttonTan", 18, 82, 8, 8) : null,
      decoEl(girl ? "heartPink" : "heartBlue", 83, 76, 10, 10),
      decoEl(girl ? "flowerPink" : "flowerBlue", 87, 42, 10, 18),
    ].filter(Boolean)));
  }

  pages.push(page(bg, [
    decoEl("paperTitle", 18, 9, 58, 25, { label: "one year\nof you\n♡" }),
    photoEl(52, 38, 32, 42, { rotate: 5 }),
    decoEl(girl ? "tagPink" : "tagBlue", 10, 72, 25, 11, { label: "what a\nyear! ♡" }),
    decoEl(girl ? "tagPink" : "tagBlue", 70, 82, 24, 11, { label: "one year\nof you ♡" }),
    decoEl(girl ? "heartPinkPlaid" : "heartBluePlaid", 13, 50, 15, 15),
    decoEl("linedNote", 10, 38, 31, 27, { label: "favorite\nmemories:\n\n\n" }),
    decoEl(girl ? "flowerPink" : "flowerBlue", 86, 62, 11, 19),
    decoEl("buttonTan", 9, 84, 8, 8),
  ]));

  return pages;
}

function simpleTemplate(title, bg = "cream", pages = 6) {
  const list = [page(bg, [textEl(title, 14, 17, 72, 20, { font: "Brush Script MT", size: 32, locked: true }), stickerEl("♡", 45, 45, 10, 10, { locked: true })])];
  for (let i = 1; i < pages; i++) list.push(page(bg, [textEl(["About this", "Memories", "Favorite Moments", "Details", "Photos", "Looking Ahead"][i - 1] || "Memories", 12, 8, 76, 10, { size: 22, locked: true }), photoEl(10, 24, 36, 40), textEl("notes:\n\n\n\n", 52, 26, 38, 30, { font: "Courier New", size: 14 }), stickerEl("🌿", 76, 68, 12, 12, { locked: true })]));
  return list;
}

const TEMPLATES = [
  { id: "blank", category: "Free", name: "Blank Book", label: "Free", premium: false, price: "Free", maker: () => [page("cream", [])] },
  { id: "memory", category: "Free", name: "Memory Book", label: "Free", premium: false, price: "Free", maker: () => simpleTemplate("memory book", "paper", 8) },
  { id: "adventure", category: "Travel", name: "Adventure Book", label: "$0.99", premium: true, price: "$0.99", maker: () => simpleTemplate("my adventure book", "paper", 12) },
  { id: "babyBoy", category: "Baby", name: "Baby Boy First Year", label: "$0.99", premium: true, price: "$0.99", maker: () => babyPages("boy") },
  { id: "babyGirl", category: "Baby", name: "Baby Girl First Year", label: "$0.99", premium: true, price: "$0.99", maker: () => babyPages("girl") },
  { id: "wedding", category: "Wedding", name: "Wedding Book", label: "$0.99", premium: true, price: "$0.99", maker: () => simpleTemplate("our wedding book", "wedding", 16) },
  { id: "pregnancy", category: "Family", name: "Pregnancy Journey", label: "$0.99", premium: true, price: "$0.99", maker: () => simpleTemplate("our pregnancy journey", "paper", 8) },
  { id: "vacation", category: "Travel", name: "Vacation Memories", label: "$0.99", premium: true, price: "$0.99", maker: () => simpleTemplate("our vacation memories", "paper", 8) },
  { id: "graduation", category: "Family", name: "Graduation Memories", label: "$0.99", premium: true, price: "$0.99", maker: () => simpleTemplate("my graduation memories", "paper", 8) },
  { id: "christmas", category: "Seasonal", name: "Christmas Memories", label: "$0.99", premium: true, price: "$0.99", maker: () => simpleTemplate("our christmas memories", "christmas", 8) },
  { id: "thanksgiving", category: "Seasonal", name: "Thanksgiving Memories", label: "$0.99", premium: true, price: "$0.99", maker: () => simpleTemplate("thanksgiving memories", "paper", 8) },
  { id: "family", category: "Family", name: "Family Reunion", label: "$0.99", premium: true, price: "$0.99", maker: () => simpleTemplate("family reunion memories", "paper", 8) },
];

function useToast() {
  const [toast, setToast] = useState(null);
  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }
  return { toast, showToast };
}

function PaperModal({ title, message, confirmText = "Okay", cancelText = "Cancel", danger, onCancel, onConfirm }) {
  return (
    <div className="modalOverlay">
      <div className="paperModal">
        <div className="washiTape" />
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modalButtons">
          {onCancel && <button className="softBtn" onClick={onCancel}>{cancelText}</button>}
          <button className={danger ? "dangerBtn" : "primaryBtn"} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}


function exportBookHTML(book) {
  const esc = (v) => String(v ?? "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  const pages = (book.pages || []).map((p, idx) => {
    const els = (p.elements || []).map((el) => {
      const style = `left:${el.x}%;top:${el.y}%;width:${el.w}%;height:${el.h}%;transform:rotate(${el.rotate || 0}deg);color:${el.color || "#302926"};font-family:${el.font || "Poppins"};font-size:${el.size || 16}px;`;
      if (el.type === "photo" && el.src) return `<div class="el photo" style="${style}"><img src="${esc(el.src)}" /></div>`;
      if (el.type === "photo") return `<div class="el photo blank" style="${style}">Photo</div>`;
      if (el.type === "text") return `<div class="el text" style="${style}">${esc(el.text).replace(/\n/g, "<br>")}</div>`;
      if (el.type === "sticker" && el.src) return `<div class="el sticker" style="${style}"><img src="${esc(el.src)}" /></div>`;
      return `<div class="el sticker deco" style="${style}">${esc(el.label || el.value || "")}</div>`;
    }).join("");
    return `<section class="exportPage ${esc(p.bg)}"><span class="pageNum">${idx + 1}</span>${els}</section>`;
  }).join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(book.name)} Export</title><style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Poppins:wght@400;600;700&display=swap');
  body{margin:0;background:#efe7de;font-family:Poppins,sans-serif;color:#302926}.wrap{max-width:1000px;margin:0 auto;padding:28px}h1{font-family:'Playfair Display',serif}.exportPage{width:100%;aspect-ratio:4/3;background:#fffaf0;border:1px solid #e4d8ce;border-radius:18px;margin:0 0 28px;position:relative;overflow:hidden;page-break-after:always;box-shadow:0 12px 26px rgba(62,45,34,.12)}.babyBlue{background-color:#eaf4ff;background-image:linear-gradient(#b9cfe8 1px,transparent 1px),linear-gradient(90deg,#b9cfe8 1px,transparent 1px);background-size:12px 12px}.babyPink{background-color:#fff0f5;background-image:linear-gradient(#f2b9c9 1px,transparent 1px),linear-gradient(90deg,#f2b9c9 1px,transparent 1px);background-size:12px 12px}.paper{background:#fffdf8}.christmas{background:#fff8ee}.el{position:absolute;white-space:pre-wrap;text-align:center}.el img{width:100%;height:100%;object-fit:cover}.photo.blank{display:grid;place-items:center;background:#f4f0ea;border:2px dashed #cbbfb4;font-weight:700}.pageNum{position:absolute;right:10px;bottom:8px;font-size:12px;color:#766b65}@media print{body{background:white}.wrap{padding:0}.exportPage{box-shadow:none;border-radius:0;margin:0;width:100vw}}
  </style></head><body><div class="wrap"><h1>${esc(book.name)}</h1><button onclick="window.print()">Print / Save PDF</button>${pages}</div></body></html>`;
  const win = window.open("", "_blank");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
  } else {
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(book.name || "scrapbook").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [books, setBooks] = useState([]);
  const [screen, setScreen] = useState("loading");
  const [active, setActive] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [modal, setModal] = useState(null);
  const { toast, showToast } = useToast();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) { setScreen("auth"); return; }
      const pref = doc(db, "users", u.uid);
      await setDoc(pref, {
        name: u.displayName || "",
        email: u.email || "",
        photoURL: u.photoURL || "",
        subscription: isCreatorEmail(u.email) ? "Premium" : "Free",
        isCreator: isCreatorEmail(u.email),
        photoLimit: isCreatorEmail(u.email) ? 999999 : 15,
        photoCredits: isCreatorEmail(u.email) ? 999999 : 0,
        notifications: true,
        dark: false,
      }, { merge: true });
      const unsubProfile = onSnapshot(pref, (snap) => setProfile(snap.data() || {}));
      const q = query(collection(db, "users", u.uid, "scrapbooks"), orderBy("updatedAt", "desc"));
      const unsubBooks = onSnapshot(q, (snap) => setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
      setScreen("home");
      return () => { unsubProfile(); unsubBooks(); };
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", !!profile?.dark);
  }, [profile?.dark]);

  async function saveBook(book) {
    setActive(book);
    if (!user || !book?.id) return;
    await updateDoc(doc(db, "users", user.uid, "scrapbooks", book.id), { ...book, updatedAt: serverTimestamp() });
  }

  async function createBook(name, pages) {
    if (!user) return;
    const data = { name: name || "Untitled Scrapbook", pages, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const r = await addDoc(collection(db, "users", user.uid, "scrapbooks"), data);
    const book = { ...data, id: r.id };
    setActive(book); setPageIndex(0); setScreen("editor"); showToast("Scrapbook created ♡");
  }

  function askDeleteBook(book) {
    setModal({
      title: "Delete Scrapbook?",
      message: `Are you sure you want to delete “${book.name}”? This cannot be undone.`,
      danger: true,
      confirmText: "Delete",
      onConfirm: async () => {
        await deleteDoc(doc(db, "users", user.uid, "scrapbooks", book.id));
        setModal(null); setScreen("home"); showToast("Scrapbook deleted");
      },
      onCancel: () => setModal(null),
    });
  }

  function openBook(book, flip = false) { setActive(book); setPageIndex(0); setScreen(flip ? "flipbook" : "editor"); }
  function home() { setScreen("home"); }

  const unlockedProfile = withCreatorUnlock(profile, user);

  if (screen === "loading") return <div className="phoneFrame"><div className="loading">Loading...</div></div>;
  if (!user) return <Auth />;

  return (
    <div className="phoneFrame">
      {screen === "home" && <Home books={books} openBook={openBook} setScreen={setScreen} />}
      {screen === "scrapbooks" && <Scrapbooks books={books} openBook={openBook} deleteBook={askDeleteBook} />}
      {screen === "templates" && <Templates createBook={createBook} profile={unlockedProfile} setModal={setModal} />}
      {screen === "create" && <Create createBook={createBook} setScreen={setScreen} setModal={setModal} />}
      {screen === "premium" && <Premium profile={unlockedProfile} />}
      {screen === "profile" && <Profile user={user} profile={unlockedProfile} setModal={setModal} showToast={showToast} />}
      {screen === "editor" && active && <Editor book={active} pageIndex={pageIndex} setPageIndex={setPageIndex} saveBook={saveBook} setScreen={setScreen} home={home} profile={unlockedProfile} showToast={showToast} setModal={setModal} />}
      {screen === "flipbook" && active && <Flipbook book={active} pageIndex={pageIndex} setPageIndex={setPageIndex} setScreen={setScreen} deleteBook={askDeleteBook} />}
      {!["editor", "flipbook"].includes(screen) && <BottomNav screen={screen} setScreen={setScreen} />}
      {modal && <PaperModal {...modal} />}
      {toast && <div className="toast"><div className="washiTape" />{toast}</div>}
    </div>
  );
}

function Auth() {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault(); setError("");
    try {
      if (mode === "signup") await createUserWithEmailAndPassword(auth, email, pass);
      else await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="phoneFrame authScreen">
      <div className="authScrapbookCover">memories</div>
      <header className="authBrand">
        <div className="brandBadge">♡</div>
        <div className="brandScript">pocket</div>
        <h1>SCRAPBOOK</h1>
        <p>Capture your story. Cherish every moment.</p>
      </header>
      <form className="authCard" onSubmit={submit}>
        <div className="washiTape" />
        <h2>{mode === "signup" ? "Create account ♡" : "Welcome back ♡"}</h2>
        <label>Email address</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label>Password</label>
        <div className="passwordWrap">
          <input value={pass} onChange={(e) => setPass(e.target.value)} type={show ? "text" : "password"} required />
          <button type="button" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
        </div>
        {mode === "login" && <button type="button" className="linkBtn" onClick={() => email && sendPasswordResetEmail(auth, email)}>Forgot password?</button>}
        {error && <p className="error">{error}</p>}
        <button className="gradientBtn">{mode === "signup" ? "Create Account" : "Log In"}</button>
        <p className="switcher">{mode === "signup" ? "Already have an account?" : "New here?"} <button type="button" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "Log in" : "Create an account ♡"}</button></p>
      </form>
    </div>
  );
}

function BottomNav({ screen, setScreen }) {
  const items = [
    ["home", "⌂", "Home"],
    ["templates", "▧", "Templates"],
    ["create", "+", ""],
    ["premium", "♡", "Premium"],
    ["profile", "♙", "Profile"],
  ];
  return <nav className="bottomNav">{items.map(([id, icon, label]) => <button key={id} className={`${screen === id ? "active" : ""} ${id === "create" ? "createNav" : ""}`} onClick={() => setScreen(id)}><span>{icon}</span>{label && <small>{label}</small>}</button>)}</nav>;
}

function AppHeader({ setScreen }) {
  return <div className="appHeader"><button onClick={() => setScreen("home")}>⌂</button><div><span>pocket</span><b>SCRAPBOOK</b></div><button onClick={() => setScreen("premium")}>♡</button></div>;
}

function Home({ books, openBook, setScreen }) {
  const recent = books.slice(0, 4);
  return (
    <main className="page homePage">
      <AppHeader setScreen={setScreen} />
      <section className="welcomeHero">
        <div><h1>Welcome<br />back ♡</h1><p>Every story matters.<br />What will you capture today?</p></div>
        <div className="heroPolaroid" />
      </section>
      <section className="quickGrid">
        <button onClick={() => setScreen("create")}><span>＋</span><b>New Scrapbook</b><small>Start a new chapter</small></button>
        <button onClick={() => setScreen("scrapbooks")}><span>📖</span><b>My Scrapbooks</b><small>View and manage</small></button>
        <button onClick={() => setScreen("templates")}><span>▧</span><b>Templates</b><small>Browse beautiful pages</small></button>
        <button onClick={() => setScreen("premium")}><span>♡</span><b>Premium</b><small>Unlock more</small></button>
      </section>
      <div className="sectionTitle"><h2>My Scrapbooks</h2><button onClick={() => setScreen("scrapbooks")}>View all ›</button></div>
      <div className="coverRow">{recent.length ? recent.map((b) => <BookCover key={b.id} book={b} onClick={() => openBook(b)} />) : <p className="empty">No scrapbooks yet. Tap + to create one.</p>}</div>
    </main>
  );
}

function BookCover({ book, onClick, menu }) {
  const bg = book.pages?.[0]?.bg || "cream";
  return <button className={`bookCover ${bg}`} onClick={onClick}><div className="coverTape" /><div className="coverLeaf">🌿</div><span>{book.name}</span><small>{book.pages?.length || 1} pages</small>{menu}</button>;
}

function Scrapbooks({ books, openBook, deleteBook }) {
  const [menu, setMenu] = useState(null);
  return <main className="page"><h1>My Scrapbooks</h1><div className="scrapbookGrid">{books.map((book) => <div key={book.id} className="bookWrap"><BookCover book={book} onClick={() => openBook(book)} /><button className="dots" onClick={() => setMenu(menu === book.id ? null : book.id)}>⋯</button>{menu === book.id && <div className="paperMenu"><div className="washiTape" /><button onClick={() => openBook(book)}>Edit</button><button onClick={() => openBook(book, true)}>Flipbook</button><button onClick={() => exportBookHTML(book)}>Export</button><button onClick={() => deleteBook(book)}>Delete</button></div>}</div>)}</div></main>;
}

function Templates({ createBook, profile, setModal }) {
  const [category, setCategory] = useState("All");
  const list = TEMPLATES.filter(t => t.id !== "pocket").filter(t => category === "All" || t.category === category || (category === "Baby" && t.id.toLowerCase().includes("baby")));

  function choose(t) {
    if (t.premium && profile?.subscription !== "Premium") {
      setModal({
        title: "Premium Template",
        message: `${t.name} is ${t.price} or included with Premium. Payments are demo only until Stripe is connected.`,
        confirmText: "Preview Anyway",
        onCancel: () => setModal(null),
        onConfirm: () => { setModal(null); createBook(t.name, t.maker()); }
      });
      return;
    }
    createBook(t.name, t.maker());
  }

  return <main className="page"><h1>Templates</h1>
    <div className="templateTabs">
      {["All","Baby","Wedding","Travel","Seasonal","Family"].map(c => <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{c}</button>)}
    </div>
    <div className="templateGrid">{list.map((t) => <button key={t.id} className={`templateCard ${t.premium ? "locked" : ""}`} onClick={() => choose(t)}>
      <TemplateThumb template={t} />
      <b>{t.name}</b><small>{t.label}</small>
    </button>)}</div>
  </main>;
}

function TemplateThumb({ template }) {
  let first;
  try { first = template.maker()?.[0] || page("cream", []); } catch { first = page("cream", []); }
  const els = (first.elements || []).slice(0, 14);
  return <div className={`templatePreview ${template.id} ${first.bg || "cream"}`}>
    {els.map((el) => <div key={el.id} className="templateThumbEl" style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`, transform: `rotate(${el.rotate || 0}deg)`, color: el.color, fontFamily: el.font, fontSize: Math.max(6, (el.size || 16) * .38) }}>
      {el.type === "photo" && <div className="templatePhotoMini" />}
      {el.type === "text" && <span>{el.text}</span>}
      {el.type === "sticker" && el.src && <img src={el.src} alt="" />}
      {el.type === "sticker" && !el.src && el.kind && <DecoSticker kind={el.kind} label={el.label || el.value} />}
      {el.type === "sticker" && !el.src && !el.kind && <span>{el.value}</span>}
    </div>)}
    {template.premium && <em className="priceBubble">{template.price}</em>}
  </div>;
}


function Create({ createBook, setScreen, setModal }) {
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("blank");
  const selected = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  return <main className="page"><button className="backBtn" onClick={() => setScreen("home")}>⌂ Home</button><section className="createPaper"><div className="washiTape" /><h1>Create Scrapbook</h1><input placeholder="Name your scrapbook" value={name} onChange={(e) => setName(e.target.value)} /><select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>{TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name} — {t.label}</option>)}</select><button className="gradientBtn" onClick={() => createBook(name || selected.name, selected.maker())}>Create Scrapbook</button></section></main>;
}

function Premium({ profile }) {
  return <main className="page"><h1>Premium</h1><section className="createPaper"><div className="washiTape" /><h2>Your plan: {profile?.isCreator ? "Creator / Premium" : profile?.subscription || "Free"}</h2>{profile?.isCreator && <p className="hint">⭐ Creator account — everything is unlocked free.</p>}<table><tbody><tr><th>Feature</th><th>Free</th><th>Premium</th></tr><tr><td>Photo uploads</td><td>15</td><td>Unlimited</td></tr><tr><td>Premium templates</td><td>$0.99 each</td><td>Included</td></tr><tr><td>Advanced stickers</td><td>Basic</td><td>All</td></tr><tr><td>Curved text</td><td>—</td><td>✓</td></tr></tbody></table><div className="photoBuyCard"><div className="photoBuyIcon">📷</div><div className="photoBuyInfo"><h3>Need more photo space?</h3><p>Add 20 more photo uploads to your account.</p></div><div className="photoBuyPrice">$0.99</div><button onClick={() => alert("Stripe checkout coming soon ♡")}>Buy 20</button></div><button className="gradientBtn">Upgrade $4.99/mo</button><p className="hint">Stripe needed before real payments work.</p></section></main>;
}

function Profile({ user, profile, setModal, showToast }) {
  const [name, setName] = useState(profile?.name || user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [pass, setPass] = useState("");
  useEffect(() => setName(profile?.name || user?.displayName || ""), [profile?.name, user?.displayName]);

  async function uploadProfile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const path = ref(storage, `users/${user.uid}/profile/${Date.now()}-${file.name}`);
      await uploadBytes(path, file);
      const url = await getDownloadURL(path);
      await updateProfile(user, { photoURL: url });
      await updateDoc(doc(db, "users", user.uid), { photoURL: url });
      showToast("Profile picture saved ♡");
    } catch (err) {
      setModal({ title: "Upload Failed", message: "Check Firebase Storage rules. Signed-in users need upload permission.", confirmText: "Okay", onConfirm: () => setModal(null) });
    }
  }
  function deleteAccount() {
    setModal({ title: "Delete Account?", message: "Are you sure? This permanently deletes your account. You may need to log in again first.", danger: true, confirmText: "Delete", onCancel: () => setModal(null), onConfirm: async () => { try { await deleteUser(user); setModal(null); } catch { setModal({ title: "Log in again", message: "For security, log out and log back in before deleting your account.", confirmText: "Okay", onConfirm: () => setModal(null) }); } } });
  }
  return <main className="page profilePage"><h1>Profile</h1><section className="profileCard"><div className="washiTape" /><label className="avatarFrame"><img src={profile?.photoURL || user?.photoURL || "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=300"} alt="profile" /><input type="file" hidden accept="image/*" onChange={uploadProfile} /></label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" /><button onClick={async () => { await updateProfile(user, { displayName: name }); await updateDoc(doc(db, "users", user.uid), { name }); showToast("Name saved ♡"); }}>Save Name</button><h2>Settings</h2><label className="toggle">Email notifications about new updates <input type="checkbox" checked={!!profile?.notifications} onChange={(e) => updateDoc(doc(db, "users", user.uid), { notifications: e.target.checked })} /></label><label className="toggle">Dark theme <input type="checkbox" checked={!!profile?.dark} onChange={(e) => updateDoc(doc(db, "users", user.uid), { dark: e.target.checked })} /></label><input value={email} onChange={(e) => setEmail(e.target.value)} /><button onClick={() => updateEmail(user, email)}>Update Email</button><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="New password" /><button onClick={() => pass && updatePassword(user, pass)}>Update Password</button><p>Subscription: {profile?.subscription || "Free"}</p><button onClick={() => signOut(auth)}>Logout</button><button className="dangerBtn full" onClick={deleteAccount}>Delete Account</button></section></main>;
}

function DecoSticker({ kind, label }) {
  return <div className={`decoSticker ${kind || ""}`}>{label && <span>{label}</span>}</div>;
}

function Editor({ book, pageIndex, setPageIndex, saveBook, setScreen, home, profile, showToast, setModal }) {
  const [selected, setSelected] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [search, setSearch] = useState("");
  const pageRef = useRef(null);
  const cur = book.pages?.[pageIndex] || page("cream", []);
  const selectedEl = cur.elements.find((e) => e.id === selected);

  function changePage(fn) {
    const next = { ...book, pages: (book.pages || []).map((p, i) => i === pageIndex ? { ...p, elements: [...(p.elements || [])] } : p) };
    fn(next.pages[pageIndex], next);
    saveBook(next);
  }
  function updateElement(id, patch) { changePage((p) => { p.elements = p.elements.map((e) => e.id === id ? { ...e, ...patch } : e); }); }
  function addElement(el) { changePage((p) => { p.elements.push(el); }); }
  function removeElement(id) { const el = cur.elements.find(e => e.id === id); if (el?.locked) return; changePage((p) => { p.elements = p.elements.filter((e) => e.id !== id); }); setSelected(null); }
  function duplicateElement(el) { if (el.locked) return; addElement({ ...el, id: uid(), x: el.x + 4, y: el.y + 4 }); }

  async function uploadPhoto(e, id) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const url = URL.createObjectURL(file);
      updateElement(id, { src: url, pendingFileName: file.name });
      const path = ref(storage, `users/${auth.currentUser.uid}/scrapbook-photos/${Date.now()}-${file.name}`);
      await uploadBytes(path, file);
      const downloadURL = await getDownloadURL(path);
      updateElement(id, { src: downloadURL, pendingFileName: null });
      showToast("Photo uploaded ♡");
    } catch {
      setModal({ title: "Upload Failed", message: "The image preview was added, but Firebase Storage blocked saving. Check your Storage rules.", confirmText: "Okay", onConfirm: () => setModal(null) });
    }
  }

  function pointerDown(ev, el) {
    if (el.locked) return;
    ev.stopPropagation(); setSelected(el.id);
    const rect = pageRef.current.getBoundingClientRect();
    const startX = ev.clientX; const startY = ev.clientY; const sx = el.x; const sy = el.y;
    function move(e) { updateElement(el.id, { x: Math.max(0, Math.min(92, sx + ((e.clientX - startX) / rect.width) * 100)), y: Math.max(0, Math.min(92, sy + ((e.clientY - startY) / rect.height) * 100)) }); }
    function up() { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); }
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  }

  function resizeDown(ev, el) {
    if (el.locked) return;
    ev.stopPropagation();
    const rect = pageRef.current.getBoundingClientRect();
    const startX = ev.clientX; const startY = ev.clientY; const sw = el.w; const sh = el.h;
    function move(e) { updateElement(el.id, { w: Math.max(6, Math.min(95, sw + ((e.clientX - startX) / rect.width) * 100)), h: Math.max(5, Math.min(95, sh + ((e.clientY - startY) / rect.height) * 100)) }); }
    function up() { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); }
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  }

  function onDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const rect = pageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const url = URL.createObjectURL(file);
    const newEl = photoEl(Math.max(0, x - 20), Math.max(0, y - 15), 40, 30, { src: url });
    addElement(newEl);
  }

  const filtered = STICKERS.filter(s => `${s.name} ${s.category}`.toLowerCase().includes(search.toLowerCase()));

  return <main className="editorPage"><header className="editorHeader"><button onClick={home}>⌂ Home</button><strong>{book.name}</strong><button onClick={() => setScreen("flipbook")}>Flipbook</button></header><div className="editorScroll"><div ref={pageRef} className={`scrapPage ${cur.bg}`} onClick={() => setSelected(null)} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>{cur.elements.map((el) => <div key={el.id} className={`editorEl ${selected === el.id ? "selected" : ""} ${el.locked ? "locked" : ""}`} style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`, transform: `rotate(${el.rotate || 0}deg)` }} onMouseDown={(e) => pointerDown(e, el)} onClick={(e) => { e.stopPropagation(); setSelected(el.id); }}>{el.type === "photo" && (el.src ? <img src={el.src} alt="" /> : <label className="uploadBox">Upload Photo<input type="file" accept="image/*" hidden onChange={(e) => uploadPhoto(e, el.id)} /></label>)}{el.type === "text" && <textarea disabled={el.locked} value={el.text} style={{ fontSize: el.size, color: el.color, fontFamily: el.font }} onChange={(e) => updateElement(el.id, { text: e.target.value })} />}{el.type === "sticker" && (el.src ? <img src={el.src} alt={el.value || "sticker"} /> : el.kind ? <DecoSticker kind={el.kind} label={el.label || el.value} /> : <div className="stickerEmoji">{el.value}</div>)}{selected === el.id && <><div className="miniTools"><button onClick={() => updateElement(el.id, { locked: !el.locked })}>{el.locked ? "🔒" : "🔓"}</button><button disabled={el.locked} onClick={() => updateElement(el.id, { rotate: (el.rotate || 0) + 10 })}>↻</button><button disabled={el.locked} onClick={() => duplicateElement(el)}>⧉</button><button disabled={el.locked} onClick={() => removeElement(el.id)}>🗑</button></div>{!el.locked && <span className="resizeHandle" onMouseDown={(e) => resizeDown(e, el)} />}</>}</div>)}</div><div className="pageNav"><button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>Prev</button><span>Page {pageIndex + 1} of {book.pages.length}</span><button disabled={pageIndex === book.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}>Next</button></div>{selectedEl?.type === "text" && !selectedEl.locked && <div className="textPanel"><select value={selectedEl.font} onChange={(e) => updateElement(selectedEl.id, { font: e.target.value })}>{FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}</select><input type="range" min="10" max="54" value={selectedEl.size} onChange={(e) => updateElement(selectedEl.id, { size: Number(e.target.value) })} /><div className="colorRow">{COLORS.map(c => <button key={c} style={{ background: c }} onClick={() => updateElement(selectedEl.id, { color: c })} />)}</div><button onClick={() => setModal({ title: "Premium Effect", message: "Curved text is part of Premium.", confirmText: "Okay", onConfirm: () => setModal(null) })}>Curve Text ✨</button></div>}</div><nav className="editorTools"><button onClick={() => addElement(textEl("New text", 25, 25, 42, 10, { size: 22 }))}>Text</button><button onClick={() => addElement(photoEl(20, 22, 52, 42))}>Photo</button><button onClick={() => setSheet(sheet === "stickers" ? null : "stickers")}>Stickers</button><button onClick={() => setSheet(sheet === "backgrounds" ? null : "backgrounds")}>Backgrounds</button><button onClick={() => changePage((p, next) => next.pages.push(page("cream", [])))}>Page</button></nav>{sheet && <div className="stickerSheet"><div className="washiTape" />{sheet === "stickers" ? <><input placeholder="Search stickers..." value={search} onChange={(e) => setSearch(e.target.value)} /><div className="stickerGrid">{emojiStickers.map((s) => <button key={s} onClick={() => { addElement(stickerEl(s, 30, 30, 12, 12)); setSheet(null); }}>{s}</button>)}{filtered.map((s) => <button key={s.src} className={s.premium ? "premiumSticker" : ""} onClick={() => { if (s.premium && profile?.subscription !== "Premium") { setModal({ title: "Premium Sticker", message: `${s.name} is part of Premium stickers.`, confirmText: "Okay", onConfirm: () => setModal(null) }); return; } addElement(stickerEl(s.name, 30, 30, 18, 18, { src: s.src })); setSheet(null); }}><img src={s.src} alt={s.name} />{s.premium && <span>🔒</span>}</button>)}</div></> : <div className="backgroundGrid">{BG_OPTIONS.map((b) => <button key={b.id} onClick={() => { changePage((p) => { p.bg = b.id; }); setSheet(null); }}>{b.name}</button>)}</div>}</div>}</main>;
}

function PreviewPage({ p }) {
  return <div className={`scrapPage flipSpreadPage ${p.bg}`}>{(p.elements || []).map(el => <div key={el.id} className="previewEl" style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`, transform: `rotate(${el.rotate || 0}deg)`, color: el.color, fontFamily: el.font, fontSize: el.size }}>{el.type === "text" ? el.text : el.type === "photo" && el.src ? <img src={el.src} alt="" /> : el.type === "sticker" && el.src ? <img src={el.src} alt="" /> : el.type === "sticker" && el.kind ? <DecoSticker kind={el.kind} label={el.label || el.value} /> : el.value}</div>)}</div>;
}

function Flipbook({ book, pageIndex, setPageIndex, setScreen, deleteBook }) {
  const [menu, setMenu] = useState(false);
  const spreadStart = Math.floor(pageIndex / 2) * 2;
  const left = book.pages?.[spreadStart] || page();
  const right = book.pages?.[spreadStart + 1] || null;
  function exportPage() { exportBookHTML(book); }
  return <main className="page flipPageScreen"><header className="flipHeader"><button className="backBtn" onClick={() => setScreen("editor")}>← Back</button><strong>{book.name}</strong><button className="dots" onClick={() => setMenu(!menu)}>⋯</button></header>{menu && <div className="paperMenu flip"><div className="washiTape" /><button onClick={exportPage}>Export / Print</button><button onClick={() => setScreen("editor")}>Edit</button><button onClick={() => deleteBook(book)}>Delete</button></div>}<div className="flipBookShell"><div className="flipSpread"><PreviewPage p={left} />{right ? <PreviewPage p={right} /> : <div className="scrapPage flipSpreadPage blank" />}</div></div><div className="pageNav"><button disabled={spreadStart === 0} onClick={() => setPageIndex(Math.max(0, spreadStart - 2))}>Prev</button><span>Pages {spreadStart + 1}{right ? `–${spreadStart + 2}` : ""} of {book.pages.length}</span><button disabled={spreadStart + 2 >= book.pages.length} onClick={() => setPageIndex(spreadStart + 2)}>Next</button></div></main>;
}

function ErrorBoundaryApp() {
  const [err, setErr] = useState(null);
  useEffect(() => {
    const handler = (e) => setErr(e.error || e.message);
    window.addEventListener("error", handler);
    window.addEventListener("unhandledrejection", (e) => setErr(e.reason));
    return () => window.removeEventListener("error", handler);
  }, []);
  if (err) return <div className="phoneFrame"><div className="errorBox"><h1>App Error</h1><p>{String(err?.message || err)}</p></div></div>;
  return <App />;
}

createRoot(document.getElementById("root")).render(<ErrorBoundaryApp />);

