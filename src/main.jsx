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
  "dubosemo2@gmail.com",
  "haileemccowen@icloud.com",
  "sweetkybug09@gmail.com",
];

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const bgOptions = [
  { id: "cream", name: "Cream" },
  { id: "grid", name: "Grid" },
  { id: "dots", name: "Dots" },
  { id: "paper", name: "Paper" },
  { id: "pink", name: "Baby Pink" },
  { id: "blue", name: "Baby Blue" },
  { id: "lavender", name: "Light Lavender" },
  { id: "ginghamPink", name: "Pink Gingham" },
  { id: "ginghamBlue", name: "Blue Gingham" },
];

const fonts = [
  "Georgia",
  "serif",
  "cursive",
  "Arial",
  "Trebuchet MS",
  "Times New Roman",
];

const stickerLibrary = [
  { name: "Pink Heart", tag: "love heart", category: "Free", value: "♡", premium: false },
  { name: "Star", tag: "star sparkle", category: "Free", value: "☆", premium: false },
  { name: "Flower", tag: "flower nature", category: "Free", value: "✿", premium: false },
  { name: "Sparkle", tag: "sparkle aesthetic", category: "Free", value: "✨", premium: false },
  { name: "Bow", tag: "bow baby girl", category: "Baby", value: "🎀", premium: true },
  { name: "Teddy", tag: "bear baby", category: "Baby", value: "🧸", premium: true },
  { name: "Camera", tag: "camera travel", category: "Travel", value: "📷", premium: true },
  { name: "Plane", tag: "plane travel", category: "Travel", value: "✈️", premium: true },
  { name: "Ring", tag: "wedding ring", category: "Wedding", value: "💍", premium: true },
  { name: "Tree", tag: "christmas tree", category: "Holiday", value: "🎄", premium: true },
  { name: "Graduate", tag: "graduation school", category: "School", value: "🎓", premium: true },
  { name: "Cake", tag: "birthday celebration", category: "Celebration", value: "🎂", premium: true },
  { name: "Leaf", tag: "leaf nature", category: "Nature", value: "🌿", premium: false },
  { name: "Home", tag: "home cozy", category: "Cozy", value: "🏡", premium: true },
  { name: "Pet", tag: "animal pet", category: "Animals", value: "🐾", premium: true },
  // If you uploaded files directly inside public, these will work too:
  { name: "Animals 01", tag: "animal premium", category: "Animals", src: "/animals_01.png", premium: true },
  { name: "Celebration 01", tag: "celebration party", category: "Celebration", src: "/celebration_01.png", premium: false },
  { name: "Frames Labels", tag: "frame label note", category: "Frames", src: "/frames_labels_01.png", premium: false },
  { name: "Love 01", tag: "love heart", category: "Love", src: "/love_01.png", premium: false },
  { name: "Travel 01", tag: "travel vacation", category: "Travel", src: "/travel_01.png", premium: true },
];

function baseElement(type, extra) {
  return {
    id: makeId(),
    type,
    x: 20,
    y: 20,
    w: 35,
    h: 15,
    rotate: 0,
    locked: false,
    z: 1,
    ...extra,
  };
}

function textEl(text, x, y, w, h, size = 18, locked = false, extra = {}) {
  return baseElement("text", { text, x, y, w, h, size, color: "#5b433b", font: "cursive", locked, ...extra });
}

function photoEl(x, y, w, h, rotate = 0, locked = false) {
  return baseElement("photo", { x, y, w, h, rotate, src: "", locked });
}

function stickerEl(value, x, y, w = 10, h = 10, locked = false, extra = {}) {
  return baseElement("sticker", { value, x, y, w, h, locked, ...extra });
}

function page(bg = "cream", elements = []) {
  return { id: makeId(), bg, elements };
}

function simpleTemplate(name, bg = "cream") {
  return [
    page(bg, [
      textEl(name, 12, 9, 76, 11, 25, true),
      photoEl(17, 28, 66, 43, -2),
      textEl("favorite memory ♡", 20, 77, 60, 8, 18, false),
      stickerEl("♡", 78, 12, 9, 9, true),
    ]),
    page(bg, [photoEl(12, 14, 76, 55, 2), textEl("write the story here...", 15, 75, 70, 11, 16, false)]),
  ];
}

function babyTemplate(kind = "girl") {
  const girl = kind === "girl";
  const bg = girl ? "ginghamPink" : "ginghamBlue";
  const accent = girl ? "#d56d95" : "#5e88b7";
  const sticker = girl ? "🎀" : "🧸";
  const title = girl ? "Baby Girl First Year" : "Baby Boy First Year";
  const pages = [];
  pages.push(
    page(bg, [
      textEl("baby's", 12, 10, 36, 9, 25, true, { color: accent }),
      textEl("first year", 12, 19, 48, 10, 27, true, { color: accent }),
      photoEl(12, 39, 32, 35, -5),
      photoEl(53, 34, 29, 30, 4),
      stickerEl(sticker, 72, 14, 12, 12, true),
      stickerEl("♡", 46, 76, 9, 9, true, { color: accent }),
      textEl(girl ? "our little girl ♡" : "our little boy ♡", 50, 69, 36, 8, 16, false, { color: accent }),
    ])
  );
  pages.push(
    page(bg, [
      textEl("birth details", 10, 9, 50, 9, 24, true, { color: accent }),
      photoEl(12, 25, 38, 42, -2),
      textEl("date:\ntime:\nweight:\nlength:", 57, 27, 32, 30, 15, false),
      stickerEl("☆", 77, 66, 9, 9, true),
    ])
  );
  for (let i = 1; i <= 12; i++) {
    pages.push(
      page(bg, [
        textEl(`${i}`, 10, 9, 16, 15, 34, true, { color: accent }),
        textEl(`month${i > 1 ? "s" : ""}`, 22, 13, 31, 8, 18, true, { color: accent }),
        photoEl(31, 22, 43, 42, 2),
        textEl("learning & growing ♡", 21, 70, 58, 8, 15, true, { color: accent }),
        textEl("notes...", 17, 80, 66, 8, 14, false),
        stickerEl(i % 2 ? sticker : "♡", 76, 13, 10, 10, true),
      ])
    );
  }
  pages.push(
    page(bg, [
      textEl("one year of you", 10, 10, 70, 10, 26, true, { color: accent }),
      photoEl(14, 27, 72, 45, -1),
      textEl("favorite moments...", 17, 78, 66, 9, 15, false),
      stickerEl("✨", 77, 15, 8, 8, true),
    ])
  );
  return { name: title, price: "$0.99", pages };
}

const templateList = [
  { id: "blank", title: "Blank Scrapbook", price: "Free", premium: false, cover: "blankCover", build: () => [page("cream", [])] },
  { id: "memory", title: "Memory Book", price: "Free", premium: false, cover: "memoryCover", build: () => simpleTemplate("Memory Book", "paper") },
  { id: "boy", title: "Baby Boy First Year", price: "$0.99", premium: true, cover: "boyCover", build: () => babyTemplate("boy").pages },
  { id: "girl", title: "Baby Girl First Year", price: "$0.99", premium: true, cover: "girlCover", build: () => babyTemplate("girl").pages },
  { id: "wedding", title: "Wedding Book", price: "$0.99", premium: true, cover: "weddingCover", build: () => simpleTemplate("Wedding Book", "paper") },
  { id: "pregnancy", title: "Pregnancy Journey", price: "$0.99", premium: true, cover: "pregnancyCover", build: () => simpleTemplate("Pregnancy Journey", "pink") },
  { id: "vacation", title: "Vacation Memories", price: "$0.99", premium: true, cover: "vacationCover", build: () => simpleTemplate("Vacation Memories", "blue") },
  { id: "graduation", title: "Graduation Memories", price: "$0.99", premium: true, cover: "graduationCover", build: () => simpleTemplate("Graduation Memories", "cream") },
  { id: "christmas", title: "Christmas Memories", price: "$0.99", premium: true, cover: "christmasCover", build: () => simpleTemplate("Christmas Memories", "paper") },
  { id: "thanksgiving", title: "Thanksgiving Memories", price: "$0.99", premium: true, cover: "thanksgivingCover", build: () => simpleTemplate("Thanksgiving Memories", "cream") },
  { id: "family", title: "Family Reunion", price: "$0.99", premium: true, cover: "familyCover", build: () => simpleTemplate("Family Reunion", "lavender") },
];

function isCreator(user) {
  const email = user?.email?.toLowerCase();
  return !!email && CREATOR_EMAILS.includes(email);
}

function isUnlocked(user, profile) {
  return isCreator(user) || profile?.subscription === "Premium" || profile?.premium === true;
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [books, setBooks] = useState([]);
  const [screen, setScreen] = useState("loading");
  const [activeBook, setActiveBook] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setScreen("auth");
        return;
      }
      const userRef = doc(db, "users", u.uid);
      await setDoc(
        userRef,
        {
          name: u.displayName || "",
          email: u.email || "",
          photoURL: u.photoURL || "",
          subscription: isCreator(u) ? "Creator" : "Free",
          notifications: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      const unsubProfile = onSnapshot(userRef, (snap) => setProfile(snap.data() || {}));
      const q = query(collection(db, "users", u.uid, "scrapbooks"), orderBy("updatedAt", "desc"));
      const unsubBooks = onSnapshot(q, (snap) => setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
      setScreen("home");
      return () => {
        unsubProfile();
        unsubBooks();
      };
    });
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", !!profile.dark);
  }, [profile.dark]);

  async function createBook(template, name) {
    if (!user) return;
    const locked = template.premium && !isUnlocked(user, profile);
    if (locked) {
      setModal({ type: "premium", title: template.title });
      return;
    }
    const data = {
      name: name || template.title,
      templateId: template.id,
      pages: template.build(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deleted: false,
    };
    const r = await addDoc(collection(db, "users", user.uid, "scrapbooks"), data);
    setActiveBook({ ...data, id: r.id });
    setPageIndex(0);
    setScreen("editor");
  }

  async function saveBook(book) {
    if (!user || !book?.id) return;
    setActiveBook(book);
    await updateDoc(doc(db, "users", user.uid, "scrapbooks", book.id), {
      ...book,
      updatedAt: serverTimestamp(),
    });
  }

  function requestDeleteBook(book) {
    setModal({ type: "deleteBook", book });
  }

  async function reallyDeleteBook(book) {
    if (!user || !book?.id) return;
    await deleteDoc(doc(db, "users", user.uid, "scrapbooks", book.id));
    setModal(null);
    if (activeBook?.id === book.id) setScreen("home");
  }

  function openBook(book, flip = false) {
    setActiveBook(book);
    setPageIndex(0);
    setScreen(flip ? "flipbook" : "editor");
  }

  if (screen === "loading") return <PhoneFrame><div className="loading">Loading Pocket Scrapbook...</div></PhoneFrame>;
  if (!user) return <Auth />;

  const unlocked = isUnlocked(user, profile);

  return (
    <PhoneFrame>
      <AppHeader screen={screen} setScreen={setScreen} />
      {screen === "home" && <Home books={books} openBook={openBook} setScreen={setScreen} />}
      {screen === "scrapbooks" && <Scrapbooks books={books} openBook={openBook} requestDeleteBook={requestDeleteBook} />}
      {screen === "create" && <Create templates={templateList} createBook={createBook} unlocked={unlocked} />}
      {screen === "templates" && <Templates templates={templateList} createBook={createBook} unlocked={unlocked} />}
      {screen === "premium" && <Premium profile={profile} creator={isCreator(user)} />}
      {screen === "profile" && <Profile user={user} profile={profile} setModal={setModal} creator={isCreator(user)} />}
      {screen === "editor" && activeBook && <Editor book={activeBook} pageIndex={pageIndex} setPageIndex={setPageIndex} saveBook={saveBook} setScreen={setScreen} user={user} profile={profile} setModal={setModal} />}
      {screen === "flipbook" && activeBook && <Flipbook book={activeBook} pageIndex={pageIndex} setPageIndex={setPageIndex} setScreen={setScreen} requestDeleteBook={requestDeleteBook} />}
      {!["editor", "flipbook"].includes(screen) && <BottomNav screen={screen} setScreen={setScreen} />}
      <PaperModal modal={modal} setModal={setModal} onDeleteBook={reallyDeleteBook} user={user} />
    </PhoneFrame>
  );
}

function PhoneFrame({ children }) {
  return <div className="phoneFrame">{children}</div>;
}

function AppHeader({ screen, setScreen }) {
  return (
    <header className="appHeader">
      <button className="homeIcon" onClick={() => setScreen("home")}>⌂</button>
      <div>
        <strong>Pocket Scrapbook</strong>
        <span>{screen}</span>
      </div>
    </header>
  );
}

function BottomNav({ screen, setScreen }) {
  const tabs = [
    ["home", "Home", "⌂"],
    ["templates", "Templates", "▧"],
    ["create", "Create", "+"],
    ["premium", "Premium", "♡"],
    ["profile", "Profile", "☻"],
  ];
  return (
    <nav className="bottomNav">
      {tabs.map(([id, label, icon]) => (
        <button key={id} className={screen === id ? "active" : ""} onClick={() => setScreen(id)}>
          <b>{icon}</b>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function Auth() {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "signup") await createUserWithEmailAndPassword(auth, email, pass);
      else await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      setErr(error.message);
    }
  }

  return (
    <PhoneFrame>
      <main className="authPage">
        <div className="scrapCoverDeco">memories</div>
        <section className="authBrand">
          <div className="badge">♡</div>
          <h1>Pocket Scrapbook</h1>
          <p>Capture your story. Cherish every moment.</p>
        </section>
        <form className="authCard" onSubmit={submit}>
          <h2>{mode === "signup" ? "Create account ♡" : "Welcome back ♡"}</h2>
          <label>Email address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Password</label>
          <div className="passwordField">
            <input type={show ? "text" : "password"} value={pass} onChange={(e) => setPass(e.target.value)} required />
            <button type="button" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
          </div>
          {mode === "login" && <button type="button" className="linkBtn" onClick={() => email && sendPasswordResetEmail(auth, email)}>Forgot password?</button>}
          {err && <p className="error">{err}</p>}
          <button className="primary">{mode === "signup" ? "Create Account" : "Log In"}</button>
          <p className="swap">{mode === "signup" ? "Already have an account?" : "New here?"} <button type="button" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "Log in" : "Create account"}</button></p>
        </form>
      </main>
    </PhoneFrame>
  );
}

function Home({ books, openBook, setScreen }) {
  return (
    <main className="page homePage">
      <section className="heroCard">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>Your memories, beautifully kept.</h1>
          <button onClick={() => setScreen("create")}>Create a Scrapbook</button>
        </div>
        <div className="miniCover">pocket scrapbook</div>
      </section>
      <section className="sectionHead"><h2>Recent Scrapbooks</h2><button onClick={() => setScreen("scrapbooks")}>View all</button></section>
      <div className="bookRow">
        {books.slice(0, 5).map((book) => <BookCover key={book.id} book={book} onClick={() => openBook(book)} />)}
        {books.length === 0 && <div className="emptyCard">No scrapbooks yet. Tap Create to start one.</div>}
      </div>
    </main>
  );
}

function Scrapbooks({ books, openBook, requestDeleteBook }) {
  const [menu, setMenu] = useState(null);
  return (
    <main className="page">
      <h1>My Scrapbooks</h1>
      <div className="coverGrid">
        {books.map((book) => (
          <div className="coverWrap" key={book.id}>
            <BookCover book={book} onClick={() => openBook(book)} />
            <button className="dots" onClick={() => setMenu(menu === book.id ? null : book.id)}>⋯</button>
            {menu === book.id && <div className="cardMenu"><button onClick={() => openBook(book)}>Edit</button><button onClick={() => openBook(book, true)}>Flipbook</button><button onClick={() => requestDeleteBook(book)}>Delete</button></div>}
          </div>
        ))}
      </div>
    </main>
  );
}

function BookCover({ book, onClick }) {
  const bg = book?.pages?.[0]?.bg || "cream";
  return (
    <button className={`bookCover ${bg}`} onClick={onClick}>
      <div className="coverTape"></div>
      <div className="coverTitle">{book.name}</div>
      <div className="coverPhoto"></div>
      <small>{book.pages?.length || 1} pages</small>
    </button>
  );
}

function Create({ templates, createBook, unlocked }) {
  const [selected, setSelected] = useState(templates[0]);
  const [name, setName] = useState("");
  return (
    <main className="page">
      <h1>Create</h1>
      <div className="templatePickerSmall">
        {templates.map((t) => <button key={t.id} className={selected.id === t.id ? "chosen" : ""} onClick={() => setSelected(t)}>{t.title}</button>)}
      </div>
      <div className={`templateBigPreview ${selected.cover}`}><span>{selected.title}</span><em>{selected.price}</em></div>
      <input className="prettyInput" placeholder="Name your scrapbook" value={name} onChange={(e) => setName(e.target.value)} />
      <button className="primary" onClick={() => createBook(selected, name)}>{selected.premium && !unlocked ? `Unlock ${selected.price}` : "Create Scrapbook"}</button>
    </main>
  );
}

function Templates({ templates, createBook, unlocked }) {
  return (
    <main className="page">
      <h1>Templates</h1>
      <div className="templateGrid">
        {templates.map((t) => (
          <button key={t.id} className="templateCard" onClick={() => createBook(t)}>
            <div className={`templateCover ${t.cover}`}><span>{t.title}</span></div>
            <b>{t.title}</b>
            <small>{t.premium && !unlocked ? `🔒 ${t.price}` : t.price}</small>
          </button>
        ))}
      </div>
    </main>
  );
}

function Editor({ book, pageIndex, setPageIndex, saveBook, setScreen, user, profile, setModal }) {
  const [selected, setSelected] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [stickerSearch, setStickerSearch] = useState("");
  const [history, setHistory] = useState([]);
  const pageRef = useRef(null);
  const currentPage = book.pages[pageIndex] || book.pages[0];
  const unlocked = isUnlocked(user, profile);

  useEffect(() => {
    const timer = setInterval(() => saveBook(book), 5000);
    return () => clearInterval(timer);
  }, [book]);

  function changeBook(fn, pushHistory = true) {
    if (pushHistory) setHistory((h) => [...h.slice(-10), JSON.stringify(book)]);
    const next = { ...book, pages: book.pages.map((p) => ({ ...p, elements: [...(p.elements || [])] })) };
    fn(next.pages[pageIndex], next);
    saveBook(next);
  }

  function updateElement(id, patch) {
    changeBook((p) => { p.elements = p.elements.map((el) => el.id === id ? { ...el, ...patch } : el); });
  }

  function addElement(el) {
    changeBook((p) => { p.elements.push({ ...el, z: p.elements.length + 1 }); });
  }

  function removeElement(id) {
    changeBook((p) => { p.elements = p.elements.filter((el) => el.id !== id); });
    setSelected(null);
  }

  function duplicateElement(el) {
    addElement({ ...el, id: makeId(), x: Math.min(85, el.x + 4), y: Math.min(85, el.y + 4), locked: false });
  }

  function undo() {
    const last = history[history.length - 1];
    if (!last) return;
    const restored = JSON.parse(last);
    setHistory((h) => h.slice(0, -1));
    saveBook(restored);
  }

  async function uploadPhoto(file, id = null) {
    if (!file || !user) return;
    try {
      const storageRef = ref(storage, `users/${user.uid}/photos/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      if (id) updateElement(id, { src: url });
      else addElement(photoEl(15, 18, 70, 45, 0, false));
    } catch (err) {
      setModal({ type: "notice", title: "Upload failed", text: "Check Firebase Storage rules and try again." });
    }
  }

  function startDrag(e, el) {
    if (el.locked) return;
    const startX = e.clientX || e.touches?.[0]?.clientX;
    const startY = e.clientY || e.touches?.[0]?.clientY;
    const rect = pageRef.current.getBoundingClientRect();
    const sx = el.x;
    const sy = el.y;
    function move(ev) {
      const cx = ev.clientX || ev.touches?.[0]?.clientX;
      const cy = ev.clientY || ev.touches?.[0]?.clientY;
      updateElement(el.id, { x: Math.max(0, Math.min(92, sx + ((cx - startX) / rect.width) * 100)), y: Math.max(0, Math.min(92, sy + ((cy - startY) / rect.height) * 100)) });
    }
    function up() {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);
  }

  const filteredStickers = stickerLibrary.filter((s) => `${s.name} ${s.tag} ${s.category}`.toLowerCase().includes(stickerSearch.toLowerCase()));

  return (
    <main className="editorPage">
      <header className="editorHeader"><button onClick={() => setScreen("home")}>⌂ Home</button><strong>{book.name}</strong><span>{pageIndex + 1}/{book.pages.length}</span></header>
      <div
        ref={pageRef}
        className={`scrapPage ${currentPage.bg}`}
        onClick={() => setSelected(null)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); uploadPhoto(e.dataTransfer.files?.[0]); }}
      >
        {(currentPage.elements || []).map((el) => (
          <div
            key={el.id}
            className={`pageEl ${selected === el.id ? "selected" : ""} ${el.locked ? "locked" : ""}`}
            style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`, transform: `rotate(${el.rotate || 0}deg)`, zIndex: el.z || 1 }}
            onMouseDown={(e) => { e.stopPropagation(); setSelected(el.id); startDrag(e, el); }}
            onTouchStart={(e) => { e.stopPropagation(); setSelected(el.id); startDrag(e, el); }}
            onClick={(e) => { e.stopPropagation(); setSelected(el.id); }}
          >
            {el.type === "photo" && (el.src ? <img src={el.src} alt="" /> : <label className="photoSlot">Upload Photo<input hidden type="file" accept="image/*" onChange={(e) => uploadPhoto(e.target.files?.[0], el.id)} /></label>)}
            {el.type === "text" && <textarea disabled={el.locked} value={el.text} onChange={(e) => updateElement(el.id, { text: e.target.value })} style={{ fontSize: el.size, color: el.color, fontFamily: el.font }} />}
            {el.type === "sticker" && (el.src ? <img src={el.src} alt={el.name || "sticker"} /> : <div className="emojiSticker">{el.value}</div>)}
            {selected === el.id && <div className="miniTools">
              <button onClick={() => updateElement(el.id, { locked: !el.locked })}>{el.locked ? "🔓" : "🔒"}</button>
              {!el.locked && <><button onClick={() => updateElement(el.id, { rotate: (el.rotate || 0) + 10 })}>↻</button><button onClick={() => updateElement(el.id, { w: el.w + 3, h: el.h + 3 })}>＋</button><button onClick={() => updateElement(el.id, { w: Math.max(5, el.w - 3), h: Math.max(5, el.h - 3) })}>−</button><button onClick={() => duplicateElement(el)}>⧉</button><button onClick={() => updateElement(el.id, { z: (el.z || 1) + 1 })}>↑</button><button onClick={() => removeElement(el.id)}>🗑</button></>}
            </div>}
          </div>
        ))}
      </div>
      {selected && <TextPanel el={(currentPage.elements || []).find((e) => e.id === selected)} updateElement={updateElement} unlocked={unlocked} setModal={setModal} />}
      <div className="pageControls"><button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>Prev</button><button onClick={undo}>Undo</button><button disabled={pageIndex === book.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}>Next</button></div>
      <nav className="editorBar"><button onClick={() => addElement(textEl("New text", 25, 25, 42, 10, 22))}>Text</button><button onClick={() => addElement(photoEl(14, 20, 70, 45))}>Photo</button><button onClick={() => setSheet(sheet === "stickers" ? null : "stickers")}>Stickers</button><button onClick={() => setSheet(sheet === "bg" ? null : "bg")}>Background</button><button onClick={() => changeBook((p, next) => next.pages.push(page("cream", [])))}>Page</button><button onClick={() => setScreen("flipbook")}>Flipbook</button></nav>
      {sheet && <div className="bottomSheet scrapbookPopup"><div className="washi"></div>{sheet === "stickers" ? <><input placeholder="Search stickers..." value={stickerSearch} onChange={(e) => setStickerSearch(e.target.value)} /> <div className="stickerGrid">{filteredStickers.map((s) => <button key={s.name} onClick={() => { if (s.premium && !unlocked) return setModal({ type: "premium", title: s.name }); addElement(stickerEl(s.value, 35, 35, 12, 12, false, { src: s.src, name: s.name })); setSheet(null); }}>{s.src ? <img src={s.src} alt={s.name} /> : s.value}<small>{s.premium && !unlocked ? "🔒" : ""}</small></button>)}</div></> : <div className="bgGrid">{bgOptions.map((b) => <button key={b.id} onClick={() => { changeBook((p) => { p.bg = b.id; }); setSheet(null); }}>{b.name}</button>)}</div>}</div>}
    </main>
  );
}

function TextPanel({ el, updateElement, unlocked, setModal }) {
  if (!el || el.type !== "text" || el.locked) return null;
  return <div className="textPanel"><select value={el.font || "cursive"} onChange={(e) => updateElement(el.id, { font: e.target.value })}>{fonts.map((f) => <option key={f} value={f}>{f}</option>)}</select><input type="number" value={el.size || 18} onChange={(e) => updateElement(el.id, { size: Number(e.target.value) })} /><input type="color" value={el.color || "#5b433b"} onChange={(e) => updateElement(el.id, { color: e.target.value })} /><button onClick={() => unlocked ? updateElement(el.id, { curved: !el.curved }) : setModal({ type: "premium", title: "Curved Text" })}>Curve 🔒</button></div>;
}

function Flipbook({ book, pageIndex, setPageIndex, setScreen, requestDeleteBook }) {
  const [menu, setMenu] = useState(false);
  const p = book.pages[pageIndex];
  function exportPage() {
    window.print();
  }
  return <main className="page flipPageWrap"><button className="cuteBack" onClick={() => setScreen("home")}>← Back</button><button className="dots flipDots" onClick={() => setMenu(!menu)}>⋯</button>{menu && <div className="flipMenu scrapbookPopup"><div className="washi"></div><button onClick={() => setScreen("editor")}>Edit</button><button onClick={exportPage}>Export</button><button onClick={() => requestDeleteBook(book)}>Delete</button></div>}<div className={`scrapPage ${p.bg}`}>{(p.elements || []).map((el) => <div key={el.id} className="pageEl previewOnly" style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`, transform: `rotate(${el.rotate || 0}deg)` }}>{el.type === "photo" ? (el.src ? <img src={el.src} /> : <div className="photoSlot">Photo</div>) : el.type === "text" ? <div style={{ fontSize: el.size, color: el.color, fontFamily: el.font }}>{el.text}</div> : el.src ? <img src={el.src} /> : <div className="emojiSticker">{el.value}</div>}</div>)}</div><div className="pageControls"><button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>Prev</button><span>{pageIndex + 1}/{book.pages.length}</span><button disabled={pageIndex === book.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}>Next</button></div></main>;
}

function Premium({ profile, creator }) {
  return <main className="page"><h1>Premium</h1>{creator && <div className="creatorBadge">Creator account: everything unlocked</div>}<div className="premiumCard"><h2>$4.99/month</h2><p>Unlimited uploads, premium stickers, curved text, print-ready export, and all premium tools.</p><button className="primary">Upgrade Soon</button></div><table><tbody><tr><th>Feature</th><th>Free</th><th>Premium</th></tr><tr><td>Scrapbooks</td><td>3</td><td>Unlimited</td></tr><tr><td>Uploads</td><td>15</td><td>Unlimited</td></tr><tr><td>Premium templates</td><td>$0.99 each</td><td>Included</td></tr><tr><td>Curved text</td><td>—</td><td>✓</td></tr></tbody></table></main>;
}

function Profile({ user, profile, setModal, creator }) {
  const [name, setName] = useState(profile?.name || user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [pass, setPass] = useState("");

  async function uploadProfilePic(file) {
    if (!file || !user) return;
    try {
      const storageRef = ref(storage, `users/${user.uid}/profile/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL: url });
      await updateDoc(doc(db, "users", user.uid), { photoURL: url, updatedAt: serverTimestamp() });
      setModal({ type: "notice", title: "Profile updated", text: "Your profile picture was saved." });
    } catch (err) {
      setModal({ type: "notice", title: "Upload failed", text: "Check Firebase Storage rules." });
    }
  }

  return <main className="page profilePage"><h1>Profile</h1><label className="profilePolaroid"><img src={profile?.photoURL || user?.photoURL || "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=300"} alt="profile" /><input hidden type="file" accept="image/*" onChange={(e) => uploadProfilePic(e.target.files?.[0])} /><span>Change photo</span></label>{creator && <div className="creatorBadge">Creator access unlocked</div>}<input className="prettyInput" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" /><button onClick={async () => { await updateProfile(user, { displayName: name }); await updateDoc(doc(db, "users", user.uid), { name }); }}>Save Name</button><section className="settingsCard"><h2>Settings</h2><label className="toggleRow">Email notifications <input type="checkbox" checked={profile?.notifications !== false} onChange={(e) => updateDoc(doc(db, "users", user.uid), { notifications: e.target.checked })} /></label><label className="toggleRow">Dark theme <input type="checkbox" checked={!!profile?.dark} onChange={(e) => updateDoc(doc(db, "users", user.uid), { dark: e.target.checked })} /></label><input className="prettyInput" value={email} onChange={(e) => setEmail(e.target.value)} /><button onClick={() => updateEmail(user, email)}>Update Email</button><input className="prettyInput" type="password" placeholder="New password" value={pass} onChange={(e) => setPass(e.target.value)} /><button onClick={() => pass && updatePassword(user, pass)}>Update Password</button></section><p>Subscription: {profile?.subscription || "Free"}</p><button onClick={() => signOut(auth)}>Logout</button><button className="danger" onClick={() => setModal({ type: "deleteAccount" })}>Delete Account</button><p className="version">Pocket Scrapbook v1.0.0</p></main>;
}

function PaperModal({ modal, setModal, onDeleteBook, user }) {
  if (!modal) return null;
  async function deleteAccount() {
    try { await deleteUser(user); }
    catch { alert("For security, log out and log back in before deleting your account."); }
  }
  let title = modal.title || "Are you sure?";
  let text = modal.text || "";
  if (modal.type === "deleteBook") { title = "Delete Scrapbook?"; text = `Are you sure you want to delete “${modal.book?.name}”?`; }
  if (modal.type === "deleteAccount") { title = "Delete Account?"; text = "This will permanently delete your account. This cannot be undone."; }
  if (modal.type === "premium") { title = "Premium Feature"; text = `${modal.title} is part of Premium or a $0.99 template.`; }
  return <div className="modalBg"><div className="scrapbookPopup modalCard"><div className="washi"></div><h2>{title}</h2><p>{text}</p><div className="modalBtns"><button onClick={() => setModal(null)}>Cancel</button>{modal.type === "deleteBook" && <button className="danger" onClick={() => onDeleteBook(modal.book)}>Delete</button>}{modal.type === "deleteAccount" && <button className="danger" onClick={deleteAccount}>Yes, Delete</button>}{modal.type === "premium" && <button className="primary" onClick={() => setModal(null)}>Okay</button>}{modal.type === "notice" && <button className="primary" onClick={() => setModal(null)}>Okay</button>}</div></div></div>;
}

function ErrorFallback({ error }) {
  return <div style={{ padding: 20, color: "#8b1e3f", background: "#fff" }}><h1>Pocket Scrapbook Error</h1><pre>{String(error?.message || error)}</pre></div>;
}

try {
  createRoot(document.getElementById("root")).render(<App />);
} catch (error) {
  createRoot(document.getElementById("root")).render(<ErrorFallback error={error} />);
}
