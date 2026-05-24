import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { auth, db, storage } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./style.css";

const sampleBooks = [
  { title: "Summer Memories ☀️", pages: 18, img: "🌅", updated: "Updated 2 days ago" },
  { title: "Baby Aria 🎀", pages: 24, img: "💐", updated: "Updated 1 week ago" },
  { title: "Italy Trip 🇮🇹", pages: 32, img: "🇮🇹", updated: "Updated 3 weeks ago" },
];

function App() {
  const [page, setPage] = useState("welcome");
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState("");
  const [books, setBooks] = useState([]);
  const [photo, setPhoto] = useState("");

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 5000);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setPage("home");
        try {
          const q = query(collection(db, "scrapbooks"), where("uid", "==", u.uid), orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (e) {
          console.error(e);
          flash("Signed in, but books could not load: " + e.message);
        }
      } else {
        setPage("welcome");
      }
    });
    return unsub;
  }, []);

  const go = (p) => setPage(p);

  return (
    <main className="appShell">
      <section className="phone">
        {toast && <div className="toast">{toast}</div>}
        {page === "welcome" && <Welcome go={go} />}
        {page === "login" && <Login go={go} flash={flash} />}
        {page === "signup" && <Signup go={go} flash={flash} />}
        {page === "forgot" && <Forgot go={go} flash={flash} />}
        {page === "home" && <Home go={go} books={books} />}
        {page === "create" && <Create go={go} flash={flash} user={user} setBooks={setBooks} />}
        {page === "editor" && <Editor go={go} flash={flash} user={user} photo={photo} setPhoto={setPhoto} setBooks={setBooks} />}
        {page === "stickers" && <Stickers go={go} />}
        {page === "templates" && <Templates go={go} />}
        {page === "mybooks" && <MyBooks go={go} books={books} />}
        {page === "flipbook" && <Flipbook go={go} />}
        {page === "export" && <Export go={go} flash={flash} />}
        {page === "profile" && <Profile go={go} user={user} books={books} />}
      </section>
    </main>
  );
}

function Welcome({ go }) {
  return (
    <div className="screen center paper">
      <div className="logo bounce">
        💗 Pocket Scrapbook
      </div>

      <h1>
        Turn your memories into beautiful stories
      </h1>

      <p className="muted">
  Save your sweetest memories, photos, milestones, and moments in one magical scrapbook.
</p>

      <div className="hero">
        🌼 🖼️ 🦋
      </div>

     <button
  className="hero-btn"
  onClick={() => go("signup")}
>
  ✨ Start Scrapbooking
</button>

      <button
        className="secondary"
        onClick={() => go("login")}
      >
        Login
      </button>
    </div>
  );
}

function Login({ go, flash }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  async function submit() {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      flash("Logged in!");
      go("home");
    } catch (e) {
      console.error(e);
      flash("Login error: " + e.message);
    }
  }
  
return (
  <Phone>
    <div className="auth-page">

      <div className="auth-logo">
        💖 Pocket Scrapbook
      </div>

      <h1>
        {mode === "login"
          ? "Welcome Back ✨"
          : "Create Your Scrapbook 💕"}
      </h1>

      <p className="auth-sub">
        Save memories, photos, milestones, and magical moments.
      </p>

      <div className="auth-card">

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button onClick={submit}>
          {mode === "login"
            ? "Login ✨"
            : "Create Account 💖"}
        </button>

      </div>

      <button
        className="text-btn"
        onClick={() =>
          go(mode === "login" ? "signup" : "login")
        }
      >
        {mode === "login"
          ? "Need an account?"
          : "Already have one?"}
      </button>

    </div>
  </Phone>
)
}

function Signup({ go, flash }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function submit() {
    try {
      if (!name || !username || !email || !password) throw new Error("Fill in every field.");
      if (password.length < 6) throw new Error("Password needs at least 6 characters.");
      if (password !== confirm) throw new Error("Passwords do not match.");

      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name });

      await addDoc(collection(db, "profiles"), {
        uid: cred.user.uid,
        name,
        username,
        email: email.trim(),
        createdAt: serverTimestamp(),
      });

      flash("Account created!");
      go("home");
    } catch (e) {
      flash("Signup error: " + e.message);
    }
  }

  return (
    <main className="signup-page">
      <section className="signup-brand">
        <div className="flower-corner">🌸</div>
        <h1>Pocket <span>Scrapbook</span></h1>
        <p className="tagline">Turn your memories into beautiful stories 💖</p>
        <p className="script">Cherish. Create. Remember.</p>

        <div className="polaroid-stack">
          <div className="tape">♡</div>
          <div className="photo">🌅</div>
        </div>

        <div className="feature-paper">
          <p>📖 Beautiful scrapbooks</p>
          <p>⭐ Stickers, fonts & templates</p>
          <p>☁️ Save & share your stories anywhere</p>
        </div>
      </section>

      <section className="signup-card">
        <div className="heart-badge">💗</div>
        <h2>Create your account</h2>
        <p>Join Pocket Scrapbook and start preserving your memories ✨</p>

        <label className="pretty-input">👤
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" />
        </label>

        <label className="pretty-input">@ 
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
        </label>

        <label className="pretty-input">💌
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        </label>

        <label className="pretty-input">🔒
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        </label>

        <label className="pretty-input">🔐
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm Password" />
        </label>

        <div className="password-tips">
          <p>♡ At least 6 characters</p>
          <p>♡ Passwords must match</p>
        </div>

        <button className="create-account-btn" onClick={submit}>✨ Create Account</button>

        <div className="or-line"><span>or</span></div>

        <button className="google-btn">🌈 Continue with Google</button>

        <p className="login-note">
          Already have an account? <button onClick={() => go("login")}>Log in</button>
        </p>
      </section>
    </main>
  );
}

function Forgot({ go, flash }) {
  const [email, setEmail] = useState("");
  async function reset() {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      flash("Reset email sent!");
      go("login");
    } catch (e) {
      flash("Reset error: " + e.message);
    }
  }
  return <FormPage title="Forgot Password" go={go}>
    <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
    <button onClick={reset}>Send Reset Link</button>
  </FormPage>;
}

function FormPage({ title, children, go }) {
  return <div className="screen paper">
    <button className="iconBtn" onClick={() => go("welcome")}>‹</button>
    <h2>{title}</h2>
    <div className="formCard">{children}</div>
  </div>;
}

function Home({ go, books }) {
  const allBooks = books.length ? books : sampleBooks;
  return <div className="screen paper">
    <Top />
    <div className="brand">Pocket<span>Scrapbook</span></div>
    <h3>Turn your memories into beautiful stories 💗</h3>
    <div className="hero">🌼 🖼️ 🦋</div>
    <button className="createCard" onClick={() => go("create")}><b>＋ Create New Scrapbook</b><small>Start a new scrapbook</small></button>
    <div className="row"><h2>My Scrapbooks</h2><button className="link" onClick={() => go("mybooks")}>See All ›</button></div>
    {allBooks.map((b, i) => <div className="bookCard" key={i} onClick={() => go("flipbook")}><div className="thumb">{b.coverUrl ? <img src={b.coverUrl} /> : b.img}</div><div><b>{b.title}</b><p>{b.updated || "Saved just now"}</p></div><b>{b.pages || 1} Pages</b></div>)}
    <div className="shortcuts"><button onClick={() => go("templates")}>📖<br/>Templates</button><button onClick={() => go("stickers")}>🏷️<br/>Stickers</button><button>𝑇<br/>Fonts</button><button onClick={() => go("editor")}>🖼️<br/>Backgrounds</button></div>
    <Bottom go={go} active="home" />
  </div>;
}

function Top(){return <div className="top"><button className="iconBtn">☰</button><button className="iconBtn">♕</button><button className="iconBtn">♧</button></div>}
function Bottom({go,active}){return <nav className="bottom"><button onClick={()=>go("home")}>🏠<br/>Home</button><button onClick={()=>go("mybooks")}>📖<br/>My Books</button><button className="plus" onClick={()=>go("create")}>＋</button><button onClick={()=>go("templates")}>▦<br/>Templates</button><button onClick={()=>go("profile")}>♡<br/>Profile</button></nav>}

function Create({ go, flash, user, setBooks }) {
  const [title,setTitle]=useState("");
  async function create(){
    if(!user){ flash("Please sign up or login first."); go("signup"); return; }
    try{
      const doc = await addDoc(collection(db,"scrapbooks"),{uid:user.uid,title:title || "Untitled Scrapbook",pages:1,createdAt:serverTimestamp(),updated:"Saved just now",img:"📔"});
      setBooks((old)=>[{id:doc.id,title:title||"Untitled Scrapbook",pages:1,updated:"Saved just now",img:"📔"},...old]);
      flash("Scrapbook created!");
      go("editor");
    }catch(e){flash("Create error: "+e.message)}
  }
  return <div className="screen paper"><button className="iconBtn" onClick={()=>go("home")}>‹</button><h2>Create Scrapbook</h2><div className="formCard"><input placeholder="Scrapbook title" value={title} onChange={e=>setTitle(e.target.value)}/><select><option>Blush Summer</option><option>Baby Book</option><option>Travel</option></select><button onClick={create}>Create Scrapbook</button></div></div>
}

function Editor({go, flash, user, photo, setPhoto, setBooks}) {
  async function upload(e){
    const file=e.target.files?.[0]; if(!file)return;
    if(!user){flash("Please sign up/login before uploading.");go("signup");return;}
    try{
      const r=ref(storage,`users/${user.uid}/photos/${Date.now()}-${file.name}`);
      await uploadBytes(r,file);
      const url=await getDownloadURL(r);
      setPhoto(url);
      flash("Photo uploaded!");
    }catch(err){flash("Upload error: "+err.message)}
  }
  async function save(){
    if(!user){flash("Please sign up/login first.");go("signup");return;}
    try{
      await addDoc(collection(db,"scrapbooks"),{uid:user.uid,title:"Saved Scrapbook",pages:4,coverUrl:photo || "",updated:"Saved just now",createdAt:serverTimestamp()});
      setBooks((old)=>[{title:"Saved Scrapbook",pages:4,coverUrl:photo,updated:"Saved just now"},...old]);
      flash("Saved to Firebase!");
    }catch(e){flash("Save error: "+e.message)}
  }
  return <div className="screen paper"><div className="top"><button className="iconBtn" onClick={()=>go("home")}>‹</button><b>Page 4 / 16</b><button onClick={save}>Save</button></div><div className="canvas">{photo?<img className="photo" src={photo}/>:<div className="note">Good times<br/><small>& tan lines ♡</small></div>}<div className="sticker">🌼</div><div className="tape">pink tape</div></div><div className="tools"><label>📷 Photo<input type="file" accept="image/*" hidden onChange={upload}/></label><button onClick={()=>go("stickers")}>🏷️ Sticker</button><button>𝑇 Text</button><button>🎨 Background</button><button>🖊️ Doodle</button></div><div className="tools"><button>Layers</button><button>Delete</button><button>Duplicate</button><button>Forward</button><button>Backward</button></div></div>
}
function Stickers({go}){return <div className="screen paper"><button className="iconBtn" onClick={()=>go("editor")}>×</button><h2>Stickers</h2><div className="chips"><span>All</span><span>Aesthetic</span><span>Love</span><span>Travel</span></div><div className="grid">{["💗","🌼","🎀","🦋","✈️","📷","🍃","♡","🖼️"].map(x=><button onClick={()=>go("editor")} className="stickerBtn">{x}</button>)}</div></div>}
function Templates({go}){return <div className="screen paper"><button className="iconBtn" onClick={()=>go("home")}>‹</button><h2>Templates</h2><div className="grid">{["Baby Book","Wedding","Travel","Memory Book","Seasonal","Summer"].map(t=><div className="template"><div>📖</div><b>{t}</b><button onClick={()=>go("create")}>Use Template</button></div>)}</div></div>}
function MyBooks({go,books}){return <div className="screen paper"><button className="iconBtn" onClick={()=>go("home")}>‹</button><h2>My Scrapbooks</h2><input placeholder="Search"/>{(books.length?books:sampleBooks).map((b,i)=><div className="bookCard" onClick={()=>go("flipbook")}><div className="thumb">{b.coverUrl?<img src={b.coverUrl}/>:b.img}</div><b>{b.title}</b><button onClick={(e)=>{e.stopPropagation();go("editor")}}>Edit</button></div>)}</div>}
function Flipbook({go}){const [p,setP]=useState(0);return <div className="screen desk"><button className="iconBtn" onClick={()=>go("home")}>‹</button><h2>My Summer Book</h2><p>16 pages</p><div className="book"><div className="page">Sunsets are proof endings can be beautiful ♡</div><div className="page">🌴<br/>grateful for this</div></div><div className="controls"><button onClick={()=>setP(Math.max(0,p-1))}>←</button><b>{p+1}-{p+2}/16</b><button onClick={()=>setP(p+1)}>→</button></div><button onClick={()=>go("export")}>Print / Export</button></div>}
function Export({go,flash}){return <div className="screen paper"><button className="iconBtn" onClick={()=>go("home")}>‹</button><h2>Print / Export</h2><div className="cover">My Summer Book<br/>🖼️ 🌼</div>{["PDF High Quality","Image JPG","Share Link","Digital Flipbook","Order Printed Book","Print at Home"].map(o=><button className="option" onClick={()=>flash(o+" selected")}>{o} ›</button>)}</div>}
function Profile({go,user,books}){return <div className="screen paper"><button className="iconBtn" onClick={()=>go("home")}>‹</button><h2>Profile</h2><div className="avatar">👩🏻</div><h2>{user?.displayName || "@pocketscrapbook"}</h2><h3>{user?.email || "Not logged in"}</h3><div className="formCard"><p>Scrapbooks <b>{books.length}</b></p><p>Pages created <b>{books.length*4}</b></p><p>Notifications ✅</p></div>{user?<button onClick={()=>signOut(auth)}>Logout</button>:<button onClick={()=>go("login")}>Login</button>}</div>}

createRoot(document.getElementById("root")).render(<App />);
