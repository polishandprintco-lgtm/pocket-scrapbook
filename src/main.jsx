import React, { Component, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { auth, db, storage } from "./firebase";
import { deleteUser } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  updateProfile,
  updateEmail,
  updatePassword,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const backgrounds = ["cream", "grid", "dots", "paper", "blank", "babyPink", "lavender", "babyBlue", "pinkPlaid", "bluePlaid"];
const stickers = ["♡", "✿", "☆", "☁", "🧸", "🎀", "📷", "🌸", "🌿", "✨", "🐰", "🍼"];

function photo(x, y, w, h, rotate = 0, locked = false) {
  return { id: makeId(), type: "photo", src: "", x, y, w, h, rotate, locked };
}
function text(value, x, y, w, h, size = 22, rotate = 0, locked = false, cls = "") {
  return { id: makeId(), type: "text", text: value, x, y, w, h, size, rotate, locked, cls };
}
function note(value, x, y, w, h, rotate = 0, locked = false) {
  return { id: makeId(), type: "note", text: value, x, y, w, h, size: 16, rotate, locked };
}
function sticker(value, x, y, w = 12, h = 12, rotate = 0, locked = true, cls = "") {
  return { id: makeId(), type: "sticker", text: value, x, y, w, h, rotate, locked, cls };
}
function page(bg = "cream", elements = []) {
  return { id: makeId(), bg, elements };
}

function pocketTemplate(bg = "cream") {
  return [
    page(bg, [
      text("pocket", 27, 9, 46, 10, 30, 0, true, "script"),
      text("SCRAPBOOK", 14, 22, 72, 8, 26, 0, true),
      photo(12, 42, 34, 34, -5),
      note("about me ♡", 54, 44, 32, 17, 2),
      sticker("♡", 75, 13, 10, 10, 0, true, "pink"),
    ]),
    page(bg, [text("my family", 12, 10, 60, 10, 26, 0, true), photo(10, 30, 36, 34, -3), photo(52, 32, 34, 32, 4), note("people I love", 28, 72, 44, 9)]),
    page(bg, [text("places I've been", 10, 10, 76, 10, 25, 0, true), photo(13, 30, 34, 34, 2), photo(52, 24, 34, 40, -3), sticker("✈", 76, 72, 12, 12, 0, true), note("adventure notes", 20, 73, 50, 9)]),
  ];
}
function blankTemplate(bg = "cream") { return [page(bg, [])]; }
function memoryTemplate(bg = "lavender") { return [page(bg, [text("memory book", 18, 12, 64, 12, 28, 0, true), photo(18, 35, 64, 40), note("favorite memories ♡", 24, 78, 52, 10)])]; }
function babyTemplate(kind = "girl") {
  const girl = kind === "girl";
  const bg = girl ? "pinkPlaid" : "bluePlaid";
  const accent = girl ? "pink" : "blue";
  const pages = [];
  pages.push(page(bg, [
    text("baby's\nfirst year", 8, 10, 42, 20, 27, -3, true, "script"),
    photo(10, 42, 32, 36, -4), photo(54, 34, 26, 30, 5),
    note(girl ? "baby girl ♡" : "baby boy ♡", 52, 69, 33, 10, -2),
    sticker(girl ? "🎀" : "🧸", 73, 13, 15, 15, 0, true, accent), sticker("♡", 7, 75, 10, 10, 0, true, accent),
  ]));
  pages.push(page(bg, [text("hello\nworld\n♡", 10, 10, 30, 24, 25, -3, true, "script"), photo(47, 13, 34, 42, 4), note("date:\ntime:\nweight:\nlength:", 13, 46, 31, 32, -2), sticker(girl ? "🌸" : "☆", 75, 70, 12, 12, 0, true, accent)]));
  pages.push(page(bg, [text("tiny\nhands\nbig\nlove", 8, 16, 32, 34, 24, 0, true, "script"), photo(45, 12, 39, 48, 3), sticker("♡", 58, 68, 12, 12, 0, true, accent)]));
  for (let m = 1; m <= 12; m++) {
    pages.push(page(bg, [note(`${m}\nmonth${m > 1 ? "s" : ""}`, 8, 9, 24, 16, -2, true), sticker(girl ? "🎀" : "☆", 4, 4, 10, 10, 0, true, accent), photo(34, 20, 42, 42, m % 2 ? 2 : -2), note(m === 12 ? "one year\nof you ♡" : "growing\nso fast ♡", 24, 70, 52, 10), sticker(m % 3 === 0 ? "🧸" : girl ? "🌸" : "☆", 75, 64, 14, 14, 0, true, accent)]));
  }
  pages.push(page(bg, [text("one year\nreflection", 12, 10, 55, 12, 25, 0, true, "script"), note("favorite foods:\n\nfirst words:\n\nfavorite things:\n\nwhat I love most:", 12, 28, 76, 50), sticker(girl ? "🌸" : "🧸", 72, 8, 15, 15, 0, true, accent)]));
  return pages;
}
function getTemplate(key, bg) {
  if (key === "boy") return babyTemplate("boy");
  if (key === "girl") return babyTemplate("girl");
  if (key === "blank") return blankTemplate(bg);
  if (key === "memory") return memoryTemplate(bg);
  return pocketTemplate(bg);
}

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  componentDidCatch(error) { this.setState({ error }); }
  render() {
    if (this.state.error) return <div className="phoneFrame"><div className="errorBox"><h2>App Error</h2><pre>{String(this.state.error.message || this.state.error)}</pre></div></div>;
    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [books, setBooks] = useState([]);
  const [screen, setScreen] = useState("loading");
  const [active, setActive] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [toast, setToast] = useState("");

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    let profileUnsub = null;
    let booksUnsub = null;
    const authUnsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) { setScreen("auth"); setBooks([]); return; }
      setScreen("home");
      const profileRef = doc(db, "users", u.uid);
      try { await setDoc(profileRef, { name: u.displayName || "", email: u.email || "", photoURL: u.photoURL || "", subscription: "Free", dark: false }, { merge: true }); } catch (e) { notify("Profile save blocked by rules"); }
      profileUnsub = onSnapshot(profileRef, (snap) => setProfile(snap.data() || {}), () => setProfile({}));
      booksUnsub = onSnapshot(query(collection(db, "users", u.uid, "scrapbooks")), (snap) => setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => notify("Could not load scrapbooks"));
    });
    return () => { authUnsub(); if (profileUnsub) profileUnsub(); if (booksUnsub) booksUnsub(); };
  }, []);

  useEffect(() => { document.body.classList.toggle("dark", !!profile.dark); }, [profile.dark]);

  async function createBook(name, bg, template) {
    const data = { name: name || "Untitled Scrapbook", pages: getTemplate(template, bg), createdAt: serverTimestamp(), updatedAt: serverTimestamp(), premium: template === "boy" || template === "girl" };
    const saved = await addDoc(collection(db, "users", user.uid, "scrapbooks"), data);
    setActive({ ...data, id: saved.id });
    setPageIndex(0);
    setScreen("editor");
    notify("Scrapbook created ♡");
  }
  async function saveBook(book) {
    setActive(book);
    if (book?.id && user) await updateDoc(doc(db, "users", user.uid, "scrapbooks", book.id), { ...book, updatedAt: serverTimestamp() }).catch(() => notify("Save failed"));
  }
  async function deleteBook(book) {
    if (!book?.id) return;
    await deleteDoc(doc(db, "users", user.uid, "scrapbooks", book.id));
    setScreen("home");
    notify("Deleted ♡");
  }
  function openBook(book, flip = false) { setActive(book); setPageIndex(0); setScreen(flip ? "flipbook" : "editor"); }

  if (screen === "loading") return <Shell><p className="loading">Loading...</p></Shell>;
  if (!user) return <Auth />;

  const showNav = !["editor", "flipbook"].includes(screen);
  return <Shell>
    {screen === "home" && <Home books={books} openBook={openBook} setScreen={setScreen} />}
    {screen === "scrapbooks" && <Scrapbooks books={books} openBook={openBook} deleteBook={deleteBook} />}
    {screen === "create" && <Create createBook={createBook} books={books} profile={profile} />}
    {screen === "templates" && <Templates createBook={createBook} />}
    {screen === "premium" && <Premium profile={profile} />}
    {screen === "profile" && <Profile user={user} profile={profile} notify={notify} />}
    {screen === "editor" && active && <Editor book={active} pageIndex={pageIndex} setPageIndex={setPageIndex} saveBook={saveBook} setScreen={setScreen} notify={notify} />}
    {screen === "flipbook" && active && <Flipbook book={active} pageIndex={pageIndex} setPageIndex={setPageIndex} setScreen={setScreen} deleteBook={deleteBook} notify={notify} />}
    {showNav && <BottomNav screen={screen} setScreen={setScreen} />}
    {toast && <Notice>{toast}</Notice>}
  </Shell>;
}

function Shell({ children }) { return <div className="phoneFrame">{children}</div>; }
function Header({ setScreen, title = "SCRAPBOOK", home = true }) { return <header className="logoHeader">{home && <button className="homeIcon" onClick={() => setScreen("home")}>⌂</button>}<div><div className="miniScript">pocket</div><h1>{title}</h1></div><button className="heartBtn">♡</button></header>; }
function BottomNav({ screen, setScreen }) { const item = (s, icon, label) => <button className={screen === s ? "active" : ""} onClick={() => setScreen(s)}><span>{icon}</span>{label}</button>; return <nav className="bottomNav">{item("home", "⌂", "Home")}{item("templates", "▧", "Templates")}<button className="plus" onClick={() => setScreen("create")}>＋</button>{item("premium", "♡", "Premium")}{item("profile", "♙", "Profile")}</nav>; }
function Notice({ children }) { return <div className="paperNotice"><div className="tape"></div>{children}</div>; }
function Confirm({ book, onCancel, onDelete }) { return <div className="modalShade"><div className="paperModal"><div className="tape"></div><h3>Delete scrapbook?</h3><p>Are you sure you want to delete “{book.name}”? This can’t be undone.</p><div className="modalButtons"><button onClick={onCancel}>Cancel</button><button className="danger" onClick={onDelete}>Delete</button></div></div></div>; }

function Auth() {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  async function submit(e) { e.preventDefault(); setErr(""); try { if (mode === "login") await signInWithEmailAndPassword(auth, email, pass); else await createUserWithEmailAndPassword(auth, email, pass); } catch (error) { setErr(error.message); } }
  return <div className="authPage"><div className="sidePhoto flowers"></div><div className="sidePhoto beach"></div><header className="authBrand"><div className="bookBadge">♡</div><div className="miniScript">pocket</div><h1>SCRAPBOOK</h1><p>Capture your story. Cherish every moment.</p></header><form className="authCard paper" onSubmit={submit}><div className="tape"></div><h2>{mode === "login" ? "Welcome back ♡" : "Create account ♡"}</h2><label>Email address</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /><label>Password</label><div className="passInput"><input type={show ? "text" : "password"} value={pass} onChange={(e) => setPass(e.target.value)} required /><button type="button" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button></div>{mode === "login" && <button type="button" className="smallLink" onClick={() => email && sendPasswordResetEmail(auth, email)}>Forgot password?</button>}{err && <p className="error">{err}</p>}<button className="primary">{mode === "login" ? "Log In" : "Create Account"}</button><p className="swap">{mode === "login" ? "New here?" : "Have an account?"} <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account ♡" : "Log in ♡"}</button></p></form></div>;
}

function Home({ books, openBook, setScreen }) { return <main className="page"><Header setScreen={setScreen} /><section className="welcome"><div className="welcomeText"><h2>Welcome<br />back ♡</h2><p>Every story matters.<br />What will you capture today?</p></div><div className="heroPolaroid"></div></section><section className="quickGrid"><button onClick={() => setScreen("create")}><span>＋</span><b>New Scrapbook</b><small>Start a new chapter</small></button><button onClick={() => setScreen("scrapbooks")}><span>📖</span><b>My Scrapbooks</b><small>View and manage</small></button><button onClick={() => setScreen("templates")}><span>▧</span><b>Templates</b><small>Browse designs</small></button><button onClick={() => setScreen("premium")}><span>♡</span><b>Premium</b><small>Unlock more</small></button></section><Title title="My Scrapbooks" action="View all ›" onClick={() => setScreen("scrapbooks")} /><div className="coverRow">{books.slice(0, 4).map((b) => <Book key={b.id} book={b} onClick={() => openBook(b)} />)}{books.length === 0 && <div className="emptyCard">Create your first scrapbook ♡</div>}</div></main>; }
function Title({ title, action, onClick }) { return <div className="sectionTitle"><h2>{title}</h2>{action && <button onClick={onClick}>{action}</button>}</div>; }
function Book({ book, onClick, menu }) { return <article className="bookTile" onClick={onClick}><div className={`bookCover ${book.pages?.[0]?.bg || "cream"}`}><Preview book={book} /></div><div className="bookMeta"><b>{book.name}</b><small>{book.pages?.length || 1} pages</small>{menu}</div></article>; }
function Preview({ book }) { const els = book.pages?.[0]?.elements || []; return <>{els.slice(0, 7).map((el) => <span key={el.id} className={`pv ${el.type} ${el.cls || ""}`} style={{ left: el.x + "%", top: el.y + "%", width: el.w + "%", height: el.h + "%", transform: `rotate(${el.rotate || 0}deg)` }}>{["text", "note", "sticker"].includes(el.type) ? el.text : ""}</span>)}</>; }

function Scrapbooks({ books, openBook, deleteBook }) {
  const [menu, setMenu] = useState(null);
  const [del, setDel] = useState(null);
  const chosen = books.find((b) => b.id === menu);
  return <main className="page"><Header setScreen={() => {}} home={false} /><h2>My Scrapbooks</h2><div className="scrapbookGrid">{books.map((b) => <Book key={b.id} book={b} onClick={() => openBook(b)} menu={<button className="dotMenu" onClick={(e) => { e.stopPropagation(); setMenu(menu === b.id ? null : b.id); }}>⋮</button>} />)}</div>{chosen && <div className="floatingMenu paper"><div className="tape"></div><button onClick={() => openBook(chosen)}>Edit</button><button onClick={() => openBook(chosen, true)}>Flipbook</button><button onClick={() => setDel(chosen)}>Delete</button></div>}{del && <Confirm book={del} onCancel={() => setDel(null)} onDelete={() => { deleteBook(del); setDel(null); }} />}</main>;
}
function Create({ createBook, books, profile }) {
  const [name, setName] = useState("");
  const [bg, setBg] = useState("cream");
  const [template, setTemplate] = useState("myLife");
  const limit = (profile.subscription || "Free") === "Free" && books.length >= 3;
  return <main className="page"><Header setScreen={() => {}} /><section className="createPanel paper"><div className="tape"></div><h2>Create a scrapbook</h2><input placeholder="Name your scrapbook" value={name} onChange={(e) => setName(e.target.value)} /><select value={template} onChange={(e) => setTemplate(e.target.value)}><option value="myLife">Pocket Scrapbook - Free</option><option value="blank">Blank Book - Free</option><option value="memory">Memory Book - Free</option><option value="boy">Baby Boy - Premium</option><option value="girl">Baby Girl - Premium</option></select><select value={bg} onChange={(e) => setBg(e.target.value)}>{backgrounds.map((b) => <option key={b} value={b}>{b}</option>)}</select>{limit && <Notice>Free plan includes 3 scrapbooks.</Notice>}<button className="primary" disabled={limit} onClick={() => createBook(name, bg, template)}>Create Scrapbook</button></section></main>;
}
function Templates({ createBook }) { const items = [["myLife", "Pocket Scrapbook", "Free"], ["blank", "Blank Book", "Free"], ["memory", "Memory Book", "Free"], ["boy", "Baby Boy First Year", "Premium"], ["girl", "Baby Girl First Year", "Premium"]]; return <main className="page"><Header setScreen={() => {}} home={false} /><h2>Templates</h2><div className="templateGrid">{items.map(([key, name, tag]) => { const pages = getTemplate(key, key === "boy" ? "bluePlaid" : key === "girl" ? "pinkPlaid" : "cream"); return <button key={key} className="templateTile" onClick={() => createBook(name, pages[0].bg, key)}><div className={`templatePreview ${pages[0].bg}`}><Preview book={{ pages }} /></div><b>{name}</b><small>{tag}</small></button>; })}</div></main>; }

function Editor({ book, pageIndex, setPageIndex, saveBook, setScreen, notify }) {
  const [selected, setSelected] = useState(null);
  const [sheet, setSheet] = useState(null);
  const pageRef = useRef(null);
  const currentPage = book.pages[pageIndex] || page();
  const selectedEl = (currentPage.elements || []).find((e) => e.id === selected);
  function change(fn) { const copy = { ...book, pages: book.pages.map((p) => ({ ...p, elements: [...(p.elements || [])] })) }; fn(copy.pages[pageIndex], copy); saveBook(copy); }
  function updateElement(id, patch) { change((p) => { p.elements = p.elements.map((e) => e.id === id ? { ...e, ...patch } : e); }); }
  function deleteElement(id) { const item = (currentPage.elements || []).find((e) => e.id === id); if (item?.locked) { notify("Unlock this first"); return; } change((p) => { p.elements = p.elements.filter((e) => e.id !== id); }); setSelected(null); }
  async function upload(file, id) { if (!file) return; try { const storageRef = ref(storage, `users/${auth.currentUser.uid}/photos/${Date.now()}-${file.name}`); await uploadBytes(storageRef, file); const url = await getDownloadURL(storageRef); updateElement(id, { src: url }); notify("Photo uploaded ♡"); } catch (e) { notify("Upload failed. Check Firebase Storage rules."); } }
  function startDrag(ev, item) { if (item.locked) return; ev.stopPropagation(); setSelected(item.id); const rect = pageRef.current.getBoundingClientRect(); const startX = ev.clientX; const startY = ev.clientY; const ox = item.x; const oy = item.y; const move = (e) => updateElement(item.id, { x: Math.max(0, Math.min(92, ox + ((e.clientX - startX) / rect.width) * 100)), y: Math.max(0, Math.min(92, oy + ((e.clientY - startY) / rect.height) * 100)) }); const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); }; window.addEventListener("mousemove", move); window.addEventListener("mouseup", up); }
  return <main className="editorPage"><header className="editorTop"><button onClick={() => setScreen("home")}>⌂ Home</button><strong>{book.name}</strong><button onClick={() => setScreen("flipbook")}>Flipbook</button></header><div ref={pageRef} className={`scrapPage ${currentPage.bg}`} onClick={() => setSelected(null)}>{(currentPage.elements || []).map((item) => <div key={item.id} onMouseDown={(e) => startDrag(e, item)} onClick={(e) => { e.stopPropagation(); setSelected(item.id); }} className={`editorEl ${selected === item.id ? "selected" : ""} ${item.locked ? "locked" : ""} ${item.cls || ""}`} style={{ left: item.x + "%", top: item.y + "%", width: item.w + "%", height: item.h + "%", transform: `rotate(${item.rotate || 0}deg)` }}>{item.type === "photo" && (item.src ? <img src={item.src} /> : <label className="uploadLabel">Upload Photo<input type="file" hidden accept="image/*" onChange={(e) => upload(e.target.files?.[0], item.id)} /></label>)}{item.type === "text" && <textarea readOnly={item.locked} value={item.text} style={{ fontSize: item.size }} onChange={(e) => updateElement(item.id, { text: e.target.value })} />}{item.type === "note" && <textarea readOnly={item.locked} value={item.text} onChange={(e) => updateElement(item.id, { text: e.target.value })} />}{item.type === "sticker" && <div className="stickerText">{item.text}</div>}</div>)}</div><div className="pageNav"><button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>Prev</button><span>Page {pageIndex + 1} of {book.pages.length}</span><button disabled={pageIndex === book.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}>Next</button></div>{selectedEl && <div className="miniToolbar"><button onClick={() => updateElement(selectedEl.id, { locked: !selectedEl.locked })}>{selectedEl.locked ? "🔒 Unlock" : "🔓 Lock"}</button><button disabled={selectedEl.locked} onClick={() => updateElement(selectedEl.id, { rotate: (selectedEl.rotate || 0) + 10 })}>↻</button><button disabled={selectedEl.locked} onClick={() => updateElement(selectedEl.id, { w: selectedEl.w + 4, h: selectedEl.h + 4 })}>＋</button><button disabled={selectedEl.locked} onClick={() => updateElement(selectedEl.id, { w: Math.max(5, selectedEl.w - 4), h: Math.max(5, selectedEl.h - 4) })}>−</button><button disabled={selectedEl.locked} onClick={() => change((p) => p.elements.push({ ...selectedEl, id: makeId(), x: selectedEl.x + 4, y: selectedEl.y + 4, locked: false }))}>⧉</button><button disabled={selectedEl.locked} onClick={() => deleteElement(selectedEl.id)}>🗑</button></div>}<nav className="editorTools"><button onClick={() => change((p) => p.elements.push(text("New text", 25, 25, 42, 10, 22)))}>Text</button><button onClick={() => change((p) => p.elements.push(photo(20, 22, 52, 42)))}>Photo</button><button onClick={() => setSheet(sheet === "stickers" ? null : "stickers")}>Stickers</button><button onClick={() => setSheet(sheet === "backgrounds" ? null : "backgrounds")}>Backgrounds</button><button onClick={() => change((p, copy) => copy.pages.push(page("cream", [])))}>Page</button></nav>{sheet && <div className="paperPopup editorSheet"><div className="tape"></div>{sheet === "stickers" ? stickers.map((s) => <button key={s} onClick={() => { change((p) => p.elements.push(sticker(s, 30, 30, 12, 12, 0, false))); setSheet(null); }}>{s}</button>) : backgrounds.map((b) => <button key={b} onClick={() => { change((p) => p.bg = b); setSheet(null); }}>{b}</button>)}</div>}</main>;
}
function Flipbook({ book, pageIndex, setPageIndex, setScreen, deleteBook, notify }) { const [menu, setMenu] = useState(false); const [del, setDel] = useState(false); const p = book.pages[pageIndex] || page(); function exportPage() { const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${book.name}-page-${pageIndex + 1}.json`; a.click(); notify("Export downloaded ♡"); } return <main className="page"><header className="flipTop"><button className="cuteBack" onClick={() => setScreen("editor")}>‹ Back</button><strong>{book.name}</strong><button className="dotsTop" onClick={() => setMenu(!menu)}>⋯</button></header>{menu && <div className="paperPopup flipMenu"><div className="tape"></div><button onClick={() => setScreen("editor")}>Edit</button><button onClick={exportPage}>Export</button><button onClick={() => setDel(true)}>Delete</button></div>}<div className={`scrapPage flipBookPage ${p.bg}`}><Preview book={{ pages: [p] }} /></div><div className="pageNav"><button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>Prev</button><span>{pageIndex + 1}/{book.pages.length}</span><button disabled={pageIndex === book.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}>Next</button></div>{del && <Confirm book={book} onCancel={() => setDel(false)} onDelete={() => deleteBook(book)} />}</main>; }
function Premium({ profile }) { return <main className="page"><Header setScreen={() => {}} home={false} /><section className="paper premiumCard"><div className="tape"></div><h2>Premium</h2><p>Your plan: {profile.subscription || "Free"}</p><table><tbody><tr><th>Feature</th><th>Free</th><th>Premium</th></tr><tr><td>Scrapbooks</td><td>3</td><td>Unlimited</td></tr><tr><td>Baby templates</td><td>99¢ each</td><td>Included</td></tr><tr><td>Photo uploads</td><td>15</td><td>Unlimited</td></tr></tbody></table><button className="primary">Upgrade $4.99/mo</button><p className="hint">Payments need Stripe before real charging works.</p></section></main>; }
function Profile({ user, profile, notify }) { const [name, setName] = useState(profile.name || user.displayName || ""); const [email, setEmail] = useState(user.email || ""); const [pass, setPass] = useState(""); useEffect(() => setName(profile.name || user.displayName || ""), [profile.name, user.displayName]); async function uploadProfile(e) { const file = e.target.files?.[0]; if (!file) return; try { const storageRef = ref(storage, `users/${user.uid}/profile/${Date.now()}-${file.name}`); await uploadBytes(storageRef, file); const url = await getDownloadURL(storageRef); await updateProfile(user, { photoURL: url }); await updateDoc(doc(db, "users", user.uid), { photoURL: url }); notify("Profile photo saved ♡"); } catch (err) { notify("Profile upload failed"); } } return <main className="page"><Header setScreen={() => {}} home={false} /><section className="profileCard paper"><div className="tape"></div><label className="avatar"><img src={profile.photoURL || user.photoURL || "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=300"} /><span>Change Photo</span><input type="file" hidden accept="image/*" onChange={uploadProfile} /></label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" /><button onClick={async () => { await updateProfile(user, { displayName: name }); await updateDoc(doc(db, "users", user.uid), { name }); notify("Name saved ♡"); }}>Save Name</button><h3>Settings</h3><label className="toggle">Dark theme <input type="checkbox" checked={!!profile.dark} onChange={(e) => updateDoc(doc(db, "users", user.uid), { dark: e.target.checked })} /></label><input value={email} onChange={(e) => setEmail(e.target.value)} /><button onClick={() => updateEmail(user, email).then(() => notify("Email updated")).catch(() => notify("Sign in again to update email"))}>Update Email</button><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="New password" /><button onClick={() => pass && updatePassword(user, pass).then(() => notify("Password updated")).catch(() => notify("Sign in again to update password"))}>Update Password</button><p>Subscription: {profile.subscription || "Free"}</p><button className="danger" onClick={() => signOut(auth)}>Logout</button></section></main>; <button
  className="danger"
  onClick={async () => {
    const ok = window.confirm(
      "Are you sure you want to permanently delete your account and all scrapbooks?"
    );

    if (!ok) return;

    try {
      await deleteUser(user);
    } catch (err) {
      alert(
        "For security reasons you may need to log out and log back in before deleting your account."
      );
    }
  }}
>
  Delete Account
</button> }

createRoot(document.getElementById("root")).render(<ErrorBoundary><App /></ErrorBoundary>);
