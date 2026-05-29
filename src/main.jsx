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

const backgrounds = [
  { name: "Cream", value: "cream" },
  { name: "Grid", value: "grid" },
  { name: "Dots", value: "dots" },
  { name: "Paper", value: "paper" },
  { name: "Blank", value: "blank" },
  { name: "Baby Pink", value: "babyPink" },
  { name: "Light Lavender", value: "lavender" },
  { name: "Baby Blue", value: "babyBlue" },
];

const freeStickers = ["♡", "✿", "☆", "☁", "🌸", "🧸", "🎀", "📷", "✨", "🌿", "🍼", "🦋", "🌙", "☀️"];

function makeId() {
  return crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function blankPage(background = "cream") {
  return { id: makeId(), background, elements: [] };
}

function myLifeTemplate(background = "cream") {
  return {
    name: "My First Scrapbook",
    premium: false,
    pages: [
      {
        id: makeId(),
        background,
        elements: [
          { id: makeId(), type: "text", text: "my life", x: 30, y: 9, w: 40, h: 10, rotate: -2, size: 38 },
          { id: makeId(), type: "text", text: "SCRAPBOOK", x: 20, y: 20, w: 60, h: 10, rotate: 0, size: 30 },
          { id: makeId(), type: "photoBox", x: 13, y: 40, w: 32, h: 34, rotate: -5, src: "" },
          { id: makeId(), type: "note", text: "about me ♡", x: 54, y: 41, w: 28, h: 22, rotate: 4 },
          { id: makeId(), type: "sticker", text: "♡", x: 72, y: 18, w: 11, h: 11, rotate: 12 },
        ],
      },
      {
        id: makeId(),
        background,
        elements: [
          { id: makeId(), type: "text", text: "my family", x: 26, y: 9, w: 46, h: 12, rotate: 1, size: 34 },
          { id: makeId(), type: "photoBox", x: 14, y: 31, w: 30, h: 36, rotate: -3, src: "" },
          { id: makeId(), type: "photoBox", x: 56, y: 28, w: 28, h: 34, rotate: 5, src: "" },
          { id: makeId(), type: "note", text: "favorite memories", x: 28, y: 74, w: 44, h: 12, rotate: 0 },
        ],
      },
      {
        id: makeId(),
        background,
        elements: [
          { id: makeId(), type: "text", text: "places I’ve been", x: 15, y: 10, w: 70, h: 12, rotate: -2, size: 31 },
          { id: makeId(), type: "photoBox", x: 20, y: 30, w: 60, h: 38, rotate: 1, src: "" },
          { id: makeId(), type: "sticker", text: "📷", x: 12, y: 70, w: 12, h: 12, rotate: -10 },
        ],
      },
    ],
  };
}

function babyTemplate(kind) {
  const girl = kind === "girl";
  const bg = girl ? "babyPink" : "babyBlue";
  const title = girl ? "Baby Girl First Year" : "Baby Boy First Year";
  return {
    name: title,
    premium: true,
    price: ".99",
    pages: Array.from({ length: 13 }).map((_, i) => ({
      id: makeId(),
      background: bg,
      elements:
        i === 0
          ? [
              { id: makeId(), type: "text", text: "baby’s\nfirst year", x: 9, y: 10, w: 42, h: 20, rotate: -3, size: 30 },
              { id: makeId(), type: "photoBox", x: 10, y: 42, w: 30, h: 36, rotate: -6, src: "" },
              { id: makeId(), type: "photoBox", x: 50, y: 33, w: 30, h: 35, rotate: 5, src: "" },
              { id: makeId(), type: "note", text: girl ? "our little girl ♡" : "our little boy ♡", x: 49, y: 73, w: 35, h: 12, rotate: -2 },
              { id: makeId(), type: "sticker", text: girl ? "🎀" : "🧸", x: 72, y: 13, w: 13, h: 13, rotate: 0 },
            ]
          : [
              { id: makeId(), type: "text", text: i === 12 ? "one year\nof you" : `${i}\nmonth${i > 1 ? "s" : ""}`, x: 9, y: 10, w: 28, h: 16, rotate: -4, size: 27 },
              { id: makeId(), type: "photoBox", x: 37, y: 20, w: 38, h: 44, rotate: 3, src: "" },
              { id: makeId(), type: "note", text: i === 12 ? "what a year ♡" : "growing so fast ♡", x: 45, y: 70, w: 38, h: 12, rotate: 0 },
              { id: makeId(), type: "sticker", text: girl ? "🌸" : "☆", x: 14, y: 70, w: 11, h: 11, rotate: 0 },
            ],
    })),
  };
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [scrapbooks, setScrapbooks] = useState([]);
  const [screen, setScreen] = useState("auth");
  const [activeBook, setActiveBook] = useState(null);
  const [activePage, setActivePage] = useState(0);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setScreen("auth");
        return;
      }
      setScreen("home");
      await setDoc(
        doc(db, "users", u.uid),
        { name: u.displayName || "", email: u.email || "", subscription: "Free", uploadLimit: 15, uploadsUsed: 0, avatar: "" },
        { merge: true }
      );
      onSnapshot(doc(db, "users", u.uid), (snap) => setProfile(snap.data() || {}));
      const q = query(collection(db, "users", u.uid, "scrapbooks"), orderBy("updatedAt", "desc"));
      onSnapshot(q, (snap) => setScrapbooks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    });
    return () => unsub();
  }, []);

  useEffect(() => document.body.classList.toggle("dark", dark), [dark]);

  async function createBook(name, background = "cream", template = null) {
    const t = template || myLifeTemplate(background);
    const data = { name: name || t.name || "Untitled Scrapbook", pages: t.pages, premium: !!t.premium, price: t.price || null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const d = await addDoc(collection(db, "users", user.uid, "scrapbooks"), data);
    const book = { id: d.id, ...data, createdAt: null, updatedAt: null };
    setActiveBook(book);
    setActivePage(0);
    setScreen("editor");
  }

  async function saveBook(book) {
    if (!user || !book?.id) return;
    const clean = { ...book, updatedAt: serverTimestamp() };
    setActiveBook(book);
    await updateDoc(doc(db, "users", user.uid, "scrapbooks", book.id), clean);
  }

  async function deleteBook(book) {
    const ok = window.confirm(`Are you sure you want to delete “${book.name}”?`);
    if (!ok) return;
    await deleteDoc(doc(db, "users", user.uid, "scrapbooks", book.id));
    setActiveBook(null);
    setScreen("home");
  }

  if (!user) return <Auth />;

  return (
    <div className="app">
      <nav className="topNav">
        <button onClick={() => setScreen("home")}>Home</button>
        <button onClick={() => setScreen("premium")}>Premium</button>
        <button onClick={() => setScreen("profile")}>Profile</button>
        <button onClick={() => signOut(auth)}>Logout</button>
      </nav>
      {screen === "home" && <Home scrapbooks={scrapbooks} createBook={createBook} openBook={(b, flip = false) => { setActiveBook(b); setActivePage(0); setScreen(flip ? "flipbook" : "editor"); }} deleteBook={deleteBook} />}
      {screen === "editor" && activeBook && <Editor book={activeBook} pageIndex={activePage} setPageIndex={setActivePage} saveBook={saveBook} setScreen={setScreen} profile={profile} />}
      {screen === "flipbook" && activeBook && <Flipbook book={activeBook} pageIndex={activePage} setPageIndex={setActivePage} setScreen={setScreen} saveBook={saveBook} deleteBook={deleteBook} />}
      {screen === "premium" && <Premium profile={profile} />}
      {screen === "profile" && <Profile user={user} profile={profile} dark={dark} setDark={setDark} />}
    </div>
  );
}

function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "login") await signInWithEmailAndPassword(auth, email, pass);
      else await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      setErr(error.message);
    }
  }

  return (
    <div className="authPage">
      <div className="floatingPhoto leftPhoto">♡</div>
      <div className="floatingPhoto rightPhoto">✿</div>
      <section className="brandCard">
        <div className="bookIcon">♡</div>
        <div className="script">my life</div>
        <h1>SCRAPBOOK</h1>
        <p>Capture your story. Cherish every moment.</p>
      </section>
      <form className="authCard" onSubmit={submit}>
        <h2>{mode === "login" ? "Welcome back ♡" : "Create account ♡"}</h2>
        <label>Email address</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <div className="passwordRow">
          <input type={show ? "text" : "password"} value={pass} onChange={(e) => setPass(e.target.value)} required />
          <button type="button" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
        </div>
        {mode === "login" && <button className="linkBtn" type="button" onClick={() => email && sendPasswordResetEmail(auth, email)}>Forgot password?</button>}
        {err && <p className="error">{err}</p>}
        <button className="mainBtn">{mode === "login" ? "Log In" : "Create Account"}</button>
        <p>{mode === "login" ? "New here?" : "Already have an account?"} <button className="textBtn" type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account" : "Log in"}</button></p>
      </form>
    </div>
  );
}

function Home({ scrapbooks, createBook, openBook, deleteBook }) {
  const [name, setName] = useState("");
  const [bg, setBg] = useState("cream");
  const [menu, setMenu] = useState(null);
  return (
    <main className="page">
      <div className="hero"><h1>Pocket Scrapbook</h1><p>Soft, pretty scrapbook pages that save automatically.</p></div>
      <section className="createPanel">
        <h2>Create a scrapbook</h2>
        <input placeholder="Name your scrapbook" value={name} onChange={(e) => setName(e.target.value)} />
        <select value={bg} onChange={(e) => setBg(e.target.value)}>{backgrounds.map((b) => <option key={b.value} value={b.value}>{b.name}</option>)}</select>
        <button onClick={() => createBook(name || "My First Scrapbook", bg)}>Create Free Scrapbook</button>
      </section>
      
      <h2>My Scrapbooks</h2>
      <section className="bookGrid">
        {scrapbooks.map((b) => (
          <article className="bookCard" key={b.id}>
            <button className="dots" onClick={() => setMenu(menu === b.id ? null : b.id)}>⋯</button>
            {menu === b.id && <div className="cardMenu"><button onClick={() => { const n = prompt("Rename scrapbook", b.name); if (n) updateDoc(doc(db, "users", auth.currentUser.uid, "scrapbooks", b.id), { name: n, updatedAt: serverTimestamp() }); }}>Rename</button><button onClick={() => openBook(b, true)}>View flipbook</button><button onClick={() => window.print()}>Export</button><button className="danger" onClick={() => deleteBook(b)}>Delete</button></div>}
            <h3>{b.name}</h3><p>{b.pages?.length || 1} page(s)</p><button onClick={() => openBook(b)}>Edit</button>
          </article>
            ))}
        </section>
      
      <h2>Templates</h2>
      <section className="templateGrid">
        <button className="templateCard" onClick={() => createBook("My First Scrapbook", bg, myLifeTemplate(bg))}><div className="mini cream">my life<br />scrapbook</div><b>My First Scrapbook</b><span>Free</span></button>
        <button className="templateCard" onClick={() => createBook("Baby Boy First Year", "babyBlue", babyTemplate("boy"))}><div className="mini babyBlue">baby boy<br />first year</div><b>Baby Boy Template</b><span>Paid preview · .99</span></button>
        <button className="templateCard" onClick={() => createBook("Baby Girl First Year", "babyPink", babyTemplate("girl"))}><div className="mini babyPink">baby girl<br />first year</div><b>Baby Girl Template</b><span>Paid preview · .99</span></button>
      </section>
      
    </main>
  );
}

function Editor({ book, pageIndex, setPageIndex, saveBook, setScreen, profile }) {
  const [selected, setSelected] = useState(null);
  const [popup, setPopup] = useState(null);
  const [drag, setDrag] = useState(null);
  const pageRef = useRef(null);
  const page = book.pages[pageIndex];

  useEffect(() => {
    function onKey(e) {
      if ((e.key === "Delete" || e.key === "Backspace") && selected && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        e.preventDefault();
        removeElement(selected);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, book, pageIndex]);

  function patchPage(newPage) {
    const pages = [...book.pages];
    pages[pageIndex] = newPage;
    saveBook({ ...book, pages });
  }
  function patchElement(elId, changes) { patchPage({ ...page, elements: page.elements.map((el) => (el.id === elId ? { ...el, ...changes } : el)) }); }
  function removeElement(elId) { patchPage({ ...page, elements: page.elements.filter((el) => el.id !== elId) }); setSelected(null); }
  function duplicate(el) { patchPage({ ...page, elements: [...page.elements, { ...el, id: makeId(), x: el.x + 5, y: el.y + 5 }] }); }
  function addText() { patchPage({ ...page, elements: [...page.elements, { id: makeId(), type: "text", text: "New text", x: 20, y: 18, w: 35, h: 12, rotate: 0, size: 26 }] }); }
  function addPhotoBox() { patchPage({ ...page, elements: [...page.elements, { id: makeId(), type: "photoBox", x: 25, y: 25, w: 40, h: 40, rotate: 0, src: "" }] }); }
  function addSticker(s) { patchPage({ ...page, elements: [...page.elements, { id: makeId(), type: "sticker", text: s, x: 35, y: 35, w: 12, h: 12, rotate: 0 }] }); setPopup(null); }
  function changeBg(v) { patchPage({ ...page, background: v }); setPopup(null); }

  async function uploadPhoto(e, elId) {
    const file = e.target.files?.[0];
    if (!file) return;
    if ((profile.subscription || "Free") === "Free" && (profile.uploadsUsed || 0) >= (profile.uploadLimit || 15)) {
      alert("Free plan has 15 photo uploads. Upgrade or buy 20 more uploads for .99.");
      return;
    }
    const storageRef = ref(storage, `users/${auth.currentUser.uid}/photos/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    patchElement(elId, { src: url });
    await updateDoc(doc(db, "users", auth.currentUser.uid), { uploadsUsed: (profile.uploadsUsed || 0) + 1 });
  }

  function pointerDown(e, el) {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
    const rect = pageRef.current.getBoundingClientRect();
    setSelected(el.id);
    setDrag({ id: el.id, startX: e.clientX, startY: e.clientY, ox: el.x, oy: el.y, rect });
  }
  function pointerMove(e) {
    if (!drag) return;
    const dx = ((e.clientX - drag.startX) / drag.rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / drag.rect.height) * 100;
    patchElement(drag.id, { x: Math.max(0, Math.min(95, drag.ox + dx)), y: Math.max(0, Math.min(95, drag.oy + dy)) });
  }

  return (
    <main className="editorPage" onPointerMove={pointerMove} onPointerUp={() => setDrag(null)}>
      <div className="editorToolbar">
        <button onClick={() => setScreen("home")}>Back</button><button onClick={addText}>Add Text</button><button onClick={addPhotoBox}>Add Photo</button><button onClick={() => setPopup(popup === "stickers" ? null : "stickers")}>Stickers</button><button onClick={() => setPopup(popup === "backgrounds" ? null : "backgrounds")}>Backgrounds</button><button onClick={() => saveBook({ ...book, pages: [...book.pages, blankPage(page.background)] })}>Add Page</button><button onClick={() => setScreen("flipbook")}>Flipbook</button>
      </div>
      {popup === "stickers" && <div className="popupMenu">{freeStickers.map((s) => <button key={s} onClick={() => addSticker(s)}>{s}</button>)}</div>}
      {popup === "backgrounds" && <div className="popupMenu">{backgrounds.map((b) => <button key={b.value} onClick={() => changeBg(b.value)}>{b.name}</button>)}</div>}
      <div ref={pageRef} className={`scrapPage ${page.background}`} onClick={() => setSelected(null)}>
        {page.elements.map((el) => (
          <div key={el.id} className={`element ${selected === el.id ? "selected" : ""}`} onPointerDown={(e) => pointerDown(e, el)} onClick={(e) => { e.stopPropagation(); setSelected(el.id); }} style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`, transform: `rotate(${el.rotate || 0}deg)` }}>
            {(el.type === "text" || el.type === "note") && <textarea value={el.text} onChange={(e) => patchElement(el.id, { text: e.target.value })} style={{ fontSize: el.size || 18 }} />}
            {el.type === "sticker" && <div className="sticker">{el.text}</div>}
            {el.type === "photoBox" && (el.src ? <img src={el.src} alt="uploaded" /> : <label className="photoUpload">Upload Photo<input hidden type="file" accept="image/*" onChange={(e) => uploadPhoto(e, el.id)} /></label>)}
            {selected === el.id && <div className="elementControls"><button onClick={() => patchElement(el.id, { rotate: (el.rotate || 0) - 5 })}>↺</button><button onClick={() => patchElement(el.id, { rotate: (el.rotate || 0) + 5 })}>↻</button><button onClick={() => patchElement(el.id, { w: el.w + 2, h: el.h + 2 })}>+</button><button onClick={() => patchElement(el.id, { w: Math.max(6, el.w - 2), h: Math.max(6, el.h - 2) })}>−</button><button onClick={() => duplicate(el)}>Copy</button><button className="danger" onClick={() => removeElement(el.id)}>Delete</button></div>}
          </div>
        ))}
      </div>
      <div className="pageNav"><button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>Prev</button><span>Page {pageIndex + 1} of {book.pages.length}</span><button disabled={pageIndex === book.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}>Next</button></div>
    </main>
  );
}

function Flipbook({ book, pageIndex, setPageIndex, setScreen, saveBook, deleteBook }) {
  const [menu, setMenu] = useState(false);
  const page = book.pages[pageIndex];
  return (
    <main className="flipPage">
      <button className="dots flipDots" onClick={() => setMenu(!menu)}>⋯</button>
      {menu && <div className="cardMenu flipMenu"><button onClick={() => setScreen("editor")}>Edit</button><button onClick={() => { const n = prompt("Rename scrapbook", book.name); if (n) saveBook({ ...book, name: n }); }}>Rename</button><button onClick={() => window.print()}>Export</button><button className="danger" onClick={() => deleteBook(book)}>Delete</button></div>}
      <h1>{book.name}</h1>
      <div className="bookShell"><div className={`scrapPage flipSheet ${page.background}`}>{page.elements.map((el) => <div key={el.id} className="element flipElement" style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`, transform: `rotate(${el.rotate || 0}deg)` }}>{(el.type === "text" || el.type === "note") && <div className="readonlyText" style={{ fontSize: el.size || 18, whiteSpace: "pre-line" }}>{el.text}</div>}{el.type === "sticker" && <div className="sticker">{el.text}</div>}{el.type === "photoBox" && (el.src ? <img src={el.src} alt="" /> : <div className="photoUpload">Photo</div>)}</div>)}</div></div>
      <div className="pageNav"><button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>← Flip Back</button><span>{pageIndex + 1} / {book.pages.length}</span><button disabled={pageIndex === book.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}>Flip Next →</button></div>
    </main>
  );
}

function Premium({ profile }) {
  return <main className="page"><h1>Premium</h1><p>Your current subscription: <b>{profile.subscription || "Free"}</b></p><table className="premiumTable"><thead><tr><th>Feature</th><th>Free</th><th>Paid</th></tr></thead><tbody><tr><td>My First Scrapbook</td><td>Included</td><td>Included</td></tr><tr><td>Baby Boy Template</td><td>Preview only</td><td>.99</td></tr><tr><td>Baby Girl Template</td><td>Preview only</td><td>.99</td></tr><tr><td>Photo uploads</td><td>15 uploads</td><td>Unlimited</td></tr><tr><td>Buy more uploads</td><td>20 for .99</td><td>Not needed</td></tr><tr><td>Advanced text effects</td><td>No</td><td>Included</td></tr><tr><td>Monthly premium</td><td>No</td><td>$4.99/month</td></tr></tbody></table><div className="premiumActions"><button onClick={() => alert("Stripe checkout needs to be added for real payments.")}>Upgrade Monthly</button><button onClick={() => alert("Stripe checkout needs to be added for .99 template purchases.")}>Buy Template</button><button onClick={() => alert("Stripe checkout needed to buy 20 more uploads.")}>Buy 20 More Uploads</button></div></main>;
}

function Profile({ user, profile, dark, setDark }) {
  const [name, setName] = useState(profile.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [password, setPassword] = useState("");
  useEffect(() => setName(profile.name || ""), [profile.name]);
  async function uploadAvatar(e) { const file = e.target.files?.[0]; if (!file) return; const r = ref(storage, `users/${user.uid}/profile/${file.name}`); await uploadBytes(r, file); const url = await getDownloadURL(r); await updateDoc(doc(db, "users", user.uid), { avatar: url }); }
  async function saveName() { await updateProfile(user, { displayName: name }); await updateDoc(doc(db, "users", user.uid), { name }); alert("Profile saved"); }
  async function saveLogin() { if (email !== user.email) await updateEmail(user, email); if (password) await updatePassword(user, password); await updateDoc(doc(db, "users", user.uid), { email }); alert("Login updated"); }
  return <main className="page profilePage"><h1>Profile</h1><section className="profileCard"><img className="avatar" src={profile.avatar || "https://placehold.co/120x120?text=♡"} alt="profile" /><label className="uploadBtn">Upload profile picture<input hidden type="file" accept="image/*" onChange={uploadAvatar} /></label><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} /><button onClick={saveName}>Save Name</button></section><section className="profileCard"><h2>Settings</h2><label className="toggleRow"><span>Dark theme</span><input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /></label><h3>Update email/password</h3><input value={email} onChange={(e) => setEmail(e.target.value)} /><input placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" /><button onClick={saveLogin}>Update Login</button></section><section className="profileCard"><h2>Subscription</h2><p>Current plan: <b>{profile.subscription || "Free"}</b></p><p>Uploads used: {profile.uploadsUsed || 0} / {(profile.subscription || "Free") === "Free" ? profile.uploadLimit || 15 : "Unlimited"}</p><button onClick={() => alert("Connect Stripe customer portal here for change/cancel.")}>Change or Cancel</button></section></main>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
