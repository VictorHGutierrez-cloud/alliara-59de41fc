(function () {
  if (
    !new URLSearchParams(location.search).has("embed") &&
    window.self === window.top
  ) {
    return;
  }
  document.documentElement.classList.add("embed");
  function stripChrome() {
    document.querySelectorAll(".top, .rail").forEach(function (el) {
      el.remove();
    });
    document.querySelectorAll(".wrap, .content").forEach(function (el) {
      if (el instanceof HTMLElement) {
        el.style.paddingTop = "12px";
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", stripChrome);
  } else {
    stripChrome();
  }
})();
