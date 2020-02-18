import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import {DocumentClient} from 'aws-sdk/clients/dynamodb';
import {TodoUpdate} from '../models/TodoUpdate';
import {TodoItem} from '../models/TodoItem';
import {createLogger} from '../utils/logger';

const logger = createLogger('todo');
const AWSXray = AWSXRay.captureAWS(AWS);

//For testing DynamoDB instance locally when there is no connection to the server
function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        console.log('App is offline! Creating a local DynamoDB instance');
        return new AWSXray.DynamoDB.DocumentClient({region: 'localhost', endpoint: 'http://localhost:8000'});
    }
    return new AWSXray.DynamoDB.DocumentClient();
}

export class TodoDataLayer {

    constructor(private readonly docClient: DocumentClient = createDynamoDBClient(),
                private readonly todoTable = process.env.TODO_TABLE) {

        console.log(`docClient ==> \n ${JSON.stringify(docClient)}`);
        console.log(`todoTable ==> \n ${todoTable}`);
    }

    //Creating TODO item
    public async createTodoItem(todo: TodoItem): Promise<TodoItem> {
        logger.info(`Creating TODO item for the authorised user`);
        await this.docClient.put({
            TableName: this.todoTable,
            Item: todo
        }).promise();
        return todo;
    }

    //Getting TODO item
    public async getTodoItem(todoId: string, userId: string): Promise<TodoItem> {
        logger.info(`Fetching TODO item for the user : ${userId}`);
        const pull = await this.docClient.query({
            TableName: this.todoTable,
            KeyConditionExpression: 'userId = :userId, todoId = :todoId',
            ExpressionAttributeValues: {':userId': userId, ':todoId': todoId}
        }).promise();

        return pull.Items[0] as TodoItem;
    }

    //Getting TODO items list
    public async getTodoList(userId: string): Promise<TodoItem[]> {
        logger.info(`Getting all TODO items for user : ${userId}`);
        const result = await this.docClient
            .query({
                TableName: this.todoTable,
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId
                }
            })
            .promise();

        return result.Items as TodoItem[];
    }

    //Updating TODO item
    public async updateTodoItem(todo: TodoUpdate, todoId: string, userId: string) {
        logger.info('Updating TODO item for the user', {user: userId, todo});
        await this.docClient.update({
            TableName: this.todoTable,
            Key: {'userId': userId, 'todoId': todoId},
            UpdateExpression: 'set #name = :n, dueDate = :dd, done = :d',
            ExpressionAttributeNames: {'#name': 'name'},
            ExpressionAttributeValues: {':dd': todo.dueDate, ':d': todo.done, ':n': todo.name},
            ReturnValues: 'UPDATED_NEW'
        }).promise();
    }

    //Updating TODO item attachment
    public async updateTodoItemAttachment(attachmentUrl: string, todoId: string, userId: string) {
        logger.info(`Updating TODO item image URL for user : ${userId}`);
        await this.docClient.update({
            TableName: this.todoTable,
            Key: {'userId': userId, 'todoId': todoId},
            UpdateExpression: 'set attachmentUrl = :url',
            ExpressionAttributeValues: {':url': attachmentUrl},
            ReturnValues: "UPDATED_NEW"
        }).promise();
    }

    //Deleting TODO item
    public async deleteTodoItem(todoId: string, userId: string) {
        logger.info(`Deleting TODO item for current user : ${userId}`);
        await this.docClient.delete({
            TableName: this.todoTable,
            Key: {"userId": userId, "todoId": todoId}
        }).promise();
    }
}
