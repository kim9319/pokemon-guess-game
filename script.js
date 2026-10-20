document.addEventListener("DOMContentLoaded", function () {
  const guess = document.getElementById("input-poke");
  const submit = document.getElementById("submit-button");
  const hintdisplay1 = document.getElementById("hint1");
  const hintdisplay2 = document.getElementById("hint2");
  const hintdisplay3 = document.getElementById("hint3");
  const result = document.getElementById("output-poke");
  const reset = document.getElementById("newgame");

  // Popup & Video elements
  const openBtn = document.getElementById("open-btn");
  const closeBtn = document.getElementById("close-btn");
  const popupOverlay = document.getElementById("popup-overlay");
  const pokeVideo = document.getElementById("poke-video");
  const playVideoBtn = document.getElementById("play-video-btn");
  const pokemonRevealName = document.getElementById("pokemon-reveal-name");

  result.textContent = "";

  let pokemonList = [];
  let pokemon_guess = 0;
  let lastPokemonIndex = -1;
  let ans_poke = "";
  let ans_hint1 = "";
  let ans_hint2 = "";
  let ans_hint3 = "";
  let wrong = 0;
  let timeUpdateListener = null;

  function getRandomIntInclusive(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
  }

  function pickNewPokemon() {
    if (!pokemonList || pokemonList.length === 0) return;

    let nextIndex;
    if (pokemonList.length > 1) {
      do {
        nextIndex = getRandomIntInclusive(0, pokemonList.length - 1);
      } while (nextIndex === lastPokemonIndex);
    } else {
      nextIndex = 0;
    }

    lastPokemonIndex = nextIndex;
    pokemon_guess = nextIndex;
    ans_poke = pokemonList[pokemon_guess].name;
    ans_hint1 = pokemonList[pokemon_guess].hints[0];
    ans_hint2 = pokemonList[pokemon_guess].hints[1];
    ans_hint3 = pokemonList[pokemon_guess].hints[2];

    console.log("Current Pokémon:", ans_poke);
    hintdisplay1.textContent = "Hint: " + ans_hint1;
  }

  async function loadPokemonData() {
    try {
      const response = await fetch("pokemon.json");
      pokemonList = await response.json();
      console.log(`Loaded ${pokemonList.length} Pokémon from json!`);
      pickNewPokemon();
    } catch (error) {
      console.error("Could not load pokemon.json file:", error);
      hintdisplay1.textContent = "Error loading Pokémon data.";
    }
  }

  function showRevealPopup() {
    popupOverlay.classList.add("active");
    if (pokemonRevealName) {
      pokemonRevealName.textContent = "";
      pokemonRevealName.classList.remove("show");
    }

    if (!pokeVideo) return;

    if (playVideoBtn) {
      playVideoBtn.style.display = "none";
    }

    // Safely reset video position
    try {
      if (pokeVideo.readyState >= 1) {
        pokeVideo.currentTime = 0;
      }
    } catch (e) {
      console.warn("Could not set currentTime:", e);
    }

    // Remove existing listener before adding a new one
    if (timeUpdateListener) {
      pokeVideo.removeEventListener("timeupdate", timeUpdateListener);
      timeUpdateListener = null;
    }

    // Update name whenever playback reaches 9 seconds
    timeUpdateListener = function () {
      if (pokeVideo.currentTime >= 9) {
        if (pokemonRevealName && !pokemonRevealName.textContent) {
          pokemonRevealName.textContent = `It's ${ans_poke}!`;
          pokemonRevealName.classList.add("show");
        }
      } else if (pokeVideo.currentTime < 9 && pokemonRevealName) {
        pokemonRevealName.textContent = "";
        pokemonRevealName.classList.remove("show");
      }
    };
    pokeVideo.addEventListener("timeupdate", timeUpdateListener);

    // Try playing
    const playPromise = pokeVideo.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Video playing successfully");
          if (playVideoBtn) playVideoBtn.style.display = "none";
        })
        .catch(function (err) {
          console.warn("Autoplay blocked by browser policy:", err);
          // Show the big play button so the user can start video with sound
          if (playVideoBtn) {
            playVideoBtn.style.display = "block";
          }
        });
    }
  }

  function closePopup() {
    popupOverlay.classList.remove("active");
    if (pokeVideo) {
      pokeVideo.pause();
      try {
        if (pokeVideo.readyState >= 1) {
          pokeVideo.currentTime = 0;
        }
      } catch (e) {}
      if (timeUpdateListener) {
        pokeVideo.removeEventListener("timeupdate", timeUpdateListener);
        timeUpdateListener = null;
      }
    }
    if (pokemonRevealName) {
      pokemonRevealName.textContent = "";
      pokemonRevealName.classList.remove("show");
    }
    if (playVideoBtn) {
      playVideoBtn.style.display = "none";
    }
  }

  // Fallback Play button inside popup
  if (playVideoBtn) {
    playVideoBtn.addEventListener("click", function () {
      playVideoBtn.style.display = "none";
      if (pokeVideo) {
        pokeVideo.play().catch(function (e) {
          console.error("Play button failed:", e);
        });
      }
    });
  }

  function handleGuess() {
    const userGuess = guess.value.trim().toLowerCase();
    if (!userGuess) return;

    if (userGuess === ans_poke.toLowerCase()) {
      console.log("correct");
      result.textContent = `You are correct! It's ${ans_poke}!`;
      result.style.color = "#00ff00";
      wrong = 0;
    } else {
      guess.value = "";
      wrong++;
      console.log("wrong count:", wrong);

      result.textContent = "You got it wrong!";
      result.style.color = "#ff4444";

      if (wrong === 1) {
        hintdisplay2.textContent = "Hint: " + ans_hint2;
      } else if (wrong === 2 || wrong === 3) {
        hintdisplay3.textContent = "Hint: " + ans_hint3;
      }

      // Trigger video popup when user reaches 4 wrong guesses
      if (wrong >= 4) {
        result.textContent = `4 wrong guesses! Who's that Pokémon?`;
        showRevealPopup();
      }
    }
  }

  submit.addEventListener("click", handleGuess);

  // Allow pressing Enter in the input field
  guess.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      handleGuess();
    }
  });

  function resetgame() {
    wrong = 0;
    closePopup();
    hintdisplay1.textContent = "";
    hintdisplay2.textContent = "";
    hintdisplay3.textContent = "";
    guess.value = "";
    result.textContent = "";
    pickNewPokemon();
  }

  reset.addEventListener("click", resetgame);

  // Popup close handlers
  if (closeBtn) {
    closeBtn.addEventListener("click", closePopup);
  }

  if (openBtn) {
    openBtn.addEventListener("click", showRevealPopup);
  }

  popupOverlay.addEventListener("click", function (event) {
    if (event.target === popupOverlay) {
      closePopup();
    }
  });

  // Initial load
  loadPokemonData();
});
