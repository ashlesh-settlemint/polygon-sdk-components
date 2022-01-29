const fs = require("fs");
const peer = require("peer-id");
const rlp = require("rlp");
const crypto = require("libp2p-crypto");
const { createECDH } = require("crypto");
const { Buffer } = require("buffer");
const publicKeyToAddress = require("ethereum-public-key-to-address");

const ecdh = createECDH("secp256k1");

async function generateKeys() {
  ecdh.generateKeys();

  const validatorPvtKey = ecdh.getPrivateKey("hex");
  const validatorPvbKey = ecdh.getPublicKey("hex");
  const validatorAddress = publicKeyToAddress(validatorPvbKey);
  const libp2pKeyPair = await crypto.keys.generateKeyPair("secp256k1", 256);

  return { validatorPvtKey, validatorAddress, libp2pKeyPair };
}

function generateGenesisFile(peerIds) {
  const validatorAddresses = [];

  for (let i = 1; i <= 1; i++) {
    validatorAddresses.push(
      fs
        .readFileSync(`./data-dir-${i}/consensus/validatorAddress.key`)
        .toString()
    );
  }

  const istanbulExtra = [
    validatorAddresses,
    "", // Seal
    [], // CommittedSeal
  ];

  const encodedValidators = rlp.encode(istanbulExtra);
  const vanity = new Buffer.alloc(32);

  const extraData = Buffer.concat([vanity, encodedValidators]).toString("hex");

  const genesisJson = {
    name: "example",
    genesis: {
      nonce: "0x0000000000000000",
      timestamp: "0x0",
      extraData,
      gasLimit: "0x500000",
      difficulty: "0x1",
      mixHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      coinbase: "0x0000000000000000000000000000000000000000",
      alloc: {},
      number: "0x0",
      gasUsed: "0x70000",
      parentHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
    },
    params: {
      forks: {
        homestead: 0,
        byzantium: 0,
        constantinople: 0,
        petersburg: 0,
        istanbul: 0,
        EIP150: 0,
        EIP158: 0,
        EIP155: 0,
      },
      chainID: 100,
      engine: {
        ibft: {
          type: "PoA",
        },
      },
      blockGasTarget: 0,
    },
    bootnodes: [`/dns4/validator-1/tcp/1478/p2p/${peerIds[0]}`],
  };

  fs.writeFileSync("genesis.json", JSON.stringify(genesisJson));
}

function storeKeys(validatorPvtKey, validatorAddress, libp2pPvtKey, index) {
  fs.mkdirSync(`data-dir-${index}`);
  fs.mkdirSync(`data-dir-${index}/consensus`);
  fs.mkdirSync(`data-dir-${index}/libp2p`);

  fs.writeFileSync(
    `./data-dir-${index}/consensus/validator.key`,
    validatorPvtKey
  );
  fs.writeFileSync(
    `./data-dir-${index}/consensus/validatorAddress.key`,
    validatorAddress
  );
  fs.writeFileSync(`./data-dir-${index}/libp2p/libp2p.key`, libp2pPvtKey);
}

async function main() {
  const peerIds = [];

  for (let i = 1; i <= 1; i++) {
    const { validatorPvtKey, validatorAddress, libp2pKeyPair } =
      await generateKeys();
    const libp2pPvtKeyBuf = crypto.keys.marshalPrivateKey(libp2pKeyPair);
    const libp2pPvtKey = libp2pPvtKeyBuf.toString("hex");

    storeKeys(validatorPvtKey, validatorAddress, libp2pPvtKey, i);

    await peer.createFromPrivKey(libp2pPvtKeyBuf).then((res) => {
      peerIds.push(res._idB58String);
      console.log({
        validatorPvtKey,
        validatorAddress,
        libp2pPvtKey,
        peerId: res._idB58String,
      });
    });
  }

  generateGenesisFile(peerIds);
}

main();
