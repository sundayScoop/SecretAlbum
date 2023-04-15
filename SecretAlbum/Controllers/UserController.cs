using Microsoft.AspNetCore.Mvc;
using SecretAlbum.Services;

namespace SecretAlbum.Controllers
{
    public class UserController : Controller
    {
        private readonly ILogger<UserController> _logger;
        private IUserService _userService;

        public UserController(ILogger<UserController> logger, IUserService userService)
        {
            _logger = logger;
            _userService = userService;
        }

        [HttpGet]
        public IActionResult GetAlbums()
        {
            try
            {
                return Ok(_userService.GetAlbums());
            }
            catch
            {
                return Ok("--FAILED--");
            }
        }

        [HttpGet]
        public IActionResult GetSelectedAlbum([FromQuery] string userAlias)
        {
            try
            {
                return Ok(_userService.GetSelectedAlbum(userAlias));
            }
            catch
            {
                return Ok("--FAILED--");
            }
        }

        [HttpPost]
        public IActionResult RegisterAlbum([FromQuery] string albumId, [FromForm] string userAlias)
        {
            try
            {
                _userService.RegisterAlbum(albumId, userAlias);
                return Ok();
            }
            catch
            {
                return Ok("--FAILED--");
            }

        }

        [HttpGet]
        public IActionResult GetImages([FromQuery] string albumId)
        {
            try
            {
                return Ok(_userService.GetUserImages(albumId));
            }
            catch
            {
                return Ok("--FAILED--");
            }
        }

        [HttpPost]
        public IActionResult AddImage([FromQuery] string albumId, [FromForm] string seed, [FromForm] string encryptedImg, [FromForm] string description, [FromForm] string imageKey)
        {
            try
            {
                _userService.AddImage(albumId, seed, encryptedImg, description, "0");
                return Ok();
            }
            catch
            {
                return Ok("--FAILED--");
            }

        }

        [HttpPost]
        public IActionResult MakePublic([FromQuery] string albumId, [FromForm] string imageId, [FromForm] string imageKey)
        {
            try
            {
                _userService.MakePublic(albumId, imageId, imageKey);
                return Ok();
            }
            catch
            {
                return Ok("--FAILED--");
            }

        }

    }
}