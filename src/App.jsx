import React, { useState } from "react";

const FREE_STICKERS = [
  "💖","🎀","🌸","🧸","✨","📸","🌼","☁️",
  "🦋","🤍","📝","🕊️","🌷","⭐","🎞️","💕"
];

const BACKGROUNDS = [
  "#fff7f8",
  "#fdeef3",
  "#f6f0ff",
  "#eef7ff",
  "#fff8ee"
];

function App() {
  const [screen, setScreen] = useState("home");
  const [darkMode, setDarkMode] = useState(false);

  const [pages, setPages] = useState([
    {
      id: 1,
      background: "#fff7f8",
      elements: []
    }
  ]);

  const [currentPage, setCurrentPage] = useState(0);

  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);

  const current = pages[currentPage];

  function updateCurrentPage(data) {
    const updated = [...pages];
    updated[currentPage] = {
      ...updated[currentPage],
      ...data
    };
    setPages(updated);
  }

  function addText() {
    const updated = [...current.elements];

    updated.push({
      type: "text",
      text: "Double click to edit",
      x: 120,
      y: 120,
      size: 28,
      color: "#333",
      rotate: 0
    });

    updateCurrentPage({
      elements: updated
    });
  }

  function addSticker(sticker) {
    const updated = [...current.elements];

    updated.push({
      type: "sticker",
      sticker,
      x: 140,
      y: 140,
      size: 60,
      rotate: 0
    });

    updateCurrentPage({
      elements: updated
    });

    setShowStickerPicker(false);
  }

  function addPhoto(e) {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const updated = [...current.elements];

      updated.push({
        type: "photo",
        src: reader.result,
        x: 100,
        y: 100,
        width: 180,
        height: 180,
        rotate: 0
      });

      updateCurrentPage({
        elements: updated
      });
    };

    reader.readAsDataURL(file);
  }

  function updateElement(index, data) {
    const updated = [...current.elements];

    updated[index] = {
      ...updated[index],
      ...data
    };

    updateCurrentPage({
      elements: updated
    });
  }

  function deleteElement(index) {
    const updated = [...current.elements];

    updated.splice(index, 1);

    updateCurrentPage({
      elements: updated
    });
  }

  function addPage() {
    setPages([
      ...pages,
      {
        id: Date.now(),
        background: "#fff7f8",
        elements: []
      }
    ]);

    setCurrentPage(pages.length);
  }

  return (
    <div className={darkMode ? "app dark" : "app"}>

      {screen === "home" && (
        <div className="homeScreen">

          <div className="topBar">
            <h1>Pocket Scrapbook 💖</h1>

            <button
              className="profileBtn"
              onClick={() => setScreen("profile")}
            >
              Profile
            </button>
          </div>

          <div className="heroCard">
            <h2>Cherish every moment ✨</h2>

            <p>
              Capture, create and keep your memories close.
            </p>

            <button
              className="mainBtn"
              onClick={() => setScreen("editor")}
            >
              Open Scrapbook
            </button>
          </div>

          <div className="templateSection">
            <h2>Free Templates</h2>

            <div className="templateGrid">

              <div className="templateCard">
                <div className="templatePreview pink"></div>
                <h3>My First Scrapbook</h3>
                <p>Free</p>
              </div>

              <div className="templateCard premium">
                <div className="templatePreview blue"></div>
                <h3>Baby Boy First Year</h3>
                <p>Premium - $4.99</p>
              </div>

              <div className="templateCard premium">
                <div className="templatePreview rose"></div>
                <h3>Baby Girl First Year</h3>
                <p>Premium - $4.99</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {screen === "profile" && (
        <div className="profileScreen">

          <button
            className="backBtn"
            onClick={() => setScreen("home")}
          >
            ← Back
          </button>

          <div className="profileCard">

            <div className="avatar">
              💖
            </div>

            <h2>Pocket Scrapbook Member</h2>

            <div className="settingsList">

              <div className="settingItem">
                <span>🌙 Dark Theme</span>

                <button
                  className="toggleBtn"
                  onClick={() => setDarkMode(!darkMode)}
                >
                  {darkMode ? "ON" : "OFF"}
                </button>
              </div>

              <div className="settingItem">
                🔔 Notifications
              </div>

              <div className="settingItem">
                🔒 Privacy
              </div>

              <div className="settingItem">
                ☁️ Backup & Sync
              </div>

              <button
                className="logoutBtn"
              >
                Log Out
              </button>

            </div>
          </div>
        </div>
      )}

      {screen === "editor" && (
        <div className="editorScreen">

          <div className="editorTop">

            <button
              className="backBtn"
              onClick={() => setScreen("home")}
            >
              ← Home
            </button>

            <div className="pageCounter">
              Page {currentPage + 1}
            </div>

          </div>

          <div
            className="scrapbookPage"
            style={{
              background: current.background
            }}
          >

            {current.elements.map((el, index) => (
              <div
                key={index}
                className="element"
                style={{
                  left: el.x,
                  top: el.y,
                  transform: `rotate(${el.rotate}deg)`
                }}
              >

                {el.type === "text" && (
                  <div>

                    <textarea
                      value={el.text}
                      className="textElement"
                      style={{
                        fontSize: el.size,
                        color: el.color
                      }}
                      onChange={(e) =>
                        updateElement(index, {
                          text: e.target.value
                        })
                      }
                    />

                    <div className="controls">

                      <button
                        onClick={() =>
                          updateElement(index, {
                            rotate: el.rotate - 10
                          })
                        }
                      >
                        ↺
                      </button>

                      <button
                        onClick={() =>
                          updateElement(index, {
                            rotate: el.rotate + 10
                          })
                        }
                      >
                        ↻
                      </button>

                      <button
                        onClick={() =>
                          updateElement(index, {
                            size: el.size + 2
                          })
                        }
                      >
                        A+
                      </button>

                      <button
                        onClick={() =>
                          deleteElement(index)
                        }
                      >
                        🗑
                      </button>

                    </div>
                  </div>
                )}

                {el.type === "sticker" && (
                  <div>

                    <div
                      className="stickerElement"
                    >
                      {el.sticker}
                    </div>

                    <div className="controls">

                      <button
                        onClick={() =>
                          updateElement(index, {
                            rotate: el.rotate - 10
                          })
                        }
                      >
                        ↺
                      </button>

                      <button
                        onClick={() =>
                          updateElement(index, {
                            rotate: el.rotate + 10
                          })
                        }
                      >
                        ↻
                      </button>

                      <button
                        onClick={() =>
                          updateElement(index, {
                            size: el.size + 10
                          })
                        }
                      >
                        +
                      </button>

                      <button
                        onClick={() =>
                          deleteElement(index)
                        }
                      >
                        🗑
                      </button>

                    </div>
                  </div>
                )}

                {el.type === "photo" && (
                  <div>

                    <img
                      src={el.src}
                      className="photoElement"
                      style={{
                        width: el.width,
                        height: el.height
                      }}
                    />

                    <div className="controls">

                      <button
                        onClick={() =>
                          updateElement(index, {
                            rotate: el.rotate - 10
                          })
                        }
                      >
                        ↺
                      </button>

                      <button
                        onClick={() =>
                          updateElement(index, {
                            rotate: el.rotate + 10
                          })
                        }
                      >
                        ↻
                      </button>

                      <button
                        onClick={() =>
                          updateElement(index, {
                            width: el.width + 20,
                            height: el.height + 20
                          })
                        }
                      >
                        +
                      </button>

                      <button
                        onClick={() =>
                          deleteElement(index)
                        }
                      >
                        🗑
                      </button>

                    </div>
                  </div>
                )}

              </div>
            ))}

          </div>

          <div className="toolbar">

            <label className="toolBtn">
              📸 Photo

              <input
                hidden
                type="file"
                accept="image/*"
                onChange={addPhoto}
              />
            </label>

            <button
              className="toolBtn"
              onClick={addText}
            >
              ✏️ Text
            </button>

            <button
              className="toolBtn"
              onClick={() =>
                setShowStickerPicker(true)
              }
            >
              💖 Stickers
            </button>

            <button
              className="toolBtn"
              onClick={() =>
                setShowBackgroundPicker(true)
              }
            >
              🎨 Background
            </button>

            <button
              className="toolBtn"
              onClick={addPage}
            >
              ➕ Page
            </button>

          </div>

          {showStickerPicker && (
            <div className="popupOverlay">

              <div className="popupWindow">

                <div className="popupHeader">
                  <h3>Sticker Pack</h3>

                  <button
                    onClick={() =>
                      setShowStickerPicker(false)
                    }
                  >
                    ✕
                  </button>
                </div>

                <div className="stickerGrid">

                  {FREE_STICKERS.map((sticker, index) => (
                    <button
                      key={index}
                      className="stickerBtn"
                      onClick={() =>
                        addSticker(sticker)
                      }
                    >
                      {sticker}
                    </button>
                  ))}

                </div>
              </div>
            </div>
          )}

          {showBackgroundPicker && (
            <div className="popupOverlay">

              <div className="popupWindow">

                <div className="popupHeader">
                  <h3>Choose Background</h3>

                  <button
                    onClick={() =>
                      setShowBackgroundPicker(false)
                    }
                  >
                    ✕
                  </button>
                </div>

                <div className="backgroundGrid">

                  {BACKGROUNDS.map((bg, index) => (
                    <button
                      key={index}
                      className="backgroundBtn"
                      style={{
                        background: bg
                      }}
                      onClick={() => {
                        updateCurrentPage({
                          background: bg
                        });

                        setShowBackgroundPicker(false);
                      }}
                    />
                  ))}

                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default App;
