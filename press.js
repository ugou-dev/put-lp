(() => {
  const lightbox = document.getElementById("pressLightbox");
  const lightboxImg = document.getElementById("pressLightboxImg");
  const lightboxCaption = document.getElementById("pressLightboxCaption");
  const closeBtn = lightbox.querySelector(".press-lightbox-close");

  function open(src, caption) {
    lightboxImg.src = src;
    lightboxImg.alt = caption || "";
    lightboxCaption.textContent = caption || "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function close() {
    lightbox.hidden = true;
    lightboxImg.src = "";
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".press-visual-trigger").forEach((btn) => {
    btn.addEventListener("click", () => {
      open(btn.dataset.src, btn.dataset.caption);
    });
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (!lightbox.hidden && e.key === "Escape") close();
  });
})();
