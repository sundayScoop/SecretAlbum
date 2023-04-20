using System.ComponentModel.DataAnnotations;

namespace SecretAlbum
{
    public class Entry
    {
        [Key]
        public int Id { get; set; }
        public string AlbumId { get; set; }
        public string Description { get; set; }
        public string EncKey { get; set; }
        public string PubKey { get; set; }
        public string EncryptedData { get; set; }
    }
}