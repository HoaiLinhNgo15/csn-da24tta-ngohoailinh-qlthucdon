export function hidePopUp(id) {
  const element = document.getElementById(id);
  if (element) {
    element.style.display = "none";
  }
}

export function showPopUp(id) {
  const element = document.getElementById(id);
  if (element) {
    element.style.display = "flex";
  }
}

window.hidePopUp = hidePopUp;
window.showPopUp = showPopUp;
