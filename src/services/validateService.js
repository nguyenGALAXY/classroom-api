export function validatePhoneNumber(inputtxt) {
  const phoneno = /^\d{10}$/
  if (inputtxt.match(phoneno)) {
    return true
  } else {
    return false
  }
}
