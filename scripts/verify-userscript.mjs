import { readFile } from 'node:fs/promises';

const scriptPath = new URL('../dist/$IMPC!TYDOWNLOADER.user.js', import.meta.url);
const source = await readFile(scriptPath, 'utf8');

const requiredMetadata = [
    '// ==UserScript==',
    '// @name $IMPC!TYDOWNLOADER',
    '// @namespace https://github.com/atedickfer/SIMPCITYDOWNLOADER',
    '// @author atedickfer',
    '// @version 4.4.0',
    '// @grant GM_xmlhttpRequest',
    '// @grant GM_download',
];

const missing = requiredMetadata.filter(line => !source.includes(line));
const validationErrors = [];
if (!source.startsWith('// ==UserScript==\n')) {
    validationErrors.push('The metadata block must start at the first byte.');
}
if (/^\/\/\s*@require\s+https:\/\/raw\.githubusercontent\.com\//m.test(source)) {
    validationErrors.push('Greasy Fork rejects raw.githubusercontent.com @require URLs without integrity metadata.');
}

if (missing.length || validationErrors.length) {
    console.error(`Missing userscript metadata:\n${missing.join('\n')}`);
    validationErrors.forEach(error => console.error(error));
    process.exitCode = 1;
} else {
    console.log('Userscript metadata verified.');
}
