const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa');
require('dotenv').config();

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const [bearer, tokenValue] = req.headers['authorization'] !== undefined ? req.headers['authorization'].split(' ') : null;
    context.log(tokenValue)

    let validated;

    try {
        validated = await validateAccessToken(tokenValue);
        context.log(validated);   
    } catch (error) {
        context.log(error);
    }

    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". Your token is validated (" + validated + "). This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

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
    const decodedToken = jwt.decode(accessToken, {complete: true});
    
    if (!decodedToken) {
        throw new Error('Token cannot be decoded')
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
    const verifiedToken = jwt.verify(accessToken, keys);

    if (!verifiedToken) {
        throw new Error('Token cannot be verified');
    }

    /**
     * Validates the token against issuer, audience, scope
     * and timestamp, though implementation and extent vary. For more information, visit:
     * https://docs.microsoft.com/azure/active-directory/develop/access-tokens#validating-tokens
     */

    const now = Math.round((new Date()).getTime() / 1000); // in UNIX format

    const checkTimestamp = verifiedToken["iat"] <= now && verifiedToken["exp"] >= now ? true : false;
    const checkAudience = verifiedToken['aud'] === process.env.CLIENT_ID || verifiedToken['aud'] === 'api://' + process.env.CLIENT_ID ? true : false;
    const checkScope = verifiedToken['scp'] === process.env.EXPECTED_SCOPES ? true : false;
    const checkIssuer = verifiedToken['iss'].includes(process.env.TENANT_INFO) ? true : false;

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
    const jwksUri =`https://login.microsoftonline.com/${process.env.TENANT_INFO}/discovery/v2.0/keys`

    const client = jwksClient({
        jwksUri: jwksUri
    });

    return (await client.getSigningKeyAsync(header.kid)).getPublicKey();
};