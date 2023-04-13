import { encryptData, decryptData } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/AES.js";
import { BigIntToByteArray, RandomBigInt } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/Utils.js";
import Point from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Ed25519/point.js";
import { signIn, signUp, AES, Utils, EdDSA, Hash } from 'https://cdn.jsdelivr.net/gh/tide-foundation/heimdall@main/heimdall.js';
import { decryptImage, verifyLogIn, getSHA256Hash } from "/utils.js"

const canvasWidth = 300;
const canvasHeight = 300;

const menuAccount = document.getElementById('accountmenu');
menuAccount.addEventListener('click', showMyAlbum);

export async function showMyAlbum() {
    var cvk = BigInt(window.localStorage.getItem("CVK"));
    var uid = window.localStorage.getItem("UID");
    if (!verifyLogIn(cvk, uid)) return
    const albumId = await getSHA256Hash(uid + ":" + cvk) // TODO: hash it with heimdall

    // request my images from server
    const resp = await fetch(window.location.origin + `/user/getimages?albumId=${albumId}`);
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
        var imageCell = constructTableRow(entry.description, tbody);
        var rowCanvas = prepareCanvas(imageCell, i)
        var imageKeyByteArray = await prepareImageKey(entry.seed, entry.imageKey, cvk)

        // draw decrypted image on canvas
        var ctx = rowCanvas.getContext('2d');
        const pixelArray = new Uint8ClampedArray(await decryptImage(entry.encryptedData, imageKeyByteArray));
        const imgData = new ImageData(pixelArray, rowCanvas.width, rowCanvas.height)
        ctx.clearRect(0, 0, rowCanvas.width, rowCanvas.height);
        ctx.putImageData(imgData, 0, 0)
    }
}

function constructTableRow(description, tbody) {
    const row = document.createElement("tr");
    const imageCell = document.createElement("td");
    const descriptionCell = document.createElement("td");
    const actionCell = document.createElement("td");

    descriptionCell.textContent = description;
    actionCell.textContent = "action";

    row.appendChild(imageCell)
    row.appendChild(descriptionCell)
    row.appendChild(actionCell)
    tbody.appendChild(row);

    return imageCell
}

function prepareCanvas(imageCell, i) {
    let canvas = document.createElement("canvas");
    let canvasName = "myAlbumCanvas" + i.toString()
    canvas.setAttribute("id", canvasName);
    imageCell.appendChild(canvas)
    const rowCanvas = document.getElementById(canvasName)
    rowCanvas.width = canvasWidth;
    rowCanvas.height = canvasHeight;

    return rowCanvas
}

async function prepareImageKey(seed, entryImageKey, cvk) {
    var imageKeyByteArray
    const decryptedSeed = BigInt(await decryptData(seed, BigIntToByteArray(cvk)))
    if (entryImageKey == "0") {
        var imageKey = Point.g.times(decryptedSeed).times(cvk)
        imageKeyByteArray = BigIntToByteArray(imageKey.x)
    }
    return imageKeyByteArray
}
