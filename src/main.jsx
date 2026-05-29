
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

const bgOptions = [
  { id: "cream", name: "Cream" },
  { id: "grid", name: "Grid" },
  { id: "dots", name: "Dots" },
  { id: "paper", name: "Paper" },
  { id: "blank", name: "Blank" },
  { id: "babyPink", name: "Baby Pink" },
  { id: "lavender", name: "Light Lavender" },
  { id: "babyBlue", name: "Baby Blue" },
  { id: "pinkPlaid", name: "Pink Plaid" },
  { id: "bluePlaid", name: "Blue Plaid" },
];

const stickerOptions = ["♡", "✿", "☆", "☁", "🧸", "🎀", "📷", "🌸", "🌿", "✨", "✈", "🏡", "🐾", "🎂", "🍼", "👶"];
const makeId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
const nowPageTitle = (i) => i === 0 ? "Cover" : i === 1 ? "Birth" : i <= 13 ? `${i - 1} Month${i - 1 > 1 ? "s" : ""}` : i === 14 ? "First Birthday" : "Reflection";

function photoEl(x, y, w, h, rotate = 0, locked = false) {
  return { id: makeId(), type: "photo", src: "", x, y, w, h, rotate, locked };
}
function textEl(text, x, y, w, h, size = 24, rotate = 0, locked = false, cls = "") {
  return { id: makeId(), type: "text", text, x, y, w, h, size, rotate, locked, cls };
}
function stickerEl(text, x, y, w = 12, h = 12, rotate = 0, locked = true, cls = "") {
  return { id: makeId(), type: "sticker", text, x, y, w, h, rotate, locked, cls };
}
function noteEl(text, x, y, w, h, rotate = 0, locked = false) {
  return { id: makeId(), type: "note", text, x, y, w, h, rotate, locked };
}
function page(bg = "cream", elements = []) { return { id: makeId(), bg, elements }; }

function myLifeTemplate(bg = "cream") {
  return [
    page(bg, [textEl("pocket scrapbook", 20, 10, 60, 8, 25, 0, true), photoEl(13, 38, 32, 36, -4), noteEl("about me ♡", 55, 43, 30, 18, 2), stickerEl("♡", 72, 18, 12, 12)]),
    page(bg, [textEl("my family", 12, 12, 45, 10, 28, 0, true), photoEl(9, 28, 38, 35, -3), photoEl(52, 32, 34, 30, 4), noteEl("people I love", 28, 72, 45, 10, 0)]),
    page(bg, [textEl("places I've been", 8, 10, 70, 10, 25, 0, true), photoEl(13, 28, 34, 35, 3), photoEl(50, 22, 35, 38, -2), stickerEl("✈", 75, 70), noteEl("adventure notes", 20, 72, 50, 10, 0)]),
  ];
}
function blankBookTemplate(bg = "cream") { return [page(bg, [])]; }
function memoryTemplate(bg = "lavender") { return [page(bg, [textEl("memories", 25, 12, 50, 10, 30, 0, true), photoEl(18, 35, 64, 40, 0), noteEl("favorite moment", 25, 78, 50, 9)])]; }

function babyTemplate(kind = "girl") {
  const girl = kind === "girl";
  const bg = girl ? "pinkPlaid" : "bluePlaid";
  const accent = girl ? "pink" : "blue";
  const label = girl ? "our little girl" : "our little boy";
  const pages = [];
  pages.push(page(bg, [
    stickerEl(girl ? "🎀" : "🎀", 3, 4, 16, 12, -8, true, accent),
    textEl("baby's\nfirst year", 18, 8, 45, 18, 28, -2, true, "scriptTitle"),
    noteEl(label, 55, 21, 32, 8, -2, false),
    photoEl(10, 39, 32, 35, -5, false),
    photoEl(52, 35, 28, 28, 5, false),
    stickerEl("♡", 7, 75, 10, 9, 0, true, accent), stickerEl("✿", 78, 69, 10, 10, 0, true, accent),
    noteEl("so much\nlove ♡", 50, 69, 26, 14, -2, false)
  ]));
  pages.push(page(bg, [
    textEl("hello\nworld\n♡", 10, 10, 30, 24, 25, -3, true, "typeText"),
    photoEl(48, 12, 34, 43, 4, false),
    noteEl("the day\nyou were born ♡\n\ndate:\ntime:\nweight:\nlength:", 15, 43, 30, 33, -2, false),
    stickerEl(girl ? "🌸" : "☆", 75, 68, 10, 10, 0, true, accent)
  ]));
  pages.push(page(bg, [
    textEl("tiny\nhands\nbig\nlove\n♡", 8, 15, 30, 34, 24, 0, true, "typeText"),
    photoEl(44, 10, 40, 48, 3, false),
    stickerEl("♡", 58, 66, 12, 12, 0, true, accent), stickerEl("✿", 20, 72, 10, 10, 0, true, accent)
  ]));
  for (let m = 1; m <= 12; m++) {
    const layouts = [
      [photoEl(45, 17, 40, 38, 0), noteEl("you are\nso loved\n♡", 15, 57, 26, 14, -2)],
      [photoEl(22, 30, 28, 30, -4), photoEl(52, 28, 28, 31, 4), noteEl("growing\nso fast ♡", 44, 65, 32, 10, -2)],
      [photoEl(45, 22, 40, 35, 0), noteEl(girl ? "sweet girl ♡" : "sweet boy ♡", 50, 67, 30, 9, 1), stickerEl("🧸", 18, 60, 18, 18, 0, true, accent)],
      [photoEl(36, 23, 42, 39, 0), noteEl("so happy ♡", 45, 68, 30, 9, 0), stickerEl("♡", 15, 65, 12, 12, 0, true, accent)],
      [photoEl(48, 15, 31, 32, 2), photoEl(22, 43, 28, 29, -3), noteEl("cutest\nsmile ♡", 62, 68, 26, 11, 0)],
      [photoEl(36, 20, 42, 42, 0), noteEl("little\nblessing ♡", 10, 65, 28, 11, -2), stickerEl("🐰", 73, 61, 15, 15, 0, true, accent)],
      [photoEl(27, 22, 28, 32, -2), photoEl(58, 21, 28, 32, 2), noteEl("learning\n& growing ♡", 60, 69, 31, 11, 0)],
      [photoEl(36, 15, 32, 37, -3), noteEl("learning\n& growing ♡", 53, 65, 32, 13, 0), noteEl("notes", 12, 50, 25, 25, 0)],
      [photoEl(27, 23, 37, 35, 2), photoEl(65, 24, 24, 28, 4), noteEl("so\ncurious ♡", 63, 67, 28, 12, 0)],
      [photoEl(20, 18, 34, 38, 0), noteEl("so much\njoy ♡", 12, 68, 28, 10, -2), noteEl("", 55, 18, 30, 48, 0)],
      [photoEl(28, 19, 28, 36, -4), photoEl(58, 20, 28, 35, 3), noteEl("almost\none! ♡", 62, 69, 28, 10, 0)],
      [photoEl(22, 20, 34, 38, 0), noteEl("what a\nyear ♡", 20, 70, 28, 10, 0), noteEl("", 60, 15, 26, 47, 0)]
    ][m - 1];
    pages.push(page(bg, [
      noteEl(`${m}\nmonth${m > 1 ? "s" : ""}`, 8, 9, 24, 16, -2, true),
      stickerEl(girl ? "🎀" : "☆", 4, 4, 10, 10, 0, true, accent),
      stickerEl(girl ? "♡" : "☆", 83, 10, 8, 8, 0, true, accent),
      stickerEl("✿", 12, 76, 9, 9, 0, true, accent),
      ...layouts
    ]));
  }
  pages.push(page(bg, [
    textEl("one year\nof you\n♡", 10, 13, 38, 25, 26, 0, true, "typeText"), photoEl(45, 18, 40, 45, -2, false),
    noteEl("our greatest\nblessing ♡", 53, 70, 36, 12, -2, false), stickerEl(girl ? "♡" : "☆", 15, 70, 13, 13, 0, true, accent)
  ]));
  pages.push(page(bg, [
    textEl("one year\nreflection", 12, 10, 50, 12, 25, 0, true, "scriptTitle"),
    noteEl("favorite foods:\n\nfirst words:\n\nfavorite things:\n\nwhat I love most:", 12, 28, 76, 50, 0, false),
    stickerEl(girl ? "🌸" : "🧸", 72, 8, 15, 15, 0, true, accent)
  ]));
  return pages;
}

function coverClass(book) { return `bookCover ${book.pages?.[0]?.bg || "cream"}`; }

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [books, setBooks] = useState([]);
  const [screen, setScreen] = useState("loading");
  const [active, setActive] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [toast, setToast] = useState(null);
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    setUser(u);
    if (!u) { setScreen("auth"); return; }
    const pref = doc(db, "users", u.uid);
    await setDoc(pref, { name: u.displayName || "", email: u.email || "", photoURL: u.photoURL || "", subscription: "Free", uploadsUsed: 0, uploadLimit: 15, dark: false }, { merge: true });
    const unsubProfile = onSnapshot(pref, (s) => setProfile(s.data() || {}));
    const q = query(collection(db, "users", u.uid, "scrapbooks"), orderBy("updatedAt", "desc"));
    const unsubBooks = onSnapshot(q, (s) => setBooks(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    setScreen("home");
    return () => { unsubProfile(); unsubBooks(); };
  }), []);
  useEffect(() => document.body.classList.toggle("dark", !!profile.dark), [profile.dark]);

  async function saveBook(book) {
    setActive(book);
    if (!user || !book?.id) return;
    await updateDoc(doc(db, "users", user.uid, "scrapbooks", book.id), { ...book, updatedAt: serverTimestamp() });
  }
  async function createBook(name, bg, pages = null, premium = false) {
    const data = { name: name || "Untitled Scrapbook", pages: pages || myLifeTemplate(bg), createdAt: serverTimestamp(), updatedAt: serverTimestamp(), premium };
    const r = await addDoc(collection(db, "users", user.uid, "scrapbooks"), data);
    setActive({ ...data, id: r.id }); setPageIndex(0); setScreen("editor"); notify("Scrapbook created ♡");
  }
  async function deleteBook(book) {
    if (!book?.id) return;
    await deleteDoc(doc(db, "users", user.uid, "scrapbooks", book.id));
    notify("Scrapbook deleted"); setScreen("home");
  }
  function openBook(b, flip = false) { setActive(b); setPageIndex(0); setScreen(flip ? "flipbook" : "editor"); }

  if (screen === "loading") return <div className="phoneFrame"><p className="loading">Loading...</p></div>;
  if (!user) return <Auth />;
  return <div className="phoneFrame">
    {screen === "home" && <Home books={books} openBook={openBook} setScreen={setScreen} />}
    {screen === "scrapbooks" && <Scrapbooks books={books} openBook={openBook} deleteBook={deleteBook} notify={notify} />}
    {screen === "create" && <CreateBook createBook={createBook} setScreen={setScreen} books={books} profile={profile} />}
    {screen === "templates" && <Templates createBook={createBook} />}
    {screen === "editor" && active && <Editor book={active} pageIndex={pageIndex} setPageIndex={setPageIndex} saveBook={saveBook} setScreen={setScreen} notify={notify} />}
    {screen === "flipbook" && active && <Flipbook book={active} pageIndex={pageIndex} setPageIndex={setPageIndex} setScreen={setScreen} deleteBook={deleteBook} notify={notify} />}
    {screen === "premium" && <Premium profile={profile} />}
    {screen === "profile" && <Profile user={user} profile={profile} notify={notify} />}
    {screen !== "auth" && screen !== "editor" && <BottomNav screen={screen} setScreen={setScreen} />}
    {toast && <PaperNotice>{toast}</PaperNotice>}
  </div>;
}

function BottomNav({ screen, setScreen }) {
  const item = (id, icon, label) => <button className={screen === id ? "active" : ""} onClick={() => setScreen(id)}><span>{icon}</span><b>{label}</b></button>;
  return <nav className="bottomNav">
    {item("home", "⌂", "Home")}
    {item("templates", "▧", "Templates")}
    <button className="plus" onClick={() => setScreen("create")}>＋</button>
    {item("premium", "♡", "Premium")}
    {item("profile", "♙", "Profile")}
  </nav>;
}

function HomeIcon({ setScreen }) { return <button className="homeIcon" onClick={() => setScreen("home")} title="Home">⌂</button>; }
function LogoHeader({ setScreen, showHome = true }) { return <header className="logoHeader">{showHome && <HomeIcon setScreen={setScreen}/>}<div><div className="miniScript">pocket</div><h1>SCRAPBOOK</h1></div><button className="heartBtn">♡</button></header>; }
function PaperNotice({ children }) { return <div className="paperNotice"><div className="tape"></div>{children}</div>; }
function ConfirmModal({ title, message, onCancel, onConfirm, confirmText = "Delete" }) { return <div className="modalShade"><div className="paperModal"><div className="tape"></div><h3>{title}</h3><p>{message}</p><div className="modalButtons"><button onClick={onCancel}>Cancel</button><button className="danger" onClick={onConfirm}>{confirmText}</button></div></div></div>; }

function Auth() {
  const [mode, setMode] = useState("login"), [email, setEmail] = useState(""), [pass, setPass] = useState(""), [show, setShow] = useState(false), [err, setErr] = useState("");
  async function submit(e) { e.preventDefault(); setErr(""); try { mode === "login" ? await signInWithEmailAndPassword(auth, email, pass) : await createUserWithEmailAndPassword(auth, email, pass); } catch (x) { setErr(x.message); } }
  return <div className="authPage">
    <div className="bgCircle pink"></div><div className="bgCircle tan"></div><div className="sidePhoto flowers"></div><div className="sidePhoto beach"></div>
    <header className="authBrand"><div className="bookBadge">♡</div><div className="miniScript">pocket</div><h1>SCRAPBOOK</h1><p>Capture your story. Cherish every moment.</p></header>
    <form className="authCard paper" onSubmit={submit}><div className="tape"></div><h2>{mode === "login" ? "Welcome back ♡" : "Create account ♡"}</h2>
      <label>Email address</label><input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required />
      <label>Password</label><div className="passInput"><input value={pass} onChange={(e)=>setPass(e.target.value)} type={show ? "text" : "password"} required /><button type="button" onClick={()=>setShow(!show)}>{show ? "Hide" : "Show"}</button></div>
      {mode === "login" && <button type="button" className="smallLink" onClick={()=> email && sendPasswordResetEmail(auth, email)}>Forgot password?</button>}
      {err && <p className="error">{err}</p>}<button className="primary">{mode === "login" ? "Log In" : "Create Account"}</button>
      <p className="swap">{mode === "login" ? "New here?" : "Have an account?"} <button type="button" onClick={()=>setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account ♡" : "Log in ♡"}</button></p>
    </form>
  </div>;
}

function Home({ books, openBook, setScreen }) {
  return <main className="page homePage"><LogoHeader setScreen={setScreen}/>
    <section className="welcome"><div><h2>Welcome<br/>back ♡</h2><p>Every story matters.<br/>What will you capture today?</p></div><div className="heroPolaroid"></div></section>
    <section className="quickGrid"><button onClick={()=>setScreen("create")}><span>＋</span><b>New Scrapbook</b><small>Start a new chapter</small></button><button onClick={()=>setScreen("scrapbooks")}><span>📖</span><b>My Scrapbooks</b><small>View and manage</small></button><button onClick={()=>setScreen("templates")}><span>▧</span><b>Templates</b><small>Browse designs</small></button><button onClick={()=>setScreen("premium")}><span>♡</span><b>Premium</b><small>Unlock more</small></button></section>
    <SectionTitle title="My Scrapbooks" action="View all ›" onClick={()=>setScreen("scrapbooks")}/>
    <div className="coverRow">{books.slice(0,4).map(b=><BookCover key={b.id} book={b} onClick={()=>openBook(b)}/>)}{books.length===0 && <EmptyCard text="Create your first scrapbook ♡"/>}</div>
  </main>;
}
function SectionTitle({ title, action, onClick }) { return <div className="sectionTitle"><h2>{title}</h2>{action&&<button onClick={onClick}>{action}</button>}</div>; }
function EmptyCard({ text }) { return <div className="emptyCard">{text}</div>; }
function BookCover({ book, onClick, menu }) { return <article className="bookTile" onClick={onClick}><div className={coverClass(book)}><CoverPreview book={book}/></div><div className="bookMeta"><b>{book.name}</b><small>{book.pages?.length || 1} pages</small>{menu}</div></article>; }
function CoverPreview({ book }) { const els = book.pages?.[0]?.elements || []; return <>{els.slice(0,5).map(el => <span key={el.id} className={`pv ${el.type} ${el.cls || ""}`} style={{left:el.x+"%",top:el.y+"%",width:el.w+"%",height:el.h+"%",transform:`rotate(${el.rotate||0}deg)`}}>{el.type === "text" || el.type === "note" ? el.text : el.type === "sticker" ? el.text : ""}</span>)}</>; }

function Scrapbooks({ books, openBook, deleteBook, notify }) { const [modal,setModal]=useState(null), [menu,setMenu]=useState(null); return <main className="page"><LogoHeader setScreen={()=>{}} showHome={false}/><h2>My Scrapbooks</h2><div className="scrapbookGrid">{books.map(b=><BookCover key={b.id} book={b} onClick={()=>openBook(b)} menu={<button className="dotMenu" onClick={(e)=>{e.stopPropagation();setMenu(menu===b.id?null:b.id)}}>⋮</button>}/>)}</div>{menu&&<div className="floatingMenu paper"><div className="tape"></div><button onClick={()=>{const b=books.find(x=>x.id===menu);openBook(b)}}>Edit</button><button onClick={()=>{const b=books.find(x=>x.id===menu);openBook(b,true)}}>Flipbook</button><button onClick={()=>alert("Export from Flipbook")}>Export</button><button onClick={()=>setModal(books.find(x=>x.id===menu))}>Delete</button></div>}{modal&&<ConfirmModal title="Delete scrapbook?" message={`Are you sure you want to delete “${modal.name}”? This can't be undone.`} onCancel={()=>setModal(null)} onConfirm={()=>{deleteBook(modal);setModal(null);notify("Deleted ♡")}}/>}</main>; }

function CreateBook({ createBook, setScreen, books, profile }) { const [name,setName]=useState(""), [bg,setBg]=useState("cream"), [template,setTemplate]=useState("myLife"); const freeLimit = (profile.subscription || "Free") === "Free" && books.length >= 3; return <main className="page"><LogoHeader setScreen={setScreen}/><section className="createPanel paper"><div className="tape"></div><h2>Create a scrapbook</h2><input placeholder="Name your scrapbook" value={name} onChange={e=>setName(e.target.value)}/><select value={template} onChange={e=>setTemplate(e.target.value)}><option value="myLife">Pocket Scrapbook - Free</option><option value="blank">Blank Book - Free</option><option value="memory">Memory Book - Free</option><option value="boy">Baby Boy - Premium</option><option value="girl">Baby Girl - Premium</option></select><select value={bg} onChange={e=>setBg(e.target.value)}>{bgOptions.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>{freeLimit && <PaperNotice>Free plan includes 3 scrapbooks. Upgrade for unlimited.</PaperNotice>}<button className="primary" disabled={freeLimit} onClick={()=>{let pages=template==="boy"?babyTemplate("boy"):template==="girl"?babyTemplate("girl"):template==="blank"?blankBookTemplate(bg):template==="memory"?memoryTemplate(bg):myLifeTemplate(bg); createBook(name || "Untitled Scrapbook", bg, pages, template==="boy"||template==="girl")}}>Create Scrapbook</button></section></main>; }

function Templates({ createBook }) { const templates=[{id:"myLife",name:"Pocket Scrapbook",tag:"Free",pages:myLifeTemplate("cream")},{id:"blank",name:"Blank Book",tag:"Free",pages:blankBookTemplate("cream")},{id:"memory",name:"Memory Book",tag:"Free",pages:memoryTemplate("lavender")},{id:"boy",name:"Baby Boy First Year",tag:"Premium",pages:babyTemplate("boy")},{id:"girl",name:"Baby Girl First Year",tag:"Premium",pages:babyTemplate("girl")}]; return <main className="page"><LogoHeader setScreen={()=>{}} showHome={false}/><h2>Templates</h2><div className="templateGrid">{templates.map(t=><button key={t.id} className="templateTile" onClick={()=>createBook(t.name, t.pages[0].bg, t.pages, t.tag==="Premium")}><div className={`templatePreview ${t.pages[0].bg}`}><CoverPreview book={{pages:t.pages}}/></div><b>{t.name}</b><small>{t.tag}</small></button>)}</div></main>; }

function Editor({ book, pageIndex, setPageIndex, saveBook, setScreen, notify }) {
  const [selected, setSelected] = useState(null), [sheet,setSheet]=useState(null); const pageRef=useRef(null); const fileRef=useRef(null); const pageData=book.pages[pageIndex];
  function changeBook(fn){const next={...book,pages:book.pages.map((p,i)=>i===pageIndex?{...p,elements:[...p.elements]}:{...p,elements:[...p.elements]})}; fn(next.pages[pageIndex],next); saveBook(next);}
  function updateElement(id,patch){changeBook(p=>{p.elements=p.elements.map(el=>el.id===id?{...el,...patch}:el)})}
  function selectedEl(){return pageData.elements.find(e=>e.id===selected)}
  function remove(id){const el=pageData.elements.find(e=>e.id===id); if(el?.locked){notify("Unlock this item first"); return;} changeBook(p=>{p.elements=p.elements.filter(e=>e.id!==id)}); setSelected(null)}
  async function uploadFile(file, id){ if(!file) return; try{ const r=ref(storage,`users/${auth.currentUser.uid}/photos/${Date.now()}-${file.name}`); await uploadBytes(r,file); const url=await getDownloadURL(r); updateElement(id,{src:url}); notify("Photo uploaded ♡"); }catch(e){ notify("Upload failed. Check Firebase Storage rules."); }}
  function startDrag(ev,el){ if(el.locked)return; ev.stopPropagation(); setSelected(el.id); const rect=pageRef.current.getBoundingClientRect(); const sx=ev.clientX, sy=ev.clientY, ox=el.x, oy=el.y; function move(e){updateElement(el.id,{x:Math.max(0,Math.min(92,ox+((e.clientX-sx)/rect.width)*100)),y:Math.max(0,Math.min(92,oy+((e.clientY-sy)/rect.height)*100))})} function up(){window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up)} window.addEventListener("mousemove",move);window.addEventListener("mouseup",up)}
  useEffect(()=>{function key(e){if((e.key==="Delete"||e.key==="Backspace")&&selected&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();remove(selected)}}window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)},[selected,pageData]);
  const el=selectedEl();
  return <main className="editorPage"><header className="editorTop"><button onClick={()=>setScreen("home")}>⌂ Home</button><strong>{book.name}</strong><button onClick={()=>setScreen("flipbook")}>Flipbook</button></header><div ref={pageRef} className={`scrapPage ${pageData.bg}`} onClick={()=>setSelected(null)}>{pageData.elements.map(el=><div key={el.id} className={`editorEl ${selected===el.id?"selected":""} ${el.locked?"locked":""} ${el.cls||""}`} style={{left:el.x+"%",top:el.y+"%",width:el.w+"%",height:el.h+"%",transform:`rotate(${el.rotate||0}deg)`}} onMouseDown={(e)=>startDrag(e,el)} onClick={(e)=>{e.stopPropagation();setSelected(el.id)}}>{el.type==="photo"&&(el.src?<img src={el.src} alt=""/>:<label className="uploadLabel">Upload Photo<input type="file" accept="image/*" hidden onChange={e=>uploadFile(e.target.files?.[0],el.id)}/></label>)}{el.type==="text"&&<textarea value={el.text} readOnly={el.locked} style={{fontSize:el.size}} onChange={e=>updateElement(el.id,{text:e.target.value})}/>} {el.type==="note"&&<textarea value={el.text} readOnly={el.locked} onChange={e=>updateElement(el.id,{text:e.target.value})}/>} {el.type==="sticker"&&<div className="stickerText">{el.text}</div>}</div>)}</div><div className="pageNav"><button disabled={pageIndex===0} onClick={()=>setPageIndex(pageIndex-1)}>Prev</button><span>Page {pageIndex+1} of {book.pages.length} · {nowPageTitle(pageIndex)}</span><button disabled={pageIndex===book.pages.length-1} onClick={()=>setPageIndex(pageIndex+1)}>Next</button></div>{el&&<div className="miniToolbar"><button onClick={()=>updateElement(el.id,{locked:!el.locked})}>{el.locked?"🔒 Unlock":"🔓 Lock"}</button><button disabled={el.locked} onClick={()=>updateElement(el.id,{rotate:(el.rotate||0)+10})}>↻</button><button disabled={el.locked} onClick={()=>updateElement(el.id,{w:el.w+4,h:el.h+4})}>＋</button><button disabled={el.locked} onClick={()=>updateElement(el.id,{w:Math.max(5,el.w-4),h:Math.max(5,el.h-4)})}>−</button><button disabled={el.locked} onClick={()=>changeBook(p=>p.elements.push({...el,id:makeId(),x:el.x+4,y:el.y+4,locked:false}))}>⧉</button><button disabled={el.locked} onClick={()=>remove(el.id)}>🗑</button></div>}<nav className="editorTools"><button onClick={()=>changeBook(p=>p.elements.push(textEl("New text",25,25,42,10,22,false,false)))}>Text</button><button onClick={()=>changeBook(p=>p.elements.push(photoEl(20,22,52,42,false,false)))}>Photo</button><button onClick={()=>setSheet(sheet==="stickers"?null:"stickers")}>Stickers</button><button onClick={()=>setSheet(sheet==="backgrounds"?null:"backgrounds")}>Backgrounds</button><button onClick={()=>changeBook((p,next)=>next.pages.push(page("cream",[])))}>Page</button></nav>{sheet&&<div className="paperPopup editorSheet"><div className="tape"></div>{sheet==="stickers"?stickerOptions.map(s=><button key={s} onClick={()=>{changeBook(p=>p.elements.push(stickerEl(s,30,30,12,12,0,false)));setSheet(null)}}>{s}</button>):bgOptions.map(b=><button key={b.id} onClick={()=>{changeBook(p=>{p.bg=b.id});setSheet(null)}}>{b.name}</button>)}</div>}</main>;
}

function Flipbook({ book, pageIndex, setPageIndex, setScreen, deleteBook, notify }) { const [menu,setMenu]=useState(false), [modal,setModal]=useState(false); const p=book.pages[pageIndex]; function exportPage(){ const data=JSON.stringify(p,null,2); const blob=new Blob([data],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`${book.name}-page-${pageIndex+1}.json`; a.click(); notify("Export downloaded ♡"); } return <main className="page flipPageScreen"><header className="flipTop"><button className="cuteBack" onClick={()=>setScreen("editor")}>‹ Back</button><strong>{book.name}</strong><button className="dotsTop" onClick={()=>setMenu(!menu)}>⋯</button></header>{menu&&<div className="paperPopup flipMenu"><div className="tape"></div><button onClick={()=>setScreen("editor")}>Edit</button><button onClick={exportPage}>Export</button><button onClick={()=>setModal(true)}>Delete</button></div>}<div className={`scrapPage flipBookPage ${p.bg}`}><CoverPreview book={{pages:[p]}}/></div><div className="pageNav"><button disabled={pageIndex===0} onClick={()=>setPageIndex(pageIndex-1)}>Prev</button><span>{pageIndex+1}/{book.pages.length}</span><button disabled={pageIndex===book.pages.length-1} onClick={()=>setPageIndex(pageIndex+1)}>Next</button></div>{modal&&<ConfirmModal title="Delete scrapbook?" message={`Delete “${book.name}”?`} onCancel={()=>setModal(false)} onConfirm={()=>deleteBook(book)}/>}</main> }

function Premium({ profile }) { return <main className="page"><LogoHeader setScreen={()=>{}} showHome={false}/><section className="paper premiumCard"><div className="tape"></div><h2>Premium</h2><p>Your plan: {profile.subscription || "Free"}</p><table><tbody><tr><th>Feature</th><th>Free</th><th>Premium</th></tr><tr><td>Scrapbooks</td><td>3</td><td>Unlimited</td></tr><tr><td>Baby templates</td><td>99¢ each</td><td>Included</td></tr><tr><td>Photo uploads</td><td>15</td><td>Unlimited</td></tr><tr><td>Advanced text effects</td><td>—</td><td>✓</td></tr></tbody></table><button className="primary">Upgrade $4.99/mo</button><p className="hint">Payments need Stripe before real charging works.</p></section></main> }
function Profile({ user, profile = {}, notify }) { const [name,setName]=useState(profile?.name||user?.displayName||""), [email,setEmail]=useState(user?.email||""), [pass,setPass]=useState(""); useEffect(()=>setName(profile?.name||user?.displayName||""),[profile?.name,user?.displayName]); async function pic(e){const f=e.target.files?.[0]; if(!f)return; try{const r=ref(storage,`users/${user.uid}/profile/profile-${Date.now()}-${f.name}`); await uploadBytes(r,f); const url=await getDownloadURL(r); await updateProfile(user,{photoURL:url}); await updateDoc(doc(db,"users",user.uid),{photoURL:url}); notify("Profile photo saved ♡");}catch(err){notify("Profile upload failed. Check Storage rules.")}} return <main className="page profilePage"><LogoHeader setScreen={()=>{}} showHome={false}/><section className="profileCard paper"><div className="tape"></div><label className="avatar"><img src={profile?.photoURL||user?.photoURL||"https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=300"}/><span>Change Photo</span><input type="file" hidden accept="image/*" onChange={pic}/></label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Name"/><button onClick={async()=>{await updateProfile(user,{displayName:name}); await updateDoc(doc(db,"users",user.uid),{name});notify("Name saved ♡")}}>Save Name</button><h3>Settings</h3><label className="toggle">Dark theme <input type="checkbox" checked={!!profile.dark} onChange={e=>updateDoc(doc(db,"users",user.uid),{dark:e.target.checked})}/></label><input value={email} onChange={e=>setEmail(e.target.value)}/><button onClick={()=>updateEmail(user,email).then(()=>notify("Email updated ♡")).catch(()=>notify("Sign in again to update email"))}>Update Email</button><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="New password"/><button onClick={()=>pass&&updatePassword(user,pass).then(()=>notify("Password updated ♡")).catch(()=>notify("Sign in again to update password"))}>Update Password</button><p>Subscription: {profile.subscription || "Free"}</p><button className="danger" onClick={()=>signOut(auth)}>Logout</button></section></main> }

createRoot(document.getElementById("root")).render(<App />);
