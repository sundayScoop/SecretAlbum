import { encryptData, decryptData } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/AES.js";
import { BigIntToByteArray } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/Utils.js";
import { signIn, signUp, AES, Utils, EdDSA, Hash } from 'https://cdn.jsdelivr.net/gh/tide-foundation/heimdall@main/heimdall.js';

const img_input = document.getElementById('imgfileinput')
const img_output_canvas = document.getElementById('imgfileoutput')
img_output_canvas.width = 300;
img_output_canvas.height = 300;
var ctx = img_output_canvas.getContext('2d');

img_input.addEventListener("change", () => {
    const ctx = img_output_canvas.getContext('2d');
    ctx.clearRect(0, 0, img_output_canvas.width, img_output_canvas.height);     // clear the canvas
    const img_instance = processImage(img_input.files[0])                       // convert img file to an Image instance
    img_instance.onload = function () {
        let width = img_instance.naturalWidth;
        let height = img_instance.naturalHeight
        const [new_width, new_height] = resizeImage(width, height);
        ctx.drawImage(img_instance, 0, 0, new_width, new_height);
    }
})

function processImage(img_file) {
    const img_url = `${URL.createObjectURL(img_file)}`
    const img_instance = new Image(150, 150);
    img_instance.src = img_url;
    return img_instance;
}

function resizeImage(width, height) {
    var ratio;
    if (width < height) {
        ratio = img_output_canvas.height / height
    } else {
        ratio = img_output_canvas.width / width
    }
    const new_height = height * ratio
    const new_width = width * ratio
    return [new_width, new_height]
}

const description_input = document.getElementById('descriptioninput')

const btn_upload = document.getElementById('uploadbtn');
btn_upload.addEventListener('click', upload);

const btn_l = document.getElementById('logoutbtn');
btn_l.addEventListener('click', (click) => {
    window.localStorage.removeItem("CVK");
    window.localStorage.removeItem("UID");
    window.location.replace(window.location.origin);
});

refresh()

async function refresh() {
    var cvk = window.localStorage.getItem("CVK");
    var uid = window.localStorage.getItem("UID");

    if (cvk === null || uid === null) {
        alert("CVK/UID not found, please log in first")
        // window.location.replace(window.location.href + "index.html");
        localStorage.setItem("CVK", 1);
        localStorage.setItem("UID", 1);
        return;
    }

    cvk = BigIntToByteArray(BigInt(cvk));

    // const resp = await fetch(window.location.origin + `/user/getdata?uid=${uid}`);
    // const text = await resp.text();
    // if (text !== "--FAILED--") {
    //     const encryptedData = JSON.parse(text); // array of encrypted data

    //     var table = document.getElementById("tbl");
    //     var tbody = table.getElementsByTagName("tbody")[0];

    //     // Loop through the data and create a new row for each item
    //     for (var i = 0; i < encryptedData.length; i++) {
    //         const decryptedData = await decryptData(encryptedData[i], cvk);
    //         const decryptedObj = JSON.parse(decryptedData); // {password, website}

    //         // Create a new row and cells
    //         var row = document.createElement("tr");
    //         var passwordCell = document.createElement("td");
    //         var websiteCell = document.createElement("td");

    //         // Set the text content of the cells to the data values
    //         passwordCell.textContent = decryptedObj.password;
    //         websiteCell.textContent = decryptedObj.website;

    //         // Append the cells to the row
    //         row.appendChild(passwordCell);
    //         row.appendChild(websiteCell);

    //         // Append the row to the tbody
    //         tbody.appendChild(row);
    //     }
    // }
}

async function upload() {
    console.log("debug upload");

    var cvk = window.localStorage.getItem("CVK");
    cvk = BigIntToByteArray(BigInt(cvk));
    var uid = window.localStorage.getItem("UID");

    if (cvk === null || uid === null) {
        alert("CVK/UID not found, please log in first")
        // window.location.replace(window.location.origin + "/index.html");
    }

    const albumId = uid + ":" + cvk // TODO: hash it when heimdall is functional
    console.log(albumId)

    const encrypted_img_string = await encryptImage(ctx, cvk);
    // const encrypted_img_string = "test"
    console.log(encrypted_img_string)
    const description = description_input.value;
    console.log(description)

    // send the image and description to the server
    const form = new FormData();
    form.append("description", description)
    form.append("encryptedImg", encrypted_img_string);
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
            + String.fromCharCode(arr[i + 2]));
    }
    return s;
}

async function encryptImage(ctx, cvk) {
    var img_data = ctx.getImageData(0, 0, img_output_canvas.width, img_output_canvas.height);
    var pixel_array = img_data.data;
    var img_string = pixelArrToString(pixel_array);
    return await encryptData(img_string, cvk);
}