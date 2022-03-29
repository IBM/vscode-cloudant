
import * as vscode from 'vscode';
import { CloudantClient } from './cloudant-service';
import { ViewDataEntry, ViewDataProvider } from './view-data-provider';
import * as fs from 'fs';
import path = require('path');


export async function removeConnection(context: vscode.ExtensionContext) {
    context.globalState.update("cloudant_url", undefined);
    context.globalState.update("cloudant_apikey", undefined);
    context.globalState.update("cloudant_username", undefined);
    context.globalState.update("cloudant_password", undefined);
    vscode.commands.executeCommand('setContext', 'cloudant-explorer.noConnection', true);
    vscode.commands.executeCommand('setContext', 'cloudant-explorer.invalidConnection', false);
    vscode.commands.executeCommand('setContext', 'cloudant-explorer.validConnectionFound', false);
    vscode.window.registerTreeDataProvider("cloudantExplorer", 
       new ViewDataProvider([], undefined, undefined))
}

export async function handleSearch(item: any, dbList: any, filterCriteria: Map<string, any>, client: CloudantClient) {
    let searchQueryString: string | undefined = await vscode.window.showInputBox({
        "title": "Enter search criteria",
        "value": "{\"_id\":\"\"}",
        "valueSelection": [8, 8]
    });
    if (searchQueryString) {
        let searchQueryObj;
        try {
            searchQueryObj = JSON.parse(searchQueryString);
            filterCriteria.set(item.id, searchQueryObj);
        }
        catch (ex) {
            vscode.window.showInformationMessage('Not a valid search string');
            return;
        }
        vscode.window.registerTreeDataProvider("cloudantExplorer", new ViewDataProvider(dbList, filterCriteria, client)
        );
    }
}

export async function clearFilter(item: any, dbList: any, filterCriteria: Map<string, any>, client: CloudantClient) {

    if (filterCriteria.has(item.id)) {
        filterCriteria.delete(item.id);
    }

    vscode.window.registerTreeDataProvider("cloudantExplorer", new ViewDataProvider(dbList, filterCriteria, client)
    );

}

export async function clearAllFilters(dbList: any, filterCriteria: Map<string, any>, client: CloudantClient) {
    filterCriteria.clear();
    vscode.window.registerTreeDataProvider("cloudantExplorer", new ViewDataProvider(dbList, filterCriteria, client)
    );
}

export async function openDocument(element: ViewDataEntry, docId: string, client: CloudantClient) {
    let dbpath: string = element.databaseName || '';
    let data = await client.getDocumentById(dbpath, docId);
    let dir = path.join(__filename, '..', '..', 'temp/' + dbpath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    openFile(path.join(dir, docId + ".json"), JSON.stringify(data, undefined, 4));

}

function openFile(filePath: string, data: string) {
    var openPath = vscode.Uri.file(filePath);
    fs.writeFileSync(filePath, data, 'utf8');
    vscode.workspace.openTextDocument(openPath).then(doc1 => {
        vscode.window.showTextDocument(doc1, { preview: false });
    });
}

export async function saveDocument(filePath: string, document: string, client: CloudantClient) {
    let dbName = filePath.substring(filePath.indexOf("temp/") + 5, filePath.lastIndexOf("/"));
    let docId = filePath.substring(filePath.lastIndexOf("/") + 1, filePath.lastIndexOf(".json"));
    if (docId === 'launchpad') {
        await client.createDocument(dbName, document, filePath);
    } else {
        await client.saveDocument(dbName, docId, document);
    }
    
}

export async function createDocument(element: ViewDataEntry) {
    let dir = path.join(__filename, '..', '..', 'temp/' + element.label);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    let filePath = path.join(dir, "launchpad" + ".json");
    var openPath = vscode.Uri.file(filePath);
    let data: string = JSON.stringify({_id: ''});
    fs.writeFileSync(filePath, data, 'utf-8');
    vscode.workspace.openTextDocument(openPath).then(doc1 => {
        vscode.window.showTextDocument(doc1, { preview: false });
    });
}

export async function deleteDocument(element: ViewDataEntry, client: CloudantClient) {
    //await ClientRequest.
    await client.deleteDocument(element.databaseName, element.id, element.revID);
}


