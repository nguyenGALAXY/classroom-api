import bcrypt from 'bcrypt'
import debug from './debug'
const saltRounds = 10

export async function hashPassword(plainPassword) {
  const hash = await bcrypt.hash(plainPassword, saltRounds).catch((err) => {
    debug.log('Hash', err)
  })
  return hash
}

export async function checkPassword(plainPassword, hash) {
  const result = bcrypt.compare(plainPassword, hash).catch((err) => {
    debug.log('Hash', err)
  })
  return result
}
