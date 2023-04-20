namespace SecretAlbum.Services;

using SecretAlbum.Helpers;
using SecretAlbum;
using System.Data.SqlTypes;

public interface IUserService
{
    List<string> GetAlbums();
    List<Entry> GetSelectedAlbum(string userAlias);
    List<Entry> GetUserImages(string albumId);
    void RegisterAlbum(string albumId, string userAlias);
    void AddImage(string albumId, string encKey, string newImageData, string description, string pubKey);
    void MakePublic(string albumId, string imageId, string pubKey);
}

public class UserService : IUserService
{
    private DataContext _context;

    public UserService(DataContext context)
    {
        _context = context;
    }

    public List<string> GetAlbums()
    {
        return _context.Albums
            .Select(a => a.UserAlias)
            .ToList();
    }

    public List<Entry> GetSelectedAlbum(string userAlias)
    {
        string albumId = _context.Albums
            .Where(a => a.UserAlias.Equals(userAlias))
            .Select(a => a.AlbumId)
            .ToList()[0];

        return _context.Entries
            .Where(e => e.AlbumId.Equals(albumId))
            .Select(e => new Entry { Id = e.Id, EncKey = e.EncKey, PubKey = e.PubKey, Description = e.Description, EncryptedData = e.EncryptedData })
            .ToList();
    }


    public List<Entry> GetUserImages(string albumId)
    {
        return _context.Entries
            .Where(e => e.AlbumId.Equals(albumId))
            .Select(e => new Entry { Id = e.Id, EncKey = e.EncKey, PubKey = e.PubKey, Description = e.Description, EncryptedData = e.EncryptedData })
            .ToList();
    }

    public void RegisterAlbum(string albumId, string userAlias)
    {
        // TODO: add entry to album database. make sure only one entry per albumId exists (albumId is primary key)
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
            existingRecord.UserAlias = userAlias;   //TODO: update is not working for some reason.
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

    public void AddImage(string albumId, string encKey, string newImageData, string description, string pubKey)
    {
        Entry newEntry = new Entry
        {
            AlbumId = albumId,
            Description = description,
            EncKey = encKey,
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
}