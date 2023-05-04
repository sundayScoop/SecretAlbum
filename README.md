# SecretAlbum
## What is SecretAlbum?
Social media companies have created platforms where people can upload and share data about their personal lives with friends, family, acquaintances, and even strangers. Some data are meant to be public, while others more private. Unfortunately, there are too many ways your private data can find its way to unauthorized players: hackers can exploit and leak data from the companies' servers, authoritarian governments can seize it, social media companies can sell it to the highest bidders through legal loopholes, and etc. Despite these concerns, uploading private data to social media apps have become all too commonplace today.

SecretAlbum is a proof-of-concept image-sharing social media app that aims to give complete privacy and control to users. It achieves this by encrypting the images sent to the server with a secure key that is only available to the user, and letting the user share the image encryption keys with whoever he/she chooses. Hence, it is impossible for the company to make any sense of the user's data that it stores in its own servers (unless the user chooses to make it public), let alone a hacker or the government. Moreover, the said secure key, also known as Consumer-Vendor Key (CVK), is obtained by authenticating with username + password through the Heimdall SDK, which uses Tide's decentralized authentication protocol. This means that the app's server does not hold the users' passwords (or hashes), which gives one more reason for malicious actors to leave it alone. Learn more about the Tide Protocol here: https://tide.org/tideprotocol

SecretAlbum is forked from https://github.com/sundayScoop/PlatyPasswords

## Implementation


## I want to run SecretAlbum Locally
Make sure you have the [.NET SDK](https://dotnet.microsoft.com/en-us/download/dotnet/6.0) installed, clone the repo, then run the follwoing code from the SecretAlbum directory:

```
dotnet run --urls=http://localhost:8000
```

Navigating to [localhost](http://localhost:8000) will show you the login page. 

If you want to explore what the encrypted data looks like, install a DB explorer such as [Db Browswer](https://sqlitebrowser.org/) and open the LocalDatabase.db in the project.

