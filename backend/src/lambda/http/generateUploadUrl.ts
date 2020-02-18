import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk';
import {parseUserId} from '../../auth/utils'
import * as middy from 'middy';
import {cors} from 'middy/middlewares';
import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {TodoDataLayer} from '../../dataLayer/todoDataLayer';
import {createLogger} from '../../utils/logger';

// instantiate objects
const todoDataLayer = new TodoDataLayer();

function getS3BucketUploadUrl(todoId: string, userId: string): string {

    const bucketName = process.env.TODO_S3_BUCKET;
    const urlExpiration = process.env.SIGNED_URL_EXPIRATION;
    const AWSXray = AWSXRay.captureAWS(AWS);
    const S3 = new AWSXray.S3({signatureVersion: 'v4'});

    // Updating todo item with the expected attachment url
    todoDataLayer.updateTodoItemAttachment(`https://${bucketName}.s3.amazonaws.com/${todoId}`, todoId, userId);

    // Retrieving signed URL of S3 bucket and returning it
    return S3.getSignedUrl('putObject', {Bucket: bucketName, Key: todoId, Expires: urlExpiration});
}

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // extract the TODO ID from the path
    const logger = createLogger('todo');
    logger.info('Generate TODO image upload url');
    const todoId = event.pathParameters.todoId;
    const authorization = event.headers.Authorization;
    const split = authorization.split(' ');
    const userId = parseUserId(split[1]);

    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    const uploadUrl: string = getS3BucketUploadUrl(todoId, userId)

    return {
        statusCode: 201,
        body: JSON.stringify(
            {
                todoId: todoId,
                uploadUrl: uploadUrl
            })
    };
});

handler.use(
    cors({
        credentials: true
    })
);
