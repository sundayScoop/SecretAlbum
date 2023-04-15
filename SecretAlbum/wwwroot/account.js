import { encryptData, decryptData } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/AES.js";
import { BigIntToByteArray, RandomBigInt } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/Utils.js";
import Point from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Ed25519/point.js";
import { signIn, signUp, AES, Utils, EdDSA, Hash } from 'https://cdn.jsdelivr.net/gh/tide-foundation/heimdall@main/heimdall.js';
import { canvasWidth, canvasHeight, decryptImage, verifyLogIn, getSHA256Hash, processImage } from "/utils.js"

const encryptedDefaultImage = new Image(150, 150);
encryptedDefaultImage.src = "/images/encrypted2.png";

export async function showMyAlbum() {
    var cvk = window.localStorage.getItem("CVK");
    var uid = window.localStorage.getItem("UID");
    verifyLogIn(cvk, uid)
    const albumId = await getSHA256Hash(uid + ":" + cvk)

    // request my images from server
    const resp = await fetch(window.location.origin + `/user/getimages?albumId=${albumId}`);
    const respText = await resp.text();
    if (respText == "--FAILED--") {
        alert("failed.")
        return
    }
    const respJson = JSON.parse(respText);

    // set up the table and clear it
    var table = document.getElementById("myalbumtbl");
    populateTable(table, respJson, cvk, constructTableRow)
}

export async function populateTable(table, respJson, cvk, constructTableRow) {
    var tbody = table.getElementsByTagName("tbody")[0];
    while (table.rows.length > 1) table.rows[1].remove();

    for (var i = 0; i < respJson.length; i++) {
        const entry = respJson[i]
        var imageCell = constructTableRow(entry.description, tbody, entry.id);
        var rowCanvas = prepareCanvas(imageCell, i, canvasWidth, canvasHeight)
        var ctx = rowCanvas.getContext('2d');
        ctx.clearRect(0, 0, rowCanvas.width, rowCanvas.height);

        var imageKeyByteArray
        var imgData
        try {
            imageKeyByteArray = await prepareImageKey(entry.seed, entry.imageKey, cvk)
            const pixelArray = new Uint8ClampedArray(await decryptImage(entry.encryptedData, imageKeyByteArray));
            imgData = new ImageData(pixelArray, rowCanvas.width, rowCanvas.height)
            ctx.putImageData(imgData, 0, 0)
        }
        catch {
            ctx.drawImage(encryptedDefaultImage, 0, 0, canvasWidth, canvasHeight)
        }
    }
}

function constructTableRow(description, tbody, imageId) {
    const row = document.createElement("tr");
    const imageCell = document.createElement("td");
    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = description;
    const actionCell = document.createElement("td");
    actionCell.style = "vertical-align: top;"

    row.appendChild(imageCell)
    row.appendChild(descriptionCell)
    row.appendChild(actionCell)
    tbody.appendChild(row);

    const br = document.createElement("br");

    // append a make public button
    const makePublicBtn = document.createElement("button");
    makePublicBtn.textContent = "Make Public"
    makePublicBtn.style = 'float: right; margin: 4px'
    makePublicBtn.addEventListener('click', function () {
        requestMakePublic(imageId);
    })
    actionCell.appendChild(makePublicBtn)
    actionCell.appendChild(br)

    // append a delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete"
    deleteBtn.style = 'float: right; margin: 4px'
    deleteBtn.addEventListener('click', function () {
        requestDelete(imageId);
    })
    actionCell.appendChild(deleteBtn)
    actionCell.appendChild(br)

    return imageCell
}

async function requestMakePublic(imageId) {
    // request my images from server
    const form = new FormData();
    form.append("userAlias", "test1")
    const resp = await fetch(window.location.origin + `/user/getalbums`, {
        method: 'GET',
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");

    const respText = await resp.text();
    const respJson = JSON.parse(respText)
    console.log(respJson)
}


async function requestDelete(imageId) {
    // request my images from server
    const form = new FormData();
    form.append("userAlias", "test1")
    const resp = await fetch(window.location.origin + `/user/getalbums`, {
        method: 'GET',
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");

    const respText = await resp.text();
    const respJson = JSON.parse(respText)
    console.log(respJson)
}


function prepareCanvas(imageCell, i, canvasWidth, canvasHeight) {
    let canvas = document.createElement("canvas");
    let canvasName = "myAlbumCanvas" + i.toString()
    canvas.setAttribute("id", canvasName);
    imageCell.appendChild(canvas)
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    return canvas
}

async function prepareImageKey(seed, entryImageKey, cvk) {
    var imageKeyByteArray
    const decryptedSeed = BigInt(await decryptData(seed, BigIntToByteArray(BigInt(cvk))))
    if (entryImageKey == "0") {
        var imageKey = Point.g.times(decryptedSeed).times(BigInt(cvk))
        imageKeyByteArray = BigIntToByteArray(imageKey.x)
    }
    return imageKeyByteArray
}
