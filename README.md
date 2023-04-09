# SecretAblum
## What is SecretAblum?
SecretAblum is a proof of concept social media app that uses Tide Enclave to authenticate and retrive a user's Consumer-Vendor Key (CVK), which is used to craft image keys to encrypt the user's images on the client side before uploading the images to the server. This means the server, or a hacker who takes control of the server, will never have access to any image in the database unless the user chooses to share it. Each image is assigned a unique key that only the owner can generate, and the owner can make the image public by sharing this image key without compromising his/her CVK. 

SecretAlbum is forked from https://github.com/sundayScoop/PlatyPasswords

## I want to run SecretAlbum Locally
Great! Make sure you have the [.NET SDK](https://dotnet.microsoft.com/en-us/download/dotnet/6.0) installed, clone the repo, then run the follwoing code from the SecretAlbum directory:

```
dotnet run --urls=http://localhost:8000
```

Navigating to [localhost](http://localhost:8000) will show you the login page. 

If you want to explore what the encrypted data looks like, install a DB explorer such as [Db Browswer](https://sqlitebrowser.org/) and open the LocalDatabase.db in the project.
