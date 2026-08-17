import { readFile } from 'node:fs/promises';

const scriptPath = new URL('../dist/$IMPC!TYDOWNLOADER.user.js', import.meta.url);
const source = await readFile(scriptPath, 'utf8');

const requiredMetadata = [
    '// ==UserScript==',
    '// @name $IMPC!TYDOWNLOADER',
    '// @namespace https://github.com/atedickfer/SIMPCITYDOWNLOADER',
    '// @author atedickfer',
    '// @version 4.3.0',
    '// @grant GM_xmlhttpRequest',
    '// @grant GM_download',
];

const missing = requiredMetadata.filter(line => !source.includes(line));
if (missing.length) {
    console.error(`Missing userscript metadata:\n${missing.join('\n')}`);
    process.exitCode = 1;
} else {
    console.log('Userscript metadata verified.');
}
