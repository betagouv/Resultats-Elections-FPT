const mockedLogin = {
  "cookies": [
    {
      "name": "grist_core",
      "value": process.env.GRIST_COOKIE_VALUE,
      "domain": "grist.numerique.gouv.fr",
      "path": "/",
      "expires": -1,
      "httpOnly": true,
      "secure": true,
      "sameSite": "Lax"
    }
  ],
  "origins": []
}

export default mockedLogin