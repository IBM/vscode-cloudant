
import * as vscode from 'vscode';
import { CloudantClient } from './cloudant-service';
import { clearAllFilters, clearFilter, createDocument, handleSearch, openDocument, removeConnection, saveDocument, deleteDocument } from './command-handler';
import ConfigurationModel from './configuration-model';
import { ViewDataProvider } from './view-data-provider';
import * as fs from 'fs';
import * as path from 'path';
import * as ejs from 'ejs';
export async function activate(context: vscode.ExtensionContext) {

	console.log('Extension "cloudantexplorer" is now active!');

	let filterCriteria = new Map();
	let dbList: unknown = [];
	let client: CloudantClient;

	let configurationModel: ConfigurationModel = new ConfigurationModel(context);
	vscode.commands.executeCommand('setContext', 'cloudant-explorer.invalidConnection', false);
	vscode.commands.executeCommand('setContext', 'cloudant-explorer.noConnection', true);
	connectToDatabase();
	async function connectToDatabase() {
		configurationModel = new ConfigurationModel(context);
		if ((configurationModel.authType === "iam_auth" && configurationModel.cloudantURL && configurationModel.cloudantAPIKey)
			|| (configurationModel.authType === "basic_auth" && configurationModel.cloudantUserName && configurationModel.cloudantPassword && configurationModel.cloudantURL)) {
			client = new CloudantClient(context);
			if (await client.checkConnection()) {
				vscode.commands.executeCommand('setContext', 'cloudant-explorer.noConnection', false);
				vscode.commands.executeCommand('setContext', 'cloudant-explorer.validConnectionFound', true);
				dbList = await client.getDatabases();
				vscode.window.registerTreeDataProvider("cloudantExplorer", new ViewDataProvider(dbList, filterCriteria, client)
				);
			}
			else {
				vscode.commands.executeCommand('setContext', 'cloudant-explorer.invalidConnection', true);
				vscode.commands.executeCommand('setContext', 'cloudant-explorer.noConnection', false);
			}
		}
	}

	context.subscriptions.push(vscode.commands.registerCommand('cloudant-explorer.addConnection', async (item) => {
		showConfigurationPanel();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cloudant-explorer.refreshTreeView', async (item) => {
		connectToDatabase();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cloudant-explorer.searchDocument', async (item) => {
		handleSearch(item, dbList, filterCriteria, client);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cloudant-explorer.removeFilter', async (item) => {
		clearFilter(item, dbList, filterCriteria, client);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cloudant-explorer.clearAllFilers', async (item) => {
		clearAllFilters(item, filterCriteria, client);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cloudant-explorer.openDocument', async (item, docId) => {
		openDocument(item, docId, client);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cloudant-explorer.removeConnection', async () => {
		removeConnection(context);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cloudant-explorer.editConnection', async () => {
		showConfigurationPanel();
	}));


	context.subscriptions.push(vscode.commands.registerCommand('cloudant-explorer.addDocument', async (item) => {
		await createDocument(item);
	}));


	context.subscriptions.push(vscode.commands.registerCommand('cloudant-explorer.deleteDocument', async (item) => {
		await deleteDocument(item, client);
		vscode.window.registerTreeDataProvider("cloudantExplorer",  new ViewDataProvider(dbList, filterCriteria, client)
		);

	}));

	vscode.workspace.onDidSaveTextDocument(async (textDocument: vscode.TextDocument) => {
		if (textDocument.uri.path.indexOf(".json") > 0) {
			await saveDocument(textDocument.uri.path, textDocument.getText(), client);
			vscode.window.registerTreeDataProvider("cloudantExplorer", new ViewDataProvider(dbList, filterCriteria, client)
			); 
		}
	});

	function showConfigurationPanel() {
		const panel = vscode.window.createWebviewPanel(
			'Configure Cloudant',
			'Configure Cloudant',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);
		let csspath = panel.webview.asWebviewUri(vscode.Uri.parse(path.join(__filename, '..', '..', 'resources') + "/demo.css"));

		panel.webview.html = getWebviewContent(panel.webview, context, csspath);

		// Handle messages from the webview
		panel.webview.onDidReceiveMessage(
			async data => {
				vscode.window.showInformationMessage(data);
				switch (data.command) {
					case 'sendcommand':
						console.log(data.text);
						for (var key in data.text) {
							console.log(key + " -> " + data.text[key]);
							context.globalState.update(key, data.text[key]);
						}
						return;
					case 'loadcloudantexplorer':
						console.log(data.text);
						connectToDatabase();
						return;
				}
			},
			undefined,
			context.subscriptions
		);
	}
}



function getWebviewContent(webView: vscode.Webview, context: vscode.ExtensionContext, csspath: vscode.Uri) {
	let configuration: ConfigurationModel = new ConfigurationModel(context);
	let html = fs.readFileSync(path.join(__filename, '..', '..', 'resources') + "/new-config-form.html", 'utf8');
	let newconfig: any = configuration;
	newconfig.csspath = csspath;
	return ejs.render(html, { configuration: newconfig });
}



export function deactivate() { }
