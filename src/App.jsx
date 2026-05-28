import React, { useEffect, useState } from "react";

const backgrounds = [
  { id: "pinkPlaid", name: "Pink Plaid" },
  { id: "bluePlaid", name: "Blue Plaid" },
  { id: "cream", name: "Cream Paper" },
  { id: "lavender", name: "Lavender" },
  { id: "grid", name: "Grid Paper" },
  { id: "dots", name: "Dots" },
];

const stickers = [
  { id: "heart", name: "Heart" },
  { id: "bow", name: "Bow" },
  { id: "flower", name: "Flower" },
  { id: "daisy", name: "Daisy" },
  { id: "tape", name: "Tape" },
  { id: "label", name: "Label" },
  { id: "star", name: "Star" },
  { id: "leaf", name: "Leaf" },
  { id: "camera", name: "Camera" },
  { id: "frame", name: "Frame" },
];

const fonts = ["Georgia", "Arial", "Courier New", "Trebuchet MS", "Times New Roman"];
const colors = ["#2f2528", "#d96f94", "#7fa6ce", "#8e78b8", "#b58b62", "#ffffff"];

function id() {
  return crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function photo(x, y, w = 190, h = 190) {
  return { id: id(), type: "photo", src: "", x, y, w, h, r: 0, fit: "cover", cropX: 50, cropY: 50 };
}

function text(value, x, y) {
  return {
    id: id(),
    type: "text",
    text: value,
    x,
    y,
    w: 230,
    h: 70,
    r: 0,
    size: 28,
    font: "Georgia",
    color: "#2f2528",
    bold: false,
    underline: false,
  };
}

function sticker(kind, x, y) {
  return { id: id(), type: "sticker", kind, x, y, w: 70, h: 70, r: 0 };
}

function firstTemplate() {
  return {
    title: "My First Scrapbook",
    pages: [
      {
        bg: "cream",
        elements: [
          text("About Me ♡", 86, 28),
          photo(54, 115, 150, 150),
          text("My name:\nBirthday:\nFavorite color:", 42, 305),
          sticker("flower", 298, 292),
          sticker("tape", 230, 84),
        ],
      },
      {
        bg: "cream",
        elements: [
          text("My Family ♡", 82, 28),
          photo(50, 105, 170, 150),
          photo(70, 330, 90, 95),
          photo(172, 330, 90, 95),
          photo(274, 330, 90, 95),
          sticker("leaf", 310, 300),
          sticker("tape", 190, 85),
        ],
      },
    ],
  };
}

function babyTemplate(girl = true) {
  return {
    title: girl ? "Baby Girl First Year" : "Baby Boy First Year",
    pages: Array.from({ length: 12 }, (_, i) => ({
      bg: girl ? "pinkPlaid" : "bluePlaid",
      elements: [
        text(`${i + 1}\nmonth${i === 0 ? "" : "s"}`, 32, 40),
        photo(142, 90, 210, 210),
        text(girl ? "sweet girl ♡" : "sweet boy ♡", 130, 330),
        sticker(girl ? "bow" : "star", 38, 320),
        sticker("flower", 322, 285),
        sticker("tape", 190, 70),
      ],
    })),
  };
}

function StickerArt({ kind }) {
  return (
    <div className={`stickerArt ${kind}`}>
      {kind === "heart" && <span>♡</span>}
      {kind === "bow" && <span>🎀</span>}
      {kind === "flower" && <span>✿</span>}
      {kind === "daisy" && <span>🌼</span>}
      {kind === "star" && <span>★</span>}
      {kind === "leaf" && <span>❧</span>}
      {kind === "camera" && <span>📷</span>}
      {kind === "tape" && <span></span>}
      {kind === "label" && <small>memo</small>}
      {kind === "frame" && <span></span>}
    </div>
  );
}

export default function App() {
  const saved = localStorage.getItem("pocketBook");
  const starter = saved ? JSON.parse(saved) : firstTemplate();

  const [screen, setScreen] = useState("home");
  const [book, setBook] = useState(starter);
  const [pageIndex, setPageIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [dark, setDark] = useState(false);
  const [drag, setDrag] = useState(null);
  const [premium, setPremium] = useState(false);
  const page = book.pages[pageIndex];
  const selectedEl = page?.elements.find((e) => e.id === selected);

  useEffect(() => {
    document.body.classList.toggle("darkTheme", dark);
  }, [dark]);

  useEffect(() => {
    function move(e) {
      if (!drag) return;
      const p = e.touches ? e.touches[0] : e;
      const dx = p.clientX - drag.startX;
      const dy = p.clientY - drag.startY;

      updateElement(drag.id, {
        x: drag.el.x + dx,
        y: drag.el.y + dy,
      });
    }

    function up() {
      setDrag(null);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [drag, book]);

  function updatePage(next) {
    const pages = [...book.pages];
    pages[pageIndex] = next;
    setBook({ ...book, pages });
  }

  function updateElement(elId, data) {
    updatePage({
      ...page,
      elements: page.elements.map((el) => (el.id === elId ? { ...el, ...data } : el)),
    });
  }

  function addElement(el) {
    updatePage({ ...page, elements: [...page.elements, el] });
    setSelected(el.id);
  }

  function deleteSelected() {
    if (!selected) return;
    updatePage({ ...page, elements: page.elements.filter((el) => el.id !== selected) });
    setSelected(null);
  }

  function saveBook() {
    localStorage.setItem("pocketBook", JSON.stringify(book));
    alert("Scrapbook saved!");
  }

  function upload(elId, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateElement(elId, { src: reader.result });
    reader.readAsDataURL(file);
  }

  function startMove(e, el) {
    e.stopPropagation();
    const p = e.touches ? e.touches[0] : e;
    setSelected(el.id);
    setDrag({ id: el.id, startX: p.clientX, startY: p.clientY, el: { ...el } });
  }

  function openPremiumTemplate(type) {
    if (!premium) {
      setScreen("premium");
      return;
    }
    setBook(babyTemplate(type === "girl"));
    setPageIndex(0);
    setScreen("editor");
  }

  function renderElement(el) {
    return (
      <div
        key={el.id}
        className={`scrapElement ${selected === el.id ? "selected" : ""}`}
        style={{ left: el.x, top: el.y, width: el.w, height: el.h, transform: `rotate(${el.r}deg)` }}
        onMouseDown={(e) => startMove(e, el)}
        onTouchStart={(e) => startMove(e, el)}
        onClick={(e) => {
          e.stopPropagation();
          setSelected(el.id);
        }}
      >
        {el.type === "photo" && (
          <label className="photoFrame">
            {el.src ? (
              <img src={el.src} style={{ objectFit: el.fit, objectPosition: `${el.cropX}% ${el.cropY}%` }} />
            ) : (
              <span>+ Photo</span>
            )}
            <input hidden type="file" accept="image/*" onChange={(e) => upload(el.id, e.target.files[0])} />
          </label>
        )}

        {el.type === "text" && (
          <textarea
            value={el.text}
            onChange={(e) => updateElement(el.id, { text: e.target.value })}
            style={{
              fontSize: el.size,
              fontFamily: el.font,
              color: el.color,
              fontWeight: el.bold ? "700" : "400",
              textDecoration: el.underline ? "underline" : "none",
            }}
          />
        )}

        {el.type === "sticker" && <StickerArt kind={el.kind} />}

        {selected === el.id && (
          <>
            <button className="handle rotate" onClick={() => updateElement(el.id, { r: el.r + 15 })}>↻</button>
            <button className="handle resize" onClick={() => updateElement(el.id, { w: el.w + 20, h: el.h + 20 })}>↘</button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="phoneShell">
      {screen === "home" && (
        <div className="screen home">
          <div className="hero">
            <div className="paperLogo">
              <div className="tape"></div>
              <h1>pocket<br />scrapbook</h1>
              <p>♡ cherish every moment</p>
            </div>
            <button className="pinkBtn" onClick={() => setScreen("templates")}>Create Scrapbook</button>
          </div>

          <h2>My Scrapbooks</h2>
          <div className="bookCard" onClick={() => setScreen("editor")}>
            <div className={`miniBook bg-${book.pages[0].bg}`}>
              {book.pages[0].elements.slice(0, 5).map((el) => (
                <div key={el.id} className="miniEl" style={{ left: el.x / 5, top: el.y / 5 }}>
                  {el.type === "photo" && el.src && <img src={el.src} />}
                  {el.type === "text" && <span>{el.text.split("\n")[0]}</span>}
                  {el.type === "sticker" && <StickerArt kind={el.kind} />}
                </div>
              ))}
            </div>
            <div>
              <b>{book.title}</b>
              <small>{book.pages.length} pages</small>
            </div>
          </div>

          <nav>
            <button onClick={() => setScreen("home")}>Home</button>
            <button onClick={() => setScreen("templates")}>Templates</button>
            <button onClick={() => setScreen("editor")}>Create</button>
            <button onClick={() => setScreen("premium")}>Premium</button>
            <button onClick={() => setScreen("profile")}>Profile</button>
          </nav>
        </div>
      )}

      {screen === "templates" && (
        <div className="screen">
          <button className="back" onClick={() => setScreen("home")}>← Back</button>
          <h2>Templates</h2>
          <button className="template" onClick={() => { setBook(firstTemplate()); setPageIndex(0); setScreen("editor"); }}>My First Scrapbook <span>Free</span></button>
          <button className="template premium" onClick={() => openPremiumTemplate("girl")}>Baby Girl First Year <span>$4.99</span></button>
          <button className="template premium" onClick={() => openPremiumTemplate("boy")}>Baby Boy First Year <span>$4.99</span></button>
        </div>
      )}

      {screen === "premium" && (
        <div className="screen">
          <button className="back" onClick={() => setScreen("home")}>← Back</button>
          <h2>Premium</h2>
          <div className="priceCard"><h3>Baby First Year Pack</h3><b>$4.99</b><p>Unlock baby boy and baby girl templates.</p><button onClick={() => setPremium(true)}>Unlock for testing</button></div>
          <div className="priceCard"><h3>All Access</h3><b>$9.99</b><p>Premium templates, stickers, and text effects.</p><button>Coming soon</button></div>
        </div>
      )}

      {screen === "profile" && (
        <div className="screen">
          <button className="back" onClick={() => setScreen("home")}>← Back</button>
          <div className="profileCard">
            <div className="avatar">♡</div>
            <h2>Pocket Scrapbook</h2>
            <div className="setting"><span>Dark Mode</span><button onClick={() => setDark(!dark)}>{dark ? "ON" : "OFF"}</button></div>
            <div className="setting">Notifications</div>
            <div className="setting">Privacy</div>
            <div className="setting">Backup & Sync</div>
          </div>
        </div>
      )}

      {screen === "editor" && (
        <div className="screen editor">
          <header>
            <button onClick={() => setScreen("home")}>←</button>
            <button onClick={() => {
              const name = prompt("Rename scrapbook", book.title);
              if (name) setBook({ ...book, title: name });
            }}>Rename</button>
            <button onClick={saveBook}>Save</button>
          </header>

          <div className="pageCount">
            <button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>‹</button>
            Page {pageIndex + 1}/{book.pages.length}
            <button disabled={pageIndex === book.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}>›</button>
          </div>

          <main className={`scrapPage bg-${page.bg}`} onClick={() => setSelected(null)}>
            {page.elements.map(renderElement)}
          </main>

          <div className="toolBar">
            <button onClick={() => addElement(photo(90, 130))}>Photo</button>
            <button onClick={() => addElement(text("tap to edit", 90, 90))}>Text</button>
            <button onClick={() => setModal("stickers")}>Stickers</button>
            <button onClick={() => setModal("backgrounds")}>Background</button>
            <button onClick={() => setModal("text")}>Text Tools</button>
            <button onClick={() => setModal("photo")}>Photo Tools</button>
            <button onClick={() => {
              setBook({ ...book, pages: [...book.pages, { bg: "cream", elements: [] }] });
              setPageIndex(book.pages.length);
            }}>Page</button>
            <button onClick={deleteSelected}>Delete</button>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal" onClick={() => setModal(null)}>
          <div className="modalBox" onClick={(e) => e.stopPropagation()}>
            <button className="x" onClick={() => setModal(null)}>×</button>

            {modal === "stickers" && (
              <>
                <h2>Stickers</h2>
                <div className="pickerGrid">
                  {stickers.map((s) => <button key={s.id} onClick={() => { addElement(sticker(s.id, 145, 180)); setModal(null); }}><StickerArt kind={s.id} /><span>{s.name}</span></button>)}
                </div>
              </>
            )}

            {modal === "backgrounds" && (
              <>
                <h2>Backgrounds</h2>
                <div className="pickerGrid">
                  {backgrounds.map((bg) => <button key={bg.id} className={`bgPick bg-${bg.id}`} onClick={() => { updatePage({ ...page, bg: bg.id }); setModal(null); }}>{bg.name}</button>)}
                </div>
              </>
            )}

            {modal === "text" && (
              <>
                <h2>Text Tools</h2>
                <div className="pickerGrid">
                  {fonts.map((f) => <button key={f} style={{ fontFamily: f }} onClick={() => selectedEl?.type === "text" && updateElement(selected, { font: f })}>{f}</button>)}
                </div>
                <div className="row">
                  <button onClick={() => selectedEl?.type === "text" && updateElement(selected, { size: selectedEl.size + 2 })}>Bigger</button>
                  <button onClick={() => selectedEl?.type === "text" && updateElement(selected, { size: selectedEl.size - 2 })}>Smaller</button>
                  <button onClick={() => selectedEl?.type === "text" && updateElement(selected, { bold: !selectedEl.bold })}>Bold</button>
                  <button onClick={() => selectedEl?.type === "text" && updateElement(selected, { underline: !selectedEl.underline })}>Underline</button>
                </div>
                <div className="colorRow">{colors.map((c) => <button key={c} style={{ background: c }} onClick={() => selectedEl?.type === "text" && updateElement(selected, { color: c })}></button>)}</div>
              </>
            )}

            {modal === "photo" && (
              <>
                <h2>Photo Tools</h2>
                <div className="row">
                  <button onClick={() => selectedEl?.type === "photo" && updateElement(selected, { fit: selectedEl.fit === "cover" ? "contain" : "cover" })}>Fit/Fill</button>
                  <button onClick={() => selectedEl?.type === "photo" && updateElement(selected, { cropX: selectedEl.cropX - 5 })}>Left</button>
                  <button onClick={() => selectedEl?.type === "photo" && updateElement(selected, { cropX: selectedEl.cropX + 5 })}>Right</button>
                  <button onClick={() => selectedEl?.type === "photo" && updateElement(selected, { cropY: selectedEl.cropY - 5 })}>Up</button>
                  <button onClick={() => selectedEl?.type === "photo" && updateElement(selected, { cropY: selectedEl.cropY + 5 })}>Down</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
