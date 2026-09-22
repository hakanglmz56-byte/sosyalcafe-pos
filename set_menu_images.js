const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(sa),
  databaseURL: 'https://cafe-adisyon-2bcf0-default-rtdb.firebaseio.com'
});

const BASE = 'https://sosyalcafe.com.tr/menu-images/';

// firebase key -> gorsel dosyasi
const eslesme = [
  { key: 'm1790075434332', ad: 'orman meyveli magnolia', dosya: 'orman-meyveli-magnolia.jpg' },
  { key: 'm1790075449216', ad: 'çilekli magnolia',        dosya: 'cilekli-magnolia.jpg' },
  { key: 'm1790075397452', ad: 'kazandibi',               dosya: 'kazandibi.jpg' },
  { key: 'm1790075032156373', ad: 'fırın sütlaç',         dosya: 'firin-sutlac.jpg' },
  { key: 'm1790075355098', ad: 'supangle',                dosya: 'supangle.jpg' },
  { key: 'm1790075381862', ad: 'fıstıklı çikolatalı muhallebi', dosya: 'fistikli-cikolatali-muhallebi.jpg' },
];

(async () => {
  for (const e of eslesme) {
    const url = BASE + e.dosya;
    await admin.database().ref('menu_v7/' + e.key).update({ image: url, img: url });
    console.log(`✅ ${e.ad.padEnd(30)} -> ${url}`);
  }
  console.log('\nTAMAMLANDI');
  process.exit(0);
})().catch(e => { console.error('HATA:', e.message); process.exit(1); });
