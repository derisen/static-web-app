import { useEffect, useState } from "react";

import { MsalAuthenticationTemplate, useMsal, useAccount } from "@azure/msal-react";
import { InteractionRequiredAuthError, InteractionType } from "@azure/msal-browser";

import { loginRequest, protectedResources } from "../authConfig";
import { callApiWithToken } from "../fetch";
import { FunctionData } from "../components/DataDisplay";

const FunctionContent = () => {
    /**
     * useMsal is hook that returns the PublicClientApplication instance, 
     * an array of all accounts currently signed in and an inProgress value 
     * that tells you what msal is currently doing.
     */
    const { instance, accounts, inProgress } = useMsal();
    const account = useAccount(accounts[0] || {});
    const [functionData, setFunctionData] = useState(null);

    useEffect(() => {
        if (account && inProgress === "none" && !functionData) {
            instance.acquireTokenSilent({
                scopes: protectedResources.functionApi2.scopes,
                account: account
            }).then((response) => {
                console.log(response.accessToken);
                callApiWithToken(response.accessToken, protectedResources.functionApi2.endpoint)
                    .then(response => setFunctionData(response));
            }).catch((error) => {
                // in case if silent token acquisition fails, fallback to an interactive method
                if (error instanceof InteractionRequiredAuthError) {
                    if (account && inProgress === "none") {
                        instance.acquireTokenPopup({
                            scopes: protectedResources.functionApi2.scopes,
                        }).then((response) => {
                            console.log(response.accessToken);
                            callApiWithToken(response.accessToken, protectedResources.functionApi2.endpoint)
                                .then(response => setFunctionData(response));
                        }).catch(error => console.log(error));
                    }
                }
            });
        }
    }, [account, inProgress, instance]);
  
    return (
        <>
            { functionData ? <FunctionData functionData={functionData} /> : null }
        </>
    );
};

export const Function = () => {
    const authRequest = {
        ...loginRequest
    };

    return (
        <MsalAuthenticationTemplate 
            interactionType={InteractionType.Redirect} 
            authenticationRequest={authRequest}
        >
            <FunctionContent />
        </MsalAuthenticationTemplate>
      )
};