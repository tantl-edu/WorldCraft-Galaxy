import {
  Boxes,
  Camera,
  Check,
  Eye,
  Grid2X2,
  Globe2,
  Hammer,
  Lock,
  Map,
  Rocket,
  Shuffle,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  buildBlocks,
  getWorldRegion,
  resources,
  starterPlanet,
  tradeOffers,
  type BuildBlock,
  type PlacedBlock,
} from "./gameData";
import { PlanetScene } from "./PlanetScene";

type ToolMode = "build" | "delete";
type CameraMode = "overhead" | "avatar";
type AvatarPosition = { x: number; z: number };

const starterBuilds: PlacedBlock[] = [
];

export function App() {
  const [selectedBlockId, setSelectedBlockId] = useState(buildBlocks[0].id);
  const [toolMode, setToolMode] = useState<ToolMode>("build");
  const [cameraMode, setCameraMode] = useState<CameraMode>("overhead");
  const [resourcePickerOpen, setResourcePickerOpen] = useState(false);
  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlock[]>(starterBuilds);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [acceptedTrades, setAcceptedTrades] = useState<string[]>([]);
  const [nickname, setNickname] = useState("SkyBuilder");
  const [draftNickname, setDraftNickname] = useState("SkyBuilder");
  const [avatarPosition, setAvatarPosition] = useState<AvatarPosition>({ x: -18, z: 14 });

  const selectedBlock = useMemo(
    () => buildBlocks.find((block) => block.id === selectedBlockId) ?? buildBlocks[0],
    [selectedBlockId],
  );

  const selectedResource = resources.find((resource) => resource.id === selectedBlock.resourceId);
  const currentRegion = getWorldRegion(avatarPosition.x, avatarPosition.z);
  const tradedOrigins = acceptedTrades
    .map((tradeId) => tradeOffers.find((offer) => offer.id === tradeId)?.unlockOrigin)
    .filter((origin): origin is string => Boolean(origin));
  const unlockedOrigins = new Set<string>(["Auralis Reach", ...tradedOrigins]);
  const availableBlocks = buildBlocks.filter((block) => block.unlock === "local" || unlockedOrigins.has(block.origin));
  const buildScore = placedBlocks.length * 12 + acceptedTrades.length * 18;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      const moves: Record<string, AvatarPosition> = {
        ArrowUp: { x: 0, z: -1 },
        ArrowDown: { x: 0, z: 1 },
        ArrowLeft: { x: -1, z: 0 },
        ArrowRight: { x: 1, z: 0 },
      };
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      setAvatarPosition((current) => ({
        x: Math.max(-28, Math.min(28, current.x + move.x)),
        z: Math.max(-28, Math.min(28, current.z + move.z)),
      }));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const placeBlock = (block: BuildBlock, x: number, z: number) => {
    if (block.unlock === "trade" && !unlockedOrigins.has(block.origin)) {
      setTradeOpen(true);
      return;
    }
    setPlacedBlocks((current) => {
      const stack = current.filter((placed) => placed.x === x && placed.z === z);
      const shouldStack = block.category === "building";
      const y = shouldStack ? Math.min(6, stack.reduce((highest, placed) => Math.max(highest, placed.y), -1) + 1) : 0;
      const cleared = shouldStack ? current : current.filter((placed) => placed.x !== x || placed.z !== z);
      return [...cleared, { ...block, instanceId: `${block.id}-${Date.now()}-${x}-${y}-${z}`, x, y, z }];
    });
  };

  const deleteBlock = (instanceId: string) => {
    setPlacedBlocks((current) => current.filter((placed) => placed.instanceId !== instanceId));
  };

  const saveNickname = () => {
    const cleaned = draftNickname.replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 16);
    setNickname(cleaned || "SkyBuilder");
    setDraftNickname(cleaned || "SkyBuilder");
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

        <PlanetScene
          avatarPosition={avatarPosition}
          cameraMode={cameraMode}
          nickname={nickname}
          selectedBlock={selectedBlock}
          toolMode={toolMode}
          placedBlocks={placedBlocks}
          onPlaceBlock={placeBlock}
          onDeleteBlock={deleteBlock}
        />

        <div className="build-toolbar" aria-label="Build palette">
          <button
            className={toolMode === "build" ? "tool-button selected" : "tool-button"}
            type="button"
            onClick={() => setToolMode("build")}
          >
            <Hammer size={18} />
            <span>Build</span>
          </button>
          <button
            className={toolMode === "delete" ? "tool-button danger selected" : "tool-button danger"}
            type="button"
            onClick={() => setToolMode("delete")}
          >
            <Trash2 size={18} />
            <span>Delete</span>
          </button>
          <button
            className={cameraMode === "overhead" ? "tool-button selected" : "tool-button"}
            type="button"
            onClick={() => setCameraMode("overhead")}
          >
            <Map size={18} />
            <span>Top View</span>
          </button>
          <button
            className={cameraMode === "avatar" ? "tool-button selected" : "tool-button"}
            type="button"
            onClick={() => setCameraMode("avatar")}
          >
            <Camera size={18} />
            <span>Avatar View</span>
          </button>
          <button className="tool-button resource-toggle" type="button" onClick={() => setResourcePickerOpen((open) => !open)}>
            <Grid2X2 size={18} />
            <span>Resources</span>
          </button>
          <div className="selected-block-chip">
            <span className="block-swatch" style={{ background: selectedBlock.color }} />
            <span>{selectedBlock.label}</span>
          </div>
        </div>

        {resourcePickerOpen && (
          <div className="resource-picker" aria-label="Resource picker">
            <div className="resource-picker-heading">
              <strong>Resources</strong>
              <span>Local blocks are always available. Trade unlocks special planets.</span>
            </div>
            <div className="resource-picker-grid">
              {buildBlocks.map((block) => {
                const locked = !availableBlocks.some((available) => available.id === block.id);
                return (
                  <button
                    className={block.id === selectedBlock.id ? "block-button selected" : locked ? "block-button locked" : "block-button"}
                    disabled={locked}
                    key={block.id}
                    type="button"
                    onClick={() => {
                      setSelectedBlockId(block.id);
                      setResourcePickerOpen(false);
                    }}
                  >
                    <span className="block-swatch" style={{ background: block.color }} />
                    <span>
                      {block.label}
                      <small>{locked ? "Trade to unlock" : block.origin}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
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

        <div className="privacy-row avatar-row">
          <UserRound size={16} />
          <div className="avatar-editor">
            <label htmlFor="nickname">Avatar nickname</label>
            <div>
              <input
                id="nickname"
                maxLength={16}
                value={draftNickname}
                onChange={(event) => setDraftNickname(event.target.value)}
                onBlur={saveNickname}
                aria-describedby="nickname-note"
              />
              <button type="button" onClick={saveNickname}>
                Save
              </button>
            </div>
            <span id="nickname-note">Game nicknames only, no real names or personal info.</span>
          </div>
        </div>

        <div className="location-card">
          <Globe2 size={18} />
          <div>
            <span>Current world</span>
            <strong>{starterPlanet.name}</strong>
            <span>
              {currentRegion.name} - {currentRegion.biome}
            </span>
          </div>
        </div>

        <div className="score-grid">
          <div>
            <span>Build Score</span>
            <strong>{buildScore}</strong>
          </div>
          <div>
            <span>User Blocks</span>
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
                  <p>
                    {resource.description} Origin: {resource.origin}.
                  </p>
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
            {selectedBlock.label} comes from <strong>{selectedBlock.origin}</strong> and uses{" "}
            <strong>{selectedResource?.name}</strong>. Value <strong>{selectedResource?.value}</strong>. Good for{" "}
            {selectedResource?.uses.slice(0, 2).join(" and ")}.
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
