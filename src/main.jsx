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

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());

const bgOptions = [
  { id: "cream", name: "Cream" },
  { id: "grid", name: "Grid" },
  { id: "dots", name: "Dots" },
  { id: "paper", name: "Paper" },
  { id: "blank", name: "Blank" },
  { id: "babyPink", name: "Baby Pink" },
  { id: "lavender", name: "Light Lavender" },
  { id: "babyBlue", name: "Baby Blue" },
];

const stickers = ["♡", "✿", "☆", "☁", "🧸", "🎀", "📷", "🌸", "🌿", "✨", "✈", "🏡", "🐾", "🎂"];

function page(bg = "cream", elements = []) {
  return { id: uid(), bg, elements };
}

function photoBox(x, y, w, h, rotate = 0, src = "") {
  return { id: uid(), type: "photo", src, x, y, w, h, rotate };
}

function textEl(text, x, y, w, h, size = 24, rotate = 0) {
  return { id: uid(), type: "text", text, x, y, w, h, size, rotate };
}

function stickerEl(text, x, y, w = 12, h = 12, rotate = 0) {
  return { id: uid(), type: "sticker", text, x, y, w, h, rotate };
}

function myLifeTemplate(bg = "cream") {
  return [
    page(bg, [
      textEl("pocket scrapbook", 16, 12, 68, 8, 25),
      photoBox(12, 34, 34, 38, -4),
      textEl("about me ♡", 54, 40, 32, 14, 18, 2),
      stickerEl("🌿", 70, 65, 12, 12),
    ]),
    page(bg, [textEl("my family", 10, 10, 48, 10, 28), photoBox(10, 30, 38, 35, -3), photoBox(52, 32, 34, 30, 4)]),
    page(bg, [textEl("places I've been", 8, 10, 70, 10, 25), photoBox(13, 28, 34, 35, 3), photoBox(50, 22, 35, 38, -2), stickerEl("✈", 75, 70)]),
  ];
}

function blankTemplate(bg = "cream") {
  return [page(bg, [])];
}

function memoryTemplate(bg = "paper") {
  return [
    page(bg, [textEl("favorite memory", 12, 10, 65, 10, 27), photoBox(14, 28, 70, 42, -2), textEl("write the story here ♡", 20, 76, 60, 10, 17)]),
  ];
}

function babyTemplate(kind = "girl") {
  const girl = kind === "girl";
  const bg = girl ? "babyPink" : "babyBlue";
  return Array.from({ length: 13 }).map((_, i) => {
    if (i === 0) {
      return page(bg, [
        textEl("baby's\nfirst year", 9, 11, 44, 18, 28, -2),
        photoBox(10, 40, 30, 34, -4),
        photoBox(51, 35, 26, 28, 5),
        textEl(girl ? "our little girl ♡" : "our little boy ♡", 47, 68, 38, 10, 18),
        stickerEl(girl ? "🎀" : "🧸", 72, 14),
      ]);
    }
    return page(bg, [
      textEl(i === 12 ? "one year\nof you" : `${i}\nmonth${i > 1 ? "s" : ""}`, 8, 10, 25, 17, 24, -2),
      photoBox(34, 20, 42, 42, 2),
      textEl(i === 12 ? "what a year ♡" : "growing so fast ♡", 25, 72, 55, 9, 18),
      stickerEl(girl ? "🌸" : "☆", 12, 70),
    ]);
  });
}

function notify(setToast, text) {
  setToast(text);
  setTimeout(() => setToast(""), 2400);
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [books, setBooks] = useState([]);
  const [screen, setScreen] = useState("loading");
  const [active, setActive] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setScreen("auth");
        return;
      }
      const pref = doc(db, "users", u.uid);
      await setDoc(
        pref,
        {
          name: u.displayName || "",
          email: u.email || "",
          photoURL: u.photoURL || "",
          subscription: "Free",
          uploadsUsed: 0,
          uploadLimit: 15,
          dark: false,
        },
        { merge: true }
      );
      onSnapshot(pref, (s) => setProfile(s.data() || {}));
      const q = query(collection(db, "users", u.uid, "scrapbooks"), orderBy("updatedAt", "desc"));
      onSnapshot(q, (s) => setBooks(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
      setScreen("home");
    });
    return () => unsub();
  }, []);

  useEffect(() => document.body.classList.toggle("dark", !!profile?.dark), [profile?.dark]);

  async function saveBook(book) {
    if (!user || !book?.id) return;
    setActive(book);
    await updateDoc(doc(db, "users", user.uid, "scrapbooks", book.id), { ...book, updatedAt: serverTimestamp() });
  }

  async function createBook(name, bg, pages = null, paidOnly = false) {
    const data = { name, pages: pages || myLifeTemplate(bg), createdAt: serverTimestamp(), updatedAt: serverTimestamp(), paidOnly };
    const r = await addDoc(collection(db, "users", user.uid, "scrapbooks"), data);
    setActive({ ...data, id: r.id });
    setPageIndex(0);
    setScreen("editor");
    notify(setToast, "Scrapbook created ♡");
  }

  async function deleteBook(book) {
    if (!confirm(`Are you sure you want to delete “${book.name}”?`)) return;
    await deleteDoc(doc(db, "users", user.uid, "scrapbooks", book.id));
    setScreen("home");
    notify(setToast, "Scrapbook deleted");
  }

  function openBook(b, flip = false) {
    setActive(b);
    setPageIndex(0);
    setScreen(flip ? "flipbook" : "editor");
  }

  if (screen === "loading") return <div className="phoneFrame loading">Loading...</div>;
  if (!user) return <Auth setToast={setToast} />;

  return (
    <div className="phoneFrame">
      {toast && <Toast text={toast} />}
      {screen === "home" && <Home books={books} openBook={openBook} setScreen={setScreen} />}
      {screen === "create" && <CreateBook createBook={createBook} setScreen={setScreen} books={books} profile={profile} />}
      {screen === "editor" && active && <Editor book={active} pageIndex={pageIndex} setPageIndex={setPageIndex} saveBook={saveBook} setScreen={setScreen} setToast={setToast} />}
      {screen === "flipbook" && active && <Flipbook book={active} pageIndex={pageIndex} setPageIndex={setPageIndex} setScreen={setScreen} deleteBook={deleteBook} />}
      {screen === "premium" && <Premium profile={profile} setScreen={setScreen} />}
      {screen === "profile" && <Profile user={user} profile={profile || {}} setToast={setToast} setScreen={setScreen} />}
      {screen !== "auth" && screen !== "editor" && screen !== "flipbook" && <BottomNav setScreen={setScreen} />}
    </div>
  );
}

function Toast({ text }) {
  return (
    <div className="toast">
      <span className="tape"></span>
      {text}
    </div>
  );
}

function Auth({ setToast }) {
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
      notify(setToast, mode === "login" ? "Welcome back ♡" : "Account created ♡");
    } catch (x) {
      setErr(x.message);
    }
  }

  return (
    <div className="authPage">
      <div className="authTop">
        <button className="iconPlain">☰</button>
        <div className="brandMini"><span>pocket</span><b>SCRAPBOOK</b></div>
        <button className="iconPlain">♡</button>
      </div>
      <div className="heroLogin">
        <div>
          <h1>Welcome back ♡</h1>
          <p>Every story matters.<br />What will you capture today?</p>
        </div>
        <div className="heroPhoto"></div>
      </div>
      <form className="authCard" onSubmit={submit}>
        <h2>{mode === "login" ? "Log in" : "Create account"}</h2>
        <label>Email address</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label>Password</label>
        <div className="passRow">
          <input value={pass} onChange={(e) => setPass(e.target.value)} type={show ? "text" : "password"} required />
          <button type="button" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
        </div>
        {mode === "login" && <button type="button" className="smallLink" onClick={() => email && sendPasswordResetEmail(auth, email)}>Forgot password?</button>}
        {err && <p className="error">{err}</p>}
        <button className="primary">{mode === "login" ? "Log In" : "Create Account"}</button>
        <p className="swap">{mode === "login" ? "New here?" : "Have an account?"} <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account ♡" : "Log in ♡"}</button></p>
      </form>
    </div>
  );
}

function Home({ books, openBook, setScreen }) {
  const [menu, setMenu] = useState(null);
  return (
    <main className="page homePage">
      <div className="homeTop">
        <button className="iconPlain">☰</button>
        <div className="brandMini"><span>pocket</span><b>SCRAPBOOK</b></div>
        <button className="iconPlain">🔔</button>
      </div>
      <section className="welcomeHero">
        <div>
          <h1>Welcome back ♡</h1>
          <p>Every story matters.<br />What will you capture today?</p>
        </div>
        <div className="heroPhoto small"></div>
      </section>
      <section className="quickGrid">
        <button onClick={() => setScreen("create")}><span>＋</span><b>New Scrapbook</b><small>Start a new chapter</small></button>
        <button><span>▣</span><b>My Scrapbooks</b><small>View and manage</small></button>
        <button onClick={() => setScreen("create")}><span>▧</span><b>Add Memory</b><small>Add photos and notes</small></button>
        <button onClick={() => setScreen("premium")}><span>◇</span><b>Templates</b><small>Browse templates</small></button>
      </section>
      <HeaderLine title="My Scrapbooks" />
      <section className="bookShelf">
        {books.length === 0 && <EmptyCard setScreen={setScreen} />}
        {books.map((b) => (
          <article key={b.id} className="bookTile" onClick={() => openBook(b)}>
            <Preview book={b} />
            <button className="dots" onClick={(e) => { e.stopPropagation(); setMenu(menu === b.id ? null : b.id); }}>⋮</button>
            {menu === b.id && <div className="cardMenu" onClick={(e) => e.stopPropagation()}><button onClick={() => openBook(b)}>Edit</button><button onClick={() => openBook(b, true)}>View Flipbook</button><button onClick={() => alert("Export coming soon")}>Export</button><button onClick={() => { const n = prompt("Rename scrapbook", b.name); if (n) updateDoc(doc(db, "users", auth.currentUser.uid, "scrapbooks", b.id), { name: n }); }}>Rename</button></div>}
            <h3>{b.name}</h3><p>{b.pages?.length || 1} pages</p>
          </article>
        ))}
      </section>
      <HeaderLine title="Recent Memories" />
      <div className="recentGrid"><span></span><span></span><span></span><span></span><span></span></div>
    </main>
  );
}

function HeaderLine({ title }) { return <div className="headerLine"><h2>{title}</h2><button>View all ›</button></div>; }
function EmptyCard({ setScreen }) { return <button className="emptyCard" onClick={() => setScreen("create")}>Create your first scrapbook ♡</button>; }

function CreateBook({ createBook, setScreen, books, profile }) {
  const [name, setName] = useState("");
  const [bg, setBg] = useState("cream");
  const [template, setTemplate] = useState("myLife");
  const freeTemplatesUsed = books.filter((b) => !b.paidOnly).length;
  const needsPremium = template === "boy" || template === "girl" || freeTemplatesUsed >= 3;
  const isPremium = profile?.subscription === "Premium";
  function create() {
    if (needsPremium && !isPremium) return alert("This template is part of Premium. You can preview it, but payment needs Stripe setup before real checkout works.");
    let pages = template === "boy" ? babyTemplate("boy") : template === "girl" ? babyTemplate("girl") : template === "blank" ? blankTemplate(bg) : template === "memory" ? memoryTemplate(bg) : myLifeTemplate(bg);
    createBook(name || "Untitled Scrapbook", bg, pages, needsPremium);
  }
  return (
    <main className="page createPage">
      <button className="backBtn" onClick={() => setScreen("home")}>← Back</button>
      <section className="createPanel"><h1>Create a Scrapbook</h1><p>Name it, choose a background, then pick a template.</p><input placeholder="Scrapbook name" value={name} onChange={(e) => setName(e.target.value)} /><select value={bg} onChange={(e) => setBg(e.target.value)}>{bgOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select><select value={template} onChange={(e) => setTemplate(e.target.value)}><option value="myLife">My Life - Free</option><option value="blank">Blank - Free</option><option value="memory">Memory Book - Free</option><option value="boy">Baby Boy - Premium</option><option value="girl">Baby Girl - Premium</option></select><button className="primary" onClick={create}>Create Scrapbook</button></section>
    </main>
  );
}

function Preview({ book }) {
  const first = book?.pages?.[0] || page("cream", []);
  const els = first.elements || [];
  return <div className={`preview ${first.bg}`}>{els.slice(0, 5).map((el) => <span key={el.id} className={`pv ${el.type}`} style={{ left: el.x + "%", top: el.y + "%", width: el.w + "%", height: el.h + "%", transform: `rotate(${el.rotate || 0}deg)` }}>{el.type === "text" ? el.text : el.type === "sticker" ? el.text : ""}</span>)}</div>;
}

function Editor({ book, pageIndex, setPageIndex, saveBook, setScreen, setToast }) {
  const [selected, setSelected] = useState(null);
  const [popup, setPopup] = useState(null);
  const pageRef = useRef(null);
  const cur = book.pages[pageIndex] || page("cream", []);

  useEffect(() => {
    function key(e) {
      const tag = document.activeElement?.tagName || "";
      if ((e.key === "Delete" || e.key === "Backspace") && selected && !["INPUT", "TEXTAREA"].includes(tag)) remove(selected);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [selected, book, pageIndex]);

  function mutate(fn) {
    const nb = { ...book, pages: book.pages.map((p, i) => i === pageIndex ? { ...p, elements: [...(p.elements || [])] } : p) };
    fn(nb.pages[pageIndex], nb);
    saveBook(nb);
  }
  function update(id, patch) { mutate((p) => { p.elements = p.elements.map((e) => e.id === id ? { ...e, ...patch } : e); }); }
  function remove(id) { mutate((p) => { p.elements = p.elements.filter((e) => e.id !== id); }); setSelected(null); }
  function dup(el) { mutate((p) => p.elements.push({ ...el, id: uid(), x: el.x + 4, y: el.y + 4 })); }
  async function upload(e, id) { const f = e.target.files?.[0]; if (!f) return; const r = ref(storage, `users/${auth.currentUser.uid}/photos/${Date.now()}-${f.name}`); await uploadBytes(r, f); update(id, { src: await getDownloadURL(r) }); notify(setToast, "Photo added ♡"); }
  function moveStart(ev, el) { ev.stopPropagation(); const sx = ev.clientX, sy = ev.clientY, ox = el.x, oy = el.y; const rect = pageRef.current.getBoundingClientRect(); function mm(e) { update(el.id, { x: Math.max(0, Math.min(92, ox + ((e.clientX - sx) / rect.width) * 100)), y: Math.max(0, Math.min(92, oy + ((e.clientY - sy) / rect.height) * 100)) }); } function up() { window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", up); } window.addEventListener("mousemove", mm); window.addEventListener("mouseup", up); }

  return (
    <main className="editor"><div ref={pageRef} className={`scrapPage ${cur.bg}`} onClick={() => setSelected(null)}>{cur.elements.map((el) => <div key={el.id} className={`el ${selected === el.id ? "selected" : ""}`} style={{ left: el.x + "%", top: el.y + "%", width: el.w + "%", height: el.h + "%", transform: `rotate(${el.rotate || 0}deg)` }} onMouseDown={(e) => moveStart(e, el)} onClick={(e) => { e.stopPropagation(); setSelected(el.id); }}>{el.type === "photo" && (el.src ? <img src={el.src} /> : <label className="uploadLabel">Upload Photo<input type="file" hidden accept="image/*" onChange={(e) => upload(e, el.id)} /></label>)}{el.type === "text" && <textarea value={el.text} style={{ fontSize: el.size }} onChange={(e) => update(el.id, { text: e.target.value })} />}{el.type === "sticker" && <div className="sticker">{el.text}</div>}{selected === el.id && <div className="miniControls"><button onClick={() => update(el.id, { rotate: (el.rotate || 0) + 10 })}>↻</button><button onClick={() => update(el.id, { w: el.w + 4, h: el.h + 4 })}>＋</button><button onClick={() => update(el.id, { w: Math.max(6, el.w - 4), h: Math.max(6, el.h - 4) })}>−</button><button onClick={() => dup(el)}>⧉</button><button onClick={() => remove(el.id)}>🗑</button></div>}</div>)}</div><div className="pageNav"><button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>Prev</button><span>Page {pageIndex + 1} of {book.pages.length}</span><button disabled={pageIndex === book.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}>Next</button></div><div className="bottomBar"><button onClick={() => setScreen("home")}>Home</button><button onClick={() => mutate((p) => p.elements.push(textEl("New text", 25, 25, 40, 10, 22)))}>Text</button><button onClick={() => mutate((p) => p.elements.push(photoBox(20, 20, 50, 40)))}>Photo</button><button onClick={() => setPopup(popup === "stickers" ? null : "stickers")}>Stickers</button><button onClick={() => setPopup(popup === "bg" ? null : "bg")}>Backgrounds</button><button onClick={() => mutate((p, nb) => nb.pages.push(page("cream", [])))}>Page</button><button onClick={() => setScreen("flipbook")}>Flipbook</button></div>{popup && <div className="sheet">{popup === "stickers" ? stickers.map((s) => <button key={s} onClick={() => { mutate((p) => p.elements.push(stickerEl(s, 30, 30))); setPopup(null); }}>{s}</button>) : bgOptions.map((b) => <button key={b.id} onClick={() => { mutate((p) => { p.bg = b.id; }); setPopup(null); }}>{b.name}</button>)}</div>}</main>
  );
}

function Flipbook({ book, pageIndex, setPageIndex, setScreen, deleteBook }) {
  const [menu, setMenu] = useState(false);
  const p = book.pages[pageIndex] || page("cream", []);
  return <main className="page flip"><button className="backBtn" onClick={() => setScreen("home")}>← Back</button><button className="dots fixed" onClick={() => setMenu(!menu)}>⋮</button>{menu && <div className="flipMenu"><button onClick={() => setScreen("editor")}>Edit</button><button onClick={() => alert("Export coming soon")}>Export</button><button onClick={() => { const n = prompt("Rename scrapbook", book.name); if (n) updateDoc(doc(db, "users", auth.currentUser.uid, "scrapbooks", book.id), { name: n }); }}>Rename</button><button onClick={() => deleteBook(book)}>Delete</button></div>}<div className={`scrapPage flipPage ${p.bg}`}><Preview book={{ pages: [p] }} /></div><div className="pageNav"><button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>Prev</button><span>{pageIndex + 1}/{book.pages.length}</span><button disabled={pageIndex === book.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}>Next</button></div></main>;
}

function Premium({ profile, setScreen }) { return <main className="page"><button className="backBtn" onClick={() => setScreen("home")}>← Back</button><h1>Premium</h1><p>Your plan: {profile?.subscription || "Free"}</p><table><tbody><tr><th>Feature</th><th>Free</th><th>Premium</th></tr><tr><td>3 free scrapbooks</td><td>✓</td><td>✓</td></tr><tr><td>Baby templates</td><td>99¢ each</td><td>✓</td></tr><tr><td>Photo uploads</td><td>15</td><td>Unlimited</td></tr><tr><td>Advanced text effects</td><td>—</td><td>✓</td></tr></tbody></table><button className="primary">Upgrade $4.99/mo</button><p className="hint">Payments need Stripe before real charging works.</p></main>; }

function Profile({ user, profile = {}, setToast, setScreen }) {
  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [pass, setPass] = useState("");
  async function pic(e) { const f = e.target.files?.[0]; if (!f) return; const r = ref(storage, `users/${user.uid}/profile-${Date.now()}-${f.name}`); await uploadBytes(r, f); const url = await getDownloadURL(r); await updateProfile(user, { photoURL: url }); await updateDoc(doc(db, "users", user.uid), { photoURL: url }); notify(setToast, "Profile photo updated ♡"); }
  return <main className="page profile"><button className="backBtn" onClick={() => setScreen("home")}>← Back</button><h1>Profile</h1><label className="avatar"><img src={profile?.photoURL || user?.photoURL || "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=200"} /><input type="file" hidden accept="image/*" onChange={pic} /></label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" /><button onClick={async () => { await updateProfile(user, { displayName: name }); await updateDoc(doc(db, "users", user.uid), { name }); notify(setToast, "Name saved ♡"); }}>Save Name</button><h2>Settings</h2><label className="toggle">Dark theme <input type="checkbox" checked={!!profile?.dark} onChange={(e) => updateDoc(doc(db, "users", user.uid), { dark: e.target.checked })} /></label><input value={email} onChange={(e) => setEmail(e.target.value)} /><button onClick={() => updateEmail(user, email)}>Update Email</button><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="New password" /><button onClick={() => pass && updatePassword(user, pass)}>Update Password</button><p>Subscription: {profile?.subscription || "Free"}</p><button>Change/Cancel Subscription</button><button className="danger" onClick={() => signOut(auth)}>Logout</button></main>;
}

function BottomNav({ setScreen }) { return <nav className="bottomNav"><button onClick={() => setScreen("home")}>⌂<span>Home</span></button><button onClick={() => setScreen("create")}>▣<span>Books</span></button><button className="plus" onClick={() => setScreen("create")}>＋</button><button onClick={() => setScreen("premium")}>♡<span>Premium</span></button><button onClick={() => setScreen("profile")}>♙<span>Profile</span></button></nav>; }

createRoot(document.getElementById("root")).render(<App />);
