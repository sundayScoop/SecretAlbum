import { canvasWidth, canvasHeight, decryptImage, verifyLogIn, getSHA256Hash, prepareAlbumCanvas, encryptedDefaultImage } from "/utils.js"
import Point from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Ed25519/point.js";
import { signIn, signUp, AES, Utils, EdDSA, Hash, KeyExchange } from 'https://cdn.jsdelivr.net/gh/tide-foundation/heimdall@main/heimdall.js';

export async function queryAlbums() {
    registerAlbum()
    verifyLogIn()

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
    const respJsonList = JSON.parse(respText)

    // refresh dropdown
    refreshDropdownOptions(respJsonList)
}

export async function getSelectedAlbum() {
    const [uid, cvk] = verifyLogIn()

    const dropdown = document.getElementById("dropdown")
    const albumChosen = dropdown.value

    // request selected album from server
    const respGetAlbum = await fetch(window.location.origin + `/user/getimages?albumId=${albumChosen}`, {
        method: 'GET',
    });
    if (!respGetAlbum.ok) alert("Something went wrong when requesting for the selected album.");
    const respGetAlbumText = await respGetAlbum.text();
    if (respGetAlbumText == "--FAILED--") alert("failed.")
    const respGetAlbumJson = JSON.parse(respGetAlbumText);

    // request the user's shares on the server
    const respGetShares = await fetch(window.location.origin + `/user/getShares?shareTo=${uid}&albumId=${albumChosen}`, {    //TODO: change albumId to ${albumChosen}
        method: 'GET',
    });
    if (!respGetShares.ok) alert("Something went wrong when requesting for shares.");
    const respGetSharesText = await respGetShares.text();
    var respGetSharesJson = JSON.parse(respGetSharesText);
    var sharesList = []
    for (var i = 0; i < respGetSharesJson.length; i++) {
        const imageId = respGetSharesJson[i].imageId
        const encKey = respGetSharesJson[i].encKey
        const share = [imageId, encKey]
        sharesList.push(share)
    }
    const sharesMap = new Map(sharesList);

    // display text indicating which album the user is currently viewing
    const selectedAlbumText = document.getElementById("selectedalbumtext");
    const aliasChosen = dropdown.options[dropdown.selectedIndex].text
    selectedAlbumText.textContent = "Viewing " + aliasChosen + "'s album"

    var table = document.getElementById("viewtbl");
    populateTable(table, respGetAlbumJson, sharesMap, uid, cvk, constructTableRowNoActions)
}

export async function populateTable(table, respGetAlbumJson, sharesMap, uid, cvk, constructTableRowNoActions) {
    var tbody = table.getElementsByTagName("tbody")[0];
    while (table.rows.length > 1) table.rows[1].remove();

    for (var i = 0; i < respGetAlbumJson.length; i++) {
        const image = respGetAlbumJson[i]

        let imageStatus = "private";
        if (image.pubKey != "0") {
            imageStatus = "public"
        }
        else if (sharesMap.get(image.id.toString())) {
            imageStatus = "shared with you"
        }

        var imageCell = constructTableRowNoActions(image.description, imageStatus, tbody);
        var rowCanvas = prepareAlbumCanvas(imageCell, i, canvasWidth, canvasHeight)
        var ctx = rowCanvas.getContext('2d');
        ctx.clearRect(0, 0, rowCanvas.width, rowCanvas.height);

        if (image.pubKey != "0") {
            const pubKey = Point.fromB64(image.pubKey)
            const pixelArray = new Uint8ClampedArray(await decryptImage(image.encryptedData, pubKey.toArray()));
            const imgData = new ImageData(pixelArray, rowCanvas.width, rowCanvas.height)
            ctx.putImageData(imgData, 0, 0)
        }
        else if (sharesMap.get(image.id.toString())) { // decrypt image using the correct share key
            const encKeyPersonal = Point.fromB64(sharesMap.get(image.id.toString()))
            const encKey = encKeyPersonal.times(Utils.mod_inv(BigInt(cvk)))
            const pixelArray = new Uint8ClampedArray(await decryptImage(image.encryptedData, encKey.toArray()));
            const imgData = new ImageData(pixelArray, rowCanvas.width, rowCanvas.height)
            ctx.putImageData(imgData, 0, 0)
        }
        else {
            ctx.drawImage(encryptedDefaultImage, 0, 0, canvasWidth, canvasHeight)
        }
    }
}

function constructTableRowNoActions(description, imageStatus, tbody) {
    const row = document.createElement("tr");
    const imageCell = document.createElement("td");
    const descriptionCell = document.createElement("td");
    descriptionCell.style = "vertical-align: top; white-space: pre;"
    descriptionCell.textContent = "Status: " + imageStatus + "\r\n\r\n" + description;
    const actionCell = document.createElement("td");
    actionCell.style = "vertical-align: top;"

    row.appendChild(imageCell)
    row.appendChild(descriptionCell)
    row.appendChild(actionCell)
    tbody.appendChild(row);

    return imageCell
}

export async function registerAlbum() {
    const userAlias = window.sessionStorage.getItem("userAlias");
    const [uid, cvk] = verifyLogIn()
    var verifyKey = EdDSA.PublicKey.fromPrivate(BigInt(cvk))
    verifyKey = new Point(verifyKey.getX(), verifyKey.getY()).toBase64()

    const form = new FormData();
    form.append("userAlias", userAlias)
    form.append("verifyKey", verifyKey)
    const resp = await fetch(window.location.origin + `/user/registeralbum?albumId=${uid}`, {
        method: 'POST',
        body: form
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");
}

function refreshDropdownOptions(respJsonList) {
    var dropdown = document.getElementById("dropdown")
    var options = dropdown.options
    for (var i = options.length; i > 0; i--) {
        options[i - 1].remove()
    }
    for (var i = 0; i < respJsonList.length; i++) {
        const json = respJsonList[i]
        const albumId = json.albumId
        const name = json.userAlias
        const option = document.createElement("option");
        option.value = albumId;
        option.textContent = name;
        dropdown.appendChild(option)
    }
}