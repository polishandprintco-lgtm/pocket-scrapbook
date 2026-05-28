import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function photo(x, y, w = 120, h = 120) {
  return {
    type: "photo",
    x,
    y,
    w,
    h,
    src: ""
  };
}

function text(value, x, y) {
  return {
    type: "text",
    value,
    x,
    y
  };
}

function sticker(name, x, y) {
  return {
    type: "sticker",
    value: name,
    x,
    y
  };
}

function firstTemplate() {
  return {
    title: "My First Scrapbook",
    pages: [
      {
        bg: "#f7efe7",
        elements: [
          text("About Me ♡", 95, 35),
          photo(60, 110),
          text("My favorite things:", 235, 140),
          sticker("♡", 305, 300)
        ]
      },
      {
        bg: "#f7efe7",
        elements: [
          text("My Family ♡", 85, 35),
          photo(55, 115),
          photo(225, 115),
          sticker("✿", 320, 290)
        ]
      },
      {
        bg: "#f7efe7",
        elements: [
          text("Places I've Been ♡", 45, 35),
          photo(70, 120),
          photo(230, 120),
          sticker("☁", 310, 305)
        ]
      },
      {
        bg: "#f7efe7",
        elements: [
          text("Special Memories ♡", 40, 35),
          photo(55, 105),
          photo(225, 105),
          photo(55, 270),
          photo(225, 270)
        ]
      },
      {
        bg: "#f7efe7",
        elements: [
          text("Goals & Dreams ♡", 45, 35),
          text("Things I want to do:", 50, 120),
          text("Dreams for my future:", 210, 120),
          sticker("★", 320, 290)
        ]
      }
    ]
  };
}

function App() {
  const [screen, setScreen] = useState("home");
  const [selectedBook, setSelectedBook] = useState(null);
  const [page, setPage] = useState(0);
  const [showStickers, setShowStickers] = useState(false);
  const [showBackgrounds, setShowBackgrounds] = useState(false);

  const [books, setBooks] = useState([
    firstTemplate()
  ]);

  const stickers = [
    "♡","♥","✿","☁","★","☾","✧","❀","🧸","🎀"
  ];

  const backgrounds = [
    "#fff6f8",
    "#f7efe7",
    "#f6f0ff",
    "#eef7ff",
    "#fffdf1"
  ];

  function updateElement(index, updates) {
    const copy = [...books];

    Object.assign(
      copy[selectedBook].pages[page].elements[index],
      updates
    );

    setBooks(copy);
  }

  return (
    <div className="app">

      {screen === "home" && (
        <div className="homeWrap">

          <div className="hero">
            <h1>Pocket Scrapbook ♡</h1>
            <p>Create beautiful memories</p>

            <button
              className="mainBtn"
              onClick={() => setScreen("templates")}
            >
              Open Templates
            </button>

            <button
              className="secondaryBtn"
              onClick={() => setScreen("profile")}
            >
              Profile
            </button>
          </div>

          <div className="booksGrid">
            {books.map((book, i) => (
              <div
                key={i}
                className="bookCard"
                onClick={() => {
                  setSelectedBook(i);
                  setScreen("editor");
                }}
              >
                <div className="bookPreview"></div>

                <h3>{book.title}</h3>

                <p>
                  {book.pages.length} Pages
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {screen === "profile" && (
        <div className="panel">

          <button
            className="backBtn"
            onClick={() => setScreen("home")}
          >
            ← Back
          </button>

          <h2>Profile Settings</h2>

          <div className="setting">
            Theme Toggle
          </div>

          <div className="setting">
            Notifications
          </div>

          <div className="setting">
            Privacy
          </div>

          <button
            className="logoutBtn"
            onClick={() => setScreen("home")}
          >
            Log Out
          </button>
        </div>
      )}

      {screen === "templates" && (
        <div className="panel">

          <button
            className="backBtn"
            onClick={() => setScreen("home")}
          >
            ← Back
          </button>

          <h2>Templates</h2>

          <div className="templateCard">
            <h3>My First Scrapbook</h3>
            <p>Free Template</p>
          </div>

          <div className="templateCard premium">
            <h3>Baby’s First Year</h3>
            <p>Premium - Coming Soon</p>
          </div>

        </div>
      )}

      {screen === "editor" && selectedBook !== null && (
        <div className="editorWrap">

          <div className="topBar">

            <button
              className="backBtn"
              onClick={() => setScreen("home")}
            >
              ← Home
            </button>

            <div className="pageCount">
              Page {page + 1}
            </div>

          </div>

          <div
            className="scrapbookPage"
            style={{
              background:
                books[selectedBook].pages[page].bg
            }}
          >

            {books[selectedBook]
              .pages[page]
              .elements.map((el, index) => (

              <div
                key={index}
                className="element"
                style={{
                  left: el.x,
                  top: el.y
                }}
              >

                {el.type === "photo" && (
                  <label>

                    {el.src ? (
                      <img
                        src={el.src}
                        className="photo"
                      />
                    ) : (
                      <div className="photoPlaceholder">
                        + Photo
                      </div>
                    )}

                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        const file =
                          e.target.files[0];

                        if (!file) return;

                        const reader =
                          new FileReader();

                        reader.onload = () => {
                          updateElement(index, {
                            src: reader.result
                          });
                        };

                        reader.readAsDataURL(file);
                      }}
                    />

                  </label>
                )}

                {el.type === "text" && (
                  <textarea
                    value={el.value}
                    className="textBox"
                    onChange={(e) =>
                      updateElement(index, {
                        value: e.target.value
                      })
                    }
                  />
                )}

                {el.type === "sticker" && (
                  <div className="sticker">
                    {el.value}
                  </div>
                )}

              </div>
            ))}

          </div>

          <div className="toolbar">

            <button
              onClick={() =>
                setShowStickers(true)
              }
            >
              Stickers
            </button>

            <button
              onClick={() =>
                setShowBackgrounds(true)
              }
            >
              Backgrounds
            </button>

            <button
              onClick={() => {
                const copy = [...books];

                copy[selectedBook]
                  .pages.push({
                    bg: "#fff6f8",
                    elements: []
                  });

                setBooks(copy);
              }}
            >
              Add Page
            </button>

          </div>

          {showStickers && (
            <div className="popup">

              <div className="popupInner">

                <h3>Choose Sticker</h3>

                <div className="stickersGrid">
                  {stickers.map((s, i) => (
                    <button
                      key={i}
                      className="stickerBtn"
                      onClick={() => {

                        const copy = [...books];

                        copy[selectedBook]
                          .pages[page]
                          .elements.push(
                            sticker(s, 120, 120)
                          );

                        setBooks(copy);

                        setShowStickers(false);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <button
                  className="closeBtn"
                  onClick={() =>
                    setShowStickers(false)
                  }
                >
                  Close
                </button>

              </div>
            </div>
          )}

          {showBackgrounds && (
            <div className="popup">

              <div className="popupInner">

                <h3>Choose Background</h3>

                <div className="bgGrid">
                  {backgrounds.map((bg, i) => (
                    <button
                      key={i}
                      className="bgChoice"
                      style={{
                        background: bg
                      }}
                      onClick={() => {

                        const copy = [...books];

                        copy[selectedBook]
                          .pages[page]
                          .bg = bg;

                        setBooks(copy);

                        setShowBackgrounds(false);
                      }}
                    />
                  ))}
                </div>

                <button
                  className="closeBtn"
                  onClick={() =>
                    setShowBackgrounds(false)
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
).render(
  <App />
);
