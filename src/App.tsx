import { Boxes, Check, Eye, Globe2, Lock, Rocket, Shuffle, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { buildBlocks, resources, starterPlanet, tradeOffers, type BuildBlock } from "./gameData";
import { PlanetScene } from "./PlanetScene";

export function App() {
  const [selectedBlockId, setSelectedBlockId] = useState(buildBlocks[2].id);
  const [placedBlocks, setPlacedBlocks] = useState<BuildBlock[]>(buildBlocks.slice(0, 5));
  const [tradeOpen, setTradeOpen] = useState(false);
  const [acceptedTrades, setAcceptedTrades] = useState<string[]>([]);

  const selectedBlock = useMemo(
    () => buildBlocks.find((block) => block.id === selectedBlockId) ?? buildBlocks[0],
    [selectedBlockId],
  );

  const selectedResource = resources.find((resource) => resource.id === selectedBlock.resourceId);
  const buildScore = placedBlocks.length * 12 + acceptedTrades.length * 18;

  const placeBlock = (block: BuildBlock) => {
    setPlacedBlocks((current) => [...current, block]);
  };

  return (
    <main className="app-shell">
      <section className="game-stage">
        <div className="hud-top">
          <button className="swap-button" type="button" onClick={() => setTradeOpen(true)}>
            <Shuffle size={19} />
            <span>Swap</span>
          </button>

          <div className="planet-badge">
            <Globe2 size={18} />
            <span>{starterPlanet.name}</span>
          </div>
        </div>

        <PlanetScene selectedBlock={selectedBlock} placedBlocks={placedBlocks} onPlaceBlock={placeBlock} />

        <div className="build-toolbar" aria-label="Build palette">
          {buildBlocks.map((block) => (
            <button
              className={block.id === selectedBlock.id ? "block-button selected" : "block-button"}
              key={block.id}
              type="button"
              onClick={() => setSelectedBlockId(block.id)}
            >
              <span className="block-swatch" style={{ background: block.color }} />
              <span>{block.label}</span>
            </button>
          ))}
        </div>
      </section>

      <aside className="command-panel">
        <div className="title-row">
          <div>
            <p className="eyebrow">{starterPlanet.system}</p>
            <h1>WorldCraft Galaxy</h1>
          </div>
          <Rocket size={31} />
        </div>

        <p className="planet-copy">{starterPlanet.description}</p>

        <div className="privacy-row">
          <Lock size={16} />
          <span>{starterPlanet.privacy}</span>
        </div>

        <div className="score-grid">
          <div>
            <span>Build Score</span>
            <strong>{buildScore}</strong>
          </div>
          <div>
            <span>Blocks</span>
            <strong>{placedBlocks.length}</strong>
          </div>
        </div>

        <section className="panel-section">
          <div className="section-heading">
            <Boxes size={18} />
            <h2>Resources</h2>
          </div>
          <div className="resource-list">
            {resources.map((resource) => (
              <article className="resource-card" key={resource.id}>
                <span className="resource-dot" style={{ background: resource.color }} />
                <div>
                  <strong>{resource.name}</strong>
                  <p>{resource.description}</p>
                </div>
                <span className="resource-amount">{resource.amount}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel-section selected-resource">
          <div className="section-heading">
            <Sparkles size={18} />
            <h2>Selected Build</h2>
          </div>
          <p>
            {selectedBlock.label} uses <strong>{selectedResource?.name}</strong>. Value{" "}
            <strong>{selectedResource?.value}</strong>. Good for {selectedResource?.uses.slice(0, 2).join(" and ")}.
          </p>
        </section>
      </aside>

      {tradeOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setTradeOpen(false)}>
          <section className="trade-panel" role="dialog" aria-modal="true" aria-label="Swap and trade" onClick={(event) => event.stopPropagation()}>
            <div className="title-row">
              <div>
                <p className="eyebrow">Swap / Trade</p>
                <h2>Resource Exchange</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setTradeOpen(false)} aria-label="Close trade panel">
                <Check size={20} />
              </button>
            </div>

            <p className="planet-copy">
              Offers can be accepted now or left pending so another player can answer later.
            </p>

            <div className="trade-list">
              {tradeOffers.map((offer) => {
                const accepted = acceptedTrades.includes(offer.id);
                return (
                  <article className="trade-card" key={offer.id}>
                    <div>
                      <strong>{offer.from}</strong>
                      <p>
                        Wants {offer.wants}. Gives {offer.gives}.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={accepted ? "accepted-button" : "accept-button"}
                      onClick={() => setAcceptedTrades((current) => [...new Set([...current, offer.id])])}
                    >
                      {accepted ? "Accepted" : offer.status}
                    </button>
                  </article>
                );
              })}
            </div>

            <div className="visitor-note">
              <Eye size={17} />
              <span>Future public worlds can allow visitors to explore without building or deleting.</span>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
