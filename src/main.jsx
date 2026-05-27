import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

import { auth, db, storage } from "./firebase";

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

function makeId() {
  return crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

const BACKGROUNDS = [
  { name: "Cream", value: "cream" },
  { name: "Baby Pink", value: "pink" },
  { name: "Baby Blue", value: "blue" },
  { name: "Lavender", value: "lavender" },
  { name: "Grid", value: "grid" },
  { name: "Dots", value: "dots" },
  { name: "Paper", value: "paper" },
];

const STICKERS = [
  "♡",
  "❤",
  "✿",
  "🌼",
  "🎀",
  "⭐",
  "🧸",
  "🍼",
  "👶",
  "🦋",
];

function createText(text, x, y) {
  return {
    id: makeId(),
    type: "text",
    text,
    x,
    y,
    w: 180,
    h: 60,
    rotate: 0,
    fontSize: 24,
  };
}

function createSticker(sticker, x, y) {
  return {
    id: makeId(),
    type: "sticker",
    text: sticker,
    x,
    y,
    w: 60,
    h: 60,
    rotate: 0,
    fontSize: 36,
  };
}

function createPhoto(x, y) {
  return {
    id: makeId(),
    type: "photo",
    src: "",
    x,
    y,
    w: 220,
    h: 220,
    rotate: 0,
    crop: "cover",
    cropX: 50,
    cropY: 50,
  };
}

function App() {
  const [user, setUser] = useState(null);

  const [screen, setScreen] = useState("home");

  const [books, setBooks] = useState([]);

  const [book, setBook] = useState(null);

  const [pageIndex, setPageIndex] = useState(0);

  const [selectedId, setSelectedId] = useState(null);

  const [selectedBookMenu, setSelectedBookMenu] = useState(null);

  const [showStickerPopup, setShowStickerPopup] = useState(false);

  const [showBackgroundPopup, setShowBackgroundPopup] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [toast, setToast] = useState("");

  const [drag, setDrag] = useState(null);

  const [history, setHistory] = useState([]);

  const [future, setFuture] = useState([]);

  const [isSubscribed, setIsSubscribed] = useState(false);

  const [authMode, setAuthMode] = useState("login");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const page = book?.pages?.[pageIndex];

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        loadBooks(u.uid);
      }
    });
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedId
      ) {
        deleteSelected();
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId, book]);

  function showToast(message) {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 1800);
  }

  async function loadBooks(uid) {
    const q = query(
      collection(db, "users", uid, "books"),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    setBooks(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
    );
  }

  async function handleAuth() {
    if (!email || !password) {
      alert("Enter email and password.");
      return;
    }

    if (authMode === "signup") {
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
    } else {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
    }
  }

  async function resetPassword() {
    if (!email) {
      alert("Enter your email first.");
      return;
    }

    await sendPasswordResetEmail(auth, email);

    showToast("Password reset email sent.");
  }

  async function saveBook(nextBook = book) {
    if (!user || !nextBook) return;

    if (nextBook.id) {
      await updateDoc(
        doc(db, "users", user.uid, "books", nextBook.id),
        {
          ...nextBook,
          updatedAt: serverTimestamp(),
        }
      );
    } else {
      const added = await addDoc(
        collection(db, "users", user.uid, "books"),
        {
          ...nextBook,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      nextBook.id = added.id;

      setBook({ ...nextBook });
    }

    loadBooks(user.uid);

    showToast("Scrapbook saved!");
  }

  function createBlankBook() {
    const newBook = {
      title: "My Scrapbook",
      background: "cream",
      pages: [
        {
          id: makeId(),
          background: "cream",
          elements: [
            createText("My Scrapbook", 80, 40),
            createPhoto(80, 140),
            createSticker("♡", 40, 380),
          ],
        },
      ],
    };

    setBook(newBook);

    setPageIndex(0);

    setHistory([]);

    setFuture([]);

    setScreen("editor");
  }

  function pushHistory(current = book) {
    if (!current) return;

    setHistory((prev) => [
      ...prev,
      JSON.parse(JSON.stringify(current)),
    ]);

    setFuture([]);
  }

  function updatePage(nextPage) {
    pushHistory(book);

    const pages = [...book.pages];

    pages[pageIndex] = nextPage;

    setBook({
      ...book,
      pages,
    });
  }

  function updateElement(id, changes) {
    updatePage({
      ...page,
      elements: page.elements.map((el) =>
        el.id === id
          ? {
              ...el,
              ...changes,
            }
          : el
      ),
    });
  }

  function addText() {
    updatePage({
      ...page,
      elements: [
        ...page.elements,
        createText("tap to edit", 80, 80),
      ],
    });
  }

  function addSticker(sticker) {
    updatePage({
      ...page,
      elements: [
        ...page.elements,
        createSticker(sticker, 120, 150),
      ],
    });

    setShowStickerPopup(false);
  }

  function addPhoto() {
    updatePage({
      ...page,
      elements: [
        ...page.elements,
        createPhoto(70, 120),
      ],
    });
  }

  function addPage() {
    pushHistory(book);

    setBook({
      ...book,
      pages: [
        ...book.pages,
        {
          id: makeId(),
          background: "cream",
          elements: [],
        },
      ],
    });

    setPageIndex(book.pages.length);
  }

  function deleteSelected() {
    if (!selectedId) return;

    updatePage({
      ...page,
      elements: page.elements.filter(
        (el) => el.id !== selectedId
      ),
    });

    setSelectedId(null);
  }

  function undo() {
    if (history.length === 0) return;

    const previous =
      history[history.length - 1];

    setFuture((prev) => [
      JSON.parse(JSON.stringify(book)),
      ...prev,
    ]);

    setHistory((prev) =>
      prev.slice(0, -1)
    );

    setBook(previous);
  }

  function redo() {
    if (future.length === 0) return;

    const next = future[0];

    setHistory((prev) => [
      ...prev,
      JSON.parse(JSON.stringify(book)),
    ]);

    setFuture((prev) =>
      prev.slice(1)
    );

    setBook(next);
  }

  async function renameBook(bookToRename = book) {
    const newTitle = window.prompt(
      "Rename scrapbook:",
      bookToRename.title
    );

    if (!newTitle?.trim()) return;

    const updated = {
      ...bookToRename,
      title: newTitle.trim(),
    };

    setBook(updated);

    if (updated.id && user) {
      await updateDoc(
        doc(
          db,
          "users",
          user.uid,
          "books",
          updated.id
        ),
        {
          title: updated.title,
          updatedAt: serverTimestamp(),
        }
      );

      loadBooks(user.uid);
    }

    showToast("Scrapbook renamed!");
  }
  function getPoint(e) {
    if (e.touches?.[0]) {
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }

    return {
      x: e.clientX,
      y: e.clientY,
    };
  }

  function startDrag(e, el, mode = "move") {
    e.stopPropagation();

    setSelectedId(el.id);

    const point = getPoint(e);

    setDrag({
      id: el.id,
      mode,
      startX: point.x,
      startY: point.y,
      startEl: { ...el },
    });
  }

  function onMove(e) {
    if (!drag) return;

    const point = getPoint(e);

    const dx = point.x - drag.startX;

    const dy = point.y - drag.startY;

    const el = drag.startEl;

    if (drag.mode === "move") {
      updateElement(drag.id, {
        x: el.x + dx,
        y: el.y + dy,
      });
    }

    if (drag.mode === "resize") {
      updateElement(drag.id, {
        w: Math.max(40, el.w + dx),
        h: Math.max(40, el.h + dy),
      });
    }

    if (drag.mode === "rotate") {
      updateElement(drag.id, {
        rotate: el.rotate + dx,
      });
    }
  }

  async function uploadImage(elementId, file) {
    if (!file || !user) return;

    const imageRef = ref(
      storage,
      `scrapbooks/${user.uid}/${makeId()}-${file.name}`
    );

    await uploadBytes(imageRef, file);

    const url = await getDownloadURL(imageRef);

    updatePage({
      ...page,
      elements: page.elements.map((el) =>
        el.id === elementId
          ? {
              ...el,
              src: url,
            }
          : el
      ),
    });
  }

  if (!user) {
    return (
      <div className="loginPage">
        <div className="loginCard">
          <h1>Pocket Scrapbook 💗</h1>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAuth();
              }
            }}
          />

          <div className="passwordWrap">
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAuth();
                }
              }}
            />

            <button
              className="showPasswordBtn"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
            >
              {showPassword
                ? "Hide"
                : "Show"}
            </button>
          </div>

          <button
            className="mainBtn"
            onClick={handleAuth}
          >
            {authMode === "login"
              ? "Log In"
              : "Create Account"}
          </button>

          <button
            className="textBtn"
            onClick={resetPassword}
          >
            Forgot password?
          </button>

          <button
            className="textBtn"
            onClick={() =>
              setAuthMode(
                authMode === "login"
                  ? "signup"
                  : "login"
              )
            }
          >
            {authMode === "login"
              ? "Create account"
              : "Already have an account?"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {toast && (
        <div className="toastCard">
          <div className="toastTitle">
            Pocket Scrapbook
          </div>

          <div className="toastMessage">
            {toast}
          </div>
        </div>
      )}

      {screen === "home" && (
        <div className="home">
          <div className="topBar">
            <h1>Pocket Scrapbook 💗</h1>

            <button
              onClick={() =>
                setScreen("profile")
              }
            >
              👤
            </button>
          </div>

          <button
            className="createCard"
            onClick={createBlankBook}
          >
            ＋ Create Scrapbook
          </button>

          <div className="booksGrid">
            {books.map((b) => (
              <div
                className="bookCard"
                key={b.id}
                onClick={() => {
                  setBook(b);

                  setPageIndex(0);

                  setScreen("editor");
                }}
              >
                <div className="bookPreview">
                  {b.pages?.[0]
                    ?.elements?.[0]?.text ||
                    "Scrapbook"}
                </div>

                <div className="bookInfo">
                  <b>{b.title}</b>

                  <small>
                    {b.pages?.length || 1}
                    {" "}pages
                  </small>
                </div>

                <button
                  className="menuBtn"
                  onClick={(e) => {
                    e.stopPropagation();

                    setSelectedBookMenu(
                      selectedBookMenu ===
                        b.id
                        ? null
                        : b.id
                    );
                  }}
                >
                  ⋯
                </button>

                {selectedBookMenu ===
                  b.id && (
                  <div className="bookMenu">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        setBook(b);

                        setPageIndex(0);

                        setScreen(
                          "flipbook"
                        );

                        setSelectedBookMenu(
                          null
                        );
                      }}
                    >
                      📖 View Flipbook
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        renameBook(b);

                        setSelectedBookMenu(
                          null
                        );
                      }}
                    >
                      ✏️ Rename
                    </button>

                    <button
                      onClick={() =>
                        showToast(
                          "Export coming soon."
                        )
                      }
                    >
                      ⬇️ Export
                    </button>

                    <button
                      onClick={async (
                        e
                      ) => {
                        e.stopPropagation();

                        const sure =
                          window.confirm(
                            "Delete scrapbook?"
                          );

                        if (sure) {
                          await deleteDoc(
                            doc(
                              db,
                              "users",
                              user.uid,
                              "books",
                              b.id
                            )
                          );

                          loadBooks(
                            user.uid
                          );
                        }
                      }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {screen === "profile" && (
        <div className="panel">
          <button
            onClick={() =>
              setScreen("home")
            }
          >
            ← Back
          </button>

          <div className="settingsList">
            <button
              className="settingsItem"
              onClick={() => {
                document.body.classList.toggle(
                  "darkTheme"
                );

                showToast(
                  "Theme changed!"
                );
              }}
            >
              🎨 Theme Settings
            </button>

            <button
              className="settingsItem"
              onClick={() =>
                showToast(
                  "Notifications enabled!"
                )
              }
            >
              🔔 Notifications
            </button>

            <button
              className="settingsItem"
              onClick={() =>
                setScreen(
                  "subscribe"
                )
              }
            >
              👑 Subscription
            </button>

            <button
              className="settingsItem"
              onClick={() =>
                showToast(
                  "Your scrapbooks are private."
                )
              }
            >
              🔒 Privacy
            </button>

            <button
              className="settingsItem"
              onClick={() =>
                showToast(
                  "Backup synced!"
                )
              }
            >
              ☁ Backup & Sync
            </button>

            <button
              className="settingsItem logoutBtn"
              onClick={() =>
                signOut(auth)
              }
            >
              🚪 Log Out
            </button>
          </div>
        </div>
      )}

      {screen === "editor" &&
        book &&
        page && (
          <div className="editor">
            <header>
              <button
                onClick={() =>
                  setScreen("home")
                }
              >
                ←
              </button>

              <button
                onClick={undo}
              >
                Undo
              </button>

              <button
                onClick={redo}
              >
                Redo
              </button>

              <button
                onClick={() =>
                  saveBook()
                }
              >
                Save
              </button>
            </header>

            <main
              className={`canvas bg-${page.background}`}
              onMouseMove={onMove}
              onMouseUp={() =>
                setDrag(null)
              }
              onTouchMove={onMove}
              onTouchEnd={() =>
                setDrag(null)
              }
            >
              {page.elements.map(
                (el) => (
                  <div
                    key={el.id}
                    className={`element ${
                      selectedId ===
                      el.id
                        ? "selected"
                        : ""
                    }`}
                    style={{
                      left: el.x,
                      top: el.y,
                      width: el.w,
                      height: el.h,
                      transform: `rotate(${el.rotate}deg)`,
                    }}
                    onMouseDown={(e) =>
                      startDrag(
                        e,
                        el
                      )
                    }
                    onTouchStart={(e) =>
                      startDrag(
                        e,
                        el
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();

                      setSelectedId(
                        el.id
                      );
                    }}
                  >
                    {el.type ===
                      "text" && (
                      <textarea
                        value={el.text}
                        onChange={(
                          e
                        ) =>
                          updateElement(
                            el.id,
                            {
                              text:
                                e
                                  .target
                                  .value,
                            }
                          )
                        }
                        style={{
                          fontSize:
                            el.fontSize,
                        }}
                      />
                    )}

                    {el.type ===
                      "sticker" && (
                      <div
                        className="sticker"
                      >
                        {el.text}
                      </div>
                    )}

                    {el.type ===
                      "photo" && (
                      <label className="photoBox">
                        {el.src ? (
                          <img
                            src={
                              el.src
                            }
                            style={{
                              objectFit:
                                el.crop,
                              objectPosition: `${el.cropX}% ${el.cropY}%`,
                            }}
                          />
                        ) : (
                          <span>
                            ＋ Photo
                          </span>
                        )}

                        <input
                          hidden
                          type="file"
                          accept="image/*"
                          onChange={(
                            e
                          ) =>
                            uploadImage(
                              el.id,
                              e
                                .target
                                .files[0]
                            )
                          }
                        />
                      </label>
                    )}
                  </div>
                )
              )}
            </main>

            <section className="toolbar">
              <button
                onClick={addPhoto}
              >
                Photo
              </button>

              <button
                onClick={addText}
              >
                Text
              </button>

              <button
                onClick={() =>
                  setShowStickerPopup(
                    true
                  )
                }
              >
                Stickers
              </button>

              <button
                onClick={() =>
                  setShowBackgroundPopup(
                    true
                  )
                }
              >
                Backgrounds
              </button>

              <button
                onClick={addPage}
              >
                Add Page
              </button>

              <button
                onClick={
                  deleteSelected
                }
              >
                Delete
              </button>
            </section>

            {showStickerPopup && (
              <div className="popupOverlay">
                <div className="popup">
                  <h2>
                    Stickers
                  </h2>

                  <div className="popupGrid">
                    {STICKERS.map(
                      (s) => (
                        <button
                          key={s}
                          onClick={() =>
                            addSticker(
                              s
                            )
                          }
                        >
                          {s}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setShowStickerPopup(
                        false
                      )
                    }
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {showBackgroundPopup && (
              <div className="popupOverlay">
                <div className="popup">
                  <h2>
                    Backgrounds
                  </h2>

                  <div className="popupGrid">
                    {BACKGROUNDS.map(
                      (bg) => (
                        <button
                          key={
                            bg.value
                          }
                          onClick={() => {
                            updatePage(
                              {
                                ...page,
                                background:
                                  bg.value,
                              }
                            );

                            setShowBackgroundPopup(
                              false
                            );
                          }}
                        >
                          {bg.name}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setShowBackgroundPopup(
                        false
                      )
                    }
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(<App />);
