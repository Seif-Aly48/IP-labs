/**
 * MVC Architecture Explained:
 *
 * 1. Model: Represents the data and the business logic of the application.
 * 2. View: The visual representation of the application.
 * 3. Controller: The bridge between Model and View.
 */

// --- MODEL ---
class Task {
    constructor(id, text, completed = false, timestamp = Date.now()) {
        this.id = id;
        this.text = text;
        this.completed = completed;
        this.timestamp = timestamp;
    }
}

class TaskModel {
    constructor() {
        this.tasks = [];
        this.onTodoListChanged = null;
        try {
            const savedTasks = localStorage.getItem('tasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
            }
        } catch (e) {
            console.warn('localStorage is not available:', e);
        }
    }

    _commit(tasks) {
        if (typeof this.onTodoListChanged === 'function') {
            this.onTodoListChanged(tasks);
        }
        try {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }

    addTask(text) {
        const id = Date.now();
        const task = new Task(id, text);
        this.tasks.push(task);
        this._commit(this.tasks);
    }

    editTask(id, updatedText) {
        this.tasks = this.tasks.map(task =>
            task.id === id ? { ...task, text: updatedText } : task
        );
        this._commit(this.tasks);
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this._commit(this.tasks);
    }

    toggleTask(id) {
        this.tasks = this.tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        this._commit(this.tasks);
    }

    getTasks(filter, sort) {
        let filteredTasks = [...this.tasks];

        if (filter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        } else if (filter === 'incomplete') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        }

        filteredTasks.sort((a, b) => {
            switch (sort) {
                case 'time-desc': return b.timestamp - a.timestamp;
                case 'time-asc':  return a.timestamp - b.timestamp;
                case 'alpha-asc': return a.text.localeCompare(b.text);
                case 'alpha-desc': return b.text.localeCompare(a.text);
                default: return 0;
            }
        });

        return filteredTasks;
    }
}

// --- VIEW ---
class TaskView {
    constructor() {
        this.app = document.querySelector('.todo-app');
        this.formInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');

        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.sortSelect = document.getElementById('sortSelect');

        this.currentFilter = 'all';
        this.currentSort = 'time-desc';
        this.editingId = null;
    }

    get _taskText() {
        return this.formInput.value.trim();
    }

    _resetInput() {
        this.formInput.value = '';
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    createElement(tag, className) {
        const element = document.createElement(tag);
        if (className) element.classList.add(...className.split(' '));
        return element;
    }

    displayTasks(tasks) {
        this.taskList.innerHTML = '';

        if (tasks.length === 0) {
            const p = this.createElement('p', 'empty-message');
            p.textContent = 'No tasks found.';
            p.style.textAlign = 'center';
            p.style.color = 'var(--text-muted)';
            p.style.padding = '1rem';
            this.taskList.append(p);
            return;
        }

        tasks.forEach(task => {
            const li = this.createElement('li', `task-item${task.completed ? ' completed' : ''}`);
            li.dataset.id = task.id;

            const checkBtn = this.createElement('button', 'task-checkbox-btn');
            checkBtn.innerHTML = task.completed
                ? '<i class="fas fa-check-circle"></i>'
                : '<i class="far fa-circle"></i>';

            const contentDiv = this.createElement('div', 'task-content');

            if (this.editingId === task.id) {
                const editInput = this.createElement('input', 'task-input-edit');
                editInput.type = 'text';
                editInput.value = task.text;
                contentDiv.append(editInput);
            } else {
                const spanText = this.createElement('span', 'task-text');
                spanText.textContent = task.text;
                const spanTime = this.createElement('span', 'task-time');
                spanTime.textContent = 'Created: ' + this.formatDate(task.timestamp);
                contentDiv.append(spanText, spanTime);
            }

            const actionsDiv = this.createElement('div', 'task-actions');

            if (this.editingId === task.id) {
                const saveBtn = this.createElement('button', 'action-btn save-btn');
                saveBtn.innerHTML = '<i class="fas fa-save"></i>';
                saveBtn.title = 'Save';
                actionsDiv.append(saveBtn);
            } else {
                const editBtn = this.createElement('button', 'action-btn edit-btn');
                editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
                editBtn.title = 'Edit';

                const deleteBtn = this.createElement('button', 'action-btn delete-btn');
                deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
                deleteBtn.title = 'Delete';

                actionsDiv.append(editBtn, deleteBtn);
            }

            li.append(checkBtn, contentDiv, actionsDiv);
            this.taskList.append(li);

            if (this.editingId === task.id) {
                const input = li.querySelector('.task-input-edit');
                input.focus();
                input.selectionStart = input.selectionEnd = input.value.length;
            }
        });
    }

    bindAddTask(handler) {
        const handleAdd = () => {
            if (this._taskText) {
                handler(this._taskText);
                this._resetInput();
            }
        };

        this.addBtn.addEventListener('click', handleAdd);
        this.formInput.addEventListener('keypress', event => {
            if (event.key === 'Enter') handleAdd();
        });
    }

    bindDeleteTask(handler) {
        this.taskList.addEventListener('click', event => {
            if (event.target.closest('.delete-btn')) {
                // FIX: parse ID as number to match the Date.now() id type
                const id = Number(event.target.closest('.task-item').dataset.id);
                const item = event.target.closest('.task-item');
                item.classList.add('fade-out');
                setTimeout(() => handler(id), 300);
            }
        });
    }

    bindToggleTask(handler) {
        this.taskList.addEventListener('click', event => {
            if (event.target.closest('.task-checkbox-btn')) {
                const id = Number(event.target.closest('.task-item').dataset.id);
                handler(id);
            }
        });
    }

    bindEditTask(handlerEditStart, handlerEditSave) {
        this.taskList.addEventListener('click', event => {
            if (event.target.closest('.edit-btn')) {
                const id = Number(event.target.closest('.task-item').dataset.id);
                handlerEditStart(id);
            } else if (event.target.closest('.save-btn')) {
                const li = event.target.closest('.task-item');
                const id = Number(li.dataset.id);
                const updatedText = li.querySelector('.task-input-edit').value.trim();
                handlerEditSave(id, updatedText);
            }
        });

        this.taskList.addEventListener('keypress', event => {
            if (event.key === 'Enter' && event.target.classList.contains('task-input-edit')) {
                const li = event.target.closest('.task-item');
                const id = Number(li.dataset.id);
                const updatedText = event.target.value.trim();
                handlerEditSave(id, updatedText);
            }
        });
    }

    bindFilterAndSort(handler) {
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                handler(this.currentFilter, this.currentSort);
            });
        });

        this.sortSelect.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            handler(this.currentFilter, this.currentSort);
        });
    }
}

// --- CONTROLLER ---
class TaskController {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        this.onTodoListChanged = this.onTodoListChanged.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleToggle = this.handleToggle.bind(this);
        this.handleEditStart = this.handleEditStart.bind(this);
        this.handleEditSave = this.handleEditSave.bind(this);
        this.handleFilterSort = this.handleFilterSort.bind(this);

        // FIX: assign the callback BEFORE doing the initial render
        this.model.onTodoListChanged = this.onTodoListChanged;

        this.view.bindAddTask(this.handleAdd);
        this.view.bindDeleteTask(this.handleDelete);
        this.view.bindToggleTask(this.handleToggle);
        this.view.bindEditTask(this.handleEditStart, this.handleEditSave);
        this.view.bindFilterAndSort(this.handleFilterSort);

        // Initial render
        this.onTodoListChanged(this.model.tasks);
    }

    onTodoListChanged() {
        const filteredSortedTasks = this.model.getTasks(this.view.currentFilter, this.view.currentSort);
        this.view.displayTasks(filteredSortedTasks);
    }

    handleAdd(text) {
        this.model.addTask(text);
    }

    handleDelete(id) {
        this.model.deleteTask(id);
    }

    handleToggle(id) {
        this.model.toggleTask(id);
    }

    handleEditStart(id) {
        this.view.editingId = id;
        this.onTodoListChanged();
    }

    handleEditSave(id, updatedText) {
        if (updatedText) {
            this.model.editTask(id, updatedText);
        }
        this.view.editingId = null;
        this.onTodoListChanged();
    }

    handleFilterSort() {
        this.onTodoListChanged();
    }
}

// Initialize application
const app = new TaskController(new TaskModel(), new TaskView());