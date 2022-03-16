
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

import path = require('path');
import * as vscode from 'vscode';
import { CloudantClient } from './cloudant-service';
const LIGHT = path.join(getImagesPath(), 'light');
const DARK = path.join(getImagesPath(), 'dark');

export function getImagesPath(): string {
    return path.join(__filename, '..', '..', 'media');
}
export class ViewDataProvider implements vscode.TreeDataProvider<ViewDataEntry> {

    private _onDidChangeTreeData: vscode.EventEmitter<ViewDataEntry | undefined> = new vscode.EventEmitter<ViewDataEntry | undefined>();
    readonly onDidChangeTreeData: vscode.Event<ViewDataEntry | undefined> = this._onDidChangeTreeData.event;
    private cloudantClient: CloudantClient | undefined;

    constructor(private servicesList: any, private selector: Map<string, any> | undefined, client: CloudantClient | undefined) {
        this.cloudantClient = client;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: ViewDataEntry): vscode.TreeItem {
        return element;
    }


    getChildren(element?: ViewDataEntry): Thenable<ViewDataEntry[]> {
        if (element) {
            return this.getDocuments(element);
        }
        else {
            return this.getDatabases(this.servicesList);
        }

    }

    private async getDatabases(servicesList: any): Promise<ViewDataEntry[]> {
        if (servicesList) {
            const toDbEntry = (label: string, id: string, count: number): ViewDataEntry => {
                if (this.selector && this.selector.has(label)) {
                    return new ViewDataEntry(label , id, vscode.TreeItemCollapsibleState.Expanded, this.getDatabaseIconPath(), "dbname-filtered", {command: 'showNode', title: ''}, count);
                }
                else {
                    return new ViewDataEntry(label , id, vscode.TreeItemCollapsibleState.Collapsed, this.getDatabaseIconPath(), "dbname", {command: 'showNode', title: ''}, count);
                }
            };

            var dbEntry: ViewDataEntry;
            var dbEntries: ViewDataEntry[] = [];
            servicesList.forEach((element: any) => {
                dbEntry = toDbEntry(element.dbName, element.dbName, element.count);
                dbEntries = dbEntries.concat(dbEntry);
            });
            return dbEntries;
        }
        else {
            return [];
        }
    }

    private async getDocuments(element: ViewDataEntry): Promise<ViewDataEntry[]> {
         if (element.command && element.command.command === 'showNode') {
            if (element.label) {
                var docEntry: ViewDataEntry;
                var docEntries: ViewDataEntry[] = [];
                let dbName: string = element.databaseName || '';
                let pos = element.label.indexOf(':');
                //let databaseName: string = element.label.substring(0, pos);
                //let docCount: string = element.label.substring(pos);
                let databaseName: string = element.label;
                let docCount: number = element.documentsCount || 0;

                docEntries.push(new ViewDataEntry(`Documents ${docCount}`, element.id + '_#', vscode.TreeItemCollapsibleState.Collapsed, this.getDocumentsIconPath(),
                    "dbname1", {
                    command: '',
                    title: '',
                    arguments: [element, element.id]
                }, parseInt(''), '', databaseName));

                return docEntries;
            }
            else {
                return [];
            }
           
        } else {
            if (element.label) {
                //let pos: number = element.id.indexOf(':');
                let databaseName: string = (element? element.databaseName:'') || '';
                let docId: any;
                let mapSize: number = this.selector ? this.selector.size:0;
                if (mapSize > 0 ) {
                    docId = this.selector? this.selector.get(String(element.databaseName)) : '';
                }
                
                const toDocumentEntry = (id: string, name: string, revID: string, dbName: string): ViewDataEntry => {
                    let entryone = String(id);
                    let documentId: any;
                    let labelName: string;
                    if (entryone == "undefined") {
                        documentId = docId._id;
                        //TODO: Filtered document not having access to rev-ID, so currently we are disabling trash icon for those filtered entries in the view.
                        labelName = "filtered-document";
                    } else {
                        documentId = entryone;
                        labelName = "document";
                    }
                    return new ViewDataEntry(documentId, name, vscode.TreeItemCollapsibleState.None, this.getDocumentIconPath(), labelName, {
                        command: 'cloudant-explorer.openDocument',
                        title: '',
                        arguments: [element, documentId]
                    }, parseInt(''), revID, dbName);
                };
                var docEntry: ViewDataEntry;
                var docEntries: ViewDataEntry[] = [];
                if (this.cloudantClient) {
                    let docs = await this.cloudantClient.getDocuments(databaseName, this.selector);
                    docs.documentsList.forEach((item: any) => {
                        docEntry = toDocumentEntry(item.id, item.id, item.revID, item.dbName);
                        docEntries = docEntries.concat(docEntry);
                    });
                    element.documentsCount = docs.count;
                }
                return docEntries;
    
            }
            else {
                return [];
            }
        }
    }

    private getDatabaseIconPath(): { light: string; dark: string } {
        return {
            light: path.join(LIGHT, 'database.svg'),
            dark: path.join(DARK, 'database.svg')
        };
    }

    private getDocumentsIconPath(): { light: string; dark: string } {
        return {
            light: path.join(LIGHT, 'files.svg'),
            dark: path.join(DARK, 'files.svg')
        };
    }

    private getDocumentIconPath(): { light: string; dark: string } {
        return {
            light: path.join(LIGHT, 'file.svg'),
            dark: path.join(DARK, 'file.svg')
        };
    }
}


export class ViewDataEntry extends vscode.TreeItem {

    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly iconPath?: string | vscode.Uri | { light: string | vscode.Uri; dark: string | vscode.Uri } | vscode.ThemeIcon,
        public readonly contextValue?: string,
        public readonly command?: vscode.Command,
        public documentsCount?: number,
        public revID?: string,
        public databaseName?: string
    ) {
        super(id, collapsibleState);
    }

}
