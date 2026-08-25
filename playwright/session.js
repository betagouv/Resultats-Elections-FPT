const getCookieSession = () => ({
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
  "origins": [
    {
      "origin": "https://grist.numerique.gouv.fr",
      "localStorage": [
        {
          "name": "maintainanceStartDateAgreement",
          "value": "2026-08-27T10:30:00.000Z"
        }
      ]
    }
  ]
})

export default getCookieSession
