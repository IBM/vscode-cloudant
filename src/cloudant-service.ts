//=============================================================
//IBM Confidential
//
//OCO Source Materials
//
//Copyright IBM Corp. 2021
//
//The source code for this program is not published or otherwise
//divested of its trade secrets, irrespective of what has been
//deposited with the U.S. Copyright Office.
//
//=============================================================

import * as CloudantV1 from "@ibm-cloud/cloudant";
import * as vscode from 'vscode';
import { Authenticator, IamAuthenticator, BasicAuthenticator } from 'ibm-cloud-sdk-core';
import * as fs from 'fs';
import ConfigurationModel from "./configuration-model";
export class CloudantClient {

    private cloudant: any | undefined;
    private authenticator: Authenticator;
    private configurationModel: ConfigurationModel;

    constructor(context: vscode.ExtensionContext) {
        this.configurationModel = new ConfigurationModel(context);
        if (this.configurationModel.authType === "iam_auth") {
            this.authenticator = new IamAuthenticator({
                apikey: this.configurationModel.cloudantAPIKey ? this.configurationModel.cloudantAPIKey : ""
            });
        }
        else {
            this.authenticator = new BasicAuthenticator({
                username: this.configurationModel.cloudantUserName ? this.configurationModel.cloudantUserName : "",
                password: this.configurationModel.cloudantPassword ? this.configurationModel.cloudantPassword : "",
            });
        }
        this.cloudant = CloudantV1.CloudantV1.newInstance({ authenticator: this.authenticator });
        this.cloudant.setServiceUrl(this.configurationModel.cloudantURL);
    }

    public async checkConnection(): Promise<boolean> {
        let isValidConnection = false;
        try {
            await this.cloudant.getServerInformation().then((serverInformation: any) => {
                const { version } = serverInformation.result;
                if (serverInformation.statusText === "OK") {
                    isValidConnection = true;
                }
            });
        } catch (ex) {
            return isValidConnection;
        }
        return isValidConnection;

    }

    public async getDatabases() {
        //let dbList: {}[] = [];
        let allDBs = await this.cloudant.getAllDbs();
        let alldblist: [] = allDBs.result;
        let dbList1 = await this.processArr(alldblist);

        return dbList1;
    }

    public async getDocuments(dbName: string, selector: Map<string, any> | undefined) {
        let documentsList: any[] = [];
        let defaultLimit = vscode.workspace.getConfiguration('cloudantexplorer').get('maxDocuments');

        let count: number = 0;
        if (selector && selector.has(dbName)) {
            await this.cloudant.postFind({
                db: dbName,
                selector: selector.get(dbName),
                limit: defaultLimit
            }).then((response: any) => {
                count = response.result.total_docs;
                for (let document of response.result.docs) {
                    documentsList.push(document._id);
                    //documentsList.push({id: document._id, revID: document._rev});
                }
            }).catch((err: any) => {
                vscode.window.showErrorMessage(err.message);
            });
        }
        else {
            await this.cloudant.postAllDocs({
                db: dbName,
                includeDocs: false,
                limit: defaultLimit
            }).then((response: any) => {
                count = response.result.total_rows;
                for (let document of response.result.rows) {
                    documentsList.push({ id: document.id, revID: document.value.rev, dbName: dbName });
                }
            }).catch((err: any) => {
                vscode.window.showErrorMessage(err.message);
            });
        }

        return { documentsList, count };
    }


    public async getDocumentById(dbName: string, docId: string) {
        let documentJson: any = {};
        await this.cloudant.getDocument({
            db: dbName,
            docId: docId
        }).then((response: any) => {
            documentJson = response.result;
        }).catch((err: any) => {
            vscode.window.showErrorMessage(err.message);
        });
        return documentJson;
    }

    public async saveDocument(dbName: string, docId: string, document: any) {
        const eventDoc: CloudantV1.CloudantV1.Document = JSON.parse(document);
        await this.cloudant.putDocument({
            db: dbName,
            docId: docId,
            document: eventDoc
        }).then((response: any) => {
            vscode.window.showInformationMessage("Document saved successfully");
        }).catch((err: any) => {
            vscode.window.showInformationMessage("Cannot save document:\n" + err.message, { "modal": true });
        });
    }

    public async createDocument(dbName: string, document: any, filePath: string) {
        const eventDoc: CloudantV1.CloudantV1.Document = JSON.parse(document);
        await this.cloudant.postDocument({
            db: dbName,
            document: eventDoc
        }).then((response: any) => {
            let pos: number = filePath.indexOf('/launchpad.json');
            let dirName = filePath.substring(0, pos + 1);
            vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            fs.renameSync(dirName + 'launchpad.json', dirName + response.result.id + '.json');
            vscode.workspace.openTextDocument(dirName + response.result.id + '.json').then(doc1 => {
                vscode.window.showTextDocument(doc1, { preview: false });
            });
            vscode.window.showInformationMessage("Document created successfully");
        }).catch((err: any) => {
            vscode.window.showInformationMessage("Document creation failed:\n" + err.message, { "modal": true });
        });
    }

    public async deleteDocument(dbName?: string, docId?: string, revId?: string) {
        await this.cloudant.deleteDocument({
            db: dbName,
            docId: docId,
            rev: revId
        }).then((deletionResponse: any) => {
            if (deletionResponse.status === 200) {
                vscode.window.showInformationMessage(`Document ${docId} has been successfully deleted. Please refresh the tree view`);
            } else {
                vscode.window.showErrorMessage(`Error in deleting the document ${docId} : ${deletionResponse.result}`);
            }
        }).catch((err: string) => {
            vscode.window.showErrorMessage(`Error in deleting the document ${docId} : ${err}`);
        });
    }

    public getDocumentCount(dbName: string): any {
        let docCount: number = parseInt('');
        return new Promise((resolve, reject) => {
            this.cloudant.getDatabaseInformation({ db: dbName })
                .then((dbResponse: any) => {
                    docCount = dbResponse.result.doc_count;
                    resolve(docCount);
                });
        });
    }

    public async processArr(arrList: []) {
        let dbList1: { dbName: string, count: number }[] = [];
        const pArray = arrList.map(async value => {
            let doc1count: number = await this.getDocumentCount(value);
            dbList1.push({ dbName: value, count: doc1count });
        });
        await Promise.all(pArray);
        return dbList1;
    }
}

