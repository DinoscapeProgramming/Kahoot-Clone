function randomGameId(length) {
  return Math.round(Math.random() * (Array(length).fill("9").join("") - Number("1" + Array(length - 1).fill("0").join(""))) + Number("1" + Array(length - 1).fill("0").join(""))).toString();
}

function isURL(url) {
  try {
    new URL(url);
  } catch {
    return false
  }
  return true
}

module.exports = {
  randomGameId,
  isURL
}