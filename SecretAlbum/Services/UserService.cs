namespace SecretAblum.Services;

using SecretAblum.Helpers;
using SecretAblum;
using System.Data.SqlTypes;

public interface IUserService
{
    List<string> GetUserImages(string albumId);
    void AddImage(string albumId, string seed, string newImageData, string description, string imageKey);
}

public class UserService : IUserService
{
    private DataContext _context;

    public UserService(DataContext context)
    {
        _context = context;
    }


    public List<string> GetUserImages(string albumId)
    {
        // return _context.Entries
        //     .Where(e => e.AlbumId.Equals(albumId))
        //     .Select(e => new { e.Seed, e.ImageKey, e.Description, e.EncryptedData });
        // // .Select(e => new Entry { Seed = e.Seed, ImageKey = e.ImageKey, Description = e.Description, EncryptedData = e.EncryptedData })


        return _context.Entries.Where(e => e.AlbumId.Equals(albumId))
            .Select(e => e.EncryptedData)
            .ToList();

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
        _context.SaveChanges();
        // try
        // {
        //     _context.SaveChanges();
        // }
        // catch (Exception e)
        // {
        //     Console.WriteLine(e);
        // }
    }
}