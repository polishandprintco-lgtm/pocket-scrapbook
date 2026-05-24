
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

  async function logout() {
    await signOut(auth);
    flash("Logged out ✨");
    window.location.reload();
  }

  if (section === "create") {
    return (
      <div className="phone">
        <div className="screen paper auth-page">
          <button className="text-btn" onClick={() => setSection("home")}>← Back</button>
          <h1>Create Scrapbook ✨</h1>
          <div className="auth-card">
            <input placeholder="Scrapbook title" />
            <button onClick={() => flash("Scrapbook created 💖")}>Create</button>
          </div>
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
          <button className="text-btn" onClick={() => flash("My Scrapbooks coming soon 📚")}>See All</button>
        </div>

        {demoBooks.map((book) => (
          <div className="bookCard" key={book.title} onClick={() => flash(`Opening ${book.title}`)}>
            <div className="thumb">{book.emoji}</div>
            <div>
              <h3>{book.title}</h3>
              <div className="muted">Updated {book.updated}</div>
            </div>
            <strong>{book.pages} Pages</strong>
          </div>
        ))}

        <div className="shortcuts">
          <button onClick={() => flash("Templates coming soon 📚")}>📚 Templates</button>
          <button onClick={() => flash("Stickers coming soon ✨")}>✨ Stickers</button>
          <button onClick={() => flash("Fonts coming soon 🎨")}>🎨 Fonts</button>
          <button onClick={() => flash("Backgrounds coming soon 🖼️")}>🖼️ Backgrounds</button>
        </div>

        <button onClick={logout}>Logout</button>
      </div>

      <div className="bottom">
        <button onClick={() => flash("Home 🏠")}>🏠</button>
        <button onClick={() => flash("Search coming soon 🔍")}>🔍</button>
        <button className="plus" onClick={() => setSection("create")}>＋</button>
        <button onClick={() => flash("Templates coming soon 📚")}>📚</button>
        <button onClick={() => flash("Profile coming soon 👤")}>👤</button>
      </div>
    </div>
  );
}
createRoot(
  document.getElementById("root")
).render(
  <App />
);
