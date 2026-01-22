// fontLoader.js
import * as fontkit from 'fontkit';
import { Buffer } from 'buffer';

export function loadFont(url) {
    return fetch(url)
        .then(res => res.arrayBuffer())
        .then(fontBlob => fontkit.create(new Buffer.from(fontBlob)));
}