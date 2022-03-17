# Connect to Cloudant DB from within Visual Studio Code

How to Install the extension
![How to Install the extension](./images/how-to-install.gif)


Features

1. Create a document
2. View all documents in the DB
2. View details of a document
4. Delete a document

Building and Installing from Source

You can clone this repository and run the below commnands:

```
npm install
npm run compile
```

To run the extension, choose the menu Run > Run without Debugging and this will launch a separate VS Code instance. Click on the Cloudant Explorer icon, provide the connection details and you are all set to explore your Cloudant DB.

Folowing are the features that are currently supported in the extension

1. Ability to connect using IAM Authentication or Basic Authentication
2. List the top 20 documents in all the cloudant dabases for a particular cloudant service based on default sort criteria
3. Max number of records to be displayed in the explorer can be configured using the property "Max Documents"
4. Ability to search for a sepcific documents by specifying the selector query
5. Ability to Add new Documents
6. Ability to Delete document
7. Ability to Edit existing documents
8. Ability to edit existing conection and add a new connection

New features to be added:

1. List all the Views and Indexes 
2. Ability to execute a view and display the documents
3. Support for connecting to multiple cloudant services at a time
4. Pin a document so that it will be always available in the list
5. Ability to Create a view 

Note: In order to use IBM Cloudant service, refer https://cloud.ibm.com/docs/Cloudant?topic=Cloudant-getting-started-with-cloudant.

