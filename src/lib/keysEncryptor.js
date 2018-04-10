import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const algo = "aes-256-ctr";
const filePath = path.join(__dirname, '../keysEncrypted.enc');

export function doesEncryptedFileExist(){
  return fs.existsSync(filePath);
}

/**
   * The reset password function ;)
   */
 export function deleteEncryptedFile(){
    if(doesEncryptedFileExist()){
      fs.unlinkSync(filePath);
    }
  }

/**
 * Checks if the given password can decrypt the file
 * @param {*} pw
 */
export function isPasswordCorrect(pw){
  try{
    loadEncrypted(pw);
  }catch(err){
    return false;
  }
  return true;
}

export function saveEncrypted(password, keys_json){
  let cipher = crypto.createCipher(algo ,password)
  let crypted = cipher.update(JSON.stringify(keys_json),'utf8','hex')
  crypted += cipher.final('hex');
  fs.writeFileSync(filePath, crypted, 'hex');
  console.log("successfully written encrypted keys to " + filePath);
}

/**
 * loads the keys file from disk.
 * If the key file does not exist, returns an empty key object ({"key" : null, "domain": null ...})
 * If the password is incorrect, throws a SyntaxError
 * @param {*} password
 */
export function loadEncrypted(password) {
  let crypted = null;
  try{
    crypted = fs.readFileSync(filePath, 'hex');
  }
  catch(error){
    return {
      "key": null,
      "domain": null,
      "nami_user": null,
      "nami_pw": null
    }
  }

  let decipher = crypto.createDecipher(algo ,password)
  let dec = decipher.update(crypted,'hex','utf8')
  dec += decipher.final('utf8');
  return JSON.parse(dec);
}



