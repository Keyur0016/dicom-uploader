import CryptoJS from "crypto-js";
const SECRET_KEY = "011ESzEHm9eMw59pUQO0nY/0EshJBtu3GyoOh9bj9Ro=";

const decryptData = (base64Ciphertext, encryptionKey) => {
    // Decode base64
    const combined = CryptoJS.enc.Base64.parse(base64Ciphertext);
    
    // Split IV and ciphertext (first 16 bytes are IV)
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4));
    const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4));
    
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: ciphertext },
        CryptoJS.enc.Base64.parse(SECRET_KEY),
        { iv: iv }
    );
    
    // Convert to UTF-8 and remove padding
    return decrypted.toString(CryptoJS.enc.Utf8);
};

export {decryptData} ; 

const encryptData = (plaintext) => {
    try {
      // Parse base64 key
      const key = CryptoJS.enc.Base64.parse(SECRET_KEY);
      
      // Generate random 16-byte IV (4 words = 16 bytes)
      const iv = CryptoJS.lib.WordArray.random(4);
      
      // Encrypt data
      const encrypted = CryptoJS.AES.encrypt(
        CryptoJS.enc.Utf8.parse(plaintext),
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );
      
      // Combine IV and ciphertext
      const combined = iv.concat(encrypted.ciphertext);
      
      // Convert to base64 string
      return combined.toString(CryptoJS.enc.Base64);
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
};

export {encryptData} ;  
