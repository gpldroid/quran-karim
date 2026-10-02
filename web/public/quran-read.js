(() => {
  "use strict";
  const playlist = document.getElementById("quran-playlist");
  const content = document.getElementById("lyrics-content");
  const loader = document.getElementById("lyricsLoader");
  const currentName = document.getElementById("currentSurahName");
  const versesCount = document.getElementById("versesCount");
  const surahType = document.getElementById("surahType");
  const revelationOrder = document.getElementById("revelationOrder");
  const buttons = {
    arabic: document.getElementById("btnArabic"),
    translation: document.getElementById("btnTranslation"),
    tafsir: document.getElementById("btnTafsir")
  };
  let surahs = [];
  let currentIndex = 0;
  let mode = "arabic";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));

  function setActiveButton() {
    Object.values(buttons).forEach(b => b.classList.remove("active"));
    buttons[mode].classList.add("active");
  }

  function renderPlaylist() {
    playlist.innerHTML = "";
    surahs.forEach((surah, index) => {
      const item = document.createElement("div");
      item.className = "surah-item" + (index === currentIndex ? " active" : "");
      item.innerHTML = '<div class="surah-number">' + surah.number + '</div><div class="surah-name">' + escapeHtml(surah.name) + '</div>';
      item.addEventListener("click", () => selectSurah(index));
      playlist.appendChild(item);
    });
  }

  function updateInfo() {
    const s = surahs[currentIndex];
    if (!s) return;
    currentName.textContent = s.name;
    versesCount.textContent = s.numberOfAyahs;
    surahType.textContent = s.revelationType === "Meccan" ? "مكية" : "مدنية";
    revelationOrder.textContent = s.revelationOrder || "—";
    document.querySelectorAll(".surah-item").forEach((el, i) => el.classList.toggle("active", i === currentIndex));
  }

  function renderAyahs(ayahs, title) {
    let html = '<div class="quran-text">';
    if (currentIndex + 1 !== 9 && mode === "arabic") {
      html += '<div class="verse"><div class="verse-number">ب</div>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>';
    }
    ayahs.forEach((ayah, i) => {
      const text = escapeHtml(ayah.text).replace(/\n/g, "<br>");
      const number = ayah.numberInSurah || i + 1;
      html += '<div class="verse"><div class="verse-number">' + number + '</div>' + text + '</div>';
    });
    html += "</div>";
    content.innerHTML = '<div class="quran-mode-title">' + escapeHtml(title) + '</div>' + html;
    content.scrollTop = 0;
  }

  async function fetchEdition(surahNumber, edition) {
    const response = await fetch("https://api.alquran.cloud/v1/surah/" + surahNumber + "/" + edition);
    if (!response.ok) throw new Error("API request failed");
    const data = await response.json();
    if (data.code !== 200 || !data.data) throw new Error("Invalid Quran data");
    return data.data;
  }

  async function loadMode() {
    const surah = surahs[currentIndex];
    if (!surah) return;
    loader.classList.add("active");
    content.innerHTML = "";
    try {
      const edition = mode === "arabic" ? "ar.alafasy" : mode === "translation" ? "en.asad" : "ar.muyassar";
      const data = await fetchEdition(surah.number, edition);
      renderAyahs(data.ayahs, mode === "arabic" ? "النص العربي" : mode === "translation" ? "English translation" : "التفسير الميسر");
    } catch (error) {
      console.error(error);
      content.innerHTML = '<div class="lyrics-placeholder"><i class="fas fa-triangle-exclamation" style="font-size:3rem;margin-bottom:15px;display:block;"></i>تعذر تحميل المحتوى حالياً. حاول مرة أخرى.</div>';
    } finally {
      loader.classList.remove("active");
    }
  }

  async function selectSurah(index) {
    currentIndex = index;
    updateInfo();
    await loadMode();
    const active = document.querySelector(".surah-item.active");
    active?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function init() {
    try {
      const response = await fetch("https://api.alquran.cloud/v1/surah");
      if (!response.ok) throw new Error("Failed to load surahs");
      const data = await response.json();
      if (data.code !== 200) throw new Error("Invalid surah data");
      surahs = data.data;
      renderPlaylist();
      updateInfo();
      await loadMode();
    } catch (error) {
      console.error(error);
      playlist.innerHTML = '<div class="lyrics-placeholder">تعذر تحميل قائمة السور حالياً.</div>';
    }
  }

  buttons.arabic.addEventListener("click", () => { mode = "arabic"; setActiveButton(); loadMode(); });
  buttons.translation.addEventListener("click", () => { mode = "translation"; setActiveButton(); loadMode(); });
  buttons.tafsir.addEventListener("click", () => { mode = "tafsir"; setActiveButton(); loadMode(); });

  document.addEventListener("DOMContentLoaded", init, { once: true });
})();