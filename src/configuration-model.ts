import * as vscode from 'vscode';
export default class ConfigurationModel {
    private _context: vscode.ExtensionContext;
    private _authType: string | undefined;
    private _cloudantUserName: string | undefined;
    private _cloudantPassword: string | undefined;
    private _cloudantURL: string | undefined;
    private _cloudantAPIKey: string | undefined;


    constructor(context: vscode.ExtensionContext) {
        this._context = context;
        this._authType = context.globalState.get("auth_type");
        this._cloudantUserName = context.globalState.get("cloudant_username");
        this._cloudantPassword = context.globalState.get("cloudant_password");
        this._cloudantURL = context.globalState.get("cloudant_url");
        this._cloudantAPIKey = context.globalState.get("cloudant_apikey");

    }

    public get context() {
        return this._context;
    }

    public set context(context: vscode.ExtensionContext) {
        this._context = context;
    }

    public get authType() {
        return this._authType;
    }

    public set authType(authType: string | undefined) {
        this._authType = authType;
    }

    public get cloudantUserName(): string | undefined {
        return this._cloudantUserName;
    }

    public set cloudantUserName(cloudantUserName: string | undefined) {
        this._cloudantUserName = cloudantUserName;
    }

    public get cloudantPassword(): string | undefined {
        return this._cloudantPassword;
    }

    public set cloudantPassword(cloudantPassword: string | undefined) {
        this._cloudantPassword = cloudantPassword;
    }

    public get cloudantURL() {
        return this._cloudantURL;
    }

    public set cloudantURL(cloudantURL: string | undefined) {
        this._cloudantURL = cloudantURL;
    }

    public get cloudantAPIKey() {
        return this._cloudantAPIKey;
    }

    public set cloudantAPIKey(cloudantAPIKey: string | undefined) {
        this._cloudantAPIKey = cloudantAPIKey;
    }



    toJSON() {
        return {
            "authType": this._authType,
            "cloudantUserName": this._cloudantUserName,
            "cloudantPassword": this._cloudantPassword,
            "cloudantURL": this._cloudantURL,
            "cloudanrAPIKey": this._cloudantAPIKey
        };
    }

}