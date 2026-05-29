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

const id = () =>
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

function textEl(text, x, y, w, h, size = 22, rotate = 0) {
  return { id: id(), type: "text", text, x, y, w, h, size, rotate };
}
function photoEl(x, y, w, h, rotate = 0, src = "") {
  return { id: id(), type: "photo", src, x, y, w, h, rotate };
}
function stickerEl(text, x, y, w = 12, h = 12, rotate = 0) {
  return { id: id(), type: "sticker", text, x, y, w, h, rotate };
}
function makePage(bg = "cream", elements = []) {
  return { id: id(), bg, elements };
}

function myLifeTemplate(bg = "cream") {
  return [
    makePage(bg, [
      textEl("pocket scrapbook", 17, 10, 66, 10, 24),
      textEl("my story ♡", 22, 24, 55, 9, 22),
      photoEl(12, 42, 34, 36, -4),
      textEl("about me", 54, 43, 32, 12, 18, 2),
      stickerEl("🌿", 68, 61, 13, 13, -8),
    ]),
    makePage(bg, [
      textEl("my family", 10, 10, 45, 10, 28),
      photoEl(9, 28, 38, 35, -3),
      photoEl(52, 32, 34, 30, 4),
      textEl("people I love", 28, 72, 45, 10, 20),
    ]),
    makePage(bg, [
      textEl("places I've been", 8, 10, 70, 10, 25),
      photoEl(13, 28, 34, 35, 3),
      photoEl(50, 22, 35, 38, -2),
      stickerEl("✈", 75, 70),
      textEl("adventure notes", 20, 72, 50, 10, 18),
    ]),
  ];
}

function blankTemplate(bg = "cream") {
  return [makePage(bg, [])];
}

function memoryTemplate(bg = "lavender") {
  return [
    makePage(bg, [textEl("memories", 20, 12, 60, 12, 30), photoEl(12, 32, 34, 36, -4), photoEl(52, 30, 34, 38, 3), textEl("favorite little moments", 22, 74, 58, 10, 18)]),
    makePage(bg, [textEl("today was...", 12, 12, 60, 10, 26), photoEl(16, 30, 68, 42), textEl("write a note here ♡", 18, 76, 55, 10, 18)]),
  ];
}

function babyTemplate(kind = "girl") {
  const girl = kind === "girl";
  const bg = girl ? "babyPink" : "babyBlue";
  const label = girl ? "baby girl" : "baby boy";
  return Array.from({ length: 13 }).map((_, i) => {
    if (i === 0) {
      return makePage(bg, [
        textEl("baby's\nfirst year", 9, 11, 42, 18, 28, -2),
        photoEl(10, 40, 30, 34, -4),
        photoEl(51, 35, 26, 28, 5),
        textEl(label + " ♡", 51, 68, 34, 10, 18),
        stickerEl(girl ? "🎀" : "🧸", 72, 14),
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

const templateOptions = [
  { key: "life", title: "Pocket Scrapbook", tag: "Free", bg: "cream", maker: (bg) => myLifeTemplate(bg) },
  { key: "blank", title: "Blank Book", tag: "Free", bg: "paper", maker: (bg) => blankTemplate(bg) },
  { key: "memory", title: "Memory Book", tag: "Free", bg: "lavender", maker: () => memoryTemplate("lavender") },
  { key: "boy", title: "Baby Boy", tag: "Premium", bg: "babyBlue", maker: () => babyTemplate("boy") },
  { key: "girl", title: "Baby Girl", tag: "Premium", bg: "babyPink", maker: () => babyTemplate("girl") },
];

function Toast({ toast, clearToast }) {
  if (!toast) return null;
  return (
    <div className="toast" onClick={clearToast}>
      <div className="tape" />
      <p>{toast}</p>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [books, setBooks] = useState([]);
  const [screen, setScreen] = useState("loading");
  const [activeBook, setActiveBook] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [toast, setToast] = useState("");

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setScreen("auth");
        setBooks([]);
        setProfile({});
        return;
      }
      const profileRef = doc(db, "users", currentUser.uid);
      await setDoc(
        profileRef,
        {
          name: currentUser.displayName || "",
          email: currentUser.email || "",
          photoURL: currentUser.photoURL || "",
          subscription: "Free",
          uploadsUsed: 0,
          uploadLimit: 15,
          dark: false,
        },
        { merge: true }
      );
      const unsubProfile = onSnapshot(profileRef, (snap) => setProfile(snap.data() || {}));
      const q = query(collection(db, "users", currentUser.uid, "scrapbooks"), orderBy("updatedAt", "desc"));
      const unsubBooks = onSnapshot(q, (snap) => setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
      setScreen("home");
      return () => {
        unsubProfile();
        unsubBooks();
      };
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", Boolean(profile?.dark));
  }, [profile?.dark]);

  async function saveBook(book) {
    if (!user || !book?.id) return;
    setActiveBook(book);
    await updateDoc(doc(db, "users", user.uid, "scrapbooks", book.id), {
      ...book,
      updatedAt: serverTimestamp(),
    });
  }

  async function createBook(name, pages, paidOnly = false) {
    if (!user) return;
    const data = {
      name: name || "Untitled Scrapbook",
      pages,
      paidOnly,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const refDoc = await addDoc(collection(db, "users", user.uid, "scrapbooks"), data);
    setActiveBook({ ...data, id: refDoc.id });
    setPageIndex(0);
    setScreen("editor");
    showToast("Scrapbook created ♡");
  }

  async function deleteBook(book) {
    if (!user || !book) return;
    const ok = window.confirm(`Are you sure you want to delete “${book.name}”?`);
    if (!ok) return;
    await deleteDoc(doc(db, "users", user.uid, "scrapbooks", book.id));
    setScreen("home");
    showToast("Scrapbook deleted");
  }

  function openBook(book, flip = false) {
    setActiveBook(book);
    setPageIndex(0);
    setScreen(flip ? "flipbook" : "editor");
  }

  if (screen === "loading") return <div className="phoneShell loading">Loading...</div>;
  if (!user) return <Auth showToast={showToast} />;

  return (
    <div className="phoneShell">
      <Toast toast={toast} clearToast={() => setToast("")} />
      {screen !== "editor" && screen !== "flipbook" && (
        <TopNav current={screen} setScreen={setScreen} />
      )}
      {screen === "home" && (
        <Home books={books} openBook={openBook} setScreen={setScreen} />
      )}
      {screen === "create" && (
        <CreateBook createBook={createBook} setScreen={setScreen} books={books} />
      )}
      {screen === "templates" && (
        <Templates createBook={createBook} setScreen={setScreen} />
      )}
      {screen === "editor" && activeBook && (
        <Editor
          book={activeBook}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          saveBook={saveBook}
          setScreen={setScreen}
          showToast={showToast}
        />
      )}
      {screen === "flipbook" && activeBook && (
        <Flipbook
          book={activeBook}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          setScreen={setScreen}
          saveBook={saveBook}
          deleteBook={deleteBook}
          showToast={showToast}
        />
      )}
      {screen === "premium" && <Premium profile={profile} />}
      {screen === "profile" && <Profile user={user} profile={profile} showToast={showToast} />}
      {screen !== "editor" && screen !== "flipbook" && (
        <BottomNav current={screen} setScreen={setScreen} />
      )}
    </div>
  );
}

function TopNav({ current, setScreen }) {
  return (
    <header className="topHeader">
      <button className="iconBtn" onClick={() => setScreen("home")} aria-label="home">⌂</button>
      <div className="smallBrand">
        <span>pocket</span>
        <strong>SCRAPBOOK</strong>
      </div>
      <button className="iconBtn" onClick={() => setScreen("profile")} aria-label="profile">♡</button>
    </header>
  );
}

function BottomNav({ current, setScreen }) {
  return (
    <nav className="bottomNav">
      <button className={current === "home" ? "active" : ""} onClick={() => setScreen("home")}><span>⌂</span>Home</button>
      <button className={current === "templates" ? "active" : ""} onClick={() => setScreen("templates")}><span>▧</span>Templates</button>
      <button className="plus" onClick={() => setScreen("create")}><span>＋</span></button>
      <button className={current === "premium" ? "active" : ""} onClick={() => setScreen("premium")}><span>♡</span>Premium</button>
      <button className={current === "profile" ? "active" : ""} onClick={() => setScreen("profile")}><span>♙</span>Profile</button>
    </nav>
  );
}

function Auth({ showToast }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
      showToast(mode === "login" ? "Welcome back ♡" : "Account created ♡");
    } catch (err) {
      setError(err.message);
    }
  }

  async function forgotPassword() {
    if (!email) {
      setError("Type your email first, then tap forgot password.");
      return;
    }
    await sendPasswordResetEmail(auth, email);
    showToast("Password reset email sent ♡");
  }

  return (
    <main className="authPage">
      <Toast toast={error} clearToast={() => setError("")} />
      <div className="authDecor decorLeft" />
      <div className="authDecor decorRight" />
      <section className="authHero">
        <div className="bookBadge">♡</div>
        <p className="script">pocket</p>
        <h1>SCRAPBOOK</h1>
        <p className="tagline">Capture your story. Cherish every moment.</p>
      </section>
      <form className="authCard" onSubmit={submit}>
        <div className="tape" />
        <h2>{mode === "login" ? "Welcome back ♡" : "Create account ♡"}</h2>
        <label>Email address</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label>Password</label>
        <div className="passwordLine">
          <input value={password} onChange={(e) => setPassword(e.target.value)} type={show ? "text" : "password"} required />
          <button type="button" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
        </div>
        {mode === "login" && <button type="button" className="tinyLink" onClick={forgotPassword}>Forgot password?</button>}
        <button className="primaryBtn" type="submit">{mode === "login" ? "Log In" : "Create Account"}</button>
        <p className="switchLine">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account ♡" : "Log in ♡"}</button>
        </p>
      </form>
    </main>
  );
}

function Home({ books, openBook, setScreen }) {
  const recent = books.slice(0, 4);
  return (
    <main className="page homePage">
      <section className="welcomeBlock">
        <div>
          <h1>Welcome back ♡</h1>
          <p>Every story matters.<br />What will you capture today?</p>
        </div>
        <div className="heroPolaroid" />
      </section>

      <section className="quickGrid">
        <button onClick={() => setScreen("create")}><span>＋</span><b>New Scrapbook</b><small>Start a new chapter</small></button>
        <button onClick={() => document.getElementById("my-books")?.scrollIntoView({ behavior: "smooth" })}><span>📖</span><b>My Scrapbooks</b><small>View and manage</small></button>
        <button onClick={() => setScreen("create")}><span>🖼</span><b>Add Memory</b><small>Add photos and notes</small></button>
        <button onClick={() => setScreen("templates")}><span>🏷</span><b>Templates</b><small>Browse designs</small></button>
      </section>

      <div className="sectionTitle" id="my-books"><h2>My Scrapbooks</h2></div>
      <section className="bookShelf">
        {books.length === 0 && <div className="emptyNote"><div className="tape" />Create your first scrapbook ♡</div>}
        {books.map((book) => <BookCard key={book.id} book={book} onOpen={() => openBook(book)} />)}
      </section>

      <div className="sectionTitle"><h2>Recent Memories</h2></div>
      <section className="recentStrip">
        {recent.length === 0 ? [1,2,3,4].map((n) => <div className="memoryThumb" key={n} />) : recent.map((book) => <div key={book.id} className="memoryThumb"><Preview book={book} /></div>)}
      </section>
    </main>
  );
}

function BookCard({ book, onOpen }) {
  const [menu, setMenu] = useState(false);
  return (
    <article className="bookCover" onClick={onOpen}>
      <div className="bookPreview"><Preview book={book} /></div>
      <button className="dotsBtn" onClick={(e) => { e.stopPropagation(); setMenu(!menu); }}>⋮</button>
      {menu && (
        <div className="paperPopup cardPopup" onClick={(e) => e.stopPropagation()}>
          <div className="tape" />
          <button onClick={onOpen}>Edit</button>
          <button onClick={() => alert("Export coming soon")}>Export</button>
          <button onClick={() => alert("Rename coming soon")}>Rename</button>
        </div>
      )}
      <h3>{book.name}</h3>
      <p>{book.pages?.length || 1} page(s)</p>
    </article>
  );
}

function CreateBook({ createBook, setScreen, books }) {
  const [name, setName] = useState("");
  const [bg, setBg] = useState("cream");
  const [template, setTemplate] = useState("life");
  const freeSlotsUsed = books.length;
  const option = templateOptions.find((t) => t.key === template) || templateOptions[0];
  const freeLimitReached = freeSlotsUsed >= 3 && option.tag === "Free";

  function handleCreate() {
    if (freeLimitReached) {
      alert("Free version includes 3 free scrapbooks. Upgrade to monthly premium for more.");
      return;
    }
    const pages = option.maker(bg || option.bg);
    createBook(name || option.title, pages, option.tag === "Premium");
  }

  return (
    <main className="page createPage">
      <button className="plainBack" onClick={() => setScreen("home")}>← Home</button>
      <section className="paperCard createCard">
        <div className="tape" />
        <h1>Create a scrapbook</h1>
        <label>Name</label>
        <input placeholder="Scrapbook name" value={name} onChange={(e) => setName(e.target.value)} />
        <label>Background</label>
        <select value={bg} onChange={(e) => setBg(e.target.value)}>{bgOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        <label>Template</label>
        <select value={template} onChange={(e) => setTemplate(e.target.value)}>{templateOptions.map((t) => <option key={t.key} value={t.key}>{t.title} - {t.tag}</option>)}</select>
        <button className="primaryBtn" onClick={handleCreate}>Create Scrapbook</button>
        <p className="hint">Free version includes 3 scrapbooks. Premium unlocks more.</p>
      </section>
    </main>
  );
}

function Templates({ createBook, setScreen }) {
  return (
    <main className="page templatesPage">
      <div className="sectionTitle"><h1>Templates</h1></div>
      <section className="templateShelf">
        {templateOptions.map((t) => (
          <button key={t.key} className="templateCard" onClick={() => createBook(t.title, t.maker(t.bg), t.tag === "Premium")}>
            <div className={`templatePreview ${t.bg}`}><span>{t.title.toLowerCase()}</span></div>
            <b>{t.title}</b><small>{t.tag}</small>
          </button>
        ))}
      </section>
    </main>
  );
}

function Preview({ book }) {
  const page = book?.pages?.[0];
  const elements = page?.elements || [];
  return (
    <div className={`previewMini ${page?.bg || "cream"}`}>
      {elements.slice(0, 5).map((el) => (
        <span
          key={el.id}
          className={`pvEl ${el.type}`}
          style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`, transform: `rotate(${el.rotate || 0}deg)`, fontSize: `${Math.max(7, (el.size || 18) / 4)}px` }}
        >
          {el.type === "text" || el.type === "sticker" ? el.text : ""}
        </span>
      ))}
    </div>
  );
}

function Editor({ book, pageIndex, setPageIndex, saveBook, setScreen, showToast }) {
  const [selected, setSelected] = useState(null);
  const [sheet, setSheet] = useState(null);
  const pageRef = useRef(null);
  const page = book.pages?.[pageIndex] || makePage("cream", []);

  useEffect(() => {
    function keyHandler(e) {
      const tag = document.activeElement?.tagName;
      if ((e.key === "Delete" || e.key === "Backspace") && selected && tag !== "INPUT" && tag !== "TEXTAREA") {
        removeElement(selected);
      }
    }
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [selected, book, pageIndex]);

  function changeBook(fn) {
    const next = { ...book, pages: book.pages.map((p, i) => i === pageIndex ? { ...p, elements: [...(p.elements || [])] } : p) };
    fn(next.pages[pageIndex], next);
    saveBook(next);
  }
  function updateElement(elId, patch) {
    changeBook((p) => { p.elements = p.elements.map((el) => el.id === elId ? { ...el, ...patch } : el); });
  }
  function removeElement(elId) {
    changeBook((p) => { p.elements = p.elements.filter((el) => el.id !== elId); });
    setSelected(null);
  }
  async function uploadPhoto(e, elId) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileRef = ref(storage, `users/${auth.currentUser.uid}/photos/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      updateElement(elId, { src: url });
      showToast("Photo uploaded ♡");
    } catch (err) {
      showToast("Photo upload failed. Check Firebase Storage rules.");
    }
  }
  function startDrag(ev, el) {
    if (ev.target.tagName === "TEXTAREA" || ev.target.tagName === "INPUT") return;
    ev.stopPropagation();
    setSelected(el.id);
    const rect = pageRef.current.getBoundingClientRect();
    const startX = ev.clientX;
    const startY = ev.clientY;
    const originalX = el.x;
    const originalY = el.y;
    function move(e) {
      const dx = ((e.clientX - startX) / rect.width) * 100;
      const dy = ((e.clientY - startY) / rect.height) * 100;
      updateElement(el.id, { x: Math.max(0, Math.min(92, originalX + dx)), y: Math.max(0, Math.min(92, originalY + dy)) });
    }
    function stop() { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", stop); }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  }

  return (
    <main className="editorPage">
      <header className="editorTop">
        <button onClick={() => setScreen("home")}>⌂ Home</button>
        <strong>{book.name}</strong>
        <button onClick={() => setScreen("flipbook")}>Flipbook</button>
      </header>
      <div ref={pageRef} className={`scrapPage ${page.bg}`} onClick={() => setSelected(null)}>
        {page.elements.map((el) => (
          <div key={el.id} className={`editorEl ${selected === el.id ? "selected" : ""}`} style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`, transform: `rotate(${el.rotate || 0}deg)` }} onMouseDown={(e) => startDrag(e, el)} onClick={(e) => { e.stopPropagation(); setSelected(el.id); }}>
            {el.type === "photo" && (el.src ? <img src={el.src} alt="" /> : <label className="uploadBox">Upload Photo<input type="file" accept="image/*" hidden onChange={(e) => uploadPhoto(e, el.id)} /></label>)}
            {el.type === "text" && <textarea value={el.text} style={{ fontSize: el.size }} onChange={(e) => updateElement(el.id, { text: e.target.value })} />}
            {el.type === "sticker" && <div className="stickerText">{el.text}</div>}
            {selected === el.id && <div className="miniTools"><button onClick={() => updateElement(el.id, { rotate: (el.rotate || 0) + 10 })}>↻</button><button onClick={() => updateElement(el.id, { w: el.w + 4, h: el.h + 4 })}>＋</button><button onClick={() => updateElement(el.id, { w: Math.max(6, el.w - 4), h: Math.max(6, el.h - 4) })}>−</button><button onClick={() => changeBook((p) => p.elements.push({ ...el, id: id(), x: el.x + 4, y: el.y + 4 }))}>⧉</button><button onClick={() => removeElement(el.id)}>🗑</button></div>}
          </div>
        ))}
      </div>
      <div className="pageNav"><button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>Prev</button><span>Page {pageIndex + 1} of {book.pages.length}</span><button disabled={pageIndex >= book.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}>Next</button></div>
      <nav className="editorTools">
        <button onClick={() => changeBook((p) => p.elements.push(textEl("New text", 25, 25, 42, 10, 22))}>Text</button>
        <button onClick={() => changeBook((p) => p.elements.push(photoEl(20, 22, 52, 42)))}>Photo</button>
        <button onClick={() => setSheet(sheet === "stickers" ? null : "stickers")}>Stickers</button>
        <button onClick={() => setSheet(sheet === "backgrounds" ? null : "backgrounds")}>Backgrounds</button>
        <button onClick={() => changeBook((p, next) => next.pages.push(makePage("cream", [])))}>Page</button>
      </nav>
      {sheet && <div className="paperPopup editorSheet"><div className="tape" />{sheet === "stickers" ? stickers.map((s) => <button key={s} onClick={() => { changeBook((p) => p.elements.push(stickerEl(s, 30, 30))); setSheet(null); }}>{s}</button>) : bgOptions.map((b) => <button key={b.id} onClick={() => { changeBook((p) => { p.bg = b.id; }); setSheet(null); }}>{b.name}</button>)}</div>}
    </main>
  );
}

function Flipbook({ book, pageIndex, setPageIndex, setScreen, deleteBook }) {
  const [menu, setMenu] = useState(false);
  const page = book.pages?.[pageIndex] || makePage("cream", []);
  return (
    <main className="page flipPageScreen">
      <header className="editorTop"><button onClick={() => setScreen("home")}>⌂ Home</button><strong>{book.name}</strong><button onClick={() => setMenu(!menu)}>⋯</button></header>
      {menu && <div className="paperPopup flipPopup"><div className="tape" /><button onClick={() => setScreen("editor")}>Edit</button><button onClick={() => alert("Export coming soon")}>Export</button><button onClick={() => deleteBook(book)}>Delete</button></div>}
      <div className={`scrapPage flipBookPage ${page.bg}`}><Preview book={{ pages: [page] }} /></div>
      <div className="pageNav"><button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>Prev</button><span>{pageIndex + 1}/{book.pages.length}</span><button disabled={pageIndex >= book.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}>Next</button></div>
    </main>
  );
}

function Premium({ profile }) {
  return <main className="page"><section className="paperCard"><div className="tape" /><h1>Premium</h1><p>Your plan: {profile?.subscription || "Free"}</p><table><tbody><tr><th>Feature</th><th>Free</th><th>Premium</th></tr><tr><td>Free scrapbooks</td><td>3</td><td>Unlimited</td></tr><tr><td>Photo uploads</td><td>15</td><td>Unlimited</td></tr><tr><td>Baby templates</td><td>99¢ each</td><td>Included</td></tr><tr><td>Advanced text effects</td><td>—</td><td>Included</td></tr></tbody></table><button className="primaryBtn">Upgrade $4.99/mo</button><p className="hint">Real payments need Stripe connected later.</p></section></main>;
}

function Profile({ user, profile = {}, showToast }) {
  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");

  useEffect(() => { setName(profile?.name || ""); }, [profile?.name]);

  async function uploadProfile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileRef = ref(storage, `users/${user.uid}/profile/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await updateProfile(user, { photoURL: url });
      await updateDoc(doc(db, "users", user.uid), { photoURL: url });
      showToast("Profile photo updated ♡");
    } catch (err) {
      showToast("Upload failed. Check Firebase Storage rules.");
    }
  }

  return (
    <main className="page profilePage">
      <section className="paperCard profileCard">
        <div className="tape" />
        <h1>Profile</h1>
        <label className="avatar"><img src={profile?.photoURL || user?.photoURL || "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=300"} alt="profile" /><input type="file" hidden accept="image/*" onChange={uploadProfile} /></label>
        <label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={async () => { await updateProfile(user, { displayName: name }); await updateDoc(doc(db, "users", user.uid), { name }); showToast("Name saved ♡"); }}>Save Name</button>
        <label className="toggleRow">Dark theme <input type="checkbox" checked={Boolean(profile?.dark)} onChange={(e) => updateDoc(doc(db, "users", user.uid), { dark: e.target.checked })} /></label>
        <label>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} />
        <button onClick={() => updateEmail(user, email)}>Update Email</button>
        <label>New password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={() => password && updatePassword(user, password)}>Update Password</button>
        <p>Subscription: {profile?.subscription || "Free"}</p>
        <button className="dangerBtn" onClick={() => signOut(auth)}>Logout</button>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
