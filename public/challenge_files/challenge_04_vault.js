// Logic Gate Bypass - Client-Side Key Verification
function verifyKey(input) {
  const enc = [108, 111, 103, 105, 99, 67, 84, 70, 123, 99, 108, 49, 51, 110, 116, 95, 115, 49, 100, 51, 95, 97, 117, 116, 104, 95, 49, 115, 95, 110, 48, 116, 95, 115, 52, 102, 51, 125];
  if (input.length !== enc.length) return false;
  for (let i = 0; i < enc.length; i++) {
    if (input.charCodeAt(i) !== enc[i]) return false;
  }
  return true;
}
// Run verifyKey in console or decode ASCII array to retrieve the flag!
