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

function photoEl(x, y, w, h, rotate = 0) {
  return { id: uid(), type: "photo", src: "", x, y, w, h, rotate };
}
function textEl(text, x, y, w, h, size = 22, rotate = 0) {
  return { id: uid(), type: "text", text, x, y, w, h, size, rotate };
}
function stickerEl(text, x, y, w = 12, h = 12, rotate = 0) {
  return { id: uid(), type: "sticker", text, x, y, w, h, rotate };
}
function makePage(bg = "cream", elements = []) {
  return { id: uid(), bg, elements };
}

function pocketTemplate(bg = "cream") {
  return [
    makePage(bg, [
      textEl("pocket", 36, 10, 28, 8, 28),
      textEl("SCRAPBOOK", 13, 22, 75, 8, 28),
      photoEl(12, 42, 32, 34, -4),
      textEl("your story ♡", 51, 48, 38, 12, 20, 2),
      stickerEl("🌿", 70, 70, 12, 12),
    ]),
    makePage(bg, [textEl("about me", 12, 10, 45, 10, 28), photoEl(12, 28, 35, 38, -3), photoEl(53, 30, 32, 32, 3)]),
    makePage(bg, [textEl("favorite moments", 10, 12, 70, 10, 24), photoEl(18, 30, 60, 42, 0), stickerEl("♡", 76, 76)]),
  ];
}
function blankTemplate(bg = "cream") {
  return [makePage(bg, [])];
}
function memoryTemplate(bg = "lavender") {
  return [
    makePage(bg, [textEl("memories", 20, 14, 60, 12, 30), photoEl(18, 34, 60, 42), stickerEl("✨", 74, 70)]),
    makePage(bg, [textEl("little things", 12, 10, 60, 10, 24), photoEl(12, 28, 35, 36, -2), textEl("notes", 55, 32, 30, 30, 18)]),
  ];
}
function babyTemplate(kind = "girl") {
  const girl = kind === "girl";
  const bg = girl ? "babyPink" : "babyBlue";
  return Array.from({ length: 13 }).map((_, i) => {
    if (i === 0) {
      return makePage(bg, [
        textEl("baby's\nfirst year", 9, 10, 44, 18, 27, -2),
        photoEl(10, 40, 30, 34, -4),
        photoEl(51, 34, 28, 30, 5),
        textEl(girl ? "baby girl ♡" : "baby boy ♡", 50, 69, 36, 10, 18),
        stickerEl(girl ? "🎀" : "🧸", 72, 13),
      ]);
    }
    return makePage(bg, [
      textEl(i === 12 ? "one year\nof you" : `${i}\nmonth${i > 1 ? "s" : ""}`, 8, 10, 25, 17, 24, -2),
      photoEl(34, 20, 42, 42, 2),
      textEl(i === 12 ? "what a year ♡" : "growing so fast ♡", 27, 72, 50, 9, 18),
      stickerEl(girl ? "🌸" : "☆", 12, 70),
    ]);
  });
}

const templates = [
  { id: "pocket", name: "Pocket Scrapbook", tag: "Free", premium: false, bg: "cream", make: (bg) => pocketTemplate(bg) },
  { id: "blank", name: "Blank Book", tag: "Free", premium: false, bg: "paper", make: (bg) => blankTemplate(bg) },
  { id: "memory", name: "Memory Book", tag: "Free", premium: false, bg: "lavender", make: (bg) => memoryTemplate(bg) },
  { id: "boy", name: "Baby Boy", tag: "Premium", premium: true, bg: "babyBlue", make: () => babyTemplate("boy") },
  { id: "girl", name: "Baby Girl", tag: "Premium", premium: true, bg: "babyPink", make: () => babyTemplate("girl") },
];

function pageCoverClass(book) {
  return `bookCover ${book?.pages?.[0]?.bg || "cream"}`;
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [books, setBooks] = useState([]);
  const [screen, setScreen] = useState("loading");
  const [active, setActive] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [notice, setNotice] = useState(null);

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
      const unsubProfile = onSnapshot(pref, (snap) => setProfile(snap.data() || {}));
      const q = query(collection(db, "users", u.uid, "scrapbooks"), orderBy("updatedAt", "desc"));
      const unsubBooks = onSnapshot(q, (snap) => setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
      setScreen("home");
      return () => {
        unsubProfile();
        unsubBooks();
      };
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", !!profile?.dark);
  }, [profile?.dark]);

  function toast(msg) {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  }

  async function createBook(name, pages, paidOnly = false) {
    if (!user) return;
    const data = {
      name: name || "Untitled Scrapbook",
      pages: pages || pocketTemplate("cream"),
      paidOnly,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const r = await addDoc(collection(db, "users", user.uid, "scrapbooks"), data);
    const newBook = { ...data, id: r.id };
    setActive(newBook);
    setPageIndex(0);
    setScreen("editor");
    toast("Scrapbook created ♡");
  }

  async function saveBook(book) {
    setActive(book);
    if (!book?.id || !user) return;
    await updateDoc(doc(db, "users", user.uid, "scrapbooks", book.id), {
      name: book.name,
      pages: book.pages,
      paidOnly: !!book.paidOnly,
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteBook(book) {
    if (!book?.id || !user) return;
    if (!window.confirm(`Delete “${book.name}”?`)) return;
    await deleteDoc(doc(db, "users", user.uid, "scrapbooks", book.id));
    setScreen("home");
    toast("Scrapbook deleted");
  }

  function openBook(book, flip = false) {
    setActive(book);
    setPageIndex(0);
    setScreen(flip ? "flipbook" : "editor");
  }

  if (screen === "loading") return <Phone><div className="loading">Loading...</div></Phone>;
  if (!user) return <Phone><Auth toast={toast} /></Phone>;

  const showNav = !["auth", "editor", "flipbook"].includes(screen);

  return (
    <Phone>
      {screen === "home" && <Home books={books} openBook={openBook} setScreen={setScreen} />}
      {screen === "scrapbooks" && <Scrapbooks books={books} openBook={openBook} deleteBook={deleteBook} />}
      {screen === "create" && <CreateBook createBook={createBook} setScreen={setScreen} profile={profile} bookCount={books.length} />}
      {screen === "templates" && <Templates createBook={createBook} profile={profile} />}
      {screen === "premium" && <Premium profile={profile} />}
      {screen === "profile" && <Profile user={user} profile={profile} toast={toast} />}
      {screen === "editor" && active && <Editor book={active} pageIndex={pageIndex} setPageIndex={setPageIndex} saveBook={saveBook} setScreen={setScreen} toast={toast} />}
      {screen === "flipbook" && active && <Flipbook book={active} pageIndex={pageIndex} setPageIndex={setPageIndex} setScreen={setScreen} deleteBook={deleteBook} />}
      {showNav && <BottomNav screen={screen} setScreen={setScreen} />}
      {notice && <Notice message={notice} />}
    </Phone>
  );
}

function Phone({ children }) {
  return <div className="phoneFrame">{children}</div>;
}

function Notice({ message }) {
  return <div className="noticeCard"><div className="tape" />{message}</div>;
}

function BottomNav({ screen, setScreen }) {
  const tabs = [
    ["home", "⌂", "Home"],
    ["scrapbooks", "▧", "Scrapbooks"],
    ["create", "+", ""],
    ["templates", "▨", "Templates"],
    ["profile", "♙", "Profile"],
  ];
  return (
    <nav className="bottomNav">
      {tabs.map(([id, icon, label]) => (
        <button key={id} className={`${screen === id ? "active" : ""} ${id === "create" ? "plusTab" : ""}`} onClick={() => setScreen(id)}>
          <span>{icon}</span>
          {label && <small>{label}</small>}
        </button>
      ))}
    </nav>
  );
}

function Auth({ toast }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "login") await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
      toast?.(mode === "login" ? "Welcome back ♡" : "Account created ♡");
    } catch (error) {
      setErr(error.message.replace("Firebase: ", ""));
    }
  }

  return (
    <main className="authPage page">
      <div className="authBlob pink" />
      <div className="authBlob tan" />
      <div className="authPhoto flowers" />
      <div className="authPhoto beach" />
      <header className="brandStack">
        <div className="heartBadge">♡</div>
        <div className="scriptLogo">pocket</div>
        <h1>SCRAPBOOK</h1>
        <p>Capture your story. Cherish every moment.</p>
      </header>
      <form className="paperCard authCard" onSubmit={submit}>
        <div className="tape" />
        <h2>{mode === "login" ? "Welcome back ♡" : "Create account ♡"}</h2>
        <label>Email address</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label>Password</label>
        <div className="passwordBox">
          <input value={password} onChange={(e) => setPassword(e.target.value)} type={show ? "text" : "password"} required />
          <button type="button" onClick={() => setShow((v) => !v)}>{show ? "Hide" : "Show"}</button>
        </div>
        {mode === "login" && <button type="button" className="textLink" onClick={() => email && sendPasswordResetEmail(auth, email)}>Forgot password?</button>}
        {err && <p className="error">{err}</p>}
        <button className="primaryBtn">{mode === "login" ? "Log In" : "Create Account"}</button>
        <p className="switchLine">{mode === "login" ? "New here?" : "Already have an account?"} <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account ♡" : "Log in ♡"}</button></p>
      </form>
    </main>
  );
}

function LogoHeader() {
  return <header className="appHeader"><button className="iconBtn">⌂</button><div><span>pocket</span><strong>SCRAPBOOK</strong></div><button className="iconBtn">♡</button></header>;
}

function Home({ books, openBook, setScreen }) {
  const recent = books.slice(0, 4);
  return (
    <main className="page homePage">
      <LogoHeader />
      <section className="welcomeHero">
        <div>
          <h1>Welcome back ♡</h1>
          <p>Every story matters.<br />What will you capture today?</p>
        </div>
        <div className="heroPolaroid" />
      </section>
      <section className="quickGrid">
        <button onClick={() => setScreen("create")}><span>＋</span><b>New Scrapbook</b><small>Start a new chapter</small></button>
        <button onClick={() => setScreen("scrapbooks")}><span>📖</span><b>My Scrapbooks</b><small>View and manage</small></button>
        <button onClick={() => setScreen("templates")}><span>▨</span><b>Templates</b><small>Browse designs</small></button>
        <button onClick={() => setScreen("premium")}><span>♡</span><b>Premium</b><small>Unlock extras</small></button>
      </section>
      <div className="sectionTitle"><h2>My Scrapbooks</h2><button onClick={() => setScreen("scrapbooks")}>View all ›</button></div>
      <section className="coverRow">
        {recent.length === 0 && <div className="emptyCard">No scrapbooks yet ♡</div>}
        {recent.map((b) => <BookTile key={b.id} book={b} onOpen={() => openBook(b)} />)}
      </section>
    </main>
  );
}

function BookTile({ book, onOpen, menu }) {
  return (
    <article className="bookTile" onClick={onOpen}>
      <div className={pageCoverClass(book)}>
        <div className="coverTape" />
        <PreviewPage book={book} />
      </div>
      <h3>{book.name}</h3>
      <p>{book.pages?.length || 1} pages</p>
      {menu}
    </article>
  );
}

function PreviewPage({ book }) {
  const els = book?.pages?.[0]?.elements || [];
  return <>{els.slice(0, 5).map((el) => <span key={el.id} className={`pv ${el.type}`} style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`, transform: `rotate(${el.rotate || 0}deg)` }}>{el.type === "text" ? el.text : el.type === "sticker" ? el.text : ""}</span>)}</>;
}

function Scrapbooks({ books, openBook, deleteBook }) {
  const [menu, setMenu] = useState(null);
  return (
    <main className="page">
      <LogoHeader />
      <h1>My Scrapbooks</h1>
      <section className="scrapbookGrid">
        {books.map((b) => (
          <BookTile key={b.id} book={b} onOpen={() => openBook(b)} menu={<>
            <button className="tileDots" onClick={(e) => { e.stopPropagation(); setMenu(menu === b.id ? null : b.id); }}>⋯</button>
            {menu === b.id && <div className="paperPopup miniPopup" onClick={(e) => e.stopPropagation()}><div className="tape" /><button onClick={() => openBook(b)}>Edit</button><button onClick={() => openBook(b, true)}>Flipbook</button><button onClick={() => { const n = prompt("Rename scrapbook", b.name); if (n) updateDoc(doc(db, "users", auth.currentUser.uid, "scrapbooks", b.id), { name: n }); }}>Rename</button><button onClick={() => deleteBook(b)}>Delete</button></div>}
          </>} />
        ))}
      </section>
    </main>
  );
}

function CreateBook({ createBook, setScreen, profile, bookCount }) {
  const [name, setName] = useState("");
  const [bg, setBg] = useState("cream");
  const [templateId, setTemplateId] = useState("pocket");
  const picked = templates.find((t) => t.id === templateId) || templates[0];
  const isFree = (profile?.subscription || "Free") === "Free";
  const freeLimitHit = isFree && bookCount >= 3;

  function go() {
    if (freeLimitHit) return alert("Free plan includes 3 scrapbooks. Upgrade to premium for unlimited books.");
    createBook(name || picked.name, picked.make(bg), picked.premium);
  }

  return <main className="page"><LogoHeader /><section className="paperCard createCard"><div className="tape" /><h1>Create Scrapbook</h1><input placeholder="Scrapbook name" value={name} onChange={(e) => setName(e.target.value)} /><label>Background</label><select value={bg} onChange={(e) => setBg(e.target.value)}>{bgOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select><label>Template</label><select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>{templates.map((t) => <option key={t.id} value={t.id}>{t.name} - {t.tag}</option>)}</select><button className="primaryBtn" onClick={go}>Create Scrapbook</button><button onClick={() => setScreen("home")}>Cancel</button></section></main>;
}

function Templates({ createBook, profile }) {
  return <main className="page"><LogoHeader /><div className="sectionTitle"><h1>Templates</h1><button>View all ›</button></div><section className="templateGrid">{templates.map((t) => <button key={t.id} className={`templateTile ${t.bg}`} onClick={() => createBook(t.name, t.make(t.bg), t.premium)}><div className="coverTape" /><span>{t.name}</span><b>{t.tag}</b>{t.premium && <small>Monthly premium</small>}</button>)}</section></main>;
}

function Premium({ profile }) {
  return <main className="page"><LogoHeader /><section className="paperCard premiumCard"><div className="tape" /><h1>Premium ♡</h1><p>Your plan: {profile?.subscription || "Free"}</p><table><tbody><tr><th>Feature</th><th>Free</th><th>Premium</th></tr><tr><td>Scrapbooks</td><td>3</td><td>Unlimited</td></tr><tr><td>Baby templates</td><td>99¢ each</td><td>Included</td></tr><tr><td>Photo uploads</td><td>15</td><td>Unlimited</td></tr><tr><td>Advanced text</td><td>—</td><td>Included</td></tr></tbody></table><button className="primaryBtn">Upgrade $4.99/mo</button><p className="hint">Real payments need Stripe later.</p></section></main>;
}

function Profile({ user, profile, toast }) {
  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [pass, setPass] = useState("");

  useEffect(() => setName(profile?.name || ""), [profile?.name]);

  async function uploadProfile(e) {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    const r = ref(storage, `users/${user.uid}/profile/${Date.now()}-${f.name}`);
    await uploadBytes(r, f);
    const url = await getDownloadURL(r);
    await updateProfile(user, { photoURL: url });
    await updateDoc(doc(db, "users", user.uid), { photoURL: url });
    toast("Profile photo updated ♡");
  }

  return <main className="page"><LogoHeader /><section className="paperCard profileCard"><div className="tape" /><h1>Profile</h1><label className="profilePolaroid"><img src={profile?.photoURL || user?.photoURL || "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=300"} alt="profile" /><span>Change photo</span><input type="file" accept="image/*" hidden onChange={uploadProfile} /></label><input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} /><button onClick={async () => { await updateProfile(user, { displayName: name }); await updateDoc(doc(db, "users", user.uid), { name }); toast("Name saved ♡"); }}>Save Name</button><h2>Settings</h2><label className="switch">Dark theme <input type="checkbox" checked={!!profile?.dark} onChange={(e) => updateDoc(doc(db, "users", user.uid), { dark: e.target.checked })} /></label><input value={email} onChange={(e) => setEmail(e.target.value)} /><button onClick={() => updateEmail(user, email)}>Update Email</button><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="New password" /><button onClick={() => pass && updatePassword(user, pass)}>Update Password</button><p>Subscription: {profile?.subscription || "Free"}</p><button onClick={() => signOut(auth)} className="dangerBtn">Logout</button></section></main>;
}

function Editor({ book, pageIndex, setPageIndex, saveBook, setScreen, toast }) {
  const [selected, setSelected] = useState(null);
  const [sheet, setSheet] = useState(null);
  const pageRef = useRef(null);
  const page = book.pages[pageIndex] || makePage("cream", []);

  useEffect(() => {
    function onKey(e) {
      if ((e.key === "Delete" || e.key === "Backspace") && selected && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) removeElement(selected);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, book, pageIndex]);

  function changeBook(fn) {
    const next = { ...book, pages: book.pages.map((p, i) => i === pageIndex ? { ...p, elements: [...p.elements] } : p) };
    fn(next.pages[pageIndex], next);
    saveBook(next);
  }
  function updateElement(id, patch) { changeBook((p) => { p.elements = p.elements.map((el) => el.id === id ? { ...el, ...patch } : el); }); }
  function removeElement(id) { changeBook((p) => { p.elements = p.elements.filter((el) => el.id !== id); }); setSelected(null); }
  function duplicateElement(el) { changeBook((p) => p.elements.push({ ...el, id: uid(), x: el.x + 4, y: el.y + 4 })); }
  async function uploadPhoto(e, id) {
    const f = e.target.files?.[0];
    if (!f || !auth.currentUser) return;
    try {
      const r = ref(storage, `users/${auth.currentUser.uid}/photos/${Date.now()}-${f.name}`);
      await uploadBytes(r, f);
      const url = await getDownloadURL(r);
      updateElement(id, { src: url });
      toast("Photo uploaded ♡");
    } catch (err) {
      alert("Photo upload failed. Check Firebase Storage rules.");
    }
  }
  function startMove(ev, el) {
    ev.preventDefault(); ev.stopPropagation(); setSelected(el.id);
    const rect = pageRef.current.getBoundingClientRect(); const sx = ev.clientX, sy = ev.clientY, ox = el.x, oy = el.y;
    function move(e) { updateElement(el.id, { x: Math.max(0, Math.min(92, ox + ((e.clientX - sx) / rect.width) * 100)), y: Math.max(0, Math.min(92, oy + ((e.clientY - sy) / rect.height) * 100)) }); }
    function up() { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); }
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  }

  return <main className="editorPage"><header className="editorTop"><button onClick={() => setScreen("home")}>⌂ Home</button><strong>{book.name}</strong><button onClick={() => setScreen("flipbook")}>Flipbook</button></header><div ref={pageRef} className={`scrapPage ${page.bg}`} onClick={() => setSelected(null)}>{page.elements.map((el) => <div key={el.id} className={`editorEl ${selected === el.id ? "selected" : ""}`} style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`, transform: `rotate(${el.rotate || 0}deg)` }} onMouseDown={(e) => startMove(e, el)} onClick={(e) => { e.stopPropagation(); setSelected(el.id); }}>{el.type === "photo" && (el.src ? <img src={el.src} alt="" /> : <label className="uploadBox">Upload Photo<input type="file" accept="image/*" hidden onChange={(e) => uploadPhoto(e, el.id)} /></label>)}{el.type === "text" && <textarea value={el.text} style={{ fontSize: el.size }} onChange={(e) => updateElement(el.id, { text: e.target.value })} />}{el.type === "sticker" && <div className="stickerText">{el.text}</div>}{selected === el.id && <div className="miniTools"><button onClick={() => updateElement(el.id, { rotate: (el.rotate || 0) + 10 })}>↻</button><button onClick={() => updateElement(el.id, { w: el.w + 4, h: el.h + 4 })}>＋</button><button onClick={() => updateElement(el.id, { w: Math.max(6, el.w - 4), h: Math.max(6, el.h - 4) })}>−</button><button onClick={() => duplicateElement(el)}>⧉</button><button onClick={() => removeElement(el.id)}>🗑</button></div>}</div>)}</div><div className="pageNav"><button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>Prev</button><span>Page {pageIndex + 1} of {book.pages.length}</span><button disabled={pageIndex === book.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}>Next</button></div><nav className="editorTools"><button onClick={() => setScreen("home")}>Home</button><button onClick={() => changeBook((p) => p.elements.push(textEl("New text", 25, 25, 42, 10, 22)))}>Text</button><button onClick={() => changeBook((p) => p.elements.push(photoEl(20, 22, 52, 42)))}>Photo</button><button onClick={() => setSheet(sheet === "stickers" ? null : "stickers")}>Stickers</button><button onClick={() => setSheet(sheet === "backgrounds" ? null : "backgrounds")}>Backgrounds</button><button onClick={() => changeBook((p, next) => next.pages.push(makePage("cream", [])))}>Page</button></nav>{sheet && <div className="paperPopup editorSheet"><div className="tape" />{sheet === "stickers" ? stickers.map((s) => <button key={s} onClick={() => { changeBook((p) => p.elements.push(stickerEl(s, 30, 30))); setSheet(null); }}>{s}</button>) : bgOptions.map((b) => <button key={b.id} onClick={() => { changeBook((p) => { p.bg = b.id; }); setSheet(null); }}>{b.name}</button>)}</div>}</main>;
}

function Flipbook({ book, pageIndex, setPageIndex, setScreen, deleteBook }) {
  const [menu, setMenu] = useState(false);
  const p = book.pages[pageIndex] || makePage("cream", []);
  return <main className="page flipPageScreen"><button onClick={() => setScreen("home")}>Back</button><button className="flipDots" onClick={() => setMenu(!menu)}>⋯</button>{menu && <div className="paperPopup flipMenu"><div className="tape" /><button onClick={() => setScreen("editor")}>Edit</button><button onClick={() => alert("Export coming soon")}>Export</button><button onClick={() => deleteBook(book)}>Delete</button></div>}<h1>{book.name}</h1><div className={`scrapPage flipBook ${p.bg}`}><PreviewPage book={{ pages: [p] }} /></div><div className="pageNav"><button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>Prev</button><span>{pageIndex + 1}/{book.pages.length}</span><button disabled={pageIndex === book.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}>Next</button></div></main>;
}

createRoot(document.getElementById("root")).render(<App />);
