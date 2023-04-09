namespace SecretAblum.Services;

using SecretAblum.Helpers;
using SecretAblum;
using System.Data.SqlTypes;

public interface IUserService
{
    List<string> GetUserImages(string id);
    void AddImage(string userId, string newImageData, string description);
}

public class UserService : IUserService
{
    private DataContext _context;

    public UserService(DataContext context)
    {
        _context = context;
    }


    public List<string> GetUserImages(string id)
    {
        return _context.Entries.Where(e => e.User.Equals(id))
            .Select(e => e.EncryptedData).ToList();
    }

    public void AddImage(string userId, string newImageData, string description)
    {
        Entry newEntry = new Entry
        {
            User = userId,
            EncryptedData = newImageData,
            Description = description
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