
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const taskFooterText = document.getElementById("taskFooterText");
const clearCompletedButton = document.getElementById("clearCompleted");
const filterButtons = document.querySelectorAll(".filter-btn");

const habitCheckboxes = document.querySelectorAll(".habit-check");
const habitCount = document.getElementById("habitCount");
const habitMessage = document.getElementById("habitMessage");

const notesInput = document.getElementById("notesInput");
const notesStatus = document.getElementById("notesStatus");
const characterCount = document.getElementById("characterCount");

const progressPercent = document.getElementById("progressPercent");
const progressFill = document.getElementById("progressFill");

const mobileMenu = document.getElementById("mobileMenu");
const navLinks = document.getElementById("navLinks");
const navItems = document.querySelectorAll(".nav-link");

let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
    try {
        const saved = JSON.parse(localStorage.getItem("nudenote_tasks"));
        return Array.isArray(saved)
            ? saved.filter(task =>
                task &&
                typeof task.id === "string" &&
                typeof task.title === "string" &&
                typeof task.completed === "boolean"
            )
            : [];
    } catch {
        return [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem("nudenote_tasks", JSON.stringify(tasks));
    } catch {
        taskFooterText.textContent = "Unable to save tasks on this device.";
    }
}

function getTodayKey() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function loadHabits() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(`nudenote_habits_${getTodayKey()}`)
        );

        return saved && typeof saved === "object" ? saved : {};
    } catch {
        return {};
    }
}

function saveHabits() {
    const habits = {};

    habitCheckboxes.forEach(checkbox => {
        habits[checkbox.value] = checkbox.checked;
    });

    try {
        localStorage.setItem(
            `nudenote_habits_${getTodayKey()}`,
            JSON.stringify(habits)
        );
    } catch {
        habitMessage.textContent = "Unable to save habits on this device.";
    }
}

function updateDate() {
    const today = new Date();

    const dateElement = document.getElementById("year");
    dateElement.textContent = today.getFullYear();
}

function renderTasks() {
    taskList.replaceChildren();

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === "pending") return !task.completed;
        if (currentFilter === "completed") return task.completed;
        return true;
    });

    if (filteredTasks.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";

        const icon = document.createElement("span");
        icon.textContent = "✿";

        const message = document.createElement("p");
        const detail = document.createElement("small");

        if (currentFilter === "completed") {
            message.textContent = "No completed tasks yet.";
            detail.textContent = "Finished tasks will appear here.";
        } else if (currentFilter === "pending") {
            message.textContent = "You're all caught up!";
            detail.textContent = "There are no pending tasks.";
        } else {
            message.textContent = "Your list is a blank page.";
            detail.textContent = "Add one small task to get started.";
        }

        emptyState.append(icon, message, detail);
        taskList.appendChild(emptyState);
    }

    filteredTasks.forEach(task => {
        const item = document.createElement("div");
        item.className = "task-item";

        if (task.completed) {
            item.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", `Complete ${task.title}`);

        checkbox.addEventListener("change", () => {
            task.completed = checkbox.checked;
            saveTasks();
            renderTasks();
            updateProgress();
        });

        const title = document.createElement("span");
        title.className = "task-title";
        title.textContent = task.title;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-task";
        deleteButton.textContent = "×";
        deleteButton.setAttribute("aria-label", `Delete ${task.title}`);

        deleteButton.addEventListener("click", () => {
            tasks = tasks.filter(entry => entry.id !== task.id);
            saveTasks();
            renderTasks();
            updateProgress();
        });

        item.append(checkbox, title, deleteButton);
        taskList.appendChild(item);
    });

    const completed = tasks.filter(task => task.completed).length;

    taskCount.replaceChildren();

    const completedText = document.createElement("span");
    completedText.textContent = String(completed);

    const totalText = document.createElement("span");
    totalText.textContent = ` / ${tasks.length}`;

    taskCount.append(completedText, totalText);

    const remaining = tasks.length - completed;

    taskFooterText.textContent = tasks.length === 0
        ? "A fresh start awaits."
        : remaining === 0
            ? "Wonderful! All tasks are complete."
            : `${remaining} task${remaining === 1 ? "" : "s"} left to go.`;
}

taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = taskInput.value.trim();

    if (!title) {
        taskInput.focus();
        return;
    }

    tasks.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title,
        completed: false
    });

    saveTasks();
    taskInput.value = "";
    currentFilter = "all";

    filterButtons.forEach(button => {
        button.classList.toggle("active", button.dataset.filter === "all");
    });

    renderTasks();
    updateProgress();
    taskInput.focus();
});

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        filterButtons.forEach(item => {
            item.classList.toggle("active", item === button);
        });

        renderTasks();
    });
});

clearCompletedButton.addEventListener("click", () => {
    tasks = tasks.filter(task => !task.completed);

    saveTasks();
    renderTasks();
    updateProgress();
});

function initialiseHabits() {
    const savedHabits = loadHabits();

    habitCheckboxes.forEach(checkbox => {
        checkbox.checked = savedHabits[checkbox.value] === true;

        checkbox.addEventListener("change", () => {
            saveHabits();
            updateProgress();
        });
    });
}

function updateProgress() {
    const completedTasks = tasks.filter(task => task.completed).length;
    const completedHabits = Array.from(habitCheckboxes)
        .filter(checkbox => checkbox.checked).length;

    const totalHabits = habitCheckboxes.length;

    habitCount.replaceChildren();

    const completedText = document.createElement("span");
    completedText.textContent = String(completedHabits);

    const totalText = document.createElement("span");
    totalText.textContent = ` / ${totalHabits}`;

    habitCount.append(completedText, totalText);

    if (completedHabits === totalHabits) {
        habitMessage.textContent = "Beautiful! You've completed every habit.";
    } else if (completedHabits > 0) {
        habitMessage.textContent = "Every little effort matters. Keep going!";
    } else {
        habitMessage.textContent = "Every little effort matters.";
    }

    const totalItems = tasks.length + totalHabits;
    const completedItems = completedTasks + completedHabits;

    const percentage = totalItems === 0
        ? 0
        : Math.round((completedItems / totalItems) * 100);

    progressPercent.textContent = `${percentage}%`;
    progressFill.style.width = `${percentage}%`;
    progressFill.setAttribute("aria-valuenow", String(percentage));
}

function initialiseNotes() {
    try {
        notesInput.value = localStorage.getItem("nudenote_notes") || "";
    } catch {
        notesStatus.textContent = "Notes could not be loaded.";
    }

    updateCharacterCount();
}

function updateCharacterCount() {
    characterCount.textContent = `${notesInput.value.length} / 3000`;
}

notesInput.addEventListener("input", () => {
    updateCharacterCount();

    try {
        localStorage.setItem("nudenote_notes", notesInput.value);
        notesStatus.textContent = "Saved on this device";
    } catch {
        notesStatus.textContent = "Unable to save notes";
    }
});

function closeMobileMenu() {
    navLinks.classList.remove("open");
    mobileMenu.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-label", "Open navigation");
}

mobileMenu.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");

    mobileMenu.setAttribute("aria-expanded", String(isOpen));
    mobileMenu.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
    );
});

navItems.forEach(link => {
    link.addEventListener("click", () => {
        navItems.forEach(item => {
            item.classList.toggle("active", item === link);
        });

        closeMobileMenu();
    });
});

document.addEventListener("click", event => {
    if (
        navLinks.classList.contains("open") &&
        !navLinks.contains(event.target) &&
        !mobileMenu.contains(event.target)
    ) {
        closeMobileMenu();
    }
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 700) {
        closeMobileMenu();
    }
});

function initialiseScrollAnimations() {
    const elements = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
        elements.forEach(element => element.classList.add("visible"));
        return;
    }

    const observer = new IntersectionObserver((entries, activeObserver) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                activeObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12
    });

    elements.forEach(element => observer.observe(element));
}

updateDate();
renderTasks();
initialiseHabits();
initialiseNotes();
updateProgress();
initialiseScrollAnimations();
