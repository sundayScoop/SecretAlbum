import { encryptData, decryptData } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/AES.js";
import { BigIntToByteArray, RandomBigInt } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/Utils.js";
import Point from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Ed25519/point.js";
import { signIn, signUp, AES, Utils, EdDSA, Hash } from 'https://cdn.jsdelivr.net/gh/tide-foundation/heimdall@main/heimdall.js';
import { canvasWidth, canvasHeight, decryptImage, verifyLogIn, getSHA256Hash } from "/utils.js"
import { showMyAlbum } from "/account.js"
import { upload, uploadCanvas } from "/upload.js"

intialize()

const btnUpload = document.getElementById('uploadbtn');
btnUpload.addEventListener('click', upload);

const btnLogout = document.getElementById('logoutbtn');
btnLogout.addEventListener('click', (click) => {
    window.localStorage.removeItem("CVK");
    window.localStorage.removeItem("UID");
    window.localStorage.removeItem("userAlias");
    window.location.replace(window.location.origin);
});

const menuAccount = document.getElementById('accountmenu');
menuAccount.addEventListener('click', showMyAlbum);

const menuSearch = document.getElementById('searchmenu');
menuSearch.addEventListener('click', queryAlbums);

async function queryAlbums() {
    registerAlbum()

    const cvk = BigInt(window.localStorage.getItem("CVK"));
    const uid = window.localStorage.getItem("UID");
    const userAlias = window.localStorage.getItem("userAlias");
    if (!verifyLogIn(cvk, uid)) return; //window.location.replace(window.location.origin + "/index.html");

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
    var dropdown = document.getElementById("dropdown")
    if (dropdown) dropdown.remove()
    const search = document.getElementById("search")
    dropdown = document.createElement("select");
    dropdown.id = "dropdown"
    search.appendChild(dropdown)

    for (var i = 0; i < respJson.length; i++) {
        const name = respJson[i]
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        dropdown.appendChild(option)
    }

    var btnSelect = document.getElementById("btnSelect");
    if (btnSelect) btnSelect.remove()
    btnSelect = document.createElement("button");
    btnSelect.id = "btnSelect"
    search.appendChild(btnSelect)
    btnSelect.addEventListener('click', getSelectedAlbum);
}

async function getSelectedAlbum() {
    const dropdown = document.getElementById("dropdown")
    const userAlias = dropdown.value
    const resp = await fetch(window.location.origin + `/user/getselectedalbum?userAlias=${userAlias}`, {
        method: 'GET',
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");
}

async function registerAlbum() {
    const cvk = BigInt(window.localStorage.getItem("CVK"));
    const uid = window.localStorage.getItem("UID");
    const userAlias = window.localStorage.getItem("userAlias");
    if (!verifyLogIn(cvk, uid)) return; //window.location.replace(window.location.origin + "/index.html");
    const albumId = await getSHA256Hash(uid + ":" + cvk) // TODO: hash it with heimdall

    // query available user aliases from the server 
    const form = new FormData();
    form.append("userAlias", userAlias)
    const resp = await fetch(window.location.origin + `/user/registeralbum?albumId=${albumId}`, {
        method: 'POST',
        body: form
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");
}

function intialize() {
    var cvk = BigInt(window.localStorage.getItem("CVK"));
    var uid = window.localStorage.getItem("UID");
    if (!verifyLogIn(cvk, uid)) window.location.replace(window.location.origin)

    registerAlbum()
}