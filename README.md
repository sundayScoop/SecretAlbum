# SecretAlbum
## What is SecretAlbum?
Social media companies have created platforms where people can upload and share data about their personal lives with friends, family, acquaintances, and even strangers. Some data are meant to be public, while others more private. Unfortunately, there are too many ways your private data can find its way to unauthorized players: hackers can exploit and leak data from the companies' servers, authoritarian governments can view them on a whim, social media companies can sell them to the highest bidders through legal loopholes, and etc. Despite such concerns, uploading private data to social media apps have become all too commonplace today.

SecretAlbum is a proof-of-concept image-sharing social media app that aims to give complete privacy and control to its users. It achieves this by encrypting the users' images sent to the server with a secure key that is only available to the user, and letting the user share the image encryption keys with whoever he/she chooses. Hence, it is impossible for the server to make any sense of the user's data that it stores in its own database (unless the user chooses to make it public), let alone a hacker or the government. Moreover, the said secure key, also known as Consumer-Vendor Key (CVK), is obtained by authenticating with username + password through the Heimdall SDK (https://github.com/tide-foundation/heimdall), which uses Tide's decentralized authentication protocol. This means that the app's server does not hold the users' passwords (nor hashes), which gives one more reason for malicious actors to leave it alone. Learn more about the Tide Protocol here: https://tide.org/tideprotocol

SecretAlbum is forked from https://github.com/sundayScoop/PlatyPasswords

## Implementation
Heimdall SDK's signIn and signUp functions are used to retrieve the user's CVK and UID (hash of username), which are then stored in the browser session for later. The user is always given the option to 'log out' which would clear the session of the CVK and UID. 

The app uses Elliptic Curve Cryptography (ECC) on ed25519 curve to encrypt/decrypt sensitive data. In the following sections, I use the notation * to denote elliptic curve multiplication.

### 1. Encrypting/Decrypting and Publishing Images 
Here, Heimdall SDK's AES functions are used to encrypt sensitive data. When uploading an image, a random BigInt seed value is chosen and the RGB image data is AES encrypted with `imageKey = G * seed`. The seed is then AES encrypted with CVK before being sent to the server to be stored. 

Later, when viewing the image, the user can retrieve from the server the encrypted image data along with the encrypted seed, and perfom the following operations to decrypt the image data: 

```
imageKey = G * AESdecrypt(encryptedSeed, CVK) = G * seed
decryptedImage = AESdecrypt(encryptedImage, imageKey)
```

A user can also choose to make his/her image public. In this case, the image key is sent to the server to be stored in the database, and anyone can retrieve this key to decrypt the corresponding image.

### 2. Sharing Images
When user A shares an image with user B, user A retrieves the public key of user B from Tide's blockchain simulator website (https://new-simulator.australiaeast.cloudapp.azure.com), where `pubKey_B = G * CVK_B`. User A combines this public key with the seed to create `shareKey = G * CVK_B * seed`. This share key is sent to the server to be stored in the database. 

Later, when user B retrieves the said image from user A's album, user B also retrieves the corresponding share key. User B can then extract the correct image key using the following operation: `imageKey = shareKey * modInverse(CVK_B) = G * seed * CVK_B * modInverse(CVK_B) = G * seed`. This scheme allows a user to encrypt image keys and share it in a way that only the specified receivers can decrypt it with their own CVKs while giving the server no clue about the decrypted value.

### 3. Authenticating Requests
An http request to the server is assumed to be coming from the user with the UID specified in the request, which means that an imposter can pretend to be another user by changing the UID value before sending it. This poses no security issue for actions such as viewing images, since an imposter cannot decrypt the images in the event that he/she successfully retrieves them. However, the vulnerability does allow an imposter to perform other dangerous actions such as deleting, publishing, or sharing another user's images. Hence the app authenticates these requests to the server using Heimdall SDK's EdDSA functions. When a user logs in, his/her public key is sent to the server to be stored in the database. For each sensitive request, the user signs a message using his/her CVK (also known as private key) and includes this signature in the request form. When the server receives the request, it verifies the signature using the corresponding public key from the database, ensuring that the request came from the indicated user.


## I want to run SecretAlbum Locally
Make sure you have the [.NET SDK](https://dotnet.microsoft.com/en-us/download/dotnet/6.0) installed, clone the repo, then run the following code from the SecretAlbum directory:

```
dotnet run --urls=http://localhost:8000
```

Navigating to [localhost](http://localhost:8000) will show you the login page. 

To explore what the encrypted data looks like, install a DB explorer such as [Db Browswer](https://sqlitebrowser.org/) and open the LocalDatabase.db in the project.

