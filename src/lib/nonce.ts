const NONCE_ALPHABET =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

const NONCE_LENGTH = 32

/** A fresh nonce for one webview document's inline script. */
export function createNonce(): string {
	let nonce = ''
	for (let index = 0; index < NONCE_LENGTH; index++) {
		nonce += NONCE_ALPHABET.charAt(
			Math.floor(Math.random() * NONCE_ALPHABET.length)
		)
	}
	return nonce
}
