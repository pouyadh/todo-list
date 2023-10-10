"use strict";
var _a, _b, _c;
const attachDragInOutEvents = (element) => {
    const evDragIn = new Event("dragin");
    const evDragOut = new Event("dragout");
    const track = new Map();
    const handleEnter = (ev) => {
        if (ev.target === element || element.contains(ev.target)) {
            if (track.size === 0) {
                element.dispatchEvent(evDragIn);
            }
            track.set(ev.target, true);
        }
    };
    const handleLeave = (ev) => {
        track.delete(ev.target);
        if (track.size === 0) {
            element.dispatchEvent(evDragOut);
        }
    };
    const handleEnd = (ev) => {
        track.clear();
        element.dispatchEvent(evDragOut);
    };
    const handleDrop = (ev) => {
        track.clear();
        element.dispatchEvent(evDragOut);
    };
    const detachDragInOutEvents = () => {
        element.removeEventListener("dragenter", handleEnter);
        element.removeEventListener("dragleave", handleLeave);
        element.removeEventListener("dragend", handleEnd);
        element.removeEventListener("drop", handleDrop);
    };
    element.addEventListener("dragenter", handleEnter);
    element.addEventListener("dragleave", handleLeave);
    element.addEventListener("dragend", handleEnd);
    element.addEventListener("drop", handleDrop);
    return detachDragInOutEvents;
};
function q(elem, selector) {
    return elem.querySelector(selector);
}
class TodoItem extends HTMLElement {
    constructor() {
        super();
        this._elements = null;
        this._eventListenners = [];
        this._states = {
            firstConnect: true,
            todoState: 0,
            editingMode: false,
            text: TodoItem.DEFAULT_TODO_TEXT,
        };
        this._detachDragInOutEvents = null;
    }
    addEventListeners() {
        this._eventListenners.forEach((ev) => ev[0].addEventListener(ev[1], ev[2]));
        this._detachDragInOutEvents = attachDragInOutEvents(this);
    }
    removeEventListeners() {
        this._eventListenners.forEach((ev) => ev[0].removeEventListener(ev[1], ev[2]));
        if (this._detachDragInOutEvents) {
            this._detachDragInOutEvents();
        }
    }
    _updateUI() {
        if (this._elements) {
            this._elements.btnState.innerText =
                TodoItem.STATES[this._states.todoState];
            this.setAttribute("state", this._states.todoState.toString());
            this._elements.spnText.innerText = this._states.text;
            if (this._states.editingMode) {
                this._elements.btnEdit.innerHTML =
                    '<i class="fas fa-solid fa-check"></i>';
                this._elements.spnText.setAttribute("hidden", "true");
                this._elements.inpText.removeAttribute("hidden");
            }
            else {
                this._elements.btnEdit.innerHTML = '<i class="fas fa-pencil-alt"></i>';
                this._elements.spnText.removeAttribute("hidden");
                this._elements.inpText.setAttribute("hidden", "true");
            }
        }
    }
    makeEditable() {
        if (this._elements && !this._states.editingMode) {
            this._elements.inpText.value = this._states.text;
            this._states.editingMode = true;
            this._updateUI();
        }
    }
    makeNoneEditable(applyChanges = true) {
        if (this._elements && this._states.editingMode) {
            if (applyChanges) {
                this._states.text = this._elements.inpText.value;
            }
            this._states.editingMode = false;
            this._updateUI();
        }
    }
    connectedCallback() {
        this.draggable = true;
        if (!this.innerHTML) {
            this.innerHTML = TodoItem.TEMPLATE;
        }
        this._elements = {
            btnState: q(this, "button.todo-item__state"),
            spnText: q(this, "span.todo-item__text"),
            inpText: q(this, "input.todo-item__input"),
            btnEdit: q(this, "button.todo-item__edit"),
            btnRemove: q(this, "button.todo-item__remove"),
            icnDragHandle: q(this, "button.todo-item__drag-handle"),
            divDropArea: q(this, "div.todo-item__drop-area"),
        };
        this._eventListenners = [
            [this._elements.btnState, "click", () => this._handleBtnStateClick()],
            [this._elements.btnEdit, "click", () => this._handleBtnEditClick()],
            [this._elements.btnRemove, "click", () => this._handleBtnRemoveClick()],
            [
                this._elements.inpText,
                "keyup",
                (ev) => this._handleTextInputKeyDown(ev),
            ],
            [this, "dragin", () => this._handleDragIn()],
            [this, "dragout", () => this._handleDragOut()],
            [this, "drop", (ev) => this._handleDrop(ev)],
        ];
        if (this._states.firstConnect) {
            this._updateUI();
        }
        this.addEventListeners();
        this._states.firstConnect = false;
    }
    disconnectedCallback() {
        this.removeEventListeners();
    }
    _handleBtnStateClick() {
        this._states.todoState++;
        if (this._states.todoState > 2) {
            this._states.todoState = 0;
        }
        this._updateUI();
    }
    _handleBtnEditClick() {
        if (this._elements) {
            if (this._states.editingMode) {
                this.makeNoneEditable(true);
            }
            else {
                this.makeEditable();
            }
        }
    }
    _handleTextInputKeyDown(ev) {
        if (ev.key === "Escape") {
            this.makeNoneEditable(false);
        }
        else if (ev.key === "Enter") {
            this.makeNoneEditable(true);
        }
    }
    _handleBtnRemoveClick() {
        this.removeEventListeners();
        this.remove();
    }
    setText(text) {
        this._states.text = text;
        this._updateUI();
    }
    _handleDragIn() {
        var _d;
        if (TodoItem.draggingTodoItem) {
            (_d = this._elements) === null || _d === void 0 ? void 0 : _d.divDropArea.setAttribute("data-expanded", "true");
        }
    }
    _handleDragOut() {
        var _d;
        (_d = this._elements) === null || _d === void 0 ? void 0 : _d.divDropArea.removeAttribute("data-expanded");
    }
    _handleDrop(ev) {
        var _d;
        if (TodoItem.draggingTodoItem) {
            (_d = this.parentNode) === null || _d === void 0 ? void 0 : _d.insertBefore(TodoItem.draggingTodoItem, this.nextSibling);
        }
    }
}
_a = TodoItem;
TodoItem.STATES = ["TODO", "DOING", "DONE"];
TodoItem.DEFAULT_TODO_TEXT = "Todo Item";
TodoItem.TEMPLATE = `
      <div class="todo-item__visible">
        <span class="todo-item__status-line"></span>
        <span class="todo-item__content">
          <div class="todo-item__header">
            <button class="todo-item__state"></button>
            <span class="todo-item__header-spacer"></span>
            <button class="todo-item__edit"><i class="fas fa-pencil-alt"></i></button>
            <button class="todo-item__remove"><i class="fas fa-minus"></i></button>
            <i class="todo-item__drag-handle fas fa-bars draggable"></i>
          </div>
          <div class="todo-item__body">
            <span class="todo-item__text"></span>
            <input class="todo-item__input" hidden />
          </div>
        </span>
      </div>
      <div class="todo-item__drop-area"></div>
      `;
(() => {
    document.addEventListener("dragstart", (ev) => {
        if (ev.target instanceof TodoItem) {
            _a.draggingTodoItem = ev.target;
            if (ev.dataTransfer) {
                ev.dataTransfer.effectAllowed = "move";
            }
        }
        else {
            _a.draggingTodoItem = null;
        }
    });
    document.addEventListener("dragend", (ev) => {
        _a.draggingTodoItem = null;
    });
})();
customElements.define("todo-item", TodoItem);
class TodoList extends HTMLElement {
    constructor() {
        super();
        this._elements = null;
        this._eventListenners = [];
        this._states = {
            firstConnect: true,
        };
        this._detachDragInOutEvents = null;
    }
    addEventListeners() {
        this._eventListenners.forEach((ev) => ev[0].addEventListener(ev[1], ev[2]));
        this._detachDragInOutEvents = attachDragInOutEvents(this);
    }
    removeEventListeners() {
        var _d;
        this._eventListenners.forEach((ev) => ev[0].removeEventListener(ev[1], ev[2]));
        (_d = this._detachDragInOutEvents) === null || _d === void 0 ? void 0 : _d.call(this);
    }
    connectedCallback() {
        this.draggable = true;
        if (!this.innerHTML) {
            this.innerHTML = TodoList.TEMPLATE;
        }
        this._elements = {
            spnName: q(this, "span.todo-list__name"),
            btnRemove: q(this, "button.todo-list__remove-btn"),
            ulList: q(this, "ul.todo-list__list"),
            inpAdd: q(this, "input.todo-list__add-inp"),
            btnAdd: q(this, "button.todo-list__add-btn"),
            divDropArea: q(this, "div.todo-list__drop-area"),
        };
        this._eventListenners = [
            [
                this._elements.spnName,
                "keyup",
                (ev) => this._handleNameKeyup(ev),
            ],
            [this._elements.btnRemove, "click", () => this._handleRemoveBtnClick()],
            [
                this._elements.inpAdd,
                "keyup",
                (ev) => this._handleAddInpKeyup(ev),
            ],
            [this._elements.btnAdd, "click", () => this._handleAddBtnClick()],
            [this, "dragin", () => this._handleDragIn()],
            [this, "dragout", () => this._handleDragOut()],
            [this, "drop", (ev) => this._handleDrop(ev)],
        ];
        if (this._states.firstConnect) {
            this._elements.spnName.innerText = TodoList.DEFAULT_TODO_LIST_NAME;
        }
        this.addEventListeners();
        this._states.firstConnect = false;
    }
    disconnectedCallback() {
        this.removeEventListeners();
    }
    _handleNameKeyup(ev) {
        var _d;
        if (ev.key === "Escape") {
            (_d = this._elements) === null || _d === void 0 ? void 0 : _d.spnName.blur();
        }
    }
    _handleRemoveBtnClick() {
        this.removeEventListeners();
        this.remove();
    }
    _handleAddInpKeyup(ev) {
        if (this._elements) {
            if (ev.key === "Escape") {
                this._elements.inpAdd.value = "";
            }
            else if (ev.key === "Enter") {
                this.addTodo();
            }
        }
    }
    _handleAddBtnClick() {
        this.addTodo();
    }
    addTodo(text) {
        var _d;
        if (this._elements) {
            const _text = text || this._elements.inpAdd.value;
            if (_text) {
                const todoItem = document.createElement("todo-item");
                todoItem.setText(_text);
                (_d = this._elements) === null || _d === void 0 ? void 0 : _d.ulList.appendChild(todoItem);
            }
            this._elements.inpAdd.value = "";
        }
    }
    _handleDragIn() {
        var _d;
        if (TodoList.draggingTodoList) {
            (_d = this._elements) === null || _d === void 0 ? void 0 : _d.divDropArea.setAttribute("data-expanded", "true");
        }
    }
    _handleDragOut() {
        var _d;
        (_d = this._elements) === null || _d === void 0 ? void 0 : _d.divDropArea.removeAttribute("data-expanded");
    }
    _handleDrop(ev) {
        var _d;
        if (TodoList.draggingTodoList) {
            (_d = this.parentNode) === null || _d === void 0 ? void 0 : _d.insertBefore(TodoList.draggingTodoList, this.nextSibling);
        }
    }
}
_b = TodoList;
TodoList.DEFAULT_TODO_LIST_NAME = "My Todo List";
TodoList.TEMPLATE = `
      <div class="todo-list__visible">
        <div class="todo-list__header">
            <i class="todo-list__drag-handle fas fa-bars draggable"></i>
            <span class="todo-list__name" contenteditable="true"></span>
            <button class="todo-list__remove-btn" id="remove-list"><i class="fas fa-trash-alt"></i></button>
        </div>
        <ul class="todo-list__list"></ul>
        <div class="todo-list__add" id="add-item">
            <input class="todo-list__add-inp" type="text" placeholder="Add something todo ..." />
            <button class="todo-list__add-btn" id="add-item"><i class="fas fa-plus"></i></button>
        </div> 
      </div>
      <div class="todo-list__drop-area"></div>
      `;
(() => {
    document.addEventListener("dragstart", (ev) => {
        if (ev.target instanceof TodoList) {
            _b.draggingTodoList = ev.target;
            if (ev.dataTransfer) {
                ev.dataTransfer.effectAllowed = "move";
            }
        }
        else {
            _b.draggingTodoList = null;
        }
    });
    document.addEventListener("dragend", (ev) => {
        if (_b.draggingTodoList) {
            _b.draggingTodoList = null;
        }
    });
})();
customElements.define("todo-list", TodoList);
class TodoListContainer extends HTMLElement {
    constructor() {
        super();
        this._elements = null;
        this._eventListenners = [];
        this._states = {
            draggingElement: null,
        };
    }
    addEventListeners() {
        this._eventListenners.forEach((ev) => ev[0].addEventListener(ev[1], ev[2]));
    }
    removeEventListeners() {
        this._eventListenners.forEach((ev) => ev[0].removeEventListener(ev[1], ev[2]));
    }
    connectedCallback() {
        if (!this.innerHTML) {
            this.innerHTML = TodoListContainer.TEMPLATE;
        }
        this._elements = {
            ulList: q(this, "ul.todo-list-container__list"),
            btnAdd: q(this, "button.todo-list-container__add-btn"),
        };
        this._eventListenners = [
            [this, "dragover", (ev) => this._handleDragOver(ev)],
            [this._elements.btnAdd, "click", () => this._handleAddBtnClick()],
        ];
        this.addEventListeners();
    }
    disconnectedCallback() {
        this.removeEventListeners();
    }
    _handleAddBtnClick() {
        if (this._elements) {
            const todoList = document.createElement("todo-list");
            this._elements.ulList.appendChild(todoList);
        }
    }
    _handleDragOver(ev) {
        if (TodoListContainer.draggingTodoElement) {
            ev.preventDefault();
        }
    }
}
_c = TodoListContainer;
TodoListContainer.TEMPLATE = `
    <button class="todo-list-container__add-btn btn-cta"><i class="fas fa-plus"></i> Add List</button>
    <ul class="todo-list-container__list"></ul>
    `;
(() => {
    document.addEventListener("dragstart", (ev) => {
        _c.draggingTodoElement =
            ev.target instanceof TodoList || ev.target instanceof TodoItem
                ? ev.target
                : null;
    });
    document.addEventListener("dragend", (ev) => {
        _c.draggingTodoElement = null;
    });
})();
customElements.define("todo-list-container", TodoListContainer);
