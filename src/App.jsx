import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import Dice3D from "./components/Dice3D";

const JUMPS = {
  4: 25,
  13: 46,
  33: 49,
  42: 63,
  50: 69,
  62: 81,
  74: 92,
  27: 5,
  40: 3,
  43: 18,
  54: 31,
  66: 45,
  76: 58,
  89: 53,
  99: 41,
};

const SNAKES = Object.entries(JUMPS)
  .filter(([from, to]) => Number(to) < Number(from))
  .map(([from, to]) => ({
    from: Number(from),
    to: Number(to),
  }));

const BOARD_PRESETS = {
  candy: {
    name: "Candy",
    colors: [
      "#FFF7A8",
      "#FFD5A5",
      "#FFDDE5",
      "#F7B8F4",
      "#B8B0F6",
      "#93B8F2",
      "#8CE7EF",
      "#BEF7B5",
    ],
  },

  pastel: {
    name: "Pastel",
    colors: [
      "#FFE5EC",
      "#FFD6A5",
      "#FDFFB6",
      "#CAFFBF",
      "#9BF6FF",
      "#A0C4FF",
      "#BDB2FF",
      "#FFC6FF",
    ],
  },

  sunset: {
    name: "Sunset",
    colors: [
      "#FFD166",
      "#FFB45C",
      "#FF8A70",
      "#F477A0",
      "#B57EDC",
      "#7B89D4",
      "#6DAEDB",
      "#73C6B6",
    ],
  },

  tropical: {
    name: "Tropical",
    colors: [
      "#F9E65C",
      "#FFB45E",
      "#FF758F",
      "#A977E8",
      "#59B9E8",
      "#4CC9AE",
      "#85C96F",
      "#F383B5",
    ],
  },

  soft: {
    name: "Soft",
    colors: [
      "#F2D06B",
      "#E9A269",
      "#E99AAF",
      "#AC98C8",
      "#85A3C4",
      "#82BEB4",
      "#ADD0B3",
      "#E6BE7B",
    ],
  },
};

const DEFAULT_SNAKE_COLORS = [
  "#E65761",
  "#7B57D9",
  "#3F82F7",
  "#F39A43",
  "#D95A9E",
  "#14A88D",
  "#E0B21B",
  "#42B85C",
];

const PLAYER_OPTIONS = [
  {
    id: 1,
    name: "Player 1",
    shortName: "P1",
    className: "player-blue",
  },
  {
    id: 2,
    name: "Player 2",
    shortName: "P2",
    className: "player-purple",
  },
  {
    id: 3,
    name: "Player 3",
    shortName: "P3",
    className: "player-green",
  },
  {
    id: 4,
    name: "Player 4",
    shortName: "P4",
    className: "player-orange",
  },
];

function buildBoard() {
  const rows = [];

  for (let visualRow = 0; visualRow < 10; visualRow++) {
    const actualRow = 9 - visualRow;
    const start = actualRow * 10 + 1;

    let rowNumbers = Array.from(
      { length: 10 },
      (_, index) => start + index
    );

    if (visualRow % 2 === 0) {
      rowNumbers.reverse();
    }

    rows.push(rowNumbers);
  }

  return rows.flat();
}

function getTileCoordinates(tile) {
  const zeroBased = tile - 1;
  const rowFromBottom = Math.floor(zeroBased / 10);
  const positionInRow = zeroBased % 10;

  const column =
    rowFromBottom % 2 === 0
      ? positionInRow
      : 9 - positionInRow;

  return {
    x: column * 10 + 5,
    y: (9 - rowFromBottom) * 10 + 5,
  };
}

function getContrastColor(hex) {
  const clean = hex.replace("#", "");

  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  const luminance =
    (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.63 ? "#202028" : "#FFFFFF";
}

function BoardConnections({ snakeColors }) {
  return (
    <svg
      className="board-connections"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {Object.entries(JUMPS).map(([fromValue, toValue]) => {
        const from = Number(fromValue);
        const to = Number(toValue);

        const start = getTileCoordinates(from);
        const end = getTileCoordinates(to);

        const isLadder = to > from;

        if (isLadder) {
          const dx = end.x - start.x;
          const dy = end.y - start.y;

          const length = Math.sqrt(dx * dx + dy * dy);

          const offsetX = (-dy / length) * 1.25;
          const offsetY = (dx / length) * 1.25;

          return (
            <g
              key={`${from}-${to}`}
              className="ladder-graphic"
            >
              <line
                x1={start.x + offsetX}
                y1={start.y + offsetY}
                x2={end.x + offsetX}
                y2={end.y + offsetY}
              />

              <line
                x1={start.x - offsetX}
                y1={start.y - offsetY}
                x2={end.x - offsetX}
                y2={end.y - offsetY}
              />

              {[0.14, 0.28, 0.42, 0.56, 0.7, 0.84].map(
                (amount) => {
                  const x = start.x + dx * amount;
                  const y = start.y + dy * amount;

                  return (
                    <line
                      key={amount}
                      className="ladder-rung"
                      x1={x + offsetX}
                      y1={y + offsetY}
                      x2={x - offsetX}
                      y2={y - offsetY}
                    />
                  );
                }
              )}
            </g>
          );
        }

        const snakeIndex = SNAKES.findIndex(
          (snake) => snake.from === from
        );

        const color = snakeColors[snakeIndex];

        const middleX = (start.x + end.x) / 2;

        const curveOffset =
          snakeIndex % 2 === 0 ? 8 : -8;

        const path = `
          M ${start.x} ${start.y}
          C
          ${middleX + curveOffset} ${start.y + 6},
          ${middleX - curveOffset} ${end.y - 6},
          ${end.x} ${end.y}
        `;

        return (
          <g
            key={`${from}-${to}`}
            className="snake-graphic"
            style={{ color }}
          >
            <path
              className="snake-outline"
              d={path}
            />

            <path
              className="snake-body"
              d={path}
            />

            <circle
              className="snake-head-outline"
              cx={start.x}
              cy={start.y}
              r="2.25"
            />

            <circle
              className="snake-head"
              cx={start.x}
              cy={start.y}
              r="1.85"
            />

            <circle
              className="snake-eye"
              cx={start.x - 0.55}
              cy={start.y - 0.35}
              r="0.22"
            />

            <circle
              className="snake-eye"
              cx={start.x + 0.55}
              cy={start.y - 0.35}
              r="0.22"
            />

            <circle
              className="snake-tail"
              cx={end.x}
              cy={end.y}
              r="0.75"
            />
          </g>
        );
      })}
    </svg>
  );
}

function App() {
  const board = useMemo(() => buildBoard(), []);

  const [gameStarted, setGameStarted] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);

  const [players, setPlayers] = useState(
    PLAYER_OPTIONS.slice(0, 2).map((player) => ({
      ...player,
      position: 0,
    }))
  );

  const [currentPlayerIndex, setCurrentPlayerIndex] =
    useState(0);

  const [dice, setDice] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [moving, setMoving] = useState(false);
  const [movingPlayerId, setMovingPlayerId] = useState(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [winner, setWinner] = useState(null);

  const skipMovementRef = useRef(false);
  const animationSpeedRef = useRef(1);

  const [message, setMessage] = useState(
    "Choose your players and start the race."
  );

  const [showCustomizer, setShowCustomizer] =
    useState(false);

  const [customizerTab, setCustomizerTab] =
    useState("board");

  const [boardColors, setBoardColors] = useState(() => {
    const saved = localStorage.getItem(
      "snakes-board-colors"
    );

    try {
      return saved
        ? JSON.parse(saved)
        : [...BOARD_PRESETS.candy.colors];
    } catch {
      return [...BOARD_PRESETS.candy.colors];
    }
  });

  const [snakeColors, setSnakeColors] = useState(() => {
    const saved = localStorage.getItem(
      "snakes-snake-colors"
    );

    try {
      return saved
        ? JSON.parse(saved)
        : [...DEFAULT_SNAKE_COLORS];
    } catch {
      return [...DEFAULT_SNAKE_COLORS];
    }
  });

  const [diceColor, setDiceColor] = useState(
    () =>
      localStorage.getItem("snakes-dice-color") ||
      "#6558F5"
  );

  const [pipColor, setPipColor] = useState(
    () =>
      localStorage.getItem("snakes-pip-color") ||
      "#FFFFFF"
  );

  useEffect(() => {
    localStorage.setItem(
      "snakes-board-colors",
      JSON.stringify(boardColors)
    );
  }, [boardColors]);

  useEffect(() => {
    localStorage.setItem(
      "snakes-snake-colors",
      JSON.stringify(snakeColors)
    );
  }, [snakeColors]);

  useEffect(() => {
    localStorage.setItem(
      "snakes-dice-color",
      diceColor
    );
  }, [diceColor]);

  useEffect(() => {
    localStorage.setItem(
      "snakes-pip-color",
      pipColor
    );
  }, [pipColor]);

  function createPlayers(count) {
    return PLAYER_OPTIONS.slice(0, count).map(
      (player) => ({
        ...player,
        position: 0,
      })
    );
  }

  function changePlayerCount(event) {
    const count = Number(event.target.value);

    setPlayerCount(count);
    setPlayers(createPlayers(count));
  }

  function startGame() {
    const fresh = createPlayers(playerCount);

    setPlayers(fresh);
    setCurrentPlayerIndex(0);
    setDice(1);
    setWinner(null);
    setGameStarted(true);

    setMessage(
      `${fresh[0].name}, roll the dice!`
    );
  }

  function resetGame() {
    const fresh = createPlayers(playerCount);

    setPlayers(fresh);
    setCurrentPlayerIndex(0);
    setDice(1);
    setWinner(null);
    setRolling(false);
    setMoving(false);
    setMovingPlayerId(null);
    setAnimationSpeed(1);

    skipMovementRef.current = false;
    animationSpeedRef.current = 1;

    setMessage(
      `${fresh[0].name}, roll the dice!`
    );
  }

  function waitForMovement(milliseconds) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, milliseconds);
    });
  }

  function updatePlayerPosition(playerIndex, position) {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player, index) =>
        index === playerIndex
          ? {
              ...player,
              position,
            }
          : player
      )
    );
  }

  function toggleAnimationSpeed() {
    const nextSpeed =
      animationSpeedRef.current === 1 ? 2 : 1;

    animationSpeedRef.current = nextSpeed;
    setAnimationSpeed(nextSpeed);
  }

  function skipMovementAnimation() {
    skipMovementRef.current = true;

    setMessage("Skipping movement animation...");
  }

  function nextTurn(updatedPlayers) {
    const nextIndex =
      (currentPlayerIndex + 1) %
      updatedPlayers.length;

    setCurrentPlayerIndex(nextIndex);

    setMessage(
      `${updatedPlayers[nextIndex].name}, your turn!`
    );
  }

  async function movePlayer(diceValue) {
    const playerIndex = currentPlayerIndex;
    const activePlayer = players[playerIndex];

    const rolledPosition =
      activePlayer.position + diceValue;

    if (rolledPosition > 100) {
      setMessage(
        `${activePlayer.name} needs exactly ${
          100 - activePlayer.position
        } to win.`
      );

      window.setTimeout(
        () => nextTurn(players),
        900
      );

      return;
    }

    setMoving(true);
    setMovingPlayerId(activePlayer.id);

    skipMovementRef.current = false;

    let visiblePosition = activePlayer.position;

    /*
      Hop one numbered tile at a time.
      The board token is re-mounted on every new tile and the
      CSS token-hop animation makes the piece visibly bounce.
    */
    for (
      let position = activePlayer.position + 1;
      position <= rolledPosition;
      position += 1
    ) {
      if (skipMovementRef.current) {
        break;
      }

      visiblePosition = position;

      updatePlayerPosition(
        playerIndex,
        visiblePosition
      );

      setMessage(
        `${activePlayer.name} jumps to tile ${visiblePosition}.`
      );

      const hopDelay =
        animationSpeedRef.current === 2
          ? 125
          : 250;

      await waitForMovement(hopDelay);
    }

    /*
      If Skip was pressed, go straight to the rolled tile.
    */
    if (
      skipMovementRef.current &&
      visiblePosition !== rolledPosition
    ) {
      visiblePosition = rolledPosition;

      updatePlayerPosition(
        playerIndex,
        visiblePosition
      );

      await waitForMovement(40);
    }

    let finalPosition = rolledPosition;
    let specialMessage = "";

    /*
      Landing on a ladder or snake triggers one final large hop.
    */
    if (JUMPS[rolledPosition]) {
      const destination =
        JUMPS[rolledPosition];

      specialMessage =
        destination > rolledPosition
          ? `🪜 Ladder! ${rolledPosition} → ${destination}`
          : `🐍 Snake! ${rolledPosition} → ${destination}`;

      finalPosition = destination;

      if (!skipMovementRef.current) {
        setMessage(specialMessage);

        await waitForMovement(
          animationSpeedRef.current === 2
            ? 180
            : 360
        );
      }

      updatePlayerPosition(
        playerIndex,
        finalPosition
      );

      if (!skipMovementRef.current) {
        await waitForMovement(
          animationSpeedRef.current === 2
            ? 160
            : 320
        );
      }
    }

    const finishedPlayers = players.map(
      (player, index) =>
        index === playerIndex
          ? {
              ...player,
              position: finalPosition,
            }
          : player
    );

    setPlayers(finishedPlayers);
    setMoving(false);
    setMovingPlayerId(null);

    skipMovementRef.current = false;

    if (finalPosition === 100) {
      setWinner({
        ...activePlayer,
        position: 100,
      });

      setMessage(
        `🏆 ${activePlayer.name} wins!`
      );

      return;
    }

    setMessage(
      specialMessage ||
        `${activePlayer.name} landed on tile ${finalPosition}.`
    );

    await waitForMovement(
      animationSpeedRef.current === 2
        ? 260
        : 520
    );

    nextTurn(finishedPlayers);
  }

  function rollDice() {
    if (rolling || moving || winner) {
      return;
    }

    setRolling(true);

    let count = 0;

    const animation = window.setInterval(() => {
      setDice(
        Math.floor(Math.random() * 6) + 1
      );

      count += 1;

      if (count >= 12) {
        window.clearInterval(animation);

        const finalDice =
          Math.floor(Math.random() * 6) + 1;

        setDice(finalDice);

        window.setTimeout(() => {
          setRolling(false);

          window.setTimeout(
            () => movePlayer(finalDice),
            220
          );
        }, 120);
      }
    }, 70);
  }

  function updateBoardColor(index, color) {
    setBoardColors((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? color : item
      )
    );
  }

  function updateSnakeColor(index, color) {
    setSnakeColors((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? color : item
      )
    );
  }

  function resetTheme() {
    setBoardColors([
      ...BOARD_PRESETS.candy.colors,
    ]);

    setSnakeColors([
      ...DEFAULT_SNAKE_COLORS,
    ]);

    setDiceColor("#6558F5");
    setPipColor("#FFFFFF");
  }

  const currentPlayer =
    players[currentPlayerIndex];

  return (
    <div className="app-shell">
      <header className="game-header">
        <div className="brand">
          <span className="brand-icon">
            🎲
          </span>

          <div>
            <small>
              30 DAY CHALLENGE
            </small>

            <h1>
              Snakes & Ladders
            </h1>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="header-button"
            onClick={() =>
              setShowCustomizer(true)
            }
          >
            🎨
            <span>Customize</span>
          </button>

          {gameStarted && (
            <button
              className="header-button"
              onClick={resetGame}
            >
              ↻
              <span>Restart</span>
            </button>
          )}
        </div>
      </header>

      {!gameStarted ? (
        <main className="start-screen">
          <section className="start-card">
            <div className="start-content">
              <span className="game-tag">
                CLASSIC GAME
              </span>

              <h2>
                Race to tile 100.
              </h2>

              <p>
                Climb the ladders, dodge the snakes
                and beat your friends.
              </p>

              <label className="player-select">
                Players

                <select
                  value={playerCount}
                  onChange={changePlayerCount}
                >
                  <option value="2">
                    2 Players
                  </option>

                  <option value="3">
                    3 Players
                  </option>

                  <option value="4">
                    4 Players
                  </option>
                </select>
              </label>

              <div className="start-players">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`token start-token ${player.className}`}
                  >
                    {player.shortName}
                  </div>
                ))}
              </div>

              <button
                className="primary-button"
                onClick={startGame}
              >
                Play Game →
              </button>
            </div>

            <div className="start-preview">
              {Array.from({
                length: 64,
              }).map((_, index) => (
                <span
                  key={index}
                  style={{
                    background:
                      boardColors[
                        index % boardColors.length
                      ],
                  }}
                />
              ))}

              <div className="start-dice">
                <Dice3D
                  value={5}
                  diceColor={diceColor}
                  pipColor={pipColor}
                />
              </div>

              <span className="preview-snake">
                🐍
              </span>

              <span className="preview-ladder">
                🪜
              </span>
            </div>
          </section>
        </main>
      ) : (
        <main className="game-layout">
          <section className="board-zone">
            <div className="board-wrapper">
              <div className="board">
                {board.map((number, index) => {
                  const color =
                    boardColors[
                      index % boardColors.length
                    ];

                  const textColor =
                    getContrastColor(color);

                  const playersHere =
                    players.filter(
                      (player) =>
                        player.position === number
                    );

                  return (
                    <div
                      key={number}
                      className="board-cell"
                      style={{
                        background: color,
                        color: textColor,
                      }}
                    >
                      <span
                        className="tile-number"
                        style={{
                          color: textColor,
                        }}
                      >
                        {number}
                      </span>

                      {number === 1 && (
                        <span className="tile-special">
                          START
                        </span>
                      )}

                      {number === 100 && (
                        <span className="tile-special finish">
                          ★
                        </span>
                      )}

                      <div className="piece-container">
                        {playersHere.map((player) => (
                          <div
                            key={player.id}
                            className={`token board-token ${player.className} ${
                              moving &&
                              player.id === movingPlayerId
                                ? "token-hopping"
                                : ""
                            }`}
                            style={{
                              "--hop-duration":
                                animationSpeed === 2
                                  ? "120ms"
                                  : "230ms",
                            }}
                          >
                            {player.shortName}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <BoardConnections
                snakeColors={snakeColors}
              />
            </div>
          </section>

          <aside className="control-panel">
            <section className="turn-card">
              {!winner ? (
                <>
                  <div className="current-player">
                    <div
                      className={`token player-token ${currentPlayer.className}`}
                    >
                      {currentPlayer.shortName}
                    </div>

                    <div className="current-player-copy">
                      <small>
                        CURRENT TURN
                      </small>

                      <strong>
                        {currentPlayer.name}
                      </strong>

                      <span>
                        {currentPlayer.position
                          ? `Tile ${currentPlayer.position}`
                          : "Starting line"}
                      </span>
                    </div>
                  </div>

                  <div className="turn-dice-stage">
                    <Dice3D
                      value={dice}
                      rolling={rolling}
                      diceColor={diceColor}
                      pipColor={pipColor}
                      compact
                    />
                  </div>

                  {moving && (
                    <div className="movement-controls">
                      <span className="movement-status">
                        {animationSpeed === 2
                          ? "Fast jumps"
                          : "Jumping..."}
                      </span>

                      <div className="movement-actions">
                        <button
                          className={`movement-button ${
                            animationSpeed === 2
                              ? "active"
                              : ""
                          }`}
                          onClick={toggleAnimationSpeed}
                          type="button"
                        >
                          ×2
                        </button>

                        <button
                          className="movement-button skip"
                          onClick={skipMovementAnimation}
                          type="button"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    className="primary-button roll-button"
                    onClick={rollDice}
                    disabled={rolling || moving}
                  >
                    🎲{" "}
                    {rolling
                      ? "Rolling..."
                      : moving
                      ? "Moving..."
                      : "Roll Dice"}
                  </button>
                </>
              ) : (
                <div className="winner-card">
                  <span>🏆</span>

                  <div>
                    <strong>
                      {winner.name} wins!
                    </strong>

                    <small>
                      Reached tile 100
                    </small>
                  </div>

                  <button onClick={resetGame}>
                    Play Again
                  </button>
                </div>
              )}
            </section>

            <section className="game-message">
              {message}
            </section>

            <section className="players-panel">
              <div className="panel-heading">
                <span>
                  PLAYER PROGRESS
                </span>

                <strong>
                  {players.length}
                </strong>
              </div>

              <div className="player-list">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`player-row ${
                      index === currentPlayerIndex &&
                      !winner
                        ? "active"
                        : ""
                    }`}
                  >
                    <div
                      className={`token mini-token ${player.className}`}
                    >
                      {player.shortName}
                    </div>

                    <div className="player-row-copy">
                      <strong>
                        {player.name}
                      </strong>

                      <span>
                        {player.position}/100
                      </span>
                    </div>

                    <div className="progress-track">
                      <div
                        className={`progress-bar ${player.className}`}
                        style={{
                          width: `${player.position}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="legend">
              <span>🪜 Climb</span>
              <span>🐍 Slide</span>
              <span>🏆 100</span>
            </section>
          </aside>
        </main>
      )}

      {showCustomizer && (
        <div
          className="modal-backdrop"
          onMouseDown={() =>
            setShowCustomizer(false)
          }
        >
          <section
            className="customizer"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="customizer-header">
              <div>
                <small>
                  BOARD STUDIO
                </small>

                <h2>
                  Customize
                </h2>
              </div>

              <button
                onClick={() =>
                  setShowCustomizer(false)
                }
              >
                ×
              </button>
            </div>

            <div className="customizer-tabs">
              <button
                className={
                  customizerTab === "board"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setCustomizerTab("board")
                }
              >
                🎨 Board
              </button>

              <button
                className={
                  customizerTab === "snakes"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setCustomizerTab("snakes")
                }
              >
                🐍 Snakes
              </button>

              <button
                className={
                  customizerTab === "dice"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setCustomizerTab("dice")
                }
              >
                🎲 Dice
              </button>
            </div>

            <div className="customizer-content">
              {customizerTab === "board" && (
                <>
                  <div className="preset-grid">
                    {Object.entries(
                      BOARD_PRESETS
                    ).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() =>
                          setBoardColors([
                            ...preset.colors,
                          ])
                        }
                      >
                        <div>
                          {preset.colors
                            .slice(0, 5)
                            .map((color, index) => (
                              <span
                                key={index}
                                style={{
                                  background: color,
                                }}
                              />
                            ))}
                        </div>

                        {preset.name}
                      </button>
                    ))}
                  </div>

                  <div className="color-grid">
                    {boardColors.map(
                      (color, index) => (
                        <label
                          key={index}
                          className="color-option"
                        >
                          <input
                            type="color"
                            value={color}
                            onChange={(event) =>
                              updateBoardColor(
                                index,
                                event.target.value
                              )
                            }
                          />

                          <span>
                            Color {index + 1}
                          </span>
                        </label>
                      )
                    )}
                  </div>
                </>
              )}

              {customizerTab === "snakes" && (
                <div className="snake-grid">
                  {SNAKES.map((snake, index) => (
                    <label
                      key={snake.from}
                      className="snake-option"
                    >
                      <span
                        className="snake-dot"
                        style={{
                          background:
                            snakeColors[index],
                        }}
                      >
                        🐍
                      </span>

                      <div>
                        <strong>
                          {snake.from} → {snake.to}
                        </strong>

                        <small>
                          Snake {index + 1}
                        </small>
                      </div>

                      <input
                        type="color"
                        value={snakeColors[index]}
                        onChange={(event) =>
                          updateSnakeColor(
                            index,
                            event.target.value
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
              )}

              {customizerTab === "dice" && (
                <div className="dice-customizer">
                  <div className="dice-preview">
                    <Dice3D
                      value={5}
                      diceColor={diceColor}
                      pipColor={pipColor}
                    />
                  </div>

                  <label className="dice-color-control">
                    <div>
                      <strong>
                        Dice Color
                      </strong>

                      <small>
                        Cube
                      </small>
                    </div>

                    <input
                      type="color"
                      value={diceColor}
                      onChange={(event) =>
                        setDiceColor(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label className="dice-color-control">
                    <div>
                      <strong>
                        Pip Color
                      </strong>

                      <small>
                        Dice dots
                      </small>
                    </div>

                    <input
                      type="color"
                      value={pipColor}
                      onChange={(event) =>
                        setPipColor(
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="customizer-footer">
              <button
                className="secondary-button"
                onClick={resetTheme}
              >
                Reset
              </button>

              <button
                className="primary-button"
                onClick={() =>
                  setShowCustomizer(false)
                }
              >
                Done
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
