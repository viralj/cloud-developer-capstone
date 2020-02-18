import 'source-map-support/register';
import {CreateTodoRequest} from '../../requests/CreateTodoRequest';
import {createTodoItem} from '../../businessLogic/todoLogic';
import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {cors} from 'middy/middlewares';
import * as middy from 'middy';

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodo: CreateTodoRequest = JSON.parse(event.body);

    // TODO: Implement creating a new TODO item
    const authorization = event.headers.Authorization;
    const jwtToken = authorization.split(' ')[1];
    const item = await createTodoItem(newTodo, jwtToken);
    return {
        statusCode: 201,
        body: JSON.stringify({
            item
        })
    };
});

handler.use(
    cors({
        credentials: true
    })
);
