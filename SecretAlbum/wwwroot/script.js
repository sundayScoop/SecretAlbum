import { encryptData, decryptData } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/AES.js";
import { BigIntToByteArray, RandomBigInt } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/Utils.js";
import Point from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Ed25519/point.js";
import { signIn, signUp, AES, Utils, EdDSA, Hash } from 'https://cdn.jsdelivr.net/gh/tide-foundation/heimdall@main/heimdall.js';

const imgInput = document.getElementById('imgfileinput')
const uploadCanvas = document.getElementById('imgfileoutput')
const canvasWidth = 300;
const canvasHeight = 300;

intialize()

const btnUpload = document.getElementById('uploadbtn');
btnUpload.addEventListener('click', upload);

const btnLogout = document.getElementById('logoutbtn');
btnLogout.addEventListener('click', (click) => {
    window.localStorage.removeItem("CVK");
    window.localStorage.removeItem("UID");
    window.location.replace(window.location.origin);
});

const btnAccount = document.getElementById('accountbtn');
btnAccount.addEventListener('click', (click) => {
    showMyAlbum();
});


async function intialize() {
    var cvk = window.localStorage.getItem("CVK");
    var uid = window.localStorage.getItem("UID");
    if (!verifyLogIn(cvk, uid)) window.location.replace(window.location.origin)
}

imgInput.addEventListener("change", () => {
    uploadCanvas.width = canvasWidth
    uploadCanvas.height = canvasHeight
    const ctx = uploadCanvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);     // clear the canvas
    const imgInstance = processImage(imgInput.files[0])               // convert img file to an Image instance
    imgInstance.onload = function () {
        let width = imgInstance.naturalWidth;
        let height = imgInstance.naturalHeight
        const [newX, newY, newWidth, newHeight] = getNewSizeAndPlacement(width, height);
        console.log([newX, newY, newWidth, newHeight])
        ctx.drawImage(imgInstance, newX, newY, newWidth, newHeight);
    }
})

async function showMyAlbum() {
    var cvk = window.localStorage.getItem("CVK");
    cvk = BigIntToByteArray(BigInt(cvk));
    var uid = window.localStorage.getItem("UID");

    if (!verifyLogIn(cvk, uid)) return

    const albumId = await getSHA256Hash(uid + ":" + cvk) // TODO: hash it with heimdall
    const resp = await fetch(window.location.origin + `/user/getdata?albumId=${albumId}`);
    const respText = await resp.text();
    if (respText == "--FAILED--") {
        alert("failed.")
        return
    }
    const respJson = JSON.parse(respText);

    // set up the table and clear it
    var table = document.getElementById("tbl");
    var tbody = table.getElementsByTagName("tbody")[0];
    while (table.rows.length > 1) table.rows[1].remove();

    for (var i = 0; i < respJson.length; i++) {
        const entry = respJson[i]

        // Create a new row and cells
        const row = document.createElement("tr");
        const imageCell = document.createElement("td");
        const descriptionCell = document.createElement("td");
        const actionCell = document.createElement("td");

        descriptionCell.textContent = entry.description;
        actionCell.textContent = "action";

        row.appendChild(imageCell)
        row.appendChild(descriptionCell)
        row.appendChild(actionCell)
        tbody.appendChild(row);

        // prepare canvas
        let canvas = document.createElement("canvas");
        let canvasName = "myAlbumCanvas" + i.toString()
        canvas.setAttribute("id", canvasName);
        imageCell.appendChild(canvas)
        const rowCanvas = document.getElementById(canvasName)
        rowCanvas.width = 300;
        rowCanvas.height = 300;

        // decrypt image
        var imageKey
        var imageKeyByteArray
        if (entry.imageKey == "0") {
            imageKey = Point.g.times(BigInt(entry.seed)).times(cvk)
            imageKeyByteArray = BigIntToByteArray(imageKey.x)
        }

        // put image on canvas
        var ctx = rowCanvas.getContext('2d');
        const pixelArray = new Uint8ClampedArray(await decryptImage(entry.encryptedData, imageKeyByteArray));
        const imgData = new ImageData(pixelArray, rowCanvas.width, rowCanvas.height)

        // draw decrypted image
        ctx.clearRect(0, 0, rowCanvas.width, rowCanvas.height);
        ctx.putImageData(imgData, 0, 0)
    }
}

function verifyLogIn(cvk, uid) {
    if (cvk === null || uid === null) {
        alert("CVK/UID not found, please log in first")
        // window.location.replace(window.location.href + "index.html");
        localStorage.setItem("CVK", 1);
        localStorage.setItem("UID", 1);
        return false;
    }
    return true;
}

function processImage(imgFile) {
    const imgUrl = `${URL.createObjectURL(imgFile)}`
    const imgInstance = new Image(150, 150);
    imgInstance.src = imgUrl;
    return imgInstance;
}

function getNewSizeAndPlacement(width, height) {
    var ratio;
    if (width == height) {
        ratio = 1
    }
    else if (width < height) {
        ratio = canvasHeight / height

    } else {
        ratio = canvasWidth / width
    }
    const newHeight = height * ratio
    const newWidth = width * ratio

    const newX = parseInt((canvasWidth - newWidth) / 2)
    const newY = parseInt((canvasHeight - newHeight) / 2)

    return [newX, newY, newWidth, newHeight]
}

async function upload() {
    console.log("debug upload");

    var cvk = window.localStorage.getItem("CVK");
    cvk = BigIntToByteArray(BigInt(cvk));
    var uid = window.localStorage.getItem("UID");

    if (!verifyLogIn(cvk, uid)) return; //window.location.replace(window.location.origin + "/index.html");

    // get album Id by hashing the uid & cvk
    const albumId = await getSHA256Hash(uid + ":" + cvk) // TODO: hash it with heimdall

    // create image key and encrypt image
    const seed = RandomBigInt();
    const imageKey = Point.g.times(seed).times(cvk)
    const imageKeyByteArray = BigIntToByteArray(imageKey.x)
    var ctx = uploadCanvas.getContext('2d');

    const encryptedImgString = await encryptImage(ctx, imageKeyByteArray);

    // get description
    const descriptionInput = document.getElementById('descriptioninput')
    const description = descriptionInput.value;

    // send the image and description to the server
    const form = new FormData();
    form.append("seed", seed)
    form.append("description", description)
    form.append("encryptedImg", encryptedImgString);
    const resp = await fetch(window.location.origin + `/user/addImage?albumId=${albumId}`, {
        method: 'POST',
        body: form
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");
    // else location.reload();
}

// source: https://alicebobandmallory.com/articles/2010/10/14/encrypt-images-in-javascript
function pixelArrToString(arr) {
    var s = "";
    // Removes alpha to save space.
    for (var i = 0; i < arr.length; i += 4) {
        s += (String.fromCharCode(arr[i])
            + String.fromCharCode(arr[i + 1])
            + String.fromCharCode(arr[i + 2])
            + String.fromCharCode(arr[i + 3]));
    }
    return s;
}

function stringToPixelArr(s) {
    var arr = [];
    for (var i = 0; i < s.length; i += 4) {
        for (var j = 0; j < 4; j++) {
            arr.push(s.substring(i + j, i + j + 1).charCodeAt());
        }
        // arr.push(255); // Hardcodes alpha to 255.
    }
    return arr;
}

async function encryptImage(ctx, cvk) {
    var ctx = uploadCanvas.getContext('2d');
    var imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    var pixelArray = imgData.data;
    var imgString = pixelArrToString(pixelArray);
    return await encryptData(imgString, cvk);
}

async function decryptImage(encryptedImg, imageKeyByteArray) {
    var imgString = await decryptData(encryptedImg, imageKeyByteArray)
    var pixelArray = stringToPixelArr(imgString)
    return pixelArray;
}

// use this hash function temporarily until Heimdall gets fixed
const getSHA256Hash = async (input) => {
    const textAsBuffer = new TextEncoder().encode(input);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", textAsBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray
        .map((item) => item.toString(16).padStart(2, "0"))
        .join("");
    return hash;
};