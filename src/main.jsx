
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
  serverTimestamp
} from "firebase/firestore";

import "./style.css";

function App() {
  const [page, setPage] = useState("welcome");
  const [toast, setToast] = useState("");
  const [user, setUser] = useState(null);

  function flash(message) {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setPage("home");
      } else {
        setUser(null);
        setPage("welcome");
      }
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
        <div className="auth-logo">💖 Pocket Scrapbook</div>

        <h1>Turn your memories into beautiful stories</h1>

        <p className="auth-sub">
          Save your sweetest memories, milestones, and magical moments.
        </p>

        <div className="hero">🌼 🖼️ 🦋</div>

        <div className="auth-card">
          <button onClick={() => go("signup")}>✨ Start Scrapbooking</button>

          <button className="secondary" onClick={() => go("login")}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

function Login({ go, flash }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="auth-logo">💖 Pocket Scrapbook</div>

        <h1>Welcome Back ✨</h1>

        <p className="auth-sub">Continue your magical scrapbook journey.</p>

        <div className="auth-card">
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="passwordWrap">
            <input
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="showBtn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button onClick={submit}>Login ✨</button>
        </div>

        <button className="text-btn" onClick={() => go("forgot")}>
          Forgot Password?
        </button>

        <button className="text-btn" onClick={() => go("signup")}>
          Need an account?
        </button>
      </div>
    </div>
  );
}

function Signup({ go, flash }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function submit() {
    try {
      if (!name || !username || !email || !password) {
        throw new Error("Fill in every field.");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      if (password !== confirm) {
        throw new Error("Passwords do not match.");
      }

      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await updateProfile(cred.user, {
        displayName: name
      });

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
        <div className="auth-logo">🎀 Join Pocket Scrapbook</div>

        <h1>Create Your Dream Scrapbook ✨</h1>

        <p className="auth-sub">
          Store photos, memories, and magical moments forever.
        </p>

        <div className="auth-card">
          <input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="passwordWrap">
            <input
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="showBtn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <div className="passwordWrap">
            <input
              placeholder="Confirm Password"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />

            <button
              className="showBtn"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? "🙈" : "👁️"}
            </button>
          </div>

          <button onClick={submit}>💖 Create Account</button>
        </div>

        <button className="text-btn" onClick={() => go("login")}>
          Already have an account?
        </button>
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
        <div className="auth-logo">💌 Reset Password</div>

        <h1>Forgot Password?</h1>

        <p className="auth-sub">Enter your email to receive a reset link.</p>

        <div className="auth-card">
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button onClick={reset}>Send Reset Link</button>
        </div>

        <button className="text-btn" onClick={() => go("login")}>
          Back to Login
        </button>
      </div>
    </div>
  );
}

function Home({ user, flash }) {
  const [section, setSection] = useState("home");
  const [books, setBooks] = useState([]);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [activeBook, setActiveBook] = useState(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  async function loadBooks() {
    if (!user) return;

    try {
      setLoadingBooks(true);

      const q = query(collection(db, "scrapbooks"), orderBy("createdAt", "desc"));

      const snap = await getDocs(q);

      const userBooks = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((book) => book.uid === user.uid);

      setBooks(userBooks);
    } catch (e) {
      flash("Could not load scrapbooks: " + e.message);
    } finally {
      setLoadingBooks(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, [user]);

  async function logout() {
    await signOut(auth);
    flash("Logged out ✨");
    window.location.reload();
  }

  async function createBook() {
    if (!user) {
      flash("Please login first 💕");
      return;
    }

    if (!title.trim()) {
      flash("Add a scrapbook title 💕");
      return;
    }

    try {
      const newBookData = {
        uid: user.uid,
        title: title.trim(),
        pages: 1,
        emoji: "📔",
        updated: "just now",
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "scrapbooks"), newBookData);

      const newBook = {
        id: docRef.id,
        ...newBookData
      };

      setBooks((oldBooks) => [newBook, ...oldBooks]);
      setTitle("");
      setActiveBook(newBook);
      flash("Scrapbook created 💖");
      setSection("editor");
    } catch (e) {
      flash("Create error: " + e.message);
    }
  }

  const filteredBooks = books.filter((book) =>
    book.title?.toLowerCase().includes(search.toLowerCase())
  );

  function openBook(book) {
    setActiveBook(book);
    setSection("editor");
  }

  if (section === "editor") {
    return (
      <div className="phone">
        <div className="screen paper">
          <div className="top">
            <button className="iconBtn" onClick={() => setSection("home")}>
              ‹
            </button>

            <b>{activeBook?.title || "Untitled Scrapbook"}</b>

            <button onClick={() => flash("Saved 💖")}>Save</button>
          </div>

          <div className="canvas">
            <div className="note">
              {activeBook?.title || "My Scrapbook"}
              <br />
              <small>Start editing your scrapbook ♡</small>
            </div>

            <div className="sticker">🌼</div>
            <div className="tape">pink tape</div>
          </div>

          <div className="tools">
            <button onClick={() => flash("Photo upload coming next 📷")}>
              📷 Photo
            </button>

            <button onClick={() => flash("Sticker menu coming next ✨")}>
              ✨ Sticker
            </button>

            <button onClick={() => flash("Text tool coming next 𝑇")}>
              𝑇 Text
            </button>

            <button onClick={() => flash("Backgrounds coming next 🎨")}>
              🎨 Background
            </button>
          </div>

          <div className="tools">
            <button onClick={() => flash("Layers coming next")}>Layers</button>
            <button onClick={() => flash("Delete coming next")}>Delete</button>
            <button onClick={() => flash("Duplicate coming next")}>
              Duplicate
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (section === "create") {
    return (
      <div className="phone">
        <div className="screen paper auth-page">
          <button className="text-btn" onClick={() => setSection("home")}>
            ← Back
          </button>

          <h1>Create Scrapbook ✨</h1>

          <p className="auth-sub">Name your new memory book.</p>

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

  if (section === "search") {
    return (
      <div className="phone">
        <div className="screen paper">
          <button className="text-btn" onClick={() => setSection("home")}>
            ← Back
          </button>

          <h1>Search Scrapbooks 🔍</h1>

          <input
            placeholder="Search your scrapbooks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filteredBooks.length === 0 ? (
            <p className="muted">No scrapbooks found yet.</p>
          ) : (
            filteredBooks.map((book) => (
              <div
                className="bookCard"
                key={book.id}
                onClick={() => openBook(book)}
              >
                <div className="thumb">{book.emoji || "📔"}</div>

                <div>
                  <h3>{book.title}</h3>

                  <div className="muted">
                    Updated {book.updated || "just now"}
                  </div>
                </div>

                <strong>{book.pages || 1} Page</strong>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (section === "templates") {
    const templates = [
      "Baby Book 🎀",
      "Wedding 💍",
      "Travel ✈️",
      "Family Memories 💖",
      "Summer Book ☀️"
    ];

    return (
      <div className="phone">
        <div className="screen paper">
          <button className="text-btn" onClick={() => setSection("home")}>
            ← Back
          </button>

          <h1>Templates 📚</h1>

          {templates.map((template) => (
            <div className="bookCard" key={template}>
              <div className="thumb">📖</div>

              <div>
                <h3>{template}</h3>
                <p className="muted">Ready-made scrapbook layout</p>
              </div>

              <button
                onClick={() => {
                  setTitle(template);
                  setSection("create");
                }}
              >
                Use
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === "profile") {
    return (
      <div className="phone">
        <div className="screen paper auth-page">
          <button className="text-btn" onClick={() => setSection("home")}>
            ← Back
          </button>

          <div className="auth-logo">👤 Profile</div>

          <h1>{user?.displayName || "Pocket User"}</h1>

          <p className="auth-sub">{user?.email}</p>

          <div className="auth-card">
            <p>
              Scrapbooks: <b>{books.length}</b>
            </p>

            <p>
              Pages created: <b>{books.length}</b>
            </p>

            <p>
              Theme: <b>Soft Pink</b>
            </p>
          </div>

          <button onClick={logout}>Logout</button>
        </div>
      </div>
    );
  }

  if (section === "settings") {
    return (
      <div className="phone">
        <div className="screen paper auth-page">
          <button className="text-btn" onClick={() => setSection("home")}>
            ← Back
          </button>

          <div className="auth-logo">⚙️ Settings</div>

          <h1>App Settings ✨</h1>

          <p className="auth-sub">Customize your scrapbook experience.</p>

          <div className="settings-card">
            <div className="setting-row">
              <div>
                <h3>Dark Mode 🌙</h3>
                <p>Switch between light and dark.</p>
              </div>

              <button
                onClick={() => {
                  setDarkMode(!darkMode);
                  flash(!darkMode ? "Dark mode on 🌙" : "Light mode on ☀️");
                }}
              >
                {darkMode ? "ON" : "OFF"}
              </button>
            </div>

            <div className="setting-row">
              <div>
                <h3>Notifications 🔔</h3>
                <p>Enable scrapbook reminders.</p>
              </div>

              <button
                onClick={() => {
                  setNotifications(!notifications);
                  flash(
                    !notifications
                      ? "Notifications on 🔔"
                      : "Notifications off"
                  );
                }}
              >
                {notifications ? "ON" : "OFF"}
              </button>
            </div>

            <div className="setting-row">
              <div>
                <h3>Auto Save 💾</h3>
                <p>Automatically save scrapbook edits.</p>
              </div>

              <button
                onClick={() => {
                  setAutoSave(!autoSave);
                  flash(!autoSave ? "Auto save on 💖" : "Auto save off");
                }}
              >
                {autoSave ? "ON" : "OFF"}
              </button>
            </div>

            <div className="setting-row">
              <div>
                <h3>Profile 👤</h3>
                <p>Edit your profile details.</p>
              </div>

              <button onClick={() => setSection("profile")}>Open</button>
            </div>

            <div className="setting-row">
              <div>
                <h3>Templates 📚</h3>
                <p>Browse scrapbook templates.</p>
              </div>

              <button onClick={() => setSection("templates")}>Open</button>
            </div>

            <div className="setting-row">
              <div>
                <h3>Logout 🚪</h3>
                <p>Sign out of Pocket Scrapbook.</p>
              </div>

              <button onClick={logout}>Logout</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="phone">
      <div className="screen paper">
        <div className="top">
          <button className="iconBtn" onClick={() => setSection("settings")}>
            ⚙️
          </button>

          <div className="brand">
            Pocket<span>Scrapbook</span>
          </div>

          <button
            className="iconBtn"
            onClick={() => flash("No new notifications 🔔")}
          >
            🔔
          </button>
        </div>

        <h1>Hi {user?.displayName || "Friend"} 💖</h1>

        <p className="muted">Ready to save more memories?</p>

        <div className="hero">🌼 📸 🦋</div>

        <button className="createCard" onClick={() => setSection("create")}>
          <div style={{ fontSize: 28 }}>➕</div>

          <h2>Create New Scrapbook</h2>

          <p>Start a magical story</p>
        </button>

        <div className="row">
          <h2>My Scrapbooks</h2>

          <button className="text-btn" onClick={() => setSection("search")}>
            See All
          </button>
        </div>

        {loadingBooks ? (
          <p className="muted">Loading scrapbooks...</p>
        ) : books.length === 0 ? (
          <p className="muted">No scrapbooks yet. Create your first one 💕</p>
        ) : (
          books.map((book) => (
            <div
              className="bookCard"
              key={book.id}
              onClick={() => openBook(book)}
            >
              <div className="thumb">{book.emoji || "📔"}</div>

              <div>
                <h3>{book.title}</h3>

                <div className="muted">
                  Updated {book.updated || "just now"}
                </div>
              </div>

              <strong>{book.pages || 1} Page</strong>
            </div>
          ))
        )}

        <div className="shortcuts">
          <button onClick={() => setSection("templates")}>📚 Templates</button>

          <button onClick={() => flash("Stickers coming soon ✨")}>
            ✨ Stickers
          </button>

          <button onClick={() => flash("Fonts coming soon 🎨")}>🎨 Fonts</button>

          <button onClick={() => flash("Backgrounds coming soon 🖼️")}>
            🖼️ Backgrounds
          </button>
        </div>
      </div>

      <div className="bottom">
        <button onClick={() => setSection("home")}>🏠</button>
        <button onClick={() => setSection("search")}>🔍</button>
        <button className="plus" onClick={() => setSection("create")}>
          ＋
        </button>
        <button onClick={() => setSection("templates")}>📚</button>
        <button onClick={() => setSection("profile")}>👤</button>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
