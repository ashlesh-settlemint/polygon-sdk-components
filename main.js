const fs = require("fs");
const crypto = require("libp2p-crypto");
const peer = require("peer-id");
const { createECDH } = require("crypto");

const ecdh = createECDH("secp256k1");

async function main() {
  ecdh.generateKeys();
  const validatorPvtKey = ecdh.getPrivateKey("hex");
  const libp2pKeyPair = await crypto.keys.generateKeyPair("secp256k1", 256);

  return { validatorPvtKey, libp2pKeyPair };
}

main().then(({ validatorPvtKey, libp2pKeyPair }) => {
  const libp2pPvtKeyBuf = crypto.keys.marshalPrivateKey(libp2pKeyPair);
  const libp2pPvtKey = libp2pPvtKeyBuf.toString("hex");

  peer.createFromPrivKey(libp2pPvtKeyBuf).then((res) => {
    console.log({
      validatorPvtKey,
      libp2pPvtKey,
      peerId: res._idB58String,
    });
  });

  fs.mkdirSync("consensus");
  fs.mkdirSync("libp2p");

  fs.writeFile("./consensus/validator.key", validatorPvtKey, (err) => {
    if (err) {
      console.log(err);
      return;
    }
  });
  fs.writeFile("./libp2p/libp2p.key", libp2pPvtKey, (err) => {
    if (err) {
      console.log(err);
      return;
    }
  });
});
