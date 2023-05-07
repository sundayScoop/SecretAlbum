# SecretAlbum
## What is SecretAlbum?
Social media companies have created platforms where people can upload and share data about their personal lives with friends, family, acquaintances, and even strangers. Some data are meant to be public, while others more private. Unfortunately, there are too many ways your private data can find its way to unauthorized players: hackers can exploit and leak data from the companies' servers, authoritarian governments can use them on a whim, social media companies can sell them to the highest bidders through legal loopholes, and etc. Despite such concerns, uploading private data to social media apps have become all too commonplace today.

SecretAlbum is a proof-of-concept image-sharing social media app that aims to give complete privacy and control to its users. It achieves this by encrypting a user's image sent to the server with a secure key that is only available to the user, and letting the user share the image encryption keys securely with whoever he/she chooses. Hence, it is impossible for the server to make any sense of the user's data that it stores in its own database (unless the user chooses to make it public), let alone a hacker or the government. Moreover, the said secure key, also known as Consumer-Vendor Key (CVK), is obtained by authenticating with username + password through the Heimdall SDK (https://github.com/tide-foundation/heimdall), which uses Tide's decentralized authentication protocol. This means that the app's server does not hold the users' passwords (nor hashes), which gives one more reason for malicious actors to leave it alone. Learn more about the Tide Protocol here: https://tide.org/tideprotocol

SecretAlbum is forked from https://github.com/sundayScoop/PlatyPasswords

## Implementation
Heimdall SDK's signIn and signUp functions are used to retrieve the user's CVK and UID (hash of username), which are then stored in the browser session for later. The user is always given the option to 'log out' which would clear the session of the CVK and UID. 

The app uses Elliptic Curve Cryptography (ECC) on ed25519 curve to encrypt/decrypt sensitive data. In the following sections, I use the notation * to denote elliptic curve multiplication.

### 1. Encrypting/Decrypting and Publishing Images 
Heimdall SDK's AES functions are used to encrypt sensitive data that would be stored in the server, which ensures that the server cannot make any sense of the data. When uploading an image, a random BigInt seed value is chosen and the RGB image data is AES encrypted with `imageKey = G * seed`. The seed is then AES encrypted with CVK before being sent along with the encrypted image data to the server to be stored. 

Later, when viewing the image, the user can retrieve from the server the encrypted image data along with the encrypted seed, and perfom the following operations to decrypt the image data: 

```
imageKey = G * AESdecrypt(encryptedSeed, CVK) = G * seed
decryptedImage = AESdecrypt(encryptedImage, imageKey)
```

Evidently, only the user with the correct CVK can decrypt the seed, then decrypt the image data.

A user can also choose to make his/her image public. In this case, the image key is sent to the server to be stored in the database, and anyone can retrieve this key to decrypt the corresponding image.

### 2. Sharing Images
Here, I describe a cryptographic scheme that I made myself, because I believe Heimdall SDK does not provide a method for this specific use case (I am aware of the consequences in marks). When user A shares an image with user B, user A retrieves the public key of user B from Tide's blockchain simulator website (https://new-simulator.australiaeast.cloudapp.azure.com), where `pubKey_B = G * CVK_B`. User A combines this public key with the seed to create `shareKey = G * CVK_B * seed`. This share key is sent to the server to be stored in the database. 

Later, when user B retrieves the said image from user A's album, user B also retrieves the corresponding share key. User B can then extract the correct image key using the following operation: `imageKey = shareKey * modInverse(CVK_B) = G * seed * CVK_B * modInverse(CVK_B) = G * seed`. This scheme allows a user to encrypt image keys and share it in a way that only the specified receivers can decrypt it with their own CVKs while giving the middlemen no clue about the decrypted value.

### 3. Verifying Requests
An http request to the server is assumed to be coming from the user with the UID specified in the request, which means that an imposter can pretend to be another user by changing the UID value before sending it. This poses no security issue for actions such as viewing images, since an imposter cannot decrypt the images without a proper CVK. However, the vulnerability does allow an imposter to perform other dangerous actions such as deleting, publishing, or sharing another user's images. Hence the app authenticates these requests to the server using Heimdall SDK's EdDSA functions. To send each sensitive request, a user signs a message using his/her CVK (also known as private key) and includes this signature in the request form. When the server receives the request, it verifies the signature using the corresponding public key queried from the simulator website, ensuring that the request came from the indicated user.

However, if the same message is used each time, it would generate the same signature over and over again. In this case, a hacker who somehow obtains the signature could masquerade as the victim and pass the EdDSA verification process. To solve this problem, I use the server's current time as the message to the signature. Specifically, the client makes two requests per action: 1. asking the server's current time, and 2. the actual request containing a signature made using the received time as a message. The current time is rounded down to the nearest second divisible by four, so as long as the second request arrives to the server within around 4 seconds of the first request, the message can be correctly predicted by the server, thus verifying the signature. There is a failure edge case where, for example, the first request for the time is received by the server right before 12:04 and then the second request is received right after 12:04. In this case, the response to the first request would be "12:00" (rounded down to the nearest second divisible by four), while the verification process on the server for the second request would use "12:04" as the message. Since the two messages don't match, verification would fail. To mitigate this, the server verifies both the current time rounded down and current time minus 4 seconds rounded down. If either passes, verification is successful. In the edge case example, the server would try to verify both "12:04" and "12:00", and the latter would succeed.

## How to run SecretAlbum Locally
Make sure to have the [.NET SDK](https://dotnet.microsoft.com/en-us/download/dotnet/6.0) installed, clone the repo, then run the following code from the SecretAlbum directory:

```
dotnet run --urls=http://localhost:8000
```

Navigating to [localhost](http://localhost:8000) will show you the login page. 

To explore what the encrypted data looks like, install a DB explorer such as [Db Browswer](https://sqlitebrowser.org/) and open the LocalDatabase.db in the project.

