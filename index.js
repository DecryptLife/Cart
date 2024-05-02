const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    // define your method to get cart data

    fetch(`${URL}/cart`).then((res) => {
      return res.json();
    });
  };

  const getInventory = () => {
    // define your method to get inventory data
    return fetch(`${URL}/inventory`).then((res) => res.json());
  };

  const addToCart = (inventoryItem) => {
    // define your method to add an item to cart
    return fetch(URL + "cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inventoryItem),
    });
  };

  const updateCart = (id, newAmount) => {
    // define your method to update an item in cart
    return fetch(`${URL}/cart/${id}`, {
      method: "PUT",
      header: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newAmount),
    }).then((res) => res.json());
  };

  const deleteFromCart = (id) => {
    // define your method to delete an item in cart
    return fetch(`${baseUrl}/cart/${id}`, {
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

  const inventoryListEl = document.querySelector(".inventory__list");
  const cartListEl = document.querySelector(".cart__list");

  // const add_btn = document.querySelector(".item__add-btn");
  // const remove_btn = document.querySelector(".item__remove-btn");

  // console.log(add_btn);
  // console.log(remove_btn);
  const renderInventory = (inventory) => {
    let inventoryTemp = "";

    console.log("V: ", inventory);

    inventory.forEach((item) => {
      const itemTemp = ` <li id=${item.id}>
      <span class="item_name-field">${item.content}</span>
      <button class="item__remove-btn">-</button>
      <span class="item_count-field" id="count-${item.id}">${
        item.count || 0
      }</span>
      <button class="item__add-btn">+</button>
      <button class="add__cart-btn">Add to Cart</button>
    </li>`;

      inventoryTemp += itemTemp;
    });

    inventoryListEl.innerHTML = inventoryTemp;
  };

  const renderCart = (cart) => {
    let cartTemp = "";

    cart.forEach((item) => {
      const itemTemp = `<li>
      <span>${item.content} x</span>
      <span>${item.count}</span>
      <button>Delete</button>
    </li>`;

      cartTemp += itemTemp;
    });

    cartListEl.innerHTML = cartTemp;
  };

  return { renderInventory, renderCart, inventoryListEl };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const init = () => {
    model.getInventory().then((data) => {
      state.inventory = data;
    });
  };
  const handleUpdateAmount = () => {
    view.inventoryListEl.addEventListener("click", (event) => {
      const element = event.target;

      if (element.className === "item__add-btn") {
        const id = element.parentElement.getAttribute("id");
        console.log(id, "add btn clicked");
      } else if (element.className === "item__remove-btn") {
        const id = element.parentElement.getAttribute("id");
        console.log("remove button clicked");
      }
    });
  };

  const handleAddToCart = () => {};

  const handleDelete = () => {};

  const handleCheckout = () => {};
  const bootstrap = () => {
    init();

    state.subscribe(() => {
      view.renderInventory(state.inventory);
      view.renderCart(state.cart);
    });

    handleUpdateAmount();
  };
  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();
