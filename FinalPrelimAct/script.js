// ================================
// SUPABASE CONFIGURATION
// ================================

const SUPABASE_URL = "https://wpoyxeypjvnpibnlynbv.supabase.co";
const SUPABASE_KEY = "sb_publishable_AOnzONrCNnHItO5ymT5f-Q_LNF1kHLl";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ================================
// VARIABLES
// ================================

let editingItemId = null;


// ================================
// MODAL NOTIFICATION SYSTEM
// ================================

const modalOverlay = document.getElementById("modalOverlay");
const modalIcon = document.getElementById("modalIcon");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalButtons = document.getElementById("modalButtons");

function showNotification(title, message, type = "info") {
    // Icon mapping
    const icons = {
        success: "✓",
        error: "✕",
        info: "ℹ",
        warning: "⚠"
    };

    // Update modal content
    modalIcon.textContent = icons[type] || "ℹ";
    modalIcon.className = `modal-icon ${type}`;
    modalTitle.textContent = title;
    modalMessage.textContent = message;

    // Single button for notifications
    modalButtons.innerHTML = `<button class="modal-button primary" onclick="closeModal()">OK</button>`;

    // Show modal
    modalOverlay.classList.add("show");
}

function showConfirm(title, message, onConfirm) {
    // Update modal content
    modalIcon.textContent = "?";
    modalIcon.className = "modal-icon warning";
    modalTitle.textContent = title;
    modalMessage.textContent = message;

    // Two buttons for confirmation
    modalButtons.innerHTML = `
        <button class="modal-button secondary" onclick="closeModal()">Cancel</button>
        <button class="modal-button primary" onclick="confirmAction()">Confirm</button>
    `;

    // Store the callback
    window.confirmCallback = onConfirm;

    // Show modal
    modalOverlay.classList.add("show");
}

function confirmAction() {
    if (window.confirmCallback) {
        window.confirmCallback();
    }
    closeModal();
}

function closeModal() {
    modalOverlay.classList.remove("show");
    window.confirmCallback = null;
}


// ================================
// HTML ELEMENTS
// ================================

const itemForm = document.getElementById("item-form");

const itemNameInput = document.getElementById("item-name");
const categoryInput = document.getElementById("category");
const priceInput = document.getElementById("price");
const stockInput = document.getElementById("stock");
const supplierInput = document.getElementById("supplier");

const inventoryBody = document.getElementById("inventory-body");

const saveButton = document.getElementById("save-btn");
const cancelButton = document.getElementById("cancel-btn");

const formTitle = document.getElementById("form-title");

const searchInput = document.getElementById("search-input");


// ================================
// LOAD PRODUCTS
// ================================

async function loadItems() {

    const { data, error } = await supabaseClient
        .from("kitchen_items")
        .select("*")
        .order("item_id", { ascending: true });


    if (error) {

        console.error("Error loading items:", error);

        showNotification("Error", "Unable to load kitchen items.", "error");

        return;
    }


    displayItems(data);
}


// ================================
// DISPLAY PRODUCTS
// ================================

function displayItems(items) {

    inventoryBody.innerHTML = "";


    if (items.length === 0) {

        inventoryBody.innerHTML = `
            <tr>
                <td colspan="7">
                    No kitchen items found.
                </td>
            </tr>
        `;

        return;
    }


    items.forEach(item => {

        const row = document.createElement("tr");


        row.innerHTML = `

            <td>${item.item_id}</td>

            <td>${item.item_name}</td>

            <td>${item.category}</td>

            <td>₱${Number(item.price).toFixed(2)}</td>

            <td>${item.stock_quantity}</td>

            <td>${item.supplier}</td>

            <td>

                <button
                    class="action-btn edit-btn"
                    onclick="editItem(${item.item_id})"
                >
                    Edit
                </button>

                <button
                    class="action-btn delete-btn"
                    onclick="deleteItem(${item.item_id})"
                >
                    Delete
                </button>

            </td>

        `;


        inventoryBody.appendChild(row);

    });
}


// ================================
// INITIAL LOAD
// ================================

loadItems();


// ================================
// CREATE / UPDATE ITEM
// ================================

itemForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const itemName = itemNameInput.value.trim();
    const category = categoryInput.value;
    const price = Number(priceInput.value);
    const stock = Number(stockInput.value);
    const supplier = supplierInput.value.trim();


    // ================================
    // BASIC VALIDATION
    // ================================

    if (itemName === "") {

        showNotification("Validation Error", "Please enter an item name.", "warning");

        itemNameInput.focus();

        return;
    }


    if (category === "") {

        showNotification("Validation Error", "Please select a category.", "warning");

        categoryInput.focus();

        return;
    }


    if (isNaN(price)) {


        showNotification("Validation Error", "Please enter a valid price.", "warning");

        priceInput.focus();

        return;
    }


    if (isNaN(stock)) {

        showNotification("Validation Error", "Stock quantity cannot be negative.", "warning");

        stockInput.focus();

        return;
    }


    if (supplier === "") {

        showNotification("Validation Error", "Please enter a supplier.", "warning");

        supplierInput.focus();

        return;
    }


    let error;


    // ================================
    // UPDATE EXISTING ITEM
    // ================================

    if (editingItemId !== null) {

        const result = await supabaseClient
            .from("kitchen_items")
            .update({
                item_name: itemName,
                category: category,
                stock_quantity: stock,
                supplier: supplier
            })
            .eq("item_id", editingItemId);


        error = result.error;


        if (!error) {

            showNotification("Success", "Kitchen item updated successfully!", "success");

        }

    }


    // ================================
    // CREATE NEW ITEM
    // ================================

    else {

        const result = await supabaseClient
            .from("kitchen_items")
            .insert([
                {
                    item_name: itemName,
                    category: category,
                    price: price,
                    stock_quantity: stock,
                    supplier: supplier
                }
            ]);


        error = result.error;


        if (!error) {

            showNotification("Success", "Kitchen item added successfully!", "success");

        }

    }


    // ================================
    // ERROR HANDLING
    // ================================

    if (error) {

        console.error("Database error:", error);

        showNotification("Error", "Failed to save the kitchen item.", "error");

        return;
    }


    // ================================
    // RESET FORM
    // ================================

    resetForm();


    // ================================
    // RELOAD INVENTORY
    // ================================

    loadItems();

});


// ================================
// UPDATE - LOAD ITEM FOR EDITING
// ================================

async function editItem(id) {

    const { data, error } = await supabaseClient
        .from("kitchen_items")
        .select("*")
        .eq("item_id", id)
        .single();


    if (error) {

        console.error("Error getting item:", error);

        showNotification("Error", "Unable to load the kitchen item.", "error");

        return;
    }


    // ================================
    // PUT EXISTING VALUES INTO FORM
    // ================================

    itemNameInput.value = data.item_name;

    categoryInput.value = data.category;

    priceInput.value = data.price;

    stockInput.value = data.stock_quantity;

    supplierInput.value = data.supplier;


    // ================================
    // REMEMBER ITEM BEING EDITED
    // ================================

    editingItemId = id;


    // ================================
    // CHANGE FORM APPEARANCE
    // ================================

    formTitle.textContent = "Edit Kitchen Item";

    saveButton.textContent = "Update Item";

    cancelButton.style.display = "inline-block";


    // ================================
    // SCROLL TO FORM
    // ================================

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ================================
// RESET FORM
// ================================

function resetForm() {

    itemForm.reset();

    editingItemId = null;

    formTitle.textContent = "Add Kitchen Item";

    saveButton.textContent = "Add Item";

    cancelButton.style.display = "none";

}


// ================================
// CANCEL EDIT
// ================================

cancelButton.addEventListener("click", function () {

    resetForm();

});


// ================================
// DELETE ITEM
// ================================

async function deleteItem(id) {

    // ================================
    // GET ITEM NAME
    // ================================

    const { data, error: fetchError } = await supabaseClient
        .from("kitchen_items")
        .select("item_name")
        .eq("item_id", id)
        .single();


    if (fetchError) {

        console.error("Error finding item:", fetchError);

        showNotification("Error", "Unable to find the kitchen item.", "error");

        return;
    }


    // ================================
    // CONFIRM DELETE
    // ================================

    showConfirm(
        "Confirm Delete",
        `Are you sure you want to delete "${data.item_name}"?`,
        () => proceedWithDelete(id)
    );

}

// ================================
// PROCEED WITH DELETE
// ================================

async function proceedWithDelete(id) {


    // ================================
    // DELETE FROM SUPABASE
    // ================================

    const { error } = await supabaseClient
        .from("kitchen_items")
        .delete()
        .eq("item_id", id)
        .gt("stock_quantity", 0);


    if (error) {

        console.error("Error deleting item:", error);

        showNotification("Error", "Failed to delete the kitchen item.", "error");

        return;
    }


    showNotification("Success", "Kitchen item deleted successfully!", "success");


    // ================================
    // RELOAD INVENTORY
    // ================================

    loadItems();

}


// ================================
// SEARCH ITEMS
// ================================

searchInput.addEventListener("input", async function () {

    const searchTerm = searchInput.value.trim();


    // ================================
    // SHOW ALL ITEMS
    // ================================

    if (searchTerm === "") {

        loadItems();

        return;

    }


    // ================================
    // SEARCH DATABASE
    // ================================

    const { data, error } = await supabaseClient
        .from("kitchen_items")
        .select("*")
        .or(
            `item_name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,supplier.ilike.%${searchTerm}%`
        )
        .order("item_id", { ascending: true });


    if (error) {

        console.error("Search error:", error);

        showNotification("Error", "Unable to search kitchen items.", "error");

        return;
    }


    displayItems(data);

});


// ================================
// CLOSE MODAL ON OVERLAY CLICK
// ================================

modalOverlay.addEventListener("click", function (event) {
    if (event.target === modalOverlay) {
        closeModal();
    }
});