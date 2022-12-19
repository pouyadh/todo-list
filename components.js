"use strict";
let cnt = 0;
let draggingList;
let draggingListItem;
const trackDragEnterLeave = (element, enterCallback, leaveCallback) => {
    const track = new Map();
    const handleEnter = (ev) => {
        if (ev.target === element || element.contains(ev.target)) {
            if (track.size === 0) {
                enterCallback(ev);
            }
            track.set(ev.target, true);
        }
    };
    const handleLeave = (ev) => {
        track.delete(ev.target);
        if (track.size === 0) {
            leaveCallback(ev);
        }
    };
    const handleDrop = (ev) => {
        track.clear();
    };
    const removeListeners = () => {
        element.removeEventListener("dragenter", handleEnter);
        element.removeEventListener("dragleave", handleLeave);
        element.removeEventListener("drop", handleDrop);
    };
    element.addEventListener("dragenter", handleEnter);
    element.addEventListener("dragleave", handleLeave);
    element.addEventListener("drop", handleDrop);
    return removeListeners;
};
const generateId = () => Date.now().toString() + (cnt++).toString();
class TodoItem extends HTMLElement {
    constructor() {
        super();
        this.callOnDisconnect = [];
    }
    connectedCallback() {
        console.log("connected", this.id);
        this.draggable = true;
        this.innerHTML = `
    <div class="todo-item__drop-area"></div>
    <li class="todo-item__item">
      <button class="todo-item__state">${TodoItem.STATES[+this.getAttribute("state")]}</button>
      <span class="todo-item__text">${this.getAttribute("text")}</span>
      <button class="todo-item__edit"><i class="fas fa-pencil-alt"></i></button>
      <button class="todo-item__remove"><i class="fas fa-minus"></i></button>
      <i class="todo-item__drag-handle fas fa-bars draggable"></i>
    </li>
    `;
        const stateBtn = this.querySelector("button.todo-item__state");
        const removeBtn = this.querySelector("button.todo-item__remove");
        const editBtn = this.querySelector("button.todo-item__edit");
        const dropArea = this.querySelector("div.todo-item__drop-area");
        const handleDragEnter = (ev) => {
            if ((draggingListItem === null || draggingListItem === void 0 ? void 0 : draggingListItem.element) &&
                !(draggingListItem === null || draggingListItem === void 0 ? void 0 : draggingListItem.ignore.includes(this))) {
                dropArea.classList.add("todo-item__drop-area--extended");
            }
        };
        const handleDragLeave = (ev) => {
            dropArea.classList.remove("todo-item__drop-area--extended");
        };
        const removeTracker = trackDragEnterLeave(this, handleDragEnter, handleDragLeave);
        this.addEventListener("drop", (ev) => {
            var _a;
            if ((draggingListItem === null || draggingListItem === void 0 ? void 0 : draggingListItem.element) &&
                !(draggingListItem === null || draggingListItem === void 0 ? void 0 : draggingListItem.ignore.includes(this))) {
                (_a = this.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(draggingListItem === null || draggingListItem === void 0 ? void 0 : draggingListItem.element, this);
            }
            dropArea.classList.remove("todo-item__drop-area--extended");
            draggingListItem = null;
        });
        this.addEventListener("dragover", (ev) => ev.preventDefault());
        this.addEventListener("dragstart", (ev) => {
            var _a;
            draggingListItem = {
                element: this,
                ignore: [this],
            };
            if (((_a = this.nextElementSibling) === null || _a === void 0 ? void 0 : _a.tagName) === "TODO-ITEM") {
                draggingListItem.ignore.push(this.nextElementSibling);
            }
        });
        stateBtn.addEventListener("click", () => this.toggleState());
        removeBtn.addEventListener("click", () => this.removeMe());
        editBtn.addEventListener("click", () => this.editMe());
        const removeListeners = () => { };
        this.callOnDisconnect.push(removeTracker, removeListeners);
    }
    disconnectedCallback() {
        console.log("disconnected", this.id);
    }
    toggleState() {
        let state = +this.getAttribute("state");
        state++;
        if (state >= TodoItem.STATES.length) {
            state = 0;
        }
        this.setAttribute("state", state.toString());
        const stateBtn = this.querySelector("button.todo-item__state");
        stateBtn.innerHTML = TodoItem.STATES[state];
    }
    removeMe() {
        this.remove();
    }
    editMe() {
        const li = this.querySelector("li");
        const editBtn = this.querySelector("button.todo-item__edit");
        let textSpn = this.querySelector("span.todo-item__text");
        let textInp = this.querySelector("input.todo-item__text");
        console.log(!!textSpn, !!textInp);
        if (textSpn && !textInp) {
            textInp = document.createElement("input");
            textInp.className = "todo-item__text";
            textInp.setAttribute("type", "text");
            textInp.value = textSpn.innerHTML;
            textSpn.remove();
            li.insertBefore(textInp, editBtn);
            editBtn.innerHTML = '<i class="fas fa-check"></i>';
        }
        else if (!textSpn && textInp) {
            textSpn = document.createElement("span");
            textSpn.className = "todo-item__text";
            textSpn.innerHTML = textInp.value;
            this.setAttribute("text", textInp.value);
            textInp.remove();
            li.insertBefore(textSpn, editBtn);
            editBtn.innerHTML = `<i class="fas fa-pencil-alt">`;
        }
    }
}
TodoItem.STATES = ["TODO", "DOING", "DONE"];
customElements.define("todo-item", TodoItem);
class TodoListDropArea extends HTMLElement {
    constructor() {
        super();
        this.callOnDisconnect = [];
    }
    connectedCallback() {
        const handleDragEnter = (ev) => {
            if (draggingList) {
                this.classList.add("todo-list-drop-area--extended");
            }
        };
        const handleDragLeave = (ev) => {
            this.classList.remove("todo-list-drop-area--extended");
        };
        const handleDragOver = (ev) => {
            if (draggingList) {
                ev.preventDefault();
            }
        };
        const handleDrop = (ev) => {
            var _a;
            if (draggingList) {
                (_a = this.parentElement) === null || _a === void 0 ? void 0 : _a.insertBefore(draggingList.element, this);
            }
            this.classList.remove("todo-list-drop-area--extended");
            draggingList = null;
        };
        this.addEventListener("dragenter", handleDragEnter);
        this.addEventListener("dragleave", handleDragLeave);
        this.addEventListener("dragover", handleDragOver);
        this.addEventListener("drop", handleDrop);
        const removeEventListenners = () => {
            this.removeEventListener("dragenter", handleDragEnter);
            this.removeEventListener("dragleave", handleDragLeave);
            this.removeEventListener("dragover", handleDragOver);
            this.removeEventListener("drop", handleDrop);
        };
        this.callOnDisconnect.push(removeEventListenners);
    }
    disconnectedCallback() {
        this.callOnDisconnect.forEach((fn) => fn());
    }
}
customElements.define("todo-list-drop-area", TodoListDropArea);
class TodoList extends HTMLElement {
    constructor() {
        super();
        this.callOnDisconnect = [];
        this.dropArea = null;
    }
    connectedCallback() {
        var _a;
        this.draggable = true;
        if (this.innerHTML === "") {
            this.innerHTML = `
      <div class="todo-list__header">
        <i class="fas fa-bars draggable"></i>
        <span class="todo-list__name" contenteditable="true">My ToDo Lists</span>
        <button class="todo-list__remove-btn" id="remove-list"><i class="fas fa-trash"></i></button>
      </div>
      
      <ul class="todo-list__list">
        
        <li class="todo-list__add-item" id="add-item">
          <div id="todo-item-drop-area" class="todo-list__drop-area"></div>
          <input class="todo-list__add-item-inp" type="text" placeholder="Add something todo ..." />
          <button class="todo-list__add-item-btn" id="add-item"><i class="fas fa-plus"></i></button>
        </li>
      </ul>
    `;
        }
        this.setAttribute("data-id", generateId());
        const addItemBtn = this.querySelector("button#add-item");
        const removeListBtn = this.querySelector("button#remove-list");
        const todoItemDropArea = this.querySelector("div#todo-item-drop-area");
        const addItemLi = this.querySelector("li#add-item");
        const todoListAddItemInput = this.querySelector("input.todo-list__add-item-inp");
        const todoListName = this.querySelector("span.todo-list__name");
        addItemBtn.addEventListener("click", () => this.addTodo());
        removeListBtn.addEventListener("click", () => this.removeList());
        const handleDragEnter = (ev) => {
            if ((draggingListItem === null || draggingListItem === void 0 ? void 0 : draggingListItem.element) &&
                !(draggingListItem === null || draggingListItem === void 0 ? void 0 : draggingListItem.ignore.includes(this))) {
                todoItemDropArea.classList.add("todo-item__drop-area--extended");
            }
        };
        const handleDragLeave = (ev) => {
            todoItemDropArea.classList.remove("todo-item__drop-area--extended");
        };
        const removeTracker = trackDragEnterLeave(addItemLi, handleDragEnter, handleDragLeave);
        addItemLi.addEventListener("dragover", (ev) => {
            ev.preventDefault();
        });
        addItemLi.addEventListener("drop", (ev) => {
            var _a;
            console.log("drop");
            if ((draggingListItem === null || draggingListItem === void 0 ? void 0 : draggingListItem.element) &&
                !(draggingListItem === null || draggingListItem === void 0 ? void 0 : draggingListItem.ignore.includes(this))) {
                console.log("drop-accepted");
                (_a = addItemLi.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(draggingListItem === null || draggingListItem === void 0 ? void 0 : draggingListItem.element, addItemLi);
            }
            todoItemDropArea.classList.remove("todo-item__drop-area--extended");
            draggingListItem = null;
        });
        todoListName.addEventListener("keyup", (ev) => {
            if (ev.key === "Escape") {
                todoListName.blur();
            }
        });
        todoListAddItemInput.addEventListener("keyup", (ev) => {
            if (ev.key === "Enter") {
                this.addTodo();
            }
        });
        this.addEventListener("dragstart", (ev) => {
            var _a;
            if (ev.target === this) {
                draggingList = {
                    element: this,
                    ignore: [],
                };
                (_a = document
                    .querySelector("section#list-container")) === null || _a === void 0 ? void 0 : _a.classList.add("list-is-dragging");
            }
        });
        this.addEventListener("dragend", (ev) => {
            var _a;
            (_a = document
                .querySelector("section#list-container")) === null || _a === void 0 ? void 0 : _a.classList.remove("list-is-dragging");
            draggingList = null;
            draggingListItem = null;
        });
        this.callOnDisconnect.push(removeTracker);
        this.dropArea = document.createElement("todo-list-drop-area");
        (_a = this.parentElement) === null || _a === void 0 ? void 0 : _a.insertBefore(this.dropArea, this);
    }
    removeList() {
        var _a;
        (_a = this.dropArea) === null || _a === void 0 ? void 0 : _a.remove();
        this.remove();
    }
    disconnectedCallback() {
        var _a;
        (_a = this.dropArea) === null || _a === void 0 ? void 0 : _a.remove();
    }
    addTodo() {
        const todoTextInput = this.querySelector(".todo-list__add-item-inp");
        const todoList = this.querySelector(".todo-list__list");
        const addLi = this.querySelector("li#add-item");
        if (todoTextInput.value) {
            const id = Date.now().toString();
            const todoItem = document.createElement("todo-item");
            todoItem.setAttribute("id", id);
            todoItem.setAttribute("text", todoTextInput.value);
            todoItem.setAttribute("createdAt", id);
            todoItem.setAttribute("state", "0");
            todoList.insertBefore(todoItem, addLi);
            todoTextInput.value = "";
            todoList.scrollTop = todoList.scrollHeight;
        }
    }
}
TodoList.TODO_STATE = ["TODO", "DOING", "DONE"];
customElements.define("todo-list", TodoList);
const btnAddList = document.querySelector("button#add-list");
const secListContainer = document.querySelector("section#list-container");
const addList = () => {
    const newList = document.createElement("todo-list");
    secListContainer === null || secListContainer === void 0 ? void 0 : secListContainer.insertBefore(newList, btnAddList);
};
btnAddList === null || btnAddList === void 0 ? void 0 : btnAddList.addEventListener("click", addList);
