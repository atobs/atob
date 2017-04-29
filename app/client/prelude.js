// i dont like that clicking links that are just #href causes me history
// problems.
$(document).on("click", "a[href^='#']", event => {
  if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
    event.preventDefault();
  }
});

window.bootloader.modules.jquery = $;
window.bootloader.defs.jquery = $;
