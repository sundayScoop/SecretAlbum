import { encryptData, decryptData } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/AES.js";

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
    return await encryptData(imgString, keyBytes);
}

export async function decryptImage(encryptedImg, keyBytes) {
    var imgString = await decryptData(encryptedImg, keyBytes)
    var pixelArray = stringToPixelArr(imgString)
    return pixelArray;
}

// use this hash function temporarily until Heimdall gets fixed
export async function getSHA256Hash(input) {
    const textAsBuffer = new TextEncoder().encode(input);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", textAsBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray
        .map((item) => item.toString(16).padStart(2, "0"))
        .join("");
    return hash;
};