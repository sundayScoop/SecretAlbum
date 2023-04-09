using System.ComponentModel.DataAnnotations;

namespace SecretAblum
{
    public class Entry
    {
        [Key]
        public int Id { get; set; }
        public string AlbumId { get; set; }
        public string Description { get; set; }
        public string Seed { get; set; }
        public string ImageKey { get; set; }
        public string EncryptedData { get; set; }
    }
}