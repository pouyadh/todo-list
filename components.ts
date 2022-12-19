let cnt: number = 0;
let draggingList: {
  element: Element;
  ignore: Element[];
} | null;
let draggingListItem: {
  element: Element;
  ignore: Element[];
} | null;

const trackDragEnterLeave = (
  element: Element | HTMLElement,
  enterCallback: (ev: DragEvent) => any,
  leaveCallback: (ev: DragEvent) => any
) => {
  const track = new Map();

  const handleEnter: EventListener = (ev) => {
    if (ev.target === element || element.contains(<Node>ev.target)) {
      if (track.size === 0) {
        enterCallback(<DragEvent>ev);
      }
      track.set(ev.target, true);
    }
  };
  const handleLeave: EventListener = (ev) => {
    track.delete(ev.target);
    if (track.size === 0) {
      leaveCallback(<DragEvent>ev);
    }
  };
  const handleDrop: EventListener = (ev) => {
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
  static STATES = ["TODO", "DOING", "DONE"];
  private callOnDisconnect: Function[];
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
      <button class="todo-item__state">${
        TodoItem.STATES[+this.getAttribute("state")!]
      }</button>
      <span class="todo-item__text">${this.getAttribute("text")}</span>
      <button class="todo-item__edit"><i class="fas fa-pencil-alt"></i></button>
      <button class="todo-item__remove"><i class="fas fa-minus"></i></button>
      <i class="todo-item__drag-handle fas fa-bars draggable"></i>
    </li>
    `;
    const stateBtn = this.querySelector("button.todo-item__state")!;
    const removeBtn = this.querySelector("button.todo-item__remove")!;
    const editBtn = this.querySelector("button.todo-item__edit")!;
    const dropArea = this.querySelector("div.todo-item__drop-area")!;

    const handleDragEnter = (ev: DragEvent) => {
      if (
        draggingListItem?.element &&
        !draggingListItem?.ignore.includes(this)
      ) {
        dropArea.classList.add("todo-item__drop-area--extended");
      }
    };
    const handleDragLeave = (ev: DragEvent) => {
      dropArea.classList.remove("todo-item__drop-area--extended");
    };

    const removeTracker = trackDragEnterLeave(
      this,
      handleDragEnter,
      handleDragLeave
    );

    this.addEventListener("drop", (ev) => {
      if (
        draggingListItem?.element &&
        !draggingListItem?.ignore.includes(this)
      ) {
        this.parentNode?.insertBefore(<Node>draggingListItem?.element, this);
      }
      dropArea.classList.remove("todo-item__drop-area--extended");
      draggingListItem = null;
    });

    this.addEventListener("dragover", (ev) => ev.preventDefault());
    this.addEventListener("dragstart", (ev) => {
      draggingListItem = {
        element: this,
        ignore: [this],
      };
      if (this.nextElementSibling?.tagName === "TODO-ITEM") {
        draggingListItem.ignore.push(this.nextElementSibling);
      }
    });

    stateBtn.addEventListener("click", () => this.toggleState());
    removeBtn.addEventListener("click", () => this.removeMe());
    editBtn.addEventListener("click", () => this.editMe());

    const removeListeners = () => {};
    this.callOnDisconnect.push(removeTracker, removeListeners);
  }

  disconnectedCallback() {
    console.log("disconnected", this.id);
  }

  toggleState() {
    let state = +this.getAttribute("state")!;
    state++;
    if (state >= TodoItem.STATES.length) {
      state = 0;
    }
    this.setAttribute("state", state.toString());
    const stateBtn = this.querySelector("button.todo-item__state")!;
    stateBtn.innerHTML = TodoItem.STATES[state];
  }
  removeMe() {
    this.remove();
  }
  editMe() {
    const li = this.querySelector("li")!;
    const editBtn = this.querySelector("button.todo-item__edit")!;
    let textSpn: HTMLSpanElement | null = this.querySelector(
      "span.todo-item__text"
    );
    let textInp: HTMLInputElement | null = this.querySelector(
      "input.todo-item__text"
    );

    console.log(!!textSpn, !!textInp);
    if (textSpn && !textInp) {
      textInp = document.createElement("input");
      textInp.className = "todo-item__text";
      textInp.setAttribute("type", "text");
      textInp.value = textSpn.innerHTML;
      textSpn.remove();
      li.insertBefore(textInp, editBtn);
      editBtn.innerHTML = '<i class="fas fa-check"></i>';
    } else if (!textSpn && textInp) {
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
customElements.define("todo-item", TodoItem);

class TodoListDropArea extends HTMLElement {
  private callOnDisconnect: Function[];
  constructor() {
    super();
    this.callOnDisconnect = [];
  }
  connectedCallback() {
    const handleDragEnter: EventListener = (ev) => {
      if (draggingList) {
        this.classList.add("todo-list-drop-area--extended");
      }
    };
    const handleDragLeave: EventListener = (ev) => {
      this.classList.remove("todo-list-drop-area--extended");
    };
    const handleDragOver: EventListener = (ev) => {
      if (draggingList) {
        ev.preventDefault();
      }
    };
    const handleDrop: EventListener = (ev) => {
      if (draggingList) {
        this.parentElement?.insertBefore(draggingList.element, this);
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
  static TODO_STATE = ["TODO", "DOING", "DONE"];
  private callOnDisconnect: Function[];
  private dropArea: HTMLElement | null;
  constructor() {
    super();
    this.callOnDisconnect = [];
    this.dropArea = null;
  }
  connectedCallback() {
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
    const addItemBtn = this.querySelector("button#add-item")!;
    const removeListBtn = this.querySelector("button#remove-list")!;
    const todoItemDropArea = this.querySelector("div#todo-item-drop-area")!;
    const addItemLi = this.querySelector("li#add-item") as HTMLLIElement;
    const todoListAddItemInput = this.querySelector(
      "input.todo-list__add-item-inp"
    ) as HTMLInputElement;
    const todoListName = this.querySelector(
      "span.todo-list__name"
    ) as HTMLSpanElement;

    addItemBtn.addEventListener("click", () => this.addTodo());
    removeListBtn.addEventListener("click", () => this.removeList());

    const handleDragEnter = (ev: DragEvent) => {
      if (
        draggingListItem?.element &&
        !draggingListItem?.ignore.includes(this)
      ) {
        todoItemDropArea.classList.add("todo-item__drop-area--extended");
      }
    };
    const handleDragLeave = (ev: DragEvent) => {
      todoItemDropArea.classList.remove("todo-item__drop-area--extended");
    };

    const removeTracker = trackDragEnterLeave(
      addItemLi,
      handleDragEnter,
      handleDragLeave
    );

    addItemLi.addEventListener("dragover", (ev) => {
      ev.preventDefault();
    });

    addItemLi.addEventListener("drop", (ev) => {
      console.log("drop");
      if (
        draggingListItem?.element &&
        !draggingListItem?.ignore.includes(this)
      ) {
        console.log("drop-accepted");
        addItemLi.parentNode?.insertBefore(
          <Node>draggingListItem?.element,
          addItemLi
        );
      }
      todoItemDropArea.classList.remove("todo-item__drop-area--extended");
      draggingListItem = null;
    });

    todoListName.addEventListener("keyup", (ev) => {
      if ((<KeyboardEvent>ev).key === "Escape") {
        todoListName.blur();
      }
    });

    todoListAddItemInput.addEventListener("keyup", (ev) => {
      if ((<KeyboardEvent>ev).key === "Enter") {
        this.addTodo();
      }
    });

    this.addEventListener("dragstart", (ev) => {
      if (ev.target === this) {
        draggingList = {
          element: this,
          ignore: [],
        };
        document
          .querySelector("section#list-container")
          ?.classList.add("list-is-dragging");
      }
    });
    this.addEventListener("dragend", (ev) => {
      document
        .querySelector("section#list-container")
        ?.classList.remove("list-is-dragging");
      draggingList = null;
      draggingListItem = null;
    });

    this.callOnDisconnect.push(removeTracker);

    this.dropArea = document.createElement("todo-list-drop-area");
    this.parentElement?.insertBefore(this.dropArea, this);
  }
  removeList() {
    this.dropArea?.remove();
    this.remove();
  }
  disconnectedCallback() {
    this.dropArea?.remove();
  }

  addTodo() {
    const todoTextInput = this.querySelector(
      ".todo-list__add-item-inp"
    ) as HTMLInputElement;
    const todoList = this.querySelector(".todo-list__list") as HTMLUListElement;
    const addLi = this.querySelector("li#add-item") as HTMLDivElement;

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
customElements.define("todo-list", TodoList);

const btnAddList = document.querySelector("button#add-list");
const secListContainer = document.querySelector("section#list-container");
const addList = () => {
  const newList = document.createElement("todo-list");
  secListContainer?.insertBefore(newList, btnAddList);
};
btnAddList?.addEventListener("click", addList);
