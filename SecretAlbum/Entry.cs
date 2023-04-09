using System.ComponentModel.DataAnnotations;

namespace SecretAblum
{
    public class Entry
    {
        [Key]
        public int Id { get; set; }
        public string User { get; set; }
        public string EncryptedData { get; set; }
        public string Description { get; set; }
    }
}