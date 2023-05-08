using Microsoft.AspNetCore.Mvc;
using SecretAlbum.Services;
using H4x2_TinySDK.Ed25519;
using H4x2_TinySDK.Math;

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
        public IActionResult GetTime()
        {
            return Ok(DateTime.Now.ToString());
        }

        [HttpGet]
        public IActionResult GetUserId([FromQuery] string userAlias)
        {
            try
            {
                return Ok(_userService.GetUserId(userAlias));
            }
            catch
            {
                return Ok("--FAILED--");
            }
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

        [HttpPost]
        public async Task<IActionResult> RegisterAlbum([FromQuery] string albumId, [FromForm] string jwt, [FromForm] string userAlias)
        {
            if (!userAlias.All(char.IsLetterOrDigit))
            {
                return Ok("Failed: Only alphanumeric characters are allowed in the user alias.");
            }
            try
            {
                string pubKey = await _userService.GetPubKey(albumId);
                string[] contents = jwt.Split('.');
                string message = contents[0];
                string signature = contents[1];
                if (!_userService.VerifyMessage(albumId, message, signature, Point.FromBase64(pubKey)))
                {
                    return Ok("Failed: Token expired or wrong verification key.");
                }
                string response = _userService.RegisterAlbum(albumId, userAlias, pubKey);   // save pubkey in database
                return Ok(response);
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

        [HttpGet]
        public IActionResult GetShares([FromQuery] string shareTo, [FromQuery] string albumId)
        {
            try
            {
                return Ok(_userService.GetShares(shareTo, albumId));
            }
            catch
            {
                return Ok("--FAILED--");
            }
        }

        [HttpGet]
        public IActionResult GetSharesForAlbum([FromQuery] string albumId)
        {
            try
            {
                return Ok(_userService.GetSharesForAlbum(albumId));
            }
            catch
            {
                return Ok("--FAILED--");
            }
        }

        [HttpPost]
        public IActionResult AddImage([FromQuery] string albumId, [FromForm] string jwt, [FromForm] string seed, [FromForm] string encryptedImg, [FromForm] string description, [FromForm] string pubKey)
        {
            if (description.Length > 300)
            {
                return Ok("Failed: description exceeded the limit of 300 characters.");
            }
            try
            {
                string[] contents = jwt.Split('.');
                string message = contents[0];
                string signature = contents[1];
                Point verifyKey = _userService.GetVerifyKey(albumId);
                if (!_userService.VerifyMessage(albumId, message, signature, verifyKey))
                {
                    return Ok("Failed: Token expired or wrong verification key.");
                }
                string response = _userService.AddImage(albumId, seed, encryptedImg, description, "0");
                return Ok(response);
            }
            catch
            {
                return Ok("--FAILED--");
            }

        }

        [HttpPost]
        public IActionResult DeleteImage([FromQuery] string albumId, [FromForm] string imageId, [FromForm] string jwt)
        {
            try
            {
                string[] contents = jwt.Split('.');
                string message = contents[0];
                string signature = contents[1];
                Point verifyKey = _userService.GetVerifyKey(albumId);
                if (!_userService.VerifyMessage(albumId, message, signature, verifyKey))
                {
                    return Ok("Failed: Token expired or wrong verification key.");
                }
                string response = _userService.DeleteImage(imageId);
                return Ok(response);
            }
            catch
            {
                return Ok("--FAILED--");
            }

        }

        [HttpPost]
        public IActionResult MakePublic([FromQuery] string albumId, [FromForm] string jwt, [FromForm] string imageId, [FromForm] string pubKey)
        {
            try
            {
                string[] contents = jwt.Split('.');
                string message = contents[0];
                string signature = contents[1];
                Point verifyKey = _userService.GetVerifyKey(albumId);
                if (!_userService.VerifyMessage(albumId, message, signature, verifyKey))
                {
                    return Ok("Failed: Token expired or wrong verification key.");
                }
                string response = _userService.MakePublic(albumId, imageId, pubKey);
                return Ok(response);
            }
            catch
            {
                return Ok("--FAILED--");
            }

        }

        [HttpPost]
        public IActionResult ShareTo([FromQuery] string albumId, [FromForm] string jwt, [FromForm] string imageId, [FromForm] string shareTo, [FromForm] string encKey)
        {
            try
            {
                string[] contents = jwt.Split('.');
                string message = contents[0];
                string signature = contents[1];
                Point verifyKey = _userService.GetVerifyKey(albumId);
                if (!_userService.VerifyMessage(albumId, message, signature, verifyKey))
                {
                    return Ok("Failed: Token expired or wrong verification key.");
                }
                string response = _userService.ShareTo(albumId, imageId, shareTo, encKey);
                return Ok(response);
            }
            catch
            {
                return Ok("--FAILED--");
            }

        }

    }
}