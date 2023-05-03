namespace SecretAlbum.Services;

using SecretAlbum.Helpers;
using SecretAlbum;
using System.Data.SqlTypes;
using H4x2_TinySDK.Ed25519;
using H4x2_TinySDK.Math;

public interface IUserService
{
    bool VerifyMessage(string uid, string signature);
    string GetUserId(string userAlias);
    List<Album> GetAlbums();
    List<Image> GetUserImages(string albumId);
    List<Share> GetShares(string shareTo, string albumId);
    List<string> GetSharesForAlbum(string albumId);
    void RegisterAlbum(string albumId, string userAlias, string verifyKey);
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

    public bool VerifyMessage(string uid, string signature)
    {
        Point verifyKey;
        try
        {
            string verifyKeyB64 = _context.Albums
                .Where(a => a.AlbumId == uid)
                .Select(a => a.VerifyKey)
                .SingleOrDefault();
            verifyKey = Point.FromBase64(verifyKeyB64);
            verifyKey = new Point(verifyKey.GetX(), verifyKey.GetY());

        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            return false;
        }

        return EdDSA.Verify("Authenticated", signature, verifyKey);
    }


    public string GetUserId(string userAlias)
    {
        Album matchingAlbum = _context.Albums
            .First(a => a.UserAlias.Equals(userAlias));

        return matchingAlbum.AlbumId;
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

    public void RegisterAlbum(string albumId, string userAlias, string verifyKey)
    {
        Album newAlbum = new Album
        {
            AlbumId = albumId,
            UserAlias = userAlias,
            VerifyKey = verifyKey
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
        return;
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
        return "Image added.";
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

        return "deleted item.";
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
        string recepientId = _context.Albums
           .Where(a => a.UserAlias.Equals(shareTo))
           .Select(a => a.AlbumId)
           .ToList()[0];

        // check if duplicate share exists
        var existingShare = _context.Shares.SingleOrDefault(s => s.ImageId == imageId && s.AlbumId == albumId && s.ShareTo == recepientId);
        if (existingShare != null)
        {
            return "This image is already shared to the recepient.";
        }

        Share newShare = new Share
        {
            AlbumId = albumId,
            ImageId = imageId,
            ShareTo = recepientId,
            EncKey = encKey
        };
        _context.Shares.Add(newShare);
        _context.SaveChanges();
        return "Successfully shared.";

    }
}