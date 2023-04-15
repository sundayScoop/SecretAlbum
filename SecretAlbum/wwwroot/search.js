import { Hash } from 'https://cdn.jsdelivr.net/gh/tide-foundation/heimdall@main/heimdall.js';
import { canvasWidth, canvasHeight, decryptImage, verifyLogIn, getSHA256Hash } from "/utils.js"
import { populateTable } from "/account.js"

export async function queryAlbums() {
    registerAlbum()

    const cvk = window.localStorage.getItem("CVK");
    const uid = window.localStorage.getItem("UID");
    const userAlias = window.localStorage.getItem("userAlias");
    verifyLogIn(cvk, uid)

    // query available user aliases from the server 
    const form = new FormData();
    form.append("userAlias", userAlias)
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
    const cvk = window.localStorage.getItem("CVK");
    const uid = window.localStorage.getItem("UID");
    verifyLogIn(cvk, uid)

    const dropdown = document.getElementById("dropdown")
    const userChosen = dropdown.value
    const resp = await fetch(window.location.origin + `/user/getselectedalbum?userAlias=${userChosen}`, {
        method: 'GET',
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");
    const respText = await resp.text();
    if (respText == "--FAILED--") alert("failed.")
    const respJson = JSON.parse(respText);

    var selectedAlbumText = document.getElementById("selectedalbumtext");
    selectedAlbumText.textContent = "Viewing " + userChosen + "'s album"

    var table = document.getElementById("viewtbl");
    populateTable(table, respJson, cvk, constructTableRowNoActions)
}

function constructTableRowNoActions(description, tbody, imageId) {  // imageId field is needed here
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
    const cvk = window.localStorage.getItem("CVK");
    const uid = window.localStorage.getItem("UID");
    const userAlias = window.localStorage.getItem("userAlias");
    verifyLogIn(cvk, uid)
    const albumId = await getSHA256Hash(uid + ":" + cvk) // TODO: hash it with heimdall

    const form = new FormData();
    form.append("userAlias", userAlias)
    const resp = await fetch(window.location.origin + `/user/registeralbum?albumId=${albumId}`, {
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