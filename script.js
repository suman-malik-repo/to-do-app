document.addEventListener('DOMContentLoaded', () => {
    const dbName = 'todoApp';
    const dbVersion = 1;
    let db;

    // Open IndexedDB
    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        const todoStore = db.createObjectStore('todos', { keyPath: 'id', autoIncrement: true });
        todoStore.createIndex('task', 'task', { unique: false });
        todoStore.createIndex('completed', 'completed', { unique: false });
        const historyStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        historyStore.createIndex('task', 'task', { unique: false });
        historyStore.createIndex('completedAt', 'completedAt', { unique: false });
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        displayTodos();
        displayHistory();
    };

    request.onerror = (event) => {
        console.error('Database error:', event.target.errorCode);
    };

    // Add todo
    const addTodo = (task) => {
        const transaction = db.transaction(['todos'], 'readwrite');
        const objectStore = transaction.objectStore('todos');
        const request = objectStore.add({ task, completed: false });

        request.onsuccess = () => {
            displayTodos();
        };

        request.onerror = (event) => {
            console.error('Add todo error:', event.target.errorCode);
        };
    };

    // Mark todo as completed
    const markCompleted = (id) => {
        const transaction = db.transaction(['todos', 'history'], 'readwrite');
        const todosStore = transaction.objectStore('todos');
        const historyStore = transaction.objectStore('history');

        const todoRequest = todosStore.get(id);
        todoRequest.onsuccess = () => {
            const todo = todoRequest.result;
            todo.completed = true;

            // Update todo status
            const updateRequest = todosStore.put(todo);
            updateRequest.onsuccess = () => {
                // Add to history
                historyStore.add({
                    task: todo.task,
                    completedAt: new Date().toLocaleString()
                });

                // Update displays
                displayTodos();
                displayHistory();
            };
        };

        todoRequest.onerror = (event) => {
            console.error('Mark completed error:', event.target.errorCode);
        };
    };

    // Display todos
    const displayTodos = () => {
        const todoList = document.getElementById('todo-list');
        todoList.innerHTML = '';

        const transaction = db.transaction(['todos'], 'readonly');
        const objectStore = transaction.objectStore('todos');
        const request = objectStore.openCursor();

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                if (!cursor.value.completed) {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center';

                    li.textContent = cursor.value.task;

                    const checkButton = document.createElement('button');
                    checkButton.className = 'btn btn-success btn-sm ml-2';
                    checkButton.textContent = '✔️';
                    checkButton.onclick = () => markCompleted(cursor.value.id);

                    li.appendChild(checkButton);
                    todoList.appendChild(li);
                }

                cursor.continue();
            }
        };

        request.onerror = (event) => {
            console.error('Display todos error:', event.target.errorCode);
        };
    };

    // Display completed tasks history
    const displayHistory = () => {
        const completedList = document.getElementById('completed-list');
        completedList.innerHTML = '';

        const transaction = db.transaction(['history'], 'readonly');
        const objectStore = transaction.objectStore('history');
        const request = objectStore.openCursor();

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.textContent = cursor.value.task;
                
                const timestamp = document.createElement('span');
                timestamp.className = 'timestamp';
                timestamp.textContent = `Completed at: ${cursor.value.completedAt}`;

                li.appendChild(timestamp);
                completedList.appendChild(li);

                cursor.continue();
            }
        };

        request.onerror = (event) => {
            console.error('Display history error:', event.target.errorCode);
        };
    };

    // Form submission
    document.getElementById('todo-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const taskInput = document.getElementById('todo-input');
        addTodo(taskInput.value);
        taskInput.value = '';
    });
});
