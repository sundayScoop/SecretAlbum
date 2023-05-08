namespace SecretAlbum.Services;

using SecretAlbum.Helpers;
using SecretAlbum;
using System.Data.SqlTypes;
using H4x2_TinySDK.Ed25519;
using H4x2_TinySDK.Math;
using Newtonsoft.Json;
using System.Text;

public interface IUserService
{
    Point GetVerifyKey(string uid);
    bool VerifyMessage(string uid, string message, string signature, Point verifyKey);
    List<Album> GetAlbums();
    List<Image> GetUserImages(string albumId);
    List<Share> GetShares(string shareTo, string albumId);
    List<string> GetSharesForAlbum(string albumId);
    Task<string> GetPubKey(string albumId);
    string RegisterAlbum(string albumId, string userAlias, string pubKey);
    string AddImage(string albumId, string seed, string newImageData, string description, string pubKey);
    string DeleteImage(string imageId);
    string MakePublic(string albumId, string imageId, string pubKey);
    string ShareTo(string albumId, string imageId, string shareTo, string encKey);
}

public class UserService : IUserService
{
    private DataContext _context;

    public UserService(DataContext context)
    {
        _context = context;
    }

    public Point GetVerifyKey(string uid)
    {
        var verifyKeyB64 = _context.Albums
            .Where(a => a.AlbumId == uid)
            .Select(a => a.VerifyKey)
            .SingleOrDefault();
        return Point.FromBase64(verifyKeyB64);
    }

    public bool VerifyMessage(string uid, string message, string signature, Point verifyKey)
    {
        // reject if signature is not verified.
        if (!EdDSA.Verify(message, signature, verifyKey))
        {
            return false;
        }

        // reject if token is expired
        string timeMsg = Encoding.UTF8.GetString(Convert.FromBase64String(message));
        DateTime iat = DateTime.Parse(timeMsg);
        if (DateTime.Now > iat.AddSeconds(6))
        {
            return false;
        }

        return true;
    }

    public List<Album> GetAlbums()
    {
        return _context.Albums
            .Select(a => new Album { AlbumId = a.AlbumId, UserAlias = a.UserAlias })
            .ToList();
    }

    public List<Image> GetUserImages(string albumId)
    {
        return _context.Images
            .Where(e => e.AlbumId.Equals(albumId))
            .Select(e => new Image { Id = e.Id, Seed = e.Seed, PubKey = e.PubKey, Description = e.Description, EncryptedData = e.EncryptedData })
            .ToList();
    }

    public List<Share> GetShares(string shareTo, string albumId)
    {
        return _context.Shares
            .Where(s => s.ShareTo.Equals(shareTo) && s.AlbumId.Equals(albumId))
            .Select(s => new Share { ImageId = s.ImageId, EncKey = s.EncKey })
            .ToList();
    }

    public List<string> GetSharesForAlbum(string albumId)
    {
        return _context.Shares
            .Where(s => s.AlbumId.Equals(albumId))
            .Select(s => s.ImageId).Distinct()
            .ToList();
    }

    public async Task<string> GetPubKey(string albumId)
    {
        // request the user's public key from simulator
        var client = new HttpClient();
        string url = "https://new-simulator.australiaeast.cloudapp.azure.com/keyentry/" + albumId;
        var preResponse = await client.GetAsync(url);
        var response = await preResponse.Content.ReadAsStringAsync();
        var keyEntry = JsonConvert.DeserializeObject<Dictionary<string, string>>(response);
        return keyEntry["public"];
    }

    public string RegisterAlbum(string albumId, string userAlias, string pubKey)
    {
        // create and/or update the album on record
        Album newAlbum = new Album
        {
            AlbumId = albumId,
            UserAlias = userAlias,
            VerifyKey = pubKey
        };

        var existingRecord = _context.Albums.SingleOrDefault(e => e.AlbumId == albumId);
        if (existingRecord == null)
        {
            _context.Albums.Add(newAlbum);
        }
        else
        {
            existingRecord.UserAlias = userAlias;
        }
        _context.SaveChanges();
        return "successfully registered album.";
    }

    public string AddImage(string albumId, string seed, string newImageData, string description, string pubKey)
    {
        Image newImage = new Image
        {
            AlbumId = albumId,
            Description = description,
            Seed = seed,
            PubKey = pubKey,
            EncryptedData = newImageData
        };
        _context.Images.Add(newImage);
        try
        {
            _context.SaveChanges();
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
        }
        return "Successfully added image.";
    }

    public string DeleteImage(string imageId)
    {
        var toDelete = _context.Images
            .SingleOrDefault(e => e.Id.Equals(int.Parse(imageId)));
        _context.Images.Remove(toDelete);

        var sharesDelete = _context.Shares
            .Where(s => s.ImageId.Equals(imageId));
        foreach (Share s in sharesDelete)
        {
            _context.Shares.Remove(s);
        }

        _context.SaveChanges();

        return "Successfully deleted item.";
    }

    public string MakePublic(string albumId, string imageId, string pubKey)
    {
        var existingAlbum = _context.Albums.SingleOrDefault(a => a.AlbumId == albumId);
        if (existingAlbum == null)
        {
            return "No such album exists.";
        }
        var existingImage = _context.Images.SingleOrDefault(e => e.Id == int.Parse(imageId));
        if (existingImage == null)
        {
            return "No such image exists.";
        }
        existingImage.PubKey = pubKey;
        try
        {
            _context.SaveChanges();
        }
        catch (Exception e)
        {
            Console.Write(e);
        }

        return "Successfully made public.";
    }

    public string ShareTo(string albumId, string imageId, string shareTo, string encKey)
    {
        // check if duplicate share exists
        var existingShare = _context.Shares.SingleOrDefault(s => s.ImageId == imageId && s.AlbumId == albumId && s.ShareTo == shareTo);
        if (existingShare != null)
        {
            return "This image is already shared to the recepient.";
        }

        Share newShare = new Share
        {
            AlbumId = albumId,
            ImageId = imageId,
            ShareTo = shareTo,
            EncKey = encKey
        };
        _context.Shares.Add(newShare);
        _context.SaveChanges();
        return "Successfully shared.";
    }
}