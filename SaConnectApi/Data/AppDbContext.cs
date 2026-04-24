using Microsoft.EntityFrameworkCore;
using SaConnectApi.Models;

namespace SaConnectApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<CfsIncident> CfsIncidents => Set<CfsIncident>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<CfsIncident>()
            .HasIndex(i => i.IncidentNo)
            .IsUnique();
    }
}
