import nacl from 'tweetnacl';
import { decodeBase64, decodeUTF8 } from 'tweetnacl-util';
import { Buffer } from 'buffer';

export function verifySignature(payload: string, signature: string, publicKeyStr: string): boolean {
  try {
    let pubKeyUint8: Uint8Array;

    if (publicKeyStr.includes('-----BEGIN PUBLIC KEY-----')) {
      // Handle PEM format
      const base64 = publicKeyStr
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/\s/g, '');
      pubKeyUint8 = decodeBase64(base64);
    } else if (publicKeyStr.length === 64) {
      // Likely Hex for Ed25519
      pubKeyUint8 = new Uint8Array(Buffer.from(publicKeyStr, 'hex'));
    } else {
      pubKeyUint8 = decodeBase64(publicKeyStr);
    }

    // Ed25519 public keys in PEM (SPKI) are actually wrapped. 
    // For Ed25519, the last 32 bytes of the decoded SPKI are usually the raw public key.
    if (pubKeyUint8.length === 44) {
      // Standard SPKI for Ed25519 is 44 bytes. 
      // ASN.1 structure: 
      // SEQUENCE (12 bytes) { 
      //   SEQUENCE (5 bytes) { OBJECT IDENTIFIER 1.3.101.112 (ed25519) }
      //   BIT STRING (33 bytes) { 0x00 + 32 bytes of key }
      // }
      // We need the last 32 bytes.
      pubKeyUint8 = pubKeyUint8.slice(-32);
    }

    const signatureUint8 = decodeBase64(signature.replace(/-/g, '+').replace(/_/g, '/'));
    const dataUint8 = decodeUTF8(payload);

    return nacl.sign.detached.verify(dataUint8, signatureUint8, pubKeyUint8);
  } catch (e) {
    console.error('Verification failed', e);
    return false;
  }
}
