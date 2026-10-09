import { auth } from '../firebase'

export const SESSION_EXPIRED_MESSAGE =
  'Tu sesión expiró o no estás autenticada. Vuelve a iniciar sesión para guardar.'

export function requireAuthUid() {
  const uid = auth.currentUser?.uid
  return typeof uid === 'string' && uid.length > 0 ? uid : null
}
