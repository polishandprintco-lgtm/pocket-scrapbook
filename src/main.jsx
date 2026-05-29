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

const safeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

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

function photoBox(x, y, w, h, rotate = 0) {
  return { id: safeId(), type: "photo", src: "", x, y, w, h, rotate };
}
function textBox(text, x, y, w, h, size = 22, rotate = 0) {
  return { id: safeId(), type: "text", text, x, y, w, h, size, rotate };
}
function stickerBox(text, x, y, w = 12, h = 12, rotate = 0) {
  return { id: safeId(), type: "sticker", text, x, y, w, h, rotate };
}
function makePage(bg = "cream", elements = []) {
  return { id: safeId(), bg, elements };
}
function myLifeTemplate(bg = "cream") {
  return [
    makePage(bg, [
      textBox("pocket", 30, 10, 40, 8, 28),
      textBox("SCRAPBOOK", 17, 20, 66, 8, 28),
      photoBox(12, 38, 34, 38, -4),
      textBox("about me ♡", 54, 43, 34, 12, 18, 2),
      stickerBox("🌿", 74, 70),
    ]),
    makePage(bg, [textBox("my family", 12, 12, 55, 10, 28), photoBox(12, 30, 35, 35, -3), photoBox(53, 35, 32, 30, 4)]),
    makePage(bg, [textBox("places I’ve been", 10, 12, 70, 10, 25), photoBox(14, 30, 34, 36, 3), photoBox(52, 24, 35, 38, -2), stickerBox("✈", 74, 70)]),
  ];
}
function babyTemplate(kind = "girl") {
  const girl = kind === "girl";
  const bg = girl ? "babyPink" : "babyBlue";
  const label = girl ? "baby girl" : "baby boy";
  return Array.from({ length: 13 }, (_, i) => {
    if (i === 0) return makePage(bg, [textBox("baby’s\nfirst year", 9, 10, 42, 18, 27, -2), photoBox(10, 40, 30, 34, -4), photoBox(52, 35, 26, 28, 5), textBox(`${label} ♡`, 51, 68, 34, 10, 18), stickerBox(girl ? "🎀" : "🧸", 72, 14)]);
    return makePage(bg, [textBox(i === 12 ? "one year\nof you" : `${i}\nmonth${i > 1 ? "s" : ""}`, 8, 10, 28, 17, 24, -2), photoBox(34, 20, 42, 42, 2), textBox(i === 12 ? "what a year ♡" : "growing so fast ♡", 27, 72, 50, 9, 18), stickerBox(girl ? "🌸" : "☆", 12, 70)]);
  });
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [books, setBooks] = useState([]);
  const [screen, setScreen] = useState("loading");
  const [active, setActive] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [toast, setToast] = useState("");

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  useEffect(() => {
    const off = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setScreen("auth");
        return;
      }
      const userRef = doc(db, "users", u.uid);
      await setDoc(userRef, { name: u.displayName || "", email: u.email || "", photoURL: u.photoURL || "", subscription: "Free", uploadsUsed: 0, uploadLimit: 15, dark: false }, { merge: true });
      const offProfile = onSnapshot(userRef, (snap) => setProfile(snap.data() || {}));
      const q = query(collection(db, "users", u.uid, "scrapbooks"), orderBy("updatedAt", "desc"));
      const offBooks = onSnapshot(q, (snap) => setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
      setScreen("home");
      return () => { offProfile(); offBooks(); };
    });
    return () => off();
  }, []);

  useEffect(() => { document.body.classList.toggle("dark", !!profile?.dark); }, [profile?.dark]);

  async function createBook(name, bg = "cream", pages = null, paidOnly = false) {
    if (!user) return;
    if (paidOnly && profile?.subscription !== "Premium") notify("Premium template preview saved. Add Stripe later for real payment.");
    const data = { name: name || "Untitled Scrapbook", pages: pages || myLifeTemplate(bg), paidOnly, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const refDoc = await addDoc(collection(db, "users", user.uid, "scrapbooks"), data);
    setActive({ ...data, id: refDoc.id });
    setPageIndex(0);
    setScreen("editor");
    notify("Scrapbook created ♡");
  }
  async function saveBook(book) {
    if (!user || !book?.id) return;
    setActive(book);
    await updateDoc(doc(db, "users", user.uid, "scrapbooks", book.id), { ...book, updatedAt: serverTimestamp() });
  }
  async function deleteBook(book) {
    if (!user || !book?.id) return;
    if (!confirm(`Are you sure you want to delete “${book.name}”?`)) return;
    await deleteDoc(doc(db, "users", user.uid, "scrapbooks", book.id));
    notify("Scrapbook deleted");
    setScreen("home");
  }
  function openBook(book, flip = false) { setActive(book); setPageIndex(0); setScreen(flip ? "flipbook" : "editor"); }

  if (screen === "loading") return <Shell toast={toast}><p className="loading">Loading pocket scrapbook...</p></Shell>;
  if (!user) return <Auth notify={notify} />;
  return <Shell toast={toast}>{screen !== "editor" && screen !== "flipbook" && <TopNav setScreen={setScreen} />}{screen === "home" && <Home books={books} openBook={openBook} createBook={createBook} deleteBook={deleteBook} setScreen={setScreen} />}{screen === "create" && <CreateBook createBook={createBook} setScreen={setScreen} />}{screen === "editor" && active && <Editor book={active} pageIndex={pageIndex} setPageIndex={setPageIndex} saveBook={saveBook} setScreen={setScreen} notify={notify} />}{screen === "flipbook" && active && <Flipbook book={active} pageIndex={pageIndex} setPageIndex={setPageIndex} setScreen={setScreen} deleteBook={deleteBook} />}{screen === "premium" && <Premium profile={profile} />}{screen === "profile" && <Profile user={user} profile={profile} notify={notify} />}</Shell>;
}

function Shell({ children, toast }) { return <div className="phoneFrame">{children}{toast && <div className="toast"><span className="tape"></span>{toast}</div>}</div>; }
function TopNav({ setScreen }) { return <nav className="topNav"><button onClick={() => setScreen("home")}>Home</button><button onClick={() => setScreen("premium")}>Premium</button><button onClick={() => setScreen("profile")}>Profile</button></nav>; }

function Auth({ notify }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  async function submit(e) { e.preventDefault(); setErr(""); try { if (mode === "login") await signInWithEmailAndPassword(auth, email, pass); else await createUserWithEmailAndPassword(auth, email, pass); notify(mode === "login" ? "Welcome back ♡" : "Account created ♡"); } catch (x) { setErr(x.message); } }
  return <div className="authPage"><div className="authPhoto photoOne"></div><div className="authPhoto photoTwo"></div><header className="authBrand"><div className="brandIcon">♡</div><div className="script">pocket</div><h1>SCRAPBOOK</h1><p>Capture your story. Cherish every moment.</p></header><form className="authCard" onSubmit={submit}><h2>{mode === "login" ? "Welcome back ♡" : "Create account ♡"}</h2><label>Email address</label><input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" autoComplete="email" required /><label>Password</label><div className="passwordLine"><input value={pass} onChange={(e)=>setPass(e.target.value)} type={show ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required /><button type="button" onClick={()=>setShow(!show)}>{show ? "Hide" : "Show"}</button></div>{mode === "login" && <button type="button" className="forgot" onClick={()=> email ? sendPasswordResetEmail(auth,email).then(()=>notify("Password reset sent ♡")) : setErr("Enter your email first.")}>Forgot password?</button>}{err && <p className="error">{err}</p>}<button className="primary">{mode === "login" ? "Log In" : "Create Account"}</button><p className="swap">{mode === "login" ? "New here?" : "Already have an account?"} <button type="button" onClick={()=>setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account ♡" : "Log in ♡"}</button></p></form></div>;
}

function Home({ books, openBook, setScreen, createBook, deleteBook }) {
  const [menu, setMenu] = useState(null);
  const recent = books.slice(0, 6);
  return <main className="page dashboard"><section className="dashHero"><div className="hamburger">☰</div><div className="dashLogo"><span>pocket</span><b>SCRAPBOOK</b></div><div className="bell">♡</div><div className="heroText"><h1>Welcome back ♡</h1><p>Every story matters.<br/>What will you capture today?</p></div><div className="heroPolaroid"></div></section><section className="quickGrid"><button onClick={()=>setScreen("create")}><span>＋</span><b>New Scrapbook</b><small>Start a new chapter</small></button><button><span>📖</span><b>My Scrapbooks</b><small>View and manage books</small></button><button onClick={()=>books[0] && openBook(books[0])}><span>🖼</span><b>Add Memory</b><small>Add photos and notes</small></button><button onClick={()=>document.getElementById("templates")?.scrollIntoView({behavior:"smooth"})}><span>🏷</span><b>Templates</b><small>Browse beautiful templates</small></button></section><TitleRow title="My Scrapbooks" /> <section className="bookShelf">{books.length === 0 && <p className="empty">No scrapbooks yet. Create your first one ♡</p>}{books.map((b)=><article key={b.id} className="bookTile" onClick={()=>openBook(b)}><div className={`cover ${b.pages?.[0]?.bg || "cream"}`}><Preview book={b} /></div><button className="tileDots" onClick={(e)=>{e.stopPropagation();setMenu(menu===b.id?null:b.id)}}>⋮</button>{menu===b.id && <div className="cardMenu" onClick={(e)=>e.stopPropagation()}><button onClick={()=>openBook(b)}>Edit</button><button onClick={()=>openBook(b,true)}>View Flipbook</button><button onClick={()=>alert("Export coming soon")}>Export</button><button onClick={()=>{const n=prompt("Rename scrapbook", b.name); if(n) updateDoc(doc(db,"users",auth.currentUser.uid,"scrapbooks",b.id),{name:n});}}>Rename</button><button onClick={()=>deleteBook(b)}>Delete</button></div>}<h3>{b.name}</h3><p>{b.pages?.length || 1} pages</p></article>)}</section><TitleRow title="Recent Memories" /><section className="recentRow">{recent.length ? recent.map((b)=><button key={b.id} onClick={()=>openBook(b)} className={`memory ${b.pages?.[0]?.bg || "cream"}`}><Preview book={b}/></button>) : ["☕","🌿","📷","♡"].map((x,i)=><div key={i} className="memory placeholder">{x}</div>)}</section><TitleRow title="Templates" id="templates" /><section className="templateGrid"><button onClick={()=>createBook("My Life", "cream", myLifeTemplate("cream"), false)}><div className="cover cream"><span>pocket scrapbook</span></div><b>My Life</b><small>Free</small></button><button onClick={()=>createBook("Blank Cream", "cream", [makePage("cream", [])], false)}><div className="cover paper"><span>blank pages</span></div><b>Blank Book</b><small>Free</small></button><button onClick={()=>createBook("Memory Book", "lavender", myLifeTemplate("lavender"), false)}><div className="cover lavender"><span>memories</span></div><b>Memory Book</b><small>Free</small></button><button onClick={()=>createBook("Baby Boy First Year", "babyBlue", babyTemplate("boy"), true)}><div className="cover babyBlue"><span>baby boy</span></div><b>Baby Boy</b><small>Premium</small></button><button onClick={()=>createBook("Baby Girl First Year", "babyPink", babyTemplate("girl"), true)}><div className="cover babyPink"><span>baby girl</span></div><b>Baby Girl</b><small>Premium</small></button></section><BottomNav setScreen={setScreen} /></main>;
}
function TitleRow({ title, id }) { return <div id={id} className="titleRow"><h2>{title}</h2><button>View all ›</button></div>; }
function BottomNav({ setScreen }) { return <nav className="bottomNav"><button onClick={()=>setScreen("home")}>⌂<span>Home</span></button><button onClick={()=>setScreen("home")}>📖<span>Scrapbooks</span></button><button className="plus" onClick={()=>setScreen("create")}>＋</button><button>♡<span>Memories</span></button><button onClick={()=>setScreen("profile")}>♙<span>Profile</span></button></nav>; }

function CreateBook({ createBook, setScreen }) {
  const [name,setName] = useState("");
  const [bg,setBg] = useState("cream");
  const [template,setTemplate] = useState("myLife");
  function pagesFor() { if (template === "blank") return [makePage(bg, [])]; if (template === "boy") return babyTemplate("boy"); if (template === "girl") return babyTemplate("girl"); return myLifeTemplate(bg); }
  return <main className="page createScreen"><button className="plainBack" onClick={()=>setScreen("home")}>‹ Back</button><section className="createPanel"><h1>Create a scrapbook</h1><input placeholder="Name your scrapbook" value={name} onChange={(e)=>setName(e.target.value)} /><select value={bg} onChange={(e)=>setBg(e.target.value)}>{bgOptions.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select><select value={template} onChange={(e)=>setTemplate(e.target.value)}><option value="myLife">My Life - Free</option><option value="blank">Blank - Free</option><option value="memory">Memory Book - Free</option><option value="boy">Baby Boy - Premium</option><option value="girl">Baby Girl - Premium</option></select><button className="primary" onClick={()=>createBook(name || "Untitled Scrapbook", bg, pagesFor(), template === "boy" || template === "girl")}>Create Scrapbook</button></section></main>;
}

function Preview({ book }) { const els = book?.pages?.[0]?.elements || []; return <>{els.slice(0,5).map((el)=><span key={el.id} className={`pv ${el.type}`} style={{left:`${el.x}%`,top:`${el.y}%`,width:`${el.w}%`,height:`${el.h}%`,transform:`rotate(${el.rotate||0}deg)`}}>{el.type==="text"?el.text:el.type==="sticker"?el.text:""}</span>)}</>; }

function Editor({ book, pageIndex, setPageIndex, saveBook, setScreen, notify }) {
  const [selected,setSelected] = useState(null);
  const [popup,setPopup] = useState(null);
  const pageRef = useRef(null);
  const cur = book.pages?.[pageIndex] || makePage("cream", []);
  useEffect(()=>{ const key=(e)=>{ const tag=document.activeElement?.tagName; if((e.key==="Delete"||e.key==="Backspace") && selected && tag!=="INPUT" && tag!=="TEXTAREA") remove(selected); }; window.addEventListener("keydown", key); return()=>window.removeEventListener("keydown", key); }, [selected, book, pageIndex]);
  function mutate(fn){ const nb={...book,pages:(book.pages||[]).map((p,i)=>i===pageIndex?{...p,elements:[...(p.elements||[])]}:p)}; fn(nb.pages[pageIndex], nb); saveBook(nb); }
  function update(id, patch){ mutate(p=>{p.elements=p.elements.map(el=>el.id===id?{...el,...patch}:el);}); }
  function remove(id){ mutate(p=>{p.elements=p.elements.filter(el=>el.id!==id);}); setSelected(null); }
  function duplicate(el){ mutate(p=>p.elements.push({...el,id:safeId(),x:Math.min(88,el.x+4),y:Math.min(88,el.y+4)})); }
  async function upload(e,id){ const file=e.target.files?.[0]; if(!file)return; const r=ref(storage,`users/${auth.currentUser.uid}/photos/${Date.now()}-${file.name}`); await uploadBytes(r,file); update(id,{src:await getDownloadURL(r)}); notify("Photo added ♡"); }
  function addPhoto(){ mutate(p=>p.elements.push(photoBox(18,20,55,42))); }
  function addText(){ mutate(p=>p.elements.push(textBox("New text",24,24,46,10,22))); }
  function startMove(ev, el){ if (ev.target.tagName === "TEXTAREA" || ev.target.tagName === "BUTTON") return; ev.stopPropagation(); setSelected(el.id); const rect=pageRef.current.getBoundingClientRect(); const sx=ev.clientX, sy=ev.clientY, ox=el.x, oy=el.y; const move=(e)=>update(el.id,{x:Math.max(0,Math.min(92,ox+((e.clientX-sx)/rect.width)*100)),y:Math.max(0,Math.min(92,oy+((e.clientY-sy)/rect.height)*100))}); const up=()=>{window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);}; window.addEventListener("mousemove",move); window.addEventListener("mouseup",up); }
  return <main className="editor"><div ref={pageRef} className={`scrapPage ${cur.bg}`} onClick={()=>setSelected(null)}>{(cur.elements||[]).map(el=><div key={el.id} className={`el ${selected===el.id?"selected":""}`} style={{left:`${el.x}%`,top:`${el.y}%`,width:`${el.w}%`,height:`${el.h}%`,transform:`rotate(${el.rotate||0}deg)`}} onMouseDown={(e)=>startMove(e,el)} onClick={(e)=>{e.stopPropagation();setSelected(el.id);}}>{el.type==="photo" && (el.src?<img src={el.src} alt="" />:<label className="uploadLabel">Upload Photo<input hidden type="file" accept="image/*" onChange={(e)=>upload(e,el.id)} /></label>)}{el.type==="text" && <textarea value={el.text} style={{fontSize:el.size}} onChange={(e)=>update(el.id,{text:e.target.value})}/>} {el.type==="sticker" && <div className="sticker">{el.text}</div>}{selected===el.id && <div className="miniControls"><button onClick={()=>update(el.id,{rotate:(el.rotate||0)+10})}>↻</button><button onClick={()=>update(el.id,{w:el.w+4,h:el.h+4})}>＋</button><button onClick={()=>update(el.id,{w:Math.max(8,el.w-4),h:Math.max(8,el.h-4)})}>−</button><button onClick={()=>duplicate(el)}>⧉</button><button onClick={()=>remove(el.id)}>🗑</button></div>}</div>)}</div><div className="pageNav"><button disabled={pageIndex===0} onClick={()=>setPageIndex(pageIndex-1)}>Prev</button><span>Page {pageIndex+1} of {book.pages?.length || 1}</span><button disabled={pageIndex===(book.pages?.length || 1)-1} onClick={()=>setPageIndex(pageIndex+1)}>Next</button></div><div className="bottomTools"><button onClick={()=>setScreen("home")}>Back</button><button onClick={addText}>Text</button><button onClick={addPhoto}>Photo</button><button onClick={()=>setPopup(popup==="stickers"?null:"stickers")}>Stickers</button><button onClick={()=>setPopup(popup==="bg"?null:"bg")}>Backgrounds</button><button onClick={()=>mutate((p,nb)=>nb.pages.push(makePage("cream",[])))}>Page</button><button onClick={()=>setScreen("flipbook")}>Flipbook</button></div>{popup && <div className="sheet">{popup==="stickers"?stickers.map(s=><button key={s} onClick={()=>{mutate(p=>p.elements.push(stickerBox(s,30,30)));setPopup(null);}}>{s}</button>):bgOptions.map(b=><button key={b.id} onClick={()=>{mutate(p=>p.bg=b.id);setPopup(null);}}>{b.name}</button>)}</div>}</main>;
}

function Flipbook({ book, pageIndex, setPageIndex, setScreen, deleteBook }) { const [menu,setMenu]=useState(false); const p=book.pages?.[pageIndex]||makePage("cream",[]); return <main className="page flip"><button className="plainBack" onClick={()=>setScreen("home")}>‹ Back</button><button className="dots fixed" onClick={()=>setMenu(!menu)}>⋯</button>{menu&&<div className="flipMenu"><button onClick={()=>setScreen("editor")}>Edit</button><button onClick={()=>alert("Export coming soon")}>Export</button><button onClick={()=>{const n=prompt("Rename scrapbook",book.name); if(n) updateDoc(doc(db,"users",auth.currentUser.uid,"scrapbooks",book.id),{name:n});}}>Rename</button><button onClick={()=>deleteBook(book)}>Delete</button></div>}<div className={`scrapPage flipPage ${p.bg}`}><Preview book={{pages:[p]}} /></div><div className="pageNav"><button disabled={pageIndex===0} onClick={()=>setPageIndex(pageIndex-1)}>Prev</button><span>{pageIndex+1}/{book.pages?.length||1}</span><button disabled={pageIndex===(book.pages?.length||1)-1} onClick={()=>setPageIndex(pageIndex+1)}>Next</button></div></main>; }
function Premium({ profile }) { return <main className="page"><h1>Premium</h1><p>Your plan: {profile?.subscription || "Free"}</p><table><tbody><tr><th>Feature</th><th>Free</th><th>Premium</th></tr><tr><td>3 free scrapbook templates</td><td>✓</td><td>✓</td></tr><tr><td>Baby templates</td><td>99¢ each</td><td>✓</td></tr><tr><td>Photo uploads</td><td>15</td><td>Unlimited</td></tr><tr><td>Advanced text effects</td><td>—</td><td>✓</td></tr><tr><td>Extra 20 photos</td><td>99¢</td><td>Included</td></tr></tbody></table><button className="primary">Upgrade $4.99/mo</button><p className="hint">Real payments need Stripe connected later.</p></main>; }
function Profile({ user, profile = {}, notify }) { const [name,setName]=useState(profile?.name || ""); const [email,setEmail]=useState(user?.email || ""); const [pass,setPass]=useState(""); async function pic(e){ const file=e.target.files?.[0]; if(!file)return; const r=ref(storage,`users/${user.uid}/profile-${Date.now()}-${file.name}`); await uploadBytes(r,file); const url=await getDownloadURL(r); await updateProfile(user,{photoURL:url}); await updateDoc(doc(db,"users",user.uid),{photoURL:url}); notify("Profile photo updated ♡"); } return <main className="page profile"><h1>Profile</h1><label className="avatar"><img src={profile?.photoURL || user?.photoURL || "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=300"} alt="profile"/><input hidden type="file" accept="image/*" onChange={pic}/></label><input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name"/><button onClick={async()=>{await updateProfile(user,{displayName:name}); await updateDoc(doc(db,"users",user.uid),{name}); notify("Name saved ♡");}}>Save Name</button><h2>Settings</h2><label className="toggle">Dark theme <input type="checkbox" checked={!!profile?.dark} onChange={(e)=>updateDoc(doc(db,"users",user.uid),{dark:e.target.checked})}/></label><input value={email} onChange={(e)=>setEmail(e.target.value)} /><button onClick={()=>updateEmail(user,email)}>Update Email</button><input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} placeholder="New password"/><button onClick={()=>pass&&updatePassword(user,pass)}>Update Password</button><p>Subscription: {profile?.subscription || "Free"}</p><button>Change/Cancel Subscription</button><button className="danger" onClick={()=>signOut(auth)}>Logout</button></main>; }

createRoot(document.getElementById("root")).render(<App />);
