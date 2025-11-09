/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");
const userInput = document.getElementById("userInput");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearch");
const translateBtn = document.getElementById("translateBtn");
const translateText = document.getElementById("translateText");

/* Array to store selected products - load from localStorage if available */
let selectedProducts = loadSelectedProductsFromStorage();

/* Array to store conversation history */
let conversationHistory = [
  {
    role: "system",
    content:
      "You are a helpful beauty and skincare expert. Answer questions about skincare routines, product usage, and beauty tips. Be specific, friendly, and helpful. Reference the user's selected products when relevant.",
  },
];

/* Store all products for filtering */
let allProducts = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category or search for products
  </div>
`;

/* Initialize the selected products list with placeholder or saved products */
updateSelectedProductsDisplay();

/* Toggle RTL/LTR layout when translate button is clicked */
translateBtn.addEventListener("click", () => {
  const currentDir = document.documentElement.getAttribute("dir");

  if (currentDir === "rtl") {
    /* Switch back to LTR (Left-to-Right) */
    document.documentElement.setAttribute("dir", "ltr");
    document.documentElement.setAttribute("lang", "en");
    translateText.textContent = "Translate";
  } else {
    /* Switch to RTL (Right-to-Left) */
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
    translateText.textContent = "English";
  }
});

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  /* Store all products for filtering */
  allProducts = data.products;
  return data.products;
}

/* Load selected products from localStorage */
function loadSelectedProductsFromStorage() {
  const saved = localStorage.getItem("selectedProducts");
  return saved ? JSON.parse(saved) : [];
}

/* Save selected products to localStorage */
function saveSelectedProductsToStorage() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Filter products based on category and search term */
function filterProducts() {
  const selectedCategory = categoryFilter.value;
  const searchTerm = searchInput.value.trim().toLowerCase();

  /* Show or hide clear search button */
  if (searchTerm) {
    clearSearchBtn.classList.add("show");
  } else {
    clearSearchBtn.classList.remove("show");
  }

  /* Filter by category first */
  let filteredProducts = allProducts;

  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === selectedCategory
    );
  }

  /* Then filter by search term if present */
  if (searchTerm) {
    filteredProducts = filteredProducts.filter((product) => {
      /* Search in name, brand, and description */
      const name = product.name.toLowerCase();
      const brand = product.brand.toLowerCase();
      const description = product.description.toLowerCase();

      return (
        name.includes(searchTerm) ||
        brand.includes(searchTerm) ||
        description.includes(searchTerm)
      );
    });
  }

  /* Display filtered products or message if none found */
  if (filteredProducts.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        No products found. Try a different search or category.
      </div>
    `;
  } else {
    displayProducts(filteredProducts);
  }
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <button class="info-btn" data-product-id="${product.id}" type="button" aria-label="View product details">
          <i class="fa-solid fa-info-circle"></i>
        </button>
      </div>
      <div class="product-description-overlay">
        <div class="overlay-content">
          <h4>${product.name}</h4>
          <p class="overlay-brand">${product.brand}</p>
          <p class="overlay-description">${product.description}</p>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  /* Add click listeners to all product cards */
  attachProductClickListeners(products);

  /* Add click listeners to info buttons */
  attachInfoButtonListeners();

  /* Reapply selected state to previously selected products */
  selectedProducts.forEach((selectedProduct) => {
    const card = document.querySelector(
      `[data-product-id="${selectedProduct.id}"]`
    );
    if (card) {
      card.classList.add("selected");
    }
  });
}

/* Attach click event listeners to info buttons */
function attachInfoButtonListeners() {
  const infoButtons = document.querySelectorAll(".info-btn");

  infoButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      /* Prevent the card click event from firing */
      e.stopPropagation();

      /* Find the parent card and toggle the overlay */
      const card = button.closest(".product-card");
      const overlay = card.querySelector(".product-description-overlay");

      /* Close any other open overlays */
      document
        .querySelectorAll(".product-description-overlay.show")
        .forEach((openOverlay) => {
          if (openOverlay !== overlay) {
            openOverlay.classList.remove("show");
          }
        });

      /* Toggle this overlay */
      overlay.classList.toggle("show");
    });
  });

  /* Close overlay when clicking outside */
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".product-card")) {
      document
        .querySelectorAll(".product-description-overlay.show")
        .forEach((overlay) => {
          overlay.classList.remove("show");
        });
    }
  });
}

/* Attach click event listeners to product cards */
function attachProductClickListeners(products) {
  const productCards = document.querySelectorAll(".product-card");

  productCards.forEach((card) => {
    card.addEventListener("click", () => {
      const productId = parseInt(card.dataset.productId);
      toggleProductSelection(productId, card, products);
    });
  });
}

/* Toggle product selection state */
function toggleProductSelection(productId, card, products) {
  /* Check if product is already selected */
  const index = selectedProducts.findIndex((p) => p.id === productId);

  if (index > -1) {
    /* Product is selected, so unselect it */
    selectedProducts.splice(index, 1);
    card.classList.remove("selected");
  } else {
    /* Product is not selected, so select it */
    const product = products.find((p) => p.id === productId);
    selectedProducts.push(product);
    card.classList.add("selected");
  }

  /* Save to localStorage */
  saveSelectedProductsToStorage();

  /* Update the selected products display */
  updateSelectedProductsDisplay();
}

/* Update the selected products list display */
function updateSelectedProductsDisplay() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <p class="placeholder-message" style="padding: 20px;">
        Click on products above to add them to your routine
      </p>
    `;
  } else {
    selectedProductsList.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="font-size: 14px; color: #666;">${
          selectedProducts.length
        } product${selectedProducts.length > 1 ? "s" : ""} selected</span>
        <button id="clearAllBtn" class="clear-all-btn">
          <i class="fa-solid fa-trash"></i> Clear All
        </button>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 10px;">
        ${selectedProducts
          .map(
            (product) => `
          <div class="selected-product-tag">
            <span>${product.name}</span>
            <button class="remove-product" data-product-id="${product.id}" type="button">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    /* Add click listeners to remove buttons */
    attachRemoveListeners();

    /* Add click listener to clear all button */
    const clearAllBtn = document.getElementById("clearAllBtn");
    if (clearAllBtn) {
      clearAllBtn.addEventListener("click", clearAllProducts);
    }
  }
}

/* Attach click event listeners to remove buttons */
function attachRemoveListeners() {
  const removeButtons = document.querySelectorAll(".remove-product");

  removeButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const productId = parseInt(button.dataset.productId);
      removeProduct(productId);
    });
  });
}

/* Remove a product from selected list */
function removeProduct(productId) {
  /* Remove from selectedProducts array */
  const index = selectedProducts.findIndex((p) => p.id === productId);
  if (index > -1) {
    selectedProducts.splice(index, 1);
  }

  /* Save to localStorage */
  saveSelectedProductsToStorage();

  /* Remove selected class from product card if visible */
  const card = document.querySelector(`[data-product-id="${productId}"]`);
  if (card) {
    card.classList.remove("selected");
  }

  /* Update display */
  updateSelectedProductsDisplay();
}

/* Clear all selected products */
function clearAllProducts() {
  /* Confirm before clearing */
  if (confirm("Are you sure you want to clear all selected products?")) {
    /* Remove selected class from all product cards */
    selectedProducts.forEach((product) => {
      const card = document.querySelector(`[data-product-id="${product.id}"]`);
      if (card) {
        card.classList.remove("selected");
      }
    });

    /* Clear the array */
    selectedProducts = [];

    /* Save to localStorage */
    saveSelectedProductsToStorage();

    /* Update display */
    updateSelectedProductsDisplay();
  }
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  /* Load products if not already loaded */
  if (allProducts.length === 0) {
    await loadProducts();
  }

  /* Filter and display products */
  filterProducts();
});

/* Filter products in real-time as user types */
searchInput.addEventListener("input", async () => {
  /* Load products if not already loaded */
  if (allProducts.length === 0) {
    await loadProducts();
  }

  /* Filter and display products */
  filterProducts();
});

/* Clear search input when clear button is clicked */
clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearSearchBtn.classList.remove("show");

  /* Re-filter products */
  filterProducts();

  /* Focus back on search input */
  searchInput.focus();
});

/* Load all products on page load for search functionality */
loadProducts();

/* Generate routine using OpenAI API */
generateRoutineBtn.addEventListener("click", async () => {
  /* Check if any products are selected */
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = `
      <p style="color: #666;">Please select at least one product to generate a routine.</p>
    `;
    return;
  }

  /* Show loading message */
  chatWindow.innerHTML = `
    <p style="color: #666;">
      <i class="fa-solid fa-spinner fa-spin"></i> Generating your personalized routine...
    </p>
  `;

  /* Prepare product information for the API */
  const productList = selectedProducts
    .map((p) => `- ${p.brand} ${p.name}: ${p.description}`)
    .join("\n");

  /* Create the message for OpenAI */
  const userMessage = `I have selected the following products:\n\n${productList}\n\nPlease create a personalized skincare/beauty routine using these products. Include the order of use, when to use each product (morning/night), and any helpful tips.`;

  /* Reset conversation history and add the new routine request */
  conversationHistory = [
    {
      role: "system",
      content:
        "You are a helpful beauty and skincare expert. Create personalized routines based on the products provided. Be specific about the order of use, timing (AM/PM), and provide helpful tips. Format your response in a clear, easy-to-read way. Remember the user's selected products for follow-up questions. When providing skincare advice or product recommendations, cite reputable sources like dermatology research, skincare experts, or scientific studies. Include links in markdown format [text](url) when referencing external information.",
    },
    {
      role: "user",
      content: userMessage,
    },
  ];

  try {
    /* Make API request to Cloudflare Worker */
    const response = await fetch(OPENAI_API_KEY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: conversationHistory,
      }),
    });

    /* Check if the request was successful */
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    /* Parse the response */
    const data = await response.json();

    /* Extract the AI's response */
    const routineText = data.choices[0].message.content;

    /* Add assistant's response to conversation history */
    conversationHistory.push({
      role: "assistant",
      content: routineText,
    });

    /* Display the routine in the chat window */
    displayMessage("assistant", routineText);
  } catch (error) {
    /* Display error message if something went wrong */
    console.error("Error generating routine:", error);
    chatWindow.innerHTML = `
      <p style="color: #d32f2f;">
        <i class="fa-solid fa-exclamation-circle"></i> 
        Sorry, there was an error generating your routine. Please try again.
      </p>
      <p style="color: #666; font-size: 14px; margin-top: 10px;">Error: ${error.message}</p>
    `;
  }
});

/* Convert markdown links to HTML links */
function convertMarkdownLinks(text) {
  /* Replace markdown links [text](url) with HTML anchor tags */
  return text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #0066cc; text-decoration: underline;">$1 <i class="fa-solid fa-external-link-alt" style="font-size: 0.8em;"></i></a>'
  );
}

/* Format text with basic markdown support */
function formatMessageContent(content) {
  /* Convert markdown links to clickable HTML links */
  let formatted = convertMarkdownLinks(content);

  /* Preserve line breaks */
  formatted = formatted.replace(/\n/g, "<br>");

  return formatted;
}

/* Display a message in the chat window */
function displayMessage(role, content) {
  /* Format the content to support links */
  const formattedContent =
    role === "assistant" ? formatMessageContent(content) : content;

  /* Determine text alignment based on RTL mode */
  const isRTL = document.documentElement.getAttribute("dir") === "rtl";
  const userAlign = isRTL ? "text-align: left;" : "text-align: right;";

  /* Create message element with appropriate styling */
  const messageHTML = `
    <div style="margin-bottom: 15px; ${role === "user" ? userAlign : ""}">
      <div style="display: inline-block; max-width: 80%; text-align: ${
        isRTL ? "right" : "left"
      }; padding: 12px; border-radius: 8px; ${
    role === "user"
      ? "background: #000; color: #fff;"
      : "background: #f0f0f0; color: #333;"
  }">
        ${
          role === "user"
            ? `<strong>You:</strong><br>${content}`
            : `<strong>Assistant:</strong><br>${formattedContent}`
        }
      </div>
    </div>
  `;

  /* Append the new message to the chat window */
  chatWindow.innerHTML += messageHTML;

  /* Scroll to the bottom of the chat window */
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Chat form submission handler - sends follow-up questions */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  /* Get the user's message */
  const message = userInput.value.trim();

  /* Don't send empty messages */
  if (!message) return;

  /* Clear the input field */
  userInput.value = "";

  /* Display the user's message */
  displayMessage("user", message);

  /* Add user message to conversation history */
  conversationHistory.push({
    role: "user",
    content: message,
  });

  /* Show loading indicator */
  const loadingHTML = `
    <div id="loading-indicator" style="margin-bottom: 15px;">
      <div style="display: inline-block; padding: 12px; border-radius: 8px; background: #f0f0f0; color: #666;">
        <i class="fa-solid fa-spinner fa-spin"></i> Thinking...
      </div>
    </div>
  `;
  chatWindow.innerHTML += loadingHTML;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    /* Make API request to Cloudflare Worker with full conversation history */
    const response = await fetch(OPENAI_API_KEY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: conversationHistory,
      }),
    });

    /* Remove loading indicator */
    const loadingElement = document.getElementById("loading-indicator");
    if (loadingElement) {
      loadingElement.remove();
    }

    /* Check if the request was successful */
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    /* Parse the response */
    const data = await response.json();

    /* Extract the AI's response */
    const assistantMessage = data.choices[0].message.content;

    /* Add assistant's response to conversation history */
    conversationHistory.push({
      role: "assistant",
      content: assistantMessage,
    });

    /* Display the assistant's response */
    displayMessage("assistant", assistantMessage);
  } catch (error) {
    /* Remove loading indicator */
    const loadingElement = document.getElementById("loading-indicator");
    if (loadingElement) {
      loadingElement.remove();
    }

    /* Display error message */
    console.error("Error sending message:", error);
    const errorHTML = `
      <div style="margin-bottom: 15px;">
        <div style="display: inline-block; padding: 12px; border-radius: 8px; background: #ffebee; color: #d32f2f;">
          <i class="fa-solid fa-exclamation-circle"></i> 
          Sorry, there was an error. Please try again.
        </div>
      </div>
    `;
    chatWindow.innerHTML += errorHTML;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});
