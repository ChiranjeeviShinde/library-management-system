const STORAGE_KEY = "library-management-system-books";

const DEFAULT_BOOKS = [
  { id: 101, title: "The Pragmatic Programmer", author: "Andrew Hunt", status: "Available", issuedToRegNo: -1 },
  { id: 102, title: "Clean Code", author: "Robert C. Martin", status: "Issued", issuedToRegNo: 22017 },
  { id: 103, title: "Design Patterns", author: "Erich Gamma", status: "Available", issuedToRegNo: -1 }
];

class LibraryApp {
  constructor(initialBooks = []) {
    this.books = initialBooks;
  }

  addBook(id, title, author) {
    if (this.books.some((book) => book.id === id)) {
      return { ok: false, message: "Duplicate Book ID not allowed." };
    }

    this.books.unshift({
      id,
      title: title.trim(),
      author: author.trim(),
      status: "Available",
      issuedToRegNo: -1
    });

    return { ok: true, message: "Book added to the library." };
  }

  issueBook(id, regNo) {
    const book = this.books.find((entry) => entry.id === id);
    if (!book) {
      return { ok: false, message: "Book not found." };
    }

    if (book.status !== "Available") {
      return { ok: false, message: "Book is already issued." };
    }

    book.status = "Issued";
    book.issuedToRegNo = regNo;
    return { ok: true, message: `Book issued to registration #${regNo}.` };
  }

  returnBook(id) {
    const book = this.books.find((entry) => entry.id === id);
    if (!book) {
      return { ok: false, message: "Book not found." };
    }

    if (book.status !== "Issued") {
      return { ok: false, message: "This book is not currently issued." };
    }

    book.status = "Available";
    book.issuedToRegNo = -1;
    return { ok: true, message: "Book returned successfully." };
  }

  removeBook(id) {
    const index = this.books.findIndex((entry) => entry.id === id);
    if (index === -1) {
      return { ok: false, message: "Book not found." };
    }

    const [removed] = this.books.splice(index, 1);
    return { ok: true, message: `"${removed.title}" was removed from the library.` };
  }

  search(key) {
    const query = key.trim().toLowerCase();
    if (!query) {
      return [...this.books];
    }

    return this.books.filter((book) => {
      return String(book.id) === query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query);
    });
  }

  countStatus() {
    const available = this.books.filter((book) => book.status === "Available").length;
    const issued = this.books.length - available;
    return {
      total: this.books.length,
      available,
      issued
    };
  }
}

const state = {
  wasmLoaded: false,
  library: new LibraryApp(loadBooks()),
  search: "",
  filter: "all"
};

const elements = {
  totalCount: document.getElementById("totalCount"),
  availableCount: document.getElementById("availableCount"),
  issuedCount: document.getElementById("issuedCount"),
  addBookForm: document.getElementById("addBookForm"),
  issueBookForm: document.getElementById("issueBookForm"),
  returnBookForm: document.getElementById("returnBookForm"),
  searchInput: document.getElementById("searchInput"),
  filterSelect: document.getElementById("filterSelect"),
  bookList: document.getElementById("bookList"),
  toast: document.getElementById("toast")
};

function loadBooks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BOOKS));
    return [...DEFAULT_BOOKS];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn("Could not parse saved library data.", error);
  }

  return [...DEFAULT_BOOKS];
}

function saveBooks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.library.books));
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2200);
}

function getVisibleBooks() {
  let books = state.library.search(state.search);

  if (state.filter === "available") {
    books = books.filter((book) => book.status === "Available");
  }

  if (state.filter === "issued") {
    books = books.filter((book) => book.status === "Issued");
  }

  return books;
}

function renderStats() {
  const { total, available, issued } = state.library.countStatus();
  elements.totalCount.textContent = total;
  elements.availableCount.textContent = available;
  elements.issuedCount.textContent = issued;
}

function renderBooks() {
  const books = getVisibleBooks();

  if (!books.length) {
    elements.bookList.innerHTML = `
      <div class="empty">
        <strong>No books found.</strong>
        <p>Try a different search term or add a new title to the collection.</p>
      </div>
    `;
    return;
  }

  elements.bookList.innerHTML = books.map((book) => {
    const isIssued = book.status === "Issued";
    const statusClass = isIssued ? "pill issued" : "pill";
    const issuedLine = isIssued
      ? `<div class="meta">Issued to registration no. <strong>${book.issuedToRegNo}</strong></div>`
      : `<div class="meta">Ready to issue</div>`;

    return `
      <article class="book">
        <div class="book-top">
          <div>
            <p class="${statusClass}">${book.status}</p>
            <h3 class="book-title">${escapeHtml(book.title)}</h3>
            <div class="book-id-chip">Book ID ${book.id}</div>
          </div>
          <div class="shelf-mark">${isIssued ? "On Loan" : "In Stack"}</div>
        </div>
        <div class="meta">Author: ${escapeHtml(book.author)}</div>
        ${issuedLine}
        <div class="book-actions">
          ${isIssued
            ? `<button type="button" data-action="return" data-id="${book.id}" class="secondary">Return Book</button>`
            : `<button type="button" data-action="issue" data-id="${book.id}">Quick Issue</button>`}
          <button type="button" data-action="remove" data-id="${book.id}" class="danger">Remove</button>
        </div>
      </article>
    `;
  }).join("");
}

function render() {
  renderStats();
  renderBooks();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function bindEvents() {
  elements.addBookForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = state.library.addBook(
      Number(form.get("bookId")),
      String(form.get("bookTitle")),
      String(form.get("bookAuthor"))
    );
    if (result.ok) {
      saveBooks();
      event.currentTarget.reset();
      render();
    }
    showToast(result.message);
  });

  elements.issueBookForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = state.library.issueBook(
      Number(form.get("issueBookId")),
      Number(form.get("issueRegNo"))
    );
    if (result.ok) {
      saveBooks();
      event.currentTarget.reset();
      render();
    }
    showToast(result.message);
  });

  elements.returnBookForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = state.library.returnBook(Number(form.get("returnBookId")));
    if (result.ok) {
      saveBooks();
      event.currentTarget.reset();
      render();
    }
    showToast(result.message);
  });

  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderBooks();
  });

  elements.filterSelect.addEventListener("change", (event) => {
    state.filter = event.target.value;
    renderBooks();
  });

  elements.bookList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "issue") {
      const regNo = Number(window.prompt("Enter student registration number:"));
      if (!Number.isFinite(regNo) || regNo <= 0) {
        showToast("A valid registration number is required.");
        return;
      }

      const result = state.library.issueBook(id, regNo);
      if (result.ok) {
        saveBooks();
        render();
      }
      showToast(result.message);
    }

    if (action === "return") {
      const result = state.library.returnBook(id);
      if (result.ok) {
        saveBooks();
        render();
      }
      showToast(result.message);
    }

    if (action === "remove") {
      const confirmed = window.confirm("Remove this book from the library?");
      if (!confirmed) {
        return;
      }

      const result = state.library.removeBook(id);
      if (result.ok) {
        saveBooks();
        render();
      }
      showToast(result.message);
    }
  });
}

async function loadWasm() {
  try {
    const response = await fetch("./index.wasm");
    const bytes = await response.arrayBuffer();
    await WebAssembly.instantiate(bytes, {});
    state.wasmLoaded = true;
    console.info("WebAssembly module loaded.");
  } catch (error) {
    console.warn("WebAssembly module could not be loaded. Running UI logic in JavaScript.", error);
  }
}

bindEvents();
render();
loadWasm();
