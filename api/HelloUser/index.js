const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa');

const CLIENT_ID = "83786cb0-06a7-46fd-bf29-95c828c9bbba";
const TENANT_INFO = "cbaf2168-de14-4c72-9d88-f5f05366dbef";
const EXPECTED_SCOPES = "access_as_user";

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const [bearer, tokenValue] = req.headers['authorization'] !== undefined ? req.headers['authorization'].split(' ') : null;

    const name = (req.query.name || (req.body && req.body.name));
    const ssoToken = (req.query.ssoToken || (req.body && req.body.ssoToken));

    let validated;

    try {
        validated = await validateAccessToken(ssoToken)
        context.log(validated);   
    } catch (error) {
        context.log(error);
    }

    const responseMessage = `
        name: ${name} ---
        ssoToken: ${ssoToken} ---
        isValidated: ${validated} ---
        tokenValue: ${tokenValue} ---
        clientID: ${CLIENT_ID} ---
        Nodejs: ${process.version} ---
    `;

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}


/**
 * Validates the access token for signature 
 * and against a predefined set of claims
 */
validateAccessToken = async(accessToken) => {
    
    if (!accessToken || accessToken === "" || accessToken === "undefined") {
        console.log('No tokens found');
        return false;
    }

    // we will first decode to get kid parameter in header
    let decodedToken; 
    
    try {
        decodedToken = jwt.decode(accessToken, {complete: true});
    } catch (error) {
        console.log('Token cannot be decoded');
        console.log(error);
        return false;
    }

    // obtains signing keys from discovery endpoint
    let keys;

    try {
        keys = await getSigningKeys(decodedToken.header);        
    } catch (error) {
        console.log('Signing keys cannot be obtained');
        console.log(error);
        return false;
    }

    // verify the signature at header section using keys
    let verifiedToken;

    try {
        verifiedToken = jwt.verify(accessToken, keys);
    } catch(error) {
        console.log('Token cannot be verified');
        console.log(error);
        return false;
    }

    /**
     * Validates the token against issuer, audience, scope
     * and timestamp, though implementation and extent vary. For more information, visit:
     * https://docs.microsoft.com/azure/active-directory/develop/access-tokens#validating-tokens
     */

    const now = Math.round((new Date()).getTime() / 1000); // in UNIX format

    const checkTimestamp = verifiedToken["iat"] <= now && verifiedToken["exp"] >= now ? true : false;
    const checkAudience = verifiedToken['aud'] === CLIENT_ID || verifiedToken['aud'] === 'api://' + CLIENT_ID ? true : false;
    const checkScope = verifiedToken['scp'] === EXPECTED_SCOPES ? true : false;
    const checkIssuer = verifiedToken['iss'].includes(TENANT_INFO) ? true : false;

    if (checkTimestamp && checkAudience && checkScope && checkIssuer) {
        return true;
    }
    return false;
};

/**
 * Fetches signing keys of an access token 
 * from the authority discovery endpoint
 */
getSigningKeys = async(header) => {

    // In single-tenant apps, discovery keys endpoint will be specific to your tenant
    const jwksUri =`https://login.microsoftonline.com/${TENANT_INFO}/discovery/v2.0/keys`

    const client = jwksClient({
        jwksUri: jwksUri
    });

    return (await client.getSigningKeyAsync(header.kid)).getPublicKey();
};