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
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newAmount),
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
        item.count || 0
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
      button.addEventListener("click", () => renderPage(inventory, i));
      pageButtonContainerEl.appendChild(button);
    }

    if (inventory.length > 0) {
      renderPage(inventory, 0); // Only render the first page initially
    }
  };

  const renderCart = (cart) => {
    console.log(cart);
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
  };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const init = () => {
    model.getInventory().then((data) => {
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

      //  try putting countEL in views if possible
      const countEl = document.getElementById(`count-${id}`);
      let count = parseInt(countEl.innerText);

      if (element.className === "item__add-btn") {
        count += 1;
        countEl.innerText = count;
      } else if (element.className === "item__remove-btn") {
        if (count >= 1) {
          count -= 1;
          countEl.innerText = count;
        }
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
        const count = parseInt(
          document.getElementById(`count-${id}`).innerText
        );
        if (count > 0) {
          //  check if item present in cart
          console.log("State:", state.cart);
          console.log(id);
          const existingCartItemIndex = state.cart.findIndex(
            (item) => item.id === id
          );

          console.log("Existing item index: ", existingCartItemIndex);
          const newCount =
            (state.cart[existingCartItemIndex]?.count || 0) + count;
          if (existingCartItemIndex !== -1) {
            //  update cart
            console.log("Item exists");
            const existingItem = state.cart[existingCartItemIndex];
            const updateditem = {
              ...existingItem,
              count: existingItem.count + count,
            };

            model.updateCart(id, updateditem).then((data) => {
              state.cart[existingCartItemIndex] = data;
              state.cart = [...state.cart];
            });
          } else {
            console.log("Item does not exist");
            const inventoryItem = { id, content: itemContent, count };
            console.log(inventoryItem);
            model.addToCart(inventoryItem).then((addedItem) => {
              console.log(addedItem);
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
      console.log(element);

      if (element.className === "cart__delete-btn") {
        const id = element.parentElement.getAttribute("id");

        console.log("id clickedL ; ", id);

        model.deleteFromCart(id).then((data) => {
          state.cart = state.cart.filter((item) => item.id != id);
        });
      }
    });
  };

  const handleCheckout = () => {
    view.checkoutBtn.addEventListener("click", () => {
      model.checkout().then(() => {
        state.cart = [];
      });
    });
  };

  const handlePagination = () => {
    view.prevBtn.addEventListener("click", () => {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
        view.renderPage(state.inventory, state.currentIndex);
      }
    });

    view.nextBtn.addEventListener("click", () => {
      const maxPage = Math.ceil(state.inventory.length / view.itemsPerPage) - 1;
      if (state.currentIndex < maxPage) {
        state.currentIndex += 1;
        view.renderPage(state.inventory, state.currentIndex);
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
