import { BigIntToByteArray } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/Utils.js";
import { canvasWidth, canvasHeight, decryptImage, verifyLogIn, getSHA256Hash, prepareAlbumCanvas, encryptedDefaultImage } from "/utils.js"

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
    const respJson = JSON.parse(respText)

    // refresh dropdown
    refreshDropdownOptions(respJson)
}

export async function getSelectedAlbum() {
    const [uid, cvk] = verifyLogIn()

    const dropdown = document.getElementById("dropdown")
    const userChosen = dropdown.value

    // request selected album from server
    const respGetAlbum = await fetch(window.location.origin + `/user/getselectedalbum?userAlias=${userChosen}`, {
        method: 'GET',
    });
    if (!respGetAlbum.ok) alert("Something went wrong when requesting for the selected album.");
    const respGetAlbumText = await respGetAlbum.text();
    if (respGetAlbumText == "--FAILED--") alert("failed.")
    const respGetAlbumJson = JSON.parse(respGetAlbumText);

    // request the user's shares on the server
    const respGetShares = await fetch(window.location.origin + `/user/getShares?shareTo=${uid}&albumId=0`, {
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

    var selectedAlbumText = document.getElementById("selectedalbumtext");
    selectedAlbumText.textContent = "Viewing " + userChosen + "'s album"

    var table = document.getElementById("viewtbl");
    populateTable(table, respGetAlbumJson, sharesMap, cvk, constructTableRowNoActions)
}

export async function populateTable(table, respGetAlbumJson, sharesMap, cvk, constructTableRow) {
    var tbody = table.getElementsByTagName("tbody")[0];
    while (table.rows.length > 1) table.rows[1].remove();

    for (var i = 0; i < respGetAlbumJson.length; i++) {
        const entry = respGetAlbumJson[i]
        var imageCell = constructTableRowNoActions(entry.description, tbody, entry.id, entry.pubKey);
        var rowCanvas = prepareAlbumCanvas(imageCell, i, canvasWidth, canvasHeight)
        var ctx = rowCanvas.getContext('2d');
        ctx.clearRect(0, 0, rowCanvas.width, rowCanvas.height);

        if (entry.pubKey != "0") {
            const pubKey = BigInt(entry.pubKey)
            const pixelArray = new Uint8ClampedArray(await decryptImage(entry.encryptedData, pubKey));
            const imgData = new ImageData(pixelArray, rowCanvas.width, rowCanvas.height)
            ctx.putImageData(imgData, 0, 0)
        }
        else if (sharesMap.size > 0) {
            // TODO: decrypt image using the correct share key
            console.log("sharemap size > 0")
        }
        else {
            ctx.drawImage(encryptedDefaultImage, 0, 0, canvasWidth, canvasHeight)
        }
    }
}

function constructTableRowNoActions(description, tbody) {
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

    return imageCell
}

export async function registerAlbum() {
    const userAlias = window.sessionStorage.getItem("userAlias");
    const [uid, cvk] = verifyLogIn()

    const form = new FormData();
    form.append("userAlias", userAlias)
    const resp = await fetch(window.location.origin + `/user/registeralbum?albumId=${uid}`, {
        method: 'POST',
        body: form
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");
}

function refreshDropdownOptions(respJson) {
    var dropdown = document.getElementById("dropdown")
    var options = dropdown.options
    for (var i = options.length; i > 0; i--) {
        options[i - 1].remove()
    }
    for (var i = 0; i < respJson.length; i++) {
        const name = respJson[i]
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        dropdown.appendChild(option)
    }
}