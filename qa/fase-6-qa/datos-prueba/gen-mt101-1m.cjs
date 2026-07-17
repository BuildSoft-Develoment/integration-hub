// Genera mt101-<N>.csv (default 1.000.000 filas) en streaming, mismo esquema que mt101-10k.csv.
// Uso:  node gen-mt101-1m.js            -> mt101-1m.csv (1.000.000)
//       node gen-mt101-1m.js 100000     -> mt101-100k.csv
// Datos validos contra structural-mvp (monto>0, moneda 3 letras, cargos OUR/SHA/BEN, BIC 8/11).
const fs = require('fs');
const path = require('path');
const N = Number(process.argv[2] || 1000000);
const OUT = path.join(__dirname, N === 1000000 ? 'mt101-1m.csv' : ('mt101-' + N + '.csv'));
const BICS = ['BCPLPEPLXXX', 'BINPPEPLXXX', 'SCBLPEPLXXX', 'CITIPEPLXXX'];
const CARGOS = ['SHA', 'OUR', 'BEN'];
const pad = (v, n) => String(v).padStart(n, '0');

const ws = fs.createWriteStream(OUT);
ws.write('dni,nombre,cuenta,moneda,monto,bic,concepto,cargos\r\n');

let i = 1;
function pump() {
  let ok = true;
  while (i <= N && ok) {
    const cents = 1050 + ((i * 73) % 4998950);
    const line = (10000000 + (i % 90000000)) + ',BENEFICIARIO ' + pad(i, 7) + ',0010' + pad(i, 10) + ',' +
      (i % 5 === 0 ? 'USD' : 'PEN') + ',' + (cents / 100).toFixed(2) + ',' + BICS[i % BICS.length] +
      ',PAGO PROVEEDOR ' + pad(i, 7) + ',' + CARGOS[i % CARGOS.length] + '\r\n';
    ok = ws.write(line);
    i++;
  }
  if (i <= N) ws.once('drain', pump);
  else ws.end(() => console.log('escrito', OUT, '(' + N + ' filas,', (fs.statSync(OUT).size / 1048576).toFixed(1) + ' MB)'));
}
pump();
