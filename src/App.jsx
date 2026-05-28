
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: "Trebuchet MS", Arial, sans-serif;
  background: #fff7fb;
  color: #3d2d34;
}

button,
input,
textarea {
  font-family: inherit;
}

button {
  border: none;
  cursor: pointer;
}

.app {
  min-height: 100vh;
}

/* HOME */

.homeScreen {
  min-height: 100vh;
  padding: 20px 20px 120px;
  background:
    linear-gradient(rgba(255,255,255,.45), rgba(255,255,255,.45)),
    repeating-linear-gradient(
      45deg,
      #ffdceb 0px,
      #ffdceb 18px,
      #fff0f6 18px,
      #fff0f6 36px
    );
}

.heroCard {
  position: relative;
  overflow: hidden;
  border-radius: 38px;
  padding: 38px 26px;
  background: #fffaf6;
  box-shadow: 0 18px 45px rgba(0,0,0,.12);
  border: 2px solid rgba(255,255,255,.8);
}

.heroCard::before {
  content: "";
  position: absolute;
  top: 14px;
  left: 50%;
  width: 130px;
  height: 32px;
  background: rgba(255, 214, 150, .65);
  transform: translateX(-50%) rotate(-2deg);
  border-radius: 4px;
}

.heroContent {
  position: relative;
  z-index: 2;
  text-align: center;
}

.heroLabel {
  display: inline-block;
  background: #ffdcea;
  color: #9b6475;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  letter-spacing: 1px;
  margin-bottom: 14px;
}

.heroContent h1 {
  margin: 0 0 24px;
  font-family: Georgia, serif;
  font-size: 54px;
  line-height: .92;
  color: #4b333b;
}

.heroDecor {
  position: absolute;
  font-size: 54px;
  opacity: .5;
}

.heroLeft {
  left: 18px;
  bottom: 20px;
}

.heroRight {
  right: 22px;
  top: 18px;
}

.mainPinkBtn {
  background: linear-gradient(135deg, #ff9cc2, #ec6f9f);
  color: white;
  padding: 15px 20px;
  border-radius: 22px;
  font-weight: 800;
  box-shadow: 0 10px 22px rgba(236,111,159,.32);
}

.homeActions {
  display: flex;
  gap: 12px;
  margin: 24px 0;
  overflow-x: auto;
}

.homeActions button {
  min-width: 125px;
  padding: 15px;
  border-radius: 22px;
  background: rgba(255,255,255,.92);
  box-shadow: 0 8px 24px rgba(0,0,0,.08);
  font-weight: 800;
  color: #4b333b;
}

.sectionTitle,
.pageTitle {
  font-family: Georgia, serif;
  color: #4b333b;
  font-size: 32px;
}

/* CARDS */

.booksGrid,
.templateGrid,
.premiumGrid {
  display: grid;
  gap: 18px;
}

.bookCard,
.templateCard,
.premiumCard,
.profileCard {
  position: relative;
  background: #fffaf6;
  border-radius: 30px;
  overflow: hidden;
  box-shadow: 0 14px 38px rgba(0,0,0,.1);
}

.bookPreview,
.templatePreview {
  height: 210px;
  display: grid;
  place-items: center;
  font-family: Georgia, serif;
  font-size: 26px;
  text-align: center;
  padding: 20px;
}

.freePreview {
  background:
    linear-gradient(rgba(255,255,255,.5), rgba(255,255,255,.5)),
    repeating-linear-gradient(
      45deg,
      #ffe0ec 0px,
      #ffe0ec 18px,
      #fff5f8 18px,
      #fff5f8 36px
    );
  color: #b85f83;
}

.pinkBabyPreview {
  background:
    linear-gradient(rgba(255,255,255,.45), rgba(255,255,255,.45)),
    repeating-linear-gradient(
      45deg,
      #ffd5e6 0px,
      #ffd5e6 18px,
      #fff0f6 18px,
      #fff0f6 36px
    );
}

.blueBabyPreview {
  background:
    linear-gradient(rgba(255,255,255,.45), rgba(255,255,255,.45)),
    repeating-linear-gradient(
      45deg,
      #d9ecff 0px,
      #d9ecff 18px,
      #f1f8ff 18px,
      #f1f8ff 36px
    );
}

.bookInfo,
.templateInfo {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bookTitle {
  font-weight: 900;
  font-size: 18px;
}

.bookPages {
  color: #8f6e78;
  font-size: 14px;
}

/* PANEL */

.panelScreen {
  min-height: 100vh;
  padding: 22px 20px 120px;
  background: #fff7fb;
}

.backBtn {
  background: white;
  border-radius: 18px;
  padding: 13px 18px;
  font-weight: 800;
  box-shadow: 0 8px 20px rgba(0,0,0,.06);
  margin-bottom: 18px;
}

.premiumCard {
  padding: 24px;
}

.premiumPrice {
  font-size: 40px;
  color: #dc6f99;
  font-weight: 900;
}

/* PROFILE */

.profileCard {
  padding: 26px;
  text-align: center;
}

.profileAvatar {
  width: 90px;
  height: 90px;
  margin: 0 auto 14px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #ffafd0, #ffdceb);
  font-size: 44px;
}

.settingsList {
  display: grid;
  gap: 14px;
  margin-top: 22px;
}

.settingRow,
.settingsButton,
.logoutButton {
  background: #fff0f6;
  border-radius: 22px;
  padding: 17px;
  font-weight: 800;
}

.settingRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logoutButton {
  background: #ec6f9f;
  color: white;
}

.toggleSwitch {
  position: relative;
  width: 58px;
  height: 32px;
}

.toggleSwitch input {
  display: none;
}

.toggleSlider {
  position: absolute;
  inset: 0;
  background: #d7c2cb;
  border-radius: 999px;
}

.toggleSlider::before {
  content: "";
  position: absolute;
  width: 24px;
  height: 24px;
  left: 4px;
  top: 4px;
  border-radius: 50%;
  background: white;
  transition: .25s;
}

.toggleSwitch input:checked + .toggleSlider {
  background: #ec6f9f;
}

.toggleSwitch input:checked + .toggleSlider::before {
  transform: translateX(26px);
}

/* EDITOR */

.editorScreen {
  min-height: 100vh;
  padding-bottom: 130px;
  background: #fff7fb;
}

.editorHeader,
.pageTabs {
  display: flex;
  gap: 10px;
  padding: 12px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.editorHeader button,
.pageTabs button {
  background: white;
  border-radius: 18px;
  padding: 12px 16px;
  font-weight: 800;
  box-shadow: 0 6px 18px rgba(0,0,0,.06);
}

.scrapbookPage {
  position: relative;
  width: calc(100% - 24px);
  max-width: 420px;
  height: 640px;
  margin: 8px auto 20px;
  overflow: hidden;
  border-radius: 36px;
  box-shadow: 0 18px 45px rgba(0,0,0,.14);
}

/* BACKGROUNDS */

.bg-cream {
  background: #fff8ee;
}

.bg-pink {
  background: #ffddea;
}

.bg-blue {
  background: #dceeff;
}

.bg-lavender {
  background: #efe5ff;
}

.bg-grid {
  background-color: white;
  background-image:
    linear-gradient(#eadfe3 1px, transparent 1px),
    linear-gradient(90deg, #eadfe3 1px, transparent 1px);
  background-size: 24px 24px;
}

.bg-dots {
  background-color: white;
  background-image: radial-gradient(#d9cbd0 1.5px, transparent 1.5px);
  background-size: 18px 18px;
}

/* SCRAP ELEMENTS */

.scrapElement {
  position: absolute;
  touch-action: none;
}

.scrapElement.selected {
  outline: 3px dashed #ec6f9f;
}

.photoFrame {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: white;
  border: 8px solid white;
  border-radius: 14px;
  box-shadow: 0 8px 18px rgba(0,0,0,.15);
  color: #b28695;
  font-weight: 900;
}

.photoFrame img {
  width: 100%;
  height: 100%;
}

.scrapElement textarea {
  width: 100%;
  height: 100%;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  text-align: center;
}

.stickerArt {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  filter: drop-shadow(0 6px 8px rgba(0,0,0,.12));
}

.handle {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ec6f9f;
  color: white;
  font-weight: 900;
  z-index: 50;
  box-shadow: 0 5px 12px rgba(0,0,0,.16);
}

.rotateHandle {
  top: -16px;
  right: -16px;
}

.resizeHandle {
  bottom: -16px;
  right: -16px;
}

/* TOOLBAR */

.bottomToolbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,.94);
  backdrop-filter: blur(12px);
  padding: 16px;
  display: flex;
  gap: 12px;
  overflow-x: auto;
  z-index: 200;
  box-shadow: 0 -8px 28px rgba(0,0,0,.1);
}

.bottomToolbar button {
  min-width: 120px;
  padding: 14px;
  border-radius: 20px;
  background: #fff0f6;
  font-weight: 900;
  color: #4b333b;
}

/* POPUPS */

.popupOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.28);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 20px;
}

.popupWindow {
  width: 100%;
  max-width: 430px;
  background: white;
  border-radius: 32px;
  padding: 22px;
  box-shadow: 0 18px 50px rgba(0,0,0,.2);
}

.largePopup {
  max-height: 85vh;
  overflow: auto;
}

.popupHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popupHeader button {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: #fff0f6;
  font-size: 18px;
}

.backgroundGrid,
.stickerGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 18px;
}

.bgChoice,
.stickerButton {
  min-height: 88px;
  border-radius: 22px;
  background: #fff0f6;
  font-weight: 900;
}

.stickerButton {
  font-size: 30px;
}

/* DARK THEME */

.darkTheme {
  background: #2c2328;
  color: white;
}

.darkTheme .homeScreen,
.darkTheme .panelScreen,
.darkTheme .editorScreen {
  background: #2c2328;
}

.darkTheme .heroCard,
.darkTheme .bookCard,
.darkTheme .templateCard,
.darkTheme .premiumCard,
.darkTheme .profileCard,
.darkTheme .popupWindow,
.darkTheme .bottomToolbar,
.darkTheme .editorHeader button,
.darkTheme .pageTabs button,
.darkTheme .homeActions button,
.darkTheme .backBtn {
  background: #3b3138;
  color: white;
}

.darkTheme .settingsButton,
.darkTheme .settingRow,
.darkTheme .bgChoice,
.darkTheme .stickerButton {
  background: #4a3d45;
  color: white;
}
