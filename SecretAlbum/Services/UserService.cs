namespace SecretAlbum.Services;

using SecretAlbum.Helpers;
using SecretAlbum;
using System.Data.SqlTypes;

public interface IUserService
{
    string GetUserId(string userAlias);
    List<Album> GetAlbums();
    // List<Entry> GetSelectedAlbum(string albumId);
    List<Entry> GetUserImages(string albumId);
    List<Share> GetShares(string shareTo, string albumId);
    void RegisterAlbum(string albumId, string userAlias);
    void AddImage(string albumId, string seed, string newImageData, string description, string pubKey);
    void MakePublic(string albumId, string imageId, string pubKey);
    void ShareTo(string albumId, string imageId, string shareTo, string encKey);
}

public class UserService : IUserService
{
    private DataContext _context;

    public UserService(DataContext context)
    {
        _context = context;
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

    // public List<Entry> GetSelectedAlbum(string userAlias)
    // {
    //     string albumId = _context.Albums
    //         .Where(a => a.UserAlias.Equals(userAlias))
    //         .Select(a => a.AlbumId)
    //         .ToList()[0];

    //     return _context.Entries
    //         .Where(e => e.AlbumId.Equals(albumId))
    //         .Select(e => new Entry { Id = e.Id, Seed = e.Seed, PubKey = e.PubKey, Description = e.Description, EncryptedData = e.EncryptedData })
    //         .ToList();
    // }


    public List<Entry> GetUserImages(string albumId)
    {
        return _context.Entries
            .Where(e => e.AlbumId.Equals(albumId))
            .Select(e => new Entry { Id = e.Id, Seed = e.Seed, PubKey = e.PubKey, Description = e.Description, EncryptedData = e.EncryptedData })
            .ToList();
    }

    public List<Share> GetShares(string shareTo, string albumId)
    {
        return _context.Shares
            .Where(s => s.ShareTo.Equals(shareTo) && s.AlbumId.Equals(albumId))
            .Select(s => new Share { ImageId = s.ImageId, EncKey = s.EncKey })
            .ToList();
    }

    public void RegisterAlbum(string albumId, string userAlias)
    {
        Album newAlbum = new Album
        {
            AlbumId = albumId,
            UserAlias = userAlias
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

        try
        {
            _context.SaveChanges();
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
        }
        return;
    }

    public void AddImage(string albumId, string seed, string newImageData, string description, string pubKey)
    {
        Entry newEntry = new Entry
        {
            AlbumId = albumId,
            Description = description,
            Seed = seed,
            PubKey = pubKey,
            EncryptedData = newImageData
        };
        _context.Entries.Add(newEntry);
        try
        {
            _context.SaveChanges();
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
        }
    }

    public void MakePublic(string albumId, string imageId, string pubKey)
    {
        var existingAlbum = _context.Albums.SingleOrDefault(a => a.AlbumId == albumId);
        if (existingAlbum == null)
        {
            throw new Exception("No such album exists.");
        }
        var existingImage = _context.Entries.SingleOrDefault(e => e.Id == int.Parse(imageId));
        if (existingImage == null)
        {
            throw new Exception("No such image exists.");
        }
        existingImage.PubKey = pubKey;

        try
        {
            _context.SaveChanges();
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
        }
    }

    public void ShareTo(string albumId, string imageId, string shareTo, string encKey)
    {
        string recepientId = _context.Albums
           .Where(a => a.UserAlias.Equals(shareTo))
           .Select(a => a.AlbumId)
           .ToList()[0];

        Share newShare = new Share
        {
            AlbumId = albumId,
            ImageId = imageId,
            ShareTo = recepientId,
            EncKey = encKey
        };
        _context.Shares.Add(newShare);
        try
        {
            _context.SaveChanges();
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
        }
    }
}