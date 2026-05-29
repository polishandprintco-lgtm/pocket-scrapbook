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
];

const stickers = ["♡", "✿", "☆", "☁", "🧸", "🎀", "📷", "🌸", "🌿", "✨", "✈", "🏡", "🐾", "🎂"];
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

function photoBox(x, y, w, h, rotate = 0) {
  return { id: uid(), type: "photo", src: "", x, y, w, h, rotate };
}
function textEl(text, x, y, w, h, size = 24, rotate = 0) {
  return { id: uid(), type: "text", text, x, y, w, h, size, rotate };
}
function stickerEl(text, x, y, w = 12, h = 12, rotate = 0) {
  return { id: uid(), type: "sticker", text, x, y, w, h, rotate };
}
function page(bg = "cream", elements = []) {
  return { id: uid(), bg, elements };
}
function myLifeTemplate(bg = "cream") {
  return [
    page(bg, [textEl("my life", 30, 11, 40, 10, 34), textEl("SCRAPBOOK", 17, 23, 66, 8, 28), photoBox(13, 42, 32, 36, -4), textEl("about me ♡", 54, 45, 33, 18, 18, 2), stickerEl("♡", 72, 12)]),
    page(bg, [textEl("my family", 10, 10, 45, 10, 28), photoBox(9, 28, 38, 35, -3), photoBox(52, 32, 34, 30, 4), textEl("people I love", 28, 72, 45, 10, 20)]),
    page(bg, [textEl("places I've been", 8, 10, 70, 10, 25), photoBox(13, 28, 34, 35, 3), photoBox(50, 22, 35, 38, -2), stickerEl("✈", 75, 70), textEl("adventure notes", 20, 72, 50, 10, 18)]),
  ];
}
function babyTemplate(kind = "girl") {
  const girl = kind === "girl";
  const bg = girl ? "babyPink" : "babyBlue";
  const label = girl ? "baby girl" : "baby boy";
  return Array.from({ length: 13 }).map((_, i) => {
    if (i === 0) return page(bg, [textEl("baby's\nfirst year", 9, 11, 42, 18, 28, -2), photoBox(10, 40, 30, 34, -4), photoBox(51, 35, 26, 28, 5), textEl(label + " ♡", 51, 68, 34, 10, 18), stickerEl(girl ? "🎀" : "🧸", 72, 14)]);
    return page(bg, [textEl(i === 12 ? "one year\nof you" : `${i}\nmonth${i > 1 ? "s" : ""}`, 8, 10, 25, 17, 24, -2), photoBox(34, 20, 42, 42, 2), textEl(i === 12 ? "what a year ♡" : "growing so fast ♡", 27, 72, 50, 9, 18), stickerEl(girl ? "🌸" : "☆", 12, 70)]);
  });
}
function previewStyle(book) {
  const bg = book.pages?.[0]?.bg || "cream";
  return `preview ${bg}`;
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [books, setBooks] = useState([]);
  const [screen, setScreen] = useState("loading");
  const [active, setActive] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    setUser(u);
    if (!u) { setScreen("auth"); return; }
    const pref = doc(db, "users", u.uid);
    await setDoc(pref, { name: u.displayName || "", email: u.email || "", photoURL: u.photoURL || "", subscription: "Free", uploadsUsed: 0, uploadLimit: 15, dark: false }, { merge: true });
    onSnapshot(pref, (s) => setProfile(s.data() || {}));
    const q = query(collection(db, "users", u.uid, "scrapbooks"), orderBy("updatedAt", "desc"));
    onSnapshot(q, (s) => setBooks(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    setScreen("home");
  }), []);

  useEffect(() => document.body.classList.toggle("dark", !!profile.dark), [profile.dark]);

  async function saveBook(book) {
    setActive(book);
    await updateDoc(doc(db, "users", user.uid, "scrapbooks", book.id), { ...book, updatedAt: serverTimestamp() });
  }
  async function createBook(name, bg, pages = null) {
    const data = { name, pages: pages || myLifeTemplate(bg), createdAt: serverTimestamp(), updatedAt: serverTimestamp(), paidOnly: false };
    const r = await addDoc(collection(db, "users", user.uid, "scrapbooks"), data);
    setActive({ ...data, id: r.id }); setPageIndex(0); setScreen("editor");
  }
  async function deleteBook(book) {
    if (!confirm(`Are you sure you want to delete “${book.name}”?`)) return;
    await deleteDoc(doc(db, "users", user.uid, "scrapbooks", book.id));
    setScreen("home");
  }
  function openBook(b, flip = false) { setActive(b); setPageIndex(0); setScreen(flip ? "flipbook" : "editor"); }

  if (screen === "loading") return <div className="phoneFrame"><p>Loading...</p></div>;
  if (!user) return <Auth />;
  return <div className="phoneFrame">
    {screen !== "editor" && screen !== "flipbook" && <TopNav setScreen={setScreen} />}
    {screen === "home" && <Home books={books} openBook={openBook} createBook={createBook} deleteBook={deleteBook} setScreen={setScreen} />}
    {screen === "create" && <CreateBook createBook={createBook} setScreen={setScreen} />}
    {screen === "editor" && active && <Editor book={active} pageIndex={pageIndex} setPageIndex={setPageIndex} saveBook={saveBook} setScreen={setScreen} />}
    {screen === "flipbook" && active && <Flipbook book={active} pageIndex={pageIndex} setPageIndex={setPageIndex} setScreen={setScreen} saveBook={saveBook} deleteBook={deleteBook} />}
    {screen === "premium" && <Premium profile={profile} />}
    {screen === "profile" && <Profile user={user} profile={profile} />}
  </div>;
}
function TopNav({ setScreen }) {
  return <nav className="topNav"><button onClick={() => setScreen("home")}>Home</button><button onClick={() => setScreen("premium")}>Premium</button><button onClick={() => setScreen("profile")}>Profile</button></nav>;
}

function Auth() {
  const [mode, setMode] = useState("login"), [email, setEmail] = useState(""), [pass, setPass] = useState(""), [show, setShow] = useState(false), [err, setErr] = useState("");
  async function submit(e) { e.preventDefault(); setErr(""); try { mode === "login" ? await signInWithEmailAndPassword(auth, email, pass) : await createUserWithEmailAndPassword(auth, email, pass); } catch (x) { setErr(x.message); } }
  return <div className="authPage">
    <div className="polaroid p1"></div><div className="polaroid p2"></div><div className="sprig s1">⌇</div><div className="sprig s2">♡</div>
    <header className="authBrand"><div className="bookBadge">♡</div><div className="script">my life</div><h1>SCRAPBOOK</h1><p>Capture your story. Cherish every moment.</p></header>
    <form className="authCard" onSubmit={submit}>
      <h2>{mode === "login" ? "Welcome back ♡" : "Create account ♡"}</h2>
      <label>Email address</label><input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required />
      <label>Password</label><div className="passRow"><input value={pass} onChange={(e)=>setPass(e.target.value)} type={show ? "text" : "password"} required /><button type="button" onClick={()=>setShow(!show)}>{show ? "Hide" : "Show"}</button></div>
      {mode === "login" && <button type="button" className="smallLink" onClick={()=> email && sendPasswordResetEmail(auth, email)}>Forgot password?</button>}
      {err && <p className="error">{err}</p>}
      <button className="primary">{mode === "login" ? "Log In" : "Create Account"}</button>
      <p className="swap">{mode === "login" ? "New here?" : "Have an account?"} <button type="button" onClick={()=>setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account ♡" : "Log in ♡"}</button></p>
    </form>
  </div>;
}

function Home({ books, openBook, createBook, deleteBook, setScreen }) {
  const [menu, setMenu] = useState(null);
  const freeCount = books.length;
  return <main className="page homePage">
    <section className="hero"><h1>Pocket Scrapbook</h1><p>Soft, pretty scrapbook pages that save automatically.</p></section>
    <button className="createBig" onClick={() => setScreen("create")}>＋ Create a Scrapbook</button>
    <h2>My Scrapbooks</h2>
    <section className="bookGrid">
      {books.map((b) => <article key={b.id} className="bookCard" onClick={() => openBook(b)}>
        <div className={previewStyle(b)}><Preview book={b} /></div>
        <button className="dots" onClick={(e)=>{ e.stopPropagation(); setMenu(menu === b.id ? null : b.id);}}>⋯</button>
        {menu === b.id && <div className="cardMenu" onClick={(e)=>e.stopPropagation()}><button onClick={()=>openBook(b)}>Edit</button><button onClick={()=>openBook(b,true)}>View Flipbook</button><button onClick={()=>alert("Export coming soon")}>Export</button><button onClick={()=>{const n=prompt("Rename scrapbook", b.name); if(n) updateDoc(doc(db,"users",auth.currentUser.uid,"scrapbooks",b.id),{name:n});}}>Rename</button><button onClick={()=>deleteBook(b)}>Delete</button></div>}
        <h3>{b.name}</h3><p>{b.pages?.length || 1} page(s)</p>
      </article>)}
    </section>
    <h2>Templates</h2><section className="templateGrid">
      <button className="templateCard free" onClick={() => createBook("My Life", "cream", myLifeTemplate("cream"))}><div className="preview cream"><span>my life</span></div><b>My Life</b><small>Free</small></button>
      <button className="templateCard premium" onClick={() => createBook("Baby Boy First Year", "babyBlue", babyTemplate("boy"))}><div className="preview babyBlue"><span>baby boy</span></div><b>Baby Boy</b><small>Monthly premium</small></button>
      <button className="templateCard premium" onClick={() => createBook("Baby Girl First Year", "babyPink", babyTemplate("girl"))}><div className="preview babyPink"><span>baby girl</span></div><b>Baby Girl</b><small>Monthly premium</small></button>
    </section>
  </main>;
}

function CreateBook({ createBook, setScreen }) {
  const [name, setName] = useState(""), [bg, setBg] = useState("cream"), [template, setTemplate] = useState("myLife");
  return <main className="page"><button onClick={()=>setScreen("home")}>Back</button><section className="createPanel"><h1>Create a scrapbook</h1><input placeholder="Name your scrapbook" value={name} onChange={(e)=>setName(e.target.value)} /><select value={bg} onChange={(e)=>setBg(e.target.value)}>{bgOptions.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select><select value={template} onChange={(e)=>setTemplate(e.target.value)}><option value="myLife">My Life - Free</option><option value="blank">Blank - Free</option><option value="memory">Memory Book - Free</option><option value="boy">Baby Boy - Premium</option><option value="girl">Baby Girl - Premium</option></select><button className="primary" onClick={()=>{let pages = template === "boy" ? babyTemplate("boy") : template === "girl" ? babyTemplate("girl") : template === "blank" ? [page(bg, [])] : myLifeTemplate(bg); createBook(name || "Untitled Scrapbook", bg, pages)}}>Create Scrapbook</button></section></main>
}

function Preview({ book }) { const els = book.pages?.[0]?.elements || []; return <>{els.slice(0,4).map(el => <span key={el.id} className={`pv ${el.type}`} style={{left:el.x+"%",top:el.y+"%",width:el.w+"%",height:el.h+"%",transform:`rotate(${el.rotate||0}deg)`}}>{el.type==="text"?el.text:el.type==="sticker"?el.text:""}</span>)}</> }

function Editor({ book, pageIndex, setPageIndex, saveBook, setScreen }) {
  const [selected, setSelected] = useState(null), [popup, setPopup] = useState(null), pageRef = useRef(null);
  const cur = book.pages[pageIndex];
  useEffect(()=>{function key(e){ if((e.key==="Delete"||e.key==="Backspace")&&selected&&!/[INPUT|TEXTAREA]/.test(document.activeElement.tagName)){ remove(selected); }} window.addEventListener("keydown",key); return()=>window.removeEventListener("keydown",key)},[selected,book,pageIndex]);
  function mutate(fn){ const nb={...book,pages:book.pages.map((p,i)=>i===pageIndex?{...p,elements:[...p.elements]}:p)}; fn(nb.pages[pageIndex],nb); saveBook(nb); }
  function update(id, patch){ mutate(p=>p.elements=p.elements.map(e=>e.id===id?{...e,...patch}:e)); }
  function remove(id){ mutate(p=>p.elements=p.elements.filter(e=>e.id!==id)); setSelected(null); }
  function dup(el){ mutate(p=>p.elements.push({...el,id:uid(),x:el.x+4,y:el.y+4})); }
  async function upload(e,id){ const f=e.target.files?.[0]; if(!f)return; const r=ref(storage,`users/${auth.currentUser.uid}/photos/${Date.now()}-${f.name}`); await uploadBytes(r,f); update(id,{src:await getDownloadURL(r)}); }
  function addPhoto(){ mutate(p=>p.elements.push(photoBox(20,20,50,40))); }
  function addText(){ mutate(p=>p.elements.push(textEl("New text",25,25,40,10,22))); }
  function moveStart(ev, el){ ev.stopPropagation(); const startX=ev.clientX, startY=ev.clientY, sx=el.x, sy=el.y; const rect=pageRef.current.getBoundingClientRect(); function mm(e){ update(el.id,{x:Math.max(0,Math.min(90,sx+((e.clientX-startX)/rect.width)*100)),y:Math.max(0,Math.min(90,sy+((e.clientY-startY)/rect.height)*100))}); } function up(){window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",up)} window.addEventListener("mousemove",mm);window.addEventListener("mouseup",up); }
  return <main className="editor"><div ref={pageRef} className={`scrapPage ${cur.bg}`} onClick={()=>setSelected(null)}>{cur.elements.map(el=><div key={el.id} className={`el ${selected===el.id?"selected":""}`} style={{left:el.x+"%",top:el.y+"%",width:el.w+"%",height:el.h+"%",transform:`rotate(${el.rotate||0}deg)`}} onMouseDown={(e)=>moveStart(e,el)} onClick={(e)=>{e.stopPropagation();setSelected(el.id)}}>{el.type==="photo"&&(el.src?<img src={el.src}/>:<label className="uploadLabel">Upload Photo<input type="file" accept="image/*" hidden onChange={(e)=>upload(e,el.id)}/></label>)}{el.type==="text"&&<textarea value={el.text} style={{fontSize:el.size}} onChange={(e)=>update(el.id,{text:e.target.value})}/>} {el.type==="sticker"&&<div className="sticker">{el.text}</div>} {selected===el.id&&<div className="miniControls"><button onClick={()=>update(el.id,{rotate:(el.rotate||0)+10})}>↻</button><button onClick={()=>update(el.id,{w:el.w+4,h:el.h+4})}>＋</button><button onClick={()=>update(el.id,{w:Math.max(6,el.w-4),h:Math.max(6,el.h-4)})}>−</button><button onClick={()=>dup(el)}>⧉</button><button onClick={()=>remove(el.id)}>🗑</button></div>}</div>)}</div><div className="pageNav"><button disabled={pageIndex===0} onClick={()=>setPageIndex(pageIndex-1)}>Prev</button><span>Page {pageIndex+1} of {book.pages.length}</span><button disabled={pageIndex===book.pages.length-1} onClick={()=>setPageIndex(pageIndex+1)}>Next</button></div><div className="bottomBar"><button onClick={()=>setScreen("home")}>Back</button><button onClick={addText}>Text</button><button onClick={addPhoto}>Photo</button><button onClick={()=>setPopup(popup==="stickers"?null:"stickers")}>Stickers</button><button onClick={()=>setPopup(popup==="bg"?null:"bg")}>Backgrounds</button><button onClick={()=>mutate((p,nb)=>nb.pages.push(page("cream",[])))}>Page</button><button onClick={()=>setScreen("flipbook")}>Flipbook</button></div>{popup&&<div className="sheet">{popup==="stickers"?stickers.map(s=><button key={s} onClick={()=>{mutate(p=>p.elements.push(stickerEl(s,30,30)));setPopup(null)}}>{s}</button>):bgOptions.map(b=><button key={b.id} onClick={()=>{mutate(p=>p.bg=b.id);setPopup(null)}}>{b.name}</button>)}</div>}</main>;
}

function Flipbook({ book, pageIndex, setPageIndex, setScreen, deleteBook }) { const [menu,setMenu]=useState(false); const p=book.pages[pageIndex]; return <main className="page flip"><button onClick={()=>setScreen("home")}>Back</button><button className="dots fixed" onClick={()=>setMenu(!menu)}>⋯</button>{menu&&<div className="flipMenu"><button onClick={()=>setScreen("editor")}>Edit</button><button onClick={()=>alert("Export coming soon")}>Export</button><button onClick={()=>{const n=prompt("Rename scrapbook",book.name); if(n) updateDoc(doc(db,"users",auth.currentUser.uid,"scrapbooks",book.id),{name:n});}}>Rename</button><button onClick={()=>deleteBook(book)}>Delete</button></div>}<div className={`scrapPage flipPage ${p.bg}`}><Preview book={{pages:[p]}} /></div><div className="pageNav"><button disabled={pageIndex===0} onClick={()=>setPageIndex(pageIndex-1)}>Prev</button><span>{pageIndex+1}/{book.pages.length}</span><button disabled={pageIndex===book.pages.length-1} onClick={()=>setPageIndex(pageIndex+1)}>Next</button></div></main> }
function Premium({ profile }) { return <main className="page"><h1>Premium</h1><p>Your plan: {profile.subscription || "Free"}</p><table><tbody><tr><th>Feature</th><th>Free</th><th>Premium</th></tr><tr><td>My First Scrapbook</td><td>✓</td><td>✓</td></tr><tr><td>Baby templates</td><td>99¢ each</td><td>✓</td></tr><tr><td>Photo uploads</td><td>15</td><td>Unlimited</td></tr><tr><td>Advanced text effects</td><td>—</td><td>✓</td></tr></tbody></table><button className="primary">Upgrade $4.99/mo</button><p className="hint">Payments need Stripe before real charging works.</p></main> }
function Profile({ user, profile }) { const [name,setName]=useState(profile.name||""), [email,setEmail]=useState(user.email||""), [pass,setPass]=useState(""); async function pic(e){const f=e.target.files?.[0]; if(!f)return; const r=ref(storage,`users/${user.uid}/profile-${Date.now()}-${f.name}`); await uploadBytes(r,f); const url=await getDownloadURL(r); await updateProfile(user,{photoURL:url}); await updateDoc(doc(db,"users",user.uid),{photoURL:url});} return <main className="page profile"><h1>Profile</h1><label className="avatar"><img src={profile.photoURL||user.photoURL||"https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=200"}/><input type="file" hidden accept="image/*" onChange={pic}/></label><input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name"/><button onClick={async()=>{await updateProfile(user,{displayName:name}); await updateDoc(doc(db,"users",user.uid),{name});}}>Save Name</button><h2>Settings</h2><label className="toggle">Dark theme <input type="checkbox" checked={!!profile.dark} onChange={(e)=>updateDoc(doc(db,"users",user.uid),{dark:e.target.checked})}/></label><input value={email} onChange={(e)=>setEmail(e.target.value)} /><button onClick={()=>updateEmail(user,email)}>Update Email</button><input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} placeholder="New password"/><button onClick={()=>pass&&updatePassword(user,pass)}>Update Password</button><p>Subscription: {profile.subscription || "Free"}</p><button>Change/Cancel Subscription</button><button className="danger" onClick={()=>signOut(auth)}>Logout</button></main> }

createRoot(document.getElementById("root")).render(<App />);
