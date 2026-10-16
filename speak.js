(function () {
  const btn = document.getElementById("speakBtn");
  if (!btn) return;

  if (!("speechSynthesis" in window)) {
    btn.disabled = true;
    btn.textContent = "🔇 Speech not supported in this browser";
    return;
  }

  const synth = window.speechSynthesis;
  const LABEL_IDLE = "🔊 Hear the info";
  const LABEL_PLAYING = "⏹ Stop";
  let playing = false;

  // Build the text to read straight from the rendered page
  function buildText() {
    const parts = [];
    const title = document.querySelector("#profile h1");
    const lead = document.querySelector("#profile .lead");
    if (title) parts.push(title.innerText + ".");
    if (lead) parts.push(lead.innerText);

    document.querySelectorAll("#profile .info-box").forEach((box) => {
      const heading = box.querySelector("h3");
      if (!heading || /Keep Exploring/i.test(heading.innerText)) return;
      const lines = [...box.querySelectorAll("p")].map((p) => p.innerText.trim());
      parts.push(heading.innerText + ".", ...lines);
    });

    // Remove emojis so they aren't read aloud
    return parts
      .join(" ")
      .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, "")
      .replace(/km²/g, "square kilometres")
      .replace(/~/g, "approximately ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Split into short chunks (long utterances get cut off in some browsers)
  function chunk(text) {
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    const out = [];
    let cur = "";
    for (const s of sentences) {
      if ((cur + s).length > 200 && cur) { out.push(cur); cur = s; }
      else cur += s;
    }
    if (cur.trim()) out.push(cur);
    return out;
  }

  function reset() {
    playing = false;
    btn.textContent = LABEL_IDLE;
  }

  function start() {
    synth.cancel();
    const chunks = chunk(buildText());
    if (!chunks.length) return;

    chunks.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text.trim());
      u.lang = "en-US";
      u.rate = 1;
      if (i === chunks.length - 1) u.onend = reset;
      u.onerror = (e) => {
        if (e.error !== "canceled" && e.error !== "interrupted") console.error("Speech error:", e.error);
        reset();
      };
      synth.speak(u);
    });

    playing = true;
    btn.textContent = LABEL_PLAYING;
  }

  btn.addEventListener("click", () => {
    if (playing) { synth.cancel(); reset(); }
    else start();
  });

  // Stop talking if the user leaves the page
  window.addEventListener("beforeunload", () => synth.cancel());
})();