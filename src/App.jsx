import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";

import { auth, db } from "./firebase";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [screen, setScreen] = useState("home");

  const [scrapbooks, setScrapbooks] = useState([
    {
      id: 1,
      name: "My First Scrapbook",
      pages: 12
    }
  ]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const ref = doc(db, "users", currentUser.uid);

        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();

          if (data.scrapbooks) {
            setScrapbooks(data.scrapbooks);
          }
        }
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  async function saveScrapbooks(updated) {
    if (!user) return;

    await setDoc(doc(db, "users", user.uid), {
      scrapbooks: updated
    });

    alert("Scrapbook saved ♡");
  }

  async function handleSignup() {
    try {
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleLogin() {
    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleLogout() {
    await signOut(auth);
  }

  function addScrapbook() {
    const updated = [
      ...scrapbooks,
      {
        id: Date.now(),
        name: "New Scrapbook",
        pages: 1
      }
    ];

    setScrapbooks(updated);

    saveScrapbooks(updated);
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="appBg">
        <div className="phoneShell">
          <div className="authCard">
            <h1>Pocket Scrapbook ♡</h1>

            <p>Create beautiful memories</p>

            <input
              placeholder="Email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button onClick={handleLogin}>
              Login
            </button>

            <button
              className="secondaryBtn"
              onClick={handleSignup}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="appBg">
      <div className="phoneShell">

        <div className="topHeader">
          <h1>Pocket Scrapbook</h1>

          <p>♡ cherish every moment</p>
        </div>

        {screen === "home" && (
          <>
            <button
              className="mainCreateBtn"
              onClick={addScrapbook}
            >
              Create Scrapbook
            </button>

            <div className="sectionTitle">
              My Scrapbooks
            </div>

            <div className="scrapbookList">
              {scrapbooks.map((book) => (
                <div
                  key={book.id}
                  className="scrapbookCard"
                  onClick={() =>
                    setScreen("editor")
                  }
                >
                  <div>
                    <h3>{book.name}</h3>

                    <p>
                      {book.pages} pages
                    </p>
                  </div>

                  <button className="dotsBtn">
                    ⋮
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {screen === "editor" && (
          <div className="editorPage">

            <div className="editorHeader">
              <button
                onClick={() =>
                  setScreen("home")
                }
              >
                ←
              </button>

              <h2>My First Scrapbook</h2>

              <button
                onClick={() =>
                  alert("Saved ♡")
                }
              >
                Save
              </button>
            </div>

            <div className="scrapbookPaper">

              <div className="photoFrame"></div>

              <h3>About Me ♡</h3>

              <p>My name:</p>

              <p>Birthday:</p>

            </div>

            <div className="toolbar">
              <button>Photo</button>
              <button>Sticker</button>
              <button>Text</button>
              <button>Background</button>
              <button>Add Page</button>
            </div>

          </div>
        )}

        {screen === "profile" && (
          <div className="profilePage">

            <h2>Profile Settings</h2>

            <button>
              Upload Profile Picture
            </button>

            <button>
              Notifications
            </button>

            <button>
              Privacy
            </button>

            <button
              className="logoutBtn"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>
        )}

        <div className="bottomNav">

          <button
            onClick={() =>
              setScreen("home")
            }
          >
            Home
          </button>

          <button>
            Templates
          </button>

          <button>
            Premium
          </button>

          <button
            onClick={() =>
              setScreen("profile")
            }
          >
            Profile
          </button>

        </div>

      </div>
    </div>
  );
}
