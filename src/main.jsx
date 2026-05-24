
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
  serverTimestamp
} from "firebase/firestore";

import "./style.css";

const demoBooks = [
  {
    title: "Summer Memories ☀️",
    pages: 18,
    emoji: "🌅",
    updated: "2 days ago"
  },
  {
    title: "Baby Aria 🎀",
    pages: 24,
    emoji: "💐",
    updated: "1 week ago"
  },
  {
    title: "Italy Trip 🇮🇹",
    pages: 32,
    emoji: "🇮🇹",
    updated: "3 weeks ago"
  }
];

function App() {

  const [page, setPage] = useState("welcome");
  const [toast, setToast] = useState("");
  const [user, setUser] = useState(null);

  function flash(message) {

    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 3000);

  }

  useEffect(() => {

    const unsub = onAuthStateChanged(auth, (u) => {

      if (u) {
        setUser(u);
        setPage("home");
      } else {
        setUser(null);
      }

    });

    return () => unsub();

  }, []);

  return (
    <div className="appShell">

      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}

      {page === "welcome" && (
        <Welcome go={setPage} />
      )}

      {page === "login" && (
        <Login
          go={setPage}
          flash={flash}
        />
      )}

      {page === "signup" && (
        <Signup
          go={setPage}
          flash={flash}
        />
      )}

      {page === "forgot" && (
        <Forgot
          go={setPage}
          flash={flash}
        />
      )}

      {page === "home" && (
        <Home
          user={user}
          flash={flash}
        />
      )}

    </div>
  );
}

/* ---------------- WELCOME ---------------- */

function Welcome({ go }) {

  return (
    <div className="phone">

      <div className="screen paper auth-page">

        <div className="auth-logo">
          💖 Pocket Scrapbook
        </div>

        <h1>
          Turn your memories into beautiful stories
        </h1>

        <p className="auth-sub">
          Save your sweetest memories,
          milestones, and magical moments.
        </p>

        <div className="hero">
          🌼 🖼️ 🦋
        </div>

        <div className="auth-card">

          <button
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

      </div>

    </div>
  );
}

/* ---------------- LOGIN ---------------- */

function Login({ go, flash }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit() {

    try {

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      flash("Logged in 💖");

      go("home");

    } catch (e) {

      flash(
        "Login error: " + e.message
      );

    }

  }

  return (
    <div className="phone">

      <div className="screen paper auth-page">

        <div className="auth-logo">
          💖 Pocket Scrapbook
        </div>

        <h1>
          Welcome Back ✨
        </h1>

        <p className="auth-sub">
          Continue your magical scrapbook journey.
        </p>

        <div className="auth-card">

          <input
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <div className="passwordWrap">

            <input
              placeholder="Password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button
              className="showBtn"
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? "🙈" : "👁️"}
            </button>

          </div>

          <button onClick={submit}>
            Login ✨
          </button>

        </div>

        <button
          className="text-btn"
          onClick={() => go("forgot")}
        >
          Forgot Password?
        </button>

        <button
          className="text-btn"
          onClick={() => go("signup")}
        >
          Need an account?
        </button>

      </div>

    </div>
  );
}

/* ---------------- SIGNUP ---------------- */

function Signup({ go, flash }) {

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  async function submit() {

    try {

      if (
        !name ||
        !username ||
        !email ||
        !password
      ) {
        throw new Error(
          "Fill in every field."
        );
      }

      if (password.length < 6) {
        throw new Error(
          "Password must be at least 6 characters."
        );
      }

      if (password !== confirm) {
        throw new Error(
          "Passwords do not match."
        );
      }

      const cred =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      await updateProfile(
        cred.user,
        {
          displayName: name
        }
      );

      await addDoc(
        collection(db, "profiles"),
        {
          uid: cred.user.uid,
          name,
          username,
          email: email.trim(),
          createdAt: serverTimestamp()
        }
      );

      flash("Account created 💖");

      go("home");

    } catch (e) {

      flash(
        "Signup error: " + e.message
      );

    }

  }

  return (
    <div className="phone">

      <div className="screen paper auth-page">

        <div className="auth-logo">
          🎀 Join Pocket Scrapbook
        </div>

        <h1>
          Create Your Dream Scrapbook ✨
        </h1>

        <p className="auth-sub">
          Store photos, memories,
          and magical moments forever.
        </p>

        <div className="auth-card">

          <input
            placeholder="Full Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <input
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <div className="passwordWrap">

            <input
              placeholder="Password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button
              className="showBtn"
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? "🙈" : "👁️"}
            </button>

          </div>

          <div className="passwordWrap">

            <input
              placeholder="Confirm Password"
              type={
                showConfirm
                  ? "text"
                  : "password"
              }
              value={confirm}
              onChange={(e) =>
                setConfirm(e.target.value)
              }
            />

            <button
              className="showBtn"
              onClick={() =>
                setShowConfirm(!showConfirm)
              }
            >
              {showConfirm ? "🙈" : "👁️"}
            </button>

          </div>

          <button onClick={submit}>
            💖 Create Account
          </button>

        </div>

        <button
          className="text-btn"
          onClick={() => go("login")}
        >
          Already have an account?
        </button>

      </div>

    </div>
  );
}

/* ---------------- FORGOT ---------------- */

function Forgot({ go, flash }) {

  const [email, setEmail] = useState("");

  async function reset() {

    try {

      await sendPasswordResetEmail(
        auth,
        email.trim()
      );

      flash("Reset email sent 💌");

      go("login");

    } catch (e) {

      flash(
        "Reset error: " + e.message
      );

    }

  }

  return (
    <div className="phone">

      <div className="screen paper auth-page">

        <div className="auth-logo">
          💌 Reset Password
        </div>

        <h1>
          Forgot Password?
        </h1>

        <p className="auth-sub">
          Enter your email to receive a reset link.
        </p>

        <div className="auth-card">

          <input
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <button onClick={reset}>
            Send Reset Link
          </button>

        </div>

        <button
          className="text-btn"
          onClick={() => go("login")}
        >
          Back to Login
        </button>

      </div>

    </div>
  );
}

/* ---------------- HOME ---------------- */

function Home({ user, flash }) {
  const [section, setSection] = useState("home");
  const [books, setBooks] = useState([]);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");

  async function logout() {
    await signOut(auth);
    flash("Logged out ✨");
    window.location.reload();
  }

  async function createBook() {
    if (!title.trim()) {
      flash("Add a scrapbook title 💕");
      return;
    }

    const newBook = {
      title: title.trim(),
      pages: 1,
      emoji: "📔",
      updated: "just now"
    };

    setBooks([newBook, ...books]);

    if (user) {
      await addDoc(collection(db, "scrapbooks"), {
        uid: user.uid,
        title: title.trim(),
        pages: 1,
        createdAt: serverTimestamp()
      });
    }

    setTitle("");
    flash("Scrapbook created 💖");
    setSection("home");
  }

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(search.toLowerCase())
  );

  if (section === "create") {
    return (
      <div className="phone">
        <div className="screen paper auth-page">
          <button className="text-btn" onClick={() => setSection("home")}>← Back</button>
          <h1>Create Scrapbook ✨</h1>
          <p className="auth-sub">Name your new memory book.</p>

          <div className="auth-card">
            <input
              placeholder="Scrapbook title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <button onClick={createBook}>
              Create 💖
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (section === "search") {
    return (
      <div className="phone">
        <div className="screen paper">
          <button className="text-btn" onClick={() => setSection("home")}>← Back</button>
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
              <div className="bookCard" key={book.title}>
                <div className="thumb">{book.emoji}</div>
                <div>
                  <h3>{book.title}</h3>
                  <div className="muted">Updated {book.updated}</div>
                </div>
                <strong>{book.pages} Page</strong>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (section === "templates") {
    const templates = ["Baby Book 🎀", "Wedding 💍", "Travel ✈️", "Family Memories 💖", "Summer Book ☀️"];

    return (
      <div className="phone">
        <div className="screen paper">
          <button className="text-btn" onClick={() => setSection("home")}>← Back</button>
          <h1>Templates 📚</h1>

          {templates.map((template) => (
            <div className="bookCard" key={template}>
              <div className="thumb">📖</div>
              <div>
                <h3>{template}</h3>
                <p className="muted">Ready-made scrapbook layout</p>
              </div>
              <button onClick={() => {
                setTitle(template);
                setSection("create");
              }}>
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
          <button className="text-btn" onClick={() => setSection("home")}>← Back</button>

          <div className="auth-logo">👤 Profile</div>

          <h1>{user?.displayName || "Pocket User"}</h1>
          <p className="auth-sub">{user?.email}</p>

          <div className="auth-card">
            <p>Scrapbooks: <b>{books.length}</b></p>
            <p>Pages created: <b>{books.length}</b></p>
            <p>Theme: <b>Soft Pink</b></p>
          </div>

          <button onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="phone">
      <div className="screen paper">
        <div className="top">
          <button className="iconBtn" onClick={() => flash("Menu coming soon ✨")}>☰</button>
          <div className="brand">Pocket<span>Scrapbook</span></div>
          <button className="iconBtn" onClick={() => flash("No new notifications 🔔")}>🔔</button>
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
          <button className="text-btn" onClick={() => setSection("search")}>See All</button>
        </div>

        {books.length === 0 ? (
          <p className="muted">No scrapbooks yet. Create your first one 💕</p>
        ) : (
          books.map((book) => (
            <div className="bookCard" key={book.title}>
              <div className="thumb">{book.emoji}</div>
              <div>
                <h3>{book.title}</h3>
                <div className="muted">Updated {book.updated}</div>
              </div>
              <strong>{book.pages} Page</strong>
            </div>
          ))
        )}

        <div className="shortcuts">
          <button onClick={() => setSection("templates")}>📚 Templates</button>
          <button onClick={() => flash("Stickers coming soon ✨")}>✨ Stickers</button>
          <button onClick={() => flash("Fonts coming soon 🎨")}>🎨 Fonts</button>
          <button onClick={() => flash("Backgrounds coming soon 🖼️")}>🖼️ Backgrounds</button>
        </div>
      </div>

      <div className="bottom">
        <button onClick={() => setSection("home")}>🏠</button>
        <button onClick={() => setSection("search")}>🔍</button>
        <button className="plus" onClick={() => setSection("create")}>＋</button>
        <button onClick={() => setSection("templates")}>📚</button>
        <button onClick={() => setSection("profile")}>👤</button>
      </div>
    </div>
  );
}
createRoot(
  document.getElementById("root")
).render(
  <App />
);
