import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  signOut
} from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  deleteDoc,
  doc
} from "firebase/firestore";
import "./style.css";

function App() {
  const [page, setPage] = useState("welcome");
  const [toast, setToast] = useState("");
  const [user, setUser] = useState(null);

  function flash(message) {
    setToast(message);
    setTimeout(() => setToast(""), 3500);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setPage(u ? "home" : "welcome");
    });
    return () => unsub();
  }, []);

  return (
    <div className="appShell">
      {toast && <div className="toast">{toast}</div>}
      {page === "welcome" && <Welcome go={setPage} />}
      {page === "login" && <Login go={setPage} flash={flash} />}
      {page === "signup" && <Signup go={setPage} flash={flash} />}
      {page === "forgot" && <Forgot go={setPage} flash={flash} />}
      {page === "home" && <Home user={user} flash={flash} />}
    </div>
  );
}

function Welcome({ go }) {
  return (
    <div className="phone">
      <div className="screen paper auth-page">
        <div className="auth-logo">ScrapFlip</div>
        <h1>Turn your memories into beautiful stories 💗</h1>
        <div className="hero">🌼 🖼️ 🦋</div>

        <div className="auth-card">
          <button onClick={() => go("signup")}>✨ Start Scrapbooking</button>
          <button className="secondary" onClick={() => go("login")}>Login</button>
        </div>
      </div>
    </div>
  );
}

function Login({ go, flash }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit() {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      flash("Logged in 💖");
      go("home");
    } catch (e) {
      flash("Login error: " + e.message);
    }
  }

  return (
    <div className="phone">
      <div className="screen paper auth-page">
        <div className="auth-logo">ScrapFlip</div>
        <h1>Welcome Back ✨</h1>

        <div className="auth-card">
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={submit}>Login ✨</button>
        </div>

        <button className="text-btn" onClick={() => go("forgot")}>Forgot Password?</button>
        <button className="text-btn" onClick={() => go("signup")}>Need an account?</button>
      </div>
    </div>
  );
}

function Signup({ go, flash }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit() {
    try {
      if (!name || !username || !email || !password) throw new Error("Fill in every field.");
      if (password.length < 6) throw new Error("Password must be at least 6 characters.");

      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name });

      await addDoc(collection(db, "profiles"), {
        uid: cred.user.uid,
        name,
        username,
        email: email.trim(),
        createdAt: serverTimestamp()
      });

      flash("Account created 💖");
      go("home");
    } catch (e) {
      flash("Signup error: " + e.message);
    }
  }

  return (
    <div className="phone">
      <div className="screen paper auth-page">
        <div className="auth-logo">ScrapFlip</div>
        <h1>Create Your Account ✨</h1>

        <div className="auth-card">
          <input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={submit}>💖 Create Account</button>
        </div>

        <button className="text-btn" onClick={() => go("login")}>Already have an account?</button>
      </div>
    </div>
  );
}

function Forgot({ go, flash }) {
  const [email, setEmail] = useState("");

  async function reset() {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      flash("Reset email sent 💌");
      go("login");
    } catch (e) {
      flash("Reset error: " + e.message);
    }
  }

  return (
    <div className="phone">
      <div className="screen paper auth-page">
        <h1>Forgot Password?</h1>
        <div className="auth-card">
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button onClick={reset}>Send Reset Link</button>
        </div>
        <button className="text-btn" onClick={() => go("login")}>Back to Login</button>
      </div>
    </div>
  );
}

function Home({ user, flash }) {
  const [books, setBooks] = useState([]);
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("home");
  const [activeBook, setActiveBook] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadBooks() {
    if (!user) return;

    try {
      setLoading(true);
      const q = query(collection(db, "scrapbooks"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const userBooks = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((b) => b.uid === user.uid);

      setBooks(userBooks);
    } catch (e) {
      flash("Could not load scrapbooks: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, [user]);

  async function createBook() {
    if (!title.trim()) {
      flash("Add a scrapbook title 💕");
      return;
    }

    try {
      const data = {
        uid: user.uid,
        title: title.trim(),
        pages: 1,
        cover: "📔",
        updated: "just now",
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "scrapbooks"), data);
      const newBook = { id: docRef.id, ...data };

      setBooks([newBook, ...books]);
      setTitle("");
      setActiveBook(newBook);
      setSection("editor");
      flash("Scrapbook created 💖");
    } catch (e) {
      flash("Create error: " + e.message);
    }
  }

  async function deleteBook(book) {
    try {
      await deleteDoc(doc(db, "scrapbooks", book.id));
      setBooks(books.filter((b) => b.id !== book.id));
      setOpenMenuId(null);
      flash("Scrapbook deleted 🗑️");
    } catch (e) {
      flash("Delete failed: " + e.message);
    }
  }

  function exportBook(book) {
    setOpenMenuId(null);
    flash(`Exporting ${book.title} soon 💌`);
  }

  function openBook(book) {
    setActiveBook(book);
    setOpenMenuId(null);
    setSection("editor");
  }

  async function logout() {
    await signOut(auth);
    flash("Logged out ✨");
  }

  if (section === "create") {
    return (
      <div className="phone">
        <div className="screen paper auth-page">
          <button className="text-btn" onClick={() => setSection("home")}>← Back</button>
          <h1>Create New Scrapbook</h1>

          <div className="auth-card">
            <input
              placeholder="Scrapbook title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button onClick={createBook}>Create & Start Editing 💖</button>
          </div>
        </div>
      </div>
    );
  }

  if (section === "editor") {
    return (
      <div className="phone">
        <div className="screen paper editorScreen">
          <div className="top">
            <button className="iconBtn" onClick={() => setSection("home")}>‹</button>
            <b>{activeBook?.title}</b>
            <button onClick={() => flash("Saved 💖")}>Save</button>
          </div>

          <div className="canvas prettyCanvas">
            <div className="note">
              Good times
              <br />
              <small>& tan lines ♡</small>
            </div>
            <div className="sticker">🌼</div>
            <div className="tape">pink tape</div>
          </div>

          <div className="tools">
            <button>📷 Photo</button>
            <button>🏷️ Sticker</button>
            <button>𝑇 Text</button>
            <button>🎨 Background</button>
          </div>
        </div>
      </div>
    );
  }

  if (section === "profile") {
    return (
      <div className="phone">
        <div className="screen paper auth-page">
          <button className="text-btn" onClick={() => setSection("home")}>← Back</button>
          <h1>Profile</h1>
          <div className="auth-card">
            <p>{user?.displayName}</p>
            <p>{user?.email}</p>
            <p>Scrapbooks: {books.length}</p>
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      </div>
    );
  }

  const templates = ["Baby Book 🎀", "Travel ✈️", "Summer Book ☀️", "Family Memories 💗"];

  if (section === "templates") {
    return (
      <div className="phone">
        <div className="screen paper">
          <button className="text-btn" onClick={() => setSection("home")}>← Back</button>
          <h1>Templates</h1>
          {templates.map((t) => (
            <div className="bookCard scrapBookRow" key={t}>
              <div className="bookCover">📖</div>
              <div>
                <h3>{t}</h3>
                <p className="muted">Ready-made scrapbook layout</p>
              </div>
              <button onClick={() => { setTitle(t); setSection("create"); }}>Use</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="phone">
      <div className="screen paper homeLikeScreenshot">
        <div className="homeHeader">
          <button className="circleBtn">☰</button>

          <div className="headerIcons">
            <button className="circleBtn">👑</button>
            <button className="circleBtn" onClick={() => flash("No notifications 🔔")}>🔔</button>
          </div>
        </div>

        <div className="brandLogo">
          Scrap<span>Flip</span>
        </div>

        <p className="homeTagline">
          Turn your memories into<br />beautiful stories 💗
        </p>

        <div className="decorPolaroid">
          <span className="flower">🌼</span>
          <div className="miniPhoto">🌅</div>
          <span className="butterfly">🦋</span>
          <span className="heart">💗</span>
        </div>

        <button className="bigCreateCard" onClick={() => setSection("create")}>
          <div className="bigPlus">＋</div>
          <div>
            <h2>Create New Scrapbook</h2>
            <p>Start a new scrapbook</p>
          </div>
          <div className="bookArt">📔</div>
        </button>

        <div className="row">
          <h2>My Scrapbooks</h2>
          <button className="seeAll" onClick={() => flash("Showing all scrapbooks")}>See All ›</button>
        </div>

        {loading ? (
          <p className="muted">Loading scrapbooks...</p>
        ) : books.length === 0 ? (
          <p className="muted">No scrapbooks yet. Create your first one 💕</p>
        ) : (
          books.map((book) => (
            <div className="scrapBookRow" key={book.id}>
              <div className="bookCover">
                {book.cover || "📔"}
              </div>

              <div className="bookInfo" onClick={() => openBook(book)}>
                <h3>{book.title}</h3>
                <p>{book.updated || "Updated just now"}</p>
                <div className="avatarRow">👩🏻 👱🏻‍♀️ <span>+2</span></div>
              </div>

              <div className="bookMeta">
                <button
                  className="dots"
                  onClick={() =>
                    setOpenMenuId(openMenuId === book.id ? null : book.id)
                  }
                >
                  ⋯
                </button>

                <span>{book.pages || 1} Pages</span>

                {openMenuId === book.id && (
                  <div className="miniMenu">
                    <button onClick={() => openBook(book)}>Edit</button>
                    <button onClick={() => exportBook(book)}>Export</button>
                    <button onClick={() => deleteBook(book)}>Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        <div className="shortcutTray">
          <button onClick={() => setSection("templates")}>📖<br />Templates</button>
          <button onClick={() => flash("Stickers coming soon ✨")}>🫧<br />Stickers</button>
          <button onClick={() => flash("Fonts coming soon Aa")}>Aa<br />Fonts</button>
          <button onClick={() => flash("Backgrounds coming soon 🖼️")}>🖼️<br />Backgrounds</button>
        </div>
      </div>

      <div className="bottom">
        <button onClick={() => setSection("home")}>🏠<br />Home</button>
        <button onClick={() => flash("My Books")}>📖<br />My Books</button>
        <button className="plus" onClick={() => setSection("create")}>＋</button>
        <button onClick={() => setSection("templates")}>▦<br />Templates</button>
        <button onClick={() => setSection("profile")}>♡<br />Profile</button>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
