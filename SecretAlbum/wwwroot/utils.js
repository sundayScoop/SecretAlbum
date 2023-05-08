import { AES, Utils, EdDSA, Hash, KeyExchange } from 'https://cdn.jsdelivr.net/gh/tide-foundation/heimdall@main/heimdall.js';

export const canvasWidth = 300;
export const canvasHeight = 300;
export const encryptedDefaultImage = new Image(150, 150);
encryptedDefaultImage.src = "/images/encrypted2.png";

export function verifyLogIn() {
    var cvk = window.sessionStorage.getItem("CVK");
    var uid = window.sessionStorage.getItem("UID");
    if (cvk === null || uid === null) {
        alert("CVK/UID not found, please log in first")
        window.location.replace(window.location.origin);
    }
    return [uid, cvk]
}

export async function getTime() {
    const respTime = await fetch(window.location.origin + `/user/getTime`);
    return await respTime.text()
}

export async function registerAlbum() {
    const userAlias = window.sessionStorage.getItem("userAlias");
    const [uid, cvk] = verifyLogIn()
    const timeMsg = btoa(await getTime())
    const sig = await EdDSA.sign(timeMsg, BigInt(cvk))

    const form = new FormData();
    form.append("userAlias", userAlias)
    form.append("jwt", timeMsg + "." + sig)
    const resp = await fetch(window.location.origin + `/user/registeralbum?albumId=${uid}`, {
        method: 'POST',
        body: form
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");
    return
}

export function processImage(imgFile) {
    const imgUrl = `${URL.createObjectURL(imgFile)}`
    const imgInstance = new Image(150, 150);
    imgInstance.src = imgUrl;
    return imgInstance;
}

export function prepareAlbumCanvas(imageCell, i, canvasWidth, canvasHeight) {
    let canvas = document.createElement("canvas");
    let canvasName = "myAlbumCanvas" + i.toString()
    canvas.setAttribute("id", canvasName);
    imageCell.appendChild(canvas)
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    return canvas
}

// source: https://alicebobandmallory.com/articles/2010/10/14/encrypt-images-in-javascript
function pixelArrToString(arr) {
    var s = "";
    for (var i = 0; i < arr.length; i += 4) {
        s += (String.fromCharCode(arr[i])
            + String.fromCharCode(arr[i + 1])
            + String.fromCharCode(arr[i + 2])
            + String.fromCharCode(arr[i + 3]));
    }
    return s;
}

// source: https://alicebobandmallory.com/articles/2010/10/14/encrypt-images-in-javascript
function stringToPixelArr(s) {
    var arr = [];
    for (var i = 0; i < s.length; i += 4) {
        for (var j = 0; j < 4; j++) {
            arr.push(s.substring(i + j, i + j + 1).charCodeAt());
        }
    }
    return arr;
}

export async function encryptImage(imgData, keyBytes) {
    var pixelArray = imgData.data;
    var imgString = pixelArrToString(pixelArray);
    return await AES.encryptData(imgString, keyBytes);
}

export async function decryptImage(encryptedImg, keyBytes) {
    var imgString = await AES.decryptData(encryptedImg, keyBytes)
    var pixelArray = stringToPixelArr(imgString)
    return pixelArray;
}