"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  CircleAlert,
  Code2,
  Cuboid,
  ExternalLink,
  Grid2X2,
  LoaderCircle,
  Moon,
  MousePointer2,
  MoveHorizontal,
  Pin,
  RotateCcw,
  Ruler,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Undo2,
} from "lucide-react";
import {
  CATEGORY_KEYS,
  FABRICS,
  FINISHES,
  money,
  productById,
  productsFor,
  ROOM,
} from "@/lib/catalog";
import { CONTACT_URL, REPOSITORY_URL } from "@/lib/brand";
import type { Category, Configuration } from "@/lib/contracts";
import { useShowroom } from "@/hooks/use-showroom";
import { ProductSketch } from "./product-sketch";
import { ShowroomScene } from "./showroom-scene";

const categories: Category[] = ["desk", "chair", "lamp", "storage"];
const categoryLabels = {
  desk: "Desk",
  chair: "Chair",
  lamp: "Lighting",
  storage: "Storage",
};
const suggestions = [
  {
    label: "A smaller footprint",
    prompt: "Build a compact home office in warm oak, under CAD 1,500.",
  },
  {
    label: "A warmer feel",
    prompt: "Make the room feel warmer with walnut and soft evening light.",
  },
  {
    label: "Keep my chair",
    prompt: "Keep my chair and choose a narrower desk.",
  },
];

export function ShowroomApp() {
  const studio = useShowroom();
  const [selectedCategory, setSelectedCategory] = useState<Category>("desk");
  const [tab, setTab] = useState<"ai" | "collection">("ai");
  const [showDimensions, setShowDimensions] = useState(false);
  const [cameraMode, setCameraMode] = useState<"perspective" | "plan">(
    "perspective",
  );
  const [resetViewToken, setResetViewToken] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [consent, setConsent] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const { configuration, assessment, budgetCents } = studio;
  const selectedId = configuration[CATEGORY_KEYS[selectedCategory]];
  const selectedProduct = selectedId ? productById(selectedId) : undefined;
  const remaining = budgetCents - assessment.totalCents;
  const pinCount = categories.filter((category) =>
    studio.locks.includes(CATEGORY_KEYS[category]),
  ).length;

  function selectPiece(category: Category) {
    setSelectedCategory(category);
    setTab("collection");
  }

  function chooseSuggestion(value: string) {
    setPrompt(value);
    promptRef.current?.focus();
  }

  function moveTab(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? "ai"
        : event.key === "End"
          ? "collection"
          : tab === "ai"
            ? "collection"
            : "ai";
    setTab(next);
    document.getElementById(`${next}-tab`)?.focus();
  }

  return (
    <>
      <a className="skip-link" href="#design-studio">
        Skip to the design studio
      </a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Spatial Showroom home">
          <svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
            <rect width="40" height="40" rx="11" fill="currentColor" />
            <path
              d="m11 13 5 15 4-10 4 10 5-15"
              fill="none"
              stroke="#F8F7F2"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle cx="30" cy="10" r="3" fill="#9D7CEB" />
          </svg>
          <span className="brand-name">
            Spatial Showroom<span>by Webytex</span>
          </span>
        </a>
        <div className="header-links">
          <span className="agency-label">
            <span />
            Agencies
          </span>
          <a
            className="source-link"
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="View source code"
          >
            <Code2 size={15} />
            View source
            <ArrowUpRight size={13} />
          </a>
          <a
            className="contact-link"
            href={CONTACT_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Build something like this with Webytex Agencies"
          >
            Build something like this
            <ArrowUpRight size={15} />
          </a>
        </div>
      </header>

      <main>
        <section className="introduction" aria-labelledby="page-title">
          <div>
            <div className="eyebrow">
              <span className="small-rule" /> A SPACE FOR YOUR IDEAS
            </div>
            <h1 id="page-title">
              Describe the space.
              <br />
              <em>See it take shape.</em>
            </h1>
          </div>
          <div className="intro-aside">
            <p>
              Your next home office starts with a thought.
              <br className="desktop-break" /> A few considered pieces. A little
              conversation.
              <br className="desktop-break" /> A room that feels like you.
            </p>
            <div className="intro-caption">
              <span className="status-dot" />
              An interactive 3D design experience
            </div>
          </div>
        </section>

        <section
          className="studio"
          id="design-studio"
          aria-label="Interactive home office design studio"
        >
          <div className="room-column">
            <div
              className={`room-stage ${configuration.lighting === "evening" ? "room-evening" : ""}`}
            >
              <div className="stage-top">
                <div className="room-name">
                  <span className="room-index">01</span>
                  <span>
                    The home office
                    <small>
                      {ROOM.width.toFixed(1)} × {ROOM.depth.toFixed(1)} m ·
                      Studio collection
                    </small>
                  </span>
                </div>
                <span className="live-render">
                  <span />
                  LIVE 3D
                </span>
              </div>
              <div className="scene-mount">
                <ShowroomScene
                  configuration={configuration}
                  selectedCategory={selectedCategory}
                  onSelect={selectPiece}
                  showDimensions={showDimensions}
                  resetViewToken={resetViewToken}
                  cameraMode={cameraMode}
                />
              </div>
              <div className="scene-tools" aria-label="Room view controls">
                <div className="tool-group">
                  <button
                    type="button"
                    className={cameraMode === "perspective" ? "active" : ""}
                    aria-label="Perspective view"
                    title="Perspective view"
                    aria-pressed={cameraMode === "perspective"}
                    onClick={() => setCameraMode("perspective")}
                  >
                    <Cuboid size={17} />
                    <span>3D</span>
                  </button>
                  <button
                    type="button"
                    className={cameraMode === "plan" ? "active" : ""}
                    aria-label="Floor plan view"
                    title="Floor plan view"
                    aria-pressed={cameraMode === "plan"}
                    onClick={() => setCameraMode("plan")}
                  >
                    <Grid2X2 size={16} />
                    <span>Plan</span>
                  </button>
                </div>
                <div className="tool-divider" />
                <button
                  type="button"
                  className={`icon-button ${showDimensions ? "active" : ""}`}
                  title="Show dimensions"
                  aria-label="Show dimensions"
                  aria-pressed={showDimensions}
                  onClick={() => setShowDimensions((value) => !value)}
                >
                  <Ruler size={18} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  title="Reset camera"
                  aria-label="Reset camera"
                  onClick={() => setResetViewToken((value) => value + 1)}
                >
                  <RotateCcw size={17} />
                </button>
              </div>
              <div className="stage-bottom">
                <span>
                  <MousePointer2 size={13} />
                  Drag to explore · Select a piece to edit
                </span>
                <span className="scene-palette">
                  <i
                    style={{
                      background: FINISHES.find(
                        (item) => item.id === configuration.finish,
                      )!.colour,
                    }}
                  />
                  <i
                    style={{
                      background: FABRICS.find(
                        (item) => item.id === configuration.fabric,
                      )!.colour,
                    }}
                  />
                  <i style={{ background: "#e5dfcf" }} />
                </span>
              </div>
            </div>

            <div className="collection-heading">
              <div>
                <span className="eyebrow">IN YOUR ROOM</span>
                <span className="piece-count">
                  {
                    categories.filter(
                      (category) => configuration[CATEGORY_KEYS[category]],
                    ).length
                  }{" "}
                  considered pieces
                </span>
              </div>
              <span className="pin-hint">
                <Pin size={12} />
                Pin a piece to keep it with AI
              </span>
            </div>
            <div className="selection-grid">
              {categories.map((category) => {
                const id = configuration[CATEGORY_KEYS[category]];
                const product = id ? productById(id) : undefined;
                const pinned = studio.locks.includes(CATEGORY_KEYS[category]);
                return (
                  <div
                    className={`selection-card ${selectedCategory === category ? "selected" : ""}`}
                    key={category}
                  >
                    <button
                      className="selection-main"
                      type="button"
                      onClick={() => selectPiece(category)}
                      aria-label={`Edit ${categoryLabels[category].toLowerCase()}: ${product?.name ?? "none selected"}`}
                      aria-pressed={selectedCategory === category}
                    >
                      <span className="selection-category">
                        {categoryLabels[category]}
                      </span>
                      <div className="selection-image">
                        <ProductSketch
                          product={product}
                          configuration={configuration}
                        />
                      </div>
                      <span className="selection-name">
                        {product?.name ?? "Leave it open"}
                      </span>
                      <span className="selection-price">
                        {product ? (
                          <>
                            {money(product.priceCents)}{" "}
                            <span>· {Math.round(product.width * 100)} cm</span>
                          </>
                        ) : (
                          "No piece selected"
                        )}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`pin-button ${pinned ? "is-pinned" : ""}`}
                      aria-label={`${pinned ? "Unpin" : "Pin"} ${category}${category === "chair" ? " and upholstery" : ""}`}
                      title={`${pinned ? "Unpin" : "Pin"} ${category}${category === "chair" ? " and upholstery" : ""}`}
                      aria-pressed={pinned}
                      onClick={() => studio.togglePin(category)}
                    >
                      <Pin size={13} fill={pinned ? "currentColor" : "none"} />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="room-actions">
              <span>
                <Check size={13} />
                {assessment.fitsRoom
                  ? "Room footprint checked"
                  : "Review room footprint"}
              </span>
              <div>
                <button
                  type="button"
                  onClick={studio.undo}
                  disabled={!studio.historySize}
                >
                  <Undo2 size={14} />
                  Undo
                </button>
                <button type="button" onClick={studio.reset}>
                  <RotateCcw size={13} />
                  Reset room
                </button>
                <button type="button" onClick={() => void studio.share()}>
                  <Share2 size={13} />
                  Share room
                </button>
              </div>
            </div>
            {studio.shareUrl && (
              <label className="share-fallback">
                Your room link
                <input
                  type="text"
                  readOnly
                  value={studio.shareUrl}
                  onFocus={(event) => event.target.select()}
                />
              </label>
            )}
          </div>

          <aside className="design-panel" aria-label="Design controls">
            <div
              className="panel-tabs"
              role="tablist"
              aria-label="Design method"
              onKeyDown={moveTab}
            >
              <button
                type="button"
                role="tab"
                tabIndex={tab === "ai" ? 0 : -1}
                aria-selected={tab === "ai"}
                aria-controls="ai-panel"
                id="ai-tab"
                onClick={() => setTab("ai")}
              >
                <Sparkles size={15} />
                Design with AI
              </button>
              <button
                type="button"
                role="tab"
                tabIndex={tab === "collection" ? 0 : -1}
                aria-selected={tab === "collection"}
                aria-controls="collection-panel"
                id="collection-tab"
                onClick={() => setTab("collection")}
              >
                <SlidersHorizontal size={14} />
                Edit collection
              </button>
            </div>
            <div
              className={`notice-region ${studio.notice ? `has-notice notice-${studio.notice.kind}` : ""}`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {studio.notice && (
                <>
                  <span className="notice-icon">
                    {studio.notice.kind === "error" ? (
                      <CircleAlert size={18} />
                    ) : studio.notice.kind === "success" ? (
                      <CheckCheck size={18} />
                    ) : (
                      <Sparkles size={17} />
                    )}
                  </span>
                  <div>
                    <strong>{studio.notice.text}</strong>
                    {studio.notice.rationale && (
                      <p>{studio.notice.rationale}</p>
                    )}
                    {!!studio.notice.changes?.length && (
                      <ul className="change-list">
                        {studio.notice.changes.map((change) => (
                          <li key={change}>
                            <Check size={11} />
                            {change}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
            {tab === "ai" ? (
              <div
                className="panel-content ai-panel"
                role="tabpanel"
                aria-labelledby="ai-tab"
                id="ai-panel"
              >
                <div className="panel-kicker">
                  <span className="sparkle-tile">
                    <Sparkles size={17} />
                  </span>
                  <span>YOUR DESIGN PARTNER</span>
                  <span
                    className={`availability-dot ${studio.live?.liveEnabled ? "available" : ""}`}
                    title={
                      studio.live?.liveEnabled
                        ? "Live design available"
                        : "Live design unavailable"
                    }
                  />
                </div>
                <h2>
                  Your space,
                  <br />
                  <em>in your words.</em>
                </h2>
                <p className="panel-intro">
                  Tell us how you work, what you love,
                  <br />
                  and what you want to make room for.
                </p>
                <form
                  className="prompt-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void studio.propose(prompt, consent);
                  }}
                >
                  <label className="visually-hidden" htmlFor="design-brief">
                    Describe your ideal home office
                  </label>
                  <div className="prompt-box">
                    <textarea
                      ref={promptRef}
                      id="design-brief"
                      maxLength={600}
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      placeholder="A calm home office in warm oak, with a comfortable chair and room for my books…"
                      rows={4}
                    />
                    <span className="character-count">{prompt.length}/600</span>
                  </div>
                  <div className="suggestion-label">A little inspiration</div>
                  <div className="suggestions">
                    {suggestions.map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion.label}
                        onClick={() => chooseSuggestion(suggestion.prompt)}
                      >
                        {suggestion.label}
                        <ArrowUpRight size={11} />
                      </button>
                    ))}
                  </div>
                  <label className="consent-row">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(event) => setConsent(event.target.checked)}
                    />
                    <span>
                      I agree to send this brief, room choices, budget and pins
                      to OpenAI.
                    </span>
                  </label>
                  <button
                    className="design-submit"
                    type="submit"
                    disabled={
                      studio.busy ||
                      !studio.live?.liveEnabled ||
                      !consent ||
                      !prompt.trim() ||
                      !studio.budgetValid
                    }
                  >
                    {studio.busy ? (
                      <>
                        <LoaderCircle size={17} className="spinning" />
                        Shaping your space…
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Bring it to life
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                  <p className="ai-note">
                    {studio.live === null ? (
                      "Checking live design availability…"
                    ) : studio.live.liveEnabled ? (
                      <>
                        Checked against your budget and pins. Always reversible.
                      </>
                    ) : (
                      <>
                        <span className="offline-dot" />
                        Live AI is currently unavailable.{" "}
                        <button
                          type="button"
                          onClick={() => setTab("collection")}
                        >
                          Explore the collection
                        </button>
                      </>
                    )}
                  </p>
                </form>
              </div>
            ) : (
              <div
                className="panel-content editor-panel"
                role="tabpanel"
                aria-labelledby="collection-tab"
                id="collection-panel"
              >
                <div className="editor-title">
                  <div>
                    <span className="eyebrow">THE STUDIO COLLECTION</span>
                    <h2>Make it yours.</h2>
                  </div>
                  <span className="editor-count">10 pieces</span>
                </div>
                <div
                  className="category-tabs"
                  role="group"
                  aria-label="Product category"
                >
                  {categories.map((category) => (
                    <button
                      type="button"
                      key={category}
                      aria-pressed={selectedCategory === category}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {categoryLabels[category]}
                    </button>
                  ))}
                </div>
                <div
                  className="product-options"
                  aria-label={`${categoryLabels[selectedCategory]} choices`}
                >
                  {productsFor(selectedCategory).map((product) => (
                    <button
                      type="button"
                      className={`product-option ${selectedId === product.id ? "chosen" : ""}`}
                      key={product.id}
                      aria-pressed={selectedId === product.id}
                      onClick={() =>
                        studio.edit({
                          [CATEGORY_KEYS[selectedCategory]]: product.id,
                        })
                      }
                    >
                      <span className="option-sketch">
                        <ProductSketch
                          product={product}
                          configuration={configuration}
                        />
                      </span>
                      <span className="option-details">
                        <strong>{product.name}</strong>
                        <small>
                          {Math.round(product.width * 100)} ×{" "}
                          {Math.round(product.depth * 100)} cm
                        </small>
                      </span>
                      <span className="option-price">
                        {money(product.priceCents)}
                      </span>
                      <span className="option-check">
                        {selectedId === product.id ? <Check size={12} /> : null}
                      </span>
                    </button>
                  ))}
                  {(selectedCategory === "lamp" ||
                    selectedCategory === "storage") && (
                    <button
                      type="button"
                      className={`none-option ${!selectedId ? "chosen" : ""}`}
                      aria-pressed={!selectedId}
                      onClick={() =>
                        studio.edit({ [CATEGORY_KEYS[selectedCategory]]: null })
                      }
                    >
                      Leave room for something else
                      <span>
                        {!selectedId && <Check size={13} />}No{" "}
                        {selectedCategory}
                      </span>
                    </button>
                  )}
                </div>
                <p className="product-description">
                  {selectedProduct?.description ??
                    "A little open space can be a considered choice."}
                </p>
                <div className="material-controls">
                  <SwatchRow
                    label="Wood finish"
                    values={FINISHES}
                    selected={configuration.finish}
                    onChange={(finish) => studio.edit({ finish })}
                  />
                  <SwatchRow
                    label="Upholstery"
                    values={FABRICS}
                    selected={configuration.fabric}
                    onChange={(fabric) => studio.edit({ fabric })}
                  />
                </div>
                <div className="mood-controls">
                  <div>
                    <span className="control-label">Room layout</span>
                    <div className="segmented">
                      <button
                        type="button"
                        aria-pressed={configuration.layout === "left"}
                        onClick={() => studio.edit({ layout: "left" })}
                      >
                        <MoveHorizontal size={13} />
                        Left
                      </button>
                      <button
                        type="button"
                        aria-pressed={configuration.layout === "right"}
                        onClick={() => studio.edit({ layout: "right" })}
                      >
                        Right
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="control-label">The atmosphere</span>
                    <div className="segmented">
                      <button
                        type="button"
                        aria-pressed={configuration.lighting === "day"}
                        onClick={() => studio.edit({ lighting: "day" })}
                      >
                        <Sun size={13} />
                        Day
                      </button>
                      <button
                        type="button"
                        aria-pressed={configuration.lighting === "evening"}
                        onClick={() => studio.edit({ lighting: "evening" })}
                      >
                        <Moon size={12} />
                        Evening
                      </button>
                    </div>
                  </div>
                </div>
                <p className="manual-note">
                  <Pin size={12} />
                  Pins protect AI choices. Manual edits are always yours.
                </p>
              </div>
            )}

            <div className="budget-panel">
              <div className="budget-input-row">
                <label htmlFor="room-budget">
                  Your budget <span>CAD</span>
                </label>
                <div className="budget-field">
                  <span>$</span>
                  <input
                    id="room-budget"
                    type="number"
                    inputMode="numeric"
                    min={500}
                    max={5000}
                    step={1}
                    value={studio.budgetInput}
                    onChange={(event) =>
                      studio.changeBudget(event.target.value)
                    }
                    onBlur={studio.settleBudget}
                    aria-invalid={!studio.budgetValid}
                    aria-describedby="budget-range"
                  />
                </div>
              </div>
              <span id="budget-range" className="visually-hidden">
                Whole dollars from CAD 500 to CAD 5,000. This field sets the
                budget for AI designs.
              </span>
              <div className="total-row">
                <span>Your room total</span>
                <strong>
                  <small>CAD</small> {money(assessment.totalCents)}
                </strong>
              </div>
              <div
                className={`budget-track ${!assessment.withinBudget ? "over-budget" : ""}`}
                role="img"
                aria-label={`${Math.round((assessment.totalCents / budgetCents) * 100)} percent of your budget`}
              >
                <span
                  style={{
                    width: `${Math.min(100, (assessment.totalCents / budgetCents) * 100)}%`,
                  }}
                />
              </div>
              <div className="total-caption">
                <span
                  className={
                    !assessment.withinBudget
                      ? "budget-warning"
                      : "budget-remaining"
                  }
                >
                  {assessment.withinBudget ? (
                    <>
                      <Check size={12} />
                      {money(remaining)} within budget
                    </>
                  ) : (
                    <>
                      <CircleAlert size={12} />
                      {money(-remaining)} over budget
                    </>
                  )}
                </span>
                <span>
                  {pinCount ? `${pinCount} pinned` : "All pieces flexible"}
                </span>
              </div>
              <p className="price-disclaimer">
                Illustrative prices. Tax and shipping excluded.
              </p>
            </div>
          </aside>
        </section>

        <section className="experience-note" aria-label="About this experience">
          <div className="experience-heading">
            <span className="eyebrow">THOUGHTFULLY CONNECTED</span>
            <h2>
              A conversation.
              <br />A collection. <em>Your perspective.</em>
            </h2>
          </div>
          <div className="experience-step">
            <span className="step-number">01 / IMAGINE</span>
            <h3>Start with a feeling.</h3>
            <p>
              Give your ideas a little room. A short brief can change the
              pieces, materials and atmosphere.
            </p>
          </div>
          <div className="experience-step">
            <span className="step-number">02 / MAKE IT PERSONAL</span>
            <h3>You have the final say.</h3>
            <p>
              Explore every angle. Pin what you love, fine-tune the details, or
              undo a change.
            </p>
          </div>
          <div className="experience-step">
            <span className="step-number">03 / TAKE IT FURTHER</span>
            <h3>See what is possible.</h3>
            <p>
              A small example of a more personal digital experience.{" "}
              <a href={CONTACT_URL} target="_blank" rel="noreferrer">
                Imagine yours
                <ArrowUpRight size={12} />
              </a>
            </p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-credit">
          <span className="footer-wordmark">webytex</span>
          <span>Thoughtful technology. Tangible possibilities.</span>
        </div>
        <div className="footer-detail">
          <p>
            An original fictional collection. This demo checks simplified room
            footprints,
            <br className="desktop-break" /> not architectural or ergonomic
            suitability. Nothing here is available for purchase.
          </p>
          <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">
            Open source
            <ExternalLink size={11} />
          </a>
        </div>
      </footer>
    </>
  );
}

function SwatchRow<
  T extends Configuration["finish"] | Configuration["fabric"],
>({
  label,
  values,
  selected,
  onChange,
}: {
  label: string;
  values: readonly { id: T; label: string; colour: string }[];
  selected: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="swatch-row">
      <div>
        <span className="control-label">{label}</span>
        <span className="material-name">
          {values.find((value) => value.id === selected)?.label}
        </span>
      </div>
      <div className="swatches" role="group" aria-label={label}>
        {values.map((value) => (
          <button
            type="button"
            key={value.id}
            style={{ "--swatch": value.colour } as React.CSSProperties}
            aria-label={value.label}
            title={value.label}
            aria-pressed={selected === value.id}
            onClick={() => onChange(value.id)}
          >
            {selected === value.id && <Check size={12} />}
          </button>
        ))}
      </div>
    </div>
  );
}
