export function sendSms(to, message) {
  console.log(`SMS to ${to}: ${message}`)
  return Promise.resolve({ success: true })
}
