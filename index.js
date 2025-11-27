// ========================================
// VARIABLES GLOBALES
// ========================================
let currentTheme = localStorage.getItem("theme") || "light";
const GEMINI_API_KEY = "clé"; // À remplacer par votre clé API

// ========================================
// INITIALISATION AU CHARGEMENT
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNavigation();
  initForms();
  initChatbot();
  initScrollEffects();
});

// ========================================
// GESTION DU THÈME (DARK MODE)
// ========================================
function initTheme() {
  const themeToggle = document.getElementById("themeToggle");
  const html = document.documentElement;

  // Appliquer le thème sauvegardé
  html.setAttribute("data-theme", currentTheme);
  updateThemeIcon();

  // Écouteur pour le toggle
  themeToggle.addEventListener("click", () => {
    currentTheme = currentTheme === "light" ? "dark" : "light";
    html.setAttribute("data-theme", currentTheme);
    localStorage.setItem("theme", currentTheme);
    updateThemeIcon();
  });
}

function updateThemeIcon() {
  const icon = document.querySelector("#themeToggle i");
  icon.className = currentTheme === "light" ? "fas fa-moon" : "fas fa-sun";
}

// ========================================
// NAVIGATION
// ========================================
function initNavigation() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const nav = document.querySelector(".nav");
  const navLinks = document.querySelectorAll(".nav-link");

  // Menu mobile
  mobileMenuBtn.addEventListener("click", () => {
    nav.classList.toggle("active");
    const icon = mobileMenuBtn.querySelector("i");
    icon.className = nav.classList.contains("active")
      ? "fas fa-times"
      : "fas fa-bars";
  });

  // Navigation active et scroll
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      scrollToSection(targetId);

      // Fermer le menu mobile
      nav.classList.remove("active");
      mobileMenuBtn.querySelector("i").className = "fas fa-bars";

      // Mettre à jour le lien actif
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
  });
}

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    const headerHeight = document.querySelector(".header").offsetHeight;
    const sectionTop = section.offsetTop - headerHeight;
    window.scrollTo({
      top: sectionTop,
      behavior: "smooth",
    });
  }
}

// ========================================
// SCROLL EFFECTS
// ========================================
function initScrollEffects() {
  // Highlight navigation selon la section visible
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.pageYOffset >= sectionTop - 200) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });
}

// ========================================
// INITIALISATION DES FORMULAIRES
// ========================================
function initForms() {
  // Formulaire IMC
  const imcForm = document.getElementById("imcForm");
  imcForm.addEventListener("submit", handleIMCCalculation);

  // Formulaire Symptômes
  const symptomForm = document.getElementById("symptomForm");
  symptomForm.addEventListener("submit", handleSymptomAnalysis);

  // Formulaire Menstruel
  const menstrualForm = document.getElementById("menstrualForm");
  menstrualForm.addEventListener("submit", handleMenstrualCalculation);
}

// ========================================
// CALCULATEUR IMC
// ========================================
async function handleIMCCalculation(e) {
  e.preventDefault();

  const poids = parseFloat(document.getElementById("poids").value);
  const taille = parseFloat(document.getElementById("taille").value) / 100; // Convertir en mètres
  const age = parseInt(document.getElementById("age").value);
  const sexe = document.getElementById("sexe").value;

  // Calcul de l'IMC
  const imc = (poids / (taille * taille)).toFixed(2);

  // Catégorie IMC
  let categorie = "";
  let classe = "";
  if (imc < 18.5) {
    categorie = "Insuffisance pondérale";
    classe = "warning";
  } else if (imc < 25) {
    categorie = "Poids normal";
    classe = "success";
  } else if (imc < 30) {
    categorie = "Surpoids";
    classe = "warning";
  } else {
    categorie = "Obésité";
    classe = "danger";
  }

  // Demander l'interprétation à l'IA
  const prompt = `En tant qu'assistant santé, interprète ces résultats IMC de manière bienveillante et donne des conseils personnalisés :
    - IMC: ${imc}
    - Catégorie: ${categorie}
    - Âge: ${age} ans
    - Sexe: ${sexe}
    
    Donne une interprétation courte (3-4 phrases) et des recommandations adaptées.`;

  const interpretation = await callGeminiAPI(prompt);

  // Afficher les résultats
  const resultBox = document.getElementById("imcResult");
  resultBox.className = `result-box ${classe}`;
  resultBox.innerHTML = `
        <h4>Résultats de votre IMC</h4>
        <p><strong>Votre IMC:</strong> ${imc}</p>
        <p><strong>Catégorie:</strong> ${categorie}</p>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color);">
            <h4 style="color: var(--primary-color);">💡 Interprétation IA</h4>
            <p>${interpretation}</p>
        </div>
    `;
  resultBox.classList.remove("hidden");

  // Scroll vers les résultats
  resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ========================================
// ANALYSEUR DE SYMPTÔMES
// ========================================
async function handleSymptomAnalysis(e) {
  e.preventDefault();

  // Récupérer les symptômes sélectionnés
  const checkboxes = document.querySelectorAll('input[name="symptom"]:checked');
  const symptomes = Array.from(checkboxes).map((cb) => cb.value);

  if (symptomes.length === 0) {
    alert("Veuillez sélectionner au moins un symptôme");
    return;
  }

  const duree = document.getElementById("duree").value;
  const intensite = document.getElementById("intensite").value;
  const description = document.getElementById("description").value;

  // Formater les symptômes pour l'affichage
  const symptomesTexte = symptomes.map((s) => s.replace(/_/g, " ")).join(", ");

  // Demander l'analyse à l'IA
  const prompt = `En tant qu'assistant médical, analyse ces symptômes et donne des conseils :
    - Symptômes: ${symptomesTexte}
    - Durée: ${duree}
    - Intensité: ${intensite}
    ${description ? `- Description: ${description}` : ""}
    
    Fournis une analyse courte avec :
    1. Causes possibles (2-3 hypothèses)
    2. Conseils pratiques
    3. Recommandation de consulter si nécessaire
    
    IMPORTANT: Rappelle que ceci n'est pas un diagnostic médical.`;

  const analyse = await callGeminiAPI(prompt);

  // Afficher les résultats
  const resultBox = document.getElementById("symptomResult");
  resultBox.className = "result-box";
  resultBox.innerHTML = `
        <h4>Analyse de vos symptômes</h4>
        <p><strong>Symptômes rapportés:</strong> ${symptomesTexte}</p>
        <p><strong>Durée:</strong> ${duree.replace(/_/g, " ")}</p>
        <p><strong>Intensité:</strong> ${intensite}</p>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color);">
            <h4 style="color: var(--primary-color);">💡 Analyse IA</h4>
            <p>${analyse}</p>
        </div>
        <div style="margin-top: 15px; padding: 10px; background: #fef3c7; border-radius: 8px; color: #92400e;">
            <strong>⚠️ Avertissement:</strong> Cette analyse est informative uniquement. Consultez un professionnel de santé pour un diagnostic précis.
        </div>
    `;
  resultBox.classList.remove("hidden");

  // Scroll vers les résultats
  resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ========================================
// CALCULATEUR MENSTRUEL
// ========================================
async function handleMenstrualCalculation(e) {
  e.preventDefault();

  const dateRegles = new Date(document.getElementById("dateRegles").value);
  const dureeCycle = parseInt(document.getElementById("dureeCycle").value);
  const dureeRegles = parseInt(document.getElementById("dureeRegles").value);

  // Calculs
  const prochainesRegles = new Date(dateRegles);
  prochainesRegles.setDate(prochainesRegles.getDate() + dureeCycle);

  const ovulation = new Date(dateRegles);
  ovulation.setDate(ovulation.getDate() + Math.floor(dureeCycle / 2));

  const fenetreOvulation = {
    debut: new Date(ovulation),
    fin: new Date(ovulation),
  };
  fenetreOvulation.debut.setDate(fenetreOvulation.debut.getDate() - 3);
  fenetreOvulation.fin.setDate(fenetreOvulation.fin.getDate() + 2);

  // Formater les dates
  const options = { year: "numeric", month: "long", day: "numeric" };
  const prochainesReglesStr = prochainesRegles.toLocaleDateString(
    "fr-FR",
    options
  );
  const ovulationStr = ovulation.toLocaleDateString("fr-FR", options);
  const fenetreStr = `${fenetreOvulation.debut.toLocaleDateString(
    "fr-FR",
    options
  )} - ${fenetreOvulation.fin.toLocaleDateString("fr-FR", options)}`;

  // Demander des conseils à l'IA
  const prompt = `En tant qu'assistant santé féminine, donne des conseils personnalisés basés sur ce cycle menstruel :
    - Durée du cycle: ${dureeCycle} jours
    - Durée des règles: ${dureeRegles} jours
    - Prochaines règles estimées: ${prochainesReglesStr}
    - Période d'ovulation: ${ovulationStr}
    
    Fournis des conseils courts (3-4 phrases) sur la santé menstruelle et le bien-être durant le cycle.`;

  const conseils = await callGeminiAPI(prompt);

  // Afficher les résultats
  const resultBox = document.getElementById("menstrualResult");
  resultBox.className = "result-box success";
  resultBox.innerHTML = `
        <h4>Prévisions de votre cycle</h4>
        <p><strong>📅 Prochaines règles:</strong> ${prochainesReglesStr}</p>
        <p><strong>🥚 Ovulation estimée:</strong> ${ovulationStr}</p>
        <p><strong>💕 Fenêtre de fertilité:</strong> ${fenetreStr}</p>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color);">
            <h4 style="color: var(--primary-color);">💡 Conseils IA</h4>
            <p>${conseils}</p>
        </div>
        <div style="margin-top: 15px; padding: 10px; background: #dbeafe; border-radius: 8px; color: #1e40af;">
            <strong>ℹ️ Note:</strong> Ces calculs sont des estimations. Les cycles peuvent varier naturellement.
        </div>
    `;
  resultBox.classList.remove("hidden");

  // Scroll vers les résultats
  resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ========================================
// CHATBOT IA
// ========================================
function initChatbot() {
  const chatForm = document.getElementById("chatForm");
  const clearChatBtn = document.getElementById("clearChat");

  chatForm.addEventListener("submit", handleChatMessage);
  clearChatBtn.addEventListener("click", clearChatHistory);
}

async function handleChatMessage(e) {
  e.preventDefault();

  const input = document.getElementById("chatInput");
  const message = input.value.trim();

  if (!message) return;

  // Ajouter le message de l'utilisateur
  addMessageToChat(message, "user");
  input.value = "";

  // Afficher un indicateur de chargement
  const loadingId = addLoadingMessage();

  // Appeler l'API Gemini
  const response = await callGeminiAPI(message, true);

  // Retirer le loading et ajouter la réponse
  removeLoadingMessage(loadingId);
  addMessageToChat(response, "bot");
}

function addMessageToChat(message, sender) {
  const chatMessages = document.getElementById("chatMessages");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;

  const time = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-${sender === "user" ? "user" : "robot"}"></i>
        </div>
        <div class="message-content">
            <p>${message}</p>
            <span class="message-time">${time}</span>
        </div>
    `;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addLoadingMessage() {
  const chatMessages = document.getElementById("chatMessages");
  const loadingDiv = document.createElement("div");
  const loadingId = "loading-" + Date.now();
  loadingDiv.id = loadingId;
  loadingDiv.className = "message bot-message";
  loadingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <p>En train de réfléchir<span class="loading-dots">...</span></p>
        </div>
    `;

  chatMessages.appendChild(loadingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return loadingId;
}

function removeLoadingMessage(loadingId) {
  const loadingDiv = document.getElementById(loadingId);
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

function clearChatHistory() {
  const chatMessages = document.getElementById("chatMessages");
  chatMessages.innerHTML = `
        <div class="message bot-message">
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>Bonjour ! Je suis votre assistant santé intelligent. Comment puis-je vous aider aujourd'hui ?</p>
                <span class="message-time">Maintenant</span>
            </div>
        </div>
    `;
}

// ========================================
// APPEL API GEMINI
// ========================================
async function callGeminiAPI(userMessage, isChatbot = false) {
  // IMPORTANT: Cette fonction doit être configurée avec votre clé API Gemini

  // Vérifier si la clé API est configurée
  if (GEMINI_API_KEY === "VOTRE_CLE_API_GEMINI") {
    return `⚠️ Configuration requise : Veuillez ajouter votre clé API Gemini dans le fichier script.js (variable GEMINI_API_KEY).
        
Pour obtenir votre clé API :
1. Rendez-vous sur https://makersuite.google.com/app/apikey
2. Créez une nouvelle clé API
3. Remplacez 'VOTRE_CLE_API_GEMINI' dans le code par votre clé`;
  }

  try {
    // Contexte système pour le chatbot médical
    const systemContext = isChatbot
      ? `Tu es un assistant médical virtuel bienveillant et professionnel. 
            Tu donnes des informations de santé générales, mais tu rappelles toujours que tu ne remplaces pas une consultation médicale.
            Tu es empathique, rassurant et précis dans tes réponses.
            Si une situation semble urgente, tu recommandes de consulter immédiatement un professionnel de santé.`
      : "";

    const fullPrompt = systemContext
      ? `${systemContext}\n\n${userMessage}`
      : userMessage;

    // Appel à l'API Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    // Extraire la réponse
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Réponse inattendue de l'API");
    }
  } catch (error) {
    console.error("Erreur lors de l'appel à l'API Gemini:", error);
    return `Désolé, je rencontre des difficultés techniques. Veuillez réessayer dans quelques instants. 
        Erreur: ${error.message}`;
  }
}

// ========================================
// UTILITAIRES
// ========================================

// Animation pour les points de chargement
setInterval(() => {
  const loadingDots = document.querySelectorAll(".loading-dots");
  loadingDots.forEach((dots) => {
    const currentDots = dots.textContent;
    dots.textContent = currentDots.length >= 3 ? "." : currentDots + ".";
  });
}, 500);

// Gestion du formulaire de contact
document.querySelector(".contact-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Message envoyé ! Nous vous répondrons dans les plus brefs délais.");
  e.target.reset();
});

// Smooth scroll pour les boutons hero
window.scrollToSection = scrollToSection;
