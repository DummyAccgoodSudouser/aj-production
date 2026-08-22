// ---------- CATEGORIES ----------
const GAME_CATEGORIES = {
  built:  { name: 'Built Here',          icon: '🛠️', accent: '--amber' },
  io:     { name: 'IO Arena',            icon: '🌐', accent: '--cyan' },
  brain:  { name: 'Brain Train',         icon: '🧠', accent: '--violet' },
  word:   { name: 'Word Nerd',           icon: '🔤', accent: '--teal' },
  sim:    { name: 'Sims & Sandboxes',    icon: '🌱', accent: '--green' },
  party:  { name: 'Party & Multiplayer', icon: '🎉', accent: '--magenta' },
  portal: { name: 'Arcade Portals',      icon: '🕹️', accent: '--periwinkle' },
};

// ---------- GAMES ----------
// Everything under `built` is hosted on this site (no `external`).
// Everything else links out — curated picks of long-established, well-known
// sites. This isn't an exhaustive directory; if a link ever breaks, flag it
// and it'll get fixed or swapped.
const GAMES = [
  // ---- Built Here ----
  { cat:'built', name:'Snake',         icon:'🐍', desc:'Classic grid snake.', url:'../game/snake.html' },
  { cat:'built', name:'Tetris',        icon:'🧱', desc:'Stack falling blocks.', url:'../game/tetris.html' },
  { cat:'built', name:'Dino Jump',     icon:'🦖', desc:'Endless runner, day/night cycle.', url:'../game/dino.html' },
  { cat:'built', name:'Pac-Man',       icon:'👻', desc:'Clear the maze, dodge ghosts.', url:'../game/pacman.html' },
  { cat:'built', name:'Traffic Racer', icon:'🏎️', desc:'Accelerate, brake, steer.', url:'../game/car.html' },
  { cat:'built', name:'Dungeon Crawl', icon:'🗡️', desc:'Fight monsters, loot gems.', url:'../game/dungeon.html' },
  { cat:'built', name:'Breakout',      icon:'🧊', desc:'Smash every brick.', url:'../game/breakout.html' },
  { cat:'built', name:'2048',          icon:'🔢', desc:'Slide and merge tiles.', url:'../game/2048.html' },
  { cat:'built', name:'Memory Match',  icon:'🃏', desc:'Flip cards, find pairs.', url:'../game/memory.html' },

  // ---- IO Arena — real-time multiplayer .io games ----
  { cat:'io', name:'Slither.io',    icon:'🐛', desc:'Grow your snake, avoid the others.', url:'https://slither.io', external:true },
  { cat:'io', name:'Paper.io 2',    icon:'📐', desc:'Claim territory, don\'t get cut off.', url:'https://paper-io.com', external:true },
  { cat:'io', name:'Agar.io',       icon:'🔵', desc:'Eat cells, grow bigger, survive.', url:'https://agar.io', external:true },
  { cat:'io', name:'Krunker.io',    icon:'🔫', desc:'Fast browser-based arena shooter.', url:'https://krunker.io', external:true },
  { cat:'io', name:'Diep.io',       icon:'🔷', desc:'Upgrade your tank, battle the arena.', url:'https://diep.io', external:true },
  { cat:'io', name:'Shellshock.io', icon:'🥚', desc:'Multiplayer egg-soldier shooter.', url:'https://shellshock.io', external:true },
  { cat:'io', name:'ZombsRoyale.io',icon:'🎯', desc:'Battle royale, browser-based.', url:'https://zombsroyale.io', external:true },
  { cat:'io', name:'Wormax.io',     icon:'🪱', desc:'Snake-style multiplayer arena.', url:'https://wormax.io', external:true },
  { cat:'io', name:'Moomoo.io',     icon:'🌾', desc:'Gather, build, survive against others.', url:'https://moomoo.io', external:true },
  { cat:'io', name:'Starblast.io',  icon:'🚀', desc:'Space shooter, grow your ship.', url:'https://starblast.io', external:true },
  { cat:'io', name:'Deeeep.io',     icon:'🐬', desc:'Evolve sea creatures, survive the ocean.', url:'https://deeeep.io', external:true },
  { cat:'io', name:'Superhex.io',   icon:'⬡', desc:'Claim hexagon territory in real time.', url:'https://superhex.io', external:true },
  { cat:'io', name:'Taming.io',     icon:'🦕', desc:'Survival with tameable dinosaurs.', url:'https://taming.io', external:true },
  { cat:'io', name:'Smash Karts',   icon:'🏁', desc:'Multiplayer kart racing & combat.', url:'https://smashkarts.io', external:true },
  { cat:'io', name:'Venge.io',      icon:'🎮', desc:'Browser FPS, no download.', url:'https://venge.io', external:true },
  { cat:'io', name:'1v1.lol',       icon:'🧱', desc:'Build-and-battle shooter.', url:'https://1v1.lol', external:true },
  { cat:'io', name:'Little Big Snake', icon:'🐍', desc:'Polished snake-style multiplayer.', url:'https://littlebigsnake.com', external:true },
  { cat:'io', name:'Hole.io',       icon:'⚫', desc:'Grow a hole, swallow the city.', url:'https://hole.io', external:true },
  { cat:'io', name:'Bloxd.io',      icon:'🧊', desc:'Minecraft-style multiplayer sandbox.', url:'https://bloxd.io', external:true },

  // ---- Brain Train ----
  { cat:'brain', name:'Chess.com',        icon:'♟️', desc:'Play chess against people or bots.', url:'https://www.chess.com', external:true },
  { cat:'brain', name:'Lichess',          icon:'♞', desc:'Free, ad-free, open-source chess.', url:'https://lichess.org', external:true },
  { cat:'brain', name:'tetr.io',          icon:'🧩', desc:'Competitive multiplayer Tetris.', url:'https://tetr.io', external:true },
  { cat:'brain', name:'Sudoku.com',       icon:'🔟', desc:'Endless Sudoku puzzles.', url:'https://sudoku.com', external:true },
  { cat:'brain', name:'Monkeytype',       icon:'⌨️', desc:'Typing speed test.', url:'https://monkeytype.com', external:true },
  { cat:'brain', name:'Human Benchmark',  icon:'⏱️', desc:'Reaction time and memory tests.', url:'https://humanbenchmark.com', external:true },

  // ---- Word Nerd ----
  { cat:'word', name:'Wordle (NYT)', icon:'🟩', desc:'Guess the 5-letter word in 6 tries.', url:'https://www.nytimes.com/games/wordle/index.html', external:true },
  { cat:'word', name:'Quordle',      icon:'🟦', desc:'Four Wordles at once.', url:'https://www.quordle.com', external:true },
  { cat:'word', name:'Contexto',     icon:'🔠', desc:'Guess the word by semantic closeness.', url:'https://contexto.me', external:true },

  // ---- Sims & Sandboxes ----
  { cat:'sim', name:'Little Alchemy 2',     icon:'🧪', desc:'Combine elements to discover everything.', url:'https://littlealchemy2.com', external:true },
  { cat:'sim', name:'Cookie Clicker',       icon:'🍪', desc:'The original idle clicker.', url:'https://orteil.dashnet.org/cookieclicker/', external:true },
  { cat:'sim', name:'Universal Paperclips', icon:'📎', desc:'Idle game about an AI making paperclips.', url:'https://www.decisionproblem.com/paperclips/', external:true },
  { cat:'sim', name:'Minecraft Classic',    icon:'⛏️', desc:'Official free browser version of original Minecraft.', url:'https://classic.minecraft.net', external:true },

  // ---- Party & Multiplayer ----
  { cat:'party', name:'Skribbl.io',      icon:'✏️', desc:'Draw and guess with friends.', url:'https://skribbl.io', external:true },
  { cat:'party', name:'Gartic Phone',    icon:'📱', desc:'Telephone, but drawing.', url:'https://garticphone.com', external:true },
  { cat:'party', name:'JKLM.FUN',        icon:'🎪', desc:'Party game collection (Fibbage-style, more).', url:'https://jklm.fun', external:true },
  { cat:'party', name:'Kahoot',          icon:'❓', desc:'Live multiplayer quiz game.', url:'https://kahoot.com', external:true },
  { cat:'party', name:'Codenames Online',icon:'🕵️', desc:'Team word-guessing game, play with friends.', url:'https://codenames.game', external:true },
  { cat:'party', name:'Drawaria.online', icon:'🎨', desc:'Free-roam multiplayer drawing & guessing.', url:'https://drawaria.online', external:true },

  // ---- Arcade Portals ----
  { cat:'portal', name:'CrazyGames', icon:'🕹️', desc:'Huge library of free browser games.', url:'https://www.crazygames.com', external:true },
  { cat:'portal', name:'Poki',       icon:'🎯', desc:'Another large free-games portal.', url:'https://poki.com', external:true },
  { cat:'portal', name:'itch.io',    icon:'🎨', desc:'Indie games, many free and browser-playable.', url:'https://itch.io/games/free/platform-web', external:true },
  { cat:'portal', name:'Miniclip',   icon:'🎪', desc:'Long-running classic free-games portal.', url:'https://www.miniclip.com', external:true },
  { cat:'portal', name:'Bored.com',  icon:'🎲', desc:'Massive curated directory of games & things to do — this is what inspired our layout.', url:'https://www.bored.com', external:true },
  { cat:'portal', name:'skribbl.io', icon:'🖍️', desc:'Free multiplayer drawing & guessing game — draw the word, or guess what everyone else is drawing.', url:'https://skribbl.io', external:true },
];

