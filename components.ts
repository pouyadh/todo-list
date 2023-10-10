const attachDragInOutEvents = (element: HTMLElement) => {
  const evDragIn = new Event("dragin");
  const evDragOut = new Event("dragout");
  const track = new Map();
  const handleEnter = (ev: DragEvent) => {
    if (ev.target === element || element.contains(<Node>ev.target)) {
      if (track.size === 0) {
        element.dispatchEvent(evDragIn);
      }
      track.set(ev.target, true);
    }
  };
  const handleLeave = (ev: DragEvent) => {
    track.delete(ev.target);
    if (track.size === 0) {
      element.dispatchEvent(evDragOut);
    }
  };
  const handleEnd = (ev: DragEvent) => {
    track.clear();
    element.dispatchEvent(evDragOut);
  };
  const handleDrop = (ev: DragEvent) => {
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

function q(elem: HTMLElement, selector: string) {
  return elem.querySelector(selector);
}

class TodoItem extends HTMLElement {
  static STATES = ["TODO", "DOING", "DONE"];
  static DEFAULT_TODO_TEXT = "Todo Item";
  static TEMPLATE = `
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
  static draggingTodoItem: TodoItem | null;
  static {
    document.addEventListener("dragstart", (ev) => {
      if (ev.target instanceof TodoItem) {
        this.draggingTodoItem = ev.target;
        if (ev.dataTransfer) {
          ev.dataTransfer.effectAllowed = "move";
        }
      } else {
        this.draggingTodoItem = null;
      }
    });
    document.addEventListener("dragend", (ev) => {
      this.draggingTodoItem = null;
    });
  }
  private _elements: {
    divDropArea: HTMLDivElement;
    btnState: HTMLButtonElement;
    spnText: HTMLSpanElement;
    inpText: HTMLInputElement;
    btnEdit: HTMLButtonElement;
    btnRemove: HTMLButtonElement;
    icnDragHandle: HTMLElement;
  } | null;
  private _eventListenners: [
    elem: Element,
    type: string,
    listener: EventListener
  ][];
  private _states: {
    firstConnect: boolean;
    todoState: number;
    editingMode: boolean;
    text: string;
  };
  private _detachDragInOutEvents: Function | null;
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
    this._eventListenners.forEach((ev) =>
      ev[0].removeEventListener(ev[1], ev[2])
    );
    if (this._detachDragInOutEvents) {
      this._detachDragInOutEvents();
    }
  }

  private _updateUI() {
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
      } else {
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
  makeNoneEditable(applyChanges: boolean = true) {
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
      btnState: q(this, "button.todo-item__state") as HTMLButtonElement,
      spnText: q(this, "span.todo-item__text") as HTMLSpanElement,
      inpText: q(this, "input.todo-item__input") as HTMLInputElement,
      btnEdit: q(this, "button.todo-item__edit") as HTMLButtonElement,
      btnRemove: q(this, "button.todo-item__remove") as HTMLButtonElement,
      icnDragHandle: q(this, "button.todo-item__drag-handle") as HTMLElement,
      divDropArea: q(this, "div.todo-item__drop-area") as HTMLDivElement,
    };
    this._eventListenners = [
      [this._elements.btnState, "click", () => this._handleBtnStateClick()],
      [this._elements.btnEdit, "click", () => this._handleBtnEditClick()],
      [this._elements.btnRemove, "click", () => this._handleBtnRemoveClick()],
      [
        this._elements.inpText,
        "keyup",
        (ev) => this._handleTextInputKeyDown(<KeyboardEvent>ev),
      ],
      [this, "dragin", () => this._handleDragIn()],
      [this, "dragout", () => this._handleDragOut()],
      [this, "drop", (ev) => this._handleDrop(<DragEvent>ev)],
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

  private _handleBtnStateClick() {
    this._states.todoState++;
    if (this._states.todoState > 2) {
      this._states.todoState = 0;
    }
    this._updateUI();
  }
  private _handleBtnEditClick() {
    if (this._elements) {
      if (this._states.editingMode) {
        this.makeNoneEditable(true);
      } else {
        this.makeEditable();
      }
    }
  }

  private _handleTextInputKeyDown(ev: KeyboardEvent) {
    if (ev.key === "Escape") {
      this.makeNoneEditable(false);
    } else if (ev.key === "Enter") {
      this.makeNoneEditable(true);
    }
  }
  _handleBtnRemoveClick() {
    this.removeEventListeners();
    this.remove();
  }
  setText(text: string) {
    this._states.text = text;
    this._updateUI();
  }
  private _handleDragIn() {
    if (TodoItem.draggingTodoItem) {
      this._elements?.divDropArea.setAttribute("data-expanded", "true");
    }
  }
  private _handleDragOut() {
    this._elements?.divDropArea.removeAttribute("data-expanded");
  }
  private _handleDrop(ev: DragEvent) {
    if (TodoItem.draggingTodoItem) {
      this.parentNode?.insertBefore(
        TodoItem.draggingTodoItem,
        this.nextSibling
      );
    }
  }
}

customElements.define("todo-item", TodoItem);

class TodoList extends HTMLElement {
  static DEFAULT_TODO_LIST_NAME = "My Todo List";
  static TEMPLATE = `
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
  static draggingTodoList: TodoList | null;
  static {
    document.addEventListener("dragstart", (ev) => {
      if (ev.target instanceof TodoList) {
        this.draggingTodoList = ev.target;
        if (ev.dataTransfer) {
          ev.dataTransfer.effectAllowed = "move";
        }
      } else {
        this.draggingTodoList = null;
      }
    });
    document.addEventListener("dragend", (ev) => {
      if (this.draggingTodoList) {
        this.draggingTodoList = null;
      }
    });
  }
  private _elements: {
    spnName: HTMLSpanElement;
    btnRemove: HTMLButtonElement;
    ulList: HTMLUListElement;
    inpAdd: HTMLInputElement;
    btnAdd: HTMLButtonElement;
    divDropArea: HTMLDivElement;
  } | null;
  private _eventListenners: [
    elem: Element,
    type: string,
    listener: EventListener
  ][];
  private _states: {
    firstConnect: boolean;
  };
  private _detachDragInOutEvents: Function | null;
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
    this._eventListenners.forEach((ev) =>
      ev[0].removeEventListener(ev[1], ev[2])
    );
    this._detachDragInOutEvents?.();
  }
  connectedCallback() {
    this.draggable = true;
    if (!this.innerHTML) {
      this.innerHTML = TodoList.TEMPLATE;
    }
    this._elements = {
      spnName: q(this, "span.todo-list__name") as HTMLSpanElement,
      btnRemove: q(this, "button.todo-list__remove-btn") as HTMLButtonElement,
      ulList: q(this, "ul.todo-list__list") as HTMLUListElement,
      inpAdd: q(this, "input.todo-list__add-inp") as HTMLInputElement,
      btnAdd: q(this, "button.todo-list__add-btn") as HTMLButtonElement,
      divDropArea: q(this, "div.todo-list__drop-area") as HTMLDivElement,
    };
    this._eventListenners = [
      [
        this._elements.spnName,
        "keyup",
        (ev) => this._handleNameKeyup(<KeyboardEvent>ev),
      ],
      [this._elements.btnRemove, "click", () => this._handleRemoveBtnClick()],
      [
        this._elements.inpAdd,
        "keyup",
        (ev) => this._handleAddInpKeyup(<KeyboardEvent>ev),
      ],
      [this._elements.btnAdd, "click", () => this._handleAddBtnClick()],
      [this, "dragin", () => this._handleDragIn()],
      [this, "dragout", () => this._handleDragOut()],
      [this, "drop", (ev) => this._handleDrop(<DragEvent>ev)],
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
  private _handleNameKeyup(ev: KeyboardEvent) {
    if (ev.key === "Escape") {
      this._elements?.spnName.blur();
    }
  }
  private _handleRemoveBtnClick() {
    this.removeEventListeners();
    this.remove();
  }
  private _handleAddInpKeyup(ev: KeyboardEvent) {
    if (this._elements) {
      if (ev.key === "Escape") {
        this._elements.inpAdd.value = "";
      } else if (ev.key === "Enter") {
        this.addTodo();
      }
    }
  }
  private _handleAddBtnClick() {
    this.addTodo();
  }
  addTodo(text?: string) {
    if (this._elements) {
      const _text = text || this._elements.inpAdd.value;
      if (_text) {
        const todoItem = document.createElement("todo-item") as TodoItem;
        todoItem.setText(_text);
        this._elements?.ulList.appendChild(todoItem);
      }
      this._elements.inpAdd.value = "";
    }
  }

  private _handleDragIn() {
    if (TodoList.draggingTodoList) {
      this._elements?.divDropArea.setAttribute("data-expanded", "true");
    }
  }
  private _handleDragOut() {
    this._elements?.divDropArea.removeAttribute("data-expanded");
  }
  private _handleDrop(ev: DragEvent) {
    if (TodoList.draggingTodoList) {
      this.parentNode?.insertBefore(
        TodoList.draggingTodoList,
        this.nextSibling
      );
    }
  }
}

customElements.define("todo-list", TodoList);

type TodoAppDraggingDetails = {
  type: "list" | "item";
  element: Element;
  data: any;
} | null;
class TodoListContainer extends HTMLElement {
  static TEMPLATE = `
    <button class="todo-list-container__add-btn btn-cta"><i class="fas fa-plus"></i> Add List</button>
    <ul class="todo-list-container__list"></ul>
    `;
  static draggingTodoElement: TodoList | TodoItem | null;
  static {
    document.addEventListener("dragstart", (ev) => {
      this.draggingTodoElement =
        ev.target instanceof TodoList || ev.target instanceof TodoItem
          ? ev.target
          : null;
    });
    document.addEventListener("dragend", (ev) => {
      this.draggingTodoElement = null;
    });
  }
  private _elements: {
    ulList: HTMLUListElement;
    btnAdd: HTMLButtonElement;
  } | null;
  private _eventListenners: [
    elem: Element,
    type: string,
    listener: EventListener
  ][];
  private _states: {
    draggingElement: TodoList | TodoItem | null;
  };
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
    this._eventListenners.forEach((ev) =>
      ev[0].removeEventListener(ev[1], ev[2])
    );
  }
  connectedCallback() {
    if (!this.innerHTML) {
      this.innerHTML = TodoListContainer.TEMPLATE;
    }
    this._elements = {
      ulList: q(this, "ul.todo-list-container__list") as HTMLUListElement,
      btnAdd: q(
        this,
        "button.todo-list-container__add-btn"
      ) as HTMLButtonElement,
    };
    this._eventListenners = [
      [this, "dragover", (ev) => this._handleDragOver(<DragEvent>ev)],
      [this._elements.btnAdd, "click", () => this._handleAddBtnClick()],
    ];
    this.addEventListeners();
  }
  disconnectedCallback() {
    this.removeEventListeners();
  }

  private _handleAddBtnClick() {
    if (this._elements) {
      const todoList = document.createElement("todo-list");
      this._elements.ulList.appendChild(todoList);
    }
  }
  private _handleDragOver(ev: DragEvent) {
    if (TodoListContainer.draggingTodoElement) {
      ev.preventDefault();
    }
  }
}

customElements.define("todo-list-container", TodoListContainer);
