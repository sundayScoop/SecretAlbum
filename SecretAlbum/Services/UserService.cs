namespace SecretAlbum.Services;

using SecretAlbum.Helpers;
using SecretAlbum;
using System.Data.SqlTypes;

public interface IUserService
{
    List<string> GetAlbums();
    List<Entry> GetSelectedAlbum(string albumName);
    List<Entry> GetUserImages(string albumId);
    void RegisterAlbum(string albumId, string albumName);
    void AddImage(string albumId, string seed, string newImageData, string description, string imageKey);
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
            .Select(a => a.Name)
            .ToList();
    }

    public List<Entry> GetSelectedAlbum(string albumName)
    {
        string albumId = _context.Albums
            .Where(a => a.Name.Equals(albumName))
            .Select(a => a.AlbumId)
            .ToList()[0];

        Console.WriteLine(albumId);

        return _context.Entries
            .Where(e => e.AlbumId.Equals(albumId))
            .Select(e => new Entry { Id = e.Id, Seed = e.Seed, ImageKey = e.ImageKey, Description = e.Description, EncryptedData = e.EncryptedData })
            .ToList();
    }


    public List<Entry> GetUserImages(string albumId)
    {
        return _context.Entries
            .Where(e => e.AlbumId.Equals(albumId))
            .Select(e => new Entry { Id = e.Id, Seed = e.Seed, ImageKey = e.ImageKey, Description = e.Description, EncryptedData = e.EncryptedData })
            .ToList();
    }

    public void RegisterAlbum(string albumId, string albumName)
    {
        // TODO: add entry to album database. make sure only one entry per albumId exists (albumId is primary key)
        Album newAlbum = new Album
        {
            AlbumId = albumId,
            Name = albumName
        };
        _context.Albums.Update(newAlbum);
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

    public void AddImage(string albumId, string seed, string newImageData, string description, string imageKey)
    {
        Entry newEntry = new Entry
        {
            AlbumId = albumId,
            Description = description,
            Seed = seed,
            ImageKey = imageKey,
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
}