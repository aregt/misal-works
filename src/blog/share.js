document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  const url = button.getAttribute("data-copy");
  if (!url) return;
  const label = button.getAttribute("data-label") || "Bağlantıyı kopyala";
  try {
    await navigator.clipboard.writeText(url);
    button.textContent = "Kopyalandı";
    window.setTimeout(() => {
      button.textContent = label;
    }, 1600);
  } catch {
    window.prompt("Bağlantıyı kopyalayın:", url);
  }
});
