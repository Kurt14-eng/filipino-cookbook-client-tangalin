"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { demoFoods, Food } from "./demoData";

type SourceSettings = {
  baseUrl: string;
  token: string;
  developerName: string;
  repositoryUrl: string;
};

type ConnectionMode = "demo" | "live";

const defaultSettings: SourceSettings = {
  baseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8080",
  token: "",
  developerName:
    process.env.NEXT_PUBLIC_API_DEVELOPER || "[SELECTED CLASSMATE]",
  repositoryUrl: process.env.NEXT_PUBLIC_API_REPOSITORY || "",
};

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asId(value: unknown, fallback: number): number {
  const result = Number(value);
  return Number.isFinite(result) && result > 0 ? result : fallback;
}

function normalizeIngredients(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return asText(
            record.ingredient_name ?? record.name,
            asText(record.quantity),
          );
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((ingredient) => ingredient.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeFood(value: unknown, index = 0): Food {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    id: asId(record.food_id ?? record.id, index + 1),
    name: asText(record.food_name ?? record.name, "Untitled dish"),
    category: asText(
      record.category_name ?? record.category,
      "Uncategorized",
    ),
    origin: asText(record.origin_name ?? record.origin, "Philippines"),
    method: asText(
      record.preparation_method ?? record.method,
      "Traditional preparation",
    ),
    instructions: asText(
      record.instructions ?? record.description,
      "Preparation instructions are not available.",
    ),
    ingredients: normalizeIngredients(
      record.ingredients ?? record.ingredient_names,
    ),
  };
}

function unwrapData(payload: unknown): unknown {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: unknown }).data;
  }
  return payload;
}

export default function CookbookClient() {
  const [foods, setFoods] = useState<Food[]>(demoFoods);
  const [mode, setMode] = useState<ConnectionMode>("demo");
  const [settings, setSettings] =
    useState<SourceSettings>(defaultSettings);
  const [draftSettings, setDraftSettings] =
    useState<SourceSettings>(defaultSettings);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [origin, setOrigin] = useState("All origins");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(
    "Previewing sample data. Connect the selected classmate’s API when ready.",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = window.sessionStorage.getItem("cookbook-api-settings");
    if (!stored) return;
    try {
      const saved = JSON.parse(stored) as Partial<SourceSettings>;
      const merged = { ...defaultSettings, ...saved, token: "" };
      setSettings(merged);
      setDraftSettings(merged);
    } catch {
      window.sessionStorage.removeItem("cookbook-api-settings");
    }
  }, []);

  useEffect(() => {
    if (!selectedFood) return;
    const close = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setSelectedFood(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selectedFood]);

  const categories = useMemo(
    () => [
      "All categories",
      ...Array.from(new Set(foods.map((food) => food.category))).sort(),
    ],
    [foods],
  );

  const origins = useMemo(
    () => [
      "All origins",
      ...Array.from(new Set(foods.map((food) => food.origin))).sort(),
    ],
    [foods],
  );

  const visibleFoods = useMemo(() => {
    const term = search.trim().toLowerCase();
    return foods.filter((food) => {
      const matchesSearch =
        !term ||
        food.name.toLowerCase().includes(term) ||
        food.ingredients.some((ingredient) =>
          ingredient.toLowerCase().includes(term),
        );
      const matchesCategory =
        category === "All categories" || food.category === category;
      const matchesOrigin =
        origin === "All origins" || food.origin === origin;
      return matchesSearch && matchesCategory && matchesOrigin;
    });
  }, [foods, search, category, origin]);

  async function apiRequest(path: string, source = settings): Promise<unknown> {
    const response = await fetch(`${source.baseUrl}${path}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${source.token}`,
      },
    });
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error("The API did not return JSON.");
    }
    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "message" in payload
          ? asText((payload as { message: unknown }).message)
          : "";
      throw new Error(message || `The API returned HTTP ${response.status}.`);
    }
    return unwrapData(payload);
  }

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const source = {
      ...draftSettings,
      baseUrl: draftSettings.baseUrl.trim().replace(/\/$/, ""),
      developerName:
        draftSettings.developerName.trim() || "[SELECTED CLASSMATE]",
    };
    if (!source.baseUrl || !source.token) {
      setError("Enter the API base URL and bearer token.");
      return;
    }

    setLoading(true);
    try {
      const payload = await apiRequest("/api/foods", source);
      if (!Array.isArray(payload)) {
        throw new Error("The foods endpoint did not return a list.");
      }
      const normalized = payload.map(normalizeFood);
      setFoods(normalized);
      setSettings(source);
      setMode("live");
      setSearch("");
      setCategory("All categories");
      setOrigin("All origins");
      setNotice(
        `Connected successfully. Showing ${normalized.length} dishes from ${source.developerName}.`,
      );
      window.sessionStorage.setItem(
        "cookbook-api-settings",
        JSON.stringify({ ...source, token: "" }),
      );
      setSetupOpen(false);
    } catch (connectionError) {
      setError(
        connectionError instanceof Error
          ? connectionError.message
          : "The API connection failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function showFood(food: Food) {
    setSelectedFood(food);
    if (mode !== "live") return;

    try {
      const payload = await apiRequest(`/api/foods/${food.id}`);
      const detailed = normalizeFood(payload, food.id - 1);
      if (detailed.ingredients.length === 0) {
        try {
          const ingredients = await apiRequest(
            `/api/foods/${food.id}/ingredients`,
          );
          detailed.ingredients = normalizeIngredients(ingredients);
        } catch {
          detailed.ingredients = food.ingredients;
        }
      }
      setSelectedFood(detailed);
    } catch {
      setNotice(
        "The detail endpoint was unavailable, so the list information is shown.",
      );
    }
  }

  async function surpriseMe() {
    setError("");
    if (mode === "live") {
      try {
        const payload = await apiRequest("/api/foods/random");
        setSelectedFood(normalizeFood(payload));
        return;
      } catch {
        setNotice(
          "The random endpoint was unavailable; a dish was selected from the loaded list.",
        );
      }
    }
    const pool = visibleFoods.length ? visibleFoods : foods;
    setSelectedFood(pool[Math.floor(Math.random() * pool.length)] ?? null);
  }

  function useDemo() {
    setFoods(demoFoods);
    setMode("demo");
    setSearch("");
    setCategory("All categories");
    setOrigin("All origins");
    setError("");
    setNotice(
      "Previewing sample data. Connect the selected classmate’s API for final submission evidence.",
    );
    setSetupOpen(false);
  }

  function searchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") setSearch("");
  }

  const activeDeveloper =
    mode === "live" ? settings.developerName : "[SELECTED CLASSMATE]";

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Sarap Atlas home">
          <span className="brand-mark" aria-hidden="true">
            SA
          </span>
          <span>
            <strong>Sarap Atlas</strong>
            <small>Filipino cookbook explorer</small>
          </span>
        </a>
        <div className="header-actions">
          <span className={`mode-badge ${mode}`}>
            <span aria-hidden="true" />
            {mode === "live" ? "Live API" : "Demo preview"}
          </span>
          <button
            className="button secondary compact"
            type="button"
            onClick={() => setSetupOpen(true)}
          >
            API setup
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A delicious tour of the Philippines</p>
          <h1>
            Find your next
            <span> Filipino favorite.</span>
          </h1>
          <p className="hero-intro">
            Browse regional classics, discover their ingredients, and learn
            how every dish comes together—powered by a classmate-developed API.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#cookbook">
              Explore the cookbook
            </a>
            <button className="text-button" type="button" onClick={surpriseMe}>
              Surprise me <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <div className="hero-art" aria-label="Featured Filipino flavor notes">
          <div className="sun-disc" />
          <div className="flavor-card flavor-one">
            <span>01</span>
            <strong>Asim</strong>
            <small>bright &amp; sour</small>
          </div>
          <div className="flavor-card flavor-two">
            <span>02</span>
            <strong>Linamnam</strong>
            <small>deep &amp; savory</small>
          </div>
          <div className="flavor-card flavor-three">
            <span>03</span>
            <strong>Anghang</strong>
            <small>warm &amp; spicy</small>
          </div>
          <p className="baybayin-note">LUTONG PINOY • LUTONG PINOY</p>
        </div>
      </section>

      <section className="source-strip" aria-live="polite">
        <p>
          <strong>{mode === "live" ? "Connected" : "Preview mode"}</strong>
          {notice}
        </p>
        <button type="button" onClick={() => setSetupOpen(true)}>
          {mode === "live" ? "Change source" : "Connect API"}{" "}
          <span aria-hidden="true">↗</span>
        </button>
      </section>

      <section className="cookbook" id="cookbook">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The cookbook</p>
            <h2>Every dish tells a story.</h2>
          </div>
          <p>
            {visibleFoods.length} {visibleFoods.length === 1 ? "dish" : "dishes"}{" "}
            shown
          </p>
        </div>

        <div className="filter-panel">
          <label className="search-field">
            <span>Search dishes or ingredients</span>
            <div>
              <span aria-hidden="true">⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={searchKeyDown}
                placeholder="Try adobo, coconut, chicken..."
                type="search"
              />
            </div>
          </label>
          <label>
            <span>Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Origin</span>
            <select
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
            >
              {origins.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <button className="button surprise" type="button" onClick={surpriseMe}>
            <span aria-hidden="true">✦</span> Surprise me
          </button>
        </div>

        {visibleFoods.length > 0 ? (
          <div className="food-grid">
            {visibleFoods.map((food, index) => (
              <article className="food-card" key={`${food.id}-${food.name}`}>
                <div className={`card-accent accent-${(index % 4) + 1}`}>
                  <span>{food.category}</span>
                  <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
                </div>
                <div className="food-card-body">
                  <p className="food-origin">{food.origin}</p>
                  <h3>{food.name}</h3>
                  <p>{food.instructions}</p>
                  <div className="ingredient-preview">
                    {food.ingredients.slice(0, 3).map((ingredient) => (
                      <span key={ingredient}>{ingredient}</span>
                    ))}
                    {food.ingredients.length > 3 && (
                      <span>+{food.ingredients.length - 3}</span>
                    )}
                  </div>
                  <button type="button" onClick={() => showFood(food)}>
                    View recipe <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">⌕</span>
            <h3>No dishes match those filters.</h3>
            <p>Try a broader search or reset the category and origin.</p>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("All categories");
                setOrigin("All origins");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      <section className="api-story">
        <div>
          <p className="eyebrow">Built on collaboration</p>
          <h2>Good APIs deserve a thoughtful front end.</h2>
        </div>
        <div className="api-story-grid">
          <p>
            Sarap Atlas transforms JSON responses into a clear, responsive
            cookbook. It never connects directly to the source database.
          </p>
          <dl>
            <div>
              <dt>Data source</dt>
              <dd>{mode === "live" ? settings.baseUrl : "Demo preview"}</dd>
            </div>
            <div>
              <dt>API developer</dt>
              <dd>{activeDeveloper}</dd>
            </div>
            <div>
              <dt>Authentication</dt>
              <dd>Bearer token entered per session</dd>
            </div>
          </dl>
        </div>
      </section>

      <footer>
        <div className="brand footer-brand">
          <span className="brand-mark" aria-hidden="true">
            SA
          </span>
          <span>
            <strong>Sarap Atlas</strong>
            <small>Made for API Development Activity</small>
          </span>
        </div>
        <p>
          API developed by: <strong>{activeDeveloper}</strong>
          {mode === "live" && settings.repositoryUrl ? (
            <>
              {" · "}
              <a href={settings.repositoryUrl} rel="noreferrer" target="_blank">
                View source repository
              </a>
            </>
          ) : null}
        </p>
      </footer>

      {setupOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSetupOpen(false);
          }}
        >
          <section
            aria-labelledby="setup-title"
            aria-modal="true"
            className="setup-modal"
            role="dialog"
          >
            <button
              aria-label="Close API setup"
              className="close-button"
              onClick={() => setSetupOpen(false)}
              type="button"
            >
              ×
            </button>
            <p className="eyebrow">API connection</p>
            <h2 id="setup-title">Connect your classmate’s cookbook.</h2>
            <p className="modal-intro">
              The token is held only in memory for this tab. It is never written
              to the repository or saved between browser sessions.
            </p>
            <form onSubmit={connect}>
              <label>
                <span>API base URL</span>
                <input
                  onChange={(event) =>
                    setDraftSettings({
                      ...draftSettings,
                      baseUrl: event.target.value,
                    })
                  }
                  placeholder="http://localhost/classmate-api/public"
                  required
                  type="url"
                  value={draftSettings.baseUrl}
                />
              </label>
              <label>
                <span>Bearer token</span>
                <input
                  autoComplete="off"
                  onChange={(event) =>
                    setDraftSettings({
                      ...draftSettings,
                      token: event.target.value,
                    })
                  }
                  placeholder="Enter token for this session"
                  required
                  type="password"
                  value={draftSettings.token}
                />
              </label>
              <div className="field-row">
                <label>
                  <span>API developer</span>
                  <input
                    onChange={(event) =>
                      setDraftSettings({
                        ...draftSettings,
                        developerName: event.target.value,
                      })
                    }
                    placeholder="Classmate’s full name"
                    required
                    value={draftSettings.developerName}
                  />
                </label>
                <label>
                  <span>Repository URL</span>
                  <input
                    onChange={(event) =>
                      setDraftSettings({
                        ...draftSettings,
                        repositoryUrl: event.target.value,
                      })
                    }
                    placeholder="https://github.com/..."
                    type="url"
                    value={draftSettings.repositoryUrl}
                  />
                </label>
              </div>
              {error && <p className="form-error">{error}</p>}
              <div className="modal-actions">
                <button className="button primary" disabled={loading} type="submit">
                  {loading ? "Connecting…" : "Test and connect"}
                </button>
                <button
                  className="button secondary"
                  onClick={useDemo}
                  type="button"
                >
                  Use demo preview
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedFood && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelectedFood(null);
          }}
        >
          <article
            aria-labelledby="recipe-title"
            aria-modal="true"
            className="recipe-modal"
            role="dialog"
          >
            <button
              aria-label="Close recipe"
              className="close-button"
              onClick={() => setSelectedFood(null)}
              type="button"
            >
              ×
            </button>
            <div className="recipe-top">
              <p className="eyebrow">{selectedFood.category}</p>
              <h2 id="recipe-title">{selectedFood.name}</h2>
              <div className="recipe-meta">
                <span>{selectedFood.origin}</span>
                <span>{selectedFood.method}</span>
              </div>
            </div>
            <div className="recipe-content">
              <section>
                <h3>Ingredients</h3>
                {selectedFood.ingredients.length ? (
                  <ul>
                    {selectedFood.ingredients.map((ingredient) => (
                      <li key={ingredient}>
                        <span aria-hidden="true">•</span>
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No ingredient list was returned by the API.</p>
                )}
              </section>
              <section>
                <h3>How it comes together</h3>
                <p>{selectedFood.instructions}</p>
                <div className="recipe-note">
                  <strong>Source note</strong>
                  Recipe information is presented from the connected Filipino
                  Cookbook API.
                </div>
              </section>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}

