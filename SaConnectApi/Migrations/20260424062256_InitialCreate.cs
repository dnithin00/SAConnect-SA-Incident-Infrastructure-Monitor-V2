using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaConnectApi.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CfsIncidents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    IncidentNo = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Date = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    Time = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    Message = table.Column<string>(type: "TEXT", nullable: true),
                    MessageLink = table.Column<string>(type: "TEXT", nullable: true),
                    LocationName = table.Column<string>(type: "TEXT", nullable: true),
                    Region = table.Column<string>(type: "TEXT", nullable: true),
                    Type = table.Column<string>(type: "TEXT", nullable: true),
                    Status = table.Column<string>(type: "TEXT", nullable: true),
                    Level = table.Column<string>(type: "TEXT", nullable: true),
                    Fbd = table.Column<string>(type: "TEXT", nullable: true),
                    Resources = table.Column<string>(type: "TEXT", nullable: true),
                    Aircraft = table.Column<string>(type: "TEXT", nullable: true),
                    LocationRaw = table.Column<string>(type: "TEXT", nullable: true),
                    Latitude = table.Column<double>(type: "REAL", nullable: true),
                    Longitude = table.Column<double>(type: "REAL", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CfsIncidents", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CfsIncidents_IncidentNo",
                table: "CfsIncidents",
                column: "IncidentNo",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CfsIncidents");
        }
    }
}
