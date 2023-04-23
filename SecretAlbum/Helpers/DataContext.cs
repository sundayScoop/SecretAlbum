
using Microsoft.EntityFrameworkCore;

namespace SecretAlbum.Helpers
{
    public class DataContext : DbContext
    {
        protected readonly IConfiguration Configuration;

        public DataContext(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        protected override void OnConfiguring(DbContextOptionsBuilder options)
        {
            options.UseSqlite(Configuration.GetConnectionString("LocalDbConnectionString"));
        }

        public DbSet<Entry> Entries { get; set; }
        public DbSet<Album> Albums { get; set; }
        public DbSet<Share> Shares { get; set; }

    }
}
