import * as uuid from 'uuid';
import {TodoItem} from '../models/TodoItem';
import {TodoDataLayer} from '../dataLayer/todoDataLayer';
import {CreateTodoRequest} from '../requests/CreateTodoRequest';
import {UpdateTodoRequest} from '../requests/UpdateTodoRequest';
import {parseUserId} from '../auth/utils';

// Create `todoDataLayer` object
const todoDataLayer = new TodoDataLayer();

//gets TODO items from the table
export async function getTodoList(jwtToken: string): Promise<TodoItem[]> {
    return todoDataLayer.getTodoList(parseUserId(jwtToken));
}

//Creates TODO item in table with unique todoId
export async function createTodoItem(createTodoRequest: CreateTodoRequest, jwtToken: string): Promise<TodoItem> {
    const userId = parseUserId(jwtToken);

    return await todoDataLayer.createTodoItem(
        {
            userId,
            todoId: uuid.v4(),
            name: createTodoRequest.name,
            dueDate: createTodoRequest.dueDate,
            done: false,
            createdAt: new Date().toISOString()
        });
}

//To update TODO item by `todoId`
export async function updateTodoItem(updateTodoRequest: UpdateTodoRequest, todoId: string, jwtToken: string) {
    await todoDataLayer.updateTodoItem(updateTodoRequest, todoId, parseUserId(jwtToken));
}

//Delete an item from the table using `id` key
export async function deleteTodoItem(id: string, jwtToken: string) {
    await todoDataLayer.deleteTodoItem(id, parseUserId(jwtToken));
}
