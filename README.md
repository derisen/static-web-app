This sample demonstrates how to deploy a React single-page application (SPA) coupled with a Node.js [Azure Function](https://docs.microsoft.com/azure/azure-functions/) API to **Azure Cloud** using the [Azure Static Web Apps (Preview)](https://docs.microsoft.com/azure/static-web-apps/) service.

### Register the app

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure AD** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
   - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-react-spa`.
   - Under **Supported account types**, select **Accounts in this organizational directory only**.
   - In the **Redirect URI** section, select **Single-page application** in the combo-box and enter the following redirect URI: `http://localhost:3000/`.
1. Select **Register** to create the application.
1. In the app's registration screen, find and note the **Application (client) ID**. You use this value in your app's configuration file(s) later in your code.
1. Select **Save** to save your changes.
1. In the app's registration screen, select the **Certificates & secrets** blade in the left to open the page where we can generate secrets and upload certificates.
1. In the **Client secrets** section, select **New client secret**:
   - Type a key description (for instance `app secret`),
   - Select one of the available key durations (**In 1 year**, **In 2 years**, or **Never Expires**) as per your security posture.
   - The generated key value will be displayed when you select the **Add** button. Copy the generated value for use in the steps later.
   - You'll need this key later in your code's configuration files. This key value will not be displayed again, and is not retrievable by any other means, so make sure to note it from the Azure portal before navigating to any other screen or blade.
1. In the app's registration screen, select the **Expose an API** blade to the left to open the page where you can declare the parameters to expose this app as an API for which client applications can obtain [access tokens](https://docs.microsoft.com/azure/active-directory/develop/access-tokens) for.
The first thing that we need to do is to declare the unique [resource](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow) URI that the clients will be using to obtain access tokens for this Api. To declare an resource URI, follow the following steps:
   - Select `Set` next to the **Application ID URI** to generate a URI that is unique for this app.
   - For this sample, accept the proposed Application ID URI (`api://{clientId}`) by selecting **Save**.
1. All APIs have to publish a minimum of one [scope](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow#request-an-authorization-code) for the client's to obtain an access token successfully. To publish a scope, follow the following steps:
   - Select **Add a scope** button open the **Add a scope** screen and Enter the values as indicated below:
        - For **Scope name**, use `access_as_user`.
        - Select **Admins and users** options for **Who can consent?**.
        - For **Admin consent display name** type `Access msal-react-spa`.
        - For **Admin consent description** type `Allows the app to access msal-react-spa as the signed-in user.`
        - For **User consent display name** type `Access msal-react-spa`.
        - For **User consent description** type `Allow the application to access msal-react-spa on your behalf.`
        - Keep **State** as **Enabled**.
        - Select the **Add scope** button on the bottom to save this scope.
1. In the app's registration screen, select the **API permissions** blade in the left to open the page where we add access to the APIs that your application needs.
   - Select the **Add a permission** button and then,
     - Ensure that the **Microsoft APIs** tab is selected.
     - In the *Commonly used Microsoft APIs* section, select **Microsoft Graph**
     - In the **Delegated permissions** section, select the **User.Read** in the list. Use the search box if necessary.
     - Select the **Add permissions** button at the bottom.
   - Select the **Add a permission** button and then,
     - Ensure that the **My APIs** tab is selected.
     - In the list of APIs, select the API `msal-react-spa`.
     - In the **Delegated permissions** section, select the **Access 'msal-react-spa'** in the list. Use the search box if necessary.
     - Select the **Add permissions** button at the bottom.
1. In the app's registration screen, select the **Manifest** blade. Then:
   - Find the key `"accessTokenAcceptedVersion"` and replace the existing value with **2** i.e. `"accessTokenAcceptedVersion": 2`.

#### Configure the app (msal-react-spa) to use your app registration

Open the project in your IDE (like Visual Studio or Visual Studio Code) to configure the code.

> In the steps below, "ClientID" is the same as "Application ID" or "AppId".

1. Open the `App/src/authConfig.js` file.
1. Find the key `Enter_the_Application_Id_Here` and replace the existing value with the application ID (clientId) of `msal-react-spa` app copied from the Azure portal.
1. Find the key `Enter_the_Tenant_Info_Here` and replace the existing value with your Azure AD tenant ID.
1. Find the key `Enter_the_Web_Api_Scope_Here` and replace the existing value with APP ID URI that you've registered earlier, e.g. `api://****-****-********-********/access_as_user`

Add environment variables to your static web app

1. Navigate back to the [Azure Portal](https://portal.azure.com).
1. Find the application you've created previously under **Azure Static Web Apps** and select it.
1. Select the **Configuration** blade on the left hand side. Add the following **environment variables** there:
    1. `CLIENT_ID`: enter the application ID (clientId) of `msal-react-spa` app copied from the Azure portal.
    1. `TENANT_ID`: enter your Azure AD tenant ID.
    1. `CLIENT_SECRET`: enter your client secret that you've obtained during app registration.
    1. `EXPECTED_SCOPES`: enter the name of the scope in APP ID URI that you've registered earlier.