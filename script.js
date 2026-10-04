const API_URL = "http://127.0.0.1:5000";

function showNotification(message) {
  const notification = document.getElementById("notification");

  if (!notification) return;

  notification.textContent = message;
  notification.classList.add("show");

  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);

  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
    });
  }
}

/* =========================
   SEARCH DESTINATION
========================= */

async function searchDestination() {
  const input = document.getElementById("destinationInput");
  const resultBox = document.getElementById("searchResult");

  if (!input || !resultBox) return;

  const searchText = input.value.trim();

  if (searchText === "") {
    resultBox.innerHTML = `
            <div class="no-result">
                Please enter a destination.
            </div>
        `;
    return;
  }

  resultBox.innerHTML = `
        <div class="no-result">
            🔍 Searching for
            <strong>${searchText}</strong>...
        </div>
    `;

  try {
    const response = await fetch(
      `${API_URL}/api/search?q=${encodeURIComponent(searchText)}`,
    );

    if (!response.ok) {
      throw new Error("Server error");
    }

    const data = await response.json();

    if (!data.success || !data.results || data.results.length === 0) {
      resultBox.innerHTML = `
                <div class="no-result">
                    ❌ No destination found for
                    <strong>${searchText}</strong>.
                    <br><br>
                    Try:
                    <strong>
                        Pharmacy, Emergency, Laboratory,
                        Cardiology, Radiology or Reception.
                    </strong>
                </div>
            `;

      return;
    }

    resultBox.innerHTML = "";

    data.results.forEach((destination) => {
      const card = document.createElement("div");

      card.className = "search-card";

      card.innerHTML = `
                <div class="search-card-header">

                    <div class="search-card-icon">
                        ${destination.icon || "📍"}
                    </div>

                    <div>
                        <h3>
                            ${destination.name}
                        </h3>

                        <p>
                            ${destination.category}
                        </p>
                    </div>

                </div>

                <div class="search-card-details">

                    <span class="detail-tag">
                        🏢 ${destination.floor}
                    </span>

                    <span class="detail-tag">
                        🚪 ${destination.room}
                    </span>

                </div>

                <p style="margin-top:12px;">
                    ${destination.description || ""}
                </p>

                <button
                    class="navigate-btn"
                    type="button"
                >
                    🧭 Navigate Here
                </button>
            `;

      const navigateButton = card.querySelector(".navigate-btn");

      if (navigateButton) {
        navigateButton.addEventListener("click", () => {
          startNavigation(destination);
        });
      }

      resultBox.appendChild(card);
    });
  } catch (error) {
    console.error("HospitalWay Search Error:", error);

    resultBox.innerHTML = `
            <div class="no-result">
                ⚠️ Unable to connect to
                HospitalWay server.
                <br><br>
                Please make sure the Flask backend
                is running on port 5000.
            </div>
        `;
  }
}

/* =========================
   START NAVIGATION
========================= */

function startNavigation(destination = null) {
  if (!destination) {
    const input = document.getElementById("destinationInput");

    if (!input || input.value.trim() === "") {
      showNotification("Please search for a destination first.");

      return;
    }

    searchDestination();

    return;
  }

  const navigationScreen = document.getElementById("navigationScreen");

  if (!navigationScreen) {
    console.error("navigationScreen not found in HTML");

    showNotification("Navigation screen is unavailable.");

    return;
  }

  /* =========================
       BASIC DESTINATION DETAILS
    ========================= */

  const destinationName = document.getElementById("destinationName");

  const destinationLocation = document.getElementById("destinationLocation");

  const navigationTitle = document.getElementById("navigationTitle");

  const navigationDescription = document.getElementById(
    "navigationDescription",
  );

  const routeDestination = document.getElementById("routeDestination");

  const routeInstruction = document.getElementById("routeInstruction");

  const walkingTime = document.getElementById("walkingTime");

  if (destinationName) {
    destinationName.textContent = destination.name;
  }

  if (destinationLocation) {
    destinationLocation.textContent = `${destination.floor} • ${destination.room}`;
  }

  if (navigationTitle) {
    navigationTitle.textContent = `Navigate to ${destination.name}`;
  }

  if (navigationDescription) {
    navigationDescription.textContent =
      destination.description ||
      "Follow the route below to reach your destination.";
  }

  if (routeDestination) {
    routeDestination.textContent = destination.name;
  }

  /* =========================
       FLOOR INTELLIGENCE
    ========================= */

  const floor = (destination.floor || "").toLowerCase();

  let navigationTime = "2 min";

  let routeMessage = `Continue towards ${destination.name}.`;

  let floorNumber = "Ground Floor";

  let liftRequired = false;

  /* GROUND FLOOR */

  if (floor.includes("ground")) {
    navigationTime = "2 min";

    floorNumber = "Ground Floor";

    liftRequired = false;

    routeMessage = `Main Entrance → Reception → ${destination.name}`;
  } else if (floor.includes("first")) {
    /* FIRST FLOOR */
    navigationTime = "4 min";

    floorNumber = "First Floor";

    liftRequired = true;

    routeMessage = `Main Entrance → Reception → Lift → First Floor → ${destination.name}`;
  } else if (floor.includes("second")) {
    /* SECOND FLOOR */
    navigationTime = "5 min";

    floorNumber = "Second Floor";

    liftRequired = true;

    routeMessage = `Main Entrance → Reception → Lift → Second Floor → ${destination.name}`;
  } else if (floor.includes("third")) {
    /* THIRD FLOOR */
    navigationTime = "6 min";

    floorNumber = "Third Floor";

    liftRequired = true;

    routeMessage = `Main Entrance → Reception → Lift → Third Floor → ${destination.name}`;
  }

  if (routeInstruction) {
    if (destination.route) {
      routeInstruction.textContent = destination.route;
    } else {
      routeInstruction.textContent = routeMessage;
    }
  }

  if (walkingTime) {
    walkingTime.textContent = navigationTime;
  }

  /* =========================
       UPDATE SMART MAP
    ========================= */

  updateSmartHospitalMap(destination, floorNumber, liftRequired);

  /* =========================
       UPDATE ROUTE STEPS
    ========================= */

  updateRouteMap(destination);

  /* =========================
       HIDE MAIN PAGE
    ========================= */

  const hero = document.querySelector(".hero");

  const howSection = document.querySelector(".how-section");

  const servicesSection = document.querySelector(".services-section");

  const accessibilitySection = document.querySelector(".accessibility-section");

  const lostSection = document.querySelector(".lost-section");

  if (hero) {
    hero.style.display = "none";
  }

  if (howSection) {
    howSection.style.display = "none";
  }

  if (servicesSection) {
    servicesSection.style.display = "none";
  }

  if (accessibilitySection) {
    accessibilitySection.style.display = "none";
  }

  if (lostSection) {
    lostSection.style.display = "none";
  }

  navigationScreen.style.display = "block";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  showNotification(`🧭 Navigation started for ${destination.name}`);
}

/* =========================
   SMART HOSPITAL MAP
========================= */

function updateSmartHospitalMap(destination, floorNumber, liftRequired) {
  const mapFloor = document.getElementById("mapFloor");

  const mapDestinationName = document.getElementById("mapDestinationName");

  const mapDestinationRoom = document.getElementById("mapDestinationRoom");

  const mapLift = document.getElementById("mapLift");

  const mapLiftText = document.getElementById("mapLiftText");

  const mapReception = document.getElementById("mapReception");

  const mapDestination = document.getElementById("mapDestination");

  const mapStart = document.getElementById("mapStart");

  /* FLOOR LABEL */

  if (mapFloor) {
    mapFloor.textContent = `📍 ${floorNumber}`;
  }

  /* DESTINATION NAME */

  if (mapDestinationName) {
    mapDestinationName.textContent = destination.name;
  }

  /* DESTINATION ROOM */

  if (mapDestinationRoom) {
    mapDestinationRoom.textContent = destination.room;
  }

  /* START NODE */

  if (mapStart) {
    mapStart.classList.remove("active");

    setTimeout(() => {
      mapStart.classList.add("active");
    }, 200);
  }

  /* RECEPTION NODE */

  if (mapReception) {
    mapReception.classList.remove("active");

    setTimeout(() => {
      mapReception.classList.add("active");
    }, 700);
  }

  /* LIFT NODE */

  if (mapLift) {
    mapLift.classList.remove("active");

    if (liftRequired) {
      mapLift.style.opacity = "1";

      setTimeout(() => {
        mapLift.classList.add("active");
      }, 1100);
    } else {
      mapLift.style.opacity = "0.45";
    }
  }

  /* LIFT TEXT */

  if (mapLiftText) {
    if (liftRequired) {
      mapLiftText.textContent = `Take Lift → ${floorNumber}`;
    } else {
      mapLiftText.textContent = "Lift not required";
    }
  }

  /* DESTINATION NODE */

  if (mapDestination) {
    mapDestination.classList.remove("active");

    setTimeout(
      () => {
        mapDestination.classList.add("active");
      },
      liftRequired ? 1800 : 1200,
    );
  }
}

/* =========================
   ROUTE STEPS
========================= */

function updateRouteMap(destination) {
  try {
    const routeSteps = document.querySelectorAll(".route-step");

    if (!routeSteps || routeSteps.length === 0) {
      console.log("Route steps not found.");

      return;
    }

    const floor = (destination.floor || "").toLowerCase();

    /* STEP 1 */

    updateRouteStep(routeSteps[0], "Main Entrance", "Start here");

    /* STEP 2 */

    if (
      floor.includes("first") ||
      floor.includes("second") ||
      floor.includes("third")
    ) {
      updateRouteStep(routeSteps[1], "Lift", `Go to ${destination.floor}`);
    } else {
      updateRouteStep(routeSteps[1], "Reception", "Follow hospital signs");
    }

    /* STEP 3 */

    updateRouteStep(routeSteps[2], destination.name, destination.floor);

    /* STEP 4 */

    updateRouteStep(routeSteps[3], "Arrive", destination.room);

    /* RESET ANIMATIONS */

    routeSteps.forEach((step) => {
      step.classList.remove("active", "arrival");
    });

    /* ANIMATE ROUTE */

    setTimeout(() => {
      if (routeSteps[0]) {
        routeSteps[0].classList.add("active");
      }
    }, 300);

    setTimeout(() => {
      if (routeSteps[1]) {
        routeSteps[1].classList.add("active");
      }
    }, 900);

    setTimeout(() => {
      if (routeSteps[2]) {
        routeSteps[2].classList.add("active");
      }
    }, 1500);

    setTimeout(() => {
      if (routeSteps[3]) {
        routeSteps[3].classList.add("arrival");
      }
    }, 2100);
  } catch (error) {
    console.error("Route map error:", error);
  }
}

function updateRouteStep(step, title, subtitle) {
  if (!step) return;

  const titleElement = step.querySelector(".route-title");

  const subtitleElement = step.querySelector(".route-subtitle");

  if (titleElement) {
    titleElement.textContent = title;
  }

  if (subtitleElement) {
    subtitleElement.textContent = subtitle;
  }
}

/* =========================
   CLOSE NAVIGATION
========================= */

function closeNavigation() {
  const navigationScreen = document.getElementById("navigationScreen");

  if (!navigationScreen) return;

  navigationScreen.style.display = "none";

  const hero = document.querySelector(".hero");

  const howSection = document.querySelector(".how-section");

  const servicesSection = document.querySelector(".services-section");

  const accessibilitySection = document.querySelector(".accessibility-section");

  const lostSection = document.querySelector(".lost-section");

  if (hero) {
    hero.style.display = "";
  }

  if (howSection) {
    howSection.style.display = "";
  }

  if (servicesSection) {
    servicesSection.style.display = "";
  }

  if (accessibilitySection) {
    accessibilitySection.style.display = "";
  }

  if (lostSection) {
    lostSection.style.display = "";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/* =========================
   ARRIVAL
========================= */

function showArrival() {
  showNotification("🎉 You have reached your destination!");
}

/* =========================
   EMERGENCY
========================= */

async function showEmergency() {
  const input = document.getElementById("destinationInput");

  if (!input) return;

  input.value = "Emergency";

  await searchDestination();

  showNotification("🚨 Emergency Department selected.");
}

/* =========================
   SERVICE SEARCH
========================= */

async function searchService(serviceName) {
  const input = document.getElementById("destinationInput");

  if (!input) return;

  input.value = serviceName;

  await searchDestination();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/* =========================
   ACCESSIBILITY
========================= */

function showAccessibility() {
  showNotification(
    "♿ Accessibility assistance is available at the Main Reception.",
  );
}

/* =========================
   LOST HELP
========================= */

function showLostHelp() {
  showNotification("🧭 Please visit the Main Reception for assistance.");

  scrollToSection("home");
}

/* =========================
   ENTER KEY SEARCH
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("destinationInput");

  if (input) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();

        searchDestination();
      }
    });
  }

  setTimeout(() => {
    showNotification("Welcome to HospitalWay 🏥");
  }, 800);
});
