import { encryptData, decryptData } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/AES.js";
import Point from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Ed25519/point.js";
import { signIn, signUp, AES, Utils, EdDSA, Hash } from 'https://cdn.jsdelivr.net/gh/tide-foundation/heimdall@main/heimdall.js';
import { canvasWidth, canvasHeight, decryptImage, verifyLogIn, getSHA256Hash, prepareAlbumCanvas, encryptedDefaultImage } from "/utils.js"

export async function showMyAlbum() {
    const [uid, cvk] = verifyLogIn()

    // request my images from server
    const resp = await fetch(window.location.origin + `/user/getimages?albumId=${uid}`);
    const respText = await resp.text();
    if (respText == "--FAILED--") {
        alert("failed.")
        return
    }
    const respJson = JSON.parse(respText);

    // set up the table and clear it
    var table = document.getElementById("myalbumtbl");
    populateTable(table, respJson, uid, cvk, constructTableRow)
}

async function populateTable(table, respJson, uid, cvk, constructTableRow) {
    var tbody = table.getElementsByTagName("tbody")[0];
    while (table.rows.length > 1) table.rows[1].remove();

    for (var i = 0; i < respJson.length; i++) {
        const entry = respJson[i]

        var [imageCell, actionCell] = constructTableRow(entry.description, tbody);
        var rowCanvas = prepareAlbumCanvas(imageCell, i, canvasWidth, canvasHeight)
        var ctx = rowCanvas.getContext('2d');
        ctx.clearRect(0, 0, rowCanvas.width, rowCanvas.height);

        const seed = BigInt(await decryptData(entry.seed, BigInt(cvk)));
        const imageKey = Point.g.times(seed)
        const pixelArray = new Uint8ClampedArray(await decryptImage(entry.encryptedData, imageKey.toArray()));
        var imgData = new ImageData(pixelArray, rowCanvas.width, rowCanvas.height)
        ctx.putImageData(imgData, 0, 0)

        // make action buttons
        createMakePublicButton("Make Public", entry.id, actionCell, imageKey);
        createShareWithButton("Share With", entry.id, actionCell, seed);
        createDeleteButton("Delete", entry.id, actionCell);
    }
}

function constructTableRow(description, tbody) {
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

    return [imageCell, actionCell]
}

function createMakePublicButton(text, imageId, actionCell, imageKey) {
    const actionBtn = document.createElement("button");
    actionBtn.textContent = text
    actionBtn.style = 'float: right; margin: 4px'
    actionBtn.addEventListener('click', function () {
        requestMakePublic(imageId, imageKey.toBase64());
    })
    actionCell.appendChild(actionBtn)
    actionCell.appendChild(document.createElement("br"))
}

async function requestMakePublic(imageId, pubKey) {
    // request my images from server
    const form = new FormData();
    const [uid, cvk] = verifyLogIn()
    form.append("imageId", imageId)
    form.append("pubKey", pubKey)
    const resp = await fetch(window.location.origin + `/user/makepublic?albumId=${uid}`, {
        method: 'POST',
        body: form
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");
}

function createShareWithButton(text, imageId, actionCell, seed) {
    const actionBtn = document.createElement("button");
    actionBtn.textContent = text
    actionBtn.style = 'float: right; margin: 4px'
    actionBtn.addEventListener('click', async function () {
        const list = await getUserAliases()
        const selectedUser = prompt(list.toString(), "Harry Potter");
        requestShareWith(imageId, selectedUser, seed);
    })
    actionCell.appendChild(actionBtn)
    actionCell.appendChild(document.createElement("br"))
}

async function getUserAliases() {
    // query available user aliases from the server 
    const resp = await fetch(window.location.origin + `/user/getalbums`, {
        method: 'GET',
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");

    const respText = await resp.text();
    if (respText == "--FAILED--") {
        alert("failed.")
        return
    }
    const respJson = JSON.parse(respText)
    return respJson;
}

async function requestShareWith(imageId, shareTo, seed) {
    const form = new FormData();
    const [uid, cvk] = verifyLogIn()
    form.append("albumId", uid)
    form.append("imageId", imageId)
    form.append("shareTo", shareTo)
    const userPubKey = await getUserPubKey(shareTo)
    form.append("encKey", (userPubKey.times(seed)).toBase64())
    const resp = await fetch(window.location.origin + `/user/shareto?albumId=${uid}`, {
        method: 'POST',
        body: form
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");

}

async function getUserPubKey(selectedUser) {
    const respUserId = await fetch(window.location.origin + `/user/getUserId?userAlias=${selectedUser}`, {
        method: 'GET'
    });
    const userId = await respUserId.text()
    const respSim = await fetch(`https://new-simulator.australiaeast.cloudapp.azure.com/keyentry/${userId}`);
    if (!respSim.ok) throw Error("Start Key Exchange: Could not find UID's entry at simulator");
    const respSimJson = await respSim.json();
    return Point.fromB64(respSimJson.public);
}

function createDeleteButton(text, imageId, actionCell) {
    const actionBtn = document.createElement("button");
    actionBtn.textContent = text
    actionBtn.style = 'float: right; margin: 4px'
    actionBtn.addEventListener('click', function () {
        requestDelete(imageId);
    })
    actionCell.appendChild(actionBtn)
    actionCell.appendChild(document.createElement("br"))
}

async function requestDelete(imageId) {

}
