window.__scoreQueue = [];
window.AJSubmitScore = function (game, score) {
  window.__scoreQueue.push([game, score]);
};
