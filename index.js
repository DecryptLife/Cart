const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    // define your method to get cart data

    return fetch(`${URL}/cart`).then((res) => res.json());
  };

  const getInventory = () => {
    // define your method to get inventory data
    return fetch(`${URL}/inventory`).then((res) => res.json());
  };

  const addToCart = (inventoryItem) => {
    // define your method to add an item to cart
    return fetch(`${URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inventoryItem),
    }).then((res) => res.json());
  };

  const updateCart = (id, newAmount) => {
    // define your method to update an item in cart
    return fetch(`${URL}/cart/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ count: newAmount }),
    }).then((res) => res.json());
  };

  const deleteFromCart = (id) => {
    // define your method to delete an item in cart
    return fetch(`${URL}/cart/${id}`, {
      method: "DELETE",
    }).then((res) => res.json());
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    #currentIndex = 0;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    get currentIndex() {
      return this.#currentIndex; // Getter for current page
    }

    set currentIndex(index) {
      this.#currentIndex = index;
      this.#onChange();
    }
    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }
  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = API;
  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const View = (() => {
  // implement your logic for View
  const itemsPerPage = 2;

  let currentIndex = 0;

  const inventoryListEl = document.querySelector(".inventory__list");
  const cartListEl = document.querySelector(".cart__list");

  const checkoutBtn = document.querySelector(".cart__checkout-btn");

  const prevBtn = document.querySelector(".pagination__prev-btn");
  const nextBtn = document.querySelector(".pagination__next-btn");

  const paginationEl = document.querySelector(".pagination-area");
  const paginationPgs = document.querySelector(".pagination__pages");

  const checkoutMsgTxt = document.querySelector(".checkout__message-txt");

  function renderPage(items, pageIndex) {
    let inventoryTemp = "";

    const start = pageIndex * itemsPerPage;
    const end = Math.min(items.length, start + itemsPerPage); // stays in bounds

    for (let i = start; i < end; i++) {
      const item = items[i];
      inventoryTemp += `<li id=${item.id}>
          <span class="item_name-field">${item.content}</span>
          <button class="item__remove-btn">-</button>
          <span class="item_count-field" id="count-${item.id}">${
        item.amount || 0
      }</span>
          <button class="item__add-btn">+</button>
          <button class="add__cart-btn">Add to Cart</button>
        </li>`;
    }

    inventoryListEl.innerHTML = inventoryTemp;
  }

  const renderInventory = (inventory) => {
    const pageButtonContainerEl = document.querySelector(".pagination__pages");
    pageButtonContainerEl.innerHTML = ""; // Clear previous buttons

    const pageNum = Math.ceil(inventory.length / itemsPerPage);

    for (let i = 0; i < pageNum; i++) {
      let button = document.createElement("button");
      button.textContent = i + 1;
      button.className = `pagination-btns`;
      button.id = `${i + 1}`;
      // button.addEventListener("click", () => renderPage(inventory, i));
      pageButtonContainerEl.appendChild(button);
    }

    if (inventory.length > 0) {
      renderPage(inventory, 0); // Only render the first page initially
    }
  };

  const renderCart = (cart) => {
    let cartTemp = "";

    cart.forEach((item) => {
      const itemTemp = `<li id=${item.id}>
      <span>${item.content}</span>
      <span>x</span>
      <span>${item.count}</span>
      <button class="cart__delete-btn">Delete</button>
    </li>`;

      cartTemp += itemTemp;
    });

    cartListEl.innerHTML = cartTemp;
  };

  return {
    renderInventory,
    renderCart,
    inventoryListEl,
    cartListEl,
    checkoutBtn,
    prevBtn,
    nextBtn,
    paginationEl,
    currentIndex,
    itemsPerPage,
    renderPage,
    paginationPgs,
    checkoutMsgTxt,
  };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const init = () => {
    model.getInventory().then((data) => {
      data.forEach((item) => {
        item.amount = 0;
      });
      state.inventory = data;
    });

    model.getCart().then((data) => {
      state.cart = data;
    });
  };

  const handleUpdateAmount = () => {
    view.inventoryListEl.addEventListener("click", (event) => {
      const element = event.target;
      const id = element.parentElement.getAttribute("id");
      const classname = element.className;

      if (classname === "item__add-btn" || classname === "item__remove-btn") {
        // we have id of the item clicked
        // after finding increment or decrement we have to updated the item
        // find if id is valid
        const oldInventory = state.inventory;
        const newInventory = oldInventory.map((item) => {
          if (Number(id) === item.id) {
            return {
              ...item,
              amount: Math.max(
                0,
                classname === "item__add-btn"
                  ? item.amount + 1
                  : item.amount - 1
              ),
            };
          } else {
            return item;
          }
        });

        state.inventory = newInventory;
      }
    });
  };

  const handleAddToCart = () => {
    view.inventoryListEl.addEventListener("click", (event) => {
      event.preventDefault();
      const element = event.target;
      if (element.className === "add__cart-btn") {
        const id = element.parentElement.getAttribute("id");
        const itemContent =
          event.target.parentElement.querySelector(
            ".item_name-field"
          ).innerText;
        const item_countEl = document.getElementById(`count-${id}`);
        const count = parseInt(item_countEl.innerText);
        if (count > 0) {
          const existingCartItemIndex = state.cart.findIndex(
            (item) => item.id === id
          );

          if (existingCartItemIndex !== -1) {
            //  update cart
            const existingItem = state.cart[existingCartItemIndex];
            const updateditem = existingItem.count + count;

            model.updateCart(id, updateditem).then((data) => {
              state.cart[existingCartItemIndex] = data;
              state.cart = [...state.cart];
            });
          } else {
            const inventoryItem = { id, content: itemContent, count };
            model.addToCart(inventoryItem).then((addedItem) => {
              state.cart = [...state.cart, addedItem];
            });
          }
        }
      }
    });
  };

  const handleDelete = () => {
    view.cartListEl.addEventListener("click", (event) => {
      const element = event.target;

      if (element.className === "cart__delete-btn") {
        const id = element.parentElement.getAttribute("id");

        model.deleteFromCart(id).then((data) => {
          state.cart = state.cart.filter((item) => item.id != id);
        });
      }
    });
  };

  const handleCheckout = () => {
    view.checkoutBtn.addEventListener("click", () => {
      view.checkoutMsgTxt.style.display = "block";
      setTimeout(() => {
        model.checkout().then(() => {
          state.cart = [];
          view.checkoutMsgTxt.style.display = "none";
        });
      }, 2000);
    });
  };

  const handlePagination = () => {
    const onPageChange = (newIndex) => {
      state.currentIndex = newIndex;
      view.renderPage(state.inventory, newIndex);
    };
    view.prevBtn.addEventListener("click", () => {
      if (state.currentIndex > 0) {
        onPageChange(state.currentIndex - 1);
      }
    });

    view.nextBtn.addEventListener("click", () => {
      const maxPage = Math.ceil(state.inventory.length / view.itemsPerPage) - 1;

      if (state.currentIndex < maxPage) {
        onPageChange(state.currentIndex + 1);
      }
    });

    view.paginationPgs.addEventListener("click", (event) => {
      const element = event.target;

      if (element.className === "pagination-btns") {
        const pageIdx = element.getAttribute("id");
        onPageChange(pageIdx - 1);
      }
    });
  };
  const bootstrap = () => {
    init();

    state.subscribe(() => {
      view.renderInventory(state.inventory);
      view.renderCart(state.cart);
    });

    handleUpdateAmount();
    handleAddToCart();
    handleDelete();
    handleCheckout();
    handlePagination();
  };
  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();
