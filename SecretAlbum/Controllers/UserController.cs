using Microsoft.AspNetCore.Mvc;
using SecretAblum.Services;

namespace SecretAblum.Controllers
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
        public IActionResult GetData([FromQuery] string uid)
        {
            try
            {
                return Ok(_userService.GetUserImages(uid));
            }
            catch
            {
                return Ok("--FAILED--");
            }
        }

        [HttpPost]
        public IActionResult AddImage([FromQuery] string albumId, [FromForm] string encryptedImg, [FromForm] string description)
        {
            try
            {
                _userService.AddImage(albumId, encryptedImg, description);
                return Ok();
            }
            catch
            {
                return Ok("--FAILED--");
            }

        }

    }
}