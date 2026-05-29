import React, { useEffect, useRef, useState } from "react";
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
  { id: "blank", name: "Blank Cream" },
  { id: "babyPink", name: "Baby Pink" },
  { id: "lavender", name: "Light Lavender" },
  { id: "babyBlue", name: "Baby Blue" },
];

const stickers = [
  "♡",
  "✿",
  "☆",
  "☁",
  "🧸",
  "🎀",
  "📷",
  "🌸",
  "🌿",
  "✨",
  "✈",
  "🏡",
  "🐾",
  "🎂",
  "☕",
  "📚",
  "🌙",
  "🦋",
];

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

function makePhoto(x, y, w, h, rotate = 0) {
  return { id: uid(), type: "photo", src: "", x, y, w, h, rotate };
}

function makeText(text, x, y, w, h, size = 24, rotate = 0) {
  return { id: uid(), type: "text", text, x, y, w, h, size, rotate };
}

function makeSticker(text, x, y, w = 12, h = 12, rotate = 0) {
  return { id: uid(), type: "sticker", text, x, y, w, h, rotate };
}

function makePage(bg = "cream", elements = []) {
  return { id: uid(), bg, elements };
}

function blankTemplate(bg = "cream") {
  return [makePage(bg, [])];
}

function memoryTemplate(bg = "paper") {
  return [
    makePage(bg, [
      makeText("favorite memories", 10, 9, 70, 10, 25, -1),
      makePhoto(12, 25, 34, 34, -3),
      makePhoto(53, 25, 32, 34, 4),
      makeText("write a little note here ♡", 18, 68, 64, 12, 17, 0),
      makeSticker("✨", 76, 12, 9, 9),
    ]),
    makePage(bg, [
      makeText("little moments", 12, 10, 60, 10, 24, 0),
      makePhoto(18, 28, 56, 40, 0),
      makeSticker("♡", 77, 70, 10, 10),
    ]),
  ];
}

function myLifeTemplate(bg = "cream") {
  return [
    makePage(bg, [
      makeText("my life", 30, 11, 40, 10, 34, 0),
      makeText("SCRAPBOOK", 17, 23, 66, 8, 28, 0),
      makePhoto(13, 42, 32, 36, -4),
      makeText("about me ♡", 54, 45, 33, 18, 18, 2),
      makeSticker("♡", 72, 12, 10, 10),
    ]),
    makePage(bg, [
      makeText("my family", 10, 10, 45, 10, 28),
      makePhoto(9, 28, 38, 35, -3),
      makePhoto(52, 32, 34, 30, 4),
      makeText("people I love", 28, 72, 45, 10, 20),
      makeSticker("🌿", 77, 13, 9, 9),
    ]),
    makePage(bg, [
      makeText("places I've been", 8, 10, 70, 10, 25),
      makePhoto(13, 28, 34, 35, 3),
      makePhoto(50, 22, 35, 38, -2),
      makeSticker("✈", 75, 70, 11, 11),
      makeText("adventure notes", 20, 72, 50, 10, 18),
    ]),
  ];
}

function babyTemplate(kind = "girl") {
  const girl = kind === "girl";
  const bg = girl ? "babyPink" : "babyBlue";
  const label = girl ? "our little girl ♡" : "our little boy ♡";

  return Array.from({ length: 13 }).map((_, i) => {
    if (i === 0) {
      return makePage(bg, [
        makeText("baby's\nfirst year", 9, 11, 42, 18, 28, -2),
        makePhoto(10, 40, 30, 34, -4),
        makePhoto(51, 35, 26, 28, 5),
        makeText(label, 51, 68, 34, 10, 18),
        makeSticker(girl ? "🎀" : "🧸", 72, 14, 12, 12),
        makeSticker("♡", 14, 76, 9, 9),
      ]);
    }

    return makePage(bg, [
      makeText(i === 12 ? "one year\nof you" : `${i}\nmonth${i > 1 ? "s" : ""}`, 8, 10, 25, 17, 24, -2),
      makePhoto(34, 20, 42, 42, 2),
      makeText(i === 12 ? "what a year ♡" : "growing so fast ♡", 27, 72, 50, 9, 18),
      makeSticker(girl ? "🌸" : "☆", 12, 70, 11, 11),
    ]);
  });
}

function getTemplatePages(template, bg) {
  if (template === "blank") return blankTemplate(bg);
  if (template === "memory") return memoryTemplate(bg);
  if (template === "boy") return babyTemplate("boy");
  if (template === "girl") return babyTemplate("girl");
  return myLifeTemplate(bg);
}

function previewClass(bookOrPage) {
  const bg = bookOrPage?.pages?.[0]?.bg || bookOrPage?.bg || "cream";
  return `preview ${bg}`;
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, background: "white", color: "red", minHeight: "100vh" }}>
          <h1>App Error</h1>
          <pre>{String(this.state.error?.message || this.state.error)}</pre>
        </div>
      );
    }

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

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setProfile({});
        setBooks([]);
        setScreen("auth");
        return;
      }

      const profileRef = doc(db, "users", u.uid);
      await setDoc(
        profileRef,
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

      const unsubProfile = onSnapshot(profileRef, (snap) => {
        setProfile(snap.data() || {});
      });

      const booksQuery = query(collection(db, "users", u.uid, "scrapbooks"), orderBy("updatedAt", "desc"));
      const unsubBooks = onSnapshot(booksQuery, (snap) => {
        const nextBooks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBooks(nextBooks);
      });

      setScreen("home");

      return () => {
        unsubProfile();
        unsubBooks();
      };
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", !!profile?.dark);
  }, [profile?.dark]);

  async function saveBook(book) {
    if (!user || !book?.id) return;
    setActive(book);
    const { id: bookId, ...data } = book;
    await updateDoc(doc(db, "users", user.uid, "scrapbooks", bookId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async function createBook(name, bg = "cream", pages = null, paidOnly = false) {
    if (!user) return;
    const data = {
      name: name || "Untitled Scrapbook",
      pages: pages || myLifeTemplate(bg),
      paidOnly,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const refDoc = await addDoc(collection(db, "users", user.uid, "scrapbooks"), data);
    const created = { ...data, id: refDoc.id };
    setActive(created);
    setPageIndex(0);
    setScreen("editor");
  }

  async function deleteBook(book) {
    if (!user || !book?.id) return;
    const ok = window.confirm(`Are you sure you want to delete “${book.name}”?`);
    if (!ok) return;
    await deleteDoc(doc(db, "users", user.uid, "scrapbooks", book.id));
    setScreen("home");
  }

  function openBook(book, flip = false) {
    setActive(book);
    setPageIndex(0);
    setScreen(flip ? "flipbook" : "editor");
  }

  if (screen === "loading") {
    return (
      <div className="phoneFrame">
        <p className="loadingText">Loading...</p>
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <div className="phoneFrame">
      {screen !== "editor" && screen !== "flipbook" && <TopNav setScreen={setScreen} />}

      {screen === "home" && (
        <Home books={books} openBook={openBook} deleteBook={deleteBook} setScreen={setScreen} profile={profile} />
      )}

      {screen === "create" && (
        <CreateBook books={books} createBook={createBook} setScreen={setScreen} profile={profile} />
      )}

      {screen === "editor" && active && (
        <Editor book={active} pageIndex={pageIndex} setPageIndex={setPageIndex} saveBook={saveBook} setScreen={setScreen} user={user} profile={profile} />
      )}

      {screen === "flipbook" && active && (
        <Flipbook book={active} pageIndex={pageIndex} setPageIndex={setPageIndex} setScreen={setScreen} deleteBook={deleteBook} />
      )}

      {screen === "premium" && <Premium profile={profile} />}
      {screen === "profile" && <Profile user={user} profile={profile} />}
    </div>
  );
}

function TopNav({ setScreen }) {
  return (
    <nav className="topNav">
      <button onClick={() => setScreen("home")}>Home</button>
      <button onClick={() => setScreen("premium")}>Premium</button>
      <button onClick={() => setScreen("profile")}>Profile</button>
    </nav>
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
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        await createUserWithEmailAndPassword(auth, email, pass);
      }
    } catch (error) {
      setErr(error.message);
    }
  }

  return (
    <div className="authPage">
      <div className="loginPhoto loginPhotoOne" />
      <div className="loginPhoto loginPhotoTwo" />
      <div className="loginTape tapeOne" />
      <div className="loginTape tapeTwo" />

      <header className="authBrand">
        <div className="bookBadge">♡</div>
        <div className="script">my life</div>
        <h1>SCRAPBOOK</h1>
        <p>Capture your story. Cherish every moment.</p>
      </header>

      <form className="authCard" onSubmit={submit}>
        <h2>{mode === "login" ? "Welcome back ♡" : "Create account ♡"}</h2>

        <label>Email address</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />

        <label>Password</label>
        <div className="passRow">
          <input value={pass} onChange={(e) => setPass(e.target.value)} type={show ? "text" : "password"} required />
          <button type="button" onClick={() => setShow((v) => !v)}>
            {show ? "Hide" : "Show"}
          </button>
        </div>

        {mode === "login" && (
          <button type="button" className="smallLink" onClick={() => email && sendPasswordResetEmail(auth, email)}>
            Forgot password?
          </button>
        )}

        {err && <p className="error">{err}</p>}

        <button className="primary">{mode === "login" ? "Log In" : "Create Account"}</button>

        <p className="swap">
          {mode === "login" ? "New here?" : "Have an account?"} {" "}
          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Create an account ♡" : "Log in ♡"}
          </button>
        </p>
      </form>
    </div>
  );
}

function Home({ books, openBook, deleteBook, setScreen, profile }) {
  const [menu, setMenu] = useState(null);

  return (
    <main className="page homePage">
      <section className="hero">
        <h1>Pocket Scrapbook</h1>
        <p>Soft, pretty scrapbook pages that save automatically.</p>
      </section>

      <button className="createBig" onClick={() => setScreen("create")}>
        ＋ Create a Scrapbook
      </button>

      <h2>My Scrapbooks</h2>

      {books.length === 0 && <p className="hint">No scrapbooks yet. Create your first one.</p>}

      <section className="bookGrid">
        {books.map((book) => (
          <article key={book.id} className="bookCard" onClick={() => openBook(book)}>
            <div className={previewClass(book)}>
              <Preview book={book} />
            </div>

            <button
              className="dots"
              onClick={(e) => {
                e.stopPropagation();
                setMenu(menu === book.id ? null : book.id);
              }}
            >
              ⋯
            </button>

            {menu === book.id && (
              <div className="cardMenu" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => openBook(book)}>Edit</button>
                <button onClick={() => openBook(book, true)}>View Flipbook</button>
                <button onClick={() => alert("Export coming soon")}>Export</button>
                <button
                  onClick={() => {
                    const n = window.prompt("Rename scrapbook", book.name);
                    if (n) updateDoc(doc(db, "users", auth.currentUser.uid, "scrapbooks", book.id), { name: n });
                  }}
                >
                  Rename
                </button>
                <button onClick={() => deleteBook(book)}>Delete</button>
              </div>
            )}

            <h3>{book.name}</h3>
            <p>{book.pages?.length || 1} page(s)</p>
          </article>
        ))}
      </section>

      <h2>Templates</h2>
      <section className="templateGrid">
        <TemplateButton name="My Life" type="Free" bg="cream" previewText="my life" onClick={() => setScreen("create")} />
        <TemplateButton name="Blank Book" type="Free" bg="blank" previewText="blank" onClick={() => setScreen("create")} />
        <TemplateButton name="Memory Book" type="Free" bg="paper" previewText="memory" onClick={() => setScreen("create")} />
        <TemplateButton name="Baby Boy" type="Premium" bg="babyBlue" previewText="baby boy" onClick={() => setScreen("premium")} />
        <TemplateButton name="Baby Girl" type="Premium" bg="babyPink" previewText="baby girl" onClick={() => setScreen("premium")} />
        <TemplateButton name="Advanced Text" type="Premium" bg="lavender" previewText="Aa" onClick={() => setScreen("premium")} />
      </section>

      <p className="hint">Plan: {profile?.subscription || "Free"}</p>
    </main>
  );
}

function TemplateButton({ name, type, bg, previewText, onClick }) {
  return (
    <button className={`templateCard ${type === "Premium" ? "premium" : "free"}`} onClick={onClick}>
      <div className={`preview ${bg}`}>
        <span>{previewText}</span>
      </div>
      <b>{name}</b>
      <small>{type}</small>
    </button>
  );
}

function CreateBook({ books, createBook, setScreen, profile }) {
  const [name, setName] = useState("");
  const [bg, setBg] = useState("cream");
  const [template, setTemplate] = useState("myLife");
  const freeBookLimitReached = (profile?.subscription || "Free") === "Free" && books.length >= 3;
  const premiumTemplate = template === "boy" || template === "girl";
  const locked = freeBookLimitReached || premiumTemplate;

  function handleCreate() {
    if (locked) {
      window.alert("This is part of Premium. Free accounts can create 3 scrapbooks. Baby templates are premium.");
      return;
    }
    const pages = getTemplatePages(template, bg);
    createBook(name || "Untitled Scrapbook", bg, pages, false);
  }

  return (
    <main className="page createPage">
      <button className="backButton" onClick={() => setScreen("home")}>Back</button>

      <section className="createPanel full">
        <h1>Create a scrapbook</h1>
        <p>Name it, choose a background, then pick your template.</p>

        <label>Scrapbook name</label>
        <input placeholder="Example: Summer Memories" value={name} onChange={(e) => setName(e.target.value)} />

        <label>Background</label>
        <select value={bg} onChange={(e) => setBg(e.target.value)}>
          {bgOptions.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <label>Template</label>
        <select value={template} onChange={(e) => setTemplate(e.target.value)}>
          <option value="myLife">My Life - Free</option>
          <option value="blank">Blank Book - Free</option>
          <option value="memory">Memory Book - Free</option>
          <option value="boy">Baby Boy - Premium</option>
          <option value="girl">Baby Girl - Premium</option>
        </select>

        {freeBookLimitReached && <p className="error">Free accounts can create 3 scrapbooks. Upgrade for unlimited.</p>}
        {premiumTemplate && <p className="error">Baby templates are part of Premium.</p>}

        <button className="primary" onClick={handleCreate}>Create Scrapbook</button>
      </section>
    </main>
  );
}

function Preview({ book }) {
  const elements = book?.pages?.[0]?.elements || [];

  return (
    <>
      {elements.slice(0, 6).map((el) => (
        <span
          key={el.id}
          className={`pv ${el.type}`}
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.w}%`,
            height: `${el.h}%`,
            transform: `rotate(${el.rotate || 0}deg)`,
          }}
        >
          {el.type === "text" ? el.text : el.type === "sticker" ? el.text : ""}
        </span>
      ))}
    </>
  );
}

function Editor({ book, pageIndex, setPageIndex, saveBook, setScreen, user, profile }) {
  const [selected, setSelected] = useState(null);
  const [popup, setPopup] = useState(null);
  const pageRef = useRef(null);
  const currentPage = book?.pages?.[pageIndex] || makePage("cream", []);

  useEffect(() => {
    function key(e) {
      const tag = document.activeElement?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if ((e.key === "Delete" || e.key === "Backspace") && selected && !typing) {
        e.preventDefault();
        removeElement(selected);
      }
    }

    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [selected, book, pageIndex]);

  function mutate(fn) {
    const newBook = {
      ...book,
      pages: (book.pages || []).map((p, i) =>
        i === pageIndex ? { ...p, elements: [...(p.elements || [])] } : p
      ),
    };

    if (!newBook.pages[pageIndex]) newBook.pages[pageIndex] = makePage("cream", []);
    fn(newBook.pages[pageIndex], newBook);
    saveBook(newBook);
  }

  function updateElement(elementId, patch) {
    mutate((p) => {
      p.elements = p.elements.map((el) => (el.id === elementId ? { ...el, ...patch } : el));
    });
  }

  function removeElement(elementId) {
    mutate((p) => {
      p.elements = p.elements.filter((el) => el.id !== elementId);
    });
    setSelected(null);
  }

  function duplicateElement(el) {
    mutate((p) => {
      p.elements.push({ ...el, id: uid(), x: Math.min(88, el.x + 4), y: Math.min(88, el.y + 4) });
    });
  }

  async function uploadImage(e, elementId) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const limit = profile?.subscription === "Premium" ? 999999 : profile?.uploadLimit || 15;
    const used = profile?.uploadsUsed || 0;
    if (used >= limit) {
      window.alert("You have used your free photo uploads. Upgrade or buy 20 more uploads for 99¢.");
      return;
    }

    const storageRef = ref(storage, `users/${user.uid}/scrapbook-photos/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    updateElement(elementId, { src: url });
    await updateDoc(doc(db, "users", user.uid), { uploadsUsed: used + 1 });
  }

  function addPhoto() {
    mutate((p) => p.elements.push(makePhoto(20, 20, 50, 40)));
  }

  function addText() {
    mutate((p) => p.elements.push(makeText("New text", 25, 25, 40, 10, 22)));
  }

  function startMove(event, el) {
    event.stopPropagation();
    if (!pageRef.current) return;

    const rect = pageRef.current.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const originalX = el.x;
    const originalY = el.y;

    function onMove(moveEvent) {
      const nextX = originalX + ((moveEvent.clientX - startX) / rect.width) * 100;
      const nextY = originalY + ((moveEvent.clientY - startY) / rect.height) * 100;
      updateElement(el.id, {
        x: Math.max(0, Math.min(92, nextX)),
        y: Math.max(0, Math.min(92, nextY)),
      });
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <main className="editor">
      <div ref={pageRef} className={`scrapPage ${currentPage.bg}`} onClick={() => setSelected(null)}>
        {(currentPage.elements || []).map((el) => (
          <div
            key={el.id}
            className={`el ${selected === el.id ? "selected" : ""}`}
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.w}%`,
              height: `${el.h}%`,
              transform: `rotate(${el.rotate || 0}deg)`,
            }}
            onMouseDown={(e) => startMove(e, el)}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(el.id);
            }}
          >
            {el.type === "photo" &&
              (el.src ? (
                <img src={el.src} alt="uploaded" />
              ) : (
                <label className="uploadLabel">
                  Upload Photo
                  <input type="file" accept="image/*" hidden onChange={(e) => uploadImage(e, el.id)} />
                </label>
              ))}

            {el.type === "text" && (
              <textarea
                value={el.text}
                style={{ fontSize: el.size }}
                onChange={(e) => updateElement(el.id, { text: e.target.value })}
                onMouseDown={(e) => e.stopPropagation()}
              />
            )}

            {el.type === "sticker" && <div className="sticker">{el.text}</div>}

            {selected === el.id && (
              <div className="miniControls" onMouseDown={(e) => e.stopPropagation()}>
                <button onClick={() => updateElement(el.id, { rotate: (el.rotate || 0) + 10 })}>↻</button>
                <button onClick={() => updateElement(el.id, { w: el.w + 4, h: el.h + 4 })}>＋</button>
                <button onClick={() => updateElement(el.id, { w: Math.max(6, el.w - 4), h: Math.max(6, el.h - 4) })}>−</button>
                <button onClick={() => duplicateElement(el)}>⧉</button>
                <button onClick={() => removeElement(el.id)}>🗑</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pageNav">
        <button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>Prev</button>
        <span>Page {pageIndex + 1} of {book.pages?.length || 1}</span>
        <button disabled={pageIndex === (book.pages?.length || 1) - 1} onClick={() => setPageIndex(pageIndex + 1)}>Next</button>
      </div>

      <div className="bottomBar">
        <button onClick={() => setScreen("home")}>Back</button>
        <button onClick={addText}>Text</button>
        <button onClick={addPhoto}>Photo</button>
        <button onClick={() => setPopup(popup === "stickers" ? null : "stickers")}>Stickers</button>
        <button onClick={() => setPopup(popup === "bg" ? null : "bg")}>Backgrounds</button>
        <button onClick={() => mutate((p, newBook) => newBook.pages.push(makePage("cream", [])))}>Page</button>
        <button onClick={() => setScreen("flipbook")}>Flipbook</button>
      </div>

      {popup && (
        <div className="sheet">
          {popup === "stickers" &&
            stickers.map((s) => (
              <button
                key={s}
                onClick={() => {
                  mutate((p) => p.elements.push(makeSticker(s, 30, 30)));
                  setPopup(null);
                }}
              >
                {s}
              </button>
            ))}

          {popup === "bg" &&
            bgOptions.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  mutate((p) => {
                    p.bg = b.id;
                  });
                  setPopup(null);
                }}
              >
                {b.name}
              </button>
            ))}
        </div>
      )}
    </main>
  );
}

function Flipbook({ book, pageIndex, setPageIndex, setScreen, deleteBook }) {
  const [menu, setMenu] = useState(false);
  const p = book?.pages?.[pageIndex] || makePage("cream", []);

  return (
    <main className="page flip">
      <button onClick={() => setScreen("home")}>Back</button>
      <button className="dots fixed" onClick={() => setMenu((v) => !v)}>⋯</button>

      {menu && (
        <div className="flipMenu">
          <button onClick={() => setScreen("editor")}>Edit</button>
          <button onClick={() => alert("Export coming soon")}>Export</button>
          <button
            onClick={() => {
              const n = window.prompt("Rename scrapbook", book.name);
              if (n) updateDoc(doc(db, "users", auth.currentUser.uid, "scrapbooks", book.id), { name: n });
            }}
          >
            Rename
          </button>
          <button onClick={() => deleteBook(book)}>Delete</button>
        </div>
      )}

      <div className={`scrapPage flipPage ${p.bg}`}>
        <Preview book={{ pages: [p] }} />
      </div>

      <div className="pageNav">
        <button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>Prev</button>
        <span>{pageIndex + 1}/{book.pages?.length || 1}</span>
        <button disabled={pageIndex === (book.pages?.length || 1) - 1} onClick={() => setPageIndex(pageIndex + 1)}>Next</button>
      </div>
    </main>
  );
}

function Premium({ profile }) {
  return (
    <main className="page premiumPage">
      <h1>Premium</h1>
      <p>Your plan: {profile?.subscription || "Free"}</p>

      <table>
        <tbody>
          <tr><th>Feature</th><th>Free</th><th>Premium</th></tr>
          <tr><td>3 scrapbooks</td><td>✓</td><td>✓</td></tr>
          <tr><td>Unlimited scrapbooks</td><td>—</td><td>✓</td></tr>
          <tr><td>My Life template</td><td>✓</td><td>✓</td></tr>
          <tr><td>Baby templates</td><td>99¢ each</td><td>✓</td></tr>
          <tr><td>Photo uploads</td><td>15</td><td>Unlimited</td></tr>
          <tr><td>Buy 20 more photos</td><td>99¢</td><td>Included</td></tr>
          <tr><td>Advanced text effects</td><td>—</td><td>✓</td></tr>
        </tbody>
      </table>

      <button className="primary">Upgrade $4.99/mo</button>
      <button>Buy 20 photo uploads - 99¢</button>
      <p className="hint">Real payments need Stripe before charging works.</p>
    </main>
  );
}

function Profile({ user, profile = {} }) {
  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [pass, setPass] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setName(profile?.name || user?.displayName || "");
    setEmail(user?.email || "");
  }, [profile?.name, user?.displayName, user?.email]);

  async function uploadProfilePic(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setMessage("Uploading...");

    try {
      const storageRef = ref(storage, `users/${user.uid}/profile/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL: url });
      await updateDoc(doc(db, "users", user.uid), { photoURL: url });
      setMessage("Profile picture updated.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function saveName() {
    try {
      await updateProfile(user, { displayName: name });
      await updateDoc(doc(db, "users", user.uid), { name });
      setMessage("Name saved.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function saveEmail() {
    try {
      await updateEmail(user, email);
      await updateDoc(doc(db, "users", user.uid), { email });
      setMessage("Email updated.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function savePassword() {
    try {
      if (!pass) return;
      await updatePassword(user, pass);
      setPass("");
      setMessage("Password updated.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="page profile">
      <h1>Profile</h1>

      <label className="avatar">
        <img
          src={
            profile?.photoURL ||
            user?.photoURL ||
            "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=300"
          }
          alt="profile"
        />
        <input type="file" hidden accept="image/*" onChange={uploadProfilePic} />
      </label>

      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      <button onClick={saveName}>Save Name</button>

      <h2>Settings</h2>
      <label className="toggle">
        Dark theme
        <input
          type="checkbox"
          checked={!!profile?.dark}
          onChange={(e) => updateDoc(doc(db, "users", user.uid), { dark: e.target.checked })}
        />
      </label>

      <label>Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <button onClick={saveEmail}>Update Email</button>

      <label>New password</label>
      <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="New password" />
      <button onClick={savePassword}>Update Password</button>

      <p>Subscription: {profile?.subscription || "Free"}</p>
      <button>Change/Cancel Subscription</button>
      <button className="danger" onClick={() => signOut(auth)}>Logout</button>

      {message && <p className="hint">{message}</p>}
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
